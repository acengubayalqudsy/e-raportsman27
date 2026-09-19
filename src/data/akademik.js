import {
  classes as masterClasses,
  masterStudents,
  masterTeachers,
  rooms as masterRooms,
  subjects as masterSubjects,
} from './masterData.js'

export const academicTabs = [
  {
    key: 'rombongan-belajar',
    label: 'Rombongan Belajar',
    shortLabel: 'Rombongan Belajar',
    icon: 'users',
    route: '/akademik/rombongan-belajar',
  },
  {
    key: 'penugasan-guru',
    label: 'Penugasan Guru Mengajar',
    shortLabel: 'Penugasan Guru',
    icon: 'book',
    route: '/akademik/penugasan-guru',
  },
  {
    key: 'penugasan-wali-kelas',
    label: 'Penugasan Wali Kelas',
    shortLabel: 'Wali Kelas',
    icon: 'user',
    route: '/akademik/penugasan-wali-kelas',
  },
  {
    key: 'jadwal-pelajaran',
    label: 'Jadwal Pelajaran',
    shortLabel: 'Jadwal Pelajaran',
    icon: 'calendar',
    route: '/akademik/jadwal-pelajaran',
  },
  {
    key: 'pembagian-ruangan',
    label: 'Pembagian Ruangan',
    shortLabel: 'Pembagian Ruangan',
    icon: 'screen',
    route: '/akademik/pembagian-ruangan',
  },
]

export const academicSummary = [
  {
    title: 'Total Kelas',
    value: '18',
    caption: 'Rombel Aktif',
    icon: 'calendar',
    tone: 'green',
  },
  {
    title: 'Total Mata Pelajaran',
    value: '24',
    caption: 'Mapel Aktif',
    icon: 'book',
    tone: 'blue',
  },
  {
    title: 'Total Guru',
    value: '87',
    caption: 'Guru Aktif',
    icon: 'users',
    tone: 'orange',
  },
  {
    title: 'Total Jam Pelajaran',
    value: '336',
    caption: 'Jam / Minggu',
    icon: 'clock',
    tone: 'purple',
  },
  {
    title: 'Jadwal Terpublikasi',
    value: '100%',
    caption: 'Sinkron dengan kelas',
    icon: 'checkCircle',
    tone: 'teal',
  },
]

const defaultAcademicYear = '2024/2025'
const defaultSemester = 'Genap'
const scheduleDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const prioritizedClassNames = [
  'X Merdeka 3',
  ...masterClasses.map(({ name }) => name).filter((name) => name !== 'X Merdeka 3'),
]

function shortTeacherName(name) {
  return name.replace(/,\s*.+$/, '')
}

function findTeacher(name) {
  return masterTeachers.find((teacher) => shortTeacherName(teacher.name) === name) ?? masterTeachers[0]
}

const additionalRoomLabels = ['Ruang 105', 'Lab. Komputer', 'Lab Fisika', 'Lab Kimia']
const roomLabels = Array.from(
  new Set([...masterRooms.map(({ name }) => name), ...additionalRoomLabels]),
)

export const academicOptions = {
  academicYears: [defaultAcademicYear, '2025/2026', '2023/2024'],
  semesters: [defaultSemester, 'Ganjil'],
  grades: ['X', 'XI', 'XII'],
  classes: prioritizedClassNames,
  days: ['Semua Hari', ...scheduleDays],
  teachers: masterTeachers.map(({ name }) => shortTeacherName(name)),
  subjects: masterSubjects.map(({ name }) => name),
  rooms: roomLabels,
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
  statuses: ['Aktif', 'Tidak Aktif'],
}

export const scheduleOptions = {
  classes: academicOptions.classes,
  grades: academicOptions.grades,
  semesters: academicOptions.semesters,
  days: academicOptions.days,
}

const classStudentTargets = {
  'X Merdeka 1': 34,
  'X Merdeka 2': 35,
  'X Merdeka 3': 25,
}

function getStudentTarget(className, classIndex) {
  return classStudentTargets[className] ?? 34 + (classIndex % 3)
}

