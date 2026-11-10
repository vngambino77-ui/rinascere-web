'use strict';

function normalizeBody(body) {
  if (body == null) return '';
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

function createVercelHandler(netlifyHandler) {
  return async function vercelHandler(req, res) {
    const url = new URL(req.url || '/', 'https://vercel.invalid');
    const queryStringParameters = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (Object.prototype.hasOwnProperty.call(queryStringParameters, key)) {
        const previous = queryStringParameters[key];
        queryStringParameters[key] = Array.isArray(previous) ? [...previous, value] : [previous, value];
      } else {
        queryStringParameters[key] = value;
      }
    }

    const event = {
      httpMethod: req.method || 'GET',
      headers: req.headers || {},
      queryStringParameters,
      body: normalizeBody(req.body)
    };

    let result;
    try {
      result = await netlifyHandler(event);
    } catch (error) {
      console.error('Error en adaptador Netlify/Vercel:', error);
      result = {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'Error interno del servidor' })
      };
    }

    const statusCode = Number(result && result.statusCode) || 200;
    const headers = result && result.headers ? result.headers : {};
    for (const [name, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) res.setHeader(name, value);
    }

    const responseBody = result && result.body != null ? result.body : '';
    return res.status(statusCode).end(responseBody);
  };
}

module.exports = { createVercelHandler };
