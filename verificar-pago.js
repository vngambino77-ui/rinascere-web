// ============================================================
// api/verificar-pago.js
// Vercel Function — verifica el estado del pago en Mercado Pago
// ============================================================

export default async function handler(req, res) {

  const { payment_id } = req.query;

  if (!payment_id) {
    return res.status(400).json({ error: "Falta payment_id" });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    return res.status(200).json({
      status: data.status,             // approved | pending | rejected
      status_detail: data.status_detail,
      amount: data.transaction_amount,
      external_reference: data.external_reference  // el pedidoId de Firebase
    });

  } catch (error) {
    console.error("Error verificando pago:", error);
    return res.status(500).json({ error: "Error verificando pago" });
  }
}