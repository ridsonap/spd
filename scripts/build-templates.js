#!/usr/bin/env node
/**
 * Regenerate templates.js (base64 copies of templates/*.pdf) so the app also works
 * when opened via file://. templates/*.pdf is the source of truth.
 *
 *   node scripts/build-templates.js          write templates.js
 *   node scripts/build-templates.js --check  exit 1 when templates.js is stale
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NAMES = ['st', 'spd', 'super'];
const OUT = path.join(ROOT, 'templates.js');

function render() {
  const body = NAMES.map((n) => {
    const b64 = fs.readFileSync(path.join(ROOT, 'templates', `${n}_template.pdf`)).toString('base64');
    return `  ${n}: "${b64}"`;
  }).join(',\n');
  return `window.PDF_TEMPLATES = {\n${body}\n};\n`;
}

const expected = render();
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current !== expected) {
    console.error('templates.js tidak sinkron dengan templates/*.pdf. Jalankan: npm run build:templates');
    process.exit(1);
  }
  console.log('templates.js sinkron dengan templates/*.pdf');
} else {
  fs.writeFileSync(OUT, expected);
  console.log(`templates.js ditulis (${NAMES.join(', ')})`);
}
