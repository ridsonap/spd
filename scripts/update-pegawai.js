#!/usr/bin/env node
/**
 * Regenerate pegawai.js (the offline copy of the pegawai list) from the Google Sheet.
 * The app reads the sheet on every load; pegawai.js is used when that fails.
 *
 *   node scripts/update-pegawai.js              download the sheet and write pegawai.js
 *   node scripts/update-pegawai.js --file x.csv use a downloaded CSV export instead
 *
 * Rows that need fixing in the sheet are printed. Nothing is written when no valid row
 * is found (sheet moved, header renamed, offline).
 */
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');

const OUT = path.join(__dirname, '..', 'pegawai.js');
const FIELDS = ['nama', 'nip', 'jabatan', 'jabatanInstansi', 'golongan', 'pangkat'];

function renderPegawaiJs(pegawai) {
  const items = pegawai.map((p) => {
    const lines = FIELDS.map((k) => `    ${k}: ${JSON.stringify(p[k] || '')}`);
    return `  {\n${lines.join(',\n')}\n  }`;
  });
  return [
    '/**',
    ' * Database Pegawai BPS Kabupaten Kepulauan Selayar',
    ' * Sumber: https://docs.google.com/spreadsheets/u/0/d/1hnGYZh1Ng61W8HYfYg5_DRRyvtSedklDSK2b6GEqUZc/htmlview#gid=2128965247',
    ' * Dibuat oleh scripts/update-pegawai.js (npm run update:pegawai), jangan diedit manual.',
    ' */',
    '',
    `window.PEGAWAI_ORGANIK = [\n${items.join(',\n')}\n];`,
    ''
  ].join('\n');
}

async function readCsv(args) {
  const i = args.indexOf('--file');
  if (i >= 0) return fs.readFileSync(args[i + 1], 'utf8');
  const res = await fetch(Core.PEGAWAI_SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Google Sheet tidak bisa diambil (HTTP ${res.status})`);
  return res.text();
}

async function main(args) {
  const result = Core.parsePegawaiCsv(await readCsv(args));
  for (const w of result.warnings) console.warn(`! ${w}`);
  if (!result.pegawai.length) throw new Error(`pegawai.js tidak diubah: ${result.reason}`);
  fs.writeFileSync(OUT, renderPegawaiJs(result.pegawai));
  console.log(`pegawai.js ditulis (${result.pegawai.length} pegawai${result.warnings.length ? `, ${result.warnings.length} baris perlu dicek` : ''})`);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { renderPegawaiJs };
