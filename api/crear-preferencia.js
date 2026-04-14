const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { titulo, precio, albumId, metodoPago } = req.body;

    if (!titulo || !precio) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    const MERCADOPAGO_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!MERCADOPAGO_TOKEN) {
        return res.status(500).json({ error: 'Token no configurado' });
    }

    try {
        const preference = {
            items: [{
                title: titulo,
                quantity: 1,
                unit_price: Number(precio),
                currency_id: 'ARS'
            }],
            back_urls: {
                success: `https://rinascere-web-nwt9.vercel.app/exito.html?album=${albumId}`,
                failure: `https://rinascere-web-nwt9.vercel.app/evento.html?album=${albumId}`,
                pending: `https://rinascere-web-nwt9.vercel.app/evento.html?album=${albumId}`
            },
            auto_return: 'approved',
            external_reference: albumId
        };

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MERCADOPAGO_TOKEN}`
            },
            body: JSON.stringify(preference)
        });

        const data = await response.json();

        if (data.init_point) {
            return res.status(200).json({ init_point: data.init_point });
        } else {
            console.error('Error MP:', data);
            return res.status(500).json({ error: 'Error al crear preferencia' });
        }

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
