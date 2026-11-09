const fs = require('fs');
const path = require('path');

const rawConfig = process.env.FIREBASE_WEB_CONFIG_JSON;
const adminUid = process.env.FIREBASE_ADMIN_UID;

if (!rawConfig) throw new Error('Falta FIREBASE_WEB_CONFIG_JSON en el contexto de Netlify');
if (!adminUid) throw new Error('Falta FIREBASE_ADMIN_UID en el contexto de Netlify');

let config;
try {
  config = JSON.parse(rawConfig);
} catch (_) {
  throw new Error('FIREBASE_WEB_CONFIG_JSON debe contener un objeto JSON válido');
}

for (const key of ['apiKey', 'authDomain', 'projectId', 'appId']) {
  if (!config[key] || typeof config[key] !== 'string') {
    throw new Error(`La configuración Firebase no contiene ${key}`);
  }
}

const output = [
  '/* Generated during Netlify build. Do not commit project credentials here. */',
  `window.RINASCERE_FIREBASE_CONFIG = Object.freeze(${JSON.stringify(config)});`,
  `window.RINASCERE_ADMIN_UID = ${JSON.stringify(adminUid)};`,
  ''
].join('\n');

fs.writeFileSync(path.join(__dirname, '..', 'firebase-config.js'), output, 'utf8');
console.log(`Firebase web config generated for project: ${config.projectId}`);
