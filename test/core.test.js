const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');
const { contohInput } = require('./helpers.js');

test('formatNomor: ST/Surat Pernyataan pakai B-, SPD tanpa B-', () => {
  assert.deepStrictEqual(Core.formatNomor('B-11/7301/SS.330/2026'),
    { stNo: 'B-11/7301/SS.330/2026', spdNo: '11/7301/SS.330/2026', superNo: 'B-11/7301/SS.330/2026' });
  assert.deepStrictEqual(Core.formatNomor('114/7301/SS.360/2026'),
    { stNo: 'B-114/7301/SS.360/2026', spdNo: '114/7301/SS.360/2026', superNo: 'B-114/7301/SS.360/2026' });
  assert.strictEqual(Core.formatNomor('NOMOR : b-12/7301/SS.330/2026').stNo, 'B-12/7301/SS.330/2026');
});

test('formatNomor: tidak mengarang kode klasifikasi untuk nomor tanpa "/"', () => {
  assert.strictEqual(Core.formatNomor('114.21').spdNo, '114.21');
  assert.strictEqual(Core.isNomorLengkap('114.21'), false);
  assert.strictEqual(Core.isNomorLengkap('B-11/7301'), false);
  assert.strictEqual(Core.isNomorLengkap('B-11/7301/SS.330/2026'), true);
  assert.deepStrictEqual(Core.formatNomor(''), { stNo: '', spdNo: '', superNo: '' });
});

test('formatIndoDate', () => {
  assert.strictEqual(Core.formatIndoDate('2026-06-22'), '22 Juni 2026');
  assert.strictEqual(Core.formatIndoDate('2026-12-01'), '1 Desember 2026');
  assert.strictEqual(Core.formatIndoDate(''), '');
  assert.strictEqual(Core.formatIndoDate('15 Juni 2026'), '15 Juni 2026');
});

test('formatRentangTanggal', () => {
  assert.strictEqual(Core.formatRentangTanggal('2026-06-22', '2026-06-26'), '22–26 Juni 2026');
  assert.strictEqual(Core.formatRentangTanggal('2026-06-30', '2026-07-02'), '30 Juni – 2 Juli 2026');
  assert.strictEqual(Core.formatRentangTanggal('2026-07-20', '2026-07-20'), '20 Juli 2026');
});

test('hitungLamaHari: inklusif, 22–26 Juni 2026 = 5 hari', () => {
  assert.strictEqual(Core.hitungLamaHari('2026-06-22', '2026-06-26'), 5);
  assert.strictEqual(Core.hitungLamaHari('2026-07-20', '2026-07-20'), 1);
  assert.strictEqual(Core.hitungLamaHari('2026-02-27', '2026-03-02'), 4);
  assert.throws(() => Core.hitungLamaHari('2026-06-26', '2026-06-22'), /sebelum tanggal mulai/);
  assert.throws(() => Core.hitungLamaHari('2026-02-30', '2026-03-01'), RangeError);
});

test('formatKecamatan', () => {
  assert.strictEqual(Core.formatKecamatan('Pasimarannu'), 'Kecamatan Pasimarannu');
  assert.strictEqual(Core.formatKecamatan('kecamatan Buki'), 'Kecamatan Buki');
  assert.strictEqual(Core.formatKecamatan(''), '');
});

test('wrapText dan wrapByWidth', () => {
  assert.deepStrictEqual(Core.wrapText('a b c', 3), ['a b', 'c']);
  assert.deepStrictEqual(Core.wrapText('', 10), ['']);
  const measure = (s) => s.length;
  assert.deepStrictEqual(Core.wrapByWidth('aaa bbb ccc', measure, 7), ['aaa bbb', 'ccc']);
  assert.deepStrictEqual(Core.wrapByWidth('abcdefghij', measure, 4), ['abcd', 'efgh', 'ij']);
});

test('escapePdfText', () => {
  assert.strictEqual(Core.escapePdfText('PPL (Sensus) \\ x'), 'PPL \\(Sensus\\) \\\\ x');
});

