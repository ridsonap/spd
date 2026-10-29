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
- **Form Satuan**:
  - **Nomor Surat Lengkap**: Input nomor surat tugas lengkap (default: `B-11/7301/VS.330/2026`). Di SPD, awalan `B-` otomatis dihilangkan sesuai standar penomoran SPD BPS.
  - **Tanggal SPD & Surat Pernyataan**: Otomatis dikonversi ke format penanggalan resmi BPS (misal: `20 Juli 2026`).
  - **Dropdown Kecamatan**: Pilihan langsung 11 kecamatan di Kabupaten Kepulauan Selayar.
  - **Tanggal Perjalanan**: Default tersinkronisasi 1 hari dengan tanggal SPD, atau tentukan rentang tanggal perjalanan dinas.
  - **Tujuan & Pembebanan**: Input fleksibel untuk Tujuan/Tugas (terbagi proporsional 2 baris di Surat Tugas), Kode Akun Pembebanan MAK, serta Uraian Pembebanan.
  - **Pengaturan Petugas**: Nama Petugas, NIP/NIK, dan Tanggal TTD Surat Tugas (default: `NUR JANNAH`, NIP: `7301034811760004`, Tgl TTD ST: `15 Juni 2026`).
- **Batch Generator (Upload Excel)**:
  - Tombol **Unduh Template Excel** (`.xlsx`) siap pakai dengan contoh data.
  - Unggah file Excel (`.xlsx`, `.xls`, `.csv`) dengan drag & drop atau browse file.
  - Pratinjau tabel interaktif data yang terbaca.
  - Unduh **1 Bundel PDF Gabungan Siap Cetak** (semua petugas & tanggal terangkum urut).
  - Unduh **Paket Arsip ZIP** (berkas PDF tersimpan rapi per subfolder).
- **Pratinjau Interaktif & Cetak**: Pratinjau langsung per tab dokumen dan tombol cetak langsung.

---

## Catatan Teknis QR Code Surat Tugas
Kode QR pada Surat Tugas merujuk ke tautan verifikasi Tanda Tangan Elektronik (TTE) resmi di BackOffice BPS:
`https://backoffice.bps.go.id/#/attachment/...`
QR Code ini membuktikan keaslian berkas Surat Tugas yang diterbitkan dan ditandatangani secara elektronik oleh Kepala BPS.
