export const stats = [
  {
    title: 'Jumlah Siswa',
    value: '1.248',
    trend: '12 dari bulan lalu',
    tone: 'green',
    icon: 'users',
    path: 'M2 28 C8 17 14 21 20 13 C25 6 30 19 36 14 C41 10 43 8 48 7',
  },
  {
    title: 'Jumlah Guru',
    value: '87',
    trend: '3 dari bulan lalu',
    tone: 'blue',
    icon: 'cap',
    path: 'M2 29 C7 22 11 29 16 21 C20 15 25 12 30 24 C35 35 41 15 48 18',
  },
  {
    title: 'Jumlah Kelas',
    value: '36',
    trend: 'tetap',
    tone: 'purple',
    icon: 'screen',
    neutral: true,
    path: 'M2 32 C10 25 15 34 22 18 C28 5 34 31 40 23 C43 19 45 16 48 17',
  },
  {
    title: 'Rata-rata Nilai',
    value: '82,45',
    trend: '4,21 dari semester lalu',
    tone: 'orange',
    icon: 'file',
    path: 'M2 33 C7 31 10 19 16 20 C23 21 24 34 32 31 C39 28 40 17 48 16',
  },
]

export const scheduleRows = [
  {
    time: '07:00 - 07:45',
    subject: 'Matematika',
    className: 'X IPA 1',
    teacher: 'Pak Budi Santoso',
    room: 'Ruang 201',
    tone: 'green',
  },
  {
    time: '07:45 - 08:30',
    subject: 'Bahasa Indonesia',
    className: 'X IPS 2',
    teacher: 'Ibu Rina Marlina',
    room: 'Ruang 105',
    tone: 'blue',
  },
  {
    time: '09:00 - 09:45',
    subject: 'Fisika',
    className: 'X IPA 1',
    teacher: 'Pak Deden Kurnia',
    room: 'Lab. Fisika',
    tone: 'purple',
  },
  {
    time: '09:45 - 10:30',
    subject: 'Kimia',
    className: 'X IPA 2',
    teacher: 'Ibu Siti Nurhaliza',
    room: 'Lab. Kimia',
    tone: 'orange',
  },
  {
    time: '11:00 - 11:45',
    subject: 'Sejarah Indonesia',
    className: 'X IPS 1',
    teacher: 'Pak Asep Hidayat',
    room: 'Ruang 203',
    tone: 'green',
  },
]

export const attendanceData = [
  { label: 'Hadir', value: 1028, percent: '82,37%', color: '#0aa66a' },
  { label: 'Izin', value: 123, percent: '9,86%', color: '#f5a30a' },
  { label: 'Sakit', value: 67, percent: '5,37%', color: '#ef3b2d' },
  { label: 'Alpa', value: 30, percent: '2,40%', color: '#8b95a1' },
]

export const activities = [
  {
    icon: 'user',
    title: 'Nilai Matematika X IPA 1 diperbarui',
    meta: 'Oleh Budi Santoso',
    time: '9 Mei 2025 08:15',
    category: 'Penilaian',
    tone: 'green',
  },
  {
    icon: 'calendar',
    title: 'Absensi siswa X IPS 2 telah dicatat',
    meta: 'Oleh Rina Marlina',
    time: '9 Mei 2025 07:50',
    category: 'Absensi',
    tone: 'purple',
  },
  {
    icon: 'clipboard',
    title: 'Jurnal mengajar Fisika kelas X IPA 1 ditambahkan',
    meta: 'Oleh Deden Kurnia',
    time: '8 Mei 2025 15:30',
    category: 'Jurnal',
    tone: 'orange',
  },
  {
    icon: 'download',
    title: 'Laporan nilai semester ganjil telah dibuat',
    meta: 'Oleh Administrator',
    time: '8 Mei 2025 14:10',
    category: 'Laporan',
    tone: 'blue',
  },
]

export const announcements = [
  {
    title: 'Pembagian Rapor Semester Genap',
    summary:
      'Pembagian rapor semester genap akan dilaksanakan pada hari Jumat, 20 Juni 2025 pukul 08.00 WIB di masing-masing kelas.',
    day: '08',
    month: 'MEI',
  },
  {
    title: 'Libur Kenaikan Kelas',
    summary:
      'Kegiatan belajar mengajar diliburkan mulai 22 - 28 Juni 2025 dalam rangka libur kenaikan kelas.',
    day: '07',
    month: 'MEI',
  },
  {
    title: 'PPDB Tahun Ajaran 2025/2026',
    summary:
      'Penerimaan Peserta Didik Baru akan dibuka mulai tanggal 1 Juni 2025 sampai 30 Juni 2025.',
    day: '05',
    month: 'MEI',
  },
]