export const rombelStudents = prioritizedClassNames.flatMap((className) => {
  const classIndex = masterClasses.findIndex(({ name }) => name === className)
  const students = masterStudents
    .filter((student) => student.className === className && student.status === 'Aktif')
    .slice(0, getStudentTarget(className, classIndex))

  return students.map((student, index) => ({
    id: student.id,
    membershipId:
      'ROM-' + className.replace(/\s+/g, '-').toUpperCase() + '-' + String(index + 1).padStart(3, '0'),
    studentId: student.id,
    nis: student.nis,
    nisn: student.nisn,
    name: student.name,
    gender: student.gender,
    genderCode: student.genderCode,
    status: 'Aktif',
    className,
    academicYear: defaultAcademicYear,
    semester: defaultSemester,
  }))
})

export const rombelGroups = masterClasses.map((classItem, index) => ({
  id: classItem.id,
  code: classItem.code,
  className: classItem.name,
  grade: classItem.grade,
  academicYear: defaultAcademicYear,
  semester: defaultSemester,
  studentCount: rombelStudents.filter(({ className }) => className === classItem.name).length,
  capacity: classItem.capacity,
  status: 'Aktif',
  order: index + 1,
}))

const featuredTeacherAssignments = [
  { teacher: 'Budi Santoso', subject: 'Matematika', className: 'X Merdeka 3', weeklyHours: 4 },
  {
    teacher: 'Rina Marlina',
    subject: 'Bahasa Indonesia',
    className: 'X Merdeka 3',
    weeklyHours: 4,
  },
  { teacher: 'Deden Kurnia', subject: 'Fisika', className: 'X Merdeka 3', weeklyHours: 3 },
]

export const teacherAssignments = Array.from({ length: 48 }, (_, index) => {
  const featured = featuredTeacherAssignments[index]
  const teacherRecord = featured ? findTeacher(featured.teacher) : masterTeachers[index % 32]
  const subjectRecord = masterSubjects[index % masterSubjects.length]
  const teacher = featured?.teacher ?? shortTeacherName(teacherRecord.name)
  const subject = featured?.subject ?? subjectRecord.name
  const className = featured?.className ?? masterClasses[index % 12].name
  const weeklyHours = featured?.weeklyHours ?? subjectRecord.weeklyHours

  return {
    id: index + 1,
    teacherId: teacherRecord.id,
    teacher,
    teacherFullName: teacherRecord.name,
    nip: teacherRecord.nip,
    subject,
    className,
    academicYear: defaultAcademicYear,
    semester: defaultSemester,
    weeklyHours,
    hoursLabel: weeklyHours + ' JP',
    status: 'Aktif',
  }
})

export const teacherAssignmentSummary = [
  { title: 'Total Penugasan', value: '48', caption: 'Penugasan Aktif', icon: 'clipboardCheck', tone: 'green' },
  { title: 'Guru Ditugaskan', value: '32', caption: 'Guru Pengampu', icon: 'users', tone: 'blue' },
  { title: 'Mata Pelajaran', value: '18', caption: 'Mapel Terjadwal', icon: 'book', tone: 'orange' },
  { title: 'Rombel Aktif', value: '12', caption: 'Kelas Terlayani', icon: 'academic', tone: 'purple' },
]

const featuredHomeroomAssignments = [
  { className: 'X Merdeka 1', teacher: 'Deden Kurnia', studentCount: 34 },
  { className: 'X Merdeka 2', teacher: 'Siti Nurhaliza', studentCount: 35 },
  { className: 'X Merdeka 3', teacher: 'Rina Marlina', studentCount: 25 },
]

