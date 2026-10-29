/**
 * Generator Surat Tugas, SPD, dan Surat Pernyataan BPS
 * Format: Nur Jannah (BPS Kabupaten Kepulauan Selayar)
 */

(function () {
  'use strict';

  // DOM Elements
  const el = {
    form: document.getElementById('generator-form'),
    tglSpd: document.getElementById('input-tgl-spd'),
    tglSpdText: document.getElementById('tgl-spd-preview'),
    noSurat: document.getElementById('input-no-surat'),
    kecamatan: document.getElementById('input-kecamatan'),
    syncDatesCheckbox: document.getElementById('sync-dates-checkbox'),
    tglMulai: document.getElementById('input-tgl-mulai'),
    tglSelesai: document.getElementById('input-tgl-selesai'),
    tglPerjalananContainer: document.getElementById('tgl-perjalanan-container'),
    
    // Advanced fields
    nama: document.getElementById('input-nama'),
    nip: document.getElementById('input-nip'),
    tglSt: document.getElementById('input-tgl-st'),
    accordionToggle: document.getElementById('accordion-toggle'),
    accordionContent: document.getElementById('accordion-content'),

    // Summary elements
    sumNoSt: document.getElementById('sum-no-st'),
    sumNoSpd: document.getElementById('sum-no-spd'),
    sumTglSpd: document.getElementById('sum-tgl-spd'),
    sumWaktu: document.getElementById('sum-waktu'),
    sumKecamatan: document.getElementById('sum-kecamatan'),

    // Actions & Preview
    btnGenerate: document.getElementById('btn-generate'),
    btnDownloadMerged: document.getElementById('btn-download-merged'),
    btnDownloadSt: document.getElementById('btn-download-st'),
    btnDownloadSpd: document.getElementById('btn-download-spd'),
    btnDownloadSuper: document.getElementById('btn-download-super'),
    btnPrint: document.getElementById('btn-print'),
    tabMerged: document.getElementById('tab-merged'),
    tabSt: document.getElementById('tab-st'),
    tabSpd: document.getElementById('tab-spd'),
    tabSuper: document.getElementById('tab-super'),
    pdfViewer: document.getElementById('pdf-viewer'),
    emptyState: document.getElementById('empty-state'),
    toast: document.getElementById('toast'),
  };

  // State cache of generated blob URLs
  const state = {
    stBlobUrl: null,
    spdBlobUrl: null,
    superBlobUrl: null,
    mergedBlobUrl: null,
    stDoc: null,
    spdDoc: null,
    superDoc: null,
    mergedDoc: null,
    activeTab: 'merged',
  };

  // Indonesian Months
  const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  /**
   * Convert YYYY-MM-DD to "D MMMM YYYY"
   */
  function formatIndoDate(dateStr) {
    if (!dateStr) return '';
    if (/[a-zA-Z]/.test(dateStr)) return dateStr.trim();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (m >= 1 && m <= 12) {
        return `${d} ${INDO_MONTHS[m - 1]} ${y}`;
      }
    }
    return dateStr;
  }

  /**
   * Standardize nomor surat format
   */
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

  /**
   * Standardize kecamatan name
   */
  function formatKecamatan(raw) {
    let kec = (raw || '').trim();
    if (!kec) return 'Kecamatan Bontomatene';
    if (!/^kecamatan\s+/i.test(kec)) {
      kec = `Kecamatan ${kec}`;
    }
    return kec.replace(/^kecamatan/i, 'Kecamatan');
  }

  /**
   * Show toast message
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
   * Load base template bytes (from embedded base64 or fetch fallback)
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
   * Update live summary cards based on inputs
   */
  function updateSummary() {
    const tglSpdVal = el.tglSpd.value;
    const tglMulaiVal = el.tglMulai.value || tglSpdVal;
    const tglSelesaiVal = el.tglSelesai.value || tglMulaiVal;

    const tglSpdIndo = formatIndoDate(tglSpdVal) || '20 Juli 2026';
    const tglMulaiIndo = formatIndoDate(tglMulaiVal) || tglSpdIndo;
    const tglSelesaiIndo = formatIndoDate(tglSelesaiVal) || tglMulaiIndo;

    el.tglSpdText.textContent = tglSpdIndo;

    const { stNo, spdNo } = formatNomor(el.noSurat.value || '114.21');
    const kec = formatKecamatan(el.kecamatan.value);

    el.sumNoSt.textContent = stNo;
    el.sumNoSpd.textContent = spdNo;
    el.sumTglSpd.textContent = tglSpdIndo;
    el.sumWaktu.textContent = `${tglMulaiIndo} s.d. ${tglSelesaiIndo}`;
    el.sumKecamatan.textContent = kec;
  }

  /**
   * Date synchronization handler
   */
  function handleDateSync() {
    const isLocked = el.syncDatesCheckbox.checked;
    el.tglPerjalananContainer.style.display = isLocked ? 'none' : 'grid';
    if (isLocked) {
      el.tglMulai.value = el.tglSpd.value;
      el.tglSelesai.value = el.tglSpd.value;
    }
    updateSummary();
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
    const tglMulai = formatIndoDate(opts.tglMulai);
    const tglSelesai = formatIndoDate(opts.tglSelesai);
    const waktuStr = `${tglMulai} s.d. ${tglSelesai}`;

    text = text.replace('B-114.21/7301/SS.330/2026', stNo);
    text = text.replace('Bontolebang di Kecamatan Bontomatene', `Bontolebang di ${kecFormatted}`);
    text = text.replace('20 Juli 2026 s.d. 20 Juli 2026', waktuStr);

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
    const tglMulai = formatIndoDate(opts.tglMulai);
    const tglSelesai = formatIndoDate(opts.tglSelesai);
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
   * Core Generator
   */
  async function generateAll() {
    try {
      el.btnGenerate.disabled = true;
      el.btnGenerate.textContent = '⏳ Memproses PDF...';

      const tglSpdVal = el.tglSpd.value || '2026-07-20';
      const tglMulaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglMulai.value || tglSpdVal);
      const tglSelesaiVal = el.syncDatesCheckbox.checked ? tglSpdVal : (el.tglSelesai.value || tglMulaiVal);

      const opts = {
        tglSpd: tglSpdVal,
        tglMulai: tglMulaiVal,
        tglSelesai: tglSelesaiVal,
        noSurat: el.noSurat.value || '114.21',
        kecamatan: el.kecamatan.value || 'Bontomatene',
        nama: el.nama.value || 'NUR JANNAH',
        nip: el.nip.value || '7301034811760004',
        tglSt: el.tglSt.value || ''
      };

      // Load templates
      const [stBytes, spdBytes, superBytes] = await Promise.all([
        loadTemplate('st'),
        loadTemplate('spd'),
        loadTemplate('super')
      ]);

      // Generate docs
      const [stDoc, spdDoc, superDoc] = await Promise.all([
        generateST(stBytes, opts),
        generateSPD(spdBytes, opts),
        generateSuper(superBytes, opts)
      ]);

      const mergedDoc = await generateMerged(stDoc, spdDoc, superDoc);

      // Save as byte arrays
      const [stBytesOut, spdBytesOut, superBytesOut, mergedBytesOut] = await Promise.all([
        stDoc.save(),
        spdDoc.save(),
        superDoc.save(),
        mergedDoc.save()
      ]);

      // Release old object URLs
      if (state.stBlobUrl) URL.revokeObjectURL(state.stBlobUrl);
      if (state.spdBlobUrl) URL.revokeObjectURL(state.spdBlobUrl);
      if (state.superBlobUrl) URL.revokeObjectURL(state.superBlobUrl);
      if (state.mergedBlobUrl) URL.revokeObjectURL(state.mergedBlobUrl);

      // Create new blob URLs
      state.stBlobUrl = URL.createObjectURL(new Blob([stBytesOut], { type: 'application/pdf' }));
      state.spdBlobUrl = URL.createObjectURL(new Blob([spdBytesOut], { type: 'application/pdf' }));
      state.superBlobUrl = URL.createObjectURL(new Blob([superBytesOut], { type: 'application/pdf' }));
      state.mergedBlobUrl = URL.createObjectURL(new Blob([mergedBytesOut], { type: 'application/pdf' }));

      // Enable download buttons
      el.btnDownloadMerged.disabled = false;
      el.btnDownloadSt.disabled = false;
      el.btnDownloadSpd.disabled = false;
      el.btnDownloadSuper.disabled = false;
      el.btnPrint.disabled = false;

      // Update preview viewer
      updateViewerTab(state.activeTab);

      showToast('✓ Berkas berhasil di-generate!');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat generate dokumen: ' + err.message);
    } finally {
      el.btnGenerate.disabled = false;
      el.btnGenerate.innerHTML = '⚡ Generate Dokumen';
    }
  }

  /**
   * Switch viewer tab
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
   * File download trigger
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
   * Event Listeners setup
   */
  function initListeners() {
    el.tglSpd.addEventListener('change', () => {
      if (el.syncDatesCheckbox.checked) {
        el.tglMulai.value = el.tglSpd.value;
        el.tglSelesai.value = el.tglSpd.value;
      }
      updateSummary();
    });

    el.syncDatesCheckbox.addEventListener('change', handleDateSync);

    [el.noSurat, el.kecamatan, el.tglMulai, el.tglSelesai, el.nama, el.nip].forEach(input => {
      input.addEventListener('input', updateSummary);
    });

    el.accordionToggle.addEventListener('click', () => {
      el.accordionContent.classList.toggle('open');
      const isOpen = el.accordionContent.classList.contains('open');
      el.accordionToggle.querySelector('span:last-child').textContent = isOpen ? '▲ Sembunyikan' : '▼ Tampilkan';
    });

    el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      generateAll();
    });

    // Tab buttons
    el.tabMerged.addEventListener('click', () => updateViewerTab('merged'));
    el.tabSt.addEventListener('click', () => updateViewerTab('st'));
    el.tabSpd.addEventListener('click', () => updateViewerTab('spd'));
    el.tabSuper.addEventListener('click', () => updateViewerTab('super'));

    // Download buttons
    el.btnDownloadMerged.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || '114.21').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.mergedBlobUrl, `Bundel SPD Lengkap - ${no} - ${tglStr}.pdf`);
    });

    el.btnDownloadSt.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || '114.21').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.stBlobUrl, `Surat Tugas - ${no} - ${tglStr}.pdf`);
    });

    el.btnDownloadSpd.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || '114.21').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.spdBlobUrl, `SPD - ${no} - ${tglStr}.pdf`);
    });

    el.btnDownloadSuper.addEventListener('click', () => {
      const tglStr = formatIndoDate(el.tglSpd.value) || '20 Juli 2026';
      const no = (el.noSurat.value || '114.21').replace(/[^a-zA-Z0-9.-]/g, '_');
      triggerDownload(state.superBlobUrl, `Super - ${no} - ${tglStr}.pdf`);
    });

    el.btnPrint.addEventListener('click', () => {
      if (el.pdfViewer && el.pdfViewer.contentWindow) {
        el.pdfViewer.contentWindow.print();
      } else if (state.mergedBlobUrl) {
        const win = window.open(state.mergedBlobUrl, '_blank');
        win.focus();
        win.print();
      }
    });
  }

  // Initial startup
  function init() {
    handleDateSync();
    updateSummary();
    initListeners();
    // Auto generate default once on load so the user immediately sees the initial preview
    generateAll();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
