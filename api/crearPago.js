import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: APP_USR-2728717194982261-032915-732e9a841643b7a4b6636b5255120cbb-3297989181
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { fotos, precio, titulo } = req.body;

    // Validación
    if (!fotos || fotos.length === 0) {
      return res.status(400).json({ error: "No hay fotos seleccionadas" });
    }

    const preference = {
      items: fotos.map((f, i) => ({
        title: `${titulo} - Foto ${i + 1}`,
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

    res.status(200).json({
      init_point: response.body.init_point
    });

  } catch (error) {
    console.error("ERROR MP:", error);
    res.status(500).json({ error: "Error creando el pago" });
  }
}
