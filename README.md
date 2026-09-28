# E-Rapor SMAN 27 Garut

Aplikasi E-Rapor SMAN 27 Garut terdiri dari SPA React dan REST API Laravel untuk pengelolaan data akademik sekolah.

## Project Status

Status saat ini: **P0 Stabilization**.

Autentikasi, master siswa/guru, referensi akademik, rombel, wali kelas, dan penugasan guru sudah menggunakan API. Modul bisnis lain masih memakai data mock dari `src/data` dan belum dianggap persisten.

## Technology Stack

Current stack berdasarkan `package.json`:

- React `^19.2.8`
- React DOM `^19.2.8`
- React Router DOM `^7.18.2`
- Vite `^8.2.0`
- Tailwind CSS `^4.3.3`
- `@tailwindcss/vite` `^4.3.3`
- ESLint `^10.8.0`
- `@vitejs/plugin-react` `^6.0.4`
- Laravel `^12.0`, PHP `^8.2`, dan Laravel Sanctum `^4.0`
- SQLite in-memory untuk automated test; MariaDB/MySQL dapat digunakan untuk development

Catatan: project menggunakan komponen icon internal, bukan library icon eksternal dari dependency.

## Project Structure

```text
src/
|-- assets/       aset visual, termasuk logo sekolah
|-- components/   komponen layout, common UI, tabel, dan komponen modul
|-- config/       konfigurasi layout
|-- constants/    konstanta route, menu, warna, dan role
|-- data/         mock/local/static data
|-- hooks/        reusable hooks
|-- pages/        halaman utama berdasarkan route
|-- routes/       konfigurasi React Router
|-- services/     API client dan service per domain yang sudah terintegrasi
backend/
|-- app/          model, controller API, request, resource, middleware
|-- database/     migration, factory, dan seeder
|-- routes/       route API dan web Laravel
|-- tests/        unit dan feature test
```

## Main Modules

- Dashboard
- Master Data
- Akademik
- Penilaian
- Rapor & Leger
- Kegiatan Siswa
- Absensi
- Jurnal Mengajar - frontend mock dengan jurnal, materi, aktivitas kelas, dan catatan mengajar
- Laporan - frontend mock dengan tujuh kategori laporan, preview, filter, dan export simulasi
- Pengaturan - placeholder / belum diimplementasikan penuh

## Layout System

Sistem layout sedang dikembangkan untuk mendukung tiga mode:

- `adaptive`: layout boleh berubah secara struktural berdasarkan device. Mobile menggunakan mobile header dan drawer/off-canvas sidebar.
- `responsive`: struktur utama tetap sama, tetapi ukuran, grid, spacing, topbar, dan komponen menyesuaikan viewport.
- `strict`: layout desktop dipertahankan dengan minimum canvas desktop; viewport kecil diperbolehkan horizontal scroll.

Konfigurasi utama berada di:

```text
src/config/layoutConfig.js
```

Contoh pengaturan mode:

```js
export const LAYOUT_MODE = LAYOUT_MODES.adaptive
```

Pilihan mode:

```text
adaptive
responsive
strict
```

## Current Layout Status

Estimasi status development layout:

- Adaptive: ~65%
- Responsive: ~55%
- Strict: ~30%
- Overall Layout System: ~50%

Catatan: Strict belum universal karena CSS modul existing belum seluruhnya mode-aware dan masih memiliki media query historis.

## Known Layout Issues

- Breakpoint JS/CSS belum sepenuhnya konsisten.
- CSS modul masih memiliki media query historis seperti `520`, `720`, `960`, `1040`, `1180`, dan lainnya.
- Strict mode belum mengisolasi seluruh responsive module behavior.
- Adaptive range `721-767` masih membutuhkan refinement.
- Adaptive visual tablet dan naming device JS belum sepenuhnya selaras.

Detail lengkap tersedia di [PRD.md](./PRD.md).

## Development Roadmap

1. Stabilize Core Layout
2. Normalize Breakpoints
3. Make Module CSS Mode-Aware
4. Complete Strict Mode
5. Refine Adaptive/Responsive
6. Cleanup

