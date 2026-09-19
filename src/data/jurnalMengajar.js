import {
  academicYears as masterAcademicYears,
  classes as masterClasses,
  masterTeachers,
  semesters as masterSemesters,
  subjects as masterSubjects,
} from './masterData.js'
import {
  todaySchedule as academicTodaySchedule,
  todayScheduleMeta as academicTodayScheduleMeta,
} from './akademik.js'

const DEFAULT_ACADEMIC_YEAR = '2024/2025'
const DEFAULT_SEMESTER = 'Genap'
const DEFAULT_CLASS = 'X Merdeka 3'
const DEFAULT_SUBJECT = 'Matematika'
const DEFAULT_TEACHER = 'Budi Santoso'
const DEFAULT_MONTH = 'Mei 2025'
const DEFAULT_STUDENT_TOTAL = 25

const monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function withoutAcademicTitle(name = '') {
  return name.replace(/,\s*.+$/, '').trim()
}

function prioritize(list, preferredValue) {
  return [preferredValue, ...list.filter((value) => value !== preferredValue)]
}

function unique(list) {
  return Array.from(new Set(list.filter(Boolean)))
}

export const journalTabs = [
  {
    key: 'jurnal',
    label: 'Jurnal Mengajar',
    shortLabel: 'Jurnal',
    icon: 'journal',
    route: '/jurnal-mengajar/jurnal',
  },
  {
    key: 'materi',
    label: 'Materi Pembelajaran',
    shortLabel: 'Materi',
    icon: 'book',
    route: '/jurnal-mengajar/materi',
  },
  {
    key: 'aktivitas-kelas',
    label: 'Aktivitas Kelas',
    shortLabel: 'Aktivitas Kelas',
    icon: 'users',
    route: '/jurnal-mengajar/aktivitas-kelas',
  },
  {
    key: 'catatan',
    label: 'Catatan Mengajar',
    shortLabel: 'Catatan',
    icon: 'clipboard',
    route: '/jurnal-mengajar/catatan',
  },
]

const teacherNames = unique([
  ...masterTeachers.map(({ name }) => withoutAcademicTitle(name)),
  ...academicTodaySchedule.map(({ teacher }) => teacher),
])

export const journalOptions = {
  academicYears: prioritize(
    masterAcademicYears.map(({ name }) => name),
    DEFAULT_ACADEMIC_YEAR,
  ),
  semesters: prioritize(
    unique(masterSemesters.map(({ name }) => name)),
    DEFAULT_SEMESTER,
  ),
  classes: prioritize(
    masterClasses.map(({ name }) => name),
    DEFAULT_CLASS,
  ),
  subjects: prioritize(
    masterSubjects.map(({ name }) => name),
    DEFAULT_SUBJECT,
  ),
  teachers: prioritize(teacherNames, DEFAULT_TEACHER),
  months: [
    DEFAULT_MONTH,
    'April 2025',
    'Maret 2025',
    'Februari 2025',
    'Januari 2025',
    'Desember 2024',
    'November 2024',
    'Oktober 2024',
    'September 2024',
    'Agustus 2024',
    'Juli 2024',
  ],
  methods: [
    'Ceramah',
    'Diskusi',
    'Tanya Jawab',
    'Demonstrasi',
    'Praktikum',
    'Presentasi',
    'Penugasan',
    'Evaluasi',
  ],
  media: [
    'PPT',
    'LKS',
    'Papan Tulis',
    'Whiteboard',
    'Video Pembelajaran',
    'Buku Paket',
    'Alat Peraga',
    'Lembar Soal',
  ],
  statuses: ['Semua Status', 'Lengkap', 'Belum Lengkap', 'Perlu Diperiksa'],
  activityTypes: [
    'Semua Aktivitas',
    'Apersepsi',
    'Ceramah',
    'Diskusi',
    'Latihan Soal',
    'Presentasi',
    'Praktikum',
    'Tanya Jawab',
    'Penugasan',
    'Review Materi',
    'Evaluasi',
  ],
  noteCategories: [
    'Perkembangan Kelas',
    'Kendala Pembelajaran',
    'Materi Perlu Diulang',
    'Perhatian Siswa',
    'Evaluasi Metode',
    'Rencana Pertemuan',
  ],
  timeSlots: [
    '07:00 - 07:45',
    '07:45 - 08:30',
    '08:45 - 09:30',
    '09:30 - 10:15',
    '10:30 - 11:15',
    '11:15 - 12:00',
    '12:45 - 13:30',
    '13:30 - 14:15',
  ],
}

