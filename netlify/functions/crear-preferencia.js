// netlify/functions/crear-preferencia.js
// Función que crea una preferencia de pago en Mercado Pago
// Soporta: precio fijo, cafecito (donación), y packs de fotos

exports.handler = async function(event, context) {
    // CORS headers - permiten que el sitio web llame a esta función
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Responder OK al pedido preflight de CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        // Leer los datos que mandó el sitio
        const { titulo, precio, albumId, metodoPago, nombrePack } = JSON.parse(event.body);

        // Validar que lleguen los datos mínimos
        if (!titulo || !albumId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Faltan datos: titulo o albumId' })
            };
        }

        // Leer el token desde variable de entorno (NUNCA hardcodear aquí)
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado en Netlify' })
            };
        }

        // Determinar el precio según el método de pago
        let precioFinal;
        if (metodoPago === 'cafecito') {
            precioFinal = Number(precio) || 100;
        } else if (metodoPago === 'precio_fijo' || metodoPago === 'pack_fotos') {
            precioFinal = Number(precio);
        } else {
            // Si no viene metodoPago, usar el precio tal cual (compatibilidad)
            precioFinal = Number(precio);
        }

        if (!precioFinal || precioFinal <= 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Precio inválido' })
            };
        }

        // Detectar URL del sitio (Netlify la provee automáticamente)
        const siteUrl = process.env.URL || 'https://rinascere-web.netlify.app';

        // Construir URL de éxito, sumando el pack si hay
        let successUrl = `${siteUrl}/exito.html?album=${albumId}`;
        if (nombrePack) {
            successUrl += `&pack=${encodeURIComponent(nombrePack)}`;
        }

        // Armar la preferencia para Mercado Pago
        const preference = {
            items: [{
                title: titulo,
                quantity: 1,
                unit_price: precioFinal,
                currency_id: 'ARS'
            }],
            back_urls: {
                success: successUrl,
                failure: `${siteUrl}/evento.html?album=${albumId}`,
                pending: `${siteUrl}/evento.html?album=${albumId}`
            },
            auto_return: 'approved',
            external_reference: albumId
        };

        // Llamar a Mercado Pago para crear la preferencia
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(preference)
        });

        const data = await response.json();

        // Si MP devolvió el init_point, todo salió bien
        if (data.init_point) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    init_point: data.init_point,
                    id: data.id
                })
            };
        }

        // Si no hay init_point, hubo error en MP
        console.error('Error Mercado Pago:', data);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error al crear preferencia en Mercado Pago',
                details: data
            })
        };

    } catch (error) {
        console.error('Error en función crear-preferencia:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
