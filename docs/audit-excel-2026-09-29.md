# Audit Import/Export Excel e-Raport SMAN 27 Garut

## Inventaris sebelum perubahan

| Titik UI | Kondisi awal | Sumber data / tabel |
| --- | --- | --- |
| Master Siswa: Import Siswa, Export Excel | Import modal simulasi; export hanya notifikasi | `students`, `class_members`, `classes` |
| Master Guru: Import Guru, Export Excel, Export pilihan | Import modal simulasi; kedua export hanya notifikasi | `teachers`, `subjects` |
| Modal Master: Unduh Template | Tidak ada handler | Sesuai modul pemanggil |
| Master referensi: Export Excel pada Kelas, Ruangan, Mata Pelajaran, Tahun Ajaran, Semester, Agama, Ekstrakurikuler, Pengguna/Role | Semua hanya notifikasi | `classes`, `rooms`, `subjects`, `academic_years`, `semesters`, `religions`, `extracurriculars`, `users` |
| Akademik: Ekspor Jadwal | Hanya notifikasi | `schedules` |
| Kegiatan Siswa: Ekspor Data Keikutsertaan | Hanya notifikasi | `student_extracurriculars` |
| Absensi: Export Excel dalam `AttendanceRecapView` | Hanya notifikasi; komponen ini tidak dipakai oleh route aktif | Route aktif memakai `LiveAttendanceView`, `student_attendance_entries`, `student_attendances` |
| Jurnal: Export Data dalam `JournalMainView` | Hanya notifikasi; komponen ini tidak dipakai oleh route aktif | Route aktif memakai `JournalWorkspaceView`, `teaching_journals` |
| Laporan: Unduh CSV | Berfungsi untuk snapshot laporan tersimpan | `saved_reports.snapshot` |
| Laporan: Export dalam `ReportDataView` | Simulasi frontend; komponen lama tidak dipakai oleh route aktif | Route aktif memakai `Laporan.jsx` dan `saved_reports` |
| Rapor: Cetak/Export PDF | Bukan Excel; tetap di alur PDF existing | `final_course_grades`, data rapor |
| Leger, Input Nilai, Capaian Kompetensi, Rekap Nilai, Validasi Nilai, Rombel, Wali Kelas, Penugasan Guru | Tidak ada tombol Excel semula | Lihat mapping di bawah |

Sebelum perubahan, backend tidak memiliki route, controller, service Excel, atau koneksi Microsoft Graph. Tidak ada endpoint Excel yang dapat dianggap sudah bekerja. Tombol PDF dan CSV adalah alur berbeda dan tidak diubah.

## Implementasi saat ini

Satu endpoint keluarga `/api/v1/excel` menggunakan parser/generator XLSX bersama, mapping per modul, preview tersimpan sementara 30 menit, validasi ulang saat commit, transaksi, dan `audit_logs`. Import bersifat **update-only** untuk record yang sudah ada; tidak membuat master data, jurnal, atau keikutsertaan baru. Nilai dan absensi memakai upsert business record dengan kunci konteks yang tervalidasi. Baris `ERROR` memblokir seluruh commit. Perubahan existing berstatus `WARNING`; baris tanpa perubahan `VALID`. Laporan baris tersedia sebagai CSV dari modal preview.

