'use strict';
const { handler } = require('../netlify/functions/confirmar-transferencia');
const { adaptNetlifyHandler } = require('../lib/netlify-vercel-adapter');
module.exports = adaptNetlifyHandler(handler);
