'use strict';

const { handler } = require('../netlify/functions/canjear-codigo');
const { createVercelHandler } = require('../lib/vercel-netlify-adapter');

module.exports = createVercelHandler(handler);