| Modul | Kunci pencocokan import | Field yang boleh diperbarui | Export |
| --- | --- | --- | --- |
| Siswa | NISN atau NIS; kelas hanya validasi | nama, JK | data siswa sesuai filter, admin; akses baca guru tetap dibatasi backend |
| Guru | NIP atau NUPTK | nama, email, mapel existing | guru sesuai filter / ID pilihan |
| Kelas | kode + tahun pelajaran ID | kapasitas | kelas sesuai tahun pelajaran |
| Mata Pelajaran | kode mapel | kelompok, jam per minggu | seluruh mapel sesuai filter |
| Tahun Pelajaran | nama tahun | tanggal mulai, selesai; status melalui alur aktivasi existing | tahun pelajaran |
| Semester | semester ID | tanggal mulai, selesai; status melalui alur aktivasi existing | semester sesuai tahun |
| Ruangan | ruangan ID; kode dan tahun pelajaran ID diverifikasi | nama, gedung, lantai, kapasitas, tipe | ruangan |
| Agama | nama | status | referensi agama |
| Ekstrakurikuler master | kode | nama, pembina ID, status | referensi ekskul |
| Nilai | NISN/NIS + assessment ID, dengan course assignment ID dari UI | skor, catatan melalui `AssessmentService` existing | buku nilai penugasan terpilih |
| Capaian Kompetensi | NISN/NIS + course assignment ID, nilai akhir harus ada | narasi capaian tertinggi/terendah melalui `AssessmentService` | capaian penugasan terpilih |
| Absensi harian | NISN/NIS + tanggal + kelas + semester + lingkup | status, keterangan; ringkasan semester disesuaikan | entri absensi kelas/semester |
| Keikutsertaan siswa | NISN/NIS + kode ekskul + semester; tepat satu record existing | predikat, deskripsi | keikutsertaan kelas/semester |
| Nilai ekstrakurikuler | Menggunakan record keikutsertaan yang sama | predikat, deskripsi | keikutsertaan sesuai filter kegiatan dan status |
| Catatan kokurikuler dan wali kelas | Data per siswa/kelas/semester; import massal belum ditawarkan | — | `.xlsx` sesuai kelas, semester, pencarian, status |
| Jurnal Mengajar | jurnal ID; guru/kelas/semester harus cocok | materi, aktivitas, catatan | jurnal sesuai filter dan guru pemilik |
| Rombel, wali kelas, penugasan guru, jadwal | Tidak ada import otomatis untuk relasi/penugasan yang membuat akses baru | — | `.xlsx` sesuai konteks admin |
| Leger, rekap nilai kelas, rapor siswa | Data turunan; tidak diimport langsung | — | `.xlsx` dari nilai akhir, sesuai kelas/siswa dan role |
| Validasi Nilai | Status turunan dari penugasan dan nilai akhir; tidak diimport | — | `.xlsx` status validasi per kelas/semester |
| Laporan tersimpan | Snapshot tidak diimport | — | `.xlsx` dari snapshot yang boleh dilihat user |
| Pengguna/Role | Tidak diimport melalui Excel untuk menghindari perubahan akun/otorisasi massal | — | username, nama, email, status aktif; tanpa password/token |

## Microsoft 365

Konfigurasi diperlukan di `backend/.env`: `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `APP_URL`, dan `FRONTEND_URL`. Daftarkan redirect URI `{APP_URL}/excel/microsoft/callback` sebagai **Web** dan izinkan delegated Microsoft Graph `Files.ReadWrite`. Login memakai authorization code + PKCE dan state melalui route web Laravel agar sesi OAuth tetap tersedia saat callback; token disimpan dalam sesi Laravel. Picker membaca OneDrive, daftar worksheet (`/v1.0/me/drive/items/{id}/workbook/worksheets`), kemudian `usedRange(valuesOnly=true)`. Upload lokal `.xlsx` tetap tersedia tanpa Microsoft 365. Kedua sumber masuk ke validasi/preview/commit yang sama.

## Batasan yang disengaja

- Format lama `.xls` tidak didukung; modal hanya menerima `.xlsx`. Import dibatasi 5 MB dan 10.000 baris untuk mencegah pemrosesan workbook yang terlalu besar.
- Rumus Excel tidak dieksekusi. Export menulis setiap sel sebagai teks supaya NISN/NIS dan kode berawalan nol tidak berubah.
- Preview Microsoft 365 memerlukan kredensial Entra organisasi yang valid. Integrasi langsung dengan tenant nyata belum dapat diuji tanpa konfigurasi itu.
- Import relasi rombel, penugasan guru/wali, jadwal, leger, rapor, laporan, dan pengguna tidak ditawarkan. Modul tersebut memiliki alur bisnis/otorisasi khusus; perubahan massal yang dapat mengubah hak akses harus melalui formulir existing.
- Komponen UI lama yang tidak dirender route aktif (`AttendanceRecapView`, `JournalMainView`, `ReportDataView`) tetap disimpan untuk kompatibilitas, tetapi bukan sumber aksi Excel yang dipakai pengguna.

## Verifikasi

- PHPUnit: 192 tes lulus, 1187 assertion. `ExcelTransferTest` mencakup roundtrip `.xlsx`, pencocokan identifier lintas urutan baris, duplikat NISN/NIS, target ruangan dengan kode sama, pembatasan export siswa berdasarkan keanggotaan kelas, preview/konfirmasi, role admin, endpoint Graph v1.0, dan sesi callback OAuth.
- File `.xlsx` buatan `openpyxl` dibaca dengan benar oleh parser lokal. Build Vite dan ESLint lulus pada saat audit.
