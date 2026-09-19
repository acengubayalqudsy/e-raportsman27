import {
  calculateStudentAverage,
  getPredicate,
  raporStudents,
} from './rapor.js'

export const reportTabs = [
  { key: 'nilai', label: 'Laporan Nilai', route: '/laporan/nilai', icon: 'fileGrade', tone: 'green' },
  { key: 'absensi', label: 'Laporan Absensi', route: '/laporan/absensi', icon: 'calendar', tone: 'blue' },
  { key: 'ekstrakurikuler', label: 'Laporan Ekstrakurikuler', route: '/laporan/ekstrakurikuler', icon: 'users', tone: 'orange' },
  { key: 'kokurikuler', label: 'Laporan Kokurikuler', route: '/laporan/kokurikuler', icon: 'book', tone: 'purple' },
  { key: 'per-kelas', label: 'Laporan Per Kelas', route: '/laporan/per-kelas', icon: 'users', tone: 'teal' },
  { key: 'per-siswa', label: 'Laporan Per Siswa', route: '/laporan/per-siswa', icon: 'user', tone: 'rose' },
  { key: 'rekapitulasi-rapor', label: 'Rekapitulasi Rapor', route: '/laporan/rekapitulasi-rapor', icon: 'trophy', tone: 'forest' },
]

export const reportSummary = [
  { title: 'Total Laporan', value: '128', caption: 'Semua jenis laporan', icon: 'document', tone: 'green' },
  { title: 'Laporan Dibuat', value: '86', caption: '67,19%', icon: 'fileCheck', tone: 'blue' },
  { title: 'Menunggu', value: '18', caption: '14,06%', icon: 'clock', tone: 'orange' },
  { title: 'Selesai', value: '22', caption: '17,19%', icon: 'checkCircle', tone: 'purple' },
  { title: 'Total Dicetak', value: '312', caption: 'Tahun ini', icon: 'download', tone: 'teal' },
]

export const reportOptions = {
  academicYears: ['2024/2025', '2025/2026'],
  semesters: ['Genap', 'Ganjil'],
  classes: ['Semua Kelas', 'X Merdeka 3', 'X Merdeka 2', 'XI Merdeka 1', 'XII Merdeka 2'],
  grades: ['Semua Tingkat', 'X', 'XI', 'XII'],
  subjects: ['Semua Mata Pelajaran', 'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika'],
  teachers: ['Semua Guru', 'Budi Santoso', 'Rina Marlina', 'Agus Setiawan', 'Dewi Lestari'],
  months: ['Mei 2025', 'April 2025', 'Maret 2025'],
  extracurriculars: ['Semua Ekstrakurikuler', 'Pramuka', 'Futsal', 'Paskibra', 'PMR', 'Seni Tari'],
  statuses: ['Semua Status', 'Draft', 'Menunggu', 'Selesai'],
}

export const reportCards = [
  {
    ...reportTabs[0],
    description: 'Rekap nilai pengetahuan, keterampilan, dan sikap siswa.',
    features: ['Nilai harian dan penilaian', 'Nilai sikap', 'Nilai keterampilan', 'Nilai akhir semester'],
  },
  {
    ...reportTabs[1],
    description: 'Rekap kehadiran siswa secara detail berdasarkan periode.',
    features: ['Kehadiran per siswa', 'Kehadiran per kelas', 'Kehadiran per mata pelajaran', 'Rekap bulan / semester'],
  },
  {
    ...reportTabs[2],
    description: 'Laporan keikutsertaan dan nilai ekstrakurikuler siswa.',
    features: ['Keikutsertaan ekstrakurikuler', 'Nilai ekstrakurikuler', 'Rekap per jenjang', 'Rekap per kegiatan'],
  },
  {
    ...reportTabs[3],
    description: 'Laporan catatan kokurikuler siswa berdasarkan kelas.',
    features: ['Catatan kokurikuler per siswa', 'Rekap per kelas', 'Rekap per semester', 'Rekap per tahun ajaran'],
  },
  {
    ...reportTabs[4],
    description: 'Rekap nilai dan kehadiran seluruh siswa dalam satu kelas.',
    features: ['Nilai per kelas', 'Kehadiran per kelas', 'Peringkat kelas', 'Analisis perbandingan'],
  },
  {
    ...reportTabs[5],
    description: 'Laporan lengkap akademik dan non-akademik per siswa.',
    features: ['Profil siswa', 'Nilai akademik', 'Absensi', 'Prestasi & catatan'],
  },
  {
    ...reportTabs[6],
    description: 'Rekap hasil rapor seluruh siswa per semester dan tahun ajaran.',
    features: ['Rekap nilai akhir', 'Ketidakhadiran', 'Rangking paralel', 'Rekap per jenjang'],
  },
]

export const reportStatistics = [30, 22, 21, 17, 28, 20, 23, 9, 12, 25, 18]

export const recentReports = [
  { id: 1, title: 'Laporan Nilai Akhir Semester Genap', className: 'X Merdeka 3', date: '9 Mei 2025, 10:30', status: 'Selesai', icon: 'document', tone: 'green' },
  { id: 2, title: 'Laporan Absensi Bulan Mei 2025', className: 'X Merdeka 3', date: '9 Mei 2025, 09:15', status: 'Selesai', icon: 'document', tone: 'green' },
  { id: 3, title: 'Laporan Ekstrakurikuler Semester Genap', className: 'SMAN 27 Garut', date: '8 Mei 2025, 16:45', status: 'Selesai', icon: 'document', tone: 'blue' },
  { id: 4, title: 'Laporan Kokurikuler Semester Genap', className: 'X Merdeka 1', date: '8 Mei 2025, 14:20', status: 'Menunggu', icon: 'document', tone: 'orange' },
  { id: 5, title: 'Rekapitulasi Rapor 2024/2025', className: 'Semua Tingkat', date: '8 Mei 2025, 11:05', status: 'Proses', icon: 'document', tone: 'rose' },
]

