/**
 * Generator Surat Tugas, SPD, dan Surat Pernyataan BPS Kabupaten Kepulauan Selayar
 * UI layer: stepper form, ringkasan, batch Excel, preview. Pure logic lives in core.js
 * and the PDF rendering in render.js.
 */

(function () {
  'use strict';

  const Core = window.SPDCore;
  const Render = window.SPDRender;

  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const el = {
    // Mode Switch
    modeSingleBtn: $('mode-single-btn'),
    modeBatchBtn: $('mode-batch-btn'),
    singleModeSection: $('single-mode-section'),
    batchModeSection: $('batch-mode-section'),

    // Stepper
    stepLinks: Array.from(document.querySelectorAll('.step-link')),
    steps: Array.from(document.querySelectorAll('.step')),
    btnReset: $('btn-reset'),

    // Langkah 1: Petugas
    form: $('generator-form'),
    radioOrganik: $('radio-organik'),
    radioNonorganik: $('radio-nonorganik'),
    labelPetugasOrganik: $('label-petugas-organik'),
    labelPetugasNonorganik: $('label-petugas-nonorganik'),
    containerOrganik: $('container-organik'),
    containerNonorganik: $('container-nonorganik'),
    selectPegawaiOrganik: $('select-pegawai-organik'),
    organikInfoText: $('organik-info-text'),
    pegawaiSource: $('pegawai-source'),
    inputNama: $('input-nama'),
    inputNip: $('input-nip'),
    inputJabatan: $('input-jabatan'),

    // Langkah 2: Perjalanan
    noSurat: $('input-no-surat'),
    inputKodeKlasifikasi: $('input-kode-klasifikasi'),
    nomorPreview: $('nomor-preview'),
    inputTglSt: $('input-tgl-st'),
    tglSpd: $('input-tgl-spd'),
    tglSpdPreview: $('tgl-spd-preview'),
    selectKecamatanAsal: $('select-kecamatan-asal'),
    selectKecamatan: $('select-kecamatan'),
    syncDatesCheckbox: $('sync-dates-checkbox'),
    tglPerjalananContainer: $('tgl-perjalanan-container'),
    tglMulai: $('input-tgl-mulai'),
    tglSelesai: $('input-tgl-selesai'),
    inputTujuan: $('input-tujuan'),

    // Langkah 3: Anggaran & Format
    inputPembebanan: $('input-pembebanan'),
    inputUraianBeban: $('input-uraian-beban'),
    radioFormat1: $('radio-format-1'),
    radioFormat2: $('radio-format-2'),
    f2Fields: $('f2-fields'),
    inputTempatBerangkat: $('input-tempat-berangkat'),
    inputGolongan: $('input-golongan'),
    inputJabatanInstansi: $('input-jabatan-instansi'),
    inputAlatAngkut: $('input-alat-angkut'),
    inputTingkatBiaya: $('input-tingkat-biaya'),
    inputProgramKode: $('input-program-kode'),
    inputProgramUraian: $('input-program-uraian'),
    inputKegiatanKode: $('input-kegiatan-kode'),
    inputKegiatanUraian: $('input-kegiatan-uraian'),
    inputKomponenKode: $('input-komponen-kode'),
    inputKomponenUraian: $('input-komponen-uraian'),
    inputMataAnggaran: $('input-mata-anggaran'),
    inputKeterangan: $('input-keterangan'),
    btnIsiAnggaran: $('btn-isi-anggaran'),
    inputUnitKerja: $('input-unit-kerja'),
    selectPpk: $('select-ppk'),
    inputPpkNama: $('input-ppk-nama'),
    inputPpkNip: $('input-ppk-nip'),
    inputPpkProgram: $('input-ppk-program'),
    accordionToggle: $('accordion-toggle'),
    accordionContent: $('accordion-content'),
    accordionIndicator: $('accordion-indicator'),

    // Langkah 4: Periksa & Unduh
    reviewLine: $('review-line'),
    formErrors: $('form-errors'),
    sumNoSt: $('sum-no-st'),
    sumNoSpd: $('sum-no-spd'),
    sumTglSpd: $('sum-tgl-spd'),
    sumWaktu: $('sum-waktu'),
    sumKecamatan: $('sum-kecamatan'),
    sumPetugas: $('sum-petugas'),
    sumJabatan: $('sum-jabatan'),
    sumTujuan: $('sum-tujuan'),
    sumLama: $('sum-lama'),
    sumFormat: $('sum-format'),
    btnGenerate: $('btn-generate'),
    resultActions: $('result-actions'),
    btnDownloadBundle: $('btn-download-bundle'),
    btnDownloadBundleText: $('btn-download-bundle-text'),
    btnDownloadSpd: $('btn-download-spd'),
    downloadButtons: Array.from(document.querySelectorAll('[data-download]')),
    btnPrint: $('btn-print'),
    step4PreviewSlot: $('step4-preview-slot'),

    // Batch Excel Elements
    btnDownloadTemplate: $('btn-download-template'),
    dropzone: $('dropzone'),
    excelFileInput: $('excel-file-input'),
    batchPreviewContainer: $('batch-preview-container'),
    batchCount: $('batch-count'),
    batchTbody: $('batch-tbody'),
    batchMessage: $('batch-message'),
    btnClearBatch: $('btn-clear-batch'),
    btnGenerateBatchPdf: $('btn-generate-batch-pdf'),
    btnGenerateBatchZip: $('btn-generate-batch-zip'),
    btnBatchPdfText: $('btn-batch-pdf-text'),
    btnBatchZipText: $('btn-batch-zip-text'),
    btnBatchReport: $('btn-batch-report'),
    batchProgress: $('batch-progress'),
    progressBar: $('progress-bar'),
    progressBarFill: $('progress-bar-fill'),
    progressText: $('progress-text'),

    // Preview
    rightPanel: $('right-panel'),
    previewContainer: $('preview-container'),
    tabMerged: $('tab-merged'),
    tabSt: $('tab-st'),
    tabSpd: $('tab-spd'),
    tabSuper: $('tab-super'),
    btnOpenTab: $('btn-open-tab'),
    pdfViewer: $('pdf-viewer'),
    emptyState: $('empty-state'),
    previewFallback: $('preview-fallback'),
    btnOpenFallback: $('btn-open-fallback'),
    toast: $('toast'),
    toastText: $('toast-text'),
  };

  // Form fields addressed by the validator's `field` names.
  const FIELD_INPUTS = {
    nama: () => (state.petugasMode === 'organik' ? el.selectPegawaiOrganik : el.inputNama),
    nip: () => (state.petugasMode === 'organik' ? el.selectPegawaiOrganik : el.inputNip),
    jabatan: () => (state.petugasMode === 'organik' ? el.selectPegawaiOrganik : el.inputJabatan),
    // An incomplete number with an empty kode points at the kode field.
    noSurat: () => (el.noSurat.value.trim() && !el.noSurat.value.includes('/') && !el.inputKodeKlasifikasi.value.trim()
      ? el.inputKodeKlasifikasi : el.noSurat),
    tglSt: () => el.inputTglSt,
    tglSpd: () => el.tglSpd,
    tglMulai: () => (el.syncDatesCheckbox.checked ? el.tglSpd : el.tglMulai),
    tglSelesai: () => (el.syncDatesCheckbox.checked ? el.tglSpd : el.tglSelesai),
    kecamatanAsal: () => el.selectKecamatanAsal,
    kecamatan: () => el.selectKecamatan,
    tujuan: () => el.inputTujuan,
    pembebanan: () => el.inputPembebanan,
    uraianBeban: () => el.inputUraianBeban,
    unitKerja: () => el.inputUnitKerja,
    format: () => el.radioFormat1,
    tempatBerangkat: () => el.inputTempatBerangkat,
    golongan: () => el.inputGolongan,
    jabatanInstansi: () => el.inputJabatanInstansi,
    alatAngkut: () => el.inputAlatAngkut,
    tingkatBiaya: () => el.inputTingkatBiaya,
    programKode: () => el.inputProgramKode,
    programUraian: () => el.inputProgramUraian,
    kegiatanKode: () => el.inputKegiatanKode,
    kegiatanUraian: () => el.inputKegiatanUraian,
    komponenKode: () => el.inputKomponenKode,
    komponenUraian: () => el.inputKomponenUraian,
    keterangan: () => el.inputKeterangan,
    ppkNama: () => el.inputPpkNama,
    ppkNip: () => el.inputPpkNip,
    ppkProgram: () => el.inputPpkProgram
  };

  const STEP_COUNT = 4;
  const stepperQuery = window.matchMedia('(max-width: 767.98px)');

  /**
   * localStorage wrapper: storage can be unavailable (private mode, blocked site data).
   */
  const store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem(`spd.${key}`);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(`spd.${key}`, JSON.stringify(value));
      } catch (e) {
        // ignore: preferences are a convenience only
      }
    }
  };

  // Field values remembered between visits (habits, not personal data).
  const REMEMBERED = {
    kodeKlasifikasi: () => el.inputKodeKlasifikasi,
    kecamatanAsal: () => el.selectKecamatanAsal,
    pembebanan: () => el.inputPembebanan,
    uraianBeban: () => el.inputUraianBeban,
    tempatBerangkat: () => el.inputTempatBerangkat
  };

  // State
  const state = {
    urls: { st: null, spd: null, super: null, merged: null },
    activeTab: 'merged',
    batchRows: [],
    petugasMode: 'organik', // 'organik' | 'nonorganik'
    pegawaiSource: 'lokal',
    format: 1,
    pageCount: 3,
    step: 1,
    visited: new Set([1]),
    revealed: new Set(), // steps whose errors are shown inline
    busy: false
  };

  /**
   * Toast notification (announced through aria-live on #toast)
   */
  let toastTimer = null;
  function showToast(msg, isError) {
    el.toastText.textContent = msg;
    el.toast.classList.toggle('toast-error', !!isError);
    el.toast.style.display = 'inline-flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.style.display = 'none';
    }, isError ? 6000 : 3000);
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

  async function loadTemplates() {
    const [st, spd, sup] = await Promise.all([loadTemplate('st'), loadTemplate('spd'), loadTemplate('super')]);
    return { st, spd, super: sup };
  }

  // ---------------------------------------------------------------------------
  // Pegawai & PPK
  // ---------------------------------------------------------------------------

  /**
   * Populate Pegawai Organik dropdown (first option is an empty prompt)
   */
  function populatePegawaiDropdown() {
    const list = window.PEGAWAI_ORGANIK || [];
    const prevNip = selectedPegawai() ? selectedPegawai().nip : '';
    el.selectPegawaiOrganik.innerHTML = '';

    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '— Pilih pegawai —';
    el.selectPegawaiOrganik.appendChild(empty);

    list.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${p.nama} — ${p.jabatan}`;
      if (p.nip === prevNip) opt.selected = true;
      el.selectPegawaiOrganik.appendChild(opt);
    });

    populatePpkDropdown(list);

    el.pegawaiSource.textContent = state.pegawaiSource === 'lokal'
      ? `Data pegawai: lokal (${list.length} orang)`
      : `Data pegawai: tersinkron ${state.pegawaiSource} (${list.length} orang)`;
    updateOrganikBadge();
  }

  function populatePpkDropdown(list) {
    el.selectPpk.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '— Pilih untuk mengisi otomatis —';
    el.selectPpk.appendChild(empty);
    list.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = p.nama;
      if (p.nip === el.inputPpkNip.value.trim()) opt.selected = true;
      el.selectPpk.appendChild(opt);
    });
  }

  function selectedPegawai() {
    const list = window.PEGAWAI_ORGANIK || [];
    const v = el.selectPegawaiOrganik.value;
    return v === '' ? null : list[parseInt(v, 10)] || null;
  }

  /**
   * Update selected organic staff info badge
   */
  function updateOrganikBadge() {
    const p = selectedPegawai();
    el.organikInfoText.textContent = p
      ? `NIP: ${p.nip} | Gol: ${p.golongan || '-'} | Jabatan: ${p.jabatan}`
      : 'Belum ada pegawai yang dipilih.';
  }

  /**
   * Get current active petugas details (no sample fallbacks)
   */
  function getCurrentPetugas() {
    if (state.petugasMode === 'organik') {
      const p = selectedPegawai() || {};
      return {
        isOrganik: true,
        nama: p.nama || '',
        nip: p.nip || '',
        jabatan: p.jabatan || '',
        jabatanInstansi: p.jabatanInstansi || '',
        golongan: p.golongan || '',
        unitKerja: el.inputUnitKerja.value
      };
    }
    return {
      isOrganik: false,
      nama: el.inputNama.value,
      nip: el.inputNip.value,
      jabatan: el.inputJabatan.value,
      jabatanInstansi: '',
      golongan: '',
      unitKerja: el.inputUnitKerja.value
    };
  }

  function currentPpk() {
    return {
      nama: el.inputPpkNama.value.trim(),
      nip: el.inputPpkNip.value.replace(/\s+/g, ''),
      program: el.inputPpkProgram.value.trim()
    };
  }

  /**
   * Full nomor surat from "nomor urut" + "kode klasifikasi" + year of the ST date.
   */
  function nomorSurat() {
    const tahun = (el.inputTglSt.value.match(/^\d{4}/) || [String(new Date().getFullYear())])[0];
    return Core.susunNomor(el.noSurat.value, el.inputKodeKlasifikasi.value, tahun);
  }

  /**
   * Raw builder input from the form
   */
  function collectInput() {
    const tglSpd = el.tglSpd.value;
    const sync = el.syncDatesCheckbox.checked;
    const tglMulai = sync ? tglSpd : el.tglMulai.value;
    const tglSelesai = sync ? tglSpd : el.tglSelesai.value;
    const petugas = getCurrentPetugas();
    return Object.assign(petugas, {
      format: state.format,
      golongan: el.inputGolongan.value || petugas.golongan,
      jabatanInstansi: el.inputJabatanInstansi.value || petugas.jabatanInstansi,
      tempatBerangkat: el.inputTempatBerangkat.value,
      alatAngkut: el.inputAlatAngkut.value,
      tingkatBiaya: el.inputTingkatBiaya.value,
      programKode: el.inputProgramKode.value,
      programUraian: el.inputProgramUraian.value,
      kegiatanKode: el.inputKegiatanKode.value,
      kegiatanUraian: el.inputKegiatanUraian.value,
      komponenKode: el.inputKomponenKode.value,
      komponenUraian: el.inputKomponenUraian.value,
      mataAnggaran: el.inputMataAnggaran.value,
      keterangan: el.inputKeterangan.value,
      ppk: currentPpk(),
      noSurat: nomorSurat(),
      tglSt: el.inputTglSt.value,
      tglSpd,
      tglMulai,
      tglSelesai,
      kecamatanAsal: el.selectKecamatanAsal.value,
      kecamatan: el.selectKecamatan.value,
      tujuan: el.inputTujuan.value,
      pembebanan: el.inputPembebanan.value,
      uraianBeban: el.inputUraianBeban.value
    });
  }

  // ---------------------------------------------------------------------------
  // Validation display
  // ---------------------------------------------------------------------------

  function inputFor(field) {
    const getter = FIELD_INPUTS[field];
    return getter ? getter() : null;
  }

  function stepOf(input) {
    const section = input && input.closest('.step');
    return section ? parseInt(section.dataset.step, 10) : STEP_COUNT;
  }

  function errorsByStep(errors) {
    const byStep = {};
    for (const err of errors) {
      const s = stepOf(inputFor(err.field));
      (byStep[s] = byStep[s] || []).push(err);
    }
    return byStep;
  }

  /**
   * Show validator errors next to the fields of revealed steps, and the full list
   * (with links) in step 4 once the user reached it.
   */
  function renderErrors(errors) {
    document.querySelectorAll('.field-error').forEach(n => n.remove());
    document.querySelectorAll('[aria-invalid="true"]').forEach(n => {
      n.removeAttribute('aria-invalid');
      const ids = (n.getAttribute('aria-describedby') || '').split(' ').filter(id => id && !id.startsWith('err-'));
      if (ids.length) n.setAttribute('aria-describedby', ids.join(' '));
      else n.removeAttribute('aria-describedby');
    });

    const seen = new Set();
    for (const err of errors) {
      const input = inputFor(err.field);
      if (!input || seen.has(input) || !state.revealed.has(stepOf(input))) continue;
      seen.add(input);
      const id = `err-${input.id}`;
      const msg = document.createElement('div');
      msg.className = 'field-error';
      msg.id = id;
      msg.textContent = err.message;
      const group = input.closest('.form-group') || input.parentElement;
      group.appendChild(msg);
      input.setAttribute('aria-invalid', 'true');
      const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      input.setAttribute('aria-describedby', ids.concat(id).join(' '));
    }

    el.formErrors.innerHTML = '';
    el.formErrors.hidden = !(state.revealed.has(STEP_COUNT) && errors.length);
    if (el.formErrors.hidden) return;

    const p = document.createElement('p');
    p.textContent = `Ada ${errors.length} isian yang perlu diperbaiki sebelum dokumen bisa dibuat:`;
    const ul = document.createElement('ul');
    for (const err of errors) {
      const li = document.createElement('li');
      const input = inputFor(err.field);
      if (input) {
        const a = document.createElement('a');
        a.href = `#${input.id}`;
        a.textContent = `Langkah ${stepOf(input)}: ${err.message}`;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          focusField(input);
        });
        li.appendChild(a);
      } else {
        li.textContent = err.message;
      }
      ul.appendChild(li);
    }
    el.formErrors.append(p, ul);
  }

  function focusField(input) {
    goToStep(stepOf(input), { scroll: false });
    if (el.accordionContent.contains(input) && !el.accordionContent.classList.contains('open')) {
      toggleAccordion();
    }
    input.focus({ preventScroll: true });
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // Stepper
  // ---------------------------------------------------------------------------

  function isStepper() {
    return stepperQuery.matches;
  }

  /**
   * Show one step (phone) or scroll to it (desktop) and refresh the progress marks.
   */
  function goToStep(n, opts) {
    const options = Object.assign({ scroll: true }, opts);
    state.step = Math.min(Math.max(n, 1), STEP_COUNT);
    state.visited.add(state.step);
    if (state.step === STEP_COUNT) {
      for (let i = 1; i <= STEP_COUNT; i++) state.revealed.add(i);
    }
    el.steps.forEach((s) => {
      s.classList.toggle('is-current', parseInt(s.dataset.step, 10) === state.step);
    });
    updateSummary();
    if (options.scroll) {
      const section = $(`step-${state.step}`);
      if (isStepper()) window.scrollTo({ top: 0, behavior: 'smooth' });
      else section.scrollIntoView({ block: 'start', behavior: 'smooth' });
      const title = $(`step-${state.step}-title`);
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
  }

  function updateStepper(errors) {
    const byStep = errorsByStep(errors);
    el.stepLinks.forEach((btn) => {
      const n = parseInt(btn.dataset.goto, 10);
      const done = n < STEP_COUNT && state.visited.has(n) && n !== state.step && !byStep[n];
      const warn = state.revealed.has(n) && !!byStep[n] && n < STEP_COUNT;
      btn.classList.toggle('is-current', n === state.step);
      btn.classList.toggle('is-done', done);
      btn.classList.toggle('has-error', warn);
      if (n === state.step) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
      const status = n === state.step ? ' (sedang diisi)' : warn ? ' (perlu diperbaiki)' : done ? ' (selesai)' : '';
      btn.setAttribute('aria-label', `Langkah ${n}: ${btn.querySelector('.step-name').textContent}${status}`);
    });
  }

  /**
   * "Lanjut": reveal the current step's errors and only move on when it is complete.
   */
  function nextStep() {
    state.revealed.add(state.step);
    const { errors } = updateSummary();
    const own = errorsByStep(errors)[state.step];
    if (own) {
      focusField(inputFor(own[0].field));
      showToast(`Lengkapi dulu ${own.length} isian di langkah ini.`, true);
      return;
    }
    goToStep(state.step + 1);
  }

  /**
   * Phones get one step at a time and the preview inside step 4; larger screens show
   * every step with the preview in the right column.
   */
  function applyLayout() {
    const stepper = isStepper();
    document.body.classList.toggle('is-stepper', stepper);
    const slot = stepper ? el.step4PreviewSlot : el.rightPanel;
    if (el.previewContainer.parentElement !== slot) slot.appendChild(el.previewContainer);
    updateViewerTab(state.activeTab);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  /**
   * Update live summary, inline validation and progress marks
   */
  function updateSummary() {
    const built = Core.buildSpdData(collectInput());
    const data = built.data;
    const errors = built.errors.map(e => (e.field === 'noSurat' && inputFor('noSurat') === el.inputKodeKlasifikasi
      ? Object.assign({}, e, { message: `Isi kode klasifikasi, misalnya ${Core.KODE_KLASIFIKASI_DEFAULT}.` })
      : e));
    const dash = (v) => v || '-';

    el.tglSpdPreview.textContent = dash(data.tglSpdIndo);
    el.nomorPreview.textContent = dash(data.stNo);
    el.reviewLine.textContent = Core.ringkasanSatuBaris(data);
    el.sumNoSt.textContent = dash(data.stNo);
    el.sumNoSpd.textContent = dash(data.spdNo);
    el.sumTglSpd.textContent = dash(data.tglSpdIndo);
    el.sumWaktu.textContent = data.tglMulaiIndo ? data.waktuStr : '-';
    el.sumKecamatan.textContent = `${dash(data.tempatBerangkat)} → ${dash(data.kecTujuan)}`;
    el.sumPetugas.textContent = data.petugas.nama
      ? `${data.petugas.nama} (${data.petugas.nip || '-'}) [${data.petugas.isOrganik ? 'Organik' : 'Mitra'}]`
      : '-';
    el.sumJabatan.textContent = dash(data.petugas.jabatan);
    el.sumTujuan.textContent = dash(data.tujuan);
    el.sumLama.textContent = data.lamaHari ? `${data.lamaHari} hari` : '-';
    el.sumFormat.textContent = data.format === 2
      ? 'Format 2 (halaman depan + lampiran, 4 halaman)'
      : 'Format 1 (lampiran saja, 3 halaman)';
    renderErrors(errors);
    updateStepper(errors);
    return { data, errors };
  }

  // ---------------------------------------------------------------------------
  // Generate & preview
  // ---------------------------------------------------------------------------

  function revokeUrls() {
    Object.keys(state.urls).forEach((k) => {
      if (state.urls[k]) URL.revokeObjectURL(state.urls[k]);
      state.urls[k] = null;
    });
  }

  function pdfUrl(bytes) {
    return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  }

  function setBusy(btn, busy, busyHtml) {
    if (busy) {
      btn.dataset.html = btn.innerHTML;
      btn.innerHTML = busyHtml;
    } else if (btn.dataset.html) {
      btn.innerHTML = btn.dataset.html;
    }
    btn.disabled = busy;
    btn.setAttribute('aria-busy', String(busy));
  }

  /**
   * Any change after generating makes the result stale.
   */
  function markStale() {
    if (!state.urls.merged) return;
    revokeUrls();
    el.resultActions.hidden = true;
    el.btnGenerate.hidden = false;
    el.pdfViewer.removeAttribute('src');
    updateViewerTab(state.activeTab);
  }

  /**
   * Generate Single Set of Documents
   */
  async function generateSingle() {
    if (state.busy) return;
    if (state.step !== STEP_COUNT) goToStep(STEP_COUNT, { scroll: false });
    const { data, errors } = updateSummary();
    if (errors.length) {
      el.formErrors.scrollIntoView({ block: 'center', behavior: 'smooth' });
      showToast('Masih ada isian yang perlu diperbaiki.', true);
      return;
    }

    state.busy = true;
    setBusy(el.btnGenerate, true, '<i class="bi bi-hourglass-split" aria-hidden="true"></i> Membuat PDF...');
    try {
      const bundle = await Render.buildBundle(data, await loadTemplates());
      const [st, spd, sup, merged] = await Promise.all([
        bundle.st.save(), bundle.spd.save(), bundle.super.save(), bundle.merged.save()
      ]);

      revokeUrls();
      state.urls = { st: pdfUrl(st), spd: pdfUrl(spd), super: pdfUrl(sup), merged: pdfUrl(merged) };
      state.pageCount = bundle.pageCount;
      state.fileStem = `${fileSafe(data.stNo)} - ${data.tglSpdIndo}`;

      el.btnDownloadBundleText.textContent = `Unduh Bundel (${bundle.pageCount} halaman)`;
      el.btnDownloadSpd.textContent = bundle.pageCount === 4 ? 'SPD (2 halaman)' : 'SPD';
      el.resultActions.hidden = false;
      // The result is now the main action; editing anything brings "Buat Dokumen" back.
      el.btnGenerate.hidden = true;

      updateViewerTab('merged');
      showToast('Dokumen berhasil dibuat. Periksa pratinjau, lalu unduh.');
      if (bundle.warnings.length) {
        showToast(`Karakter ${bundle.warnings.join(' ')} diganti "?" karena tidak bisa dicetak.`, true);
      }
    } catch (err) {
      console.error(err);
      showToast(`Gagal membuat dokumen: ${err.message}`, true);
    } finally {
      state.busy = false;
      setBusy(el.btnGenerate, false);
    }
  }

  /**
   * Phones (and browsers with the PDF viewer disabled) cannot show a PDF in an iframe.
   */
  function canPreviewInline() {
    if (navigator.pdfViewerEnabled === false) return false;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    return !(touch && isStepper());
  }

  /**
   * Switch preview tab
   */
  function updateViewerTab(tab) {
    state.activeTab = tab;
    const tabs = { merged: el.tabMerged, st: el.tabSt, spd: el.tabSpd, super: el.tabSuper };
    Object.entries(tabs).forEach(([k, btn]) => {
      btn.classList.toggle('active', k === tab);
      btn.setAttribute('aria-selected', String(k === tab));
    });
    el.tabMerged.textContent = `Bundel (${state.pageCount} hal)`;
    el.tabSpd.textContent = state.pageCount === 4 ? 'SPD (2 hal)' : 'SPD';

    const url = state.urls[tab];
    const inline = canPreviewInline();
    el.emptyState.style.display = url ? 'none' : '';
    el.previewFallback.hidden = !url || inline;
    el.pdfViewer.style.display = url && inline ? 'block' : 'none';
    el.btnOpenTab.hidden = !url;
    if (url) {
      el.btnOpenTab.href = url;
      el.btnOpenFallback.href = url;
      if (inline && el.pdfViewer.getAttribute('src') !== url) el.pdfViewer.src = url;
    }
  }

  /**
   * Trigger download. `revoke` frees one-off blob URLs after the click.
   */
  function triggerDownload(url, filename, revoke) {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revoke) setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function fileSafe(str) {
    return String(str || '').replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  const DOC_NAMES = { st: 'Surat Tugas', spd: 'SPD', super: 'Surat Pernyataan', merged: 'Bundel SPD Lengkap' };

  function downloadDoc(key) {
    triggerDownload(state.urls[key], `${DOC_NAMES[key]} - ${state.fileStem}.pdf`);
  }

  function printBundle() {
    if (!state.urls.merged) return;
    if (canPreviewInline() && state.activeTab === 'merged' && el.pdfViewer.contentWindow) {
      el.pdfViewer.contentWindow.print();
      return;
    }
    const win = window.open(state.urls.merged, '_blank');
    if (win) win.focus();
    else showToast('Izinkan pop-up untuk mencetak, atau unduh bundel lalu cetak dari aplikasi PDF.', true);
  }

  // ---------------------------------------------------------------------------
  // Format 2 helpers & preferences
  // ---------------------------------------------------------------------------

  /**
   * Switch Format SPD (1: lampiran saja, 2: halaman depan + lampiran)
   */
  function setFormat(format) {
    state.format = format === 2 ? 2 : 1;
    el.radioFormat1.checked = state.format === 1;
    el.radioFormat2.checked = state.format === 2;
    const open = state.format === 2;
    el.f2Fields.classList.toggle('is-open', open);
    el.f2Fields.setAttribute('aria-hidden', String(!open));
    el.f2Fields.inert = !open;
    store.set('format', state.format);
    if (open) {
      fillPetugasF2();
      fillAnggaran(false);
    }
    markStale();
    updateSummary();
  }

  /**
   * Pangkat/golongan and jabatan/instansi follow the selected petugas.
   */
  function fillPetugasF2() {
    const p = getCurrentPetugas();
    if (p.isOrganik) {
      el.inputGolongan.value = p.golongan || '';
      el.inputJabatanInstansi.value = p.jabatanInstansi || p.jabatan || '';
    } else if (el.inputGolongan.dataset.for !== 'mitra') {
      el.inputGolongan.value = Core.DEFAULTS.golonganMitra;
      el.inputJabatanInstansi.value = '';
    }
    el.inputGolongan.dataset.for = p.isOrganik ? 'organik' : 'mitra';
    el.inputJabatanInstansi.placeholder = p.isOrganik ? 'Terisi otomatis dari data pegawai' : 'Kosongkan untuk memakai jabatan';
  }

  /**
   * Fill Program/Kegiatan/Komponen and Mata anggaran from the kode akun.
   * Fields edited by hand are kept unless `force` is true.
   */
  function fillAnggaran(force) {
    const auto = Core.anggaranDariPembebanan(el.inputPembebanan.value);
    const values = {
      'program-kode': auto ? auto.program.kode : '',
      'program-uraian': auto ? auto.program.uraian : '',
      'kegiatan-kode': auto ? auto.kegiatan.kode : '',
      'kegiatan-uraian': auto ? auto.kegiatan.uraian : '',
      'komponen-kode': auto ? auto.komponen.kode : '',
      'komponen-uraian': auto ? auto.komponen.uraian : '',
      'mata-anggaran': auto ? auto.mataAnggaran : ''
    };
    document.querySelectorAll('[data-anggaran]').forEach((input) => {
      if (force) delete input.dataset.manual;
      if (input.dataset.manual === '1') return;
      input.value = values[input.dataset.anggaran];
    });
    if (force && !auto) showToast('Kode akun tidak dikenali. Isi Program/Kegiatan/Komponen secara manual.', true);
    updateSummary();
  }

  function savePpk() {
    store.set('ppk', currentPpk());
  }

  function loadPreferences() {
    const ppk = Object.assign({}, Core.PPK_DEFAULT, store.get('ppk', {}));
    el.inputPpkNama.value = ppk.nama || '';
    el.inputPpkNip.value = ppk.nip || '';
    el.inputPpkProgram.value = ppk.program || '';
    const last = store.get('terakhir', {});
    el.inputKodeKlasifikasi.value = Core.KODE_KLASIFIKASI_DEFAULT;
    Object.entries(REMEMBERED).forEach(([key, getter]) => {
      if (last[key]) getter().value = last[key];
    });
    setFormat(store.get('format', Core.DEFAULTS.format));
  }

  function rememberField(key) {
    const last = store.get('terakhir', {});
    last[key] = REMEMBERED[key]().value;
    store.set('terakhir', last);
  }

  function setPetugasMode(mode) {
    state.petugasMode = mode;
    const organik = mode === 'organik';
    el.radioOrganik.checked = organik;
    el.radioNonorganik.checked = !organik;
    el.labelPetugasOrganik.classList.toggle('active', organik);
    el.labelPetugasNonorganik.classList.toggle('active', !organik);
    el.containerOrganik.style.display = organik ? 'block' : 'none';
    el.containerNonorganik.style.display = organik ? 'none' : 'block';
    updateOrganikBadge();
    fillPetugasF2();
    updateSummary();
  }

  function setDatesSynced(synced) {
    el.syncDatesCheckbox.checked = synced;
    el.tglPerjalananContainer.style.display = synced ? 'none' : 'grid';
    if (synced) {
      el.tglMulai.value = el.tglSpd.value;
      el.tglSelesai.value = el.tglSpd.value;
    } else if (!el.tglMulai.value) {
      el.tglMulai.value = el.tglSpd.value;
    }
  }

  function toggleAccordion() {
    const isOpen = el.accordionContent.classList.toggle('open');
    el.accordionToggle.setAttribute('aria-expanded', String(isOpen));
    el.accordionIndicator.innerHTML = isOpen
      ? '<i class="bi bi-chevron-up" aria-hidden="true"></i> Sembunyikan'
      : '<i class="bi bi-chevron-down" aria-hidden="true"></i> Tampilkan';
  }

  /**
   * "Atur ulang form": clear what was typed, keep remembered preferences.
   */
  function resetForm() {
    if (!window.confirm('Kosongkan semua isian? Pilihan tersimpan (format, PPK, kode akun terakhir) tetap dipakai.')) return;
    el.form.reset();
    document.querySelectorAll('[data-anggaran]').forEach((input) => { delete input.dataset.manual; });
    delete el.inputGolongan.dataset.for;
    revokeUrls();
    el.resultActions.hidden = true;
    el.btnGenerate.hidden = false;
    state.visited = new Set([1]);
    state.revealed = new Set();
    setPetugasMode('organik');
    setDatesSynced(true);
    loadPreferences();
    goToStep(1);
    showToast('Form dikosongkan.');
  }

  // ---------------------------------------------------------------------------
  // Batch Excel
  // ---------------------------------------------------------------------------

  /**
   * Download sample Excel template (example rows use clearly fictional numbers)
   */
  function downloadExcelTemplate() {
    if (!window.XLSX) {
      showToast('Library Excel belum siap. Silakan muat ulang halaman.', true);
      return;
    }
    const row = (o) => Core.BATCH_COLUMNS.reduce((acc, k) => { acc[k] = o[k] || ''; return acc; }, {});
    const pegawai = (window.PEGAWAI_ORGANIK || [])[0] || {};
    const templateRows = [
      row({
        'Nomor Surat': 'B-11/7301/SS.330/2026', 'Tanggal ST': '15/07/2026', 'Tanggal SPD': '20/07/2026', 'Format SPD': '1',
        'Kategori': 'Organik', 'Nama Petugas': pegawai.nama,
        'Kecamatan Asal': 'Benteng', 'Kecamatan Tujuan': 'Bontomatene',
        'Tanggal Mulai': '20/07/2026', 'Tanggal Selesai': '20/07/2026',
        'Tujuan': 'Translok Petugas Pendataan SE2026 di Kecamatan Bontomatene',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2', 'Uraian Pembebanan': 'Transport Daerah Sulit'
      }),
      row({
        'Nomor Surat': 'B-12/7301/SS.330/2026', 'Tanggal ST': '15/07/2026', 'Tanggal SPD': '15/07/2026', 'Format SPD': '2',
        'Kategori': 'Mitra', 'Nama Petugas': 'Nama Mitra', 'NIP': '7301000000000000', 'Jabatan': 'Mitra Sensus/Survei',
        'Pangkat Golongan': '-', 'Kecamatan Asal': 'Benteng', 'Kecamatan Tujuan': 'Pasimarannu',
        'Tempat Keberangkatan': 'Kabupaten Kepulauan Selayar', 'Tanggal Mulai': '22/07/2026', 'Tanggal Selesai': '26/07/2026',
        'Tujuan': 'Translok Pendampingan Petugas SE2026', 'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2',
        'Uraian Pembebanan': 'Transport Daerah Sulit', 'Alat Angkutan': 'Kendaraan Umum'
      })
    ];
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(templateRows, { header: Core.BATCH_COLUMNS });
    window.XLSX.utils.book_append_sheet(wb, ws, 'Template SPD');
    window.XLSX.writeFile(wb, 'Template_Data_SPD.xlsx');
  }

  /**
   * Process uploaded Excel file into validated rows
   */
  function handleExcelFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        // raw: CSV text stays text so "05/07/2026" is not read as a US date.
        const workbook = window.XLSX.read(data, { type: 'array', raw: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = window.XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: '' });

        if (!json || json.length === 0) {
          showBatchMessage('File Excel kosong atau tidak memiliki baris data. Gunakan template yang disediakan.');
          return;
        }

        const ctx = {
          pegawai: window.PEGAWAI_ORGANIK || [],
          ppk: currentPpk(),
          tempatBerangkatF2: el.inputTempatBerangkat.value.trim() || Core.DEFAULTS.tempatBerangkatF2
        };
        state.batchRows = json.map((row, idx) => {
          const norm = Core.normalizeBatchRow(row, ctx);
          const built = Core.buildSpdData(norm.input);
          const errors = norm.errors.concat(built.errors.filter(e => !norm.errors.some(n => n.field === e.field)));
          return { excelRow: idx + 2, raw: row, data: built.data, errors };
        });

        renderBatchTable();
      } catch (err) {
        console.error(err);
        showBatchMessage(`Gagal membaca file Excel: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function showBatchMessage(msg) {
    el.batchMessage.textContent = msg;
    el.batchMessage.hidden = !msg;
  }

  function validBatchRows() {
    return state.batchRows.filter(r => r.errors.length === 0);
  }

  /**
   * Render batch preview table; invalid rows are marked with their reasons
   */
  function renderBatchTable() {
    const valid = validBatchRows().length;
    const invalid = state.batchRows.length - valid;
    el.batchCount.textContent = state.batchRows.length;
    el.batchTbody.innerHTML = '';

    state.batchRows.forEach((row) => {
      const d = row.data;
      const tr = document.createElement('tr');
      if (row.errors.length) tr.className = 'row-invalid';
      const cells = [
        String(row.excelRow),
        d.stNo || '-',
        d.tglSpdIndo || '-',
        `${Core.shortTempat(d.tempatBerangkat) || '-'} → ${Core.shortTempat(d.kecTujuan) || '-'}`,
        `${d.petugas.nama || '-'} (${d.petugas.isOrganik ? 'Organik' : 'Mitra'})`,
        d.format === 2 ? '2' : (d.format === 1 ? '1' : '?'),
        row.errors.length ? 'Perlu diperbaiki' : 'Siap'
      ];
      cells.forEach((c, i) => {
        const td = document.createElement('td');
        if (i === 1) {
          const strong = document.createElement('strong');
          strong.textContent = c;
          td.appendChild(strong);
        } else {
          td.textContent = c;
        }
        if (i === cells.length - 1) td.className = row.errors.length ? 'status-bad' : 'status-ok';
        tr.appendChild(td);
      });
      el.batchTbody.appendChild(tr);
      if (row.errors.length) {
        const er = document.createElement('tr');
        er.className = 'row-errors';
        const td = document.createElement('td');
        td.colSpan = cells.length;
        const msg = document.createElement('span');
        msg.className = 'row-error-text';
        msg.textContent = row.errors.map(e => e.message).join(' ');
        td.appendChild(msg);
        er.appendChild(td);
        el.batchTbody.appendChild(er);
      }
    });

    showBatchMessage(invalid
      ? `${invalid} baris bermasalah (ditandai merah) dan akan dilewati. ${valid} baris siap dibuat. Perbaiki di Excel lalu unggah ulang, atau lanjutkan dengan baris yang valid saja.`
      : '');
    const suffix = invalid ? ` (${valid} baris valid)` : '';
    el.btnBatchPdfText.textContent = `Unduh 1 bundel PDF${suffix}`;
    el.btnBatchZipText.textContent = `Unduh file terpisah (.zip)${suffix}`;
    el.btnGenerateBatchPdf.disabled = valid === 0;
    el.btnGenerateBatchZip.disabled = valid === 0;
    el.btnBatchReport.hidden = invalid === 0;
    el.dropzone.style.display = 'none';
    el.batchPreviewContainer.style.display = 'block';
  }

  /**
   * Excel report of the rows that need fixing, with the original columns.
   */
  function downloadBatchReport() {
    const rows = state.batchRows.filter(r => r.errors.length).map(r => Object.assign(
      { 'Baris Excel': r.excelRow, 'Masalah': r.errors.map(e => e.message).join(' ') }, r.raw));
    if (!rows.length) return;
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(rows), 'Perlu diperbaiki');
    window.XLSX.writeFile(wb, 'Laporan_Baris_Bermasalah.xlsx');
  }

  /**
   * Clear batch state
   */
  function clearBatch() {
    state.batchRows = [];
    el.batchTbody.innerHTML = '';
    el.batchPreviewContainer.style.display = 'none';
    el.dropzone.style.display = 'block';
    el.excelFileInput.value = '';
    el.batchProgress.style.display = 'none';
    showBatchMessage('');
  }

  function setProgress(pct, text) {
    el.progressBarFill.style.width = `${pct}%`;
    el.progressBar.setAttribute('aria-valuenow', String(pct));
    el.progressText.textContent = text;
  }

  /**
   * Run `perRow(bundle, row, i)` for every valid row with progress feedback.
   */
  async function runBatch(label, perRow) {
    const rows = validBatchRows();
    if (rows.length === 0 || state.busy) return false;
    state.busy = true;
    el.btnGenerateBatchPdf.disabled = true;
    el.btnGenerateBatchZip.disabled = true;
    el.batchProgress.style.display = 'block';
    try {
      const templates = await loadTemplates();
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(Math.round(((i + 1) / rows.length) * 100),
          `${label} ${i + 1} dari ${rows.length} (${row.data.petugas.nama} - ${row.data.stNo})...`);
        await perRow(await Render.buildBundle(row.data, templates), row, i);
      }
      return true;
    } catch (err) {
      console.error(err);
      showToast(`Terjadi kesalahan saat memproses batch: ${err.message}`, true);
      return false;
    } finally {
      state.busy = false;
      el.btnGenerateBatchPdf.disabled = false;
      el.btnGenerateBatchZip.disabled = false;
      el.batchProgress.style.display = 'none';
    }
  }

  /**
   * Batch generation to a single merged PDF containing all documents
   */
  async function generateBatchMergedPdf() {
    const master = await window.PDFLib.PDFDocument.create();
    const ok = await runBatch('Memproses', (bundle) => Render.appendDocs(master, [bundle.merged]));
    if (!ok) return;
    const total = validBatchRows().length;
    triggerDownload(pdfUrl(await master.save()), `Bundel_Semua_SPD_${total}_Data.pdf`, true);
    showToast(`Berhasil mengunduh ${total} set dokumen!`);
  }

  /**
   * Batch generation to a ZIP containing all separate PDFs
   */
  async function generateBatchZip() {
    if (!window.JSZip) {
      showToast('Library JSZip belum siap.', true);
      return;
    }
    const zip = new window.JSZip();
    const ok = await runBatch('Membuat PDF', async (bundle, row, i) => {
      const [st, spd, sup, merged] = await Promise.all([
        bundle.st.save(), bundle.spd.save(), bundle.super.save(), bundle.merged.save()
      ]);
      const cleanNo = fileSafe(row.data.stNo);
      const folder = zip.folder(`${String(i + 1).padStart(2, '0')}_${cleanNo}`);
      folder.file(`Bundel_Lengkap_${cleanNo}.pdf`, merged);
      folder.file(`Surat_Tugas_${cleanNo}.pdf`, st);
      folder.file(`SPD_${cleanNo}.pdf`, spd);
      folder.file(`Surat_Pernyataan_${cleanNo}.pdf`, sup);
    });
    if (!ok) return;
    const total = validBatchRows().length;
    const zipContent = await zip.generateAsync({ type: 'blob' });
    triggerDownload(URL.createObjectURL(zipContent), `Paket_SPD_Batch_${total}_Data.zip`, true);
    showToast(`Berhasil membuat arsip ZIP (${total} data)!`);
  }

  /**
   * Try background sync with Google Sheet. The local pegawai.js list is replaced only
   * when the sheet parses completely (nama, NIP, golongan, pangkat).
   */
  async function trySyncGoogleSheet() {
    try {
      const url = 'https://docs.google.com/spreadsheets/d/1hnGYZh1Ng61W8HYfYg5_DRRyvtSedklDSK2b6GEqUZc/export?format=csv&gid=2128965247';
      const res = await fetch(url);
      if (!res.ok) return;
      const result = Core.parsePegawaiCsv(await res.text());
      if (!result.complete) {
        console.warn('Sinkronisasi pegawai dilewati:', result.reason);
        return;
      }
      window.PEGAWAI_ORGANIK = result.pegawai;
      const now = new Date();
      state.pegawaiSource = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      populatePegawaiDropdown();
      updateSummary();
    } catch (e) {
      // Offline or CORS protected, seamlessly rely on pegawai.js
    }
  }

  // ---------------------------------------------------------------------------
  // Listeners
  // ---------------------------------------------------------------------------

  function setMode(batch) {
    el.modeSingleBtn.classList.toggle('active', !batch);
    el.modeBatchBtn.classList.toggle('active', batch);
    el.modeSingleBtn.setAttribute('aria-pressed', String(!batch));
    el.modeBatchBtn.setAttribute('aria-pressed', String(batch));
    el.singleModeSection.style.display = batch ? 'none' : 'block';
    el.batchModeSection.style.display = batch ? 'block' : 'none';
    document.body.classList.toggle('is-batch', batch);
  }

  /**
   * Initialize event handlers
   */
  function initListeners() {
    el.modeSingleBtn.addEventListener('click', () => setMode(false));
    el.modeBatchBtn.addEventListener('click', () => setMode(true));

    // Stepper
    el.stepLinks.forEach((btn) => {
      btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.goto, 10)));
    });
    document.querySelectorAll('[data-next]').forEach((btn) => btn.addEventListener('click', nextStep));
    document.querySelectorAll('[data-prev]').forEach((btn) => btn.addEventListener('click', () => goToStep(state.step - 1)));
    el.btnReset.addEventListener('click', resetForm);
    if (stepperQuery.addEventListener) stepperQuery.addEventListener('change', applyLayout);
    else stepperQuery.addListener(applyLayout);

    // On desktop, track which step is being edited.
    el.form.addEventListener('focusin', (e) => {
      const n = stepOf(e.target);
      if (!isStepper() && n !== state.step && e.target.closest('.step')) {
        // Moving on to a later section reveals the errors left behind.
        for (let i = 1; i < n; i++) state.revealed.add(i);
        state.step = n;
        state.visited.add(n);
        updateSummary();
      }
    });

    // Any edit makes generated documents stale and refreshes the summary.
    el.form.addEventListener('input', () => {
      markStale();
      updateSummary();
    });
    el.form.addEventListener('change', () => {
      markStale();
      updateSummary();
    });

    // Petugas Type Switch (Organik vs Mitra)
    el.radioOrganik.addEventListener('change', () => { if (el.radioOrganik.checked) setPetugasMode('organik'); });
    el.radioNonorganik.addEventListener('change', () => { if (el.radioNonorganik.checked) setPetugasMode('nonorganik'); });

    el.selectPegawaiOrganik.addEventListener('change', () => {
      updateOrganikBadge();
      fillPetugasF2();
      updateSummary();
    });

    // Format SPD
    [el.radioFormat1, el.radioFormat2].forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) setFormat(parseInt(radio.value, 10));
      });
    });

    // Anggaran: auto-fill from kode akun until the user edits a field by hand
    el.inputPembebanan.addEventListener('input', () => fillAnggaran(false));
    document.querySelectorAll('[data-anggaran]').forEach((input) => {
      input.addEventListener('input', () => { input.dataset.manual = '1'; });
    });
    el.btnIsiAnggaran.addEventListener('click', () => fillAnggaran(true));

    // Remembered habits
    Object.entries(REMEMBERED).forEach(([key, getter]) => {
      getter().addEventListener('change', () => rememberField(key));
    });

    // PPK
    el.selectPpk.addEventListener('change', () => {
      const p = (window.PEGAWAI_ORGANIK || [])[parseInt(el.selectPpk.value, 10)];
      if (!p) return;
      el.inputPpkNama.value = p.nama;
      el.inputPpkNip.value = p.nip;
      savePpk();
      updateSummary();
    });
    [el.inputPpkNama, el.inputPpkNip, el.inputPpkProgram].forEach((input) => {
      input.addEventListener('input', savePpk);
    });

    // Kecamatan change: auto update tujuan text if it ends with "di Kecamatan X"
    el.selectKecamatan.addEventListener('change', () => {
      const selectedKec = el.selectKecamatan.value;
      const currTujuan = el.inputTujuan.value;
      if (selectedKec && /di Kecamatan [A-Za-z\s]+$/.test(currTujuan)) {
        el.inputTujuan.value = currTujuan.replace(/di Kecamatan [A-Za-z\s]+$/, `di Kecamatan ${selectedKec}`);
      }
      updateSummary();
    });

    // Date sync
    el.tglSpd.addEventListener('change', () => {
      if (el.syncDatesCheckbox.checked) setDatesSynced(true);
      updateSummary();
    });
    el.syncDatesCheckbox.addEventListener('change', () => {
      setDatesSynced(el.syncDatesCheckbox.checked);
      updateSummary();
    });

    el.accordionToggle.addEventListener('click', toggleAccordion);

    el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      generateSingle();
    });

    // Result actions
    el.btnDownloadBundle.addEventListener('click', () => downloadDoc('merged'));
    el.downloadButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        downloadDoc(btn.dataset.download);
        btn.closest('details').open = false;
      });
    });
    el.btnPrint.addEventListener('click', printBundle);

    // Preview tabs
    el.tabMerged.addEventListener('click', () => updateViewerTab('merged'));
    el.tabSt.addEventListener('click', () => updateViewerTab('st'));
    el.tabSpd.addEventListener('click', () => updateViewerTab('spd'));
    el.tabSuper.addEventListener('click', () => updateViewerTab('super'));

    // Excel Batch Listeners
    el.btnDownloadTemplate.addEventListener('click', downloadExcelTemplate);

    el.dropzone.addEventListener('click', () => el.excelFileInput.click());
    el.dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.excelFileInput.click();
      }
    });
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
    el.btnBatchReport.addEventListener('click', downloadBatchReport);
  }

  // Init
  function init() {
    loadPreferences();
    populatePegawaiDropdown();
    initListeners();
    applyLayout();
    goToStep(1, { scroll: false });
    trySyncGoogleSheet();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
