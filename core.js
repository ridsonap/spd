/**
 * SPDCore: pure helpers shared by the browser app, the PDF renderers and the Node tests.
 * UMD: exposes window.SPDCore in the browser and module.exports in Node.
 * No DOM, no pdf-lib, no network.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SPDCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuration constants (single source of truth)
  // ---------------------------------------------------------------------------

  const KANTOR = {
    instansi: 'Badan Pusat Statistik Kepulauan Selayar',
    alamat: ['Jl RE Martadinata No 5, Benteng', 'Benteng 92812'],
    kotaTerbit: 'Benteng',
    unitKerja: 'BPS Kabupaten Kepulauan Selayar',
    tempatKedudukan: 'Kabupaten Kepulauan Selayar'
  };

  // Kepala BPS printed on SPD lampiran (both formats). Matches the template text
  // so Format 1 output stays byte-identical.
  const KEPALA_BPS = {
    nama: 'Muhammad Nur,S.Sos',
    nip: '197501281998031002',
    jabatan: 'Kepala BPS Kabupaten Kepulauan Selayar'
  };

  const PPK_DEFAULT = {
    nama: 'Fakhri Hafidzul Azhar,S.Tr.Stat.',
    nip: '199801112021041001',
    program: 'Program Penyediaan dan Pelayanan Informasi Statistik'
  };

  const DEFAULTS = {
    format: 1,
    alatAngkut: 'Kendaraan Umum',
    tempatBerangkatF2: KANTOR.tempatKedudukan,
    golonganMitra: '-'
  };

  const KECAMATAN = [
    'Benteng', 'Bontoharu', 'Bontomanai', 'Bontomatene', 'Bontosikuyu', 'Buki',
    'Pasimarannu', 'Pasimasunggu', 'Pasimasunggu Timur', 'Pasilambena', 'Takabonerate'
  ];

  // Small lookup for "Pembebanan anggaran" descriptions. Unknown codes yield ''
  // and stay editable in the form / Excel.
  const URAIAN_PROGRAM = {
    GG: 'Program Penyediaan dan Pelayanan Informasi Statistik'
  };
  const URAIAN_KEGIATAN = {
    '2902': 'Penyediaan dan Pengembangan Statistik Distribusi'
  };
  // Keyed by "<kegiatan>.<komponen>" because komponen codes repeat across kegiatan.
  const URAIAN_KOMPONEN = {
    '2902.530': 'Pelaksanaan SE2026'
  };

  const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // ---------------------------------------------------------------------------
  // Dates
  // ---------------------------------------------------------------------------

  /**
   * Parse "YYYY-MM-DD" into {y, m, d}; returns null for anything that is not a real date.
   */
  function parseIsoDate(str) {
    const m = String(str || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    const y = +m[1];
    const mo = +m[2];
    const d = +m[3];
    const t = new Date(Date.UTC(y, mo - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
    return { y, m: mo, d };
  }

  function isIsoDate(str) {
    return parseIsoDate(str) !== null;
  }

  function toIso(y, m, d) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

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
   * Human friendly range: "22–26 Juni 2026", "30 Juni – 2 Juli 2026", "20 Juli 2026".
   */
  function formatRentangTanggal(mulai, selesai) {
    const a = parseIsoDate(mulai);
    const b = parseIsoDate(selesai);
    if (!a || !b) return [formatIndoDate(mulai), formatIndoDate(selesai)].filter(Boolean).join(' s.d. ');
    if (mulai === selesai) return formatIndoDate(mulai);
    if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${INDO_MONTHS[b.m - 1]} ${b.y}`;
    if (a.y === b.y) return `${a.d} ${INDO_MONTHS[a.m - 1]} – ${b.d} ${INDO_MONTHS[b.m - 1]} ${b.y}`;
    return `${formatIndoDate(mulai)} – ${formatIndoDate(selesai)}`;
  }

  /**
   * Inclusive number of travel days between two ISO dates (22–26 Juni = 5).
   * Throws RangeError for invalid dates or when selesai is before mulai.
   */
  function hitungLamaHari(mulai, selesai) {
    const a = parseIsoDate(mulai);
    const b = parseIsoDate(selesai);
    if (!a || !b) throw new RangeError('Tanggal tidak valid');
    const diff = (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000;
    if (diff < 0) throw new RangeError('Tanggal selesai tidak boleh sebelum tanggal mulai');
    return diff + 1;
  }

  /**
   * Parse a date from an Excel/CSV cell into "YYYY-MM-DD".
   * Supports Excel serial numbers (pure UTC arithmetic, so the result never depends on
   * the user's time zone), Date objects, "YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY" and
   * Indonesian text ("22 Juni 2026"). Unrecognised input is returned trimmed so the
   * validator can report it.
   */
  function parseExcelDate(val) {
    if (val === null || val === undefined || val === '') return '';

    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      return toIso(val.getFullYear(), val.getMonth() + 1, val.getDate());
    }

    let serial = null;
    if (typeof val === 'number') serial = val;
    else if (/^\d{4,6}(\.\d+)?$/.test(String(val).trim())) serial = parseFloat(String(val).trim());

    if (serial !== null) {
      let days = Math.floor(serial);
      if (days < 1) return '';
      // Excel treats 1900 as a leap year: serial 60 is the fictitious 29 Feb 1900.
      if (days < 61) days += 1;
      const t = new Date(Date.UTC(1899, 11, 30) + days * 86400000);
      return toIso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    }

    const str = String(val).trim();
    let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
    if (m) return toIso(+m[1], +m[2], +m[3]);

    m = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (m) return toIso(+m[3], +m[2], +m[1]);

    m = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      const idx = INDO_MONTHS.findIndex(n => n.toLowerCase() === m[2].toLowerCase());
      if (idx >= 0) return toIso(+m[3], idx + 1, +m[1]);
    }
    return str;
  }

  // ---------------------------------------------------------------------------
  // Text helpers
  // ---------------------------------------------------------------------------

  /**
   * Format nomor surat for ST/Super (with "B-") and SPD (without "B-").
   * Never invents a classification code; use isNomorLengkap() to validate.
   */
  function formatNomor(raw) {
    const cleaned = String(raw || '').trim().replace(/^NOMOR\s*:\s*/i, '');
    const core = cleaned.replace(/^B-/i, '');
    if (!core) return { stNo: '', spdNo: '', superNo: '' };
    const stNo = `B-${core}`;
    return { stNo, spdNo: core, superNo: stNo };
  }

  /**
   * True when the number has at least three "/"-separated parts, e.g. B-11/7301/SS.330/2026.
   */
  function isNomorLengkap(raw) {
    const { spdNo } = formatNomor(raw);
    return /^[^/\s]+(\/[^/\s]+){2,}$/.test(spdNo);
  }

  /**
   * Format kecamatan name with "Kecamatan " prefix
   */
  function formatKecamatan(raw) {
    let kec = String(raw || '').trim();
    if (!kec) return '';
    if (!/^kecamatan\s+/i.test(kec)) {
      kec = `Kecamatan ${kec}`;
    }
    return kec.replace(/^kecamatan/i, 'Kecamatan');
  }

  /**
   * "Kecamatan Pasimarannu" -> "Pasimarannu", "Kabupaten Kepulauan Selayar" -> "Kab. Kep. Selayar"
   */
  function shortTempat(str) {
    return String(str || '')
      .replace(/^Kecamatan\s+/i, '')
      .replace(/^Kabupaten\s+/i, 'Kab. ')
      .replace(/Kepulauan\s+/i, 'Kep. ');
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
   * Wrap text into lines of at most maxChars characters.
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
   * Wrap text by measured width. `measure(str)` returns the width in points.
   * Words longer than maxWidth are broken by characters so nothing overflows.
   */
  function wrapByWidth(text, measure, maxWidth) {
    const str = String(text || '').trim();
    if (!str) return [''];
    const lines = [];
    for (const para of str.split(/\r?\n/)) {
      const words = para.trim().split(/\s+/).filter(Boolean);
      let cur = '';
      for (let w of words) {
        const candidate = cur ? `${cur} ${w}` : w;
        if (measure(candidate) <= maxWidth) {
          cur = candidate;
          continue;
        }
        if (cur) lines.push(cur);
        cur = '';
        while (measure(w) > maxWidth && w.length > 1) {
          let n = w.length - 1;
          while (n > 1 && measure(w.slice(0, n)) > maxWidth) n--;
          lines.push(w.slice(0, n));
          w = w.slice(n);
        }
        cur = w;
      }
      if (cur) lines.push(cur);
    }
    return lines.length > 0 ? lines : [''];
  }

  // ---------------------------------------------------------------------------
  // WinAnsi (cp1252) encoding for PDF content streams
  // ---------------------------------------------------------------------------

  // Unicode -> cp1252 byte for the 0x80–0x9F block. The PDF fonts use /WinAnsiEncoding
  // and TextDecoder('latin1') is windows-1252 per the WHATWG Encoding spec.
  const CP1252_HIGH = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86,
    0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
    0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95,
    0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
    0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
  };
  // Bytes WHATWG decodes to the same C1 code point (undefined in cp1252).
  const CP1252_PASSTHROUGH = new Set([0x81, 0x8D, 0x8F, 0x90, 0x9D]);

  // Characters outside WinAnsi that have an obvious WinAnsi equivalent.
  const WINANSI_NORMALIZE = {
    '‐': '-', '‑': '-', '‒': '-', '−': '-', '―': '—',
    ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ',
    ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ',
    '​': '', '‌': '', '‍': '', '﻿': '',
    '′': "'", '″': '"', '‛': '‘', '‟': '“', '․': '.'
  };

  function winAnsiByte(cp) {
    if (cp < 0x80 || (cp >= 0xA0 && cp <= 0xFF) || CP1252_PASSTHROUGH.has(cp)) return cp;
    return CP1252_HIGH[cp] !== undefined ? CP1252_HIGH[cp] : -1;
  }

  /**
   * NFC-normalise and replace characters that have a WinAnsi equivalent.
   */
  function normalizeWinAnsi(str) {
    let s = String(str == null ? '' : str);
    if (s.normalize) s = s.normalize('NFC');
    return s.replace(/[ -‍‐-‒―‛‟․ ′″−﻿]/g,
      ch => WINANSI_NORMALIZE[ch]);
  }

  /**
   * Characters (after normalisation) that WinAnsi cannot represent.
   */
  function findUnmappable(str) {
    const bad = [];
    for (const ch of normalizeWinAnsi(str)) {
      if (winAnsiByte(ch.codePointAt(0)) < 0 && !bad.includes(ch)) bad.push(ch);
    }
    return bad;
  }

  /**
   * Normalise and replace unmappable characters with "?".
   */
  function sanitizeWinAnsi(str) {
    let out = '';
    for (const ch of normalizeWinAnsi(str)) {
      out += winAnsiByte(ch.codePointAt(0)) < 0 ? '?' : ch;
    }
    return out;
  }

  /**
   * Encode a decoded content stream back to WinAnsi (cp1252) bytes.
   * Unmappable characters become "?" and are pushed to `warnings` when given.
   */
  function encodeLatin1(str, warnings) {
    const s = normalizeWinAnsi(str);
    const out = new Uint8Array(s.length);
    let n = 0;
    for (const ch of s) {
      let b = winAnsiByte(ch.codePointAt(0));
      if (b < 0) {
        if (warnings && !warnings.includes(ch)) warnings.push(ch);
        b = 0x3F;
      }
      out[n++] = b;
    }
    return out.subarray(0, n);
  }

  /**
   * Replace that fails loudly. `find` is a string or RegExp; the replacement is
   * inserted literally (no "$&" expansion). With { all: true } every occurrence is
   * replaced. Throws when the pattern is not present.
   */
  function replaceStrict(text, find, repl, label, opts) {
    const all = !!(opts && opts.all);
    const found = typeof find === 'string' ? text.indexOf(find) !== -1 : new RegExp(find.source, find.flags.replace('g', '')).test(text);
    if (!found) {
      throw new Error(`Template tidak cocok: pola "${label}" tidak ditemukan. Periksa file template PDF.`);
    }
    if (typeof find === 'string') {
      return all ? text.split(find).join(repl) : text.replace(find, () => repl);
    }
    const flags = all ? (find.flags.includes('g') ? find.flags : find.flags + 'g') : find.flags.replace('g', '');
    return text.replace(new RegExp(find.source, flags), () => repl);
  }

  // ---------------------------------------------------------------------------
  // Pembebanan anggaran
  // ---------------------------------------------------------------------------

  /**
   * "GG 2902 BMA 006 530 B 524113 2" ->
   * { program: 'GG', kegiatan: '2902', kro: 'BMA', ro: '006', komponen: '530',
   *   subkomponen: 'B', akun: '524113', detail: '2' }
   * Returns null when the string does not follow that structure.
   */
  function parsePembebanan(str) {
    const t = String(str || '').trim().toUpperCase().split(/\s+/).filter(Boolean);
    if (t.length < 7) return null;
    const [program, kegiatan, kro, ro, komponen, subkomponen, akun, ...rest] = t;
    if (!/^[A-Z]{2}$/.test(program) || !/^\d{4}$/.test(kegiatan) || !/^[A-Z]{3}$/.test(kro) ||
        !/^\d{3}$/.test(ro) || !/^\d{3}$/.test(komponen) || !/^[A-Z]$/.test(subkomponen) ||
        !/^\d{6}$/.test(akun)) {
      return null;
    }
    return { program, kegiatan, kro, ro, komponen, subkomponen, akun, detail: rest.join(' ') };
  }

  function lookupUraian(jenis, kode, kegiatan) {
    const k = String(kode || '').trim().toUpperCase();
    if (!k) return '';
    if (jenis === 'program') return URAIAN_PROGRAM[k] || '';
    if (jenis === 'kegiatan') return URAIAN_KEGIATAN[k] || '';
    if (jenis === 'komponen') return URAIAN_KOMPONEN[`${String(kegiatan || '').trim()}.${k}`] || '';
    return '';
  }

  /**
   * Split "GG Program Penyediaan ..." into { kode, uraian }. A bare code stays a code.
   */
  function splitKodeUraian(str) {
    const s = String(str || '').trim();
    const m = s.match(/^([A-Za-z]{2}|\d{3,4})(?:\s+(.+))?$/);
    if (!m) return { kode: '', uraian: s };
    return { kode: m[1].toUpperCase(), uraian: (m[2] || '').trim() };
  }

  /**
   * Suggested Program/Kegiatan/Komponen and Mata anggaran from the kode akun.
   */
  function anggaranDariPembebanan(str) {
    const p = parsePembebanan(str);
    if (!p) return null;
    return {
      program: { kode: p.program, uraian: lookupUraian('program', p.program) },
      kegiatan: { kode: p.kegiatan, uraian: lookupUraian('kegiatan', p.kegiatan) },
      komponen: { kode: p.komponen, uraian: lookupUraian('komponen', p.komponen, p.kegiatan) },
      mataAnggaran: p.akun
    };
  }

  // ---------------------------------------------------------------------------
  // Pegawai (Google Sheet CSV)
  // ---------------------------------------------------------------------------

  /**
   * RFC 4180 CSV parser (quoted fields, escaped quotes, newlines inside quotes).
   */
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inQuotes) {
        if (ch === '"') {
          if (s[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
        } else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && s[i + 1] === '\n') i++;
        row.push(cur); rows.push(row); row = []; cur = '';
      } else cur += ch;
    }
    if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
    return rows;
  }

  function normHeader(h) {
    return String(h || '').toLowerCase().replace(/\s*\/\s*/g, '/').replace(/[^a-z0-9/]+/g, ' ').trim();
  }

  // PPPK NIPs carry "21" where PNS NIPs carry the TMT month (01–12).
  function isNipPppk(nip) {
    return /^\d{18}$/.test(nip) && nip.slice(12, 14) === '21';
  }

  function jabatanPendek(raw) {
    const j = String(raw || '').replace(/\s+/g, ' ').trim();
    if (/^Kepala BPS Kabupaten\/Kota$/i.test(j)) return KEPALA_BPS.jabatan;
    return j.replace(/\s+BPS Kabupaten\/Kota$/i, '').trim();
  }

  /**
   * Parse the pegawai Google Sheet export by header names.
   * Returns { pegawai, complete, reason }. `complete` is true only when the header was
   * found, at least one row was read and every row has nama, NIP (18 digit), golongan
   * and pangkat (pangkat may be empty for PPPK).
   */
  function parsePegawaiCsv(text) {
    const rows = parseCsv(text);
    let headerIdx = -1;
    let col = null;
    for (let i = 0; i < rows.length && headerIdx < 0; i++) {
      const h = rows[i].map(normHeader);
      const nama = h.indexOf('nama');
      const nip = h.indexOf('nip baru');
      if (nama >= 0 && nip >= 0) {
        headerIdx = i;
        col = { nama, nip, golongan: h.indexOf('golongan'), pangkat: h.indexOf('pangkat'), jabatan: h.indexOf('jabatan') };
      }
    }
    if (headerIdx < 0) return { pegawai: [], complete: false, reason: 'Header "Nama" dan "NIP Baru" tidak ditemukan' };
    const missing = ['golongan', 'pangkat', 'jabatan'].filter(k => col[k] < 0);
    if (missing.length) return { pegawai: [], complete: false, reason: `Kolom tidak ditemukan: ${missing.join(', ')}` };

    const pegawai = [];
    let incomplete = 0;
    for (const r of rows.slice(headerIdx + 1)) {
      const get = (k) => String(r[col[k]] || '').replace(/\s+/g, ' ').trim();
      const nip = get('nip').replace(/\D/g, '');
      const nama = get('nama');
      if (!nama || nip.length !== 18) continue;
      let golongan = get('golongan');
      const pangkat = get('pangkat');
      if (!golongan && isNipPppk(nip)) golongan = 'PPPK';
      const jabatanRaw = get('jabatan');
      if (!golongan || (!pangkat && golongan !== 'PPPK') || !jabatanRaw) incomplete++;
      pegawai.push({
        nama,
        nip,
        jabatan: jabatanPendek(jabatanRaw),
        jabatanInstansi: /^Kepala BPS Kabupaten\/Kota$/i.test(jabatanRaw) ? KEPALA_BPS.jabatan : jabatanRaw,
        golongan,
        pangkat
      });
    }
    if (pegawai.length === 0) return { pegawai, complete: false, reason: 'Tidak ada baris pegawai yang valid' };
    if (incomplete > 0) return { pegawai, complete: false, reason: `${incomplete} baris tidak lengkap` };
    return { pegawai, complete: true, reason: '' };
  }

  // ---------------------------------------------------------------------------
  // Input -> SPD data
  // ---------------------------------------------------------------------------

  function str(v) {
    return v === null || v === undefined ? '' : String(v).trim();
  }

  function parseFormat(v) {
    const s = str(v);
    if (!s) return DEFAULTS.format;
    const m = s.match(/^(?:format\s*)?([12])(?:\.0+)?$/i);
    return m ? +m[1] : NaN;
  }

  /**
   * Validate raw input (from the form or an Excel row).
   * Returns an array of { field, message } in plain Indonesian with a hint to fix it.
   */
  function validateSpdInput(input) {
    const e = [];
    const add = (field, message) => e.push({ field, message });
    const fmt = parseFormat(input.format);
    const digits = str(input.nip).replace(/\s+/g, '');

    if (fmt !== 1 && fmt !== 2) add('format', 'Format SPD harus 1 atau 2.');
    if (!str(input.nama)) add('nama', input.isOrganik ? 'Pilih pegawai dari daftar.' : 'Isi nama petugas.');
    if (!digits) add('nip', 'Isi NIP (18 digit) atau NIK (16 digit).');
    else if (!/^\d+$/.test(digits)) add('nip', 'NIP/NIK hanya boleh berisi angka.');
    else if (input.isOrganik && digits.length !== 18) add('nip', `NIP harus 18 digit (sekarang ${digits.length}).`);
    else if (!input.isOrganik && digits.length !== 16 && digits.length !== 18) add('nip', `NIK harus 16 digit atau NIP 18 digit (sekarang ${digits.length}).`);
    if (!str(input.jabatan)) add('jabatan', 'Isi jabatan petugas.');

    if (!str(input.noSurat)) add('noSurat', 'Isi nomor surat tugas.');
    else if (!isNomorLengkap(input.noSurat)) add('noSurat', 'Nomor belum lengkap. Tulis lengkap, misalnya B-11/7301/SS.330/2026.');

    const dateField = (field, label) => {
      const v = str(input[field]);
      if (!v) { add(field, `Isi ${label}.`); return false; }
      if (!isIsoDate(v)) { add(field, `${label[0].toUpperCase()}${label.slice(1)} tidak dikenali ("${v}"). Gunakan format TTTT-BB-HH atau HH/BB/TTTT.`); return false; }
      return true;
    };
    dateField('tglSt', 'tanggal surat tugas');
    dateField('tglSpd', 'tanggal SPD');
    const okMulai = dateField('tglMulai', 'tanggal mulai');
    const okSelesai = dateField('tglSelesai', 'tanggal selesai');
    if (okMulai && okSelesai && str(input.tglSelesai) < str(input.tglMulai)) {
      add('tglSelesai', 'Tanggal selesai tidak boleh sebelum tanggal mulai.');
    }

    if (!str(input.kecamatan)) add('kecamatan', 'Pilih kecamatan tujuan.');
    if (fmt === 1 && !str(input.kecamatanAsal)) add('kecamatanAsal', 'Pilih kecamatan asal.');
    if (!str(input.tujuan)) add('tujuan', 'Isi tujuan/maksud perjalanan dinas.');
    if (!str(input.pembebanan)) add('pembebanan', 'Isi kode akun pembebanan, misalnya GG 2902 BMA 006 530 B 524113 2.');
    if (!str(input.uraianBeban)) add('uraianBeban', 'Isi uraian pembebanan, misalnya Transport Daerah Sulit.');

    if (fmt === 2) {
      const ppk = input.ppk || {};
      if (!str(input.tempatBerangkat)) add('tempatBerangkat', 'Isi tempat keberangkatan.');
      if (!str(input.alatAngkut)) add('alatAngkut', 'Isi alat angkutan, misalnya Kendaraan Umum.');
      if (!str(ppk.nama)) add('ppkNama', 'Isi nama Pejabat Pembuat Komitmen di Pengaturan Lanjutan.');
      if (!/^\d{18}$/.test(str(ppk.nip))) add('ppkNip', 'NIP PPK harus 18 digit.');
      if (!str(ppk.program)) add('ppkProgram', 'Isi nama program PPK.');
      const auto = anggaranDariPembebanan(input.pembebanan);
      for (const k of ['program', 'kegiatan', 'komponen']) {
        const given = str(input[`${k}Kode`]);
        if (!given && !(auto && auto[k].kode)) add(`${k}Kode`, `Isi kode ${k} (atau perbaiki kode akun pembebanan).`);
      }
    }

    const textFields = ['nama', 'jabatan', 'jabatanInstansi', 'tujuan', 'uraianBeban', 'tempatBerangkat',
      'alatAngkut', 'tingkatBiaya', 'keterangan', 'programUraian', 'kegiatanUraian', 'komponenUraian'];
    for (const f of textFields) {
      const bad = findUnmappable(input[f]);
      if (bad.length) add(f, `Karakter ${bad.join(' ')} tidak bisa dicetak di PDF. Hapus atau ganti karakter tersebut.`);
    }
    return e;
  }

  /**
   * Build the complete data object used by the summary and every renderer.
   * Returns { data, errors }. `data` is always filled as far as possible so the
   * summary can show partial input; renderers require data.valid === true.
   */
  function buildSpdData(input) {
    input = input || {};
    const errors = validateSpdInput(input);
    const t = (v) => sanitizeWinAnsi(str(v));
    const format = parseFormat(input.format);
    const isOrganik = !!input.isOrganik;
    const nomor = formatNomor(input.noSurat);
    const ppkIn = input.ppk || {};

    const tglMulai = str(input.tglMulai);
    const tglSelesai = str(input.tglSelesai);
    let lamaHari = null;
    try { lamaHari = hitungLamaHari(tglMulai, tglSelesai); } catch (err) { lamaHari = null; }

    const auto = anggaranDariPembebanan(input.pembebanan);
    const pick = (k) => {
      const kode = str(input[`${k}Kode`]).toUpperCase() || (auto ? auto[k].kode : '');
      const kegiatan = str(input.kegiatanKode) || (auto ? auto.kegiatan.kode : '');
      const uraian = str(input[`${k}Uraian`]) || lookupUraian(k, kode, kegiatan);
      return { kode: t(kode), uraian: t(uraian) };
    };

    const jabatan = t(input.jabatan);
    const tglMulaiIndo = formatIndoDate(tglMulai);
    const tglSelesaiIndo = formatIndoDate(tglSelesai);
    const kecTujuan = formatKecamatan(t(input.kecamatan));
    const kecAsal = formatKecamatan(t(input.kecamatanAsal));

    const data = {
      valid: errors.length === 0,
      format,
      stNo: t(nomor.stNo),
      spdNo: t(nomor.spdNo),
      superNo: t(nomor.superNo),
      petugas: {
        isOrganik,
        nama: t(input.nama),
        nip: str(input.nip).replace(/\s+/g, ''),
        jabatan,
        jabatanInstansi: t(input.jabatanInstansi) || jabatan,
        golongan: t(input.golongan) || (isOrganik ? '' : DEFAULTS.golonganMitra),
        unitKerja: t(input.unitKerja) || (isOrganik ? KANTOR.unitKerja : '')
      },
      tglSt: str(input.tglSt),
      tglSpd: str(input.tglSpd),
      tglMulai,
      tglSelesai,
      tglStIndo: formatIndoDate(str(input.tglSt)),
      tglSpdIndo: formatIndoDate(str(input.tglSpd)),
      tglMulaiIndo,
      tglSelesaiIndo,
      waktuStr: `${tglMulaiIndo} s.d. ${tglSelesaiIndo}`,
      tglPelaksanaan: tglMulaiIndo === tglSelesaiIndo ? tglMulaiIndo : `${tglMulaiIndo} s.d. ${tglSelesaiIndo}`,
      rentangTanggal: formatRentangTanggal(tglMulai, tglSelesai),
      lamaHari,
      kecAsal,
      kecTujuan,
      // Format 1 departs from the kecamatan asal; Format 2 from the tempat kedudukan.
      tempatBerangkat: format === 2 ? (t(input.tempatBerangkat) || DEFAULTS.tempatBerangkatF2) : kecAsal,
      tujuan: t(input.tujuan),
      pembebanan: t(input.pembebanan),
      uraianBeban: t(input.uraianBeban),
      alatAngkut: t(input.alatAngkut) || DEFAULTS.alatAngkut,
      tingkatBiaya: t(input.tingkatBiaya),
      anggaran: { program: pick('program'), kegiatan: pick('kegiatan'), komponen: pick('komponen') },
      mataAnggaran: input.mataAnggaran === undefined ? (auto ? auto.mataAnggaran : '') : t(input.mataAnggaran),
      keterangan: t(input.keterangan),
      instansi: KANTOR.instansi,
      ppk: { nama: t(ppkIn.nama), nip: str(ppkIn.nip), program: t(ppkIn.program) },
      kepala: Object.assign({}, KEPALA_BPS)
    };
    return { data, errors };
  }

  /**
   * One-line human summary, e.g.
   * "Muhammad Ikbal Nur · Kab. Kep. Selayar → Pasimarannu · 22–26 Juni 2026 (5 hari) · Format 2"
   */
  function ringkasanSatuBaris(data) {
    const parts = [];
    if (data.petugas.nama) parts.push(data.petugas.nama);
    const dari = shortTempat(data.tempatBerangkat);
    const ke = shortTempat(data.kecTujuan);
    if (dari || ke) parts.push(`${dari || '?'} → ${ke || '?'}`);
    if (data.rentangTanggal) parts.push(data.lamaHari ? `${data.rentangTanggal} (${data.lamaHari} hari)` : data.rentangTanggal);
    parts.push(`Format ${data.format === 2 ? 2 : 1}`);
    return parts.join(' · ');
  }

  // ---------------------------------------------------------------------------
  // Batch Excel rows
  // ---------------------------------------------------------------------------

  const BATCH_COLUMNS = [
    'Nomor Surat', 'Tanggal ST', 'Tanggal SPD', 'Format SPD', 'Kategori', 'Nama Petugas', 'NIP', 'Jabatan',
    'Pangkat Golongan', 'Kecamatan Asal', 'Kecamatan Tujuan', 'Tempat Keberangkatan', 'Tanggal Mulai',
    'Tanggal Selesai', 'Tujuan', 'Pembebanan Akun', 'Uraian Pembebanan', 'Alat Angkutan', 'Tingkat Biaya',
    'Program', 'Kegiatan', 'Komponen', 'Mata Anggaran', 'Keterangan'
  ];

  const BATCH_ALIASES = {
    noSurat: ['nomor surat', 'no surat', 'nomor', 'no surat tugas', 'nomor st'],
    tglSt: ['tanggal st', 'tgl st', 'tanggal surat tugas'],
    tglSpd: ['tanggal spd', 'tgl spd'],
    format: ['format spd', 'format'],
    kategori: ['kategori', 'status'],
    nama: ['nama petugas', 'nama pegawai', 'nama lengkap', 'nama'],
    nip: ['nip', 'nik', 'nip/nik'],
    jabatan: ['jabatan'],
    jabatanInstansi: ['jabatan/instansi', 'jabatan instansi'],
    golongan: ['pangkat golongan', 'pangkat/golongan', 'golongan'],
    kecamatanAsal: ['kecamatan asal', 'asal'],
    kecamatan: ['kecamatan tujuan', 'tujuan kecamatan', 'kecamatan'],
    tempatBerangkat: ['tempat keberangkatan', 'tempat berangkat'],
    tglMulai: ['tanggal mulai', 'tgl mulai', 'mulai'],
    tglSelesai: ['tanggal selesai', 'tgl selesai', 'selesai'],
    tujuan: ['tujuan', 'tujuan/tugas', 'maksud', 'maksud perjalanan', 'uraian tugas'],
    pembebanan: ['pembebanan akun', 'pembebanan', 'kode akun', 'akun'],
    uraianBeban: ['uraian pembebanan', 'uraian beban'],
    alatAngkut: ['alat angkutan', 'alat angkut'],
    tingkatBiaya: ['tingkat biaya', 'tingkat biaya perjalanan dinas'],
    program: ['program'],
    kegiatan: ['kegiatan'],
    komponen: ['komponen'],
    mataAnggaran: ['mata anggaran'],
    keterangan: ['keterangan', 'keterangan lain-lain', 'keterangan lain lain'],
    unitKerja: ['unit kerja']
  };

  function normNama(n) {
    return String(n || '').split(',')[0].toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Find an organik employee by NIP, then by exact name, then by a unique partial name.
   */
  function cariPegawai(list, nama, nip) {
    if (nip) {
      const byNip = list.find(p => p.nip === nip);
      if (byNip) return byNip;
    }
    const n = normNama(nama);
    if (!n) return null;
    const exact = list.filter(p => normNama(p.nama) === n);
    if (exact.length === 1) return exact[0];
    const partial = list.filter(p => normNama(p.nama).includes(n) || n.includes(normNama(p.nama)));
    return partial.length === 1 ? partial[0] : null;
  }

  /**
   * Map one Excel row (object keyed by header) to builder input.
   * ctx: { pegawai: [...], ppk: {...}, tempatBerangkatF2 }
   * Returns { input, errors } where errors only cover Excel-specific problems; the
   * caller still runs buildSpdData() for field validation.
   */
  function normalizeBatchRow(row, ctx) {
    ctx = ctx || {};
    const keys = Object.keys(row || {});
    const byNorm = {};
    for (const k of keys) byNorm[normHeader(k)] = row[k];
    const get = (field) => {
      for (const a of BATCH_ALIASES[field]) {
        if (Object.prototype.hasOwnProperty.call(byNorm, a)) return byNorm[a];
      }
      return '';
    };
    const errors = [];
    const list = ctx.pegawai || [];

    const kategori = str(get('kategori')).toLowerCase();
    const saysMitra = /non|mitra/.test(kategori);
    const saysOrganik = /organik/.test(kategori) && !saysMitra;
    let nama = str(get('nama'));
    let nip = str(get('nip')).replace(/\s+/g, '').replace(/^'/, '');
    let jabatan = str(get('jabatan'));
    let golongan = str(get('golongan'));
    let jabatanInstansi = str(get('jabatanInstansi'));
    let isOrganik = false;

    if (!saysMitra) {
      const match = cariPegawai(list, nama, nip);
      if (match) {
        isOrganik = true;
        nama = match.nama;
        nip = nip || match.nip;
        jabatan = jabatan || match.jabatan;
        golongan = golongan || match.golongan;
        jabatanInstansi = jabatanInstansi || match.jabatanInstansi || '';
      } else if (saysOrganik) {
        isOrganik = true;
        errors.push({ field: 'nama', message: `Nama "${nama}" tidak ditemukan di database pegawai organik.` });
      }
    }

    const format = parseFormat(get('format'));
    const program = splitKodeUraian(get('program'));
    const kegiatan = splitKodeUraian(get('kegiatan'));
    const komponen = splitKodeUraian(get('komponen'));
    const rawMata = get('mataAnggaran');

    const input = {
      format: isNaN(format) ? str(get('format')) : format,
      isOrganik,
      nama,
      nip,
      jabatan,
      jabatanInstansi,
      golongan,
      unitKerja: str(get('unitKerja')),
      noSurat: str(get('noSurat')),
      tglSt: parseExcelDate(get('tglSt')),
      tglSpd: parseExcelDate(get('tglSpd')),
      tglMulai: parseExcelDate(get('tglMulai')),
      tglSelesai: parseExcelDate(get('tglSelesai')),
      kecamatanAsal: str(get('kecamatanAsal')),
      kecamatan: str(get('kecamatan')),
      tujuan: str(get('tujuan')),
      pembebanan: str(get('pembebanan')),
      uraianBeban: str(get('uraianBeban')),
      tempatBerangkat: str(get('tempatBerangkat')) || ctx.tempatBerangkatF2 || DEFAULTS.tempatBerangkatF2,
      alatAngkut: str(get('alatAngkut')) || DEFAULTS.alatAngkut,
      tingkatBiaya: str(get('tingkatBiaya')),
      programKode: program.kode,
      programUraian: program.uraian,
      kegiatanKode: kegiatan.kode,
      kegiatanUraian: kegiatan.uraian,
      komponenKode: komponen.kode,
      komponenUraian: komponen.uraian,
      keterangan: str(get('keterangan')),
      ppk: ctx.ppk || PPK_DEFAULT
    };
    // An empty Mata Anggaran cell falls back to the kode akun suggestion.
    if (str(rawMata)) input.mataAnggaran = str(rawMata);
    // Tanggal mulai/selesai default to the SPD date (single-day trip).
    if (!input.tglMulai) input.tglMulai = input.tglSpd;
    if (!input.tglSelesai) input.tglSelesai = input.tglMulai;
    return { input, errors };
  }

  return {
    KANTOR,
    KEPALA_BPS,
    PPK_DEFAULT,
    DEFAULTS,
    KECAMATAN,
    INDO_MONTHS,
    URAIAN_PROGRAM,
    URAIAN_KEGIATAN,
    URAIAN_KOMPONEN,
    BATCH_COLUMNS,
    parseIsoDate,
    isIsoDate,
    formatIndoDate,
    formatRentangTanggal,
    hitungLamaHari,
    parseExcelDate,
    formatNomor,
    isNomorLengkap,
    formatKecamatan,
    shortTempat,
    escapePdfText,
    wrapText,
    wrapByWidth,
    normalizeWinAnsi,
    findUnmappable,
    sanitizeWinAnsi,
    encodeLatin1,
    replaceStrict,
    parsePembebanan,
    lookupUraian,
    splitKodeUraian,
    anggaranDariPembebanan,
    parseCsv,
    parsePegawaiCsv,
    isNipPppk,
    parseFormat,
    validateSpdInput,
    buildSpdData,
    ringkasanSatuBaris,
    cariPegawai,
    normalizeBatchRow
  };
});
