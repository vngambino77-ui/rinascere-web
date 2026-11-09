const { getFirebaseAdmin, send, readBody } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  const body = readBody(event);
  const codigo = String(body && body.codigo || '').trim().toUpperCase();
  const albumId = String(body && body.albumId || '').trim();
  if (!/^[A-F0-9]{32}$/.test(codigo) || !/^[A-Za-z0-9_-]{5,150}$/.test(albumId)) {
    return send(400, { error: 'Código o álbum inválido' });
  }

  try {
    const { db, admin } = getFirebaseAdmin();
    const codeRef = db.collection('codigosAcceso').doc(codigo);
    const result = await db.runTransaction(async (tx) => {
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists) throw new Error('INVALID_CODE');
      const data = codeSnap.data();
      if (data.usado || data.albumId !== albumId) throw new Error('INVALID_CODE');
      const albumRef = db.collection('albumesPrivados').doc(albumId);
      const albumSnap = await tx.get(albumRef);
      if (!albumSnap.exists) throw new Error('ALBUM_NOT_FOUND');
      const album = albumSnap.data();
      if (!album.driveLink) throw new Error('NO_DRIVE_LINK');
      tx.update(codeRef, {
        usado: true,
        usadoEn: admin.firestore.FieldValue.serverTimestamp()
      });
      return { pack: data.pack || null, driveLink: album.driveLink };
    });
    return send(200, { ok: true, ...result });
  } catch (error) {
    if (error.message === 'INVALID_CODE') return send(403, { error: 'Este enlace ya fue usado o no es válido' });
    if (error.message === 'ALBUM_NOT_FOUND' || error.message === 'NO_DRIVE_LINK') return send(404, { error: 'No se pudo encontrar el acceso al álbum' });
    console.error('canjear-codigo:', error);
    return send(500, { error: 'No se pudo validar el código de acceso' });
  }
};