const journalStatusMeta = {
  Lengkap: { label: 'Lengkap', tone: 'green', color: '#079669' },
  'Belum Lengkap': { label: 'Belum Lengkap', tone: 'orange', color: '#f59e0b' },
  'Perlu Diperiksa': {
    label: 'Perlu Diperiksa',
    tone: 'blue',
    color: '#2b8de5',
  },
}

export function getJournalStatusMeta(status) {
  return (
    journalStatusMeta[status] ?? {
      label: status || 'Belum Lengkap',
      tone: 'gray',
      color: '#7b879c',
    }
  )
}

export function formatJournalDate(dateValue) {
  if (!dateValue) return '-'

  const [year, month, day] = String(dateValue).split('-').map(Number)

  if (!year || !month || !day) return String(dateValue)

  return `${day} ${monthNames[month - 1]} ${year}`
}

export function formatJournalMonth(dateValue, fallback = DEFAULT_MONTH) {
  const [year, month] = String(dateValue ?? '').split('-').map(Number)
  if (!year || !month || month < 1 || month > 12) return fallback
  return `${monthNames[month - 1]} ${year}`
}

export function calculateJournalAttendance(present, total = DEFAULT_STUDENT_TOTAL) {
  const safePresent = Math.max(0, Number(present) || 0)
  const safeTotal = Math.max(0, Number(total) || 0)
  const percentage = safeTotal ? Number(((safePresent / safeTotal) * 100).toFixed(2)) : 0

  return {
    present: safePresent,
    total: safeTotal,
    label: `${safePresent}/${safeTotal}`,
    percentage,
    percentageLabel: `${percentage.toFixed(2).replace('.', ',')}%`,
  }
}

export const journalSummary = [
  {
    key: 'total',
    title: 'Total Jurnal',
    value: '1.248',
    numericValue: 1248,
    caption: 'Pertemuan',
    icon: 'journal',
    tone: 'green',
  },
  {
    key: 'complete',
    title: 'Jurnal Lengkap',
    value: '1.102',
    numericValue: 1102,
    caption: '88,30%',
    icon: 'book',
    tone: 'blue',
  },
  {
    key: 'incomplete',
    title: 'Perlu Dilengkapi',
    value: '146',
    numericValue: 146,
    caption: '11,70%',
    icon: 'clock',
    tone: 'orange',
  },
  {
    key: 'today',
    title: 'Pertemuan Hari Ini',
    value: '18',
    numericValue: 18,
    caption: 'Jadwal',
    icon: 'calendar',
    tone: 'purple',
  },
  {
    key: 'teachers',
    title: 'Guru Aktif Mengajar',
    value: '87',
    numericValue: 87,
    caption: 'Guru',
    icon: 'academic',
    tone: 'teal',
  },
]

