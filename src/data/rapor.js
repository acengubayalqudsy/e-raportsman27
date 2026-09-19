export const raporTabs = [
  { key: 'daftar-rapor', label: 'Daftar Rapor', icon: 'report', route: '/rapor-leger/daftar-rapor' },
  { key: 'generate-rapor', label: 'Generate Rapor', icon: 'document', route: '/rapor-leger/generate-rapor' },
  { key: 'rapor-per-siswa', label: 'Rapor Per Siswa', icon: 'users', route: '/rapor-leger/rapor-per-siswa' },
  { key: 'leger-nilai', label: 'Leger Nilai', icon: 'table', route: '/rapor-leger/leger-nilai' },
  {
    key: 'leger-deskripsi',
    label: 'Leger Deskripsi',
    icon: 'table',
    route: '/rapor-leger/leger-deskripsi',
  },
  {
    key: 'peringkat-kelas',
    label: 'Peringkat Kelas',
    icon: 'users',
    route: '/rapor-leger/peringkat-kelas',
  },
  { key: 'cover-rapor', label: 'Cover Rapor', icon: 'report', route: '/rapor-leger/cover-rapor' },
  { key: 'cetak-export', label: 'Cetak / Export PDF', icon: 'download', route: '/rapor-leger/cetak-export' },
]

export const raporSummary = [
  {
    title: 'Total Siswa',
    value: '36',
    caption: 'X Merdeka 3',
    icon: 'document',
    tone: 'green',
  },
  {
    title: 'Rapor Sudah Dibuat',
    value: '0',
    caption: '0% dari total siswa',
    icon: 'users',
    tone: 'blue',
  },
  {
    title: 'Belum Dibagikan',
    value: '36',
    caption: '100% rapor',
    icon: 'calendar',
    tone: 'orange',
  },
  {
    title: 'Siap Dicetak',
    value: '0',
    caption: 'Belum ada rapor',
    icon: 'download',
    tone: 'purple',
  },
  {
    title: 'Rapor Terakhir',
    value: '-',
    caption: 'Belum dibuat',
    icon: 'checkCircle',
    tone: 'teal',
  },
]

export const raporOptions = {
  classes: ['X Merdeka 3', 'X Merdeka 2', 'X Merdeka 1', 'XI Merdeka 1'],
  academicYears: ['2024/2025', '2023/2024', '2022/2023'],
  semesters: ['Genap', 'Ganjil'],
  statuses: ['Semua Status', 'Belum Dibuat', 'Sudah Dibuat', 'Revisi', 'Siap Dicetak', 'Sudah Dibagikan'],
}

export const raporReadiness = [
  {
    id: 'biodata',
    label: 'Biodata Siswa',
    description: '36 dari 36 biodata siswa tersedia',
    progress: '36/36',
    status: 'Lengkap',
  },
  {
    id: 'nilai-akademik',
    label: 'Nilai Akademik',
    description: 'Seluruh nilai mata pelajaran telah divalidasi',
    progress: '36/36',
    status: 'Lengkap',
  },
  {
    id: 'nilai-sikap',
    label: 'Nilai Sikap',
    description: 'Nilai spiritual dan sosial telah tersedia',
    progress: '36/36',
    status: 'Lengkap',
  },
  {
    id: 'capaian-kompetensi',
    label: 'Capaian Kompetensi',
    description: 'Deskripsi 2 siswa masih perlu dilengkapi',
    progress: '34/36',
    status: 'Belum Lengkap',
  },
  {
    id: 'absensi',
    label: 'Absensi',
    description: 'Rekap ketidakhadiran seluruh siswa tersedia',
    progress: '36/36',
    status: 'Lengkap',
  },
  {
    id: 'ekstrakurikuler',
    label: 'Ekstrakurikuler',
    description: 'Nilai ekstrakurikuler telah tersedia',
    progress: '36/36',
    status: 'Lengkap',
  },
  {
    id: 'catatan-kokurikuler',
    label: 'Catatan Kokurikuler',
    description: 'Catatan kegiatan kokurikuler telah tersedia',
    progress: '36/36',
    status: 'Lengkap',
  },
  {
    id: 'catatan-wali-kelas',
    label: 'Catatan Wali Kelas',
    description: 'Dua catatan perlu diperiksa kembali',
    progress: '34/36',
    status: 'Perlu Pemeriksaan',
  },
]

