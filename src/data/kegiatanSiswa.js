import { rombelStudents } from './akademik.js'
import { masterExtracurriculars, masterStudents } from './masterData.js'

const defaultAcademicYear = '2024/2025'
const defaultSemester = 'Genap'
const defaultClassName = 'X Merdeka 3'

const activitySupervisorOverrides = {
  Pramuka: 'Dina Mulyani, S.Pd.',
  Paskibra: 'Nina Karlina, S.Pd.',
  PMR: 'Siti Nurhaliza, S.Pd.',
  Futsal: 'Agus Setiawan, S.Pd.',
  Basket: 'Rudi Hermawan, S.Pd.',
  Voli: 'Neni Herawati, S.Pd.',
  Karate: 'Yusuf Maulana, S.Pd.',
  'Seni Musik': 'Lilis Suryani, S.Pd.',
  'Seni Tari': 'Lia Aprilia, S.Pd.',
  Rohis: 'Mahmud, S.Ag.',
  Informatika: 'Agus Setiawan, S.Pd.',
}

export const activityTabs = [
  {
    key: 'keikutsertaan-ekstrakurikuler',
    label: 'Keikutsertaan Ekstrakurikuler',
    shortLabel: 'Keikutsertaan Ekskul',
    icon: 'users',
    route: '/kegiatan-siswa/keikutsertaan-ekstrakurikuler',
  },
  {
    key: 'nilai-ekstrakurikuler',
    label: 'Nilai Ekstrakurikuler',
    shortLabel: 'Nilai Ekskul',
    icon: 'award',
    route: '/kegiatan-siswa/nilai-ekstrakurikuler',
  },
  {
    key: 'catatan-kokurikuler',
    label: 'Catatan Kokurikuler',
    shortLabel: 'Kokurikuler',
    icon: 'clipboardCheck',
    route: '/kegiatan-siswa/catatan-kokurikuler',
  },
  {
    key: 'catatan-wali-kelas',
    label: 'Catatan Wali Kelas',
    shortLabel: 'Catatan Wali',
    icon: 'clipboard',
    route: '/kegiatan-siswa/catatan-wali-kelas',
  },
]

const additionalExtracurriculars = [
  ['Rohis', 'Mahmud, S.Ag.', 86],
  ['Informatika', 'Agus Setiawan, S.Pd.', 64],
  ['Karya Ilmiah Remaja', 'Dwi Lestari, S.Pd.', 31],
  ['English Club', 'Asep Hidayat, S.Pd.', 42],
  ['Jurnalistik', 'Yayan Setiawan, S.Pd.', 27],
  ['Teater', 'Lia Aprilia, S.Pd.', 29],
  ['Paduan Suara', 'Lilis Suryani, S.Pd.', 36],
  ['Fotografi', 'Tateng Sutisna, S.Pd.', 24],
  ['Pecinta Alam', 'Rudi Hermawan, S.Pd.', 33],
  ['Badminton', 'Nina Karlina, S.Pd.', 38],
  ['Tenis Meja', 'Budi Santoso, M.Pd.', 22],
  ['Renang', 'Neni Herawati, S.Pd.', 25],
  ['Taekwondo', 'Yusuf Maulana, S.Pd.', 28],
  ['Pencak Silat', 'Dina Mulyani, S.Pd.', 34],
  ['Robotika', 'Agus Setiawan, S.Pd.', 26],
  ['Desain Grafis', 'Dwi Lestari, S.Pd.', 30],
  ['Bahasa Jepang', 'Rina Marlina, S.Pd.', 21],
  ['Bahasa Arab', 'Mahmud, S.Ag.', 35],
  ['Literasi', 'Siti Nurhaliza, S.Pd.', 40],
].map(([name, supervisor, members], index) => ({
  id: masterExtracurriculars.length + index + 1,
  code: `EKS-${String(masterExtracurriculars.length + index + 1).padStart(2, '0')}`,
  name,
  supervisor,
  members,
  status: 'Aktif',
}))

