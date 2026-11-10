'use strict';

const { handler } = require('../netlify/functions/revivir-codigo');
const { createVercelHandler } = require('../lib/vercel-netlify-adapter');

module.exports = createVercelHandler(handler);
