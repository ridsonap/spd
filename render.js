/**
 * SPDRender: builds the PDF documents (ST, SPD Format 1/2, Surat Pernyataan) from the
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

  const { escapePdfText, wrapText, wrapByWidth, encodeLatin1, replaceStrict } = Core;
  const { PDFDocument, PDFName, StandardFonts, rgb } = PDFLib;

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

  function assertFits(font, str, maxWidth, label) {
    if (font.widthOfTextAtSize(str, 12) > maxWidth) {
      throw new Error(`"${str}" terlalu panjang untuk kolom ${label}. Gunakan nama yang lebih singkat.`);
    }
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

  // Section III geometry on the A4 template (measured from the official Format 2
  // example and mapped onto the template grid).
  const III = {
    shift: 151.185, // CATATAN block moves down by this much
    left: { label: 29.096, colon: 109.885, value: 136.814, center: 162.993 },
    right: { text: 299.140, center: 432.287, width: 266.294 },
    rowY: [482.525, 468.269, 452.513],
    paraY0: 482.525,
    leading: 14.256,
    titleY: 422.126,
    nameY: 364.207,
    underlineY: 361.627,
    nipY: 347.846,
    bottomY: 343.870,
    topY: 495.055,
    colX: 297.640
  };

  // The official example has no "Pada Tanggal" under the paragraph on the right.
  const III_KANAN_PAKAI_TANGGAL = false;

  function sectionIII(data, fonts) {
    const ops = [];
    const r = fonts.regular;
    const b = fonts.bold;
    const center = (cx, y, str, font, f) => ops.push(textOp(cx - f.widthOfTextAtSize(str, 12) / 2, y, str, font));

    assertFits(r, data.tempatBerangkat, III.colX - 1.5 - III.left.value, 'Tiba di (bagian III)');

    // Left: Tiba di / (Tempat Kedudukan) / Pada Tanggal
    ops.push(textOp(III.left.label, III.rowY[0], 'Tiba di'));
    ops.push(textOp(III.left.colon, III.rowY[0], ':'));
    ops.push(textOp(III.left.value, III.rowY[0], data.tempatBerangkat));
    ops.push(textOp(III.left.value, III.rowY[1], '(Tempat Kedudukan)'));
    ops.push(textOp(III.left.label, III.rowY[2], 'Pada Tanggal'));
    ops.push(textOp(III.left.colon, III.rowY[2], ':'));
    ops.push(textOp(III.left.value, III.rowY[2], data.tglSelesaiIndo));

    // Right: verification paragraph
    const para = 'Telah diperiksa dengan keterangan bahwa perjalanan tersebut atas perintahnya dan ' +
      'semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat singkatnya';
    const lines = wrapByWidth(para, s => r.widthOfTextAtSize(s, 12), III.right.width - 1.5);
    lines.forEach((ln, i) => ops.push(textOp(III.right.text, III.paraY0 - i * III.leading, ln)));
    if (III_KANAN_PAKAI_TANGGAL) {
      const y = III.paraY0 - lines.length * III.leading;
      ops.push(textOp(III.right.text, y, 'Pada Tanggal'));
      ops.push(textOp(379.178, y, ':'));
      ops.push(textOp(406.107, y, data.tglSelesaiIndo));
    }

    // Both signature blocks: PPK
    for (const cx of [III.left.center, III.right.center]) {
      center(cx, III.titleY, 'Pejabat Pembuat Komitmen', 'F1', r);
      const w = b.widthOfTextAtSize(data.ppk.nama, 12);
      ops.push(textOp(cx - w / 2, III.nameY, data.ppk.nama, 'F2'));
      ops.push(lineOp(cx - w / 2, III.underlineY, cx + w / 2, III.underlineY, 0.6));
      center(cx, III.nipY, `Nip. ${data.ppk.nip}`, 'F1', r);
    }

    // Grid: column separator and bottom rule (top rule is the section II bottom line)
    ops.push(lineOp(III.colX, III.topY + 0.375, III.colX, III.bottomY - 0.375, 1.5));
    ops.push(lineOp(28.346, III.bottomY, 298.390, III.bottomY, 0.75));
    ops.push(lineOp(296.890, III.bottomY, 566.934, III.bottomY, 0.75));
    return ops.join('\n');
  }

  /**
   * SPD lampiran Format 2: Format 1 lampiran with section III filled in. The CATATAN
   * block is translated down with a cm operator to make room.
   */
  async function renderSpdLampiranF2(spdBytes, data, warnings) {
    assertValid(data);
    const { doc, page, text: src } = await openTemplate(spdBytes);
    const fonts = await lampiranFonts(doc);
    assertFits(fonts.regular, data.tempatBerangkat, 566.934 - 1.5 - 406.107, 'Berangkat dari');
    let text = applyLampiranReplacements(src, data, data.tempatBerangkat, fonts.bold);
    text = replaceBlock(
      text,
      'BT 29.096 482.525 Td /F1 12.0 Tf  [(CATATAN LAIN - LAIN)] TJ ET',
      '[(kesalahan, kelalaian dan kealpaannya.)] TJ ET',
      (block) => `${sectionIII(data, fonts)}\nq 1 0 0 1 0 -${fmt(III.shift)} cm\n${block}\nQ`,
      'SPD catatan lain-lain'
    );
    writeStream(doc, page, text, warnings);
    return doc;
  }

  // ---------------------------------------------------------------------------
  // SPD halaman depan Format 2 (drawn from scratch)
  // ---------------------------------------------------------------------------

  // Geometry from the official example (US Letter) scaled to A4 width.
  const S = 595.28 / 612;
  const X = {
    no: 14.173 * S,
    sub: 31.683 * S,
    label: 49.192 * S,
    pengikutNama: 189.269 * S,
    anggaranLabel: 247.635 * S,
    value: 306 * S,
    uraian: 364.365 * S,
    right: 597.827 * S
  };
  const PAD = 0.75;
  const SIZE = 12;
  const LEADING = 14.256;
  const ROW_PAD = 1.5;
  const ASCENT = 12.155; // distance from a rule to the first baseline below it
  const TOP_Y = 799.889; // "Nomor" baseline, aligned with the lampiran template
  const BOTTOM_LIMIT = 36;

  /**
   * Draw SPD halaman depan on a new A4 page of `doc`.
   * Returns { page, boxes } where boxes are the text bounding boxes (used by tests).
   */
  async function drawSpdDepanF2(doc, data) {
    const page = doc.addPage([595.28, 841.89]);
    const regular = await doc.embedFont(StandardFonts.TimesRoman);
    const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const black = rgb(0, 0, 0);
    const boxes = [];
    const width = (s, f) => (f || regular).widthOfTextAtSize(s, SIZE);

    const text = (str, x, y, font) => {
      if (!str) return;
      const f = font || regular;
      page.drawText(str, { x, y, size: SIZE, font: f, color: black });
      boxes.push({ text: str, x, y: y - 0.217 * SIZE, w: width(str, f), h: 0.9 * SIZE });
    };
    const line = (x1, y1, x2, y2, thickness) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: black });
    };
    const wrap = (str, x0, x1) => wrapByWidth(str, s => width(s), x1 - x0 - PAD * 2);

    // Header
    // Offsets inside a label/colon/value group are font metrics, so they are not scaled.
    const nomorX = 297.673 * S;
    const colonX = nomorX + 40.32;
    const valX = nomorX + 46.656;
    text('Nomor', nomorX, TOP_Y);
    text(':', colonX, TOP_Y);
    text(data.spdNo, valX, TOP_Y);
    text('Lembar', nomorX, TOP_Y - 17.256);
    text(':', colonX, TOP_Y - 17.256);
    [Core.KANTOR.instansi].concat(Core.KANTOR.alamat).forEach((s, i) => {
      text(s, 16.423 * S, TOP_Y - 36.012 - i * 17.256);
    });

    // Table rows: each group is a numbered item, each sub-row a line of the item.
    const lama = data.lamaHari ? `${data.lamaHari} hari` : '';
    const groups = [
      { no: '1.', rows: [{ label: 'Pejabat Pembuat Komitmen', value: data.ppk.nama }] },
      { no: '2.', rows: [{ label: 'Nama pegawai yang melaksanakan perjalanan dinas', value: data.petugas.nama }] },
      { no: '3.', rows: [
        { sub: 'a.', label: 'Pangkat dan golongan', value: data.petugas.golongan },
        { sub: 'b.', label: 'Jabatan/ instansi', value: data.petugas.jabatanInstansi },
        { sub: 'c.', label: 'Tingkat Biaya Perjalanan Dinas', value: data.tingkatBiaya }
      ] },
      { no: '4.', rows: [{ label: 'Maksud perjalanan dinas', value: data.tujuan }] },
      { no: '5.', rows: [{ label: 'Alat Angkutan yang dipergunakan', value: data.alatAngkut }] },
      { no: '6.', rows: [
        { sub: 'a.', label: 'Tempat keberangkatan', value: data.tempatBerangkat },
        { sub: 'b.', label: 'Tempat tujuan', value: data.kecTujuan }
      ] },
      { no: '7.', rows: [
        { sub: 'a.', label: 'Lamanya perjalanan Dinas', value: lama },
        { sub: 'b.', label: 'Tanggal Berangkat', value: data.tglMulaiIndo },
        { sub: 'c.', label: 'Tanggal harus kembali/ tiba ditempat baru *)', value: data.tglSelesaiIndo }
      ] },
      { no: '8.', pengikut: true, rows: [{ label: 'Pengikut :', minLines: 2 }] },
      { no: '9.', rows: [
        { label: 'Pembebanan anggaran', anggaran: ['Program', data.anggaran.program] },
        { anggaran: ['Kegiatan', data.anggaran.kegiatan] },
        { anggaran: ['Komponen', data.anggaran.komponen] },
        { sub: 'a.', label: 'Instansi', value: data.instansi },
        { sub: 'b.', label: 'Mata anggaran', value: data.mataAnggaran }
      ] },
      { no: '10.', rows: [{ label: 'Keterangan lain-lain', value: data.keterangan }] }
    ];

    const fullRule = (y, w) => line(X.no, y, X.right, y, w);
    let y = TOP_Y - 77.875;
    groups.forEach((g, gi) => {
      const ruleW = gi === 0 ? 1.5 : 0.75;
      fullRule(y, ruleW);
      const groupTop = y;
      y -= ruleW / 2;
      g.rows.forEach((row, ri) => {
        const labelX0 = row.sub ? X.label : X.sub;
        const labelX1 = row.anggaran ? X.anggaranLabel : X.value;
        const labelLines = row.label ? wrap(row.label, labelX0, labelX1) : [];
        let valueLines = [];
        let uraianLines = [];
        if (row.anggaran) {
          valueLines = row.anggaran[1].kode ? [row.anggaran[1].kode] : [];
          uraianLines = row.anggaran[1].uraian ? wrap(row.anggaran[1].uraian, X.uraian, X.right) : [];
        } else if (row.value) {
          valueLines = wrap(row.value, X.value, X.right);
        }
        const n = Math.max(1, row.minLines || 1, labelLines.length, valueLines.length, uraianLines.length);
        const base = y - ASCENT;
        if (ri === 0) text(g.no, X.no + PAD, base);
        if (row.sub) text(row.sub, X.sub + PAD, base);
        labelLines.forEach((s, i) => text(s, labelX0 + PAD, base - i * LEADING));
        if (row.anggaran) text(row.anggaran[0], X.anggaranLabel + PAD, base);
        valueLines.forEach((s, i) => text(s, X.value + PAD * 2, base - i * LEADING));
        uraianLines.forEach((s, i) => text(s, X.uraian + PAD, base - i * LEADING));
        if (g.pengikut) {
          text('Nama', X.pengikutNama + PAD, base);
          text('Umur', 321.185 * S, base);
          text('Hubungan keluarga/keterangan', 406.327 * S, base);
        }
        y -= n * LEADING + ROW_PAD;
      });
      y -= 0.375;
      line(X.value, groupTop + ruleW / 2, X.value, y, 1.5);
      if (g.pengikut) line(X.uraian, groupTop + ruleW / 2, X.uraian, y, 1.5);
    });
    fullRule(y, 1.5);
    const tableBottom = y;

    // Signature block (right) and tembusan (left)
    const sigTop = tableBottom - 21.905;
    const center = 429.823 * S;
    const centered = (s, yy, font) => text(s, center - width(s, font) / 2, yy, font);
    const sigLabelX = 297.673 * S;
    text('Dikeluarkan di', sigLabelX, sigTop);
    text(':', sigLabelX + 74.652, sigTop);
    text(Core.KANTOR.kotaTerbit, sigLabelX + 80.988, sigTop);
    text('Pada Tanggal', sigLabelX, sigTop - 17.256);
    text(':', sigLabelX + 74.652, sigTop - 17.256);
    text(data.tglSpdIndo, sigLabelX + 80.988, sigTop - 17.256);
    centered('PEJABAT PEMBUAT KOMITMEN', sigTop - 50.268);
    wrap(data.ppk.program, X.value - 20, X.right).forEach((s, i) => centered(s, sigTop - 67.524 - i * LEADING));
    const nameY = sigTop - 129.943;
    centered(data.ppk.nama, nameY, bold);
    const wName = width(data.ppk.nama, bold);
    line(center - wName / 2, nameY - 2.58, center + wName / 2, nameY - 2.58, 0.6);
    centered(`NIP. ${data.ppk.nip}`, sigTop - 147.804);
    text('Tembusan disampaikan kepada :', X.no, sigTop - 164.310);
    text('1.', X.no, sigTop - 178.566);
    const lastY = sigTop - 192.822;
    text('2.', X.no, lastY);

    if (lastY < BOTTOM_LIMIT) {
      throw new Error('Isi halaman depan SPD melebihi 1 halaman. Perpendek Maksud perjalanan atau uraian anggaran.');
    }
    return { page, boxes };
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
   * SPD document for the chosen format: Format 1 = lampiran (1 page),
   * Format 2 = halaman depan + lampiran (2 pages).
   */
  async function renderSpd(spdBytes, data, warnings) {
    if (data.format !== 2) return renderSpdLampiranF1(spdBytes, data, warnings);
    assertValid(data);
    const doc = await PDFDocument.create();
    await drawSpdDepanF2(doc, data);
    const lampiran = await renderSpdLampiranF2(spdBytes, data, warnings);
    const [p] = await doc.copyPages(lampiran, [0]);
    doc.addPage(p);
    return doc;
  }

  async function renderSpdDepanF2(data) {
    assertValid(data);
    const doc = await PDFDocument.create();
    const { boxes } = await drawSpdDepanF2(doc, data);
    return { doc, boxes };
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
    renderSpdLampiranF2,
    renderSpdDepanF2,
    renderSuper,
    buildMiddleBlockST
  };
});
