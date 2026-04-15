exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        const { titulo, precio, albumId } = JSON.parse(event.body);

        if (!titulo || !precio) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Faltan datos requeridos' })
            };
        }

        const MERCADOPAGO_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!MERCADOPAGO_TOKEN) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Token no configurado' })
            };
        }

        // Detectar URL base
        const siteUrl = process.env.URL || 'https://rinascere-web-nwt9.vercel.app';

        const preference = {
            items: [{
                title: titulo,
                quantity: 1,
                unit_price: Number(precio),
                currency_id: 'ARS'
            }],
            back_urls: {
                success: `${siteUrl}/exito.html?album=${albumId}`,
                failure: `${siteUrl}/evento.html?album=${albumId}`,
                pending: `${siteUrl}/evento.html?album=${albumId}`
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
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ init_point: data.init_point })
            };
        } else {
            console.error('Error MP:', data);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Error al crear preferencia', details: data })
            };
        }

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
