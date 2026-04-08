import mercadopago from "mercadopago";

// 🔑 CONFIGURACIÓN
mercadopago.configure({
  access_token: "APP_USR-2728717194982261-032915-732e9a841643b7a4b6636b5255120cbb-3297989181"
});

export default async function handler(req, res) {

  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { fotos, precio, titulo } = req.body;

    // Validaciones básicas
    if (!fotos || fotos.length === 0) {
      return res.status(400).json({ error: "No hay fotos seleccionadas" });
    }

    if (!precio) {
      return res.status(400).json({ error: "Falta el precio" });
    }

    // Crear preferencia de pago
    const preference = {
      items: fotos.map((f, i) => ({
        title: `${titulo || "Fotos"} - Foto ${i + 1}`,
        quantity: 1,
        unit_price: Number(precio)
      })),

      back_urls: {
        success: "https://rinascere-web.vercel.app/gracias.html",
        failure: "https://rinascere-web.vercel.app/error.html",
        pending: "https://rinascere-web.vercel.app/pendiente.html"
      },

      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);

    return res.status(200).json({
      init_point: response.body.init_point
    });

  } catch (error) {
    console.error("ERROR MERCADO PAGO:", error);
    return res.status(500).json({
      error: "Error al crear el pago"
    });
  }
}
