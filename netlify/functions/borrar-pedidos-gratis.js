const admin = require('firebase-admin');

function reply(statusCode, payload) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(payload) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Método no permitido' });
  if (process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy') return reply(403, { error: 'Operación disponible solo en producción' });
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const uid = process.env.FIREBASE_ADMIN_UID;
  if (!raw || !uid) return reply(503, { error: 'Falta configurar la autorización Firebase en Netlify' });
  const bearer = event.headers?.authorization || event.headers?.Authorization || '';
  if (!bearer.startsWith('Bearer ')) return reply(403, { error: 'Iniciá sesión como administradora' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Solicitud inválida' }); }
  if (body.confirmacion !== 'BORRAR PEDIDOS GRATIS') return reply(400, { error: 'Confirmación inválida' });
  try {
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    const decoded = await admin.auth().verifyIdToken(bearer.slice(7), true);
    if (decoded.uid !== uid) return reply(403, { error: 'Cuenta no autorizada' });
    const db = admin.firestore();
    let eliminados = 0;
    while (true) {
      const snap = await db.collection('eventos').where('tipo', '==', 'registro_gratis').limit(400).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      eliminados += snap.size;
      if (snap.size < 400) break;
    }
    return reply(200, { ok: true, eliminados });
  } catch (error) {
    console.error('borrar-pedidos-gratis:', error.code || error.message);
    return reply(500, { error: 'No se pudo completar el borrado; comprobá los permisos y el estado de los pedidos' });
  }
};
