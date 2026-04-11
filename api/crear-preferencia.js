// api/crear-preferencia.js
// Crea una preferencia de pago en Mercado Pago

export default async function handler(req, res) {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { titulo, precio, albumId } = req.body;
        
        // Validar datos requeridos
        if (!titulo || !precio || !albumId) {
            return res.status(400).json({ 
                error: 'Faltan datos requeridos (titulo, precio, albumId)' 
            });
        }

        // Obtener token de Mercado Pago desde variables de entorno
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            console.error('Falta MERCADOPAGO_ACCESS_TOKEN en variables de entorno');
            return res.status(500).json({ 
                error: 'Configuración de Mercado Pago incompleta' 
            });
        }

        // Crear preferencia de pago
        const preference = {
            items: [{
                title: titulo,
                quantity: 1,
                unit_price: Number(precio)
            }],
            back_urls: {
                success: `https://rinascere-web.vercel.app/exito.html?album=${albumId}`,
                failure: `https://rinascere-web.vercel.app/evento.html?album=${albumId}`,
                pending: `https://rinascere-web.vercel.app/evento.html?album=${albumId}`
            },
            auto_return: 'approved',
            external_reference: albumId,
            notification_url: `https://rinascere-web.vercel.app/api/webhook-pago`
        };

        // Llamar a la API de Mercado Pago
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error de Mercado Pago:', data);
            throw new Error(data.message || 'Error al crear preferencia de pago');
        }

        // Retornar el link de pago
        res.status(200).json({ 
            init_point: data.init_point,
            id: data.id
        });

    } catch (error) {
        console.error('Error en crear-preferencia:', error);
        res.status(500).json({ 
            error: 'Error al crear preferencia de pago',
            details: error.message 
        });
    }
}