export const homeroomAssignments = masterClasses.map((classItem, index) => {
  const featured = featuredHomeroomAssignments[index]
  const teacherRecord = featured ? findTeacher(featured.teacher) : masterTeachers[index + 3]
  const studentCount =
    featured?.studentCount ??
    rombelStudents.filter(({ className }) => className === classItem.name).length

  return {
    id: index + 1,
    classId: classItem.id,
    className: classItem.name,
    grade: classItem.grade,
    teacherId: teacherRecord.id,
    teacher: featured?.teacher ?? shortTeacherName(teacherRecord.name),
    teacherFullName: teacherRecord.name,
    nip: teacherRecord.nip,
    studentCount,
    academicYear: defaultAcademicYear,
    status: 'Aktif',
  }
})

const scheduleGrid = [
  {
    period: '1',
    time: '07:00 - 07:45',
    entries: [
      ['Matematika', 'Budi Santoso', 'Ruang 201'],
      ['Bahasa Indonesia', 'Rina Marlina', 'Ruang 202'],
      ['Fisika', 'Deden Kurnia', 'Lab Fisika'],
      ['Matematika', 'Budi Santoso', 'Ruang 201'],
      ['Bahasa Inggris', 'Asep Hidayat', 'Ruang 203'],
      ['PJOK', 'Rudi Hermawan', 'Lapangan'],
    ],
  },
  {
    period: '2',
    time: '07:45 - 08:30',
    entries: [
      ['Matematika', 'Budi Santoso', 'Ruang 201'],
      ['Bahasa Indonesia', 'Rina Marlina', 'Ruang 202'],
      ['Fisika', 'Deden Kurnia', 'Lab Fisika'],
      ['Matematika', 'Budi Santoso', 'Ruang 201'],
      ['Bahasa Inggris', 'Asep Hidayat', 'Ruang 203'],
      ['PJOK', 'Rudi Hermawan', 'Lapangan'],
    ],
  },
  {
    period: '3',
    time: '08:45 - 09:30',
    entries: [
      ['Sejarah', 'Yayan Setiawan', 'Ruang 201'],
      ['Biologi', 'Siti Nurhaliza', 'Lab Biologi'],
      ['Kimia', 'Dwi Lestari', 'Lab Kimia'],
      ['PPKn', 'Rina Marlina', 'Ruang 202'],
      ['Informatika', 'Agus Setiawan', 'Lab. Komputer'],
      ['Seni Budaya', 'Lia Aprilia', 'Ruang Seni'],
    ],
  },
  {
    period: '4',
    time: '09:30 - 10:15',
    entries: [
      ['Sejarah', 'Yayan Setiawan', 'Ruang 201'],
      ['Biologi', 'Siti Nurhaliza', 'Lab Biologi'],
      ['Kimia', 'Dwi Lestari', 'Lab Kimia'],
      ['PPKn', 'Rina Marlina', 'Ruang 202'],
      ['Informatika', 'Agus Setiawan', 'Lab. Komputer'],
      ['Seni Budaya', 'Lia Aprilia', 'Ruang Seni'],
    ],
  },
  {
    period: 'Istirahat',
    time: '10:15 - 10:30',
    isBreak: true,
  },
  {
    period: '5',
    time: '10:30 - 11:15',
    entries: [
      ['Ekonomi', 'Yeyen Rostini', 'Ruang 201'],
      ['Bahasa Sunda', 'Ayi Sulastri', 'Ruang 202'],
      ['Geografi', 'Tatang Sutisna', 'Ruang 203'],
      ['Bahasa Indonesia', 'Rina Marlina', 'Ruang 202'],
      ['Matematika', 'Budi Santoso', 'Ruang 201'],
      ['Prakarya', 'Dina Mulyani', 'Ruang Karya'],
    ],
  },
  {
    period: '6',
    time: '11:15 - 12:00',
    entries: [
      ['Ekonomi', 'Yeyen Rostini', 'Ruang 201'],
      ['Bahasa Sunda', 'Ayi Sulastri', 'Ruang 202'],
      ['Geografi', 'Tatang Sutisna', 'Ruang 203'],
      ['Bahasa Indonesia', 'Rina Marlina', 'Ruang 202'],
      ['Matematika', 'Budi Santoso', 'Ruang 201'],
      ['Prakarya', 'Dina Mulyani', 'Ruang Karya'],
    ],
  },
  {
    period: '7',
    time: '12:45 - 13:30',
    entries: [
      ['PABP', 'Asep Hidayat', 'Ruang 201'],
      ['Kimia', 'Dwi Lestari', 'Lab Kimia'],
      ['Sosiologi', 'Tatang Sutisna', 'Ruang 203'],
      ['Bahasa Inggris', 'Asep Hidayat', 'Ruang 202'],
      ['Kewirausahaan', 'Nina Karlina', 'Ruang 105'],
      ['BK', 'Nina Karlina', 'Ruang BK'],
    ],
  },
  {
    period: '8',
    time: '13:30 - 14:15',
    entries: [
      ['PABP', 'Asep Hidayat', 'Ruang 201'],
      ['Kimia', 'Dwi Lestari', 'Lab Kimia'],
      ['Sosiologi', 'Tatang Sutisna', 'Ruang 203'],
      ['Bahasa Inggris', 'Asep Hidayat', 'Ruang 202'],
      ['Kewirausahaan', 'Nina Karlina', 'Ruang 105'],
      ['BK', 'Nina Karlina', 'Ruang BK'],
    ],
  },
]

