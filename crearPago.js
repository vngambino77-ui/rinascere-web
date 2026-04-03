import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: "TU_ACCESS_TOKEN_REAL"
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {

    const { items } = req.body;

    const preference = await mercadopago.preferences.create({
      items,
      back_urls: {
        success: "https://rinascere-web.vercel.app/evento.html",
        failure: "https://rinascere-web.vercel.app/evento.html",
        pending: "https://rinascere-web.vercel.app/evento.html"
      },
      auto_return: "approved"
    });

    res.status(200).json({
      id: preference.body.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}