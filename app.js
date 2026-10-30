/**
 * Generator Surat Tugas, SPD, dan Surat Pernyataan BPS Kabupaten Kepulauan Selayar
 * Format: Master Template BPS (Mode Satuan & Batch Excel)
 */

(function () {
  'use strict';

  // DOM Elements
  const el = {
    // Mode Switch
    modeSingleBtn: document.getElementById('mode-single-btn'),
    modeBatchBtn: document.getElementById('mode-batch-btn'),
    singleModeSection: document.getElementById('single-mode-section'),
    batchModeSection: document.getElementById('batch-mode-section'),

    // Single Form
    form: document.getElementById('generator-form'),
    radioOrganik: document.getElementById('radio-organik'),
    radioNonorganik: document.getElementById('radio-nonorganik'),
    labelPetugasOrganik: document.getElementById('label-petugas-organik'),
    labelPetugasNonorganik: document.getElementById('label-petugas-nonorganik'),
    containerOrganik: document.getElementById('container-organik'),
    containerNonorganik: document.getElementById('container-nonorganik'),
    selectPegawaiOrganik: document.getElementById('select-pegawai-organik'),
    organikInfoText: document.getElementById('organik-info-text'),
    inputNama: document.getElementById('input-nama'),
    inputNip: document.getElementById('input-nip'),
    inputJabatan: document.getElementById('input-jabatan'),

    noSurat: document.getElementById('input-no-surat'),
    tglSpd: document.getElementById('input-tgl-spd'),
    tglSpdPreview: document.getElementById('tgl-spd-preview'),
    selectKecamatanAsal: document.getElementById('select-kecamatan-asal'),
    selectKecamatan: document.getElementById('select-kecamatan'),
    syncDatesCheckbox: document.getElementById('sync-dates-checkbox'),
    tglPerjalananContainer: document.getElementById('tgl-perjalanan-container'),
    tglMulai: document.getElementById('input-tgl-mulai'),
    tglSelesai: document.getElementById('input-tgl-selesai'),
    inputTujuan: document.getElementById('input-tujuan'),
    inputPembebanan: document.getElementById('input-pembebanan'),
    inputUraianBeban: document.getElementById('input-uraian-beban'),
    inputTglSt: document.getElementById('input-tgl-st'),
    inputUnitKerja: document.getElementById('input-unit-kerja'),
    accordionToggle: document.getElementById('accordion-toggle'),
    accordionContent: document.getElementById('accordion-content'),
    accordionIndicator: document.getElementById('accordion-indicator'),

    // Single Summary
    sumNoSt: document.getElementById('sum-no-st'),
    sumNoSpd: document.getElementById('sum-no-spd'),
    sumTglSpd: document.getElementById('sum-tgl-spd'),
    sumWaktu: document.getElementById('sum-waktu'),
    sumKecamatan: document.getElementById('sum-kecamatan'),
    sumPetugas: document.getElementById('sum-petugas'),
    sumJabatan: document.getElementById('sum-jabatan'),
    sumTujuan: document.getElementById('sum-tujuan'),

    // Single Actions
    btnGenerate: document.getElementById('btn-generate'),
    btnDownloadMerged: document.getElementById('btn-download-merged'),
    btnDownloadSt: document.getElementById('btn-download-st'),
    btnDownloadSpd: document.getElementById('btn-download-spd'),
    btnDownloadSuper: document.getElementById('btn-download-super'),

    // Batch Excel Elements
    btnDownloadTemplate: document.getElementById('btn-download-template'),
    dropzone: document.getElementById('dropzone'),
    excelFileInput: document.getElementById('excel-file-input'),
    batchPreviewContainer: document.getElementById('batch-preview-container'),
    batchCount: document.getElementById('batch-count'),
    batchTbody: document.getElementById('batch-tbody'),
    btnClearBatch: document.getElementById('btn-clear-batch'),
    btnGenerateBatchPdf: document.getElementById('btn-generate-batch-pdf'),
    btnGenerateBatchZip: document.getElementById('btn-generate-batch-zip'),
    batchProgress: document.getElementById('batch-progress'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    progressText: document.getElementById('progress-text'),

    // Preview Toolbar
    tabMerged: document.getElementById('tab-merged'),
    tabSt: document.getElementById('tab-st'),
    tabSpd: document.getElementById('tab-spd'),
    tabSuper: document.getElementById('tab-super'),
    btnPrint: document.getElementById('btn-print'),
    pdfViewer: document.getElementById('pdf-viewer'),
    emptyState: document.getElementById('empty-state'),
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toast-text'),
  };

  // State
  const state = {
    stBlobUrl: null,
    spdBlobUrl: null,
    superBlobUrl: null,
    mergedBlobUrl: null,
    activeTab: 'merged',
    batchData: [],
    petugasMode: 'organik', // 'organik' | 'nonorganik'
  };

  const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  /**
   * Format date into Indonesian locale "D MMMM YYYY"
   */
  function formatIndoDate(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    if (/[a-zA-Z]/.test(str)) return str;

    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (m >= 1 && m <= 12) {
        return `${d} ${INDO_MONTHS[m - 1]} ${y}`;
      }
    }
    return str;
  }

  /**
   * Format nomor surat for ST/Super and SPD
   */
  function formatNomor(raw) {
    let cleaned = (raw || 'B-11/7301/VS.330/2026').trim();
    cleaned = cleaned.replace(/^NOMOR\s*:\s*/i, '');

    let stNo = cleaned;
    let spdNo = cleaned;

    if (!/^B-/i.test(cleaned)) {
      stNo = `B-${cleaned}`;
    }
    if (/^B-/i.test(cleaned)) {
      spdNo = cleaned.replace(/^B-/i, '');
    }

    return { stNo, spdNo, superNo: stNo };
  }

  /**
   * Format kecamatan name with "Kecamatan " prefix
   */
  function formatKecamatan(raw) {
    let kec = (raw || 'Bontomatene').trim();
    if (!/^kecamatan\s+/i.test(kec)) {
      kec = `Kecamatan ${kec}`;
    }
    return kec.replace(/^kecamatan/i, 'Kecamatan');
  }

  /**
   * Escape special characters in PDF literal text strings
   */
  function escapePdfText(str) {
    return (str || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  /**
   * Wrap text into multiple lines for Surat Tugas tujuan field
   * Respects manual linebreaks and wraps long lines
   */
  function wrapText(text, maxChars = 52) {
    text = (text || '').trim();
    if (!text) return [''];
    const rawParagraphs = text.split(/\r?\n/);
    const lines = [];
    for (const para of rawParagraphs) {
      const p = para.trim();
      if (!p) continue;
      const words = p.split(/\s+/);
      let currentLine = '';
      for (const w of words) {
        if ((currentLine ? currentLine + ' ' + w : w).length <= maxChars) {
          currentLine = currentLine ? currentLine + ' ' + w : w;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = w;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines.length > 0 ? lines : [''];
  }

  /**
   * Build dynamic middle block for Surat Tugas (Tujuan, Waktu, Pembebanan)
   * Automatically adapts Y-positions whether Tujuan is 1 line, 2 lines, 3 lines, or more
   */
  function buildMiddleBlockST(opts) {
    const kecFormatted = formatKecamatan(opts.kecamatan);
    const defaultTujuan = `Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di ${kecFormatted}`;
    const tujuanText = opts.tujuan || defaultTujuan;
    const tujuanLines = wrapText(tujuanText, 52);

    const tglMulai = formatIndoDate(opts.tglMulai || opts.tglSpd);
    const tglSelesai = formatIndoDate(opts.tglSelesai || opts.tglMulai || opts.tglSpd);
    const waktuStr = `${tglMulai} s.d. ${tglSelesai}`;

    const bebanAkun = opts.pembebanan || 'GG 2902 BMA 006 530 B 524113 2';
    const bebanUraian = opts.uraianBeban || 'Transport Daerah Sulit';

    let y = 499.179;
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
    parts.push(`BT 222.443 ${waktuY.toFixed(3)} Td /F1 12.0 Tf  [(${escapePdfText(waktuStr)})] TJ ET`);

    // 3. Pembebanan
    const beban1Y = waktuY - 17.256;
    parts.push(`BT 58.943 ${beban1Y.toFixed(3)} Td /F1 12.0 Tf  [(Pembebanan)] TJ ET`);
    parts.push(`BT 211.943 ${beban1Y.toFixed(3)} Td /F1 12.0 Tf  [(:)] TJ ET`);
    parts.push(`BT 222.443 ${beban1Y.toFixed(3)} Td /F1 12.0 Tf  [(${escapePdfText(bebanAkun)})] TJ ET`);

    if (bebanUraian) {
      const beban2Y = beban1Y - 14.256;
      parts.push(`BT 222.443 ${beban2Y.toFixed(3)} Td /F1 12.0 Tf  [(${escapePdfText(bebanUraian)})] TJ ET`);
    }

    return parts.join('\n');
  }

  /**
   * Toast notification
   */
  function showToast(msg) {
    if (el.toastText) el.toastText.textContent = msg;
    else el.toast.textContent = msg;
    el.toast.style.display = 'inline-flex';
    setTimeout(() => {
      el.toast.style.display = 'none';
    }, 3000);
  }

  /**
   * Base64 to Uint8Array helper
   */
  function base64ToBytes(base64) {
    const binString = atob(base64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Load base template bytes (embedded base64 or fetch)
   */
  async function loadTemplate(name) {
    if (window.PDF_TEMPLATES && window.PDF_TEMPLATES[name]) {
      return base64ToBytes(window.PDF_TEMPLATES[name]);
    }
    const path = `templates/${name}_template.pdf`;
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Gagal memuat template: ${name}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  /**
   * Populate Pegawai Organik dropdown
   */
  function populatePegawaiDropdown() {
    const list = window.PEGAWAI_ORGANIK || [];
    el.selectPegawaiOrganik.innerHTML = '';

    list.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${p.nama} — ${p.jabatan}`;
      el.selectPegawaiOrganik.appendChild(opt);
    });

    // Default select index 18 (Ridson Al Farizal P., S.Tr.Stat.) or 0
    if (list.length > 18) {
      el.selectPegawaiOrganik.selectedIndex = 18;
    } else if (list.length > 0) {
      el.selectPegawaiOrganik.selectedIndex = 0;
    }

    updateOrganikBadge();
  }

  /**
   * Update selected organic staff info badge
   */
  function updateOrganikBadge() {
    const list = window.PEGAWAI_ORGANIK || [];
    const idx = parseInt(el.selectPegawaiOrganik.value, 10);
    const p = list[idx];
    if (p) {
      el.organikInfoText.textContent = `NIP: ${p.nip} | Gol: ${p.golongan || '-'} | Jabatan: ${p.jabatan}`;
    }
  }

  /**
   * Get current active petugas details
   */
  function getCurrentPetugas() {
    if (state.petugasMode === 'organik') {
      const list = window.PEGAWAI_ORGANIK || [];
      const idx = parseInt(el.selectPegawaiOrganik.value, 10);
      const p = list[idx] || {
        nama: 'RIDSON AL FARIZAL P., S.TR.STAT.',
        nip: '200110192023101002',
        jabatan: 'Statistisi Ahli Pertama'
      };
      return {
        isOrganik: true,
        nama: p.nama,
        nip: p.nip,
        jabatan: p.jabatan,
        unitKerja: el.inputUnitKerja.value || 'BPS Kabupaten Kepulauan Selayar'
      };
    } else {
      return {
        isOrganik: false,
        nama: el.inputNama.value || 'Nur Jannah',
        nip: el.inputNip.value || '7301034811760004',
        jabatan: el.inputJabatan.value || 'Petugas Lapangan Sensus (PPL Sensus)',
        unitKerja: el.inputUnitKerja.value || ''
      };
    }
  }

  /**
   * Update live summary
   */
  function updateSummary() {
    const tglSpdVal = el.tglSpd.value || '2026-07-20';
    const tglMulaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglMulai.value || tglSpdVal);
    const tglSelesaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglSelesai.value || tglMulaiVal);

    const tglSpdIndo = formatIndoDate(tglSpdVal);
    const tglMulaiIndo = formatIndoDate(tglMulaiVal);
    const tglSelesaiIndo = formatIndoDate(tglSelesaiVal);

    el.tglSpdPreview.textContent = tglSpdIndo;

    const { stNo, spdNo } = formatNomor(el.noSurat.value);
    const kecAsal = formatKecamatan(el.selectKecamatanAsal ? el.selectKecamatanAsal.value : 'Benteng');
    const kecTujuan = formatKecamatan(el.selectKecamatan.value || 'Bontomatene');
    const petugas = getCurrentPetugas();

    el.sumNoSt.textContent = stNo;
    el.sumNoSpd.textContent = spdNo;
    el.sumTglSpd.textContent = tglSpdIndo;
    el.sumWaktu.textContent = `${tglMulaiIndo} s.d. ${tglSelesaiIndo}`;
    el.sumKecamatan.textContent = `${kecAsal} → ${kecTujuan}`;
    el.sumPetugas.textContent = `${petugas.nama} (${petugas.nip}) [${petugas.isOrganik ? 'Organik' : 'Mitra'}]`;
    el.sumJabatan.textContent = petugas.jabatan;
    if (el.sumTujuan) el.sumTujuan.textContent = el.inputTujuan.value || '-';
  }

  /**
   * Generate ST Document
   */
  async function generateST(stBytes, opts) {
    const { PDFDocument, PDFName } = window.PDFLib;
    const doc = await PDFDocument.load(stBytes);
    const page = doc.getPages()[0];
    const stream = doc.context.lookup(page.node.Contents());
    let text = new TextDecoder('latin1').decode(window.pako.inflate(stream.getContents()));

    const { stNo } = formatNomor(opts.noSurat);

    // 1. Nomor
    text = text.replace('B-114.21/7301/SS.330/2026', stNo);

    // 2. Nama Petugas (sesuai database untuk organik, sesuai input user untuk mitra - tidak dicapslock)
    text = text.replaceAll('NUR JANNAH', (opts.nama || 'Nur Jannah').trim());

    // 3. Jabatan Petugas
    text = text.replace(/Petugas Lapangan Sensus \\\([^\)]*\\\)/, escapePdfText(opts.jabatan || 'Petugas Lapangan Sensus (PPL Sensus)'));

    // 4. Dynamic Middle Block: Tujuan, Waktu, Pembebanan
    const startMarker = 'BT 58.943 499.179 Td /F1 12.0 Tf  [(Tujuan/Tugas)] TJ ET';
    const endMarker = 'BT 222.443 433.155 Td /F1 12.0 Tf  [(Transport Daerah Sulit)] TJ ET';
    const startIdx = text.indexOf(startMarker);
    const endIdx = text.indexOf(endMarker);
    const newMiddle = buildMiddleBlockST(opts);

    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(0, startIdx) + newMiddle + text.substring(endIdx + endMarker.length);
    } else {
      // Fallback regex in case of slight whitespace variance
      const middleRegex = /BT 58\.943 499\.179 Td[\s\S]*?BT 222\.443 433\.155 Td \/F1 12\.0 Tf  \[\(Transport Daerah Sulit\)\] TJ ET/;
      text = text.replace(middleRegex, newMiddle);
    }

    // 5. Tanggal TTD ST
    if (opts.tglSt) {
      text = text.replace('Kepulauan Selayar, 15 Juni 2026', `Kepulauan Selayar, ${formatIndoDate(opts.tglSt)}`);
    }

    page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(new TextEncoder().encode(text))));
    return doc;
  }

  /**
   * Generate SPD Document
   */
  async function generateSPD(spdBytes, opts) {
    const { PDFDocument, PDFName } = window.PDFLib;
    const doc = await PDFDocument.load(spdBytes);
    const page = doc.getPages()[0];
    const stream = doc.context.lookup(page.node.Contents());
    let text = new TextDecoder('latin1').decode(window.pako.inflate(stream.getContents()));

    const { spdNo } = formatNomor(opts.noSurat);
    const kecAsal = formatKecamatan(opts.kecamatanAsal || 'Benteng');
    const kecTujuan = formatKecamatan(opts.kecamatan || 'Bontomatene');
    const tglBerangkat = formatIndoDate(opts.tglMulai || opts.tglSpd);
    const tglPulang = formatIndoDate(opts.tglSelesai || opts.tglMulai || opts.tglSpd);

    // Nomor SPD
    text = text.replaceAll('114.21/7301/SS.330/2026', spdNo);

    // 1. Kolom I: Berangkat dari (Tempat Kedudukan) -> kecAsal
    text = text.replace(
      'BT 406.107 741.377 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET',
      `BT 406.107 741.377 Td /F1 12.0 Tf  [(${escapePdfText(kecAsal)})] TJ ET`
    );

    // 2. Kolom I: Pada Tanggal -> tglBerangkat
    text = text.replace(
      'BT 406.107 711.365 Td /F1 12.0 Tf  [(20 Juli 2026)] TJ ET',
      `BT 406.107 711.365 Td /F1 12.0 Tf  [(${escapePdfText(tglBerangkat)})] TJ ET`
    );

    // 3. Kolom I: Ke -> kecTujuan
    text = text.replace(
      'BT 406.107 695.609 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET',
      `BT 406.107 695.609 Td /F1 12.0 Tf  [(${escapePdfText(kecTujuan)})] TJ ET`
    );

    // 4. Kolom II (Kiri): Tiba di -> kecTujuan
    text = text.replace(
      'BT 136.814 589.067 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET',
      `BT 136.814 589.067 Td /F1 12.0 Tf  [(${escapePdfText(kecTujuan)})] TJ ET`
    );

    // 5. Kolom II (Kiri): Pada Tanggal (tiba) -> tglBerangkat
    text = text.replace(
      'BT 136.814 573.311 Td /F1 12.0 Tf  [(20 Juli 2026)] TJ ET',
      `BT 136.814 573.311 Td /F1 12.0 Tf  [(${escapePdfText(tglBerangkat)})] TJ ET`
    );

    // 6. Kolom II (Kanan): Berangkat dari -> kecTujuan
    text = text.replace(
      'BT 406.107 589.067 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET',
      `BT 406.107 589.067 Td /F1 12.0 Tf  [(${escapePdfText(kecTujuan)})] TJ ET`
    );

    // 7. Kolom II (Kanan): Ke -> kecAsal
    text = text.replace(
      'BT 406.107 573.311 Td /F1 12.0 Tf  [(Kecamatan Bontomatene)] TJ ET',
      `BT 406.107 573.311 Td /F1 12.0 Tf  [(${escapePdfText(kecAsal)})] TJ ET`
    );

    // 8. Kolom II (Kanan): Pada Tanggal (pulang) -> tglPulang
    text = text.replace(
      'BT 406.107 557.555 Td /F1 12.0 Tf  [(20 Juli 2026)] TJ ET',
      `BT 406.107 557.555 Td /F1 12.0 Tf  [(${escapePdfText(tglPulang)})] TJ ET`
    );

    page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(new TextEncoder().encode(text))));
    return doc;
  }

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

  /**
   * Generate Super Document
   */
  async function generateSuper(superBytes, opts) {
    const { PDFDocument, PDFName, StandardFonts } = window.PDFLib;
    const doc = await PDFDocument.load(superBytes);
    const page = doc.getPages()[0];
    const stream = doc.context.lookup(page.node.Contents());
    let text = new TextDecoder('latin1').decode(window.pako.inflate(stream.getContents()));

    const font = await doc.embedFont(StandardFonts.TimesRoman);
    const centerX = 454.765;

    const { superNo } = formatNomor(opts.noSurat);
    const tglSpd = formatIndoDate(opts.tglSpd);
    const tglMulai = formatIndoDate(opts.tglMulai || opts.tglSpd);
    const tglSelesai = formatIndoDate(opts.tglSelesai || opts.tglMulai || opts.tglSpd);
    const tglPelaksanaan = (tglMulai === tglSelesai) ? tglMulai : `${tglMulai} s.d. ${tglSelesai}`;

    // Dynamic Main Statement Paragraph (Justified & Auto-Wrapped, No Margin Overflow)
    const paraStartMarker = 'BT 41.516 550.606 Td 3.425 Tw /F1 11.2 Tf  [(Menerangkan';
    const paraEndMarker = '[(benar tidak menggunakan kendaraan dinas.)] TJ ET';
    const pStartIdx = text.indexOf(paraStartMarker);
    const pEndIdx = text.indexOf(paraEndMarker);

    if (pStartIdx !== -1 && pEndIdx !== -1) {
      const newParaBlock = formatSuperParagraph(superNo, tglPelaksanaan, font);
      text = text.substring(0, pStartIdx) + newParaBlock + text.substring(pEndIdx + paraEndMarker.length);
    }

    const namaVal = (opts.nama || 'Nur Jannah').trim();
    const nipVal = (opts.nip || '7301034811760004').trim();

    // 1. Data di bagian atas (kiri)
    text = text.replace(
      'BT 163.293 674.662 Td /F1 11.2 Tf  [(NUR JANNAH)] TJ ET',
      `BT 163.293 674.662 Td /F1 11.2 Tf  [(${escapePdfText(namaVal)})] TJ ET`
    );
    text = text.replace(
      'BT 163.293 647.797 Td /F1 11.2 Tf  [(7301034811760004)] TJ ET',
      `BT 163.293 647.797 Td /F1 11.2 Tf  [(${escapePdfText(nipVal)})] TJ ET`
    );

    // Jabatan in Super
    const superJabatan = opts.isOrganik ? (opts.jabatan || 'Statistisi Ahli Pertama') : (opts.jabatanSuper || opts.jabatan || 'Mitra Sensus/Survei');
    text = text.replace('Mitra Sensus/Survei', escapePdfText(superJabatan));

    // Unit Kerja for Organik
    const unitKerjaVal = opts.unitKerja || (opts.isOrganik ? 'BPS Kabupaten Kepulauan Selayar' : '');
    if (unitKerjaVal) {
      const targetUK = 'BT 146.665 594.067 Td /F1 11.2 Tf  [(:)] TJ ET';
      const addition = targetUK + '\n' + `BT 163.293 594.067 Td /F1 11.2 Tf  [(${escapePdfText(unitKerjaVal)})] TJ ET`;
      text = text.replace(targetUK, addition);
    }

    // 2. Blok Tanda Tangan Bawah (Presisi Rata Tengah / Centered)
    const tglSpdStr = `Kepulauan Selayar, ${tglSpd}`;
    const dateWidth = font.widthOfTextAtSize(tglSpdStr, 11.2);
    const dateStartX = (centerX - (dateWidth / 2)).toFixed(3);
    text = text.replace(
      'BT 382.093 316.545 Td /F1 11.2 Tf  [(Kepulauan Selayar, 20 Juli 2026)] TJ ET',
      `BT ${dateStartX} 316.545 Td /F1 11.2 Tf  [(${escapePdfText(tglSpdStr)})] TJ ET`
    );

    const namaWidth = font.widthOfTextAtSize(namaVal, 11.2);
    const namaStartX = (centerX - (namaWidth / 2)).toFixed(3);
    text = text.replace(
      'BT 419.590 243.720 Td /F1 11.2 Tf  [(NUR JANNAH)] TJ ET',
      `BT ${namaStartX} 243.720 Td /F1 11.2 Tf  [(${escapePdfText(namaVal)})] TJ ET`
    );

    let nipBottomStr = nipVal;
    if (!/^(NIP|NIK)\.?\s*/i.test(nipBottomStr) && nipBottomStr) {
      nipBottomStr = 'NIP. ' + nipBottomStr;
    }
    const nipWidth = font.widthOfTextAtSize(nipBottomStr, 11.2);
    const nipStartX = (centerX - (nipWidth / 2)).toFixed(3);
    text = text.replace(
      'BT 398.490 227.355 Td /F1 11.2 Tf  [(NIP. 7301034811760004)] TJ ET',
      `BT ${nipStartX} 227.355 Td /F1 11.2 Tf  [(${escapePdfText(nipBottomStr)})] TJ ET`
    );

    page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(new TextEncoder().encode(text))));
    return doc;
  }

  /**
   * Merge ST + SPD + Super into 1 PDF
   */
  async function generateMerged(stDoc, spdDoc, superDoc) {
    const { PDFDocument } = window.PDFLib;
    const mergedDoc = await PDFDocument.create();
    const [p1] = await mergedDoc.copyPages(stDoc, [0]);
    const [p2] = await mergedDoc.copyPages(spdDoc, [0]);
    const [p3] = await mergedDoc.copyPages(superDoc, [0]);
    mergedDoc.addPage(p1);
    mergedDoc.addPage(p2);
    mergedDoc.addPage(p3);
    return mergedDoc;
  }

  /**
   * Generate Single Set of Documents
   */
  async function generateSingle() {
    try {
      el.btnGenerate.disabled = true;
      el.btnGenerate.innerHTML = '<i class="bi bi-hourglass-split"></i> Memproses PDF...';

      const tglSpdVal = el.tglSpd.value || '2026-07-20';
      const tglMulaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglMulai.value || tglSpdVal);
      const tglSelesaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglSelesai.value || tglMulaiVal);
      const petugas = getCurrentPetugas();

      const opts = {
        noSurat: el.noSurat.value || 'B-11/7301/VS.330/2026',
        tglSpd: tglSpdVal,
        tglMulai: tglMulaiVal,
        tglSelesai: tglSelesaiVal,
        kecamatanAsal: el.selectKecamatanAsal ? el.selectKecamatanAsal.value : 'Benteng',
        kecamatan: el.selectKecamatan.value || 'Bontomatene',
        tujuan: el.inputTujuan.value,
        pembebanan: el.inputPembebanan.value,
        uraianBeban: el.inputUraianBeban.value,
        isOrganik: petugas.isOrganik,
        nama: petugas.nama,
        nip: petugas.nip,
        jabatan: petugas.jabatan,
        unitKerja: petugas.unitKerja,
        tglSt: el.inputTglSt.value
      };

      const [stBytes, spdBytes, superBytes] = await Promise.all([
        loadTemplate('st'),
        loadTemplate('spd'),
        loadTemplate('super')
      ]);

      const [stDoc, spdDoc, superDoc] = await Promise.all([
        generateST(stBytes, opts),
        generateSPD(spdBytes, opts),
        generateSuper(superBytes, opts)
      ]);

      const mergedDoc = await generateMerged(stDoc, spdDoc, superDoc);

      const [stBytesOut, spdBytesOut, superBytesOut, mergedBytesOut] = await Promise.all([
        stDoc.save(),
        spdDoc.save(),
        superDoc.save(),
        mergedDoc.save()
      ]);

      if (state.stBlobUrl) URL.revokeObjectURL(state.stBlobUrl);
      if (state.spdBlobUrl) URL.revokeObjectURL(state.spdBlobUrl);
      if (state.superBlobUrl) URL.revokeObjectURL(state.superBlobUrl);
      if (state.mergedBlobUrl) URL.revokeObjectURL(state.mergedBlobUrl);

      state.stBlobUrl = URL.createObjectURL(new Blob([stBytesOut], { type: 'application/pdf' }));
      state.spdBlobUrl = URL.createObjectURL(new Blob([spdBytesOut], { type: 'application/pdf' }));
      state.superBlobUrl = URL.createObjectURL(new Blob([superBytesOut], { type: 'application/pdf' }));
      state.mergedBlobUrl = URL.createObjectURL(new Blob([mergedBytesOut], { type: 'application/pdf' }));

      el.btnDownloadMerged.disabled = false;
      el.btnDownloadSt.disabled = false;
      el.btnDownloadSpd.disabled = false;
      el.btnDownloadSuper.disabled = false;
      el.btnPrint.disabled = false;

      updateViewerTab(state.activeTab);
      showToast('Berkas berhasil di-generate!');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      el.btnGenerate.disabled = false;
      el.btnGenerate.innerHTML = '<i class="bi bi-lightning-charge"></i> Generate Dokumen';
    }
  }

  /**
   * Switch preview tab
   */
  function updateViewerTab(tab) {
    state.activeTab = tab;
    [el.tabMerged, el.tabSt, el.tabSpd, el.tabSuper].forEach(btn => btn.classList.remove('active'));

    let targetUrl = null;
    if (tab === 'merged') {
      el.tabMerged.classList.add('active');
      targetUrl = state.mergedBlobUrl;
    } else if (tab === 'st') {
      el.tabSt.classList.add('active');
      targetUrl = state.stBlobUrl;
    } else if (tab === 'spd') {
      el.tabSpd.classList.add('active');
      targetUrl = state.spdBlobUrl;
    } else if (tab === 'super') {
      el.tabSuper.classList.add('active');
      targetUrl = state.superBlobUrl;
    }

    if (targetUrl) {
      el.emptyState.style.display = 'none';
      el.pdfViewer.style.display = 'block';
      el.pdfViewer.src = targetUrl;
    }
  }

  /**
   * Trigger download
   */
  function triggerDownload(url, filename) {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Parse date from Excel cell (supports serial number, DD/MM/YYYY, YYYY-MM-DD, or Indonesian text)
   */
  function parseExcelDate(val) {
    if (!val) return '';
    if (typeof val === 'number' && window.XLSX && window.XLSX.SSF) {
      const dateObj = window.XLSX.SSF.parse_date_code(val);
      if (dateObj) {
        return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      }
    }
    const str = String(val).trim();
    const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    return str;
  }

  /**
   * Download sample Excel template
   */
  function downloadExcelTemplate() {
    if (!window.XLSX) {
      alert('Library Excel belum siap. Silakan muat ulang halaman.');
      return;
    }

    const templateRows = [
      {
        'Nomor Surat': 'B-11/7301/VS.330/2026',
        'Tanggal SPD': '2026-07-20',
        'Kecamatan Asal': 'Benteng',
        'Kecamatan Tujuan': 'Bontomatene',
        'Kategori': 'Organik',
        'Nama Petugas': 'Ridson Al Farizal P., S.Tr.Stat.',
        'NIP': '200110192023101002',
        'Jabatan': 'Statistisi Ahli Pertama',
        'Tanggal Mulai': '2026-07-20',
        'Tanggal Selesai': '2026-07-20',
        'Tujuan': 'Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di Kecamatan Bontomatene',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2',
        'Uraian Pembebanan': 'Transport Daerah Sulit'
      },
      {
        'Nomor Surat': 'B-12/7301/VS.330/2026',
        'Tanggal SPD': '2026-07-24',
        'Kecamatan Asal': 'Benteng',
        'Kecamatan Tujuan': 'Bontomatene',
        'Kategori': 'Non-Organik',
        'Nama Petugas': 'Nur Jannah',
        'NIP': '7301034811760004',
        'Jabatan': 'Mitra Sensus/Survei',
        'Tanggal Mulai': '2026-07-24',
        'Tanggal Selesai': '2026-07-26',
        'Tujuan': 'Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di Kecamatan Bontomatene',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2',
        'Uraian Pembebanan': 'Transport Daerah Sulit'
      },
      {
        'Nomor Surat': 'B-13/7301/VS.330/2026',
        'Tanggal SPD': '2026-07-29',
        'Kecamatan Asal': 'Benteng',
        'Kecamatan Tujuan': 'Pasimarannu',
        'Kategori': 'Organik',
        'Nama Petugas': 'Takdir Khauripan, S.Si.',
        'NIP': '198704262011011006',
        'Jabatan': 'Kepala Subbagian Umum',
        'Tanggal Mulai': '2026-07-29',
        'Tanggal Selesai': '2026-07-31',
        'Tujuan': 'Koordinasi dan Evaluasi Administrasi di Kecamatan Pasimarannu',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2',
        'Uraian Pembebanan': 'Transport Daerah Sulit'
      }
    ];

    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(templateRows);
    window.XLSX.utils.book_append_sheet(wb, ws, 'Template SPD');
    window.XLSX.writeFile(wb, 'Template_Data_SPD.xlsx');
  }

  /**
   * Process uploaded Excel file
   */
  function handleExcelFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = window.XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          alert('File Excel kosong atau tidak memiliki data.');
          return;
        }

        const orgList = window.PEGAWAI_ORGANIK || [];

        // Normalize keys
        state.batchData = json.map((row, idx) => {
          const getVal = (patterns) => {
            // Pass 1: Exact match (case-insensitive)
            for (const p of patterns) {
              const pLower = p.toLowerCase().trim();
              for (const key of Object.keys(row)) {
                if (key.toLowerCase().trim() === pLower) {
                  return row[key];
                }
              }
            }
            // Pass 2: Substring match with safety against 'petugas' matching 'tugas'
            for (const p of patterns) {
              const pLower = p.toLowerCase().trim();
              for (const key of Object.keys(row)) {
                const kLower = key.toLowerCase().trim();
                if (pLower === 'tugas' && kLower.includes('petugas')) {
                  continue;
                }
                if (kLower.includes(pLower)) {
                  return row[key];
                }
              }
            }
            return '';
          };

          const noSurat = getVal(['nomor surat', 'no surat', 'nomor', 'no_surat']) || `B-${11 + idx}/7301/VS.330/2026`;
          const rawTglSpd = getVal(['tanggal spd', 'tgl spd', 'tanggal', 'tgl']);
          const tglSpd = parseExcelDate(rawTglSpd) || '2026-07-20';
          const kecamatanAsal = getVal(['kecamatan asal', 'asal', 'dari']) || 'Benteng';
          const kecamatan = getVal(['kecamatan tujuan', 'tujuan kecamatan', 'kecamatan', 'wilayah', 'ke']) || 'Bontomatene';
          const tglMulai = parseExcelDate(getVal(['tanggal mulai', 'tgl mulai', 'mulai'])) || tglSpd;
          const tglSelesai = parseExcelDate(getVal(['tanggal selesai', 'tgl selesai', 'selesai'])) || tglMulai;
          
          let nama = String(getVal(['nama petugas', 'nama pegawai', 'nama lengkap', 'nama', 'petugas']) || '').trim();
          let nip = String(getVal(['nip', 'nik']) || '').trim();
          let jabatan = String(getVal(['jabatan']) || '').trim();
          let kategori = String(getVal(['kategori', 'status']) || '').trim().toLowerCase();

          // Auto detect organic pegawai
          let isOrganik = kategori.includes('organik') && !kategori.includes('non');
          if (nama) {
            const matched = orgList.find(p => p.nama.toLowerCase().includes(nama.toLowerCase()) || nama.toLowerCase().includes(p.nama.toLowerCase()));
            if (matched) {
              isOrganik = true;
              if (!nip) nip = matched.nip;
              if (!jabatan) jabatan = matched.jabatan;
            }
          }

          if (!nama) nama = 'Nur Jannah';
          if (!nip) nip = '7301034811760004';
          if (!jabatan) jabatan = isOrganik ? 'Statistisi Ahli Pertama' : 'Mitra Sensus/Survei';

          const tujuan = getVal(['tujuan', 'uraian tugas', 'tugas perjalanan', 'kegiatan', 'maksud']) || `Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di Kecamatan ${kecamatan}`;
          const pembebanan = getVal(['pembebanan akun', 'pembebanan', 'akun']) || 'GG 2902 BMA 006 530 B 524113 2';
          const uraianBeban = getVal(['uraian pembebanan', 'uraian beban', 'uraian']) || 'Transport Daerah Sulit';

          return {
            noSurat: String(noSurat).trim(),
            tglSpd: String(tglSpd).trim(),
            kecamatanAsal: String(kecamatanAsal).trim(),
            kecamatan: String(kecamatan).trim(),
            tglMulai: String(tglMulai).trim(),
            tglSelesai: String(tglSelesai).trim(),
            isOrganik,
            nama: String(nama).trim(),
            nip: String(nip).trim(),
            jabatan: String(jabatan).trim(),
            tujuan: String(tujuan).trim(),
            pembebanan: String(pembebanan).trim(),
            uraianBeban: String(uraianBeban).trim()
          };
        });

        renderBatchTable();
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Render batch preview table
   */
  function renderBatchTable() {
    el.batchCount.textContent = state.batchData.length;
    el.batchTbody.innerHTML = '';

    state.batchData.forEach((row, i) => {
      const tr = document.createElement('tr');
      const badgeHtml = row.isOrganik
        ? '<span style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:600;font-size:0.7rem;">Organik</span>'
        : '<span style="background:#f1f5f9;color:#475569;padding:2px 6px;border-radius:4px;font-weight:600;font-size:0.7rem;">Mitra</span>';

      const routeDisplay = row.kecamatanAsal ? `${row.kecamatanAsal} &rarr; ${row.kecamatan}` : row.kecamatan;

      tr.innerHTML = `
        <td>${i + 1}</td>
        <td><strong>${row.noSurat}</strong></td>
        <td>${formatIndoDate(row.tglSpd)}</td>
        <td>${routeDisplay}</td>
        <td>${row.nama}</td>
        <td>${badgeHtml}</td>
      `;
      el.batchTbody.appendChild(tr);
    });

    el.dropzone.style.display = 'none';
    el.batchPreviewContainer.style.display = 'block';
  }

  /**
   * Clear batch state
   */
  function clearBatch() {
    state.batchData = [];
    el.batchTbody.innerHTML = '';
    el.batchPreviewContainer.style.display = 'none';
    el.dropzone.style.display = 'block';
    el.excelFileInput.value = '';
    el.batchProgress.style.display = 'none';
  }

  /**
   * Batch generation to a single merged PDF containing all documents
   */
  async function generateBatchMergedPdf() {
    if (!state.batchData || state.batchData.length === 0) return;

    try {
      el.btnGenerateBatchPdf.disabled = true;
      el.btnGenerateBatchZip.disabled = true;
      el.batchProgress.style.display = 'block';

      const total = state.batchData.length;
      const { PDFDocument } = window.PDFLib;
      const masterMerged = await PDFDocument.create();

      const [stBytes, spdBytes, superBytes] = await Promise.all([
        loadTemplate('st'),
        loadTemplate('spd'),
        loadTemplate('super')
      ]);

      for (let i = 0; i < total; i++) {
        const row = state.batchData[i];
        const pct = Math.round(((i + 1) / total) * 100);
        el.progressBarFill.style.width = `${pct}%`;
        el.progressText.textContent = `Memproses ${i + 1} dari ${total} data (${row.nama} - ${row.noSurat})...`;

        const [stDoc, spdDoc, superDoc] = await Promise.all([
          generateST(stBytes, row),
          generateSPD(spdBytes, row),
          generateSuper(superBytes, row)
        ]);

        const [p1] = await masterMerged.copyPages(stDoc, [0]);
        const [p2] = await masterMerged.copyPages(spdDoc, [0]);
        const [p3] = await masterMerged.copyPages(superDoc, [0]);

        masterMerged.addPage(p1);
        masterMerged.addPage(p2);
        masterMerged.addPage(p3);
      }

      el.progressText.textContent = 'Menyusun berkas PDF akhir...';
      const masterBytes = await masterMerged.save();
      const blob = new Blob([masterBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      triggerDownload(url, `Bundel_Semua_SPD_${total}_Data.pdf`);
      showToast(`Berhasil mengunduh ${total} set dokumen!`);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses batch PDF: ' + err.message);
    } finally {
      el.btnGenerateBatchPdf.disabled = false;
      el.btnGenerateBatchZip.disabled = false;
      el.batchProgress.style.display = 'none';
    }
  }

  /**
   * Batch generation to a ZIP containing all separate PDFs
   */
  async function generateBatchZip() {
    if (!state.batchData || state.batchData.length === 0) return;
    if (!window.JSZip) {
      alert('Library JSZip belum siap.');
      return;
    }

    try {
      el.btnGenerateBatchPdf.disabled = true;
      el.btnGenerateBatchZip.disabled = true;
      el.batchProgress.style.display = 'block';

      const zip = new window.JSZip();
      const total = state.batchData.length;

      const [stBytes, spdBytes, superBytes] = await Promise.all([
        loadTemplate('st'),
        loadTemplate('spd'),
        loadTemplate('super')
      ]);

      for (let i = 0; i < total; i++) {
        const row = state.batchData[i];
        const pct = Math.round(((i + 1) / total) * 100);
        el.progressBarFill.style.width = `${pct}%`;
        el.progressText.textContent = `Membuat PDF ${i + 1} dari ${total} (${row.noSurat})...`;

        const [stDoc, spdDoc, superDoc] = await Promise.all([
          generateST(stBytes, row),
          generateSPD(spdBytes, row),
          generateSuper(superBytes, row)
        ]);

        const mergedDoc = await generateMerged(stDoc, spdDoc, superDoc);

        const [stBytesOut, spdBytesOut, superBytesOut, mergedBytesOut] = await Promise.all([
          stDoc.save(),
          spdDoc.save(),
          superDoc.save(),
          mergedDoc.save()
        ]);

        const cleanNo = row.noSurat.replace(/[^a-zA-Z0-9.-]/g, '_');
        const folderName = `${String(i + 1).padStart(2, '0')}_${cleanNo}`;
        const folder = zip.folder(folderName);

        folder.file(`Bundel_Lengkap_${cleanNo}.pdf`, mergedBytesOut);
        folder.file(`Surat_Tugas_${cleanNo}.pdf`, stBytesOut);
        folder.file(`SPD_${cleanNo}.pdf`, spdBytesOut);
        folder.file(`Super_${cleanNo}.pdf`, superBytesOut);
      }

      el.progressText.textContent = 'Mengompresi arsip ZIP...';
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipContent);

      triggerDownload(url, `Paket_SPD_Batch_${total}_Data.zip`);
      showToast(`Berhasil membuat arsip ZIP (${total} data)!`);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses batch ZIP: ' + err.message);
    } finally {
      el.btnGenerateBatchPdf.disabled = false;
      el.btnGenerateBatchZip.disabled = false;
      el.batchProgress.style.display = 'none';
    }
  }

  /**
   * Try background sync with Google Sheet if accessible
   */
  async function trySyncGoogleSheet() {
    try {
      const url = 'https://docs.google.com/spreadsheets/d/1hnGYZh1Ng61W8HYfYg5_DRRyvtSedklDSK2b6GEqUZc/export?format=csv&gid=2128965247';
      const res = await fetch(url);
      if (!res.ok) return;
      const csv = await res.text();
      const lines = csv.split('\n');
      const results = [];
      for (let i = 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith(',Last Update') || line.startsWith(',30/04/2026')) continue;
        const matches = [];
        let inQuotes = false;
        let current = '';
        for (let c = 0; c < line.length; c++) {
          const ch = line[c];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            matches.push(current.trim());
            current = '';
          } else {
            current += ch;
          }
        }
        matches.push(current.trim());
        const nama = matches[2];
        const nipBaru = matches[5];
        const gol = matches[6] || '';
        const pangkat = matches[7] || '';
        const jabatan = (matches[8] || '').trim().replace(/\s+BPS Kabupaten\/Kota/g, '');
        if (nama && nipBaru) {
          results.push({
            nama: nama.trim(),
            nip: nipBaru.trim(),
            jabatan: jabatan.trim() || 'Fungsional Umum',
            golongan: gol.trim(),
            pangkat: pangkat.trim()
          });
        }
      }
      if (results.length > 0) {
        window.PEGAWAI_ORGANIK = results;
        populatePegawaiDropdown();
        updateSummary();
      }
    } catch (e) {
      // Offline or CORS protected, seamlessly rely on pegawai.js
    }
  }

  /**
   * Initialize event handlers
   */
  function initListeners() {
    // Mode Switch
    el.modeSingleBtn.addEventListener('click', () => {
      el.modeSingleBtn.classList.add('active');
      el.modeBatchBtn.classList.remove('active');
      el.singleModeSection.style.display = 'block';
      el.batchModeSection.style.display = 'none';
    });

    el.modeBatchBtn.addEventListener('click', () => {
      el.modeBatchBtn.classList.add('active');
      el.modeSingleBtn.classList.remove('active');
      el.singleModeSection.style.display = 'none';
      el.batchModeSection.style.display = 'block';
    });

    // Petugas Type Switch (Organik vs Non-Organik)
    el.radioOrganik.addEventListener('change', () => {
      if (el.radioOrganik.checked) {
        state.petugasMode = 'organik';
        el.labelPetugasOrganik.classList.add('active');
        el.labelPetugasNonorganik.classList.remove('active');
        el.containerOrganik.style.display = 'block';
        el.containerNonorganik.style.display = 'none';
        updateOrganikBadge();
        updateSummary();
      }
    });

    el.radioNonorganik.addEventListener('change', () => {
      if (el.radioNonorganik.checked) {
        state.petugasMode = 'nonorganik';
        el.labelPetugasNonorganik.classList.add('active');
        el.labelPetugasOrganik.classList.remove('active');
        el.containerOrganik.style.display = 'none';
        el.containerNonorganik.style.display = 'block';
        updateSummary();
      }
    });

    el.selectPegawaiOrganik.addEventListener('change', () => {
      updateOrganikBadge();
      updateSummary();
    });

    if (el.selectKecamatanAsal) {
      el.selectKecamatanAsal.addEventListener('change', () => {
        updateSummary();
      });
    }

    // Kecamatan change: auto update tujuan text if it contains standard template
    el.selectKecamatan.addEventListener('change', () => {
      const selectedKec = el.selectKecamatan.value;
      let currTujuan = el.inputTujuan.value;
      if (currTujuan.includes('di Kecamatan ')) {
        el.inputTujuan.value = currTujuan.replace(/di Kecamatan [A-Za-z\s]+$/, `di Kecamatan ${selectedKec}`);
      }
      updateSummary();
    });

    // Date sync
    el.tglSpd.addEventListener('change', () => {
      if (el.syncDatesCheckbox.checked) {
        el.tglMulai.value = el.tglSpd.value;
        el.tglSelesai.value = el.tglSpd.value;
      }
      updateSummary();
    });

    el.syncDatesCheckbox.addEventListener('change', () => {
      const isLocked = el.syncDatesCheckbox.checked;
      el.tglPerjalananContainer.style.display = isLocked ? 'none' : 'grid';
      if (isLocked) {
        el.tglMulai.value = el.tglSpd.value;
        el.tglSelesai.value = el.tglSpd.value;
      }
      updateSummary();
    });

    [
      el.noSurat, el.tglMulai, el.tglSelesai, el.inputTujuan,
      el.inputPembebanan, el.inputUraianBeban, el.inputNama, el.inputNip,
      el.inputJabatan, el.inputUnitKerja
    ].forEach(input => {
      if (input) input.addEventListener('input', updateSummary);
    });

    el.accordionToggle.addEventListener('click', () => {
      el.accordionContent.classList.toggle('open');
      const isOpen = el.accordionContent.classList.contains('open');
      el.accordionIndicator.innerHTML = isOpen
        ? '<i class="bi bi-chevron-up"></i> Sembunyikan'
        : '<i class="bi bi-chevron-down"></i> Tampilkan';
    });

    el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      generateSingle();
    });

    // Download buttons
    el.btnDownloadMerged.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || 'B-11').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.mergedBlobUrl, `Bundel SPD Lengkap - ${no} - ${tglStr}.pdf`);
    });

    el.btnDownloadSt.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || 'B-11').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.stBlobUrl, `Surat Tugas - ${no} - ${tglStr}.pdf`);
    });

    el.btnDownloadSpd.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || 'B-11').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.spdBlobUrl, `SPD - ${no} - ${tglStr}.pdf`);
    });

    el.btnDownloadSuper.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || 'B-11').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.superBlobUrl, `Super - ${no} - ${tglStr}.pdf`);
    });

    // Preview tabs
    el.tabMerged.addEventListener('click', () => updateViewerTab('merged'));
    el.tabSt.addEventListener('click', () => updateViewerTab('st'));
    el.tabSpd.addEventListener('click', () => updateViewerTab('spd'));
    el.tabSuper.addEventListener('click', () => updateViewerTab('super'));

    el.btnPrint.addEventListener('click', () => {
      if (el.pdfViewer && el.pdfViewer.contentWindow) {
        el.pdfViewer.contentWindow.print();
      } else if (state.mergedBlobUrl) {
        const win = window.open(state.mergedBlobUrl, '_blank');
        win.focus();
        win.print();
      }
    });

    // Excel Batch Listeners
    el.btnDownloadTemplate.addEventListener('click', downloadExcelTemplate);

    el.dropzone.addEventListener('click', () => el.excelFileInput.click());
    el.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.dropzone.classList.add('dragover');
    });
    el.dropzone.addEventListener('dragleave', () => el.dropzone.classList.remove('dragover'));
    el.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      el.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleExcelFile(e.dataTransfer.files[0]);
      }
    });

    el.excelFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleExcelFile(e.target.files[0]);
      }
    });

    el.btnClearBatch.addEventListener('click', clearBatch);
    el.btnGenerateBatchPdf.addEventListener('click', generateBatchMergedPdf);
    el.btnGenerateBatchZip.addEventListener('click', generateBatchZip);
  }

  // Init
  function init() {
    populatePegawaiDropdown();
    updateSummary();
    initListeners();
    generateSingle();
    trySyncGoogleSheet();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