function createScheduleSlot(entry, row, day, rowIndex, dayIndex) {
  if (!entry) {
    return {
      id: 'schedule-break-' + day.toLowerCase(),
      type: 'break',
      subject: 'Istirahat',
      teacher: '',
      room: '',
      className: 'X Merdeka 3',
      day,
      time: row.time,
    }
  }

  return {
    id: 'schedule-' + (rowIndex + 1) + '-' + (dayIndex + 1),
    type: 'lesson',
    subject: entry[0],
    teacher: entry[1],
    room: entry[2],
    className: 'X Merdeka 3',
    day,
    time: row.time,
  }
}

export const weeklySchedule = {
  className: 'X Merdeka 3',
  academicYear: defaultAcademicYear,
  semester: defaultSemester,
  days: scheduleDays,
  rows: scheduleGrid.map((row, rowIndex) => ({
    id: row.isBreak ? 'period-break' : 'period-' + row.period,
    period: row.period,
    time: row.time,
    isBreak: Boolean(row.isBreak),
    slots: Object.fromEntries(
      scheduleDays.map((day, dayIndex) => [
        day,
        createScheduleSlot(row.entries?.[dayIndex], row, day, rowIndex, dayIndex),
      ]),
    ),
  })),
}

export const todaySchedule = [
  {
    id: 1,
    time: '07:00 - 07:45',
    subject: 'Bahasa Inggris',
    className: 'X Merdeka 3',
    teacher: 'Asep Hidayat',
    room: 'Ruang 203',
    type: 'lesson',
  },
  {
    id: 2,
    time: '07:45 - 08:30',
    subject: 'Bahasa Inggris',
    className: 'X Merdeka 3',
    teacher: 'Asep Hidayat',
    room: 'Ruang 203',
    type: 'lesson',
  },
  {
    id: 3,
    time: '08:45 - 09:30',
    subject: 'Informatika',
    className: 'X Merdeka 3',
    teacher: 'Agus Setiawan',
    room: 'Lab. Komputer',
    type: 'lesson',
  },
  {
    id: 4,
    time: '09:30 - 10:15',
    subject: 'Informatika',
    className: 'X Merdeka 3',
    teacher: 'Agus Setiawan',
    room: 'Lab. Komputer',
    type: 'lesson',
  },
  {
    id: 5,
    time: '10:15 - 10:30',
    subject: 'Istirahat',
    className: '',
    teacher: '',
    room: 'Istirahat',
    type: 'break',
  },
  {
    id: 6,
    time: '10:30 - 11:15',
    subject: 'Matematika',
    className: 'X Merdeka 3',
    teacher: 'Budi Santoso',
    room: 'Ruang 201',
    type: 'lesson',
  },
  {
    id: 7,
    time: '11:15 - 12:00',
    subject: 'Matematika',
    className: 'X Merdeka 3',
    teacher: 'Budi Santoso',
    room: 'Ruang 201',
    type: 'lesson',
  },
  {
    id: 8,
    time: '12:45 - 13:30',
    subject: 'Kewirausahaan',
    className: 'X Merdeka 3',
    teacher: 'Nina Karlina',
    room: 'Ruang 105',
    type: 'lesson',
  },
  {
    id: 9,
    time: '13:30 - 14:15',
    subject: 'Kewirausahaan',
    className: 'X Merdeka 3',
    teacher: 'Nina Karlina',
    room: 'Ruang 105',
    type: 'lesson',
  },
]

