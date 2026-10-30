/**
 * SPDRender: builds the PDF documents (ST, SPD, Surat Pernyataan) from the
 * data object produced by SPDCore.buildSpdData().
 * UMD: window.SPDRender in the browser (needs window.SPDCore, PDFLib, pako) and
 * module.exports in Node (loads the same vendor/ builds).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./core.js'), require('./vendor/pdf-lib.min.js'), require('./vendor/pako.min.js'));
  } else {
    root.SPDRender = factory(root.SPDCore, root.PDFLib, root.pako);
  }
})(typeof self !== 'undefined' ? self : this, function (Core, PDFLib, pako) {
  'use strict';

  const { escapePdfText, wrapText, encodeLatin1, replaceStrict } = Core;
  const { PDFDocument, PDFName, StandardFonts } = PDFLib;

  // ---------------------------------------------------------------------------
  // Content stream helpers
  // ---------------------------------------------------------------------------

  async function openTemplate(bytes) {
    const doc = await PDFDocument.load(bytes);
    const page = doc.getPages()[0];
    const stream = doc.context.lookup(page.node.Contents());
    const text = new TextDecoder('latin1').decode(pako.inflate(stream.getContents()));
    return { doc, page, text };
  }

  function writeStream(doc, page, text, warnings) {
    const bytes = encodeLatin1(text, warnings);
    page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(bytes)));
  }

  function fmt(n) {
    return n.toFixed(3);
  }

  function textOp(x, y, str, font) {
    return `BT ${fmt(x)} ${fmt(y)} Td /${font || 'F1'} 12.0 Tf  [(${escapePdfText(str)})] TJ ET`;
  }

  function lineOp(x1, y1, x2, y2, w) {
    return `${w} w 0 J [  ] 0 d\n${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`;
  }

  /**
   * Replace a text block between two markers (inclusive). Throws when either is missing.
   */
  function replaceBlock(text, startMarker, endMarker, repl, label) {
    const startIdx = text.indexOf(startMarker);
    const endIdx = startIdx === -1 ? -1 : text.indexOf(endMarker, startIdx);
    if (startIdx === -1 || endIdx === -1) {
      throw new Error(`Template tidak cocok: blok "${label}" tidak ditemukan. Periksa file template PDF.`);
    }
    return text.substring(0, startIdx) + repl(text.substring(startIdx, endIdx + endMarker.length)) +
      text.substring(endIdx + endMarker.length);
  }

  function assertValid(data) {
    if (!data || data.valid !== true) {
      throw new Error('Data SPD belum valid. Perbaiki isian yang ditandai sebelum membuat dokumen.');
    }
  }

  // ---------------------------------------------------------------------------
  // Surat Tugas
  // ---------------------------------------------------------------------------

  /**
   * Build dynamic middle block for Surat Tugas (Tujuan, Waktu, Pembebanan)
   * Automatically adapts Y-positions whether Tujuan is 1 line, 2 lines, 3 lines, or more
   */
  function buildMiddleBlockST(data) {
    const tujuanLines = wrapText(data.tujuan, 52);
    const y = 499.179;
    const parts = [];

    // 1. Tujuan / Tugas
    parts.push(`BT 58.943 ${y.toFixed(3)} Td /F1 12.0 Tf  [(Tujuan/Tugas)] TJ ET`);
    parts.push(`BT 211.943 ${y.toFixed(3)} Td /F1 12.0 Tf  [(:)] TJ ET`);

    tujuanLines.forEach((line, idx) => {
      const curY = idx === 0 ? y : y - (idx * 14.256);
      parts.push(`BT 222.443 ${curY.toFixed(3)} Td /F1 12.0 Tf  [(${escapePdfText(line)})] TJ ET`);
    });

    const lastTujuanY = y - ((tujuanLines.length - 1) * 14.256);

    // 2. Waktu Pelaksanaan
    const waktuY = lastTujuanY - 17.256;
    parts.push(`BT 58.943 ${waktuY.toFixed(3)} Td /F1 12.0 Tf  [(Waktu Pelaksanaan)] TJ ET`);
    parts.push(`BT 211.943 ${waktuY.toFixed(3)} Td /F1 12.0 Tf  [(:)] TJ ET`);
    parts.push(`BT 222.443 ${waktuY.toFixed(3)} Td /F1 12.0 Tf  [(${escapePdfText(data.waktuStr)})] TJ ET`);

    // 3. Pembebanan
    const beban1Y = waktuY - 17.256;
    parts.push(`BT 58.943 ${beban1Y.toFixed(3)} Td /F1 12.0 Tf  [(Pembebanan)] TJ ET`);
    parts.push(`BT 211.943 ${beban1Y.toFixed(3)} Td /F1 12.0 Tf  [(:)] TJ ET`);
    parts.push(`BT 222.443 ${beban1Y.toFixed(3)} Td /F1 12.0 Tf  [(${escapePdfText(data.pembebanan)})] TJ ET`);

    if (data.uraianBeban) {
      const beban2Y = beban1Y - 14.256;
      parts.push(`BT 222.443 ${beban2Y.toFixed(3)} Td /F1 12.0 Tf  [(${escapePdfText(data.uraianBeban)})] TJ ET`);
    }

    return parts.join('\n');
  }

  async function renderST(stBytes, data, warnings) {
    assertValid(data);
    const { doc, page, text: src } = await openTemplate(stBytes);
    let text = src;

    // 1. Nomor
    text = replaceStrict(text, 'B-114.21/7301/SS.330/2026', data.stNo, 'ST nomor');

    // 2. Nama Petugas (sesuai database untuk organik, sesuai input user untuk mitra)
    text = replaceStrict(text, 'NUR JANNAH', escapePdfText(data.petugas.nama), 'ST nama', { all: true });

    // 3. Jabatan Petugas
    text = replaceStrict(text, /Petugas Lapangan Sensus \\\([^)]*\\\)/, escapePdfText(data.petugas.jabatan), 'ST jabatan');

    // 4. Dynamic Middle Block: Tujuan, Waktu, Pembebanan
    text = replaceBlock(
      text,
      'BT 58.943 499.179 Td /F1 12.0 Tf  [(Tujuan/Tugas)] TJ ET',
      'BT 222.443 433.155 Td /F1 12.0 Tf  [(Transport Daerah Sulit)] TJ ET',
      () => buildMiddleBlockST(data),
      'ST tujuan/waktu/pembebanan'
    );

    // 5. Tanggal TTD ST
    text = replaceStrict(text, 'Kepulauan Selayar, 15 Juni 2026', `Kepulauan Selayar, ${data.tglStIndo}`, 'ST tanggal TTD');

    writeStream(doc, page, text, warnings);
    return doc;
  }

  // ---------------------------------------------------------------------------
  // SPD lampiran (shared by Format 1 and 2)
  // ---------------------------------------------------------------------------

  /**
   * Replace nomor, section I/II places and dates, and re-centre the Kepala BPS block.
   * `asal` is the departure place (Format 1: kecamatan asal, Format 2: tempat kedudukan).
   */
  function applyLampiranReplacements(text, data, asal, bold) {
    const kecTujuan = data.kecTujuan;
    const tglBerangkat = data.tglMulaiIndo;
    const tglPulang = data.tglSelesaiIndo;
    const swap = (find, value, label) => {
      const prefix = find.slice(0, find.indexOf('[('));
      return replaceStrict(text, find, `${prefix}[(${escapePdfText(value)})] TJ ET`, label);
    };

    // Nomor SPD
    text = replaceStrict(text, '114.21/7301/SS.330/2026', data.spdNo, 'SPD nomor', { all: true });

    // 1. Kolom I: Berangkat dari (Tempat Kedudukan)
    text = swap('BT 406.107 741.377 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET', asal, 'SPD I berangkat dari');
    // 2. Kolom I: Pada Tanggal
    text = swap('BT 406.107 711.365 Td /F1 12.0 Tf  [(20 Juli 2026)] TJ ET', tglBerangkat, 'SPD I tanggal');
    // 3. Kolom I: Ke
    text = swap('BT 406.107 695.609 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET', kecTujuan, 'SPD I ke');
    // 4. Kolom II (Kiri): Tiba di
    text = swap('BT 136.814 589.067 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET', kecTujuan, 'SPD II tiba di');
    // 5. Kolom II (Kiri): Pada Tanggal (tiba)
    text = swap('BT 136.814 573.311 Td /F1 12.0 Tf  [(20 Juli 2026)] TJ ET', tglBerangkat, 'SPD II tanggal tiba');
    // 6. Kolom II (Kanan): Berangkat dari
    text = swap('BT 406.107 589.067 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET', kecTujuan, 'SPD II berangkat dari');
    // 7. Kolom II (Kanan): Ke
    text = swap('BT 406.107 573.311 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET', asal, 'SPD II ke');
    // 8. Kolom II (Kanan): Pada Tanggal (pulang)
    text = swap('BT 406.107 557.555 Td /F1 12.0 Tf  [(20 Juli 2026)] TJ ET', tglPulang, 'SPD II tanggal pulang');

    // 9. Kepala BPS (name centred on the template position, underline follows the width)
    const tplName = 'Muhammad Nur,S.Sos';
    const nameX = 374.156;
    const lineEnd = 491.168;
    const wOld = bold.widthOfTextAtSize(tplName, 12);
    const wNew = bold.widthOfTextAtSize(data.kepala.nama, 12);
    const newX = nameX + wOld / 2 - wNew / 2;
    text = replaceStrict(text, `BT 374.156 621.934 Td /F2 12.0 Tf  [(${tplName})] TJ ET`,
      `BT ${fmt(newX)} 621.934 Td /F2 12.0 Tf  [(${escapePdfText(data.kepala.nama)})] TJ ET`, 'SPD nama Kepala BPS');
    text = replaceStrict(text, '374.156 619.354 m 491.168 619.354 l S',
      `${fmt(newX)} 619.354 m ${fmt(newX + (lineEnd - nameX) - wOld + wNew)} 619.354 l S`, 'SPD garis nama Kepala BPS');
    return text;
  }

  async function lampiranFonts(doc) {
    return {
      regular: await doc.embedFont(StandardFonts.TimesRoman),
      bold: await doc.embedFont(StandardFonts.TimesRomanBold)
    };
  }

  /**
   * SPD lampiran Format 1 (the original generateSPD).
   */
  async function renderSpdLampiranF1(spdBytes, data, warnings) {
    assertValid(data);
    const { doc, page, text } = await openTemplate(spdBytes);
    const fonts = await lampiranFonts(doc);
    writeStream(doc, page, applyLampiranReplacements(text, data, data.kecAsal, fonts.bold), warnings);
    return doc;
  }

  // ---------------------------------------------------------------------------
  // Surat Pernyataan
  // ---------------------------------------------------------------------------

  /**
   * Format dynamic justified statement paragraph for Surat Pernyataan
   */
  function formatSuperParagraph(superNo, tglPelaksanaan, font) {
    const fullText = `Menerangkan bahwa dalam rangka melaksanakan perjalanan dinas dalam kota untuk melaksanakan tugas kedinasan sesuai surat tugas nomor: ${superNo} pelaksanaan tanggal ${tglPelaksanaan}, saya benar-benar tidak menggunakan kendaraan dinas.`;
    // ponytail: fixed 510pt width and 3-line budget; upgrade to full reflow if statement exceeds 3 lines
    const targetWidth = 510.0;
    const fontSize = 11.2;

    const words = fullText.split(/\s+/);
    const lines = [];
    let cur = [];

    for (const w of words) {
      const candidate = [...cur, w].join(' ');
      if (font.widthOfTextAtSize(candidate, fontSize) <= targetWidth) {
        cur.push(w);
      } else {
        if (cur.length > 0) {
          lines.push(cur.join(' '));
          cur = [w];
        } else {
          lines.push(w);
          cur = [];
        }
      }
    }
    if (cur.length > 0) lines.push(cur.join(' '));

    const yCoords = [550.606, 530.559, 510.511];
    const pdfParts = [];

    lines.forEach((line, idx) => {
      const y = yCoords[idx] || (510.511 - ((idx - 2) * 20.047));
      const isLast = idx === lines.length - 1;
      const spaces = line.split(' ').length - 1;
      const naturalW = font.widthOfTextAtSize(line, fontSize);
      const escaped = escapePdfText(line);

      if (!isLast && spaces > 0 && naturalW < targetWidth) {
        const tw = (targetWidth - naturalW) / spaces;
        pdfParts.push(`BT 41.516 ${y.toFixed(3)} Td ${tw.toFixed(3)} Tw /F1 11.2 Tf  [(${escaped})] TJ 0.000 Tw ET`);
      } else {
        pdfParts.push(`BT 41.516 ${y.toFixed(3)} Td /F1 11.2 Tf  [(${escaped})] TJ ET`);
      }
    });

    return pdfParts.join('\n');
  }

  async function renderSuper(superBytes, data, warnings) {
    assertValid(data);
    const { doc, page, text: src } = await openTemplate(superBytes);
    let text = src;

    const font = await doc.embedFont(StandardFonts.TimesRoman);
    const centerX = 454.765;
    const p = data.petugas;

    // Dynamic Main Statement Paragraph (Justified & Auto-Wrapped, No Margin Overflow)
    text = replaceBlock(
      text,
      'BT 41.516 550.606 Td 3.425 Tw /F1 11.2 Tf  [(Menerangkan',
      '[(benar tidak menggunakan kendaraan dinas.)] TJ ET',
      () => formatSuperParagraph(data.superNo, data.tglPelaksanaan, font),
      'Surat Pernyataan paragraf'
    );

    // 1. Data di bagian atas (kiri)
    text = replaceStrict(text, 'BT 163.293 674.662 Td /F1 11.2 Tf  [(NUR JANNAH)] TJ ET',
      `BT 163.293 674.662 Td /F1 11.2 Tf  [(${escapePdfText(p.nama)})] TJ ET`, 'Surat Pernyataan nama');
    text = replaceStrict(text, 'BT 163.293 647.797 Td /F1 11.2 Tf  [(7301034811760004)] TJ ET',
      `BT 163.293 647.797 Td /F1 11.2 Tf  [(${escapePdfText(p.nip)})] TJ ET`, 'Surat Pernyataan NIP');

    // Jabatan
    text = replaceStrict(text, 'Mitra Sensus/Survei', escapePdfText(p.jabatan), 'Surat Pernyataan jabatan');

    // Unit Kerja
    if (p.unitKerja) {
      const targetUK = 'BT 146.665 594.067 Td /F1 11.2 Tf  [(:)] TJ ET';
      const addition = targetUK + '\n' + `BT 163.293 594.067 Td /F1 11.2 Tf  [(${escapePdfText(p.unitKerja)})] TJ ET`;
      text = replaceStrict(text, targetUK, addition, 'Surat Pernyataan unit kerja');
    }

    // 2. Blok Tanda Tangan Bawah (Presisi Rata Tengah / Centered)
    const tglSpdStr = `Kepulauan Selayar, ${data.tglSpdIndo}`;
    const dateStartX = (centerX - (font.widthOfTextAtSize(tglSpdStr, 11.2) / 2)).toFixed(3);
    text = replaceStrict(text, 'BT 382.093 316.545 Td /F1 11.2 Tf  [(Kepulauan Selayar, 20 Juli 2026)] TJ ET',
      `BT ${dateStartX} 316.545 Td /F1 11.2 Tf  [(${escapePdfText(tglSpdStr)})] TJ ET`, 'Surat Pernyataan tanggal');

    const namaStartX = (centerX - (font.widthOfTextAtSize(p.nama, 11.2) / 2)).toFixed(3);
    text = replaceStrict(text, 'BT 419.590 243.720 Td /F1 11.2 Tf  [(NUR JANNAH)] TJ ET',
      `BT ${namaStartX} 243.720 Td /F1 11.2 Tf  [(${escapePdfText(p.nama)})] TJ ET`, 'Surat Pernyataan nama TTD');

    let nipBottomStr = p.nip;
    if (!/^(NIP|NIK)\.?\s*/i.test(nipBottomStr) && nipBottomStr) {
      nipBottomStr = 'NIP. ' + nipBottomStr;
    }
    const nipStartX = (centerX - (font.widthOfTextAtSize(nipBottomStr, 11.2) / 2)).toFixed(3);
    text = replaceStrict(text, 'BT 398.490 227.355 Td /F1 11.2 Tf  [(NIP. 7301034811760004)] TJ ET',
      `BT ${nipStartX} 227.355 Td /F1 11.2 Tf  [(${escapePdfText(nipBottomStr)})] TJ ET`, 'Surat Pernyataan NIP TTD');

    writeStream(doc, page, text, warnings);
    return doc;
  }

  // ---------------------------------------------------------------------------
  // Bundle
  // ---------------------------------------------------------------------------

  /**
   * SPD document for the chosen format.
   */
  async function renderSpd(spdBytes, data, warnings) {
    return renderSpdLampiranF1(spdBytes, data, warnings);
  }

  /**
   * Render every document for one person.
   * templates: { st, spd, super } as Uint8Array.
   * Returns { st, spd, super, merged, pageCount, warnings } (PDFDocument objects).
   */
  async function buildBundle(data, templates) {
    assertValid(data);
    const warnings = [];
    const [st, spd, sup] = await Promise.all([
      renderST(templates.st, data, warnings),
      renderSpd(templates.spd, data, warnings),
      renderSuper(templates.super, data, warnings)
    ]);
    const merged = await PDFDocument.create();
    await appendDocs(merged, [st, spd, sup]);
    return { st, spd, super: sup, merged, pageCount: merged.getPageCount(), warnings };
  }

  async function appendDocs(target, docs) {
    for (const d of docs) {
      const pages = await target.copyPages(d, d.getPageIndices());
      pages.forEach(p => target.addPage(p));
    }
    return target;
  }

  return {
    buildBundle,
    appendDocs,
    renderST,
    renderSpd,
    renderSpdLampiranF1,
    renderSuper,
    buildMiddleBlockST
  };
});