const journalSeeds = [
  {
    date: '2025-05-02',
    time: '07:00 - 07:45',
    material: 'Bilangan Berpangkat',
    chapter: 'Bab 1',
    activities: ['Apersepsi', 'Penjelasan konsep bilangan berpangkat', 'Contoh soal'],
    method: 'Ceramah',
    media: 'PPT',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-05',
    time: '07:00 - 07:45',
    material: 'Bilangan Berpangkat (Lanjutan)',
    chapter: 'Bab 1',
    activities: ['Latihan soal', 'Pembahasan latihan'],
    method: 'Diskusi',
    media: 'LKS',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-07',
    time: '07:00 - 07:45',
    material: 'Notasi Ilmiah',
    chapter: 'Bab 1',
    activities: ['Penjelasan notasi ilmiah', 'Contoh konversi', 'Latihan'],
    method: 'Ceramah',
    media: 'PPT',
    present: 23,
    status: 'Lengkap',
  },
  {
    date: '2025-05-09',
    time: '07:00 - 07:45',
    material: 'Notasi Ilmiah (Lanjutan)',
    chapter: 'Bab 1',
    activities: ['Latihan soal', 'Pembahasan'],
    method: 'Diskusi',
    media: 'LKS',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-12',
    time: '07:00 - 07:45',
    material: 'Akar Pangkat',
    chapter: 'Bab 2',
    activities: ['Pengertian akar pangkat', 'Sifat akar pangkat', 'Contoh soal'],
    method: 'Ceramah',
    media: 'PPT',
    present: 21,
    status: 'Belum Lengkap',
  },
  {
    date: '2025-05-14',
    time: '07:00 - 07:45',
    material: 'Operasi Bentuk Akar',
    chapter: 'Bab 2',
    activities: ['Penjumlahan dan pengurangan akar', 'Perkalian dan pembagian akar'],
    method: 'Diskusi',
    media: 'LKS',
    present: 22,
    status: 'Belum Lengkap',
  },
  {
    date: '2025-05-16',
    time: '07:00 - 07:45',
    material: 'Soal Cerita Bentuk Akar',
    chapter: 'Bab 2',
    activities: ['Latihan soal cerita', 'Pembahasan'],
    method: 'Diskusi',
    media: 'Whiteboard',
    present: 22,
    status: 'Perlu Diperiksa',
  },
  {
    date: '2025-05-19',
    time: '07:00 - 07:45',
    material: 'Persiapan Ulangan Harian 1',
    chapter: 'Review',
    activities: ['Review materi Bab 1 - 2', 'Latihan soal ulangan'],
    method: 'Diskusi',
    media: 'LKS',
    present: 23,
    status: 'Perlu Diperiksa',
  },
  {
    date: '2025-05-21',
    time: '07:00 - 07:45',
    material: 'Ulangan Harian Bab 1 - 2',
    chapter: 'Evaluasi 1',
    activities: ['Penjelasan aturan ulangan', 'Pelaksanaan evaluasi'],
    method: 'Evaluasi',
    media: 'Lembar Soal',
    present: 23,
    status: 'Lengkap',
  },
  {
    date: '2025-05-23',
    time: '07:00 - 07:45',
    material: 'Persamaan Linear Satu Variabel',
    chapter: 'Bab 3',
    activities: ['Apersepsi', 'Pengenalan bentuk persamaan', 'Contoh soal'],
    method: 'Ceramah',
    media: 'PPT',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-26',
    time: '07:00 - 07:45',
    material: 'Operasi Persamaan Linear',
    chapter: 'Bab 3',
    activities: ['Demonstrasi penyelesaian', 'Latihan terbimbing'],
    method: 'Demonstrasi',
    media: 'Papan Tulis',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-28',
    time: '07:00 - 07:45',
    material: 'Penerapan Persamaan Linear',
    chapter: 'Bab 3',
    activities: ['Diskusi masalah kontekstual', 'Presentasi hasil kelompok'],
    method: 'Diskusi',
    media: 'LKS',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-30',
    time: '07:00 - 07:45',
    material: 'Pertidaksamaan Linear',
    chapter: 'Bab 3',
    activities: ['Penjelasan konsep pertidaksamaan', 'Tanya jawab'],
    method: 'Tanya Jawab',
    media: 'PPT',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-02',
    time: '07:45 - 08:30',
    material: 'Sifat-sifat Bilangan Berpangkat',
    chapter: 'Bab 1',
    activities: ['Tanya jawab', 'Latihan individu'],
    method: 'Tanya Jawab',
    media: 'Buku Paket',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-05',
    time: '07:45 - 08:30',
    material: 'Penerapan Bilangan Berpangkat',
    chapter: 'Bab 1',
    activities: ['Diskusi kelompok', 'Presentasi penyelesaian'],
    method: 'Presentasi',
    media: 'Papan Tulis',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-07',
    time: '07:45 - 08:30',
    material: 'Konversi Notasi Ilmiah',
    chapter: 'Bab 1',
    activities: ['Demonstrasi konversi', 'Latihan berpasangan'],
    method: 'Demonstrasi',
    media: 'PPT',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-09',
    time: '07:45 - 08:30',
    material: 'Penerapan Notasi Ilmiah',
    chapter: 'Bab 1',
    activities: ['Studi kasus', 'Pembahasan kelompok'],
    method: 'Diskusi',
    media: 'LKS',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-12',
    time: '07:45 - 08:30',
    material: 'Penyederhanaan Bentuk Akar',
    chapter: 'Bab 2',
    activities: ['Penjelasan langkah', 'Latihan terbimbing'],
    method: 'Ceramah',
    media: 'Papan Tulis',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-14',
    time: '07:45 - 08:30',
    material: 'Merasionalkan Penyebut',
    chapter: 'Bab 2',
    activities: ['Contoh bertahap', 'Latihan individu'],
    method: 'Demonstrasi',
    media: 'LKS',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-16',
    time: '07:45 - 08:30',
    material: 'Proyek Mini Bentuk Akar',
    chapter: 'Bab 2',
    activities: ['Penugasan kelompok', 'Presentasi singkat'],
    method: 'Penugasan',
    media: 'Alat Peraga',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-19',
    time: '07:45 - 08:30',
    material: 'Pengayaan Bab 1 - 2',
    chapter: 'Review',
    activities: ['Kuis cepat', 'Pembahasan soal pengayaan'],
    method: 'Tanya Jawab',
    media: 'PPT',
    present: 22,
    status: 'Lengkap',
  },
  {
    date: '2025-05-21',
    time: '07:45 - 08:30',
    material: 'Pembahasan Ulangan Harian',
    chapter: 'Evaluasi 1',
    activities: ['Analisis jawaban', 'Pembahasan kesalahan umum'],
    method: 'Diskusi',
    media: 'Lembar Soal',
    present: 22,
    status: 'Belum Lengkap',
  },
  {
    date: '2025-05-23',
    time: '07:45 - 08:30',
    material: 'Model Matematika Persamaan Linear',
    chapter: 'Bab 3',
    activities: ['Menyusun model matematika', 'Latihan kelompok'],
    method: 'Diskusi',
    media: 'LKS',
    present: 22,
    status: 'Belum Lengkap',
  },
  {
    date: '2025-05-26',
    time: '07:45 - 08:30',
    material: 'Latihan Persamaan dan Pertidaksamaan',
    chapter: 'Bab 3',
    activities: ['Latihan mandiri', 'Umpan balik hasil latihan'],
    method: 'Penugasan',
    media: 'Buku Paket',
    present: 22,
    status: 'Belum Lengkap',
  },
]