test('parseExcelDate: serial Excel tanpa pergeseran hari', () => {
  assert.strictEqual(Core.parseExcelDate(46195), '2026-06-22');
  assert.strictEqual(Core.parseExcelDate(46195.99), '2026-06-22'); // 23:45 must not roll over
  assert.strictEqual(Core.parseExcelDate(46195.0001), '2026-06-22');
  assert.strictEqual(Core.parseExcelDate(1), '1900-01-01');
  assert.strictEqual(Core.parseExcelDate(59), '1900-02-28');
  assert.strictEqual(Core.parseExcelDate(61), '1900-03-01');
  assert.strictEqual(Core.parseExcelDate('46195'), '2026-06-22');
});

test('parseExcelDate: teks', () => {
  assert.strictEqual(Core.parseExcelDate('22/06/2026'), '2026-06-22');
  assert.strictEqual(Core.parseExcelDate('5-7-2026'), '2026-07-05');
  assert.strictEqual(Core.parseExcelDate('2026-6-2'), '2026-06-02');
  assert.strictEqual(Core.parseExcelDate('22 Juni 2026'), '2026-06-22');
  assert.strictEqual(Core.parseExcelDate(''), '');
  assert.strictEqual(Core.parseExcelDate('besok'), 'besok');
});

test('parseExcelDate: hasil sama di UTC dan UTC+8 (proses anak dengan TZ berbeda)', () => {
  const { execFileSync } = require('child_process');
  const script = `const C=require(${JSON.stringify(path.join(__dirname, '..', 'core.js'))});` +
    `process.stdout.write(JSON.stringify([46195,46195.99,45658,'22/06/2026',new Date(2026,5,22)].map(C.parseExcelDate)))`;
  const run = (tz) => execFileSync(process.execPath, ['-e', script], { env: Object.assign({}, process.env, { TZ: tz }) }).toString();
  const expected = JSON.stringify(['2026-06-22', '2026-06-22', '2025-01-01', '2026-06-22', '2026-06-22']);
  assert.strictEqual(run('UTC'), expected);
  assert.strictEqual(run('Asia/Makassar'), expected);
  assert.strictEqual(run('America/Los_Angeles'), expected);
});

test('encodeLatin1: byte WinAnsi, bukan UTF-8', () => {
  const bytes = Core.encodeLatin1('José – O’Neil');
  assert.deepStrictEqual(Array.from(bytes), [0x4A, 0x6F, 0x73, 0xE9, 0x20, 0x96, 0x20, 0x4F, 0x92, 0x4E, 0x65, 0x69, 0x6C]);
  // Round trip through the same decoder the renderers use.
  assert.strictEqual(new TextDecoder('latin1').decode(Core.encodeLatin1('“A” — °C €')), '“A” — °C €');
});

test('encodeLatin1: normalisasi dan peringatan karakter di luar WinAnsi', () => {
  const warnings = [];
  const bytes = Core.encodeLatin1('A‑B−C 中', warnings);
  assert.strictEqual(Buffer.from(bytes).toString('latin1'), 'A-B-C ?');
  assert.deepStrictEqual(warnings, ['中']);
  assert.deepStrictEqual(Core.findUnmappable('ok ’ 😀'), ['😀']);
  assert.strictEqual(Core.sanitizeWinAnsi('é'), 'é');
});

test('replaceStrict: melempar error bila pola tidak ditemukan', () => {
  assert.throws(() => Core.replaceStrict('abc', 'x', 'y', 'label-uji'), /label-uji/);
  assert.throws(() => Core.replaceStrict('abc', /x+/, 'y', 'regex-uji'), /regex-uji/);
  assert.strictEqual(Core.replaceStrict('a-a', 'a', 'b', 'l'), 'b-a');
  assert.strictEqual(Core.replaceStrict('a-a', 'a', 'b', 'l', { all: true }), 'b-b');
  assert.strictEqual(Core.replaceStrict('a-a', /a/g, 'b', 'l'), 'b-a');
  // Replacement is literal: "$&" must not expand.
  assert.strictEqual(Core.replaceStrict('x', 'x', 'Rp$&1', 'l'), 'Rp$&1');
});

