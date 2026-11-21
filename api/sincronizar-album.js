'use strict';
const { handler } = require('../netlify/functions/sincronizar-album');
const { adaptNetlifyHandler } = require('../lib/netlify-vercel-adapter');
module.exports = adaptNetlifyHandler(handler);
