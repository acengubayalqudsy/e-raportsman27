import {
  academicYears as masterAcademicYears,
  classes as masterClasses,
  masterTeachers,
  semesters as masterSemesters,
  subjects as masterSubjects,
} from './masterData.js'
import {
  homeroomAssignments,
  rombelStudents,
  teacherAssignments,
} from './akademik.js'

export const attendanceTabs = [
  {
    key: 'rekap',
    label: 'Rekap Absensi',
    shortLabel: 'Rekap Absensi',
    icon: 'clipboardCheck',
    route: '/absensi/rekap',
  },
  {
    key: 'per-siswa',
    label: 'Absensi Per Siswa',
    shortLabel: 'Per Siswa',
    icon: 'user',
    route: '/absensi/per-siswa',
  },
  {
    key: 'per-kelas',
    label: 'Rekap Per Kelas',
    shortLabel: 'Per Kelas',
    icon: 'users',
    route: '/absensi/per-kelas',
  },
  {
    key: 'per-mapel',
    label: 'Rekap Per Mata Pelajaran',
    shortLabel: 'Per Mapel',
    icon: 'book',
    route: '/absensi/per-mapel',
  },
]

const defaultClassName = 'X Merdeka 3'
const defaultAcademicYear = '2024/2025'
const defaultSemester = 'Genap'
const defaultMonth = 'Mei 2025'

const attendanceStatusMeta = {
  Hadir: { code: 'H', label: 'Hadir', tone: 'green', color: '#079669' },
  Sakit: { code: 'S', label: 'Sakit', tone: 'orange', color: '#f59e0b' },
  Izin: { code: 'I', label: 'Izin', tone: 'blue', color: '#2b8de5' },
  'Tanpa Keterangan': {
    code: 'A',
    label: 'Tanpa Keterangan',
    tone: 'red',
    color: '#ef4753',
  },
}

const categoryDefinitions = [
  { label: 'Sangat Baik', tone: 'green', range: '≥ 90%' },
  { label: 'Baik', tone: 'blue', range: '80% - 89%' },
  { label: 'Cukup', tone: 'orange', range: '70% - 79%' },
  { label: 'Perlu Perhatian', tone: 'red', range: '< 70%' },
]

function percentageLabel(value) {
  return `${Number(value).toFixed(2).replace('.', ',')}%`
}

export function calculateAttendancePercentage(present, total) {
  const safePresent = Number(present) || 0
  const safeTotal = Number(total) || 0

  if (safeTotal <= 0) return 0

  return Number(((safePresent / safeTotal) * 100).toFixed(2))
}

export function getAttendanceCategory(percentage) {
  const value = Number(percentage) || 0

  if (value >= 90) return { ...categoryDefinitions[0] }
  if (value >= 80) return { ...categoryDefinitions[1] }
  if (value >= 70) return { ...categoryDefinitions[2] }
  return { ...categoryDefinitions[3] }
}

export function getStatusMeta(status) {
  const normalizedStatus =
    Object.values(attendanceStatusMeta).find(
      ({ code, label }) => code === status || label === status,
    )?.label ?? status

  return (
    attendanceStatusMeta[normalizedStatus] ?? {
      code: '-',
      label: normalizedStatus || 'Belum Dicatat',
      tone: 'gray',
      color: '#7b879c',
    }
  )
}

const prioritizedClasses = [
  defaultClassName,
  ...masterClasses.map(({ name }) => name).filter((name) => name !== defaultClassName),
]

const teacherNames = Array.from(
  new Set([
    ...teacherAssignments.map(({ teacher }) => teacher),
    ...masterTeachers.map(({ name }) => name.replace(/,\s*.+$/, '')),
  ]),
)

