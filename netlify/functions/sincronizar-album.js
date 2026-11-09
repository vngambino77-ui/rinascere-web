const { getFirebaseAdmin, send, readBody, requireAdmin } = require('../lib/firebase-admin');

function publicData(data) {
  const { driveLink, driveFolderId, privateTokenHash, privateAccessToken, downloadUrl, codigoAcceso, ...safe } = data;
  return safe;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  try {
    await requireAdmin(event);
    const body = readBody(event);
    if (!body) return send(400, { error: 'Solicitud inválida' });
    const albumId = String(body.albumId || '').trim();
    if (!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)) return send(400, { error: 'Álbum inválido' });
    const { db } = getFirebaseAdmin();
    const legacyRef = db.collection('albumes').doc(albumId);
    const privateRef = db.collection('albumesPrivados').doc(albumId);
    const publicRef = db.collection('albumesPublicos').doc(albumId);
    if (body.eliminar === true) {
      await Promise.all([privateRef.delete(), publicRef.delete()]);
      return send(200, { ok: true, deleted: true });
    }
    const snap = await legacyRef.get();
    if (!snap.exists) return send(404, { error: 'No se encontró el álbum de origen' });
    const data = snap.data();
    if (!data.driveLink) return send(400, { error: 'El álbum no tiene una carpeta de Drive configurada' });
    await privateRef.set({ ...data, migratedAt: new Date().toISOString() });
    if (data.esPublico === true) {
      await publicRef.set(publicData(data));
    } else {
      await publicRef.delete();
    }
    return send(200, { ok: true, public: data.esPublico === true });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return send(401, { error: 'Sesión no autorizada' });
    if (error.message === 'FORBIDDEN') return send(403, { error: 'No tenés permisos para sincronizar álbumes' });
    console.error('sincronizar-album:', error);
    return send(500, { error: 'No se pudo sincronizar el álbum' });
  }
};