export const raporSubjects = [
  { key: 'pabp', code: 'PABP', label: 'Pendidikan Agama dan Budi Pekerti' },
  { key: 'ppkn', code: 'PPKn', label: 'Pendidikan Pancasila' },
  { key: 'bahasaIndonesia', code: 'B. Indo', label: 'Bahasa Indonesia' },
  { key: 'matematika', code: 'MTK', label: 'Matematika' },
  { key: 'fisika', code: 'Fisika', label: 'Fisika' },
  { key: 'kimia', code: 'Kimia', label: 'Kimia' },
  { key: 'biologi', code: 'Biologi', label: 'Biologi' },
  { key: 'sosiologi', code: 'Sosiologi', label: 'Sosiologi' },
  { key: 'ekonomi', code: 'Ekonomi', label: 'Ekonomi' },
  { key: 'sejarah', code: 'Sejarah', label: 'Sejarah' },
  { key: 'geografi', code: 'Geografi', label: 'Geografi' },
  { key: 'bahasaInggris', code: 'B. Inggris', label: 'Bahasa Inggris' },
  { key: 'penjas', code: 'Penjas', label: 'Pendidikan Jasmani, Olahraga, dan Kesehatan' },
  { key: 'informatika', code: 'Informatika', label: 'Informatika' },
  { key: 'pkwu', code: 'PKWU', label: 'Prakarya dan Kewirausahaan' },
  { key: 'bahasaSunda', code: 'B. Sunda', label: 'Bahasa Sunda' },
]

export const schoolIdentity = {
  name: 'SMA NEGERI 27 GARUT',
  shortName: 'SMAN 27 GARUT',
  npsn: '20252411',
  address: 'Kabupaten Garut, Jawa Barat',
  ministry: 'KEMENTERIAN PENDIDIKAN',
}

export const raporDocumentTypes = [
  'Rapor Per Siswa',
  'Semua Rapor Kelas',
  'Leger Nilai',
  'Leger Deskripsi',
  'Cover Rapor',
]

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

const studentBirths = [
  'Garut, 10 Jan 2010',
  'Garut, 12 Feb 2010',
  'Garut, 15 Mar 2010',
  'Garut, 20 Apr 2010',
  'Garut, 22 Mei 2010',
  'Garut, 17 Jun 2010',
  'Garut, 18 Jul 2010',
  'Garut, 25 Agt 2010',
  'Garut, 02 Sep 2010',
  'Garut, 14 Okt 2010',
  'Garut, 06 Nov 2010',
  'Garut, 19 Des 2010',
  'Garut, 08 Jan 2010',
  'Garut, 21 Feb 2010',
  'Garut, 04 Mar 2010',
  'Garut, 27 Apr 2010',
  'Garut, 11 Mei 2010',
  'Garut, 23 Jun 2010',
  'Garut, 05 Jul 2010',
  'Garut, 16 Agt 2010',
  'Garut, 29 Sep 2010',
  'Garut, 03 Okt 2010',
  'Garut, 13 Nov 2010',
  'Garut, 24 Des 2010',
  'Garut, 17 Jan 2010',
  'Garut, 09 Feb 2010',
  'Garut, 26 Mar 2010',
  'Garut, 07 Apr 2010',
  'Garut, 30 Mei 2010',
  'Garut, 12 Jun 2010',
  'Garut, 28 Jul 2010',
  'Garut, 09 Agt 2010',
  'Garut, 21 Sep 2010',
  'Garut, 11 Okt 2010',
  'Garut, 25 Nov 2010',
  'Garut, 08 Des 2010',
]

const femaleStudentNames = new Set([
  'AFIQAH NUR FAUZIAH',
  'ANISA MAULIDA',
  'AZZAHRA PUTRI',
  'CITRA LESTARI',
  'DARA NUR AINI',
  'DEWI RAHAYU',
  'DINA AMALIA',
  'FATHIA NURHALIZA',
  'HANA SALSABILA',
  'INTAN PERMATA',
  'KAMILA AZZAHRA',
  'MELATI SAFITRI',
  'NABILA PUTRI',
  'RANIA KHAIRUNNISA',
  'SALMA NURJANAH',
  'ZAHRA AULIA',
])

const studentBaseScores = [
  85, 80, 89, 76, 92, 82, 70, 78, 86, 81, 77, 90, 79, 85, 74, 83, 89, 80,
  87, 75, 84, 91, 78, 88, 86, 79, 82, 90, 85, 77, 83, 89, 76, 87, 80, 92,
]

export function getPredicate(score) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 75) return 'C'
  return 'D'
}

