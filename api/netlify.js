// Adaptador para ejecutar los handlers existentes de Netlify en Vercel.
// Se mantienen los mismos endpoints públicos y la validación de permisos de cada handler.
const fn0 = require('../netlify/functions/borrar-pedidos-gratis.js').handler;
const fn1 = require('../netlify/functions/canjear-codigo.js').handler;
const fn2 = require('../netlify/functions/confirmar-transferencia.js').handler;
const fn3 = require('../netlify/functions/crear-transferencia.js').handler;
const fn4 = require('../netlify/functions/descargar-album.js').handler;
const fn5 = require('../netlify/functions/estado-transferencia.js').handler;
const fn6 = require('../netlify/functions/migrar-albumes.js').handler;
const fn7 = require('../netlify/functions/obtener-album.js').handler;
const fn8 = require('../netlify/functions/revivir-codigo.js').handler;
const fn9 = require('../netlify/functions/sincronizar-album.js').handler;
const handlers = {
  'borrar-pedidos-gratis': fn0,
  'canjear-codigo': fn1,
  'confirmar-transferencia': fn2,
  'crear-transferencia': fn3,
  'descargar-album': fn4,
  'estado-transferencia': fn5,
  'migrar-albumes': fn6,
  'obtener-album': fn7,
  'revivir-codigo': fn8,
  'sincronizar-album': fn9
};

module.exports = async function handler(req, res) {
  const nombre = typeof req.query.fn === 'string' ? req.query.fn : '';
  const ejecutar = Object.prototype.hasOwnProperty.call(handlers, nombre) ? handlers[nombre] : null;
  if (!ejecutar) return res.status(404).json({ error: 'Función no encontrada' });
  const queryStringParameters = { ...req.query };
  delete queryStringParameters.fn;
  const body = typeof req.body === 'string' ? req.body : req.body == null ? '' : JSON.stringify(req.body);
  const event = {
    httpMethod: req.method,
    headers: req.headers,
    body,
    isBase64Encoded: false,
    queryStringParameters,
    path: '/.netlify/functions/' + nombre
  };
  try {
    const result = await ejecutar(event);
    const status = Number(result && result.statusCode) || 500;
    for (const [key, value] of Object.entries((result && result.headers) || {})) {
      if (value != null) res.setHeader(key, String(value));
    }
    if (result && result.isBase64Encoded) {
      return res.status(status).send(Buffer.from(result.body || '', 'base64'));
    }
    return res.status(status).send(result && result.body != null ? result.body : '');
  } catch (error) {
    console.error('vercel-adapter:', nombre, error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