export const attendanceOptions = {
  classes: prioritizedClasses,
  classFilters: ['Semua Kelas', ...prioritizedClasses],
  academicYears: [
    defaultAcademicYear,
    ...masterAcademicYears
      .map(({ name }) => name)
      .filter((name) => name !== defaultAcademicYear),
  ],
  semesters: [
    defaultSemester,
    ...Array.from(new Set(masterSemesters.map(({ name }) => name))).filter(
      (name) => name !== defaultSemester,
    ),
  ],
  months: ['Mei 2025', 'April 2025', 'Maret 2025', 'Februari 2025', 'Januari 2025'],
  subjects: masterSubjects.map(({ name }) => name),
  teachers: teacherNames,
  periods: [
    'Mei 2025',
    'April 2025',
    'Maret 2025',
    'Semester Genap 2024/2025',
  ],
  statuses: Object.values(attendanceStatusMeta).map(({ label }) => label),
  statusFilters: [
    'Semua Status',
    ...Object.values(attendanceStatusMeta).map(({ label }) => label),
  ],
  grades: ['X', 'XI', 'XII'],
}

export const attendanceSummary = [
  {
    key: 'students',
    title: 'Total Siswa',
    value: '25',
    numericValue: 25,
    caption: defaultClassName,
    icon: 'clipboardCheck',
    tone: 'green',
  },
  {
    key: 'attendance',
    title: 'Persentase Kehadiran',
    value: '93,64%',
    numericValue: 93.64,
    caption: '2,15% vs bulan lalu',
    icon: 'users',
    tone: 'blue',
    trend: 'up',
  },
  {
    key: 'present',
    title: 'Hadir',
    value: '432',
    numericValue: 432,
    caption: '88,34%',
    icon: 'checkCircle',
    tone: 'orange',
  },
  {
    key: 'sick',
    title: 'Sakit',
    value: '28',
    numericValue: 28,
    caption: '5,73%',
    icon: 'shield',
    tone: 'purple',
  },
  {
    key: 'permission',
    title: 'Izin',
    value: '21',
    numericValue: 21,
    caption: '4,29%',
    icon: 'document',
    tone: 'red',
  },
  {
    key: 'absent',
    title: 'Tanpa Keterangan',
    value: '8',
    numericValue: 8,
    caption: '1,64%',
    icon: 'info',
    tone: 'gray',
  },
]

const classStudents = rombelStudents
  .filter(
    ({ className, academicYear, semester }) =>
      className === defaultClassName &&
      academicYear === defaultAcademicYear &&
      semester === defaultSemester,
  )
  .slice(0, 25)

const featuredAttendance = [
  { present: 20, sick: 1, permission: 1, absent: 0, total: 22, percentage: 95.65 },
  { present: 19, sick: 1, permission: 2, absent: 0, total: 22, percentage: 91.3 },
  { present: 18, sick: 2, permission: 1, absent: 1, total: 22, percentage: 86.96 },
  { present: 21, sick: 0, permission: 1, absent: 0, total: 22, percentage: 95.65 },
  { present: 17, sick: 2, permission: 2, absent: 1, total: 22, percentage: 82.61 },
  { present: 20, sick: 1, permission: 1, absent: 0, total: 22, percentage: 95.65 },
  { present: 18, sick: 1, permission: 2, absent: 1, total: 22, percentage: 86.96 },
  { present: 16, sick: 2, permission: 2, absent: 2, total: 22, percentage: 73.91 },
]

const generatedPresent = [17, 17, 18, 18, 17, 17, 18, 16, 17, 17, 16, 18, 17, 16, 15, 14, 15]
const generatedSick = [1, 1, 1, 0, 1, 1, 0, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1]
const generatedPermission = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0]
const generatedAbsent = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0]

// The sequence intentionally reproduces the category distribution in the visual reference:
// 15 sangat baik, 6 baik, 2 cukup, and 2 perlu perhatian.
const generatedPercentages = [
  94.12,
  92.86,
  96.0,
  97.14,
  93.33,
  90.48,
  95.24,
  91.67,
  94.74,
  90.0,
  92.31,
  88.89,
  85.71,
  83.33,
  78.26,
  68.18,
  65.22,
]

