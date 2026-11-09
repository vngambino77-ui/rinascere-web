const { getFirebaseAdmin, send, readBody } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  const body = readBody(event);
  if (!body) return send(400, { error: 'Solicitud inválida' });

  const albumId = String(body.albumId || '').trim();
  const comprador = String(body.comprador || '').trim().slice(0, 120);
  const contacto = String(body.contacto || '').trim().slice(0, 160);
  const packNombre = body.pack == null ? null : String(body.pack).trim().slice(0, 100);
  const limpiarTexto = (value, max) => String(value || '').replace(/[<>]/g, '').replace(/[\x00-\x1F]/g, '').trim().slice(0, max);
  const compradorSeguro = limpiarTexto(comprador, 120);
  const contactoSeguro = limpiarTexto(contacto, 160);
  if (!albumId || !/^[A-Za-z0-9_-]{5,150}$/.test(albumId) || !compradorSeguro) {
    return send(400, { error: 'Faltan datos válidos del comprador o del álbum' });
  }

  try {
    const { db, admin } = getFirebaseAdmin();
    const ip = String(event.headers && (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']) || 'unknown').split(',')[0].trim();
    const rateKey = require('crypto').createHash('sha256').update(ip).digest('hex');
    const rateRef = db.collection('limitesTransferencias').doc(rateKey);
    const now = Date.now();
    const allowed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(rateRef);
      const current = snap.exists ? snap.data() : {};
      const start = current.inicio && current.inicio.toMillis ? current.inicio.toMillis() : 0;
      const count = start > now - 60 * 60 * 1000 ? Number(current.cantidad) || 0 : 0;
      if (count >= 15) return false;
      tx.set(rateRef, {
        inicio: count ? current.inicio : admin.firestore.Timestamp.fromMillis(now),
        cantidad: count + 1
      });
      return true;
    });
    if (!allowed) return send(429, { error: 'Se alcanzó el límite temporal de solicitudes. Intentá más tarde.' });

    const albumSnap = await db.collection('albumes').doc(albumId).get();
    if (!albumSnap.exists) return send(404, { error: 'El álbum no existe' });
    const album = albumSnap.data();
    let monto = 0;

    if (album.metodo === 'pack_fotos') {
      const pack = Array.isArray(album.packs) && album.packs.find(p => p.nombre === packNombre);
      if (!pack || !Number.isFinite(Number(pack.precio)) || Number(pack.precio) <= 0) {
        return send(400, { error: 'El pack seleccionado no es válido' });
      }
      monto = Number(pack.precio);
    } else if (album.metodo === 'precio_fijo') {
      monto = Number(album.precio);
      if (!Number.isFinite(monto) || monto <= 0) return send(400, { error: 'El precio del álbum no está configurado correctamente' });
      if (body.monto != null && Number(body.monto) !== monto) return send(400, { error: 'El importe no coincide con el precio publicado' });
    } else if (album.metodo === 'cafecito' || album.metodo === 'gratis_o_cafecito') {
      const minimo = Math.max(1, Number(album.precio) || 1);
      monto = Number(body.monto);
      if (!Number.isFinite(monto) || monto < minimo || monto > 10000000) {
        return send(400, { error: 'El aporte debe ser igual o superior al mínimo indicado' });
      }
    } else {
      return send(400, { error: 'Este álbum no admite solicitudes de transferencia' });
    }

    const ref = await db.collection('transferencias').add({
      albumId,
      albumNombre: String(album.nombre || '').slice(0, 180),
      pack: packNombre,
      monto,
      comprador: compradorSeguro,
      contacto: contactoSeguro,
      estado: 'pendiente',
      metodo: 'transferencia',
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    return send(201, { ok: true, transferenciaId: ref.id, monto, alias: 'verogam.fotos.mp' });
  } catch (error) {
    console.error('crear-transferencia:', error);
    return send(500, { error: 'No se pudo registrar la solicitud de transferencia' });
  }
};