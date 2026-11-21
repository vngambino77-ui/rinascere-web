'use strict';
const { handler } = require('../netlify/functions/revivir-codigo');
const { adaptNetlifyHandler } = require('../lib/netlify-vercel-adapter');
module.exports = adaptNetlifyHandler(handler);