const defaultNotes = [
  'Pembelajaran berjalan baik dan siswa aktif merespons pertanyaan.',
  'Sebagian siswa memerlukan contoh tambahan sebelum latihan mandiri.',
  'Siswa mampu mengubah bilangan ke bentuk notasi ilmiah.',
  'Perlu penguatan kembali pada operasi pangkat negatif.',
  'Beberapa siswa masih kesulitan memahami hubungan pangkat dan akar.',
  'Waktu pembahasan perlu ditambah pada pertemuan berikutnya.',
  'Soal cerita membantu siswa menghubungkan konsep dengan konteks nyata.',
  'Kesiapan siswa menghadapi ulangan sudah cukup baik.',
]

const defaultFollowUps = [
  'Berikan latihan pengayaan pada awal pertemuan berikutnya.',
  'Ulangi satu contoh dasar sebelum melanjutkan materi.',
  'Lanjutkan dengan latihan konversi yang lebih bervariasi.',
  'Siapkan ringkasan sifat-sifat bilangan berpangkat.',
  'Gunakan alat peraga sederhana untuk memperjelas konsep.',
  'Sediakan sesi tanya jawab tambahan.',
  'Berikan latihan bertingkat sesuai kemampuan siswa.',
  'Lakukan review singkat sebelum ulangan dimulai.',
]

