const crypto = require('crypto');
const { getFirebaseAdmin, send, requireAdmin } = require('./_firebase');

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
    const counterRef = db.collection('contadores').doc('general');

    const result = await db.runTransaction(async (tx) => {
      const transferSnap = await tx.get(transferRef);
      if (!transferSnap.exists) throw new Error('NOT_FOUND');
      const t = transferSnap.data();
      if (t.estado !== 'pendiente') throw new Error('NOT_PENDING');
      if (!t.albumId || !Number.isFinite(Number(t.monto)) || Number(t.monto) <= 0) throw new Error('INVALID_TRANSFER');

      const counterSnap = await tx.get(counterRef);
      tx.create(codeRef, {
        albumId: t.albumId,
        pack: t.pack || null,
        usado: false,
        creadoEn: admin.firestore.FieldValue.serverTimestamp()
      });
      tx.update(transferRef, {
        estado: 'confirmada',
        codigoAcceso: code,
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
        comprador: t.comprador || ''
      };
    });

    let link = `${process.env.URL || 'https://rinascere-web.netlify.app'}/evento.html?album=${encodeURIComponent(result.albumId)}&codigo=${code}`;
    if (result.pack) link += `&pack=${encodeURIComponent(result.pack)}`;
    const message = `¡Hola ${result.comprador}! Ya confirmamos tu pago 🎉 Acá tenés el acceso a tus fotos:\n${link}`;
    return send(200, { ok: true, codigo, link, mensaje: message });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return send(401, { error: 'Sesión no autorizada' });
    if (error.message === 'FORBIDDEN') return send(403, { error: 'No tenés permisos para confirmar pagos' });
    if (error.message === 'NOT_FOUND') return send(404, { error: 'La transferencia no existe' });
    if (error.message === 'NOT_PENDING') return send(409, { error: 'La transferencia ya fue procesada o no está pendiente' });
    if (error.message === 'INVALID_TRANSFER') return send(400, { error: 'Los datos de la transferencia no son válidos' });
    console.error('confirmar-transferencia:', error);
    return send(500, { error: 'No se pudo confirmar la transferencia' });
  }
};