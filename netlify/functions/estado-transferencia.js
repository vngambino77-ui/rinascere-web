const { getFirebaseAdmin, send } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return send(405, { error: 'Método no permitido' });
  const id = String((event.queryStringParameters || {}).pedido || '').trim();
  // Los IDs de Firestore son aleatorios; solo se expone el estado, nunca datos del comprador.
  if (!/^[A-Za-z0-9]{16,40}$/.test(id)) return send(400, { error: 'Número de pedido inválido' });
  try {
    const { db } = getFirebaseAdmin();
    const snap = await db.collection('transferencias').doc(id).get();
    if (!snap.exists) return send(404, { error: 'Pedido no encontrado' });
    const estado = String(snap.data().estado || 'pendiente');
    return send(200, { ok: true, estado: ['pendiente', 'confirmada', 'rechazado'].includes(estado) ? estado : 'pendiente' }, { 'Cache-Control': 'no-store' });
  } catch (error) {
    console.error('estado-transferencia:', error);
    return send(500, { error: 'No se pudo consultar el estado' });
  }
};
