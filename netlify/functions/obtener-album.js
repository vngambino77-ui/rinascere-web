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
      const privateSnap = await db.collection('albumesPrivados').doc(albumId).get();
      if (!privateSnap.exists) return send(404, { error: 'El álbum no existe o no está disponible' });
      data = privateSnap.data();
    }

    let isAdmin = false;
    const header = event.headers && (event.headers.authorization || event.headers.Authorization);
    if (header && header.startsWith('Bearer ')) {
      try {
        const { auth } = getFirebaseAdmin();
        const decoded = await auth.verifyIdToken(header.slice(7));
        isAdmin = decoded.uid === (process.env.FIREBASE_ADMIN_UID || 'wuvIwxJyUcYvtgxRDZkYw7qo97v2');
      } catch (_) { isAdmin = false; }
    }

    const { driveLink, driveFolderId, privateTokenHash, ...safeAlbum } = data;
    return send(200, { ok: true, album: { id: albumId, ...safeAlbum, ...(isAdmin ? { driveLink } : {}) } });
  } catch (error) {
    console.error('obtener-album:', error);
    return send(500, { error: 'No se pudo cargar el álbum' });
  }
};