'use strict';

const { handler } = require('../netlify/functions/migrar-albumes');
const { createVercelHandler } = require('../lib/vercel-netlify-adapter');

module.exports = createVercelHandler(handler);
