const { PDFDocument, PDFName } = require('./vendor/pdf-lib.min.js');
const pako = require('./vendor/pako.min.js');
const fs = require('fs');

function formatNomor(raw) {
  let cleaned = (raw || '').trim();
  cleaned = cleaned.replace(/^NOMOR\s*:\s*/i, '');
  if (/^B-/i.test(cleaned)) {
    cleaned = cleaned.replace(/^B-/i, '');
  }
  let fullNo = cleaned;
  if (!cleaned.includes('/')) {
    fullNo = `${cleaned}/7301/SS.330/2026`;
  }
  return {
    stNo: `B-${fullNo}`,
    spdNo: fullNo,
    superNo: `B-${fullNo}`
  };
}

function formatIndoDate(dateStr) {
  if (!dateStr) return '';
  if (/[a-zA-Z]/.test(dateStr)) return dateStr.trim();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (m >= 1 && m <= 12) {
      return `${d} ${months[m - 1]} ${y}`;
    }
  }
  return dateStr;
}

function formatKecamatan(raw) {
  let kec = (raw || '').trim();
  if (!kec) return 'Kecamatan Bontomatene';
  if (!/^kecamatan\s+/i.test(kec)) {
    kec = `Kecamatan ${kec}`;
  }
  return kec.replace(/^kecamatan/i, 'Kecamatan');
}

async function generateST(stBytes, opts) {
  const doc = await PDFDocument.load(stBytes);
  const page = doc.getPages()[0];
  const stream = doc.context.lookup(page.node.Contents());
  let text = new TextDecoder('latin1').decode(pako.inflate(stream.getContents()));
  
  const { stNo } = formatNomor(opts.noSurat || '114.21');
  const kecFormatted = formatKecamatan(opts.kecamatan || 'Bontomatene');
  const tglMulai = formatIndoDate(opts.tglMulai || '2026-07-20');
  const tglSelesai = formatIndoDate(opts.tglSelesai || opts.tglMulai || '2026-07-20');
  const waktuStr = `${tglMulai} s.d. ${tglSelesai}`;
  
  text = text.replace('B-114.21/7301/SS.330/2026', stNo);
  text = text.replace('Bontolebang di Kecamatan Bontomatene', `Bontolebang di ${kecFormatted}`);
  text = text.replace('20 Juli 2026 s.d. 20 Juli 2026', waktuStr);
  
  if (opts.nama) {
    text = text.replaceAll('NUR JANNAH', opts.nama.toUpperCase());
  }
  if (opts.tglSt) {
    text = text.replace('Kepulauan Selayar, 15 Juni 2026', `Kepulauan Selayar, ${formatIndoDate(opts.tglSt)}`);
  }
  
  page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(new TextEncoder().encode(text))));
  return doc;
}

async function generateSPD(spdBytes, opts) {
  const doc = await PDFDocument.load(spdBytes);
  const page = doc.getPages()[0];
  const stream = doc.context.lookup(page.node.Contents());
  let text = new TextDecoder('latin1').decode(pako.inflate(stream.getContents()));
  
  const { spdNo } = formatNomor(opts.noSurat || '114.21');
  const kecFormatted = formatKecamatan(opts.kecamatan || 'Bontomatene');
  const tglSpd = formatIndoDate(opts.tglSpd || '2026-07-20');
  
  text = text.replaceAll('114.21/7301/SS.330/2026', spdNo);
  text = text.replaceAll('Kecamatan Bontomatene', kecFormatted);
  text = text.replaceAll('20 Juli 2026', tglSpd);
  
  page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(new TextEncoder().encode(text))));
  return doc;
}

async function generateSuper(superBytes, opts) {
  const doc = await PDFDocument.load(superBytes);
  const page = doc.getPages()[0];
  const stream = doc.context.lookup(page.node.Contents());
  let text = new TextDecoder('latin1').decode(pako.inflate(stream.getContents()));
  
  const { superNo } = formatNomor(opts.noSurat || '114.21');
  const tglSpd = formatIndoDate(opts.tglSpd || '2026-07-20');
  const tglMulai = formatIndoDate(opts.tglMulai || opts.tglSpd || '2026-07-20');
  const tglSelesai = formatIndoDate(opts.tglSelesai || opts.tglMulai || '2026-07-20');
  
  const tglPelaksanaan = (tglMulai === tglSelesai) ? tglMulai : `${tglMulai} s.d. ${tglSelesai}`;
  
  text = text.replace('B-114.21/7301/SS.330/2026', superNo);
  text = text.replace('pelaksanaan tanggal 20 Juli 2026', `pelaksanaan tanggal ${tglPelaksanaan}`);
  text = text.replace('Kepulauan Selayar, 20 Juli 2026', `Kepulauan Selayar, ${tglSpd}`);
  
  if (opts.nama) {
    text = text.replaceAll('NUR JANNAH', opts.nama.toUpperCase());
  }
  if (opts.nip) {
    text = text.replaceAll('7301034811760004', opts.nip.trim());
  }
  
  page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(new TextEncoder().encode(text))));
  return doc;
}

async function generateMerged(stDoc, spdDoc, superDoc) {
  const mergedDoc = await PDFDocument.create();
  const [p1] = await mergedDoc.copyPages(stDoc, [0]);
  const [p2] = await mergedDoc.copyPages(spdDoc, [0]);
  const [p3] = await mergedDoc.copyPages(superDoc, [0]);
  mergedDoc.addPage(p1);
  mergedDoc.addPage(p2);
  mergedDoc.addPage(p3);
  return mergedDoc;
}

// Self check test
async function runSelfCheck() {
  const stBytes = fs.readFileSync('./templates/st_template.pdf');
  const spdBytes = fs.readFileSync('./templates/spd_template.pdf');
  const superBytes = fs.readFileSync('./templates/super_template.pdf');
  
  const opts = {
    tglSpd: '2026-08-07',
    tglMulai: '2026-08-07',
    tglSelesai: '2026-08-07',
    noSurat: '114.21',
    kecamatan: 'Bontomatene'
  };
  
  const stDoc = await generateST(stBytes, opts);
  const spdDoc = await generateSPD(spdBytes, opts);
  const superDoc = await generateSuper(superBytes, opts);
  const mergedDoc = await generateMerged(stDoc, spdDoc, superDoc);
  
  const stPdf = await stDoc.save();
  const spdPdf = await spdDoc.save();
  const superPdf = await superDoc.save();
  const mergedPdf = await mergedDoc.save();
  
  console.log('ST size:', stPdf.length);
  console.log('SPD size:', spdPdf.length);
  console.log('Super size:', superPdf.length);
  console.log('Merged size:', mergedPdf.length);
  console.log('Merged page count:', mergedDoc.getPageCount());
  
  if (mergedDoc.getPageCount() !== 3) {
    throw new Error('Merged page count must be 3');
  }
  console.log('✓ Self check passed!');
}

runSelfCheck().catch(err => {
  console.error(err);
  process.exit(1);
});
