'use strict';
const { handler } = require('../netlify/functions/reiniciar-pedidos-gratis');
const { adaptNetlifyHandler } = require('../lib/netlify-vercel-adapter');
module.exports = adaptNetlifyHandler(handler);
