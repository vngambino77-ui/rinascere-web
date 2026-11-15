const admin = require('firebase-admin');
exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: '{"error":"Método no permitido"}' };
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer /, '');
  if (!token) return { statusCode: 401, headers, body: '{"error":"No autenticada"}' };
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !process.env.FIREBASE_ADMIN_UID) return { statusCode: 503, headers, body: '{"error":"Configuración de autenticación pendiente"}' };
  try {
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
    const decoded = await admin.auth().verifyIdToken(token, true);
    if (decoded.uid !== process.env.FIREBASE_ADMIN_UID) return { statusCode: 403, headers, body: '{"error":"No autorizada"}' };
    return { statusCode: 200, headers, body: '{"ok":true}' };
  } catch (_) { return { statusCode: 403, headers, body: '{"error":"Sesión no válida"}' }; }
};
