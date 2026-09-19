export const assessmentTabs = [
  { key: 'input-nilai', label: 'Input Nilai', icon: 'grade', route: '/penilaian/input-nilai' },
  { key: 'nilai-per-mapel', label: 'Nilai Per Mapel', icon: 'table', route: '/penilaian/nilai-per-mapel' },
  { key: 'nilai-sikap', label: 'Nilai Sikap', icon: 'shield', route: '/penilaian/nilai-sikap' },
  {
    key: 'capaian-kompetensi',
    label: 'Capaian Kompetensi (Deskripsi)',
    icon: 'sliders',
    route: '/penilaian/capaian-kompetensi',
  },
  {
    key: 'rekap-nilai-per-kelas',
    label: 'Rekap Nilai Per Kelas',
    icon: 'table',
    route: '/penilaian/rekap-nilai-per-kelas',
  },
  { key: 'validasi-nilai', label: 'Validasi Nilai', icon: 'check', route: '/penilaian/validasi-nilai' },
]

export const assessmentSummary = [
  { title: 'Total Siswa', value: '36', caption: 'Siswa Aktif', icon: 'clipboardCheck', tone: 'green' },
  { title: 'Mata Pelajaran', value: '18', caption: 'Mapel Aktif', icon: 'book', tone: 'blue' },
  { title: 'Nilai Sudah Diisi', value: '62,5%', caption: 'Progress Input', icon: 'checkCircle', tone: 'purple' },
  {
    title: 'Rata-rata Nilai Kelas',
    value: '82,45',
    caption: '4,21 dari semester lalu',
    icon: 'trend',
    tone: 'orange',
    trend: true,
  },
]

export const assessmentOptions = {
  classes: ['X Merdeka 3', 'X Merdeka 2', 'X Merdeka 1', 'XI Merdeka 1'],
  subjects: ['Matematika', 'Bahasa Indonesia', 'Fisika', 'Kimia', 'Biologi'],
  assessmentTypes: ['Pengetahuan', 'Keterampilan'],
  semesters: ['Genap', 'Ganjil'],
}

const studentNames = [
  'ACEP HASANUL IHWAN',
  'ADAM ARDIANSYAH',
  'AFIQAH NUR FAUZIAH',
  'AHMAD FAUZI',
  'ALIF RAHMAN HAKIM',
  'ANISA MAULIDA',
  'AZZAHRA PUTRI',
  'BAGAS MAULANA',
  'BIMA SAPUTRA',
  'CITRA LESTARI',
  'DANANG PRATAMA',
  'DARA NUR AINI',
  'DEDI KURNIAWAN',
  'DEWI RAHAYU',
  'DIMAS SETIAWAN',
  'DINA AMALIA',
  'FAJAR RAMADHAN',
  'FARHAN AKBAR',
  'FATHIA NURHALIZA',
  'GALIH PERMANA',
  'GILANG RAMDANI',
  'HANA SALSABILA',
  'ILHAM MAULANA',
  'INTAN PERMATA',
  'KAMILA AZZAHRA',
  'LUTHFI HAKIM',
  'MELATI SAFITRI',
  'MUHAMMAD RIZKY',
  'NABILA PUTRI',
  'NAUFAL ALFARIZI',
  'RAFI ABDULLAH',
  'RANIA KHAIRUNNISA',
  'RIZAL FADHILLAH',
  'SALMA NURJANAH',
  'SYAHRUL GUNAWAN',
  'ZAHRA AULIA',
]

const scorePatterns = [
  { tugas: 85, uts: 80, uas: 90, praktik: 85 },
  { tugas: 75, uts: 78, uas: 80, praktik: 80 },
  { tugas: 90, uts: 85, uas: 92, praktik: 90 },
  { tugas: 70, uts: 72, uas: 75, praktik: 70 },
  { tugas: 95, uts: 90, uas: 93, praktik: 95 },
  { tugas: 80, uts: 82, uas: 85, praktik: 80 },
  { tugas: 65, uts: 70, uas: 72, praktik: 70 },
  { tugas: 78, uts: 75, uas: 80, praktik: 75 },
  { tugas: 88, uts: 84, uas: 86, praktik: 90 },
  { tugas: 82, uts: 79, uas: 84, praktik: 85 },
  { tugas: 73, uts: 76, uas: 78, praktik: 80 },
  { tugas: 92, uts: 88, uas: 90, praktik: 92 },
]

export const scoreStudents = studentNames.map((name, index) => {
  const scores = scorePatterns[index % scorePatterns.length]

  return {
    id: index + 1,
    nis: `252610${String(index + 1).padStart(3, '0')}`,
    name,
    kkm: 75,
    initialScores: { ...scores },
  }
})

export const recapSubjects = [
  'PABP',
  'PPKn',
  'B. Indonesia',
  'Matematika',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sosiologi',
  'Ekonomi',
  'Sejarah',
  'Geografi',
  'B. Inggris',
  'Penjas',
  'Informatika',
  'PKWU',
  'B. Sunda',
]

export const validationSubjects = [
  { id: 1, subject: 'Matematika', teacher: 'Budi Santoso, M.Pd.', scored: 36, descriptions: 34 },
  { id: 2, subject: 'Bahasa Indonesia', teacher: 'Rina Marlina, S.Pd.', scored: 36, descriptions: 36 },
  { id: 3, subject: 'Fisika', teacher: 'Deden Kurnia, S.Pd.', scored: 34, descriptions: 32 },
  { id: 4, subject: 'Kimia', teacher: 'Siti Nurhaliza, S.Pd.', scored: 36, descriptions: 36 },
  { id: 5, subject: 'Biologi', teacher: 'Dewi Kartika, S.Pd.', scored: 36, descriptions: 35 },
  { id: 6, subject: 'Bahasa Inggris', teacher: 'Maya Lestari, S.Pd.', scored: 35, descriptions: 35 },
]

export function calculateFinalScore(scores) {
  return scores.tugas * 0.2 + scores.uts * 0.3 + scores.uas * 0.4 + scores.praktik * 0.1
}

export function getPredicate(score) {
  if (score >= 84) return 'A'
  if (score >= 80) return 'A-'
  if (score >= 70) return 'B'
  return 'C'
}

export function formatScore(score) {
  return score.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
