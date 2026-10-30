const test = require('node:test');
const assert = require('node:assert');
const Core = require('../core.js');
const Render = require('../render.js');
const { loadTemplates, rawStream, pageText, contohInput } = require('./helpers.js');

const templates = loadTemplates();
const build = (overrides) => {
  const { data, errors } = Core.buildSpdData(contohInput(overrides));
  assert.deepStrictEqual(errors, []);
  return data;
};

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

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

test('bundel Format 1 = 3 halaman, Format 2 = 4 halaman', async () => {
  assert.strictEqual((await Render.buildBundle(build({ format: 1 }), templates)).pageCount, 3);
  const f2 = await Render.buildBundle(build(), templates);
  assert.strictEqual(f2.pageCount, 4);
  assert.strictEqual(f2.spd.getPageCount(), 2);
  assert.deepStrictEqual(f2.warnings, []);
});

test('halaman depan Format 2 berisi nilai acuan contoh', async () => {
  const { doc } = await Render.renderSpdDepanF2(build());
  assert.deepStrictEqual(doc.getPages()[0].getSize(), { width: 595.28, height: 841.89 });
  const t = pageText(doc);
  for (const s of ['114/7301/SS.360/2026', 'Fakhri Hafidzul Azhar,S.Tr.Stat.', 'Muhammad Ikbal Nur', 'III/b',
    'Fungsional Umum BPS Kabupaten/Kota', 'Translok Pendampingan Petugas SE2026 Lebih dari 8 Jam', 'Kendaraan Umum',
    'Kabupaten Kepulauan Selayar', 'Kecamatan Pasimarannu', '5 hari', '22 Juni 2026', '26 Juni 2026', 'GG', '2902', '530',
    'Pelaksanaan SE2026', 'Badan Pusat Statistik Kepulauan Selayar', 'Dikeluarkan di', 'Benteng', '15 Juni 2026',
    'PEJABAT PEMBUAT KOMITMEN', 'NIP. 199801112021041001', 'Tembusan disampaikan kepada :']) {
    assert.ok(t.includes(s), `teks "${s}" harus ada`);
  }
});

for (const [label, maksud] of [
  ['1 baris', 'Translok Pendampingan Petugas SE2026 Lebih dari 8 Jam'],
  ['3 baris', 'Translok Pendampingan Petugas Pendataan Sensus Ekonomi 2026 untuk wilayah kepulauan terluar termasuk desa pesisir serta pulau-pulau kecil']
]) {
  test(`halaman depan Format 2 tanpa teks bertumpuk: maksud ${label}`, async () => {
    const { boxes } = await Render.renderSpdDepanF2(build({ tujuan: maksud, keterangan: 'Keterangan yang cukup panjang supaya ikut terbungkus di kolom nilai' }));
    const maksudLines = boxes.filter(b => maksud.includes(b.text) && b.x > 290);
    assert.strictEqual(maksudLines.length, label === '1 baris' ? 1 : 3);
    for (let i = 0; i < boxes.length; i++) {
      assert.ok(boxes[i].x + boxes[i].w <= 595.28 - 13, `"${boxes[i].text}" keluar margin kanan`);
      for (let j = i + 1; j < boxes.length; j++) {
        assert.ok(!overlaps(boxes[i], boxes[j]), `"${boxes[i].text}" bertumpuk dengan "${boxes[j].text}"`);
      }
    }
  });
}

test('halaman depan Format 2 menolak isi yang melebihi 1 halaman', async () => {
  const panjang = Array(60).fill('Pendampingan petugas lapangan').join(' ');
  await assert.rejects(Render.renderSpdDepanF2(build({ tujuan: panjang })), /melebihi 1 halaman/);
});

test('lampiran Format 2: bagian III terisi, CATATAN digeser', async () => {
  const doc = await Render.renderSpdLampiranF2(templates.spd, build());
  const s = rawStream(doc);
  const t = pageText(doc);
  assert.ok(s.includes('q 1 0 0 1 0 -151.185 cm\nBT 29.096 482.525 Td /F1 12.0 Tf  [(CATATAN LAIN - LAIN)] TJ ET'));
  assert.ok(t.includes('Telah diperiksa dengan keterangan bahwa perjalanan'));
  assert.strictEqual((t.match(/Fakhri Hafidzul Azhar,S\.Tr\.Stat\./g) || []).length, 2);
  assert.strictEqual((t.match(/Nip\. 199801112021041001/g) || []).length, 2);
  assert.ok(t.includes('Muhammad Nur,S.Sos'));
  // Berangkat dari / Ke / Tiba di use the tempat kedudukan, not the kecamatan asal
  // (the fourth match is the Kepala BPS title).
  assert.strictEqual((t.match(/Kabupaten Kepulauan Selayar/g) || []).length, 4);
  assert.ok(!t.includes('Kecamatan Benteng'));
});
