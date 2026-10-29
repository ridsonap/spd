# Generator SPD, Surat Tugas & Surat Pernyataan (BPS Selayar)

Aplikasi web statis client-side untuk membuat dokumen administrasi resmi perjalanan dinas BPS:
1. **Surat Tugas (ST)**
2. **Surat Perjalanan Dinas (SPD)**
3. **Surat Pernyataan Bebas Kendaraan Dinas (Super)**
4. **Bundel Lengkap Siap Cetak (Merged 3 Halaman)**

Format mengacu pada master template petugas BPS Kabupaten Kepulauan Selayar (Nur Jannah).

## Fitur
- **Client-side 100%**: Berjalan langsung di peramban tanpa server backend atau ketergantungan API eksternal.
- **Input Fleksibel**:
  - Tanggal SPD (otomatis terformat dalam penanggalan Indonesia)
  - Nomor Surat (ketik kode seperti `114.21`, otomatis dilengkapi format resmi `B-114.21/7301/SS.330/2026`)
  - Kecamatan Tujuan (tersedia datalist kecamatan di Kepulauan Selayar)
  - Tanggal Mulai dan Selesai (default tersinkronisasi otomatis dengan tanggal SPD)
- **Opsi Lanjutan**: Kustomisasi Nama Petugas, NIP, serta tanggal TTD Surat Tugas bila diperlukan.
- **Pratinjau & Unduh**:
  - Pratinjau langsung di layar per jenis berkas atau bundel gabungan
  - Unduh bundel 3-in-1 (ST + SPD + Super)
  - Unduh dokumen satuan (.pdf)
  - Tombol Cetak langsung
