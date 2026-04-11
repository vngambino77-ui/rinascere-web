// api/crear-preferencia.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { titulo, precio, albumId, metodoPago } = req.body;
        
        if (!titulo || !albumId || !metodoPago) {
            return res.status(400).json({ 
                error: 'Faltan datos: titulo, albumId, metodoPago' 
            });
        }

        // Token de Mercado Pago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 
            'APP_USR-2728717194982261-032915-732e9a841643b7a4b6636b5255120cbb-3297989181';

        // Determinar precio según método
        let precioFinal;
        if (metodoPago === 'cafecito') {
            precioFinal = precio || 100; // Mínimo $100 si el cliente no pone nada
        } else if (metodoPago === 'precio_fijo') {
            precioFinal = precio || 3000; // Precio que vos ponés
        } else {
            return res.status(400).json({ error: 'Método de pago inválido' });
        }

        const preference = {
            items: [{
                title: titulo,
                quantity: 1,
                unit_price: Number(precioFinal)
            }],
            back_urls: {
                success: `https://vngambino77-ui-rinascere-web.vercel.app/exito.html?album=${albumId}`,
                failure: `https://vngambino77-ui-rinascere-web.vercel.app/evento.html?album=${albumId}`,
                pending: `https://vngambino77-ui-rinascere-web.vercel.app/evento.html?album=${albumId}`
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

        res.status(200).json({ 
            init_point: data.init_point,
            id: data.id
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Error al crear preferencia',
            details: error.message 
        });
    }
}