export function getCompetencyDescription(subject, score) {
  const subjectLabel = typeof subject === 'string' ? subject : subject.label

  if (score >= 90) {
    return `Menunjukkan penguasaan sangat baik dalam memahami dan menerapkan materi ${subjectLabel}.`
  }

  if (score >= 80) {
    return `Menunjukkan penguasaan yang baik pada materi ${subjectLabel} dan mampu menerapkannya dengan tepat.`
  }

  if (score >= 75) {
    return `Cukup menguasai materi ${subjectLabel}, namun perlu meningkatkan ketelitian dalam penerapannya.`
  }

  return `Perlu bimbingan dan latihan lebih lanjut untuk meningkatkan penguasaan materi ${subjectLabel}.`
}

function createStudentScores(studentIndex) {
  const baseScore = studentBaseScores[studentIndex]

  return Object.fromEntries(
    raporSubjects.map((subject, subjectIndex) => {
      const variation = ((studentIndex * 2 + subjectIndex * 3) % 7) - 3
      const score = Math.max(68, Math.min(96, baseScore + variation))
      return [subject.key, score]
    }),
  )
}

function createAcademicResults(scores) {
  return raporSubjects.map((subject) => {
    const score = scores[subject.key]

    return {
      subjectKey: subject.key,
      code: subject.code,
      subject: subject.label,
      score,
      predicate: getPredicate(score),
      description: getCompetencyDescription(subject, score),
    }
  })
}

export const raporStudents = studentNames.map((name, index) => {
  const scores = createStudentScores(index)

  return {
    id: index + 1,
    nis: `252610${String(index + 1).padStart(3, '0')}`,
    nisn: `009386${String(4667 + index).padStart(4, '0')}`,
    name,
    gender: femaleStudentNames.has(name) ? 'Perempuan' : 'Laki-laki',
    birth: studentBirths[index],
    birthPlace: 'Garut',
    className: 'X Merdeka 3',
    academicYear: '2024/2025',
    semester: 'Genap',
    status: 'Belum Dibuat',
    createdAt: '-',
    createdBy: '-',
    scores,
    academicResults: createAcademicResults(scores),
    attitude: {
      spiritual: index % 5 === 0 ? 'Sangat Baik' : 'Baik',
      social: index % 7 === 0 ? 'Sangat Baik' : 'Baik',
    },
    extracurriculars: [
      {
        name: index % 3 === 0 ? 'Palang Merah Remaja' : index % 3 === 1 ? 'Futsal' : 'Pramuka',
        grade: index % 4 === 0 ? 'A' : 'B',
        description: 'Aktif mengikuti kegiatan dan menunjukkan tanggung jawab yang baik.',
      },
    ],
    attendance: {
      sick: index % 4,
      permitted: index % 3,
      absent: index % 9 === 0 ? 1 : 0,
    },
    homeroomNote:
      'Pertahankan semangat belajar, kedisiplinan, dan keaktifan dalam kegiatan sekolah.',
  }
})

function getScoreValues(scoresOrStudent) {
  const scores = scoresOrStudent?.scores ?? scoresOrStudent ?? {}
  return raporSubjects.map(({ key }) => Number(scores[key])).filter(Number.isFinite)
}

export function calculateStudentTotal(scoresOrStudent) {
  return getScoreValues(scoresOrStudent).reduce((total, score) => total + score, 0)
}

export function calculateStudentAverage(scoresOrStudent) {
  const values = getScoreValues(scoresOrStudent)
  if (values.length === 0) return 0
  return values.reduce((total, score) => total + score, 0) / values.length
}

export function getRankingStatus(average) {
  if (average >= 90) return 'Sangat Baik'
  if (average >= 80) return 'Baik'
  if (average >= 75) return 'Cukup'
  return 'Perlu Bimbingan'
}

export function buildStudentRanking(students = raporStudents) {
  return students
    .map((student) => {
      const totalScore = calculateStudentTotal(student)
      const averageScore = calculateStudentAverage(student)

      return {
        ...student,
        totalScore,
        averageScore,
        rankingStatus: getRankingStatus(averageScore),
      }
    })
    .sort((first, second) => second.averageScore - first.averageScore || first.name.localeCompare(second.name))
    .map((student, index) => ({ ...student, rank: index + 1 }))
}

export function formatRaporScore(score) {
  const numericScore = Number(score)
  if (!Number.isFinite(numericScore)) return '-'

  return numericScore.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const rankedStudents = buildStudentRanking()

export const legerDescriptionRows = raporStudents.map((student) => {
  const result = student.academicResults.find(({ subjectKey }) => subjectKey === 'matematika')

  return {
    id: student.id,
    nis: student.nis,
    name: student.name,
    subjectKey: result.subjectKey,
    subject: result.subject,
    score: result.score,
    description: result.description,
  }
})
