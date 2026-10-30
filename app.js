/**
 * Generator Surat Tugas, SPD, dan Surat Pernyataan BPS Kabupaten Kepulauan Selayar
 * UI layer: form, ringkasan, batch Excel, preview. Pure logic lives in core.js and the
 * PDF rendering in render.js.
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

    // Single Form
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

    noSurat: $('input-no-surat'),
    tglSpd: $('input-tgl-spd'),
    tglSpdPreview: $('tgl-spd-preview'),
    selectKecamatanAsal: $('select-kecamatan-asal'),
    selectKecamatan: $('select-kecamatan'),
    syncDatesCheckbox: $('sync-dates-checkbox'),
    tglPerjalananContainer: $('tgl-perjalanan-container'),
    tglMulai: $('input-tgl-mulai'),
    tglSelesai: $('input-tgl-selesai'),
    inputTujuan: $('input-tujuan'),
    inputPembebanan: $('input-pembebanan'),
    inputUraianBeban: $('input-uraian-beban'),
    inputTglSt: $('input-tgl-st'),
    inputUnitKerja: $('input-unit-kerja'),
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
    selectPpk: $('select-ppk'),
    inputPpkNama: $('input-ppk-nama'),
    inputPpkNip: $('input-ppk-nip'),
    inputPpkProgram: $('input-ppk-program'),
    accordionToggle: $('accordion-toggle'),
    accordionContent: $('accordion-content'),
    accordionIndicator: $('accordion-indicator'),
    formErrors: $('form-errors'),

    // Single Summary
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
    formCard: $('form-card'),
    summaryCard: $('summary-card'),
    summaryToggle: $('summary-toggle'),
    summaryBody: $('summary-body'),
    summaryToggleText: $('summary-toggle-text'),
    previewContainer: $('preview-container'),

    // Single Actions
    btnGenerate: $('btn-generate'),
    btnDownloadTab: $('btn-download-tab'),

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
    batchProgress: $('batch-progress'),
    progressBarFill: $('progress-bar-fill'),
    progressText: $('progress-text'),

    // Preview Toolbar
    tabMerged: $('tab-merged'),
    tabSt: $('tab-st'),
    tabSpd: $('tab-spd'),
    tabSuper: $('tab-super'),
    btnPrint: $('btn-print'),
    pdfViewer: $('pdf-viewer'),
    emptyState: $('empty-state'),
    toast: $('toast'),
    toastText: $('toast-text'),
  };

  // Form fields addressed by the validator's `field` names.
  const FIELD_INPUTS = {
    nama: () => (state.petugasMode === 'organik' ? el.selectPegawaiOrganik : el.inputNama),
    nip: () => (state.petugasMode === 'organik' ? el.selectPegawaiOrganik : el.inputNip),
    jabatan: () => (state.petugasMode === 'organik' ? el.selectPegawaiOrganik : el.inputJabatan),
    noSurat: () => el.noSurat,
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

  // State
  const state = {
    urls: { st: null, spd: null, super: null, merged: null },
    activeTab: 'merged',
    batchRows: [],
    petugasMode: 'organik', // 'organik' | 'nonorganik'
    pegawaiSource: 'lokal',
    format: 1,
    pageCount: 3,
    showErrors: false,
    busy: false
  };

  /**
   * Toast notification (announced through aria-live on #toast)
   */
  let toastTimer = null;
  function showToast(msg, isError) {
    if (el.toastText) el.toastText.textContent = msg;
    else el.toast.textContent = msg;
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

    if (el.pegawaiSource) {
      el.pegawaiSource.textContent = state.pegawaiSource === 'lokal'
        ? `Data pegawai: lokal (${list.length} orang)`
        : `Data pegawai: tersinkron ${state.pegawaiSource} (${list.length} orang)`;
    }
    updateOrganikBadge();
  }

  function populatePpkDropdown(list) {
    if (!el.selectPpk) return;
    el.selectPpk.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '\u2014 Pilih untuk mengisi otomatis \u2014';
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
      noSurat: el.noSurat.value,
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

  /**
   * Show validator errors next to the fields (and a short list above the button)
   */
  function renderErrors(errors) {
    document.querySelectorAll('.field-error').forEach(n => n.remove());
    document.querySelectorAll('[aria-invalid="true"]').forEach(n => {
      n.removeAttribute('aria-invalid');
      const ids = (n.getAttribute('aria-describedby') || '').split(' ').filter(id => !id.startsWith('err-'));
      if (ids.length) n.setAttribute('aria-describedby', ids.join(' '));
      else n.removeAttribute('aria-describedby');
    });
    if (el.formErrors) {
      el.formErrors.innerHTML = '';
      el.formErrors.hidden = true;
    }
    if (!state.showErrors) return;

    const seen = new Set();
    for (const err of errors) {
      const getter = FIELD_INPUTS[err.field];
      const input = getter && getter();
      if (!input || seen.has(input)) continue;
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

    if (el.formErrors && errors.length) {
      const p = document.createElement('p');
      p.textContent = `Ada ${errors.length} isian yang perlu diperbaiki:`;
      const ul = document.createElement('ul');
      for (const err of errors) {
        const li = document.createElement('li');
        const getter = FIELD_INPUTS[err.field];
        const input = getter && getter();
        if (input) {
          const a = document.createElement('a');
          a.href = `#${input.id}`;
          a.textContent = err.message;
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
      el.formErrors.hidden = false;
    }
  }

  function focusField(input) {
    if (el.accordionContent.contains(input) && !el.accordionContent.classList.contains('open')) {
      el.accordionToggle.click();
    }
    input.focus();
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /**
   * Update live summary and inline validation
   */
  function updateSummary() {
    const { data, errors } = Core.buildSpdData(collectInput());
    const dash = (v) => v || '-';

    el.tglSpdPreview.textContent = dash(data.tglSpdIndo);
    el.sumNoSt.textContent = dash(data.stNo);
    el.sumNoSpd.textContent = dash(data.spdNo);
    el.sumTglSpd.textContent = dash(data.tglSpdIndo);
    el.sumWaktu.textContent = data.tglMulaiIndo ? data.waktuStr : '-';
    el.sumKecamatan.textContent = `${dash(data.kecAsal)} → ${dash(data.kecTujuan)}`;
    el.sumPetugas.textContent = data.petugas.nama
      ? `${data.petugas.nama} (${data.petugas.nip || '-'}) [${data.petugas.isOrganik ? 'Organik' : 'Mitra'}]`
      : '-';
    el.sumJabatan.textContent = dash(data.petugas.jabatan);
    if (el.sumTujuan) el.sumTujuan.textContent = dash(data.tujuan);
    if (el.sumLama) el.sumLama.textContent = data.lamaHari ? `${data.lamaHari} hari` : '-';
    if (el.sumFormat) {
      el.sumFormat.textContent = data.format === 2 ? 'Format 2 (halaman depan + lampiran, 4 hal)' : 'Format 1 (lampiran saja, 3 hal)';
    }
    el.sumKecamatan.textContent = `${dash(data.tempatBerangkat)} \u2192 ${dash(data.kecTujuan)}`;
    renderErrors(errors);
    return { data, errors };
  }

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
    if (!btn) return;
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
   * Generate Single Set of Documents
   */
  async function generateSingle() {
    if (state.busy) return;
    state.showErrors = true;
    const { data, errors } = updateSummary();
    if (errors.length) {
      const getter = FIELD_INPUTS[errors[0].field];
      if (getter && getter()) focusField(getter());
      showToast('Periksa isian yang ditandai merah.', true);
      return;
    }

    state.busy = true;
    setBusy(el.btnGenerate, true, '<i class="bi bi-hourglass-split"></i> Memproses PDF...');
    try {
      const bundle = await Render.buildBundle(data, await loadTemplates());
      const [st, spd, sup, merged] = await Promise.all([
        bundle.st.save(), bundle.spd.save(), bundle.super.save(), bundle.merged.save()
      ]);

      revokeUrls();
      state.urls = { st: pdfUrl(st), spd: pdfUrl(spd), super: pdfUrl(sup), merged: pdfUrl(merged) };
      state.pageCount = bundle.pageCount;

      if (el.btnDownloadTab) el.btnDownloadTab.disabled = false;
      el.btnPrint.disabled = false;

      updateViewerTab(state.activeTab);
      showToast('Berkas berhasil dibuat!');
    } catch (err) {
      console.error(err);
      showToast(`Gagal membuat dokumen: ${err.message}`, true);
    } finally {
      state.busy = false;
      setBusy(el.btnGenerate, false);
    }
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

    if (el.btnDownloadTab) {
      const titles = {
        merged: `Unduh Bundel (${state.pageCount} Hal)`,
        st: 'Unduh Surat Tugas',
        spd: 'Unduh SPD',
        super: 'Unduh Surat Pernyataan'
      };
      el.btnDownloadTab.title = titles[tab] || 'Unduh';
    }

    el.tabMerged.textContent = `Bundel (${state.pageCount} Hal)`;
    el.tabSpd.textContent = state.pageCount === 4 ? 'SPD (2 Hal)' : 'SPD';

    const targetUrl = state.urls[tab];
    if (targetUrl) {
      el.emptyState.style.display = 'none';
      el.pdfViewer.style.display = 'block';
      el.pdfViewer.src = targetUrl;
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

  /**
   * Sync preview container height with bottom of Generate Dokumen button
   */
  function syncPreviewHeight() {
    if (window.innerWidth <= 1024) {
      if (el.previewContainer) el.previewContainer.style.height = '';
      return;
    }
    const btnGen = el.btnGenerate;
    const preview = el.previewContainer;
    if (!btnGen || !preview) return;

    const btnBottom = btnGen.getBoundingClientRect().bottom;
    const previewTop = preview.getBoundingClientRect().top;
    const targetHeight = Math.round(btnBottom - previewTop);

    if (targetHeight > 400) {
      preview.style.height = `${targetHeight}px`;
    }
  }

  /**
   * Toggle Ringkasan Dokumen minimize/maximize
   */
  function toggleSummary() {
    if (!el.summaryCard || !el.summaryBody) return;
    const isExpanded = el.summaryCard.classList.toggle('expanded');
    el.summaryBody.style.display = isExpanded ? 'block' : 'none';
    if (el.summaryToggleText) {
      el.summaryToggleText.textContent = isExpanded ? 'Tutup' : 'Buka';
    }
    if (el.summaryToggle) {
      el.summaryToggle.setAttribute('aria-expanded', String(isExpanded));
    }
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
    const templateRows = [
      row({
        'Nomor Surat': 'B-11/7301/SS.330/2026', 'Tanggal ST': '15/07/2026', 'Tanggal SPD': '20/07/2026',
        'Kategori': 'Organik', 'Nama Petugas': (window.PEGAWAI_ORGANIK && window.PEGAWAI_ORGANIK[0] || {}).nama,
        'Kecamatan Asal': 'Benteng', 'Kecamatan Tujuan': 'Bontomatene',
        'Tanggal Mulai': '20/07/2026', 'Tanggal Selesai': '20/07/2026',
        'Tujuan': 'Translok Petugas Pendataan SE2026 di Kecamatan Bontomatene',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2', 'Uraian Pembebanan': 'Transport Daerah Sulit'
      }),
      row({
        'Nomor Surat': 'B-12/7301/SS.330/2026', 'Tanggal ST': '15/07/2026', 'Tanggal SPD': '24/07/2026',
        'Kategori': 'Mitra', 'Nama Petugas': 'Nama Mitra', 'NIP': '7301000000000000', 'Jabatan': 'Mitra Sensus/Survei',
        'Kecamatan Asal': 'Benteng', 'Kecamatan Tujuan': 'Pasimarannu',
        'Tanggal Mulai': '24/07/2026', 'Tanggal Selesai': '26/07/2026',
        'Tujuan': 'Translok Petugas Pendataan SE2026 di Kecamatan Pasimarannu',
        'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2', 'Uraian Pembebanan': 'Transport Daerah Sulit'
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
          showBatchMessage('File Excel kosong atau tidak memiliki baris data.');
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
    if (!el.batchMessage) return;
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
        d.petugas.nama || '-',
        d.format === 2 ? '2' : (d.format === 1 ? '1' : '?'),
        d.petugas.isOrganik ? 'Organik' : 'Mitra'
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
        tr.appendChild(td);
      });
      el.batchTbody.appendChild(tr);
      if (row.errors.length) {
        const er = document.createElement('tr');
        er.className = 'row-errors';
        const td = document.createElement('td');
        td.colSpan = cells.length;
        td.textContent = row.errors.map(e => e.message).join(' ');
        er.appendChild(td);
        el.batchTbody.appendChild(er);
      }
    });

    showBatchMessage(invalid
      ? `${invalid} baris bermasalah (ditandai merah) dan akan dilewati. ${valid} baris siap dibuat.`
      : '');
    el.btnGenerateBatchPdf.disabled = valid === 0;
    el.btnGenerateBatchZip.disabled = valid === 0;
    el.dropzone.style.display = 'none';
    el.batchPreviewContainer.style.display = 'block';
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
        el.progressBarFill.style.width = `${Math.round(((i + 1) / rows.length) * 100)}%`;
        el.progressText.textContent = `${label} ${i + 1} dari ${rows.length} (${row.data.petugas.nama} - ${row.data.stNo})...`;
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
    el.progressText.textContent = 'Menyusun berkas PDF akhir...';
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

  /**
   * Switch Format SPD (1: lampiran saja, 2: halaman depan + lampiran)
   */
  function setFormat(format) {
    state.format = format === 2 ? 2 : 1;
    el.radioFormat1.checked = state.format === 1;
    el.radioFormat2.checked = state.format === 2;
    el.f2Fields.hidden = state.format !== 2;
    store.set('format', state.format);
    if (state.format === 2) {
      fillPetugasF2();
      fillAnggaran(false);
    }
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
    setFormat(store.get('format', Core.DEFAULTS.format));
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
        fillPetugasF2();
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
        fillPetugasF2();
        updateSummary();
      }
    });

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
      input.addEventListener('input', () => {
        input.dataset.manual = '1';
        updateSummary();
      });
    });
    el.btnIsiAnggaran.addEventListener('click', () => fillAnggaran(true));

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
      input.addEventListener('input', () => {
        savePpk();
        updateSummary();
      });
    });

    [el.inputTempatBerangkat, el.inputGolongan, el.inputJabatanInstansi, el.inputAlatAngkut,
      el.inputTingkatBiaya, el.inputKeterangan].forEach((input) => {
      input.addEventListener('input', updateSummary);
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
      el.noSurat, el.tglMulai, el.tglSelesai, el.inputTujuan, el.inputTglSt, el.selectKecamatanAsal,
      el.inputPembebanan, el.inputUraianBeban, el.inputNama, el.inputNip,
      el.inputJabatan, el.inputUnitKerja
    ].forEach(input => {
      if (input) {
        input.addEventListener('input', updateSummary);
        input.addEventListener('change', updateSummary);
      }
    });

    el.accordionToggle.addEventListener('click', () => {
      el.accordionContent.classList.toggle('open');
      const isOpen = el.accordionContent.classList.contains('open');
      el.accordionToggle.setAttribute('aria-expanded', String(isOpen));
      el.accordionIndicator.innerHTML = isOpen
        ? '<i class="bi bi-chevron-up"></i> Sembunyikan'
        : '<i class="bi bi-chevron-down"></i> Tampilkan';
    });

    el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      generateSingle();
    });

    // Download active tab button
    if (el.btnDownloadTab) {
      el.btnDownloadTab.addEventListener('click', () => {
        const tglStr = Core.formatIndoDate(el.tglSpd.value);
        const no = fileSafe(Core.formatNomor(el.noSurat.value).stNo);
        const names = {
          st: 'Surat Tugas', spd: 'SPD', super: 'Surat Pernyataan', merged: 'Bundel SPD Lengkap'
        };
        triggerDownload(state.urls[state.activeTab], `${names[state.activeTab]} - ${no} - ${tglStr}.pdf`);
      });
    }

    // Preview tabs
    el.tabMerged.addEventListener('click', () => updateViewerTab('merged'));
    el.tabSt.addEventListener('click', () => updateViewerTab('st'));
    el.tabSpd.addEventListener('click', () => updateViewerTab('spd'));
    el.tabSuper.addEventListener('click', () => updateViewerTab('super'));

    el.btnPrint.addEventListener('click', () => {
      if (el.pdfViewer && el.pdfViewer.contentWindow) {
        el.pdfViewer.contentWindow.print();
      } else if (state.urls.merged) {
        const win = window.open(state.urls.merged, '_blank');
        if (win) {
          win.focus();
          win.print();
        }
      }
    });

    // Summary Card minimize / maximize
    if (el.summaryToggle) {
      el.summaryToggle.addEventListener('click', toggleSummary);
      el.summaryToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSummary();
        }
      });
    }

    // Sync preview height on resize and form changes
    if (window.ResizeObserver && el.formCard) {
      const ro = new ResizeObserver(() => syncPreviewHeight());
      ro.observe(el.formCard);
    }
    window.addEventListener('resize', syncPreviewHeight);

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
  }

  // Init
  function init() {
    loadPreferences();
    populatePegawaiDropdown();
    updateSummary();
    initListeners();
    syncPreviewHeight();
    trySyncGoogleSheet();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
