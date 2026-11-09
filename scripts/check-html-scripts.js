const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
let failed = false;

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const scripts = [...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
  let inlineIndex = 0;
  for (const match of scripts) {
    if (/\\bsrc\\s*=/.test(match[1])) continue;
    const code = match[2].trim();
    if (!code) continue;
    inlineIndex++;
    const result = spawnSync(process.execPath, ['--check', '--input-type=module'], {
      input: code,
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      failed = true;
      process.stderr.write('\\nError de sintaxis en ' + file + ' (script inline ' + inlineIndex + '):\\n');
      process.stderr.write(result.stderr || result.stdout || 'Error desconocido\\n');
    }
  }
}
if (failed) process.exit(1);
console.log('Sintaxis de scripts inline HTML verificada correctamente.');
