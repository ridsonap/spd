# Generator SPD, Surat Tugas & Surat Pernyataan (BPS Selayar)

Aplikasi web statis client-side untuk membuat dokumen administrasi resmi perjalanan dinas BPS:
1. **Surat Tugas (ST)**
2. **Surat Perjalanan Dinas (SPD)**
3. **Surat Pernyataan Bebas Kendaraan Dinas (Super)**
4. **Bundel Lengkap Siap Cetak (Merged 3 Halaman)**

**Akses Web**: [https://ridsonap.is-a.dev/spd/](https://ridsonap.is-a.dev/spd/)

---

## Fitur Utama

- **100% Client-Side**: Berjalan langsung di peramban tanpa server backend atau ketergantungan API eksternal. Data tetap privat di perangkat pengguna.
- **Desain Bersih & Profesional**: Menggunakan **Bootstrap Icons** dan favicon SVG resmi (bebas emoji).
- **Pilihan Kategori Petugas**:
  - **Pegawai Organik BPS**: Terhubung langsung dengan database 26 pegawai BPS Kabupaten Kepulauan Selayar dari [Google Spreadsheet](https://docs.google.com/spreadsheets/u/0/d/1hnGYZh1Ng61W8HYfYg5_DRRyvtSedklDSK2b6GEqUZc/htmlview#gid=2128965247). Otomatis mengisi Nama, NIP Baru, Jabatan, Golongan, dan Unit Kerja.
  - **Non-Organik / Mitra**: Opsi input manual lengkap untuk Nama, NIP/NIK, dan Jabatan (misal Mitra Sensus/Survei / PPL).
- **Form Satuan**:
  - **Nomor Surat Lengkap**: Input nomor surat tugas lengkap (default: `B-11/7301/VS.330/2026`). Di SPD, awalan `B-` otomatis dihilangkan sesuai standar penomoran SPD BPS.
  - **Tanggal SPD & Surat Pernyataan**: Otomatis dikonversi ke format penanggalan resmi BPS (misal: `20 Juli 2026`).
  - **Dropdown Kecamatan**: Pilihan langsung 11 kecamatan di Kabupaten Kepulauan Selayar.
  - **Tanggal Perjalanan**: Default tersinkronisasi 1 hari dengan tanggal SPD, atau tentukan rentang tanggal perjalanan dinas.
  - **Tujuan Dinamis (Dynamic Reflow)**: Input fleksibel untuk Tujuan/Tugas (otomatis menyesuaikan Y-posisi tanpa bertumpuk untuk 1 baris, 2 baris, atau 3+ baris).
  - **Pembebanan**: Kode Akun Pembebanan MAK dan Uraian Pembebanan.
- **Batch Generator (Upload Excel)**:
  - Tombol **Unduh Template Excel** (`.xlsx`) siap pakai dengan contoh data Organik & Mitra.
  - Unggah file Excel (`.xlsx`, `.xls`, `.csv`) dengan drag & drop atau browse file.
  - Otomatis mencocokkan data petugas organik jika nama sesuai database.
  - Unduh **1 Bundel PDF Gabungan Siap Cetak** (semua petugas & tanggal terangkum urut).
  - Unduh **Paket Arsip ZIP** (berkas PDF tersimpan rapi per subfolder).
- **Pratinjau Interaktif & Cetak**: Pratinjau langsung per tab dokumen dan tombol cetak langsung.

---

## Catatan Teknis QR Code Surat Tugas
Kode QR pada Surat Tugas merujuk ke tautan verifikasi Tanda Tangan Elektronik (TTE) resmi di BackOffice BPS:
`https://backoffice.bps.go.id/#/attachment/...`
QR Code ini membuktikan keaslian berkas Surat Tugas yang diterbitkan dan ditandatangani secara elektronik oleh Kepala BPS.