export const teachingJournals = journalSeeds.map((seed, index) => {
  const attendance = calculateJournalAttendance(seed.present, DEFAULT_STUDENT_TOTAL)
  const statusMeta = getJournalStatusMeta(seed.status)
  const meetingNumber = index + 1

  return {
    id: `JRN-202505-${String(meetingNumber).padStart(3, '0')}`,
    number: meetingNumber,
    academicYear: DEFAULT_ACADEMIC_YEAR,
    semester: DEFAULT_SEMESTER,
    month: DEFAULT_MONTH,
    date: seed.date,
    dateLabel: formatJournalDate(seed.date),
    time: seed.time,
    timeSlot: seed.time,
    meeting: meetingNumber,
    meetingNumber,
    className: DEFAULT_CLASS,
    subject: DEFAULT_SUBJECT,
    teacher: DEFAULT_TEACHER,
    room: 'Ruang 201',
    material: seed.material,
    materialTitle: seed.material,
    chapter: seed.chapter,
    activities: seed.activities,
    activityText: seed.activities.join(', '),
    activityPreview: seed.activities.slice(0, 3),
    method: seed.method,
    media: seed.media,
    attendance,
    present: attendance.present,
    totalStudents: attendance.total,
    attendanceLabel: attendance.label,
    attendancePercentage: attendance.percentage,
    attendancePercentageLabel: attendance.percentageLabel,
    status: statusMeta.label,
    statusTone: statusMeta.tone,
    notes: defaultNotes[index % defaultNotes.length],
    followUp: defaultFollowUps[index % defaultFollowUps.length],
    createdAt: `${seed.date}T${seed.time.slice(0, 5)}:00`,
    updatedAt: `${seed.date}T15:20:00`,
  }
})

const materialSeeds = [
  ['Bilangan Berpangkat', 'Bab 1', '1 - 2', 'Selesai', 100],
  ['Notasi Ilmiah', 'Bab 1', '3 - 4', 'Selesai', 100],
  ['Bentuk Akar', 'Bab 2', '5 - 7', 'Berjalan', 72],
  ['Persamaan Linear Satu Variabel', 'Bab 3', '8 - 10', 'Selesai', 100],
  ['Pertidaksamaan Linear', 'Bab 3', '11 - 12', 'Selesai', 100],
  ['Sistem Persamaan Linear', 'Bab 4', '13 - 15', 'Selesai', 100],
  ['Relasi dan Fungsi', 'Bab 5', '16 - 18', 'Selesai', 100],
  ['Fungsi Linear', 'Bab 5', '19 - 20', 'Selesai', 100],
  ['Barisan Aritmetika', 'Bab 6', '21 - 22', 'Belum Dimulai', 0],
  ['Barisan Geometri', 'Bab 6', '23 - 24', 'Belum Dimulai', 0],
  ['Statistika Dasar', 'Bab 7', '25 - 27', 'Belum Dimulai', 0],
  ['Peluang Sederhana', 'Bab 8', '28 - 30', 'Belum Dimulai', 0],
]

export const learningMaterials = materialSeeds.map(
  ([title, chapter, meetingRange, status, progress], index) => ({
    id: `MTR-MTK-${String(index + 1).padStart(2, '0')}`,
    number: index + 1,
    academicYear: DEFAULT_ACADEMIC_YEAR,
    semester: DEFAULT_SEMESTER,
    className: DEFAULT_CLASS,
    subject: DEFAULT_SUBJECT,
    teacher: DEFAULT_TEACHER,
    title,
    material: title,
    chapter,
    meetingRange,
    status,
    progress,
    progressLabel: `${progress}%`,
    journalCount: teachingJournals.filter(({ material }) => material.includes(title.split(' ')[0]))
      .length,
    description: `Materi ${title} untuk ${DEFAULT_CLASS}.`,
  }),
)

export const materialProgressSummary = {
  subject: DEFAULT_SUBJECT,
  className: DEFAULT_CLASS,
  teacher: DEFAULT_TEACHER,
  totalMaterials: learningMaterials.length,
  completed: learningMaterials.filter(({ status }) => status === 'Selesai').length,
  inProgress: learningMaterials.filter(({ status }) => status === 'Berjalan').length,
  notStarted: learningMaterials.filter(({ status }) => status === 'Belum Dimulai').length,
  progress: 58,
  progressLabel: '58%',
}