test('parsePembebanan dan lookup uraian', () => {
  assert.deepStrictEqual(Core.parsePembebanan('GG 2902 BMA 006 530 B 524113 2'), {
    program: 'GG', kegiatan: '2902', kro: 'BMA', ro: '006', komponen: '530', subkomponen: 'B', akun: '524113', detail: '2'
  });
  assert.strictEqual(Core.parsePembebanan('GG 2902'), null);
  assert.strictEqual(Core.parsePembebanan('bebas teks saja tanpa kode yang jelas'), null);
  const a = Core.anggaranDariPembebanan('GG 2902 BMA 006 530 B 524113 2');
  assert.deepStrictEqual(a.program, { kode: 'GG', uraian: 'Program Penyediaan dan Pelayanan Informasi Statistik' });
  assert.deepStrictEqual(a.kegiatan, { kode: '2902', uraian: 'Penyediaan dan Pengembangan Statistik Distribusi' });
  assert.deepStrictEqual(a.komponen, { kode: '530', uraian: 'Pelaksanaan SE2026' });
  assert.strictEqual(a.mataAnggaran, '524113');
  assert.strictEqual(Core.anggaranDariPembebanan('WA 2886 EBA 994 002 A 521211').komponen.uraian, '');
  assert.deepStrictEqual(Core.splitKodeUraian('2902 Penyediaan X'), { kode: '2902', uraian: 'Penyediaan X' });
  assert.deepStrictEqual(Core.splitKodeUraian('530'), { kode: '530', uraian: '' });
});

test('parsePegawaiCsv: berbasis header, baris sampah dilewati', () => {
  const csv = fs.readFileSync(path.join(__dirname, 'fixtures', 'pegawai-sheet.csv'), 'utf8');
  const r = Core.parsePegawaiCsv(csv);
  assert.strictEqual(r.complete, true, r.reason);
  assert.strictEqual(r.pegawai.length, 13);
  const ikbal = r.pegawai.find(p => p.nip === '196910051994011001');
  assert.deepStrictEqual(ikbal, {
    nama: 'Muhammad Ikbal Nur', nip: '196910051994011001', jabatan: 'Fungsional Umum',
    jabatanInstansi: 'Fungsional Umum BPS Kabupaten/Kota', golongan: 'III/b', pangkat: 'Penata Muda Tingkat 1'
  });
  assert.strictEqual(r.pegawai[0].jabatan, 'Kepala BPS Kabupaten Kepulauan Selayar');
  const mursalim = r.pegawai.find(p => p.nama === 'Mursalim');
  assert.strictEqual(mursalim.golongan, 'PPPK');
  assert.ok(!r.pegawai.some(p => /Last Update|30\/04/.test(p.nama)));
});

test('parsePegawaiCsv: kolom bergeser tetap terbaca, data tidak lengkap ditolak', () => {
  const shifted = 'Jabatan,NIP Baru,Pangkat,Golongan,Nama\nKepala Subbagian Umum,198704262011011006,Penata Tingkat 1,III/d,Takdir\n';
  const r = Core.parsePegawaiCsv(shifted);
  assert.strictEqual(r.complete, true);
  assert.strictEqual(r.pegawai[0].golongan, 'III/d');
  const incomplete = Core.parsePegawaiCsv('Nama,NIP Baru,Golongan,Pangkat,Jabatan\nA,198704262011011006,,,Staf\n');
  assert.strictEqual(incomplete.complete, false);
  assert.strictEqual(Core.parsePegawaiCsv('x,y\n1,2').complete, false);
});