export const activityExtracurriculars = [
  ...masterExtracurriculars.map((extracurricular) => {
    const name = extracurricular.name === 'Palang Merah Remaja' ? 'PMR' : extracurricular.name

    return {
      ...extracurricular,
      masterName: extracurricular.name,
      name,
      supervisor: activitySupervisorOverrides[name] ?? extracurricular.supervisor,
    }
  }),
  ...additionalExtracurriculars,
]

const activityClassStudents = rombelStudents
  .filter((student) => student.className === defaultClassName && student.status === 'Aktif')
  .slice(0, 25)
  .map((student) => ({
    ...student,
    studentName: student.name,
  }))

const activeStudents = masterStudents.filter((student) => student.status === 'Aktif')
const activityStudentPool = [
  ...activityClassStudents,
  ...activeStudents.filter((student) => student.className !== defaultClassName),
]

const featuredExtracurriculars = [
  'Pramuka',
  'Futsal',
  'Paskibra',
  'Rohis',
  'Basket',
  'PMR',
  'Seni Tari',
  'Informatika',
]

function getExtracurricular(name, index) {
  if (activityExtracurriculars.length === 0) {
    return {
      id: 0,
      code: 'EKS-00',
      name: 'Belum Ditentukan',
      supervisor: '-',
      members: 0,
      status: 'Tidak Aktif',
    }
  }

  return (
    activityExtracurriculars.find((extracurricular) => extracurricular.name === name) ??
    activityExtracurriculars[index % activityExtracurriculars.length]
  )
}

function makeParticipation(student, extracurricular, index) {
  const yearJoined = index === 3 || (index > 7 && index % 17 === 0) ? '2023' : '2024'
  const status = index === 3 ? 'Alumni' : index > 7 && index % 29 === 0 ? 'Tidak Aktif' : 'Aktif'

  return {
    id: index + 1,
    participationId: `KSE-${String(index + 1).padStart(3, '0')}`,
    studentId: student.studentId ?? student.id,
    nis: student.nis,
    nisn: student.nisn,
    name: student.name,
    studentName: student.name,
    avatar: student.avatar,
    className: student.className,
    extracurricularId: extracurricular.id,
    extracurricular: extracurricular.name,
    extracurricularName: extracurricular.name,
    supervisor: extracurricular.supervisor,
    academicYear: defaultAcademicYear,
    semester: defaultSemester,
    yearJoined,
    joinYear: yearJoined,
    status,
    createdAt: `${yearJoined}-07-15`,
  }
}

export const participations = Array.from({ length: 842 }, (_, index) => {
  const poolIndex = index > 25 ? index - 1 : index
  const student =
    (index === 25 ? activityClassStudents[0] : undefined) ??
    activityStudentPool[poolIndex % activityStudentPool.length] ??
    activeStudents[index % activeStudents.length] ??
    masterStudents[index % masterStudents.length]
  const extracurricularName =
    index < featuredExtracurriculars.length
      ? featuredExtracurriculars[index]
      : index === 25
        ? 'Futsal'
        : activityExtracurriculars[(index * 5 + 2) % activityExtracurriculars.length].name

  return makeParticipation(student, getExtracurricular(extracurricularName, index), index)
})

const scoreComments = {
  A: 'Sangat aktif dalam kegiatan {activity} dan menunjukkan sikap disiplin serta kerja sama yang baik.',
  B: 'Aktif mengikuti kegiatan {activity} dan mampu bekerja sama dengan baik dalam setiap kegiatan.',
  C: 'Cukup mengikuti kegiatan {activity}; perlu meningkatkan konsistensi kehadiran dan partisipasi.',
  D: 'Perlu pendampingan untuk meningkatkan kehadiran dan keterlibatan pada kegiatan {activity}.',
}

function getScoreDescription(predicate, extracurricular) {
  return scoreComments[predicate].replace('{activity}', extracurricular)
}

