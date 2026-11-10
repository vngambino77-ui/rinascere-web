'use strict';

const { handler } = require('../netlify/functions/obtener-album');
const { createVercelHandler } = require('../lib/vercel-netlify-adapter');

module.exports = createVercelHandler(handler);