export const todayScheduleMeta = {
  day: 'Jumat',
  date: '2025-05-09',
  dateLabel: 'Jumat, 9 Mei 2025',
}

export const academicAnnouncements = [
  {
    id: 1,
    title: 'Perubahan Jadwal Ujian Sekolah',
    description: 'Ujian sekolah akan dimulai pada 19 Mei 2025',
    dateDay: '7',
    dateMonth: 'Mei',
  },
  {
    id: 2,
    title: 'Libur Hari Raya Idul Adha',
    description: 'Libur sekolah 16 - 18 Juni 2025',
    dateDay: '5',
    dateMonth: 'Mei',
  },
  {
    id: 3,
    title: 'Pembagian Rapor Semester Genap',
    description: 'Rapor akan dibagikan pada 20 Juni 2025',
    dateDay: '2',
    dateMonth: 'Mei',
  },
]

const featuredRoomAssignments = [
  {
    day: 'Senin',
    time: '07:00 - 07:45',
    className: 'X Merdeka 3',
    subject: 'Matematika',
    teacher: 'Budi Santoso',
    room: 'Ruang 201',
    status: 'Aktif',
  },
  {
    day: 'Senin',
    time: '08:45 - 09:30',
    className: 'X Merdeka 2',
    subject: 'Fisika',
    teacher: 'Deden Kurnia',
    room: 'Lab Fisika',
    status: 'Aktif',
  },
  {
    day: 'Senin',
    time: '07:00 - 07:45',
    className: 'X Merdeka 2',
    subject: 'Bahasa Indonesia',
    teacher: 'Rina Marlina',
    room: 'Ruang 201',
    status: 'Bentrok',
    conflict: true,
    conflictMessage: 'Ruang 201 sudah digunakan oleh X Merdeka 3 pada jam yang sama.',
  },
]

const generatedRoomAssignments = Array.from({ length: 29 }, (_, index) => {
  const sourceRow = weeklySchedule.rows.filter(({ isBreak }) => !isBreak)[index % 8]
  const day = scheduleDays[(index + 1) % scheduleDays.length]
  const sourceSlot = sourceRow.slots[day]
  const room = masterRooms[(index + 1) % masterRooms.length]

  return {
    id: index + featuredRoomAssignments.length + 1,
    day,
    time: sourceRow.time,
    className: prioritizedClassNames[(index + 3) % prioritizedClassNames.length],
    subject: sourceSlot.subject,
    teacher: sourceSlot.teacher,
    room: room.name,
    roomId: room.id,
    academicYear: defaultAcademicYear,
    semester: defaultSemester,
    status: index % 17 === 16 ? 'Tidak Aktif' : 'Aktif',
    conflict: false,
    conflictMessage: '',
  }
})

export const roomAssignments = [
  ...featuredRoomAssignments.map((assignment, index) => ({
    id: index + 1,
    ...assignment,
    academicYear: defaultAcademicYear,
    semester: defaultSemester,
    conflict: Boolean(assignment.conflict),
    conflictMessage: assignment.conflictMessage ?? '',
  })),
  ...generatedRoomAssignments,
]

export function findRoomConflict(candidate, assignments = roomAssignments) {
  return assignments.find(
    (assignment) =>
      assignment.id !== candidate.id &&
      assignment.status !== 'Tidak Aktif' &&
      assignment.day === candidate.day &&
      assignment.time === candidate.time &&
      assignment.room === candidate.room,
  )
}
