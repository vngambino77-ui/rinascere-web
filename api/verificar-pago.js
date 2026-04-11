// api/verificar-pago.js
// Verifica el estado de un pago en Mercado Pago

export default async function handler(req, res) {
    // Solo permitir GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { payment_id } = req.query;

        if (!payment_id) {
            return res.status(400).json({ error: 'Falta payment_id en la query' });
        }

        // ✅ CORREGIDO: Usar nombre de variable unificado
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            return res.status(500).json({ error: 'Falta configuración de Mercado Pago' });
        }

        // Consultar el pago en Mercado Pago
        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${payment_id}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al verificar pago');
        }

        // Retornar información del pago
        return res.status(200).json({
            status: data.status,                      // approved | pending | rejected
            status_detail: data.status_detail,
            amount: data.transaction_amount,
            external_reference: data.external_reference,  // ID del álbum
            date_approved: data.date_approved
        });

    } catch (error) {
        console.error('Error al verificar pago:', error);
        return res.status(500).json({
            error: 'Error al verificar el pago',
            details: error.message
        });
    }
}
