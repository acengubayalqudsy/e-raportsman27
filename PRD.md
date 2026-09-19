# Product Requirements Document

## 1. Informasi Produk

- Nama Produk: Aplikasi E-Rapor SMAN 27 Garut
- Institusi: SMAN 27 Garut
- Jenis Produk: Sistem Informasi Akademik / E-Rapor berbasis web
- Platform: Web Application
- Status: Frontend Development
- Primary Framework: React
- Project Stage: frontend-first. Backend, database production, dan integrasi API belum menjadi fokus utama pada kondisi source code saat ini.

## 2. Background

Aplikasi E-Rapor SMAN 27 Garut dibuat untuk membantu pengelolaan data akademik dan proses penyusunan rapor secara lebih terintegrasi. Implementasi saat ini berfokus pada antarmuka web yang menyediakan dashboard utama, navigasi modul, data contoh, tabel, filter, ringkasan statistik, dan preview dokumen akademik.

Dashboard menjadi pusat akses menuju:

- Dashboard
- Master Data
- Akademik
- Penilaian
- Rapor & Leger
- Kegiatan Siswa
- Absensi
- Jurnal Mengajar
- Laporan
- Pengaturan

## 3. Problem Statement

Masalah yang ingin diselesaikan oleh produk ini:

- Data akademik sekolah perlu dikelola secara lebih terstruktur.
- Proses penilaian siswa membutuhkan tampilan input, rekap, validasi, dan deskripsi yang konsisten.
- Rapor dan leger membutuhkan sistem yang dapat menampilkan daftar rapor, preview rapor per siswa, leger nilai, leger deskripsi, peringkat kelas, cover rapor, serta export/cetak pada tahap berikutnya.
- Absensi dan kegiatan siswa perlu dapat diakses dari satu aplikasi akademik.
- Antarmuka harus tetap usable pada desktop, tablet, dan mobile.

Catatan: implementasi saat ini belum membuktikan adanya backend production, database production, atau API production.

## 4. Product Goals

- Menyediakan dashboard akademik terpusat untuk ringkasan kondisi sekolah.
- Mempermudah pengelolaan master data siswa, guru, kelas, ruangan, mata pelajaran, tahun ajaran, semester, agama, ekstrakurikuler, dan pengguna/role.
- Mempermudah pengelolaan data akademik seperti rombongan belajar, penugasan guru, wali kelas, jadwal pelajaran, dan pembagian ruangan.
- Menyediakan UI penilaian siswa yang mencakup input nilai, nilai per mapel, nilai sikap, capaian kompetensi, rekap nilai, dan validasi nilai.
- Menyediakan tampilan rapor dan leger untuk kebutuhan preview, rekap, cover, dan export/cetak.
- Mengelola absensi melalui rekap, per siswa, per kelas, dan per mata pelajaran.
- Menjaga UI konsisten dengan baseline desktop yang sudah ada.
- Mendukung pengembangan layout adaptive, responsive, dan strict.
- Menyiapkan struktur frontend agar dapat dikembangkan menuju integrasi backend/API.

## 5. Non-Goals / Current Out of Scope

Hal-hal berikut belum menjadi target selesai pada tahap source code saat ini:

- Backend production.
- Database production.
- API production.
- Autentikasi server-side.
- Role-based access control production.
- Sinkronisasi data sekolah real-time.
- Export PDF aktual dari server.
- Deployment production.
- Integrasi data Dapodik atau sistem eksternal.

## 6. User Roles

Current role yang terlihat jelas dari source code:

- Administrator / Super Admin.

Role lain muncul sebagai data contoh pada modul `Pengguna & Role`, seperti Guru / Wali Kelas, Siswa, dan Kepala Sekolah. Namun role tersebut belum dapat diklaim sebagai sistem autentikasi atau otorisasi production.

Future Scope:

- Guru.
- Wali Kelas.
- Siswa.
- Kepala Sekolah.
- Admin sekolah dengan pembatasan hak akses per modul.

## 7. Information Architecture

Struktur menu aktual:

- Dashboard: `/dashboard`
- Master Data:
  - Data Siswa: `/master-data/siswa`
  - Data Guru: `/master-data/guru`
  - Data Kelas: `/master-data/kelas`
  - Data Ruangan: `/master-data/ruangan`
  - Mata Pelajaran: `/master-data/mata-pelajaran`
  - Tahun Ajaran: `/master-data/tahun-ajaran`
  - Semester: `/master-data/semester`
  - Agama: `/master-data/agama`
  - Ekstrakurikuler: `/master-data/ekstrakurikuler`
  - Pengguna & Role: `/master-data/pengguna-role`