export const scores = participations.map((participation, index) => {
  const isScored = index < 720
  const predicate = isScored ? ['A', 'B', 'A', 'B', 'A', 'B', 'C'][index % 7] : ''
  const description = isScored ? getScoreDescription(predicate, participation.extracurricular) : ''

  return {
    id: index + 1,
    scoreId: `NE-${String(index + 1).padStart(3, '0')}`,
    participationId: participation.id,
    studentId: participation.studentId,
    nis: participation.nis,
    nisn: participation.nisn,
    name: participation.name,
    studentName: participation.name,
    className: participation.className,
    extracurricular: participation.extracurricular,
    extracurricularName: participation.extracurricular,
    supervisor: participation.supervisor,
    academicYear: participation.academicYear,
    semester: participation.semester,
    predicate,
    predikat: predicate,
    description,
    keterangan: description,
    status: isScored ? 'Sudah Dinilai' : 'Belum Dinilai',
    isDirty: false,
  }
})

const cocurricularExamples = [
  'Menunjukkan kemampuan bekerja sama yang baik dalam kegiatan proyek dan aktif memberikan kontribusi dalam kelompok.',
  'Aktif berpartisipasi pada kegiatan penguatan profil pelajar Pancasila dan bertanggung jawab terhadap tugasnya.',
  'Memiliki inisiatif yang baik saat kegiatan kolaboratif serta mampu menyampaikan pendapat dengan santun.',
  'Menunjukkan sikap disiplin dan kepedulian yang baik selama kegiatan kokurikuler berlangsung.',
]

const homeroomExamples = [
  'Pertahankan semangat belajar dan terus tingkatkan kedisiplinan serta keaktifan dalam kegiatan sekolah.',
  'Menunjukkan perkembangan yang baik. Tetap jaga konsistensi belajar dan tanggung jawab terhadap tugas.',
  'Memiliki potensi yang baik. Diharapkan lebih percaya diri dan aktif dalam kegiatan kelas.',
  'Terus tingkatkan ketelitian, kehadiran, dan kerja sama agar perkembangan belajar semakin optimal.',
]

function makeStudentNote(student, index, type) {
  const isFilled = type === 'cocurricular' ? index % 3 !== 1 : index % 3 !== 1
  const examples = type === 'cocurricular' ? cocurricularExamples : homeroomExamples
  const note = isFilled ? examples[index % examples.length] : ''

  return {
    id: `${type === 'cocurricular' ? 'KOK' : 'WK'}-${String(index + 1).padStart(3, '0')}`,
    studentId: student.studentId ?? student.id,
    nis: student.nis,
    nisn: student.nisn,
    name: student.name,
    studentName: student.name,
    avatar: student.avatar,
    className: student.className,
    academicYear: defaultAcademicYear,
    semester: defaultSemester,
    note,
    catatan: note,
    description: note,
    status: isFilled ? 'Terisi' : 'Belum Terisi',
    isDirty: false,
  }
}

export const cocurricularNotes = activityClassStudents.map((student, index) =>
  makeStudentNote(student, index, 'cocurricular'),
)

export const homeroomNotes = activityClassStudents.map((student, index) =>
  makeStudentNote(student, index, 'homeroom'),
)

export const homeroomContext = {
  className: defaultClassName,
  waliKelas: 'Rina Marlina',
  homeroomTeacher: 'Rina Marlina',
  homeroomTeacherFullName: 'Rina Marlina, S.Pd.',
  teacher: 'Rina Marlina',
  academicYear: defaultAcademicYear,
  semester: defaultSemester,
  studentCount: activityClassStudents.length,
}

