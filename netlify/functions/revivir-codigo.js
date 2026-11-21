const { getFirebaseAdmin, send, requireAdmin } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  try {
    await requireAdmin(event);
    const body = JSON.parse(event.body || '{}');
    const codigo = String(body.codigo || '').trim().toUpperCase();
    if (!/^[A-F0-9]{32}$/.test(codigo)) return send(400, { error: 'Código inválido' });
    const { db, admin } = getFirebaseAdmin();
    const ref = db.collection('codigosAcceso').doc(codigo);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('NOT_FOUND');
      tx.update(ref, {
        usado: false,
        reactivadoEn: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    return send(200, { ok: true });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return send(401, { error: 'Sesión no autorizada' });
    if (error.message === 'FORBIDDEN') return send(403, { error: 'No tenés permisos para reactivar códigos' });
    if (error.message === 'NOT_FOUND') return send(404, { error: 'El código no existe' });
    console.error('revivir-codigo:', error);
    return send(500, { error: 'No se pudo reactivar el código' });
  }
};