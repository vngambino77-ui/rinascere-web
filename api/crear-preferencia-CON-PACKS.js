// netlify/functions/crear-preferencia.js
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        const { titulo, precio, albumId, metodoPago, nombrePack } = JSON.parse(event.body);
        
        if (!titulo || !albumId || !metodoPago) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: 'Faltan datos: titulo, albumId, metodoPago' 
                })
            };
        }

        // Token de Mercado Pago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
        }

        // Determinar precio según método
        let precioFinal;
        if (metodoPago === 'cafecito') {
            precioFinal = precio || 100;
        } else if (metodoPago === 'precio_fijo' || metodoPago === 'pack_fotos') {
            precioFinal = precio;
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Método de pago inválido' })
            };
        }

        // Construir URL de éxito con pack si existe
        let successUrl = `${process.env.URL}/exito.html?album=${albumId}`;
        if (nombrePack) {
            successUrl += `&pack=${encodeURIComponent(nombrePack)}`;
        }

        const preference = {
            items: [{
                title: titulo,
                quantity: 1,
                unit_price: Number(precioFinal)
            }],
            back_urls: {
                success: successUrl,
                failure: `${process.env.URL}/evento.html?album=${albumId}`,
                pending: `${process.env.URL}/evento.html?album=${albumId}`
            },
            auto_return: 'approved',
            external_reference: albumId
        };

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
            console.error('Error Mercado Pago:', data);
            throw new Error(data.message || 'Error al crear preferencia');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                init_point: data.init_point,
                id: data.id
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Error al crear preferencia',
                details: error.message 
            })
        };
    }
};
