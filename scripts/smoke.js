#!/usr/bin/env node
/**
 * Smoke test: build Format 1 and Format 2 bundles from the reference data, check the
 * page count and key texts, and write the PDFs to out/ for visual inspection.
 */
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const Render = require('../render.js');
const { loadTemplates, pageText, contohInput } = require('../test/helpers.js');

const OUT = path.join(__dirname, '..', 'out');

const cases = [
  { name: 'format1', input: contohInput({ format: 1 }), pages: 3,
    texts: ['B-114/7301/SS.360/2026', '114/7301/SS.360/2026', 'Kecamatan Benteng', 'Kecamatan Pasimarannu', '22 Juni 2026 s.d. 26 Juni 2026', 'Muhammad Nur,S.Sos'] },
  { name: 'format2', input: contohInput(), pages: 4,
    texts: ['114/7301/SS.360/2026', '5 hari', 'Kecamatan Pasimarannu', 'Fakhri Hafidzul Azhar,S.Tr.Stat.', 'Telah diperiksa',
      'Pelaksanaan SE2026', 'Kabupaten Kepulauan Selayar', 'Muhammad Nur,S.Sos'] },
  { name: 'format2-maksud-3-baris', pages: 4, texts: ['5 hari'],
    input: contohInput({ tujuan: 'Translok Pendampingan Petugas Pendataan Sensus Ekonomi 2026 untuk wilayah kepulauan terluar termasuk desa pesisir serta pulau-pulau kecil' }) }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const templates = loadTemplates();
  let failed = 0;
  for (const c of cases) {
    const { data, errors } = Core.buildSpdData(c.input);
    if (errors.length) throw new Error(`${c.name}: ${JSON.stringify(errors)}`);
    const bundle = await Render.buildBundle(data, templates);
    const merged = bundle.merged;
    const text = merged.getPageIndices().map(i => pageText(merged, i)).join('\n');
    const missing = c.texts.filter(t => !text.includes(t));
    const ok = bundle.pageCount === c.pages && missing.length === 0;
    if (!ok) failed++;
    fs.writeFileSync(path.join(OUT, `bundel-${c.name}.pdf`), await merged.save());
    console.log(`${ok ? 'OK  ' : 'GAGAL'} ${c.name}: ${bundle.pageCount} halaman (harus ${c.pages})` +
      (missing.length ? `, teks hilang: ${missing.join(' | ')}` : ''));
  }
  console.log(`PDF disimpan di ${path.relative(process.cwd(), OUT) || '.'}/`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
