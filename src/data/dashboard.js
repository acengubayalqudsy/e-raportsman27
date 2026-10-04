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

export const ROLE_CONFIGS = {
  admin: {
    subtitle: 'Kelola data akademik dan administrasi sekolah secara terintegrasi',
    desktopStats: stats,
    mobileStats: [
      { title: 'Jumlah Siswa', value: '1.248', icon: 'users', tone: 'green' },
      { title: 'Jumlah Guru', value: '87', icon: 'cap', tone: 'blue' },
      { title: 'Jumlah Kelas', value: '36', icon: 'screen', tone: 'purple' },
      { title: 'Rata-rata Nilai', value: '82,45', icon: 'file', tone: 'orange' },
    ],
    scheduleTitle: 'Jadwal Hari Ini',
    scheduleActionText: 'Lihat Semua',
    scheduleActionHref: '/akademik/jadwal-pelajaran',
    attendanceTitle: 'Absensi Siswa Hari Ini',
    attendanceActionText: 'Lihat Detail',
    attendanceActionHref: '/absensi/rekap',
  },

  guru: {
    subtitle: 'Portal Guru — Kelola penilaian, kehadiran siswa, dan jurnal pembelajaran kelas yang diampu',
    desktopStats: [
      {
        title: 'Kelas Diampu',
        value: '5 Kelas',
        trend: 'Tahun Ajaran Aktif',
        tone: 'blue',
        icon: 'screen',
        path: 'M2 32 C10 25 15 34 22 18 C28 5 34 31 40 23 C43 19 45 16 48 17',
      },
      {
        title: 'Jam Mengajar',
        value: '24 Jam/Mgg',
        trend: 'Beban Kurikulum Merdeka',
        tone: 'purple',
        icon: 'calendar',
        neutral: true,
        path: 'M2 29 C7 22 11 29 16 21 C20 15 25 12 30 24 C35 35 41 15 48 18',
      },
      {
        title: 'Siswa Dinilai',
        value: '178 Siswa',
        trend: '94% dari total terisi',
        tone: 'green',
        icon: 'grade',
        path: 'M2 28 C8 17 14 21 20 13 C25 6 30 19 36 14 C41 10 43 8 48 7',
      },
      {
        title: 'Jurnal Terisi',
        value: '32 Pertemuan',
        trend: 'Terakhir hari ini',
        tone: 'orange',
        icon: 'journal',
        path: 'M2 33 C7 31 10 19 16 20 C23 21 24 34 32 31 C39 28 40 17 48 16',
      },
    ],
    mobileStats: [
      { title: 'Kelas Diampu', value: '5 Kelas', icon: 'screen', tone: 'blue' },
      { title: 'Jam Mengajar', value: '24 Jam', icon: 'calendar', tone: 'purple' },
      { title: 'Siswa Dinilai', value: '178 Siswa', icon: 'grade', tone: 'green' },
      { title: 'Jurnal Terisi', value: '32 Sesi', icon: 'journal', tone: 'orange' },
    ],
    scheduleTitle: 'Jadwal Mengajar Hari Ini',
    scheduleActionText: 'Buka Jurnal',
    scheduleActionHref: '/jurnal-mengajar/jurnal',
    attendanceTitle: 'Presensi Siswa di Kelas',
    attendanceActionText: 'Input Presensi',
    attendanceActionHref: '/absensi/per-kelas',
  },

  walikelas: {
    subtitle: 'Portal Wali Kelas — Monitoring perkembangan siswa, absensi, dan administrasi rapor kelas',
    desktopStats: [
      {
        title: 'Siswa di Kelas',
        value: '36 Siswa',
        trend: '18 L / 18 P (Lengkap)',
        tone: 'green',
        icon: 'users',
        path: 'M2 28 C8 17 14 21 20 13 C25 6 30 19 36 14 C41 10 43 8 48 7',
      },
      {
        title: 'Kehadiran Kelas',
        value: '96,8%',
        trend: 'Tingkat kehadiran rombel',
        tone: 'blue',
        icon: 'clipboardCheck',
        path: 'M2 29 C7 22 11 29 16 21 C20 15 25 12 30 24 C35 35 41 15 48 18',
      },
      {
        title: 'Nilai Mapel Masuk',
        value: '12 / 14',
        trend: '2 mapel dalam verifikasi',
        tone: 'orange',
        icon: 'grade',
        path: 'M2 33 C7 31 10 19 16 20 C23 21 24 34 32 31 C39 28 40 17 48 16',
      },
      {
        title: 'Rapor Siap Cetak',
        value: '34 Siswa',
        trend: 'Siap generate rapor',
        tone: 'purple',
        icon: 'report',
        path: 'M2 32 C10 25 15 34 22 18 C28 5 34 31 40 23 C43 19 45 16 48 17',
      },
    ],
    mobileStats: [
      { title: 'Siswa di Kelas', value: '36 Siswa', icon: 'users', tone: 'green' },
      { title: 'Kehadiran Kelas', value: '96,8%', icon: 'clipboardCheck', tone: 'blue' },
      { title: 'Nilai Mapel', value: '12/14', icon: 'grade', tone: 'orange' },
      { title: 'Rapor Siap', value: '34 Siswa', icon: 'report', tone: 'purple' },
    ],
    scheduleTitle: 'Jadwal Belajar Kelas Binaan',
    scheduleActionText: 'Catatan Rombel',
    scheduleActionHref: '/kegiatan-siswa/catatan-wali-kelas',
    attendanceTitle: 'Presensi Kelas Binaan',
    attendanceActionText: 'Detail Absensi',
    attendanceActionHref: '/absensi/per-kelas',
  },

  kepala_sekolah: {
    subtitle: 'Portal Eksekutif — Monitoring mutu akademik, kurikulum, dan pengesahan rapor sekolah',
    desktopStats: [
      {
        title: 'Total Siswa',
        value: '1.248',
        trend: '36 Rombel aktif',
        tone: 'green',
        icon: 'users',
        path: 'M2 28 C8 17 14 21 20 13 C25 6 30 19 36 14 C41 10 43 8 48 7',
      },
      {
        title: 'Guru & Tendik',
        value: '87 Orang',
        trend: '100% Tenaga pengajar aktif',
        tone: 'blue',
        icon: 'cap',
        path: 'M2 29 C7 22 11 29 16 21 C20 15 25 12 30 24 C35 35 41 15 48 18',
      },
      {
        title: 'Rata-rata Sekolah',
        value: '82,45',
        trend: '+4,21 semester ini',
        tone: 'orange',
        icon: 'file',
        path: 'M2 33 C7 31 10 19 16 20 C23 21 24 34 32 31 C39 28 40 17 48 16',
      },
      {
        title: 'Keterisian Rapor',
        value: '92%',
        trend: 'Menuju cetak & legalisasi',
        tone: 'purple',
        icon: 'report',
        path: 'M2 32 C10 25 15 34 22 18 C28 5 34 31 40 23 C43 19 45 16 48 17',
      },
    ],
    mobileStats: [
      { title: 'Total Siswa', value: '1.248', icon: 'users', tone: 'green' },
      { title: 'Guru & Tendik', value: '87 Org', icon: 'cap', tone: 'blue' },
      { title: 'Rata-rata Nilai', value: '82,45', icon: 'file', tone: 'orange' },
      { title: 'Keterisian Rapor', value: '92%', icon: 'report', tone: 'purple' },
    ],
    scheduleTitle: 'Agenda Akademik Hari Ini',
    scheduleActionText: 'Buka Laporan',
    scheduleActionHref: '/laporan',
    attendanceTitle: 'Rekapitulasi Kehadiran Sekolah',
    attendanceActionText: 'Laporan Presensi',
    attendanceActionHref: '/laporan/absensi',
  },

  siswa: {
    subtitle: 'Portal Siswa — Informasi jadwal pelajaran, kehadiran, dan capaian hasil belajar',
    desktopStats: [
      {
        title: 'Kehadiran Mandiri',
        value: '97,5%',
        trend: 'Hadir 78 dari 80 hari efektif',
        tone: 'green',
        icon: 'clipboardCheck',
        path: 'M2 28 C8 17 14 21 20 13 C25 6 30 19 36 14 C41 10 43 8 48 7',
      },
      {
        title: 'Mata Pelajaran',
        value: '14 Mapel',
        trend: 'Kurikulum Merdeka aktif',
        tone: 'blue',
        icon: 'screen',
        path: 'M2 32 C10 25 15 34 22 18 C28 5 34 31 40 23 C43 19 45 16 48 17',
      },
      {
        title: 'Nilai Rata-rata',
        value: '84,20',
        trend: 'Peringkat 5 di kelas',
        tone: 'orange',
        icon: 'file',
        path: 'M2 33 C7 31 10 19 16 20 C23 21 24 34 32 31 C39 28 40 17 48 16',
      },
      {
        title: 'Ekstrakurikuler',
        value: '2 Ekskul',
        trend: 'Pramuka & PMR aktif',
        tone: 'purple',
        icon: 'cap',
        path: 'M2 29 C7 22 11 29 16 21 C20 15 25 12 30 24 C35 35 41 15 48 18',
      },
    ],
    mobileStats: [
      { title: 'Kehadiran', value: '97,5%', icon: 'clipboardCheck', tone: 'green' },
      { title: 'Mata Pelajaran', value: '14 Mapel', icon: 'screen', tone: 'blue' },
      { title: 'Nilai Rata-rata', value: '84,20', icon: 'file', tone: 'orange' },
      { title: 'Ekstrakurikuler', value: '2 Ekskul', icon: 'cap', tone: 'purple' },
    ],
    scheduleTitle: 'Jadwal Pelajaran Saya Hari Ini',
    scheduleActionText: null,
    scheduleActionHref: null,
    attendanceTitle: 'Ringkasan Kehadiran Semester Ini',
    attendanceActionText: null,
    attendanceActionHref: null,
  },
}

export function getRoleDashboardConfig(roles = [], primaryRole = '') {
  const roleNames = roles.map((r) => (typeof r === 'string' ? r : r.name))
  if (primaryRole && ROLE_CONFIGS[primaryRole]) {
    return ROLE_CONFIGS[primaryRole]
  }
  if (roleNames.includes('admin')) return ROLE_CONFIGS.admin
  if (roleNames.includes('walikelas')) return ROLE_CONFIGS.walikelas
  if (roleNames.includes('guru')) return ROLE_CONFIGS.guru
  if (roleNames.includes('kepala_sekolah')) return ROLE_CONFIGS.kepala_sekolah
  if (roleNames.includes('siswa')) return ROLE_CONFIGS.siswa
  return ROLE_CONFIGS.admin
}

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