## Development Notes

- Pertahankan desktop UI sebagai baseline utama.
- Jangan mengubah business logic ketika memperbaiki layout.
- Hindari breakpoint baru sebelum memeriksa `layoutConfig.js` dan breakpoint CSS existing.
- Gunakan `src/config/layoutConfig.js` sebagai referensi utama untuk keputusan layout.
- Jangan membuat halaman desktop/mobile terpisah jika component reuse masih cukup.
- Tabel lebar sebaiknya memakai horizontal scroll pada wrapper tabel, bukan pada seluruh halaman adaptive/responsive.
- Periksa service terkait sebelum menganggap sebuah modul persisten; modul yang belum terintegrasi tetap memakai mock data.

## Requirements

- Node.js 22 atau versi yang kompatibel dengan Vite 8
- npm 10+
- PHP 8.2+
- Composer 2+
- Extension PHP SQLite untuk automated test
- MariaDB/MySQL dan extension PHP `pdo_mysql` jika `backend/.env` memakai koneksi tersebut; startup otomatis Windows mendukung XAMPP

## Local Setup

Instalasi dependency dan penyalinan konfigurasi awal dari root project (PowerShell):

```powershell
npm install
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }

Push-Location backend
composer install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
Pop-Location
```

Untuk instalasi baru, sesuaikan koneksi database pada `backend/.env`, lalu jalankan perintah berikut dari folder `backend` setelah database tersedia:

```bash
php artisan key:generate
php artisan migrate
php artisan db:seed
```

