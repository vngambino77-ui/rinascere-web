const { getFirebaseAdmin, send, readBody } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  try {
    const params = event.httpMethod === 'GET' ? (event.queryStringParameters || {}) : (readBody(event) || {});
    const albumId = String(params.albumId || params.album || '').trim();
    if (!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)) return send(400, { error: 'Álbum inválido' });
    const { db } = getFirebaseAdmin();
    const publicSnap = await db.collection('albumesPublicos').doc(albumId).get();
    let data;
    if (publicSnap.exists) {
      data = publicSnap.data();
    } else {
      let privateSnap = await db.collection('albumesPrivados').doc(albumId).get();
      if (!privateSnap.exists) privateSnap = await db.collection('albumes').doc(albumId).get();
      if (!privateSnap.exists) return send(404, { error: 'El álbum no existe o no está disponible' });
      data = privateSnap.data();
    }

    const { driveLink, driveFolderId, privateTokenHash, privateAccessToken, downloadUrl, codigoAcceso, ...safeAlbum } = data;
    return send(200, { ok: true, album: { id: albumId, ...safeAlbum } });
  } catch (error) {
    console.error('obtener-album:', error);
    return send(500, { error: 'No se pudo cargar el álbum' });
  }
};