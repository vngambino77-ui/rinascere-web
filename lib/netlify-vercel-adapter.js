'use strict';

function adaptNetlifyHandler(handler) {
  return async function vercelHandler(req, res) {
    try {
      let body = req.body;
      if (Buffer.isBuffer(body)) body = body.toString('utf8');
      else if (body !== undefined && typeof body !== 'string') body = JSON.stringify(body);
      const query = {};
      for (const [key, value] of Object.entries(req.query || {})) {
        query[key] = Array.isArray(value) ? value[0] : value;
      }
      const response = await handler({
        httpMethod: req.method,
        headers: req.headers || {},
        body: body || '',
        queryStringParameters: query,
        path: req.url || '',
        rawUrl: req.url || ''
      });
      res.statusCode = response.statusCode || 500;
      res.setHeader('Cache-Control', 'no-store');
      for (const [key, value] of Object.entries(response.headers || {})) {
        res.setHeader(key, value);
      }
      res.end(response.body || '');
    } catch (error) {
      console.error('Error en adaptador de funciones:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ error: 'No se pudo completar la solicitud' }));
    }
  };
}

module.exports = { adaptNetlifyHandler };