const activityTypeFromMethod = {
  Ceramah: 'Ceramah',
  Diskusi: 'Diskusi',
  'Tanya Jawab': 'Tanya Jawab',
  Demonstrasi: 'Latihan Soal',
  Praktikum: 'Praktikum',
  Presentasi: 'Presentasi',
  Penugasan: 'Penugasan',
  Evaluasi: 'Evaluasi',
}

export const classActivities = teachingJournals.map((journal, index) => ({
  id: `AKT-202505-${String(index + 1).padStart(3, '0')}`,
  number: index + 1,
  journalId: journal.id,
  academicYear: journal.academicYear,
  semester: journal.semester,
  month: journal.month,
  date: journal.date,
  dateLabel: journal.dateLabel,
  time: journal.time,
  meeting: journal.meeting,
  className: journal.className,
  subject: journal.subject,
  teacher: journal.teacher,
  material: journal.material,
  activity: journal.activities[0],
  activityTitle: journal.activities[0],
  activityDetails: journal.activities,
  activityType: activityTypeFromMethod[journal.method] ?? 'Aktivitas Pembelajaran',
  method: journal.method,
  media: journal.media,
  participation: index % 5 === 0 ? 'Aktif' : 'Sangat Aktif',
  status: index < 20 ? 'Selesai' : 'Perlu Tindak Lanjut',
}))

export const classActivitySummary = [
  { label: 'Diskusi', value: 32, tone: 'green' },
  { label: 'Latihan', value: 28, tone: 'blue' },
  { label: 'Ceramah', value: 25, tone: 'purple' },
  { label: 'Presentasi', value: 14, tone: 'orange' },
  { label: 'Praktikum', value: 9, tone: 'teal' },
  { label: 'Evaluasi', value: 8, tone: 'red' },
]

const noteSeeds = [
  {
    journalIndex: 3,
    category: 'Materi Perlu Diulang',
    note: 'Sebagian siswa masih mengalami kesulitan memahami notasi ilmiah.',
    followUp: 'Mengulang contoh soal dan memberikan latihan tambahan.',
  },
  {
    journalIndex: 4,
    category: 'Kendala Pembelajaran',
    note: 'Hubungan antara bentuk pangkat dan bentuk akar belum dipahami seluruh siswa.',
    followUp: 'Gunakan diagram konsep dan contoh numerik sederhana.',
  },
  {
    journalIndex: 5,
    category: 'Rencana Pertemuan',
    note: 'Pembahasan operasi bentuk akar membutuhkan alokasi waktu tambahan.',
    followUp: 'Lanjutkan pembahasan pada awal pertemuan berikutnya.',
  },
  {
    journalIndex: 6,
    category: 'Perkembangan Kelas',
    note: 'Diskusi kelompok meningkatkan keberanian siswa menjelaskan jawaban.',
    followUp: 'Pertahankan pembagian kelompok kecil pada latihan berikutnya.',
  },
  {
    journalIndex: 7,
    category: 'Evaluasi Metode',
    note: 'Review melalui kuis cepat membantu menemukan konsep yang masih lemah.',
    followUp: 'Siapkan lima soal diagnostik sebelum ulangan.',
  },
  {
    journalIndex: 8,
    category: 'Perhatian Siswa',
    note: 'Tiga siswa memerlukan waktu tambahan untuk menyelesaikan evaluasi.',
    followUp: 'Berikan pendampingan dan latihan remedial.',
  },
  {
    journalIndex: 9,
    category: 'Perkembangan Kelas',
    note: 'Siswa mampu mengenali bentuk dasar persamaan linear.',
    followUp: 'Lanjutkan ke operasi persamaan secara bertahap.',
  },
  {
    journalIndex: 10,
    category: 'Evaluasi Metode',
    note: 'Demonstrasi penyelesaian di papan tulis mudah diikuti siswa.',
    followUp: 'Libatkan siswa untuk mempresentasikan langkah penyelesaian.',
  },
  {
    journalIndex: 11,
    category: 'Perkembangan Kelas',
    note: 'Kelompok dapat menyusun model matematika dari masalah kontekstual.',
    followUp: 'Tambahkan variasi masalah pada lembar kerja.',
  },
  {
    journalIndex: 12,
    category: 'Rencana Pertemuan',
    note: 'Pertidaksamaan linear akan dilanjutkan dengan latihan garis bilangan.',
    followUp: 'Siapkan media garis bilangan untuk pertemuan berikutnya.',
  },
  {
    journalIndex: 20,
    category: 'Materi Perlu Diulang',
    note: 'Kesalahan umum masih ditemukan pada langkah merasionalkan penyebut.',
    followUp: 'Berikan contoh pembanding sebelum latihan mandiri.',
  },
  {
    journalIndex: 23,
    category: 'Kendala Pembelajaran',
    note: 'Waktu latihan persamaan dan pertidaksamaan belum mencukupi.',
    followUp: 'Lanjutkan latihan sebagai tugas terstruktur.',
  },
]

