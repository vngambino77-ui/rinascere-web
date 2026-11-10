'use strict';

const { handler } = require('../netlify/functions/sincronizar-album');
const { createVercelHandler } = require('../lib/vercel-netlify-adapter');

module.exports = createVercelHandler(handler);
