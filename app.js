/**
 * Generator Surat Tugas, SPD, dan Surat Pernyataan BPS Kabupaten Kepulauan Selayar
 * Format: Nur Jannah (Single & Batch Excel Mode)
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
    noSurat: document.getElementById('input-no-surat'),
    tglSpd: document.getElementById('input-tgl-spd'),
    tglSpdPreview: document.getElementById('tgl-spd-preview'),
    selectKecamatan: document.getElementById('select-kecamatan'),
    syncDatesCheckbox: document.getElementById('sync-dates-checkbox'),
    tglPerjalananContainer: document.getElementById('tgl-perjalanan-container'),
    tglMulai: document.getElementById('input-tgl-mulai'),
    tglSelesai: document.getElementById('input-tgl-selesai'),
    inputTujuan: document.getElementById('input-tujuan'),
    inputPembebanan: document.getElementById('input-pembebanan'),
    inputUraianBeban: document.getElementById('input-uraian-beban'),
    inputNama: document.getElementById('input-nama'),
    inputNip: document.getElementById('input-nip'),
    inputTglSt: document.getElementById('input-tgl-st'),
    accordionToggle: document.getElementById('accordion-toggle'),
    accordionContent: document.getElementById('accordion-content'),

    // Single Summary
    sumNoSt: document.getElementById('sum-no-st'),
    sumNoSpd: document.getElementById('sum-no-spd'),
    sumTglSpd: document.getElementById('sum-tgl-spd'),
    sumWaktu: document.getElementById('sum-waktu'),
    sumKecamatan: document.getElementById('sum-kecamatan'),
    sumPetugas: document.getElementById('sum-petugas'),

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
  };

  // State
  const state = {
    stBlobUrl: null,
    spdBlobUrl: null,
    superBlobUrl: null,
    mergedBlobUrl: null,
    activeTab: 'merged',
    batchData: [],
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
   * Wrap text into two lines for Surat Tugas tujuan field
   */
  function splitTextTwoLines(text, maxLine1 = 52) {
    text = (text || '').trim();
    if (text.length <= maxLine1) return [text, ''];
    const words = text.split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      if ((line1 + (line1 ? ' ' : '') + w).length <= maxLine1 && !line2) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    }
    return [line1, line2];
  }

  /**
   * Toast notification
   */
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.style.display = 'block';
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
    const kec = formatKecamatan(el.selectKecamatan.value);

    el.sumNoSt.textContent = stNo;
    el.sumNoSpd.textContent = spdNo;
    el.sumTglSpd.textContent = tglSpdIndo;
    el.sumWaktu.textContent = `${tglMulaiIndo} s.d. ${tglSelesaiIndo}`;
    el.sumKecamatan.textContent = kec;
    el.sumPetugas.textContent = `${el.inputNama.value || 'NUR JANNAH'} (${el.inputNip.value || '7301034811760004'})`;
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
    const kecFormatted = formatKecamatan(opts.kecamatan);
    const tglMulai = formatIndoDate(opts.tglMulai || opts.tglSpd);
    const tglSelesai = formatIndoDate(opts.tglSelesai || opts.tglMulai || opts.tglSpd);
    const waktuStr = `${tglMulai} s.d. ${tglSelesai}`;

    // Nomor
    text = text.replace('B-114.21/7301/SS.330/2026', stNo);

    // Tujuan / Tugas (wrapped into 2 lines)
    const tujuanText = opts.tujuan || `Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di ${kecFormatted}`;
    const [tujuanLine1, tujuanLine2] = splitTextTwoLines(tujuanText);
    text = text.replace('Translok Petugas Pendataan SE2026 Menara Indah dan', tujuanLine1);
    text = text.replace('Bontolebang di Kecamatan Bontomatene', tujuanLine2);

    // Waktu
    text = text.replace('20 Juli 2026 s.d. 20 Juli 2026', waktuStr);

    // Pembebanan
    const pembebanan = opts.pembebanan || 'GG 2902 BMA 006 530 B 524113 2';
    const uraianBeban = opts.uraianBeban || 'Transport Daerah Sulit';
    text = text.replace('GG 2902 BMA 006 530 B 524113 2', pembebanan);
    text = text.replace('Transport Daerah Sulit', uraianBeban);

    // Nama & Tanggal TTD
    if (opts.nama) {
      text = text.replaceAll('NUR JANNAH', opts.nama.trim().toUpperCase());
    }
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
    const kecFormatted = formatKecamatan(opts.kecamatan);
    const tglSpd = formatIndoDate(opts.tglSpd);

    text = text.replaceAll('114.21/7301/SS.330/2026', spdNo);
    text = text.replaceAll('Kecamatan Bontomatene', kecFormatted);
    text = text.replaceAll('20 Juli 2026', tglSpd);

    page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.flateStream(new TextEncoder().encode(text))));
    return doc;
  }

  /**
   * Generate Super Document
   */
  async function generateSuper(superBytes, opts) {
    const { PDFDocument, PDFName } = window.PDFLib;
    const doc = await PDFDocument.load(superBytes);
    const page = doc.getPages()[0];
    const stream = doc.context.lookup(page.node.Contents());
    let text = new TextDecoder('latin1').decode(window.pako.inflate(stream.getContents()));

    const { superNo } = formatNomor(opts.noSurat);
    const tglSpd = formatIndoDate(opts.tglSpd);
    const tglMulai = formatIndoDate(opts.tglMulai || opts.tglSpd);
    const tglSelesai = formatIndoDate(opts.tglSelesai || opts.tglMulai || opts.tglSpd);
    const tglPelaksanaan = (tglMulai === tglSelesai) ? tglMulai : `${tglMulai} s.d. ${tglSelesai}`;

    text = text.replace('B-114.21/7301/SS.330/2026', superNo);
    text = text.replace('pelaksanaan tanggal 20 Juli 2026', `pelaksanaan tanggal ${tglPelaksanaan}`);
    text = text.replace('Kepulauan Selayar, 20 Juli 2026', `Kepulauan Selayar, ${tglSpd}`);

    if (opts.nama) {
      text = text.replaceAll('NUR JANNAH', opts.nama.trim().toUpperCase());
    }
    if (opts.nip) {
      text = text.replaceAll('7301034811760004', opts.nip.trim());
    }

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
      el.btnGenerate.textContent = '⏳ Memproses PDF...';

      const tglSpdVal = el.tglSpd.value || '2026-07-20';
      const tglMulaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglMulai.value || tglSpdVal);
      const tglSelesaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglSelesai.value || tglMulaiVal);

      const opts = {
        noSurat: el.noSurat.value || 'B-11/7301/VS.330/2026',
        tglSpd: tglSpdVal,
        tglMulai: tglMulaiVal,
        tglSelesai: tglSelesaiVal,
        kecamatan: el.selectKecamatan.value || 'Bontomatene',
        tujuan: el.inputTujuan.value,
        pembebanan: el.inputPembebanan.value,
        uraianBeban: el.inputUraianBeban.value,
        nama: el.inputNama.value,
        nip: el.inputNip.value,
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
      showToast('✓ Berkas berhasil di-generate!');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      el.btnGenerate.disabled = false;
      el.btnGenerate.innerHTML = '⚡ Generate Dokumen';
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
        'Kecamatan': 'Bontomatene',
        'Tanggal Mulai': '2026-07-20',
        'Tanggal Selesai': '2026-07-20',
        'Nama Petugas': 'NUR JANNAH',
        'NIP': '7301034811760004',
        'Tujuan': 'Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di Kecamatan Bontomatene',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2',
        'Uraian Pembebanan': 'Transport Daerah Sulit'
      },
      {
        'Nomor Surat': 'B-12/7301/VS.330/2026',
        'Tanggal SPD': '2026-07-24',
        'Kecamatan': 'Bontomatene',
        'Tanggal Mulai': '2026-07-24',
        'Tanggal Selesai': '2026-07-24',
        'Nama Petugas': 'NUR JANNAH',
        'NIP': '7301034811760004',
        'Tujuan': 'Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di Kecamatan Bontomatene',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2',
        'Uraian Pembebanan': 'Transport Daerah Sulit'
      },
      {
        'Nomor Surat': 'B-13/7301/VS.330/2026',
        'Tanggal SPD': '2026-07-29',
        'Kecamatan': 'Benteng',
        'Tanggal Mulai': '2026-07-29',
        'Tanggal Selesai': '2026-07-29',
        'Nama Petugas': 'NUR JANNAH',
        'NIP': '7301034811760004',
        'Tujuan': 'Translok Petugas Pendataan SE2026 di Kecamatan Benteng',
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

        // Normalize keys
        state.batchData = json.map((row, idx) => {
          const getVal = (patterns) => {
            for (const key of Object.keys(row)) {
              for (const p of patterns) {
                if (key.toLowerCase().includes(p.toLowerCase())) {
                  return row[key];
                }
              }
            }
            return '';
          };

          const noSurat = getVal(['nomor surat', 'no surat', 'nomor', 'no_surat']) || `B-${11 + idx}/7301/VS.330/2026`;
          const rawTglSpd = getVal(['tanggal spd', 'tgl spd', 'tanggal', 'tgl']);
          const tglSpd = parseExcelDate(rawTglSpd) || '2026-07-20';
          const kecamatan = getVal(['kecamatan', 'wilayah']) || 'Bontomatene';
          const tglMulai = parseExcelDate(getVal(['tanggal mulai', 'tgl mulai', 'mulai'])) || tglSpd;
          const tglSelesai = parseExcelDate(getVal(['tanggal selesai', 'tgl selesai', 'selesai'])) || tglMulai;
          const nama = getVal(['nama petugas', 'nama', 'petugas']) || 'NUR JANNAH';
          const nip = getVal(['nip', 'nik']) || '7301034811760004';
          const tujuan = getVal(['tujuan', 'tugas']) || `Translok Petugas Pendataan SE2026 Menara Indah dan Bontolebang di Kecamatan ${kecamatan}`;
          const pembebanan = getVal(['pembebanan akun', 'pembebanan', 'akun']) || 'GG 2902 BMA 006 530 B 524113 2';
          const uraianBeban = getVal(['uraian pembebanan', 'uraian beban', 'uraian']) || 'Transport Daerah Sulit';

          return {
            noSurat: String(noSurat).trim(),
            tglSpd: String(tglSpd).trim(),
            kecamatan: String(kecamatan).trim(),
            tglMulai: String(tglMulai).trim(),
            tglSelesai: String(tglSelesai).trim(),
            nama: String(nama).trim(),
            nip: String(nip).trim(),
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
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td><strong>${row.noSurat}</strong></td>
        <td>${formatIndoDate(row.tglSpd)}</td>
        <td>${row.kecamatan}</td>
        <td>${row.nama}</td>
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
      showToast(`✓ Berhasil mengunduh ${total} set dokumen!`);
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
        const cleanTgl = (formatIndoDate(row.tglSpd) || 'SPD').replace(/[^a-zA-Z0-9]/g, '_');
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
      showToast(`✓ Berhasil membuat arsip ZIP (${total} data)!`);
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
      el.inputPembebanan, el.inputUraianBeban, el.inputNama, el.inputNip
    ].forEach(input => {
      input.addEventListener('input', updateSummary);
    });

    el.accordionToggle.addEventListener('click', () => {
      el.accordionContent.classList.toggle('open');
      const isOpen = el.accordionContent.classList.contains('open');
      el.accordionToggle.querySelector('span:last-child').textContent = isOpen ? '▲ Sembunyikan' : '▼ Tampilkan';
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
    updateSummary();
    initListeners();
    generateSingle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
