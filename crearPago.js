// ✅ api/crear-preferencia.js
// Ubicación correcta: /api/crear-preferencia.js en la raíz del proyecto Vercel

import { MercadoPagoConfig, Preference } from "mercadopago";

// 🔐 Token desde variable de entorno (NUNCA hardcodeado)
// En Vercel: Settings → Environment Variables → MP_ACCESS_TOKEN
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preference = new Preference(client);

export default async function handler(req, res) {

  // Solo aceptar POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { fotos, precio, titulo, pedidoId, successUrl, failUrl } = req.body;

  // Validaciones
  if (!fotos || !Array.isArray(fotos) || fotos.length === 0) {
    return res.status(400).json({ error: "Faltan fotos" });
  }
  if (!precio || isNaN(precio) || Number(precio) <= 0) {
    return res.status(400).json({ error: "Precio inválido" });
  }
  if (!pedidoId) {
    return res.status(400).json({ error: "Falta pedidoId" });
  }

  try {
    const body = {
      items: fotos.map((f, i) => ({
        id: `foto_${i + 1}`,
        title: `${titulo || "Foto"} ${i + 1}`,
        quantity: 1,
        unit_price: Number(precio),        // ✅ Debe ser número, no string
        currency_id: "ARS"                 // ✅ Moneda explícita
      })),

      // ✅ URLs de retorno correctas
      back_urls: {
        success: successUrl,
        failure: failUrl,
        pending: failUrl
      },
      auto_return: "approved",             // ✅ Redirige automáticamente al pagar

      // ✅ external_reference para identificar el pedido al volver
      external_reference: pedidoId,

      // ✅ Expiración de 30 minutos para no dejar preferencias colgadas
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    const response = await preference.create({ body });

    return res.status(200).json({
      init_point: response.init_point,       // ✅ Producción
      sandbox_init_point: response.sandbox_init_point  // para pruebas
    });

  } catch (error) {
    console.error("❌ Error Mercado Pago:", error);
    return res.status(500).json({
      error: "Error al crear preferencia",
      detalle: error.message
    });
  }
}