export const attendanceRecapRows = classStudents.map((student, index) => {
  const generatedIndex = index - featuredAttendance.length
  const counts =
    featuredAttendance[index] ?? {
      present: generatedPresent[generatedIndex],
      sick: generatedSick[generatedIndex],
      permission: generatedPermission[generatedIndex],
      absent: generatedAbsent[generatedIndex],
      total:
        generatedPresent[generatedIndex] +
        generatedSick[generatedIndex] +
        generatedPermission[generatedIndex] +
        generatedAbsent[generatedIndex],
      percentage: generatedPercentages[generatedIndex],
    }
  const category = getAttendanceCategory(counts.percentage)

  return {
    id: index + 1,
    studentId: student.studentId,
    nis: student.nis,
    name: student.name,
    className: student.className,
    academicYear: student.academicYear,
    semester: student.semester,
    month: defaultMonth,
    present: counts.present,
    sick: counts.sick,
    permission: counts.permission,
    absent: counts.absent,
    total: counts.total,
    percentage: counts.percentage,
    percentageLabel: percentageLabel(counts.percentage),
    category: category.label,
    categoryTone: category.tone,
  }
})

export const attendanceCategories = [
  {
    key: 'excellent',
    label: 'Sangat Baik',
    range: '≥ 90%',
    count: 15,
    percentage: 60,
    percentageLabel: '60,00%',
    tone: 'green',
    color: '#079669',
  },
  {
    key: 'good',
    label: 'Baik',
    range: '80% - 89%',
    count: 6,
    percentage: 24,
    percentageLabel: '24,00%',
    tone: 'blue',
    color: '#2b8de5',
  },
  {
    key: 'fair',
    label: 'Cukup',
    range: '70% - 79%',
    count: 2,
    percentage: 8,
    percentageLabel: '8,00%',
    tone: 'orange',
    color: '#f59e0b',
  },
  {
    key: 'attention',
    label: 'Perlu Perhatian',
    range: '< 70%',
    count: 2,
    percentage: 8,
    percentageLabel: '8,00%',
    tone: 'red',
    color: '#ef4753',
  },
]

export const attendanceMonthInfo = {
  month: defaultMonth,
  schoolDays: 23,
  schoolDaysLabel: '23 hari',
  averageAttendance: 93.64,
  averageAttendanceLabel: '93,64%',
  averageTrend: 2.15,
  averageTrendLabel: '2,15%',
  highestAttendance: 98,
  highestAttendanceLabel: '98,00%',
  lowestAttendance: 68.18,
  lowestAttendanceLabel: '68,18%',
}

export const attendanceDistribution = [
  { key: 'present', label: 'Hadir', value: 432, percentage: 88.34, percentageLabel: '88,34%', color: '#079669' },
  { key: 'sick', label: 'Sakit', value: 28, percentage: 5.73, percentageLabel: '5,73%', color: '#f59e0b' },
  { key: 'permission', label: 'Izin', value: 21, percentage: 4.29, percentageLabel: '4,29%', color: '#2b8de5' },
  { key: 'absent', label: 'Tanpa Keterangan', value: 8, percentage: 1.64, percentageLabel: '1,64%', color: '#ef4753' },
]

const homeroom =
  homeroomAssignments.find(({ className }) => className === defaultClassName) ??
  homeroomAssignments[0]

export const classAttendanceContext = {
  className: defaultClassName,
  grade: 'X',
  studentCount: 25,
  studentCountLabel: '25 siswa',
  homeroom: homeroom.teacher,
  homeroomFullName: homeroom.teacherFullName,
  homeroomNip: homeroom.nip,
  academicYear: defaultAcademicYear,
  semester: defaultSemester,
  month: defaultMonth,
}

export const attendanceClassContext = classAttendanceContext
export const homeroomAttendanceContext = classAttendanceContext

const historyDates = [
  { date: '2025-05-02', dateLabel: '2 Mei 2025', day: 'Jumat', subject: 'Matematika' },
  { date: '2025-05-05', dateLabel: '5 Mei 2025', day: 'Senin', subject: 'Semua Pelajaran' },
  { date: '2025-05-06', dateLabel: '6 Mei 2025', day: 'Selasa', subject: 'Semua Pelajaran' },
  { date: '2025-05-07', dateLabel: '7 Mei 2025', day: 'Rabu', subject: 'Fisika' },
  { date: '2025-05-08', dateLabel: '8 Mei 2025', day: 'Kamis', subject: 'Bahasa Indonesia' },
  { date: '2025-05-09', dateLabel: '9 Mei 2025', day: 'Jumat', subject: 'Matematika' },
  { date: '2025-05-12', dateLabel: '12 Mei 2025', day: 'Senin', subject: 'Matematika' },
  { date: '2025-05-13', dateLabel: '13 Mei 2025', day: 'Selasa', subject: 'Bahasa Inggris' },
]