test('validateSpdInput: pesan jelas dan tanpa data contoh', () => {
  const errs = Core.validateSpdInput({ format: 1, isOrganik: false });
  const fields = errs.map(e => e.field);
  for (const f of ['nama', 'nip', 'jabatan', 'noSurat', 'tglSt', 'tglSpd', 'tglMulai', 'tglSelesai', 'kecamatan', 'kecamatanAsal', 'tujuan', 'pembebanan', 'uraianBeban']) {
    assert.ok(fields.includes(f), `field ${f} harus divalidasi`);
  }
  const range = Core.validateSpdInput(contohInput({ tglMulai: '2026-06-26', tglSelesai: '2026-06-22' }));
  assert.deepStrictEqual(range, [{ field: 'tglSelesai', message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' }]);
  const nik = Core.validateSpdInput(contohInput({ isOrganik: false, nip: '730103481176' }));
  assert.match(nik[0].message, /16 digit/);
  const nomor = Core.validateSpdInput(contohInput({ noSurat: '114' }));
  assert.match(nomor[0].message, /belum lengkap/);
  assert.deepStrictEqual(Core.validateSpdInput(contohInput()), []);
});

test('buildSpdData: data Format 2 sesuai contoh', () => {
  const { data, errors } = Core.buildSpdData(contohInput());
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(data.valid, true);
  assert.strictEqual(data.spdNo, '114/7301/SS.360/2026');
  assert.strictEqual(data.lamaHari, 5);
  assert.strictEqual(data.tempatBerangkat, 'Kabupaten Kepulauan Selayar');
  assert.strictEqual(data.kecTujuan, 'Kecamatan Pasimarannu');
  assert.strictEqual(data.anggaran.komponen.uraian, 'Pelaksanaan SE2026');
  assert.strictEqual(data.mataAnggaran, '');
  assert.strictEqual(Core.ringkasanSatuBaris(data),
    'Muhammad Ikbal Nur · Kab. Kep. Selayar → Pasimarannu · 22–26 Juni 2026 (5 hari) · Format 2');
  const f1 = Core.buildSpdData(contohInput({ format: 1 })).data;
  assert.strictEqual(f1.tempatBerangkat, 'Kecamatan Benteng');
});

test('normalizeBatchRow: header fleksibel, default, dan pencocokan pegawai', () => {
  const pegawai = [{ nama: 'Muhammad Ikbal Nur', nip: '196910051994011001', jabatan: 'Fungsional Umum', jabatanInstansi: 'Fungsional Umum BPS Kabupaten/Kota', golongan: 'III/b' },
    { nama: 'Muhammad Nur, S.Sos', nip: '197501281998031002', jabatan: 'Kepala', golongan: 'III/d' }];
  const row = {
    'Nomor Surat': '114/7301/SS.360/2026', 'Tanggal ST': 46188, 'Tanggal SPD': '15/06/2026', 'Format SPD': 2,
    'Kategori': 'Organik', 'Nama Petugas': 'muhammad ikbal nur', 'Kecamatan Tujuan': 'Pasimarannu',
    'Tanggal Mulai': '22/06/2026', 'Tanggal Selesai': '26/06/2026', 'Tujuan': 'Translok',
    'Pembebanan Akun': 'GG 2902 BMA 006 530 B 524113 2', 'Uraian Pembebanan': 'Transport', 'Program': 'GG'
  };
  const { input, errors } = Core.normalizeBatchRow(row, { pegawai, ppk: Core.PPK_DEFAULT });
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(input.isOrganik, true);
  assert.strictEqual(input.nip, '196910051994011001');
  assert.strictEqual(input.golongan, 'III/b');
  assert.strictEqual(input.tglSt, '2026-06-15');
  assert.strictEqual(input.alatAngkut, 'Kendaraan Umum');
  assert.strictEqual(input.tempatBerangkat, 'Kabupaten Kepulauan Selayar');
  const built = Core.buildSpdData(input);
  assert.deepStrictEqual(built.errors, []);
  assert.strictEqual(built.data.format, 2);
  assert.strictEqual(built.data.mataAnggaran, '524113');

  const unknown = Core.normalizeBatchRow({ 'Kategori': 'Organik', 'Nama Petugas': 'Tidak Ada' }, { pegawai });
  assert.match(unknown.errors[0].message, /tidak ditemukan/);
  // "Nur" alone is ambiguous and must not silently match someone.
  assert.strictEqual(Core.cariPegawai(pegawai, 'Nur', ''), null);
  const fmtErr = Core.buildSpdData(Core.normalizeBatchRow({ 'Format SPD': '3' }, { pegawai }).input).errors;
  assert.ok(fmtErr.some(e => e.field === 'format'));
});

test('susunNomor: nomor urut + kode klasifikasi + tahun', () => {
  assert.strictEqual(Core.susunNomor('11', '7301/SS.330', '2026'), 'B-11/7301/SS.330/2026');
  assert.strictEqual(Core.susunNomor(' b-11 ', '/7301/SS.330/', 2026), 'B-11/7301/SS.330/2026');
  // A full number pasted into the urut field is used as-is.
  assert.strictEqual(Core.susunNomor('B-114/7301/SS.360/2026', '7301/SS.330', '2026'), 'B-114/7301/SS.360/2026');
  assert.strictEqual(Core.susunNomor('', '7301/SS.330', '2026'), '');
  // Without a kode the number stays incomplete so validation can flag it.
  assert.strictEqual(Core.isNomorLengkap(Core.susunNomor('11', '', '2026')), false);
  assert.strictEqual(Core.KODE_KLASIFIKASI_DEFAULT, '7301/SS.330');
});
