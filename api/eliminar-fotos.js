// api/eliminar-fotos.js
// Elimina fotos de Cloudinary

import crypto from 'crypto';

export default async function handler(req, res) {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { public_ids } = req.body;

        // Validar que public_ids sea un array
        if (!public_ids || !Array.isArray(public_ids)) {
            return res.status(400).json({ 
                error: 'public_ids debe ser un array de IDs de Cloudinary' 
            });
        }

        // Variables de entorno de Cloudinary
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        // Validar que existan las credenciales
        if (!cloudName || !apiKey || !apiSecret) {
            console.error('Faltan variables de entorno de Cloudinary');
            return res.status(500).json({ 
                error: 'Configuración de Cloudinary incompleta' 
            });
        }

        const resultados = [];

        // Eliminar cada foto
        for (const public_id of public_ids) {
            try {
                const timestamp = Math.floor(Date.now() / 1000);
                
                // Generar firma SHA-256
                const signatureString = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
                const signature = crypto
                    .createHash('sha256')
                    .update(signatureString)
                    .digest('hex');

                // Llamar a la API de Cloudinary
                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            public_id,
                            timestamp,
                            api_key: apiKey,
                            signature
                        })
                    }
                );

                const result = await response.json();
                
                resultados.push({ 
                    public_id, 
                    success: result.result === 'ok',
                    result 
                });

            } catch (error) {
                console.error(`Error eliminando ${public_id}:`, error);
                resultados.push({ 
                    public_id, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        // Verificar si todas se eliminaron correctamente
        const todasEliminadas = resultados.every(r => r.success);

        res.status(200).json({ 
            success: todasEliminadas,
            resultados,
            mensaje: todasEliminadas 
                ? 'Todas las fotos fueron eliminadas correctamente'
                : 'Algunas fotos no pudieron ser eliminadas'
        });

    } catch (error) {
        console.error('Error en eliminar-fotos:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}