function getHistoryStatus(studentIndex, dateIndex) {
  if (studentIndex === 0 && dateIndex === 0) return 'Hadir'
  if (studentIndex === 0 && dateIndex === 1) return 'Sakit'
  if (studentIndex === 0 && dateIndex === 2) return 'Izin'
  if ((studentIndex + dateIndex * 3) % 29 === 0) return 'Tanpa Keterangan'
  if ((studentIndex * 2 + dateIndex) % 17 === 0) return 'Sakit'
  if ((studentIndex + dateIndex * 2) % 19 === 0) return 'Izin'
  return 'Hadir'
}

function getHistoryDescription(status) {
  if (status === 'Sakit') return 'Demam dan beristirahat di rumah'
  if (status === 'Izin') return 'Keperluan keluarga'
  if (status === 'Tanpa Keterangan') return 'Belum ada keterangan'
  return '-'
}

export const studentAttendanceHistory = classStudents.flatMap((student, studentIndex) =>
  historyDates.map((historyDate, dateIndex) => {
    const status = getHistoryStatus(studentIndex, dateIndex)
    const statusMeta = getStatusMeta(status)
    const assignment = teacherAssignments.find(
      ({ subject }) => subject === historyDate.subject,
    )

    return {
      id: studentIndex * historyDates.length + dateIndex + 1,
      studentId: student.studentId,
      nis: student.nis,
      name: student.name,
      className: student.className,
      date: historyDate.date,
      dateLabel: historyDate.dateLabel,
      day: historyDate.day,
      status,
      statusCode: statusMeta.code,
      statusTone: statusMeta.tone,
      subject: historyDate.subject,
      teacher: assignment?.teacher ?? '-',
      description: getHistoryDescription(status),
      academicYear: defaultAcademicYear,
      semester: defaultSemester,
      month: defaultMonth,
    }
  }),
)

const featuredSubjects = ['Matematika', 'Bahasa Indonesia', 'Fisika']

export const subjectAttendanceRows = featuredSubjects.flatMap((subject, subjectIndex) => {
  const assignment = teacherAssignments.find(
    ({ subject: assignmentSubject, className }) =>
      assignmentSubject === subject && className === defaultClassName,
  )
  const teacher = assignment?.teacher ?? teacherNames[subjectIndex]

  return classStudents.map((student, studentIndex) => {
    const meetings = 18
    const featuredMathCounts =
      subjectIndex === 0 && studentIndex < 2
        ? [
            { sick: 1, permission: 0, absent: 0 },
            { sick: 1, permission: 1, absent: 0 },
          ][studentIndex]
        : null
    const sick = featuredMathCounts?.sick ?? ((studentIndex + subjectIndex) % 9 === 0 ? 1 : 0)
    const permission =
      featuredMathCounts?.permission ??
      ((studentIndex + subjectIndex * 2) % 11 === 1 ? 1 : 0)
    const absent =
      featuredMathCounts?.absent ??
      ((studentIndex + subjectIndex * 3) % 17 === 7 ? 1 : 0)
    const present = meetings - sick - permission - absent
    const percentage = calculateAttendancePercentage(present, meetings)
    const category = getAttendanceCategory(percentage)

    return {
      id: subjectIndex * classStudents.length + studentIndex + 1,
      studentId: student.studentId,
      nis: student.nis,
      name: student.name,
      className: student.className,
      subject,
      teacher,
      teacherFullName: assignment?.teacherFullName ?? teacher,
      academicYear: defaultAcademicYear,
      semester: defaultSemester,
      month: defaultMonth,
      meetings,
      present,
      sick,
      permission,
      absent,
      percentage,
      percentageLabel: percentageLabel(percentage),
      category: category.label,
      categoryTone: category.tone,
    }
  })
})

export const attendanceStatusOptions = Object.values(attendanceStatusMeta)