export const teachingNotes = noteSeeds.map((seed, index) => {
  const journal = teachingJournals[seed.journalIndex]

  return {
    id: `CTT-202505-${String(index + 1).padStart(3, '0')}`,
    number: index + 1,
    journalId: journal.id,
    academicYear: journal.academicYear,
    semester: journal.semester,
    month: journal.month,
    date: journal.date,
    dateLabel: journal.dateLabel,
    time: journal.time,
    meeting: journal.meeting,
    teacher: journal.teacher,
    className: journal.className,
    subject: journal.subject,
    material: journal.material,
    category: seed.category,
    note: seed.note,
    excerpt: seed.note.length > 72 ? `${seed.note.slice(0, 72)}...` : seed.note,
    followUp: seed.followUp,
    status: index < 9 ? 'Ditindaklanjuti' : 'Perlu Tindak Lanjut',
  }
})

export const todayTeachingScheduleMeta = { ...academicTodayScheduleMeta }

const scheduleBlueprint = [
  { subject: DEFAULT_SUBJECT, className: DEFAULT_CLASS, time: '07:00 - 07:45' },
  { subject: DEFAULT_SUBJECT, className: DEFAULT_CLASS, time: '07:45 - 08:30' },
  { subject: 'Informatika', className: 'X Merdeka 4', time: '09:30 - 10:15' },
]

const journalScheduleSource = scheduleBlueprint.map((blueprint) => {
  const academicSource = academicTodaySchedule.find(({ type, subject }) => (
    type !== 'break' && subject === blueprint.subject
  ))

  return { ...academicSource, ...blueprint }
})

export const todayTeachingSchedule = journalScheduleSource
  .map((schedule, index) => {
    const existingJournal = teachingJournals.find((journal) => (
      journal.date === todayTeachingScheduleMeta.date
      && journal.time === schedule.time
      && journal.className === schedule.className
      && journal.subject === schedule.subject
      && journal.teacher === schedule.teacher
    ))

    return {
      ...schedule,
      id: `JAD-JRN-${String(index + 1).padStart(3, '0')}`,
      period: index + 1,
      date: todayTeachingScheduleMeta.date,
      dateLabel: todayTeachingScheduleMeta.dateLabel,
      hasJournal: Boolean(existingJournal),
      journalId: existingJournal?.id ?? null,
    }
  })

export const monthlyJournalSummary = {
  title: 'Ringkasan Bulan Ini',
  month: DEFAULT_MONTH,
  totalMeetings: 24,
  journalFilled: 20,
  notRecorded: 4,
  complete: 16,
  incomplete: 6,
  needsReview: 2,
  averageAttendance: 88.34,
  averageAttendanceLabel: '88,34%',
  items: [
    { key: 'meetings', label: 'Total Pertemuan', value: '24', icon: 'calendar', tone: 'blue' },
    { key: 'filled', label: 'Jurnal Terisi', value: '20', icon: 'journal', tone: 'green' },
    { key: 'unrecorded', label: 'Belum Dicatat', value: '4', icon: 'clock', tone: 'orange' },
    {
      key: 'attendance',
      label: 'Rata-rata Kehadiran',
      value: '88,34%',
      icon: 'users',
      tone: 'teal',
    },
  ],
}