export const activityOptions = {
  academicYears: [defaultAcademicYear, '2025/2026', '2023/2024'],
  semesters: [defaultSemester, 'Ganjil'],
  classes: [
    defaultClassName,
    ...Array.from(new Set(activeStudents.map((student) => student.className))).filter(
      (className) => className !== defaultClassName,
    ),
  ],
  extracurriculars: activityExtracurriculars.map((extracurricular) => extracurricular.name),
  extracurricularOptions: activityExtracurriculars.map(({ id, code, name, supervisor }) => ({
    value: name,
    label: name,
    id,
    code,
    supervisor,
  })),
  participationStatuses: ['Aktif', 'Tidak Aktif', 'Alumni'],
  participationStatusFilters: ['Semua Status', 'Aktif', 'Tidak Aktif', 'Alumni'],
  scoreStatuses: ['Semua Status', 'Sudah Dinilai', 'Belum Dinilai'],
  noteStatuses: ['Terisi', 'Belum Terisi'],
  noteStatusFilters: ['Semua Status', 'Terisi', 'Belum Terisi'],
  predicates: ['A', 'B', 'C', 'D'],
  rowsPerPageOptions: [8, 16, 24],
  students: activeStudents.map((student) => ({
    id: student.id,
    studentId: student.id,
    nis: student.nis,
    name: student.name,
    studentName: student.name,
    className: student.className,
  })),
  classStudents: activityClassStudents,
}

export const activitySummary = [
  {
    title: 'Keikutsertaan Ekskul',
    value: '842',
    caption: 'Siswa aktif',
    icon: 'users',
    tone: 'green',
  },
  {
    title: 'Ekskul Aktif',
    value: '28',
    caption: 'Kegiatan',
    icon: 'award',
    tone: 'blue',
  },
  {
    title: 'Sudah Dinilai',
    value: '720',
    caption: '85,51%',
    icon: 'checkCircle',
    tone: 'purple',
  },
  {
    title: 'Belum Dinilai',
    value: '122',
    caption: 'Perlu dilengkapi',
    icon: 'clock',
    tone: 'orange',
  },
]

export const activitySummaryByTab = {
  'keikutsertaan-ekstrakurikuler': activitySummary,
  'nilai-ekstrakurikuler': [
    activitySummary[0],
    activitySummary[1],
    activitySummary[2],
    activitySummary[3],
  ],
  'catatan-kokurikuler': [
    {
      title: 'Total Siswa',
      value: String(cocurricularNotes.length),
      caption: defaultClassName,
      icon: 'users',
      tone: 'green',
    },
    {
      title: 'Catatan Terisi',
      value: String(cocurricularNotes.filter((note) => note.status === 'Terisi').length),
      caption: 'Sudah dicatat',
      icon: 'checkCircle',
      tone: 'blue',
    },
    {
      title: 'Belum Terisi',
      value: String(cocurricularNotes.filter((note) => note.status === 'Belum Terisi').length),
      caption: 'Perlu dilengkapi',
      icon: 'clock',
      tone: 'orange',
    },
    {
      title: 'Semester Aktif',
      value: defaultSemester,
      caption: defaultAcademicYear,
      icon: 'calendar',
      tone: 'purple',
    },
  ],
  'catatan-wali-kelas': [
    {
      title: 'Siswa Rombel',
      value: String(homeroomContext.studentCount),
      caption: defaultClassName,
      icon: 'users',
      tone: 'green',
    },
    {
      title: 'Catatan Terisi',
      value: String(homeroomNotes.filter((note) => note.status === 'Terisi').length),
      caption: 'Sudah dicatat',
      icon: 'checkCircle',
      tone: 'blue',
    },
    {
      title: 'Belum Terisi',
      value: String(homeroomNotes.filter((note) => note.status === 'Belum Terisi').length),
      caption: 'Perlu dilengkapi',
      icon: 'clock',
      tone: 'orange',
    },
    {
      title: 'Wali Kelas',
      value: 'Rina',
      caption: 'Rina Marlina',
      icon: 'user',
      tone: 'purple',
    },
  ],
}

export const activityStudents = activityClassStudents
export const extracurricularParticipations = participations
export const extracurricularScores = scores
