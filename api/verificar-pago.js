'use strict';

// Una transferencia bancaria a Naranja X no se verifica con un payment_id.
// Los pedidos se registran en /api/crear-transferencia y solo la persona
// administradora autenticada puede confirmar la acreditación real.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(410).json({
    ok: false,
    estado: 'verificacion_manual',
    metodo: 'transferencia',
    entidad: 'Naranja X',
    alias: 'verogfotos.nx.arg',
    mensaje: 'La verificación automática de pagos está deshabilitada. La transferencia debe acreditarse y confirmarse desde el administrador.'
  });
};
