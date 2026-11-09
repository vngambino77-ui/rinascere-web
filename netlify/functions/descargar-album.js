const { getFirebaseAdmin } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Método no permitido' };
  try {
    const params = event.queryStringParameters || {};
    const token = String(params.token || '').trim().toUpperCase();
    const albumId = String(params.albumId || '').trim();
    const { db, admin } = getFirebaseAdmin();
    let driveLink;

    if (token) {
      if (!/^[A-F0-9]{48}$/.test(token)) return { statusCode: 400, body: 'Enlace de descarga inválido' };
      const tokenRef = db.collection('descargasAutorizadas').doc(token);
      const result = await db.runTransaction(async (tx) => {
        const tokenSnap = await tx.get(tokenRef);
        if (!tokenSnap.exists) throw new Error('INVALID_DOWNLOAD');
        const data = tokenSnap.data();
        if (data.usado || !data.vence || data.vence.toMillis() < Date.now()) throw new Error('INVALID_DOWNLOAD');
        const albumRef = db.collection('albumesPrivados').doc(data.albumId);
        const albumSnap = await tx.get(albumRef);
        if (!albumSnap.exists || !albumSnap.data().driveLink) throw new Error('NO_ALBUM');
        tx.update(tokenRef, { usado: true, usadoEn: admin.firestore.FieldValue.serverTimestamp() });
        return albumSnap.data().driveLink;
      });
      driveLink = result;
    } else {
      if (!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)) return { statusCode: 400, body: 'Álbum inválido' };
      const snap = await db.collection('albumesPrivados').doc(albumId).get();
      if (!snap.exists) return { statusCode: 404, body: 'Álbum no disponible' };
      const album = snap.data();
      if (!['gratis', 'gratis_o_cafecito'].includes(album.metodo)) {
        return { statusCode: 403, body: 'Este álbum requiere confirmar el pago antes de descargar' };
      }
      driveLink = album.driveLink;
    }

    if (!driveLink) return { statusCode: 404, body: 'No hay carpeta de descarga configurada' };
    return {
      statusCode: 302,
      headers: { Location: driveLink, 'Cache-Control': 'no-store' },
      body: ''
    };
  } catch (error) {
    if (error.message === 'INVALID_DOWNLOAD') return { statusCode: 403, body: 'El enlace de descarga ya fue utilizado o venció' };
    if (error.message === 'NO_ALBUM') return { statusCode: 404, body: 'Álbum no disponible' };
    console.error('descargar-album:', error);
    return { statusCode: 500, body: 'No se pudo preparar la descarga' };
  }
};