export const recentJournalActivity = [
  {
    id: 1,
    type: 'updated',
    title: 'Jurnal ke-4 diperbarui',
    description: 'Matematika - X Merdeka 3',
    subject: 'Matematika',
    className: 'X Merdeka 3',
    teacher: 'Budi Santoso',
    timestamp: 'Hari ini, 10:30',
    icon: 'journal',
    tone: 'blue',
  },
  {
    id: 2,
    type: 'created',
    title: 'Jurnal ke-3 ditambahkan',
    description: 'Informatika - X Merdeka 4',
    subject: 'Informatika',
    className: 'X Merdeka 4',
    teacher: 'Agus Setiawan',
    timestamp: 'Hari ini, 09:15',
    icon: 'plus',
    tone: 'green',
  },
  {
    id: 3,
    type: 'note-updated',
    title: 'Catatan mengajar diperbarui',
    description: 'Matematika - X Merdeka 3',
    subject: 'Matematika',
    className: 'X Merdeka 3',
    teacher: 'Budi Santoso',
    timestamp: 'Kemarin, 15:20',
    icon: 'edit',
    tone: 'purple',
  },
]

export const journalInitialForm = {
  date: '2025-05-09',
  academicYear: DEFAULT_ACADEMIC_YEAR,
  semester: DEFAULT_SEMESTER,
  className: DEFAULT_CLASS,
  subject: DEFAULT_SUBJECT,
  teacher: DEFAULT_TEACHER,
  time: '07:00 - 07:45',
  meeting: 4,
  material: '',
  activities: '',
  method: 'Diskusi',
  media: 'PPT',
  present: 22,
  totalStudents: DEFAULT_STUDENT_TOTAL,
  notes: '',
  followUp: '',
  status: 'Belum Lengkap',
}

export const journalRequiredFields = [
  'date',
  'className',
  'subject',
  'teacher',
  'time',
  'meeting',
  'material',
  'activities',
]

const journalFieldLabels = {
  date: 'Tanggal',
  className: 'Kelas',
  subject: 'Mata pelajaran',
  teacher: 'Guru',
  time: 'Jam pelajaran',
  meeting: 'Pertemuan',
  material: 'Materi pembelajaran',
  activities: 'Kegiatan pembelajaran',
}

export function validateJournalForm(values = {}) {
  const errors = {}

  journalRequiredFields.forEach((field) => {
    const value = values[field]

    if (value === undefined || value === null || String(value).trim() === '') {
      errors[field] = `${journalFieldLabels[field]} wajib diisi.`
    }
  })

  const present = Number(values.present)
  const totalStudents = Number(values.totalStudents)

  if (Number.isFinite(present) && Number.isFinite(totalStudents) && present > totalStudents) {
    errors.present = 'Jumlah siswa hadir tidak boleh melebihi total siswa.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

function normalizeActivities(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)

  return String(value || '')
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function createJournalRecord(values = {}, id = `JRN-LOCAL-${Date.now()}`) {
  const attendance = calculateJournalAttendance(values.present, values.totalStudents)
  const activities = normalizeActivities(values.activities)
  const status = values.status || 'Lengkap'
  const statusMeta = getJournalStatusMeta(status)

  return {
    id,
    academicYear: values.academicYear || DEFAULT_ACADEMIC_YEAR,
    semester: values.semester || DEFAULT_SEMESTER,
    month: formatJournalMonth(values.date, values.month || DEFAULT_MONTH),
    date: values.date,
    dateLabel: formatJournalDate(values.date),
    time: values.time,
    timeSlot: values.time,
    meeting: Number(values.meeting),
    meetingNumber: Number(values.meeting),
    className: values.className,
    subject: values.subject,
    teacher: values.teacher,
    room: values.room || 'Ruang 201',
    material: String(values.material || '').trim(),
    materialTitle: String(values.material || '').trim(),
    chapter: values.chapter || '-',
    activities,
    activityText: activities.join(', '),
    activityPreview: activities.slice(0, 3),
    method: values.method || 'Ceramah',
    media: values.media || 'Papan Tulis',
    attendance,
    present: attendance.present,
    totalStudents: attendance.total,
    attendanceLabel: attendance.label,
    attendancePercentage: attendance.percentage,
    attendancePercentageLabel: attendance.percentageLabel,
    status: statusMeta.label,
    statusTone: statusMeta.tone,
    notes: String(values.notes || '').trim(),
    followUp: String(values.followUp || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
