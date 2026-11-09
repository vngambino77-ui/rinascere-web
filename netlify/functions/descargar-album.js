const { getFirebaseAdmin } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Método no permitido' };
  try {
    const albumId = String((event.queryStringParameters || {}).albumId || '').trim();
    if (!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)) return { statusCode: 400, body: 'Álbum inválido' };
    const { db } = getFirebaseAdmin();
    const ref = db.collection('albumesPrivados').doc(albumId);
    const snap = await ref.get();
    if (!snap.exists) return { statusCode: 404, body: 'Álbum no disponible' };
    const album = snap.data();
    if (!['gratis', 'gratis_o_cafecito'].includes(album.metodo)) {
      return { statusCode: 403, body: 'Este álbum requiere confirmar el pago antes de descargar' };
    }
    if (!album.driveLink) return { statusCode: 404, body: 'No hay carpeta de descarga configurada' };
    return {
      statusCode: 302,
      headers: { Location: album.driveLink, 'Cache-Control': 'no-store' },
      body: ''
    };
  } catch (error) {
    console.error('descargar-album:', error);
    return { statusCode: 500, body: 'No se pudo preparar la descarga' };
  }
};