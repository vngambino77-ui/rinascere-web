import mercadopago from "mercadopago";

mercadopago.configure({
  access_token:APP_USR-2728717194982261-032915-732e9a841643b7a4b6636b5255120cbb-3297989181
});

export default async function handler(req, res){

  const { fotos, precio, titulo } = req.body;

  const preference = {
    items: fotos.map((f,i)=>({
      title: `${titulo} Foto ${i+1}`,
      quantity: 1,
      unit_price: precio
    }))
  };

  const response = await mercadopago.preferences.create(preference);

  res.json({
    init_point: response.body.init_point
  });
}