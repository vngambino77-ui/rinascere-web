const { getFirebaseAdmin, requireAdmin, send } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  try {
    // La sesión del panel se valida con el ID token de Firebase en el servidor.
    await requireAdmin(event);
    const { db } = getFirebaseAdmin();
    let eliminados = 0;
    // El filtro es estricto: no se tocan compras, transferencias ni álbumes.
    while (true) {
      const snapshot = await db.collection('eventos')
        .where('tipo', '==', 'registro_gratis').limit(400).get();
      if (snapshot.empty) break;
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      eliminados += snapshot.size;
    }
    return send(200, { ok: true, eliminados });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return send(401, { error: 'Iniciá sesión como administradora' });
    if (error.message === 'FORBIDDEN') return send(403, { error: 'Acceso reservado a la administradora' });
    console.error('reiniciar-pedidos-gratis:', error);
    return send(500, { error: 'No se pudieron eliminar los pedidos gratis' });
  }
};
