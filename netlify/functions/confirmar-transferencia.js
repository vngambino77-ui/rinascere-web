const crypto = require('crypto');
const { getFirebaseAdmin, send, requireAdmin } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  try {
    await requireAdmin(event);
    const body = JSON.parse(event.body || '{}');
    const id = String(body.id || '').trim();
    if (!/^[A-Za-z0-9_-]{10,150}$/.test(id)) return send(400, { error: 'Identificador de transferencia inválido' });

    const { db, admin } = getFirebaseAdmin();
    const transferRef = db.collection('transferencias').doc(id);
    const code = crypto.randomBytes(16).toString('hex').toUpperCase();
    const codeRef = db.collection('codigosAcceso').doc(code);
    const eventRef = db.collection('eventos').doc();
    const fotoToken = crypto.randomBytes(32).toString('hex');
    const fotoTokenRef = db.collection('descargasFotos').doc(crypto.createHash('sha256').update(fotoToken).digest('hex'));
    const counterRef = db.collection('contadores').doc('general');

    const result = await db.runTransaction(async (tx) => {
      const transferSnap = await tx.get(transferRef);
      if (!transferSnap.exists) throw new Error('NOT_FOUND');
      const t = transferSnap.data();
      if (t.estado !== 'pendiente') throw new Error('NOT_PENDING');
      // Un carrito de fotos individuales nunca puede generar acceso al álbum completo.
      // Requiere primero un mecanismo de entrega limitada a las fotos adquiridas.
      if (t.tipo === 'carrito_fotos') {
        if(!Array.isArray(t.fotosDriveIds)||!t.fotosDriveIds.length||t.fotosDriveIds.length>500)throw new Error('PHOTO_DELIVERY_PENDING');
        const albumRef=db.collection('albumesPrivados').doc(t.albumId);
        const albumSnap=await tx.get(albumRef);
        const album=albumSnap.exists?albumSnap.data():null;
        if(!album||album.entregaIndividualActiva!==true||!album.driveFolderId||!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON)throw new Error('PHOTO_DELIVERY_PENDING');

      }
      // Un pack por cantidad no autoriza acceso indiscriminado a toda la carpeta.
      // Mantener pendiente hasta que exista entrega limitada a sus fotos.
      if (t.pack && t.tipo !== 'carrito_fotos') {
        const albumSnap = await tx.get(db.collection('albumes').doc(t.albumId));
        const album = albumSnap.exists ? albumSnap.data() : null;
        if (album && album.metodo === 'pack_fotos') throw new Error('PACK_DELIVERY_PENDING');
      }
      if (!t.albumId || !Number.isFinite(Number(t.monto)) || Number(t.monto) <= 0) throw new Error('INVALID_TRANSFER');

      const counterSnap = await tx.get(counterRef);
      if(t.tipo==='carrito_fotos')tx.create(fotoTokenRef,{albumId:t.albumId,fotosDriveIds:t.fotosDriveIds,transferenciaId:id,vence:admin.firestore.Timestamp.fromMillis(Date.now()+24*60*60*1000)});
      if(t.tipo!=='carrito_fotos')tx.create(codeRef, {
        albumId: t.albumId,
        pack: t.pack || null,
        usado: false,
        creadoEn: admin.firestore.FieldValue.serverTimestamp()
      });
      tx.update(transferRef, {
        estado: 'confirmada',
        ...(t.tipo==='carrito_fotos'?{}:{codigoAcceso:code}),
        confirmadoEn: admin.firestore.FieldValue.serverTimestamp()
      });
      tx.create(eventRef, {
        tipo: 'compra',
        albumId: t.albumId,
        albumNombre: t.albumNombre || '',
        pack: t.pack || null,
        monto: Number(t.monto),
        comprador: t.comprador || '',
        contacto: t.contacto || '',
        metodo: 'transferencia',
        fecha: admin.firestore.FieldValue.serverTimestamp()
      });
      const old = counterSnap.exists ? counterSnap.data() : {};
      tx.set(counterRef, {
        compras: (Number(old.compras) || 0) + 1,
        ingresos: (Number(old.ingresos) || 0) + Number(t.monto),
        actualizado: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return {
        albumId: t.albumId,
        pack: t.pack || null,
        carrito: t.tipo==='carrito_fotos',
        cantidadFotos: t.cantidadFotos || 0,
        comprador: t.comprador || '',
        contacto: t.contacto || ''
      };
    });

    const baseUrl = process.env.DEPLOY_PRIME_URL || process.env.URL || 'https://rinascere-web.netlify.app';
    let link = result.carrito ? `${baseUrl}/mis-fotos.html?token=${fotoToken}&cantidad=${result.cantidadFotos}` : `${baseUrl}/evento.html?album=${encodeURIComponent(result.albumId)}&codigo=${code}`;
    if (result.pack) link += `&pack=${encodeURIComponent(result.pack)}`;
    const message = `¡Hola ${result.comprador}! Ya confirmamos tu pago 🎉 Acá tenés el acceso a tus fotos:\n${link}`;
    return send(200, { ok: true, ...(result.carrito?{}:{codigo:code}), link, mensaje: message, contacto: result.contacto });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return send(401, { error: 'Sesión no autorizada' });
    if (error.message === 'FORBIDDEN') return send(403, { error: 'No tenés permisos para confirmar pagos' });
    if (error.message === 'NOT_FOUND') return send(404, { error: 'La transferencia no existe' });
    if (error.message === 'PACK_DELIVERY_PENDING') return send(409, { error: 'El pack por cantidad no puede habilitar acceso a todas las fotos. Pedido pendiente: configurá entrega segura antes de confirmarlo.' });
    if (error.message === 'PHOTO_DELIVERY_PENDING') return send(409, { error: 'La entrega de fotografías individuales aún no está configurada. No se confirmó el pedido ni se habilitó ninguna descarga.' });
    if (error.message === 'NOT_PENDING') return send(409, { error: 'La transferencia ya fue procesada o no está pendiente' });
    if (error.message === 'INVALID_TRANSFER') return send(400, { error: 'Los datos de la transferencia no son válidos' });
    console.error('confirmar-transferencia:', error);
    return send(500, { error: 'No se pudo confirmar la transferencia' });
  }
};