- Akademik:
  - Rombongan Belajar: `/akademik/rombongan-belajar`
  - Penugasan Guru Mengajar: `/akademik/penugasan-guru`
  - Penugasan Wali Kelas: `/akademik/penugasan-wali-kelas`
  - Jadwal Pelajaran: `/akademik/jadwal-pelajaran`
  - Pembagian Ruangan: `/akademik/pembagian-ruangan`
- Penilaian:
  - Input Nilai: `/penilaian/input-nilai`
  - Nilai Per Mapel: `/penilaian/nilai-per-mapel`
  - Nilai Sikap: `/penilaian/nilai-sikap`
  - Capaian Kompetensi (Deskripsi): `/penilaian/capaian-kompetensi`
  - Rekap Nilai Per Kelas: `/penilaian/rekap-nilai-per-kelas`
  - Validasi Nilai: `/penilaian/validasi-nilai`
- Rapor & Leger:
  - Daftar Rapor: `/rapor-leger/daftar-rapor`
  - Generate Rapor: `/rapor-leger/generate-rapor`
  - Rapor Per Siswa: `/rapor-leger/rapor-per-siswa`
  - Leger Nilai: `/rapor-leger/leger-nilai`
  - Leger Deskripsi: `/rapor-leger/leger-deskripsi`
  - Peringkat Kelas: `/rapor-leger/peringkat-kelas`
  - Cover Rapor: `/rapor-leger/cover-rapor`
  - Cetak / Export PDF: `/rapor-leger/cetak-export`
- Kegiatan Siswa:
  - Keikutsertaan Ekstrakurikuler: `/kegiatan-siswa/keikutsertaan-ekstrakurikuler`
  - Nilai Ekstrakurikuler: `/kegiatan-siswa/nilai-ekstrakurikuler`
  - Catatan Kokurikuler: `/kegiatan-siswa/catatan-kokurikuler`
  - Catatan Wali Kelas: `/kegiatan-siswa/catatan-wali-kelas`
- Absensi:
  - Rekap Absensi: `/absensi/rekap`
  - Absensi Per Siswa: `/absensi/per-siswa`
  - Rekap Per Kelas: `/absensi/per-kelas`
  - Rekap Per Mata Pelajaran: `/absensi/per-mapel`
- Jurnal Mengajar:
  - Jurnal Mengajar: `/jurnal-mengajar/jurnal`
  - Materi Pembelajaran: `/jurnal-mengajar/materi`
  - Aktivitas Kelas: `/jurnal-mengajar/aktivitas-kelas`
  - Catatan Mengajar: `/jurnal-mengajar/catatan`
- Laporan:
  - Landing Laporan: `/laporan`
  - Laporan Nilai: `/laporan/nilai`
  - Laporan Absensi: `/laporan/absensi`
  - Laporan Ekstrakurikuler: `/laporan/ekstrakurikuler`
  - Laporan Kokurikuler: `/laporan/kokurikuler`
  - Laporan Per Kelas: `/laporan/per-kelas`
  - Laporan Per Siswa: `/laporan/per-siswa`
  - Rekapitulasi Rapor: `/laporan/rekapitulasi-rapor`
- Pengaturan: `/pengaturan`

## 8. Functional Requirements

### Dashboard

Current implementation:

- Menampilkan greeting untuk Administrator.
- Menampilkan tanggal hari ini.
- Menampilkan statistik:
  - Jumlah Siswa.
  - Jumlah Guru.
  - Jumlah Kelas.
  - Rata-rata Nilai.
- Menampilkan Jadwal Hari Ini.
- Menampilkan Absensi Siswa Hari Ini dengan chart donut dan legend.
- Menampilkan Aktivitas Terbaru.
- Menampilkan Pengumuman Sekolah.
- Menampilkan konteks Tahun Ajaran dan Semester pada topbar.
- Menampilkan notifikasi dan profil Administrator.

### Master Data

Current implementation:

- Tab navigasi untuk data siswa, guru, kelas, ruangan, mata pelajaran, tahun ajaran, semester, agama, ekstrakurikuler, dan pengguna/role.
- Data Siswa dan Data Guru memiliki tampilan khusus dengan summary, filter, pencarian, tabel, aksi, pagination, modal/detail/form.
- Data referensi lain menggunakan tampilan generik berbasis schema.
- Data bersumber dari local/static data pada `src/data/masterData.js`.

### Akademik

Current implementation:

- Tab Rombongan Belajar, Penugasan Guru Mengajar, Penugasan Wali Kelas, Jadwal Pelajaran, dan Pembagian Ruangan.
- Menampilkan summary akademik.
- Menampilkan filter, tabel, jadwal mingguan, panel jadwal hari ini, pengumuman, dan modal untuk data akademik tertentu.
- Data bersumber dari local/static data pada `src/data/akademik.js`.

### Penilaian

Current implementation:

- Tab Input Nilai, Nilai Per Mapel, Nilai Sikap, Capaian Kompetensi, Rekap Nilai Per Kelas, dan Validasi Nilai.
- Menampilkan ringkasan penilaian.
- Menyediakan tabel skor, input nilai, rekap, validasi, dan tampilan deskripsi kompetensi.
- Data bersumber dari local/static data pada `src/data/penilaian.js`.

### Rapor & Leger

Current implementation:

- Tab Daftar Rapor, Generate Rapor, Rapor Per Siswa, Leger Nilai, Leger Deskripsi, Peringkat Kelas, Cover Rapor, dan Cetak / Export PDF.
- Menampilkan daftar rapor siswa, readiness rapor, preview rapor per siswa, leger nilai, leger deskripsi, ranking, cover rapor, dan pilihan export/cetak.
- Logo resmi SMAN 27 Garut sudah digunakan pada sidebar, preview rapor, dan cover rapor.
- Export PDF saat ini masih berupa trigger/notifikasi frontend, belum integrasi backend/PDF production.
- Data bersumber dari local/static data pada `src/data/rapor.js`.

### Kegiatan Siswa

Current implementation:

- Tab Keikutsertaan Ekstrakurikuler, Nilai Ekstrakurikuler, Catatan Kokurikuler, dan Catatan Wali Kelas.
- Menampilkan summary, filter, tabel partisipasi, nilai ekstrakurikuler, catatan kokurikuler, dan catatan wali kelas.
- Data bersumber dari local/static data pada `src/data/kegiatanSiswa.js`.

### Absensi

Current implementation:

- Tab Rekap Absensi, Absensi Per Siswa, Rekap Per Kelas, dan Rekap Per Mata Pelajaran.
- Menampilkan summary, filter, tabel rekap, riwayat per siswa, rekap kelas, rekap mapel, chart/overview, dan modal pencatatan.
- Data bersumber dari local/static data pada `src/data/absensi.js`.

### Jurnal Mengajar

Current Status: Frontend mock terimplementasi.

- Menyediakan halaman Jurnal Mengajar, Materi Pembelajaran, Aktivitas Kelas, dan Catatan Mengajar.
- Mendukung filter, pencarian, pagination, empty state, dan feedback UI berbasis local state.
- Menyediakan tambah/edit/detail jurnal, validasi data wajib dan duplikasi jadwal, serta konfirmasi perubahan yang belum disimpan.
- Menampilkan jadwal hari ini dari data Akademik, ringkasan bulanan, aktivitas terbaru, dan ringkasan kehadiran tanpa mengubah data Absensi.
- Data bersumber dari local/static data pada `src/data/jurnalMengajar.js`.

### Laporan

Current Status: Frontend mock terimplementasi.

- Menyediakan landing laporan dengan tujuh kategori: nilai, absensi, ekstrakurikuler, kokurikuler, per kelas, per siswa, dan rekapitulasi rapor.
- Mendukung filter konteks, pencarian lokal, pagination, empty state, preview HTML/CSS, serta simulasi cetak dan export.
- Menampilkan summary, statistik ringkas, informasi laporan, recent reports, dan halaman detail per kategori.
- Data bersumber dari local/static data pada `src/data/laporan.js`.

### Pengaturan

Current Status: Placeholder / belum diimplementasikan penuh.

Menggunakan `PlaceholderPage` dengan toolbar pencarian/status, tabel contoh, dan tombol tambah data.

## 9. Layout Requirements

### Adaptive Mode

Definisi: layout dapat berubah secara struktural berdasarkan device.

Target mobile `<768px`:

- Mobile header.
- Sidebar drawer/off-canvas.
- Overlay.
- Hamburger.
- Content stacking.
- Dashboard satu kolom atau struktur mobile.
- Tidak ada page-level horizontal overflow.
- Drawer dapat ditutup melalui overlay, klik menu, dan ESC.
- Body scroll dikunci saat drawer terbuka.

Target tablet:

- Navigasi lebih ringkas dengan collapsed/sidebar rail.
- Content menyesuaikan ukuran tablet.
- Dashboard dan grid modul tidak memaksakan desktop penuh.

Known Issue / Pending Normalization:

- JS tablet saat ini: `768-1023`.
- Adaptive visual tablet saat ini: `768-1279`.
- Range `1024-1279` secara JS bernama `desktop`, tetapi secara visual adaptive diarahkan ke layout compact/collapsed.

Target desktop:

- Adaptive desktop baseline saat ini dimulai sekitar `>=1280px`.
- Sidebar penuh berada di kiri.
- Topbar berada di atas content area.
- Dashboard desktop tetap semirip mungkin dengan baseline existing.

### Responsive Mode

Definisi: satu struktur utama dipertahankan, tetapi ukuran dan susunan internal menyesuaikan viewport.

Expected behavior:

- Struktur utama tetap `Sidebar + Topbar + Content`.
- Sidebar dapat menjadi rail/collapsed.
- Layout bersifat fluid.
- Grid dashboard dan modul menyesuaikan jumlah kolom.
- Card menyesuaikan parent container.
- Topbar dapat wrapping.
- Chart mengikuti ukuran parent.
- Tabel memakai horizontal scroll pada wrapper tabel.
- Spacing dan typography menyesuaikan proporsional.

### Strict Mode

Definisi: desktop layout tidak boleh berubah hanya karena viewport berubah.

Target:

- Minimum application width: `1280px`.
- Viewport kecil diperbolehkan menggunakan horizontal scrolling.
- Sidebar, topbar, dashboard grid, dan struktur desktop harus tetap dipertahankan.

Current Status:

Strict Mode belum selesai secara universal. Media query CSS pada beberapa modul masih dapat mengubah layout karena CSS modul belum sepenuhnya mode-aware.

## 10. Layout Implementation Status

Estimasi development saat ini:

- Adaptive: ~65%
- Responsive: ~55%
- Strict: ~30%
- Overall Layout System: ~50%

Alasan:

- Core layout mode, breakpoint hook, mobile drawer, mobile header, overlay, ESC close, dan body scroll lock sudah tersedia.
- Dashboard sudah memiliki sebagian behavior adaptive/responsive.
- Strict sudah melindungi sebagian shell dan dashboard, tetapi belum melindungi seluruh halaman modul.
- CSS historis pada modul belum sepenuhnya dinormalisasi dan belum mode-aware.

## 11. Known Issues

### Breakpoint inconsistency

JavaScript saat ini:

- `768`
- `1024`
- `1440`
- `1280` sebagai adaptive desktop threshold

CSS existing memiliki breakpoint historis:

- `460`
- `520`
- `720`
- `820`
- `960`
- `1040`
- `1080`
- `1180`
- `1250`
- `1400`

Breakpoint historis CSS belum sepenuhnya dinormalisasi terhadap konfigurasi layout.

### Strict Mode

CSS modul belum sepenuhnya mode-aware. Modul yang perlu perhatian:

- Master Data
- Akademik
- Penilaian
- Rapor & Leger
- Kegiatan Siswa
- Absensi

### Adaptive edge cases

Range yang masih membutuhkan refinement:

- `721-767`: JS sudah mobile, tetapi sebagian CSS modul mobile lama baru aktif di `720`.
- `961-1023`: JS tablet, sementara CSS legacy `960` tidak aktif.
- `1024-1279`: JS desktop, tetapi adaptive visual tablet/collapsed masih berlaku sampai `1279`.

## 12. Technical Architecture

Struktur utama:

```text
src/
|-- assets/
|-- components/
|-- config/
|-- constants/
|-- data/
|-- hooks/
|-- pages/
|-- routes/
|-- services/
```

Folder penting:

- `src/assets/`: aset visual, termasuk logo SMAN 27 Garut.
- `src/components/`: komponen layout, common UI, tabel, dan komponen per modul.
- `src/config/`: konfigurasi layout, termasuk `layoutConfig.js`.
- `src/constants/`: konstanta warna, menu, route, dan role.
- `src/data/`: mock/static data yang digunakan oleh UI.
- `src/hooks/`: hook reusable, termasuk `useBreakpoint.js`.
- `src/pages/`: page-level components untuk route utama.
- `src/routes/`: konfigurasi routing React Router.
- `src/services/`: saat ini belum berisi service production.

Komponen layout penting:

- `config/layoutConfig.js`: sumber konfigurasi mode layout dan breakpoint.
- `hooks/useBreakpoint.js`: hook untuk membaca kategori viewport.
- `components/layout/AppLayout.jsx`: shell utama aplikasi, sidebar/topbar/content/footer, drawer state, overlay, dan mode class.
- `components/layout/Sidebar.jsx`: navigasi utama dan submenu.
- `components/layout/Topbar.jsx`: desktop topbar dan mobile compact header.

## 13. Technology Stack

Current:

- React: `^19.2.8`
- React DOM: `^19.2.8`
- React Router DOM: `^7.18.2`
- Vite: `^8.2.0`
- Tailwind CSS: `^4.3.3`
- `@tailwindcss/vite`: `^4.3.3`
- ESLint: `^10.8.0`
- `@vitejs/plugin-react`: `^6.0.4`
- Autoprefixer: `^10.5.4`
- PostCSS: `^8.5.26`

Icon:

- Tidak ada library icon eksternal yang terpasang di `package.json`.
- Project menggunakan komponen icon internal `components/common/Icon.jsx`.

Planned / Future Scope:

- Backend/API integration.
- Database production.
- Authentication/authorization production.
- PDF generation/export production.

## 14. Data Status

Status data saat ini:

- Menggunakan mock/local/static data pada `src/data`.
- Tidak ditemukan penggunaan `fetch`, `axios`, `localStorage`, `sessionStorage`, IndexedDB, Supabase, Firebase, atau service API production.
- Folder `src/services` belum berisi service production.
- Data dapat diedit pada state UI tertentu, tetapi belum persist ke backend production.

## 15. Acceptance Criteria

### Desktop

- Baseline existing tetap konsisten.
- Sidebar berada di kiri.
- Topbar menampilkan Tahun Ajaran, Semester, notifikasi, dan profil Administrator.
- Dashboard cards tampil multi-column sesuai desktop.
- Modul tidak overlap.

### Adaptive Mobile

- Sidebar bukan sidebar desktop permanen.
- Hamburger membuka drawer.
- Overlay muncul saat drawer terbuka.
- Drawer dapat ditutup.
- Content tidak berada di belakang sidebar.
- UI mengikuti viewport.
- Tidak ada horizontal scroll halaman yang tidak disengaja.

### Responsive

- Struktur utama tetap sama.
- Content menyesuaikan viewport.
- Grid/card/chart/toolbar/tabel menyesuaikan tanpa overlap yang tidak disengaja.
- Tabel lebar memakai horizontal scroll pada container tabel.

### Strict

- Desktop structure tetap.
- Media query modul tidak melakukan mobile stacking.
- Sidebar/topbar/page/modul tetap mengikuti desktop baseline.
- Horizontal scrolling diperbolehkan pada viewport kecil.

## 16. Development Roadmap

### Phase 1 - Stabilize Core Layout

Tujuan: memastikan shell layout, sidebar, topbar, drawer, body scroll lock, dan strict root bekerja konsisten.

### Phase 2 - Normalize Breakpoints

Tujuan: menyamakan definisi breakpoint JS dan CSS agar tidak ada range abu-abu.

### Phase 3 - Make Module CSS Mode-Aware

Tujuan: memastikan CSS responsif modul hanya aktif pada mode adaptive/responsive dan tidak merusak strict.

### Phase 4 - Strict Mode Completion

Tujuan: memastikan semua halaman mempertahankan desktop layout pada strict mode.

### Phase 5 - Adaptive / Responsive Module Refinement

Tujuan: merapikan pengalaman tablet dan mobile pada modul-modul utama.

### Phase 6 - Cleanup

Tujuan: mengurangi duplikasi breakpoint, mengurangi specificity war, dan mendokumentasikan aturan layout.

Current focus: Phase 1 / menuju Phase 2.

## 17. Technical Debt

Level: MEDIUM-HIGH.

Penyebab:

- CSS override layout bertambah.
- Breakpoint ganda antara JS dan CSS.
- CSS module masih global dan belum mode-aware.
- Strict mode masih bergantung pada override.
- Potensi specificity war jika perbaikan dilanjutkan tanpa normalisasi.

Catatan: technical debt ini dapat diperbaiki secara terarah dan tidak membutuhkan rewrite aplikasi.

## 18. Development Principles

- Frontend-first.
- Hindari redesign tanpa kebutuhan.
- Pertahankan desktop baseline sebagai referensi utama.
- Gunakan reusable components.
- Hindari duplikasi halaman desktop/mobile jika component reuse cukup.
- Centralize layout decisions.
- Business logic tidak boleh diubah hanya untuk responsive layout.
- Perubahan harus bertahap.
- Jangan melakukan rewrite jika perbaikan terarah cukup.
