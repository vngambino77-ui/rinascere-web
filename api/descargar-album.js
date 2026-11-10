'use strict';

const { handler } = require('../netlify/functions/descargar-album');
const { createVercelHandler } = require('../lib/vercel-netlify-adapter');

module.exports = createVercelHandler(handler);
