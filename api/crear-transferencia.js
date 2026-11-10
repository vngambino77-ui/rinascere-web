'use strict';

const { handler } = require('../netlify/functions/crear-transferencia');
const { createVercelHandler } = require('../lib/vercel-netlify-adapter');

module.exports = createVercelHandler(handler);
