const fs = require('fs');
const path = require('path');
const pako = require('../vendor/pako.min.js');
const { PDFArray } = require('../vendor/pdf-lib.min.js');

const ROOT = path.join(__dirname, '..');

function loadTemplates() {
  const read = (n) => new Uint8Array(fs.readFileSync(path.join(ROOT, 'templates', `${n}_template.pdf`)));
  return { st: read('st'), spd: read('spd'), super: read('super') };
}

/** Raw (latin1) bytes of a page content stream, inflated. */
function rawStream(doc, pageIndex = 0) {
  const page = doc.getPages()[pageIndex];
  const contents = page.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  return refs.map((r) => {
    const s = doc.context.lookup(r);
    let b = s.getContents();
    try { b = pako.inflate(b); } catch (e) { /* not compressed */ }
    return new TextDecoder('latin1').decode(b);
  }).join('\n');
}

/** Text drawn on a page: literal "(..)" strings and pdf-lib hex "<..>" strings. */
function pageText(doc, pageIndex = 0) {
  const s = rawStream(doc, pageIndex);
  const out = [];
  const re = /\[\(((?:\\.|[^\\)])*)\)\] TJ|<([0-9A-Fa-f]+)> Tj/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1] !== undefined) out.push(m[1].replace(/\\([\\()])/g, '$1'));
    else out.push(new TextDecoder('latin1').decode(Buffer.from(m[2], 'hex')));
  }
  return out.join('\n');
}

/** Builder input matching the reference example (Format 2). */
function contohInput(overrides) {
  return Object.assign({
    format: 2,
    isOrganik: true,
    nama: 'Muhammad Ikbal Nur',
    nip: '196910051994011001',
    jabatan: 'Fungsional Umum',
    jabatanInstansi: 'Fungsional Umum BPS Kabupaten/Kota',
    golongan: 'III/b',
    unitKerja: 'BPS Kabupaten Kepulauan Selayar',
    noSurat: '114/7301/SS.360/2026',
    tglSt: '2026-06-15',
    tglSpd: '2026-06-15',
    tglMulai: '2026-06-22',
    tglSelesai: '2026-06-26',
    kecamatanAsal: 'Benteng',
    kecamatan: 'Pasimarannu',
    tujuan: 'Translok Pendampingan Petugas SE2026 Lebih dari 8 Jam',
    pembebanan: 'GG 2902 BMA 006 530 B 524113 2',
    uraianBeban: 'Transport Daerah Sulit',
    tempatBerangkat: 'Kabupaten Kepulauan Selayar',
    alatAngkut: 'Kendaraan Umum',
    mataAnggaran: '',
    ppk: { nama: 'Fakhri Hafidzul Azhar,S.Tr.Stat.', nip: '199801112021041001', program: 'Program Penyediaan dan Pelayanan Informasi Statistik' }
  }, overrides || {});
}

module.exports = { ROOT, loadTemplates, rawStream, pageText, contohInput };
