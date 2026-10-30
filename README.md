# Generator SPD, Surat Tugas & Surat Pernyataan (BPS Selayar)

Aplikasi web statis client-side untuk membuat dokumen administrasi resmi perjalanan dinas BPS:
1. **Surat Tugas (ST)**
2. **Surat Perjalanan Dinas (SPD)**
3. **Surat Pernyataan** tidak menggunakan kendaraan dinas
4. **Bundel Lengkap Siap Cetak** (semua dokumen digabung dalam satu PDF)

**Akses Web**: [https://ridsonap.is-a.dev/spd/](https://ridsonap.is-a.dev/spd/)

---

## Fitur Utama

- **100% Client-Side**: berjalan di peramban tanpa server. Data tetap di perangkat pengguna. Satu-satunya request jaringan adalah sinkronisasi daftar pegawai dari Google Sheet (opsional).
- **Pilihan Kategori Petugas**:
  - **Pegawai Organik BPS**: daftar pegawai dari `pegawai.js`, otomatis diperbarui dari [Google Spreadsheet](https://docs.google.com/spreadsheets/u/0/d/1hnGYZh1Ng61W8HYfYg5_DRRyvtSedklDSK2b6GEqUZc/htmlview#gid=2128965247) bila sinkronisasi berhasil dan datanya lengkap. Indikator di bawah pilihan pegawai menunjukkan sumbernya (lokal atau tersinkron).
  - **Non-Organik / Mitra**: isi Nama, NIP (18 digit) atau NIK (16 digit), dan Jabatan secara manual.
- **Form Satuan**: nomor surat lengkap (di SPD awalan `B-` dihilangkan otomatis), tanggal Surat Tugas, tanggal SPD, kecamatan asal dan tujuan, rentang tanggal perjalanan, tujuan/tugas (otomatis dibungkus 1–3+ baris), dan kode akun pembebanan.
- **Format SPD** (pilihan disimpan di peramban):
  - **Format 1: Lampiran saja**. Bundel 3 halaman: Surat Tugas, lampiran SPD, Surat Pernyataan.
  - **Format 2: Halaman depan + Lampiran**. Bundel 4 halaman: Surat Tugas, halaman depan SPD (ditandatangani PPK), lampiran SPD dengan bagian III terisi, Surat Pernyataan.
  - Field Format 2: tempat keberangkatan (default `Kabupaten Kepulauan Selayar`), pangkat/golongan dan jabatan/instansi (otomatis untuk pegawai organik), alat angkutan (default `Kendaraan Umum`), tingkat biaya, Program/Kegiatan/Komponen (terisi otomatis dari kode akun, mis. `GG 2902 BMA 006 530 B 524113 2` → GG, 2902, 530), mata anggaran, dan keterangan. Data PPK diatur di *Pengaturan Lanjutan*.
  - Halaman depan digambar langsung dengan pdf-lib sehingga tinggi baris mengikuti panjang isi. Jika isi melebihi satu halaman, pembuatan dihentikan dengan pesan yang jelas. QR TTE tidak dibuat karena berasal dari tanda tangan elektronik resmi.
- **Validasi yang jelas**: isian yang kosong atau salah ditandai di bawah field beserta cara memperbaikinya. Dokumen tidak pernah diisi data contoh secara diam-diam.
- **Batch Generator (Excel)**: unduh template, isi, lalu unggah. Baris yang bermasalah ditandai merah dengan alasannya dan dilewati. Kolom `Format SPD` (`1`/`2`, default `1`) menentukan format per baris; kolom Format 2 lain (`Pangkat Golongan`, `Tempat Keberangkatan`, `Alat Angkutan`, `Program`, `Kegiatan`, `Komponen`, `Mata Anggaran`, `Keterangan`) boleh kosong dan akan memakai default. Hasilnya bisa diunduh sebagai satu bundel PDF atau ZIP berisi file per orang (SPD Format 2 disimpan sebagai satu PDF 2 halaman).

---

## Struktur

| File | Isi |
|---|---|
| `index.html`, `style.css` | Tampilan |
| `app.js` | Logika UI (form, ringkasan, batch, pratinjau) |
| `core.js` | Fungsi murni (format tanggal/nomor, validasi, parsing Excel/CSV, pembebanan, encoding WinAnsi). UMD: `window.SPDCore` / `require('./core.js')` |
| `render.js` | Pembuat PDF: ST, lampiran SPD Format 1/2 (dari template), halaman depan SPD Format 2 (digambar dengan pdf-lib), Surat Pernyataan. UMD: `window.SPDRender` / `require('./render.js')` |
| `pegawai.js` | Daftar pegawai organik (cadangan lokal) |
| `templates/*.pdf` | **Sumber utama** template PDF |
| `templates.js` | Salinan base64 dari `templates/*.pdf` agar aplikasi bisa dibuka lewat `file://`. Dibuat oleh skrip, jangan diedit manual |
| `vendor/` | pdf-lib, pako, SheetJS, JSZip, Bootstrap Icons (tanpa CDN) |
| `scripts/` | `build-templates.js`, `smoke.js` |
| `test/` | Tes `node --test` |

Dokumen dibuat dengan memuat template PDF, membuka content stream, lalu mengganti teks berkoordinat tetap. Setiap penggantian memakai `replaceStrict`: jika pola template tidak ditemukan, proses berhenti dengan pesan yang menyebut bagian mana yang tidak cocok. Konfigurasi kantor, Kepala BPS, dan default PPK ada di konstanta `KANTOR`, `KEPALA_BPS`, dan `PPK_DEFAULT` di `core.js`. Stream ditulis kembali dalam encoding WinAnsi (cp1252), sama dengan encoding font template, sehingga huruf seperti `é`, `’`, atau `–` tercetak dengan benar.

## Pengembangan

Tidak ada build step. Buka `index.html` langsung, atau jalankan server statis apa pun (mis. `python3 -m http.server`).

```bash
npm test                 # unit test + cek templates.js sinkron
npm run smoke            # buat bundel contoh ke out/ dan cek jumlah halaman + teks kunci
npm run build:templates  # setelah mengganti templates/*.pdf
```

Tes hanya memakai Node (versi 18+) dan library di `vendor/`; `npm install` tidak diperlukan.

---

## Catatan Teknis QR Code Surat Tugas
Kode QR pada Surat Tugas merujuk ke tautan verifikasi Tanda Tangan Elektronik (TTE) resmi di BackOffice BPS:
`https://backoffice.bps.go.id/#/attachment/...`
QR Code ini membuktikan keaslian berkas Surat Tugas yang diterbitkan dan ditandatangani secara elektronik oleh Kepala BPS.
