const admin = require('firebase-admin');

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no está configurada en Netlify');
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch (_) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no contiene JSON válido');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
  }
  return { admin, db: admin.firestore(), auth: admin.auth() };
}

function send(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(payload)
  };
}

function readBody(event) {
  try { return JSON.parse(event.body || '{}'); }
  catch (_) { return null; }
}

async function requireAdmin(event) {
  const header = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!header || !header.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const { auth } = getFirebaseAdmin();
  const decoded = await auth.verifyIdToken(header.slice(7));
  const allowedUid = process.env.FIREBASE_ADMIN_UID || 'wuvIwxJyUcYvtgxRDZkYw7qo97v2';
  if (decoded.uid !== allowedUid) throw new Error('FORBIDDEN');
  return decoded;
}

module.exports = { getFirebaseAdmin, send, readBody, requireAdmin };