'use strict';
const { handler } = require('../netlify/functions/crear-transferencia');
const { adaptNetlifyHandler } = require('../lib/netlify-vercel-adapter');
module.exports = adaptNetlifyHandler(handler);
