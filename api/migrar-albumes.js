'use strict';
const { handler } = require('../netlify/functions/migrar-albumes');
const { adaptNetlifyHandler } = require('../lib/netlify-vercel-adapter');
module.exports = adaptNetlifyHandler(handler);