const classAlternates = ['X Merdeka 3', 'X Merdeka 2', 'XI Merdeka 1', 'XII Merdeka 2']
const subjects = ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika']
const extracurriculars = ['Pramuka', 'Futsal', 'Paskibra', 'PMR', 'Seni Tari']

export const reportStudents = raporStudents.map((student, index) => {
  const average = calculateStudentAverage(student)
  const present = 20 + (index % 4)
  const sick = index % 3
  const permitted = index % 4 === 0 ? 1 : 0
  const absent = index % 9 === 0 ? 1 : 0

  return {
    ...student,
    className: classAlternates[index % classAlternates.length],
    grade: index % 4 < 2 ? 'X' : index % 4 === 2 ? 'XI' : 'XII',
    finalScore: Number(average.toFixed(2)),
    predicate: getPredicate(average),
    present,
    sick,
    permitted,
    absent,
    attendancePercentage: Number(((present / 25) * 100).toFixed(2)),
    subject: subjects[index % subjects.length],
    teacher: ['Budi Santoso', 'Rina Marlina', 'Agus Setiawan', 'Dewi Lestari'][index % 4],
    extracurricular: extracurriculars[index % extracurriculars.length],
    extracurricularGrade: ['A', 'A-', 'B', 'B', 'A'][index % 5],
    extracurricularDescription: 'Aktif mengikuti kegiatan dan menunjukkan tanggung jawab yang baik.',
    cocurricularNote: index % 3 === 0 ? 'Menunjukkan kolaborasi dan kepedulian sosial yang sangat baik.' : 'Berpartisipasi aktif dalam proyek kokurikuler kelas.',
    reportStatus: index % 5 === 0 ? 'Menunggu' : index % 7 === 0 ? 'Draft' : 'Selesai',
  }
})

export const classReportRows = [
  'X Merdeka 3', 'X Merdeka 2', 'X Merdeka 1', 'XI Merdeka 1', 'XI Merdeka 2', 'XI Merdeka 3',
  'XII Merdeka 1', 'XII Merdeka 2', 'XII Merdeka 3',
].map((className, index) => ({
  id: `class-${index + 1}`,
  className,
  grade: index < 3 ? 'X' : index < 6 ? 'XI' : 'XII',
  homeroomTeacher: ['Rina Marlina', 'Budi Santoso', 'Dewi Lestari'][index % 3],
  academicYear: '2024/2025',
  semester: 'Genap',
  studentCount: 32 + (index % 5),
  average: (82.4 + (index % 7) * 0.7).toFixed(2),
  attendance: `${90 + (index % 7)}%`,
  rank: index + 1,
  activity: 18 + index,
  reportStatus: index % 4 === 0 ? 'Menunggu' : 'Selesai',
}))

export const reportDetailMeta = {
  nilai: {
    title: 'Laporan Nilai Siswa',
    subtitle: 'Rekap hasil penilaian siswa per mata pelajaran.',
    columns: ['NIS', 'Nama Siswa', 'Kelas', 'Tugas', 'UTS', 'UAS', 'Praktik', 'Nilai Akhir', 'Predikat'],
  },
  absensi: {
    title: 'Laporan Absensi Siswa',
    subtitle: 'Ringkasan kehadiran siswa untuk periode yang dipilih.',
    columns: ['NIS', 'Nama Siswa', 'Kelas', 'Hadir', 'Sakit', 'Izin', 'Tanpa Ket.', 'Persentase'],
  },
  ekstrakurikuler: {
    title: 'Laporan Ekstrakurikuler',
    subtitle: 'Keikutsertaan dan capaian ekstrakurikuler siswa.',
    columns: ['NIS', 'Nama Siswa', 'Kelas', 'Ekstrakurikuler', 'Predikat', 'Deskripsi', 'Status'],
  },
  kokurikuler: {
    title: 'Laporan Kokurikuler',
    subtitle: 'Catatan perkembangan kegiatan kokurikuler siswa.',
    columns: ['NIS', 'Nama Siswa', 'Kelas', 'Catatan Kokurikuler', 'Status'],
  },
  'per-kelas': {
    title: 'Laporan Per Kelas',
    subtitle: 'Ringkasan nilai, absensi, kegiatan, dan status rapor per kelas.',
    columns: ['Kelas', 'Wali Kelas', 'Siswa', 'Rata-rata Nilai', 'Kehadiran', 'Ranking', 'Kegiatan', 'Status Rapor'],
  },
  'per-siswa': {
    title: 'Laporan Per Siswa',
    subtitle: 'Ringkasan akademik dan non-akademik siswa.',
    columns: ['NIS', 'Nama Siswa', 'Kelas', 'Nilai Akhir', 'Kehadiran', 'Ekstrakurikuler', 'Status Rapor'],
  },
  'rekapitulasi-rapor': {
    title: 'Rekapitulasi Rapor',
    subtitle: 'Rekap hasil rapor berdasarkan kelas dan tingkat.',
    columns: ['Kelas', 'Tingkat', 'Siswa', 'Rata-rata Nilai', 'Kehadiran', 'Ranking', 'Status Rapor'],
  },
}

export function getReportRows(key) {
  return key === 'per-kelas' || key === 'rekapitulasi-rapor' ? classReportRows : reportStudents
}

