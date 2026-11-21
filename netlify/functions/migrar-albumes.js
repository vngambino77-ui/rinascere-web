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
    const cursor = body.cursor ? String(body.cursor) : null;
    const { db, admin } = getFirebaseAdmin();
    let query = db.collection('albumes').orderBy(admin.firestore.FieldPath.documentId()).limit(180);
    if (cursor) {
      const cursorSnap = await db.collection('albumes').doc(cursor).get();
      if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }
    const snapshot = await query.get();
    if (snapshot.empty) return send(200, { ok: true, migrated: 0, public: 0, private: 0, nextCursor: null, done: true });

    const batch = db.batch();
    let publicCount = 0, privateCount = 0, withoutDrive = 0, migrated = 0;
    for (const item of snapshot.docs) {
      const data = item.data();
      if (!data.driveLink) {
        console.warn('Álbum migrado sin carpeta Drive:', item.id);
        withoutDrive++;
      }
      batch.set(db.collection('albumesPrivados').doc(item.id), { ...data, migratedAt: new Date().toISOString() });
      migrated++;
      if (data.esPublico === true) {
        batch.set(db.collection('albumesPublicos').doc(item.id), publicData(data));
        publicCount++;
      } else {
        batch.delete(db.collection('albumesPublicos').doc(item.id));
        privateCount++;
      }
    }
    await batch.commit();
    const last = snapshot.docs[snapshot.docs.length - 1].id;
    return send(200, {
      ok: true,
      migrated,
      withoutDrive,
      public: publicCount,
      private: privateCount,
      nextCursor: snapshot.size === 180 ? last : null,
      done: snapshot.size < 180
    });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return send(401, { error: 'Sesión no autorizada' });
    if (error.message === 'FORBIDDEN') return send(403, { error: 'No tenés permisos para migrar álbumes' });
    console.error('migrar-albumes:', error);
    return send(500, { error: 'No se pudo migrar la colección de álbumes' });
  }
};