import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

export default async function handler(req, res) {

  const { payment_id } = req.query;

  if (!payment_id) {
    return res.status(400).json({ error: "Falta payment_id" });
  }

  try {

    const pago = await mercadopago.payment.findById(payment_id);

    const estado = pago.body.status;

    return res.status(200).json({
      status: estado
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error verificando pago"
    });
  }
}