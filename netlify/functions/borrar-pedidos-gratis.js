const { getFirebaseAdmin, send, readBody, requireAdmin } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  try {
    await requireAdmin(event);
  } catch (error) {
    return send(403, { error: 'Solo la administradora autorizada puede borrar pedidos gratis' });
  }
  // Nunca ejecutar un borrado irreversible desde una vista previa de Vercel.
  if (process.env.VERCEL_ENV === 'preview') {
    return send(403, { error: 'El borrado definitivo está deshabilitado en entornos de prueba' });
  }
  const body = readBody(event);
  if (!body || body.confirmacion !== 'BORRAR PEDIDOS GRATIS') {
    return send(400, { error: 'Confirmación de seguridad inválida' });
  }
  try {
    const { db } = getFirebaseAdmin();
    let eliminados = 0;
    // Firestore limita cada lote a 500 operaciones; paginamos únicamente registros gratis.
    while (true) {
      const snap = await db.collection('eventos').where('tipo', '==', 'registro_gratis').limit(400).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      eliminados += snap.size;
      if (snap.size < 400) break;
    }
    return send(200, { ok: true, eliminados });
  } catch (error) {
    console.error('borrar-pedidos-gratis:', error);
    return send(500, { error: 'El borrado no se completó. Revisá la tabla antes de reintentar.' });
  }
};