Konfigurasi contoh memakai SQLite. Jika memakai MariaDB/MySQL, buat database terlebih dahulu dan isi `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, serta `DB_PASSWORD` sesuai instalasi lokal. Untuk proyek yang sudah berjalan, pertahankan `.env`, `APP_KEY`, dan database yang ada; setup awal tidak perlu diulang setiap membuka folder.

Variabel frontend utama adalah `VITE_API_BASE_URL`. Untuk autentikasi cookie lintas origin lokal, selaraskan `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE`, dan `SESSION_SAME_SITE` di backend.

Seeder akun development hanya berjalan pada environment `local` atau `testing`, serta hanya jika `DEV_ADMIN_PASSWORD`, `DEV_GURU_PASSWORD`, dan `DEV_INACTIVE_PASSWORD` disediakan. Environment production hanya menjalankan reference role dan tidak membuat akun default.

## Menjalankan Proyek Setiap Hari

Dari root project, jalankan:

```bash
npm run dev
```

Di Windows, `start-dev.bat` menjalankan proses yang sama dan dapat dibuka dari folder mana pun. Tunggu pesan `[SIAP] E-Raport`, lalu buka **http://localhost:5173** untuk tampilan aplikasi. **http://127.0.0.1:8000** adalah backend Laravel.

Starter membaca konfigurasi Laravel, membersihkan cache konfigurasi lokal, memeriksa database dan penyimpanan session, lalu menjalankan backend serta frontend. Jika MariaDB lokal belum aktif di Windows, starter mencoba menjalankan MariaDB XAMPP dan menunggu koneksi siap. Starter tidak menjalankan migration atau seeder dan tidak mengganti konfigurasi maupun data yang ada. Biarkan terminal tetap terbuka; `Ctrl+C` menghentikan backend/frontend yang dijalankan starter, sedangkan MariaDB tetap berjalan.

### Mengakses dari HP pada Wi-Fi yang sama

Jalankan mode jaringan lokal dari root project:

```bash
npm run dev:lan
```

Saat pesan `[SIAP]` muncul, buka alamat E-Raport yang tercetak di terminal pada browser HP. Pastikan HP dan komputer terhubung ke jaringan Wi-Fi yang sama, dan biarkan terminal tetap aktif. Jika Windows meminta izin firewall untuk Node.js atau PHP, izinkan akses pada **jaringan privat** saja. Jika komputer memiliki beberapa adapter jaringan dan alamat yang terpilih bukan alamat Wi-Fi, jalankan dengan `LAN_HOST=alamat_IP_Wi-Fi` (PowerShell: `$env:LAN_HOST="192.168.1.7"; npm run dev:lan`). Mode ini hanya untuk pengujian lokal dan tidak boleh digunakan untuk mengekspos aplikasi ke internet.

Error `SQLSTATE[HY000] [2002] ... actively refused` berarti koneksi database ditolak, biasanya karena MariaDB belum menyala. Menutup folder atau memulai ulang komputer tidak menjamin database ikut aktif saat proyek dibuka lagi. `php artisan serve` sendiri hanya menjalankan backend; gunakan starter di atas agar database diperiksa terlebih dahulu.

Untuk VS Code, task `E-Raport: Jalankan proyek` di `.vscode/tasks.json` otomatis dijalankan saat folder proyek dibuka. Pada penggunaan pertama, percayai folder proyek dan izinkan task melalui Command Palette **Tasks: Manage Automatic Tasks in Folder**, lalu pilih **Allow Automatic Tasks in Folder** dan buka ulang folder. Persetujuan ini mengikuti pengamanan editor dan tidak dapat diberikan oleh konfigurasi proyek. Task juga dapat dijalankan manual melalui **Tasks: Run Task**, lalu pilih **E-Raport: Jalankan proyek**. Editor lain dapat menggunakan `start-dev.bat` atau `npm run dev`.

Jika XAMPP terpasang selain di `C:\xampp`, atur `XAMPP_HOME` sebelum menjalankan starter, misalnya di PowerShell:

```powershell
$env:XAMPP_HOME = 'D:\xampp'
npm run dev
```

Untuk task otomatis, simpan `XAMPP_HOME` sebagai environment variable pengguna Windows dan buka ulang editor. Database di server lain harus sudah aktif; starter hanya menyalakan XAMPP lokal.

Perintah tambahan:

- `npm run dev:check`: periksa database/session yang dikonfigurasi tanpa menyalakan layanan.
- `npm run dev:frontend`: jalankan Vite saja jika backend dan database dikelola terpisah.

## Database Notes

- `class_members` adalah sumber utama keanggotaan rombel per semester.
- `students.current_class_name` dipertahankan sementara untuk kompatibilitas UI/data lama. Sinkronisasi dilakukan eksplisit melalui preview dan commit API; field ini baru boleh dihapus setelah seluruh consumer berpindah ke `class_members`.
- NIS, NISN, NIP, NUPTK, kode mata pelajaran, dan nama periode tetap unik walaupun record di-soft-delete. Strategi ini mencegah identifier resmi dipakai ulang tanpa proses restore/koreksi terkontrol.
- Migration integritas terbaru menolak konflik aktif rombel, wali kelas, penugasan identik, primary role ganda, dan kombinasi tahun ajaran yang tidak konsisten. Migration tidak menghapus data; konflik existing harus diselesaikan secara manual sebelum migration diterapkan.

## Authorization Matrix

- `admin`: seluruh master data, akademik, dan pengaturan.
- `guru`: dashboard, penilaian, absensi, dan jurnal mengajar. Scope data guru akan dipersempit saat API modul tersebut tersedia.
- `walikelas`: dashboard, absensi, kegiatan siswa, rapor, dan laporan kelas. Scope kelas tetap wajib ditegakkan backend saat endpoint tersedia.
- `kepala_sekolah`: dashboard, rapor monitoring, dan laporan.
- `siswa`: dashboard saat ini; akses data pribadi akan ditambahkan bersama API siswa.

Backend selalu menjadi sumber otoritas. Filter menu dan route guard frontend hanya membantu pengalaman pengguna.

## Testing And Build

```bash
npm run lint
npm run build

cd backend
php artisan test --do-not-cache-result
php artisan route:list
```

Test backend memakai SQLite `:memory:` dan menjalankan migration serta test seed secara otomatis. Test tidak boleh diarahkan ke database development atau production.

## Installation / Existing Development Commands

Command yang tersedia berdasarkan `package.json`:

```bash
npm install
npm run dev
npm run dev:check
npm run dev:frontend
npm run build
npm run lint
npm run preview
```

## Documentation

- [PRD.md](./PRD.md) - Product Requirements Document lengkap.
