const test = require('node:test');
const assert = require('node:assert');
const Core = require('../core.js');
const Render = require('../render.js');
const { loadTemplates, rawStream, contohInput } = require('./helpers.js');

const templates = loadTemplates();
const build = (overrides) => {
  const { data, errors } = Core.buildSpdData(contohInput(overrides));
  assert.deepStrictEqual(errors, []);
  return data;
};

test('stream ditulis sebagai WinAnsi: karakter beraksen tidak pecah jadi UTF-8', async () => {
  const data = build({ format: 1, isOrganik: false, nama: 'José O’Neil', nip: '7301034811760004', jabatan: 'Mitra – PPL' });
  const bundle = await Render.buildBundle(data, templates);
  for (const doc of [bundle.st, bundle.super]) {
    const s = rawStream(doc);
    assert.ok(s.includes('José O’Neil'), 'nama harus terbaca kembali utuh');
    assert.ok(!s.includes('JosÃ©'), 'tidak boleh ada urutan byte UTF-8');
  }
  assert.ok(rawStream(bundle.st).includes('Mitra – PPL'));
});

test('template yang tidak cocok membuat render gagal dengan pesan jelas', async () => {
  const { PDFDocument, PDFName } = require('../vendor/pdf-lib.min.js');
  const pako = require('../vendor/pako.min.js');
  const doc = await PDFDocument.load(templates.spd);
  const page = doc.getPages()[0];
  const text = Buffer.from(pako.inflate(doc.context.lookup(page.node.Contents()).getContents())).toString('latin1')
    .replace('[(20 Juli 2026)]', '[(21 Juli 2026)]');
  page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(Buffer.from(text, 'latin1'))));
  const broken = await doc.save();
  await assert.rejects(Render.renderSpdLampiranF1(broken, build({ format: 1 })), /SPD I tanggal/);
});

test('render menolak data yang belum valid', async () => {
  const { data } = Core.buildSpdData({ format: 1 });
  await assert.rejects(Render.buildBundle(data, templates), /belum valid/);
});

test('bundel Format 1 = 3 halaman', async () => {
  assert.strictEqual((await Render.buildBundle(build({ format: 1 }), templates)).pageCount, 3);
});
