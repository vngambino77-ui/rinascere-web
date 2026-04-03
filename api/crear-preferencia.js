// ============================================================
// api/crear-preferencia.js
// Vercel Function — crea la preferencia de pago en Mercado Pago
// Este archivo va en una carpeta llamada "api" dentro de tu
// proyecto rinascere-web en GitHub
// ============================================================

export default async function handler(req, res) {

  // Solo acepta POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { fotos, precio, titulo, pedidoId, successUrl, failUrl } = req.body;

  if (!fotos || !precio || !pedidoId) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    // Crear preferencia de pago en Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Token de producción — cuando estés lista para cobrar de verdad
        // reemplazá por el token productivo desde el panel de MP
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: fotos.map((fotoId, i) => ({
          title: `${titulo} — Foto ${i + 1}`,
          quantity: 1,
          unit_price: Number(precio),
          currency_id: "ARS"
        })),
        external_reference: pedidoId,
        back_urls: {
          success: successUrl,
          failure: failUrl,
          pending: failUrl
        },
        auto_return: "approved",
        // Webhook para notificación automática (opcional por ahora)
        // notification_url: "https://rinascere-web.vercel.app/api/webhook"
      })
    });

    const data = await response.json();

    if (!data.init_point) {
      console.error("Error MP:", data);
      return res.status(500).json({ error: "No se pudo crear la preferencia" });
    }

    return res.status(200).json({ init_point: data.init_point });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
