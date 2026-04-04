import { MercadoPagoConfig, Payment } from "mercadopago";

// 🔐 Inicializar cliente
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const payment = new Payment(client);

export default async function handler(req, res) {

  const { payment_id } = req.query;

  if (!payment_id) {
    return res.status(400).json({ error: "Falta payment_id" });
  }

  try {

    const response = await payment.get({ id: payment_id });

    return res.status(200).json({
      status: response.status,          // approved | pending | rejected
      status_detail: response.status_detail,
      amount: response.transaction_amount
    });

  } catch (error) {
    console.error("❌ Error MP:", error);

    return res.status(500).json({
      error: "Error verificando pago"
    });
  }
}