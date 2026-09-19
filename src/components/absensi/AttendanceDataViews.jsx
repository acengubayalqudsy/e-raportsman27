import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  attendanceOptions,
  attendanceRecapRows,
  classAttendanceContext,
  studentAttendanceHistory,
  subjectAttendanceRows,
} from '../../data/absensi.js'

const DEFAULT_CLASS = 'X Merdeka 3'
const DEFAULT_YEAR = '2024/2025'
const DEFAULT_SEMESTER = 'Genap'
const DEFAULT_PERIOD = 'Mei 2025'
const DEFAULT_ROWS_PER_PAGE = 8

const statusOptions = ['Hadir', 'Sakit', 'Izin', 'Tanpa Keterangan']

const optionList = (key, fallback = []) => {
  const value = attendanceOptions?.[key]
  return Array.isArray(value) && value.length > 0 ? value : fallback
}

const firstExisting = (options, preferred) => (
  options.includes(preferred) ? preferred : options[0] ?? preferred
)

const getStudentName = (row) => row?.name ?? row?.studentName ?? row?.student?.name ?? '-'
const getNis = (row) => String(row?.nis ?? row?.studentNis ?? row?.student?.nis ?? '-')
const getClassName = (row) => row?.className ?? row?.class ?? row?.student?.className ?? DEFAULT_CLASS
const getYear = (row) => row?.academicYear ?? row?.year ?? DEFAULT_YEAR
const getSemester = (row) => row?.semester ?? DEFAULT_SEMESTER
const getPeriod = (row) => row?.period ?? row?.month ?? row?.monthLabel ?? DEFAULT_PERIOD
const getSubject = (row) => row?.subject ?? row?.subjectName ?? row?.course ?? 'Semua Pelajaran'
const getTeacher = (row) => row?.teacher ?? row?.teacherName ?? '-'

const numericValue = (row, keys) => {
  const key = keys.find((candidate) => row?.[candidate] !== undefined)
  return Number(key ? row[key] : 0) || 0
}

const attendanceCounts = (row) => ({
  present: numericValue(row, ['present', 'hadir', 'presentCount']),
  sick: numericValue(row, ['sick', 'sakit', 'sickCount']),
  excused: numericValue(row, ['excused', 'permission', 'izin', 'permit', 'excusedCount']),
  absent: numericValue(row, ['absent', 'alpa', 'withoutExplanation', 'tanpaKeterangan', 'absentCount']),
})

const getTotal = (row) => {
  const explicit = numericValue(row, ['total', 'meetings', 'schoolDays', 'effectiveDays'])
  if (explicit > 0) return explicit
  const counts = attendanceCounts(row)
  return counts.present + counts.sick + counts.excused + counts.absent
}

const getPercentage = (row) => {
  const explicit = row?.percentage ?? row?.attendancePercentage
  if (explicit !== undefined && explicit !== null && explicit !== '') {
    return Number(String(explicit).replace(',', '.').replace('%', '')) || 0
  }
  const total = getTotal(row)
  return total > 0 ? (attendanceCounts(row).present / total) * 100 : 0
}

const getCategory = (percentage) => {
  if (percentage >= 90) return 'Sangat Baik'
  if (percentage >= 80) return 'Baik'
  if (percentage >= 70) return 'Cukup'
  return 'Perlu Perhatian'
}

const normalizeStatus = (value) => {
  const status = String(value ?? '').trim().toLowerCase()
  if (status === 'h' || status === 'hadir') return 'Hadir'
  if (status === 's' || status === 'sakit') return 'Sakit'
  if (status === 'i' || status === 'izin') return 'Izin'
  if (status === 'a' || status === 'alpa' || status.includes('tanpa')) return 'Tanpa Keterangan'
  return value || 'Hadir'
}

const statusSlug = (value) => normalizeStatus(value).toLowerCase().replace(/\s+/g, '-')
const categorySlug = (value) => String(value).toLowerCase().replace(/\s+/g, '-')
const formatPercentage = (value) => `${Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

const searchable = (row, query, extra = []) => {
  const keyword = query.trim().toLowerCase()
  if (!keyword) return true
  return [getNis(row), getStudentName(row), ...extra]
    .some((value) => String(value ?? '').toLowerCase().includes(keyword))
}

const attendanceStudents = (() => {
  const unique = new Map()
  ;[...attendanceRecapRows, ...studentAttendanceHistory].forEach((row) => {
    const nis = getNis(row)
    if (nis !== '-' && !unique.has(nis)) unique.set(nis, row)
  })
  return [...unique.values()]
})()

function AttendanceField({ label, onChange, options, value }) {
  return (
    <label className="attendance-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function AttendanceSearch({ onChange, placeholder = 'Cari siswa (NIS/Nama)...', value }) {
  return (
    <label className="attendance-search">
      <span className="attendance-sr-only">{placeholder}</span>
      <SearchInput aria-label={placeholder} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      <Icon name="search" />
    </label>
  )
}

function AttendanceStudentField({ onChange, students, value }) {
  const availableStudents = students.filter(Boolean)

  return (
    <label className="attendance-field">
      <span>Siswa</span>
      <select disabled={availableStudents.length === 0} onChange={(event) => onChange(event.target.value)} value={availableStudents.length > 0 ? value : ''}>
        {availableStudents.length === 0 && <option value="">Tidak ada siswa</option>}
        {availableStudents.map((student) => (
          <option key={getNis(student)} value={getNis(student)}>{getStudentName(student)} &middot; {getNis(student)}</option>
        ))}
      </select>
    </label>
  )
}

function AttendanceStatusBadge({ value }) {
  const label = normalizeStatus(value)
  return <span className={`attendance-status attendance-status-${statusSlug(label)}`}>{label}</span>
}

function AttendanceCategoryBadge({ percentage }) {
  const category = getCategory(percentage)
  return <span className={`attendance-category attendance-category-${categorySlug(category)}`}>{category}</span>
}

function EmptyAttendance({ actionLabel, description, onAction, title = 'Data absensi tidak ditemukan' }) {
  return (
    <EmptyState className="attendance-empty">
      <span className="attendance-empty-icon"><Icon name="clipboard" /></span>
      <strong>{title}</strong>
      <p>{description ?? 'Coba ubah kelas, semester, periode, atau kata pencarian.'}</p>
      {actionLabel && onAction && (
        <Button className="attendance-button attendance-button-primary" onClick={onAction}>
          <Icon name="plus" />{actionLabel}
        </Button>
      )}
    </EmptyState>
  )
}

function useAttendancePagination(items) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPageState] = useState(DEFAULT_ROWS_PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage

  return {
    currentPage: safePage,
    pageItems: items.slice(startIndex, startIndex + rowsPerPage),
    resetPage: () => setCurrentPage(1),
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage: (value) => {
      setRowsPerPageState(value)
      setCurrentPage(1)
    },
    startIndex,
    totalPages,
  }
}

function AttendancePagination({ itemLabel = 'siswa', pagination, totalItems }) {
  return (
    <div className="attendance-pagination">
      <MasterPagination
        currentPage={pagination.currentPage}
        itemLabel={itemLabel}
        onPageChange={pagination.setCurrentPage}
        onRowsPerPageChange={pagination.setRowsPerPage}
        rowsPerPage={pagination.rowsPerPage}
        totalItems={totalItems}
        totalPages={pagination.totalPages}
      />
    </div>
  )
}

function getContext(className) {
  if (Array.isArray(classAttendanceContext)) {
    return classAttendanceContext.find((item) => getClassName(item) === className) ?? classAttendanceContext[0] ?? {}
  }
  if (classAttendanceContext?.[className]) return classAttendanceContext[className]
  return getClassName(classAttendanceContext) === className ? classAttendanceContext : {}
}

function summaryFromRows(rows) {
  const totals = rows.reduce((accumulator, row) => {
    const counts = attendanceCounts(row)
    accumulator.present += counts.present
    accumulator.sick += counts.sick
    accumulator.excused += counts.excused
    accumulator.absent += counts.absent
    return accumulator
  }, { present: 0, sick: 0, excused: 0, absent: 0 })
  const total = totals.present + totals.sick + totals.excused + totals.absent
  return { ...totals, percentage: total > 0 ? (totals.present / total) * 100 : 0, total }
}

function StudentSummary({ history, recap }) {
  const hasRecap = getTotal(recap ?? {}) > 0
  const counts = hasRecap
    ? attendanceCounts(recap)
    : history.reduce((accumulator, item) => {
        const status = normalizeStatus(item.status ?? item.attendanceStatus)
        if (status === 'Hadir') accumulator.present += 1
        if (status === 'Sakit') accumulator.sick += 1
        if (status === 'Izin') accumulator.excused += 1
        if (status === 'Tanpa Keterangan') accumulator.absent += 1
        return accumulator
      }, { present: 0, sick: 0, excused: 0, absent: 0 })
  const total = counts.present + counts.sick + counts.excused + counts.absent
  const percentage = hasRecap ? getPercentage(recap) : total > 0 ? (counts.present / total) * 100 : 0
  const items = [
    { label: 'Hadir', value: counts.present, icon: 'checkCircle', tone: 'green' },
    { label: 'Sakit', value: counts.sick, icon: 'document', tone: 'orange' },
    { label: 'Izin', value: counts.excused, icon: 'info', tone: 'blue' },
    { label: 'Tanpa Keterangan', value: counts.absent, icon: 'clock', tone: 'red' },
    { label: 'Persentase', value: formatPercentage(percentage), icon: 'trend', tone: 'purple' },
  ]

  return (
    <div className="attendance-student-summary">
      {items.map((item) => (
        <article className={`attendance-mini-card attendance-tone-${item.tone}`} key={item.label}>
          <span><Icon name={item.icon} /></span>
          <div><small>{item.label}</small><strong>{item.value}</strong></div>
        </article>
      ))}
    </div>
  )
}

function getHistoryIdentity(row) {
  return row?.studentId ?? getNis(row)
}

function getHistoryDate(row) {
  return row?.dateLabel ?? row?.formattedDate ?? row?.date ?? '-'
}

export function StudentAttendanceView({ onNotify }) {
  const classes = optionList('classes', [DEFAULT_CLASS])
  const years = optionList('academicYears', [DEFAULT_YEAR])
  const semesters = optionList('semesters', [DEFAULT_SEMESTER, 'Ganjil'])
  const periods = optionList('months', [DEFAULT_PERIOD])
  const sourceStudents = attendanceStudents
  const initialClass = firstExisting(classes, DEFAULT_CLASS)
  const initialStudents = sourceStudents.filter((row) => getClassName(row) === initialClass)
  const [filters, setFilters] = useState({
    className: initialClass,
    academicYear: firstExisting(years, DEFAULT_YEAR),
    semester: firstExisting(semesters, DEFAULT_SEMESTER),
    period: firstExisting(periods, DEFAULT_PERIOD),
    studentNis: getNis(initialStudents[0] ?? sourceStudents[0]),
    search: '',
  })

  const studentChoices = useMemo(() => sourceStudents.filter((row) => (
    getClassName(row) === filters.className && searchable(row, filters.search)
  )), [filters.className, filters.search, sourceStudents])

  const selectedStudent = studentChoices.find((row) => getNis(row) === filters.studentNis)
    ?? studentChoices[0]

  const selectedHistory = useMemo(() => studentAttendanceHistory.filter((row) => {
    const sameStudent = getNis(row) === getNis(selectedStudent)
      || (row?.studentId && selectedStudent?.studentId && row.studentId === selectedStudent.studentId)
    return sameStudent
      && getClassName(row) === filters.className
      && getYear(row) === filters.academicYear
      && getSemester(row) === filters.semester
      && (filters.period === 'Semua Periode' || getPeriod(row) === filters.period)
  }), [filters, selectedStudent])

  const selectedRecap = attendanceRecapRows.find((row) => (
    getNis(row) === getNis(selectedStudent)
      && getYear(row) === filters.academicYear
      && getSemester(row) === filters.semester
  ))
  const pagination = useAttendancePagination(selectedHistory)

  const updateFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'className') {
        const firstStudent = sourceStudents.find((row) => getClassName(row) === value)
        next.studentNis = getNis(firstStudent)
      }
      return next
    })
    pagination.resetPage()
  }

  return (
    <section className="attendance-data-view attendance-student-view">
      <div className="attendance-toolbar">
        <div className="attendance-filter-grid attendance-filter-grid-five">
          <AttendanceField label="Kelas" onChange={(value) => updateFilter('className', value)} options={classes} value={filters.className} />
          <AttendanceStudentField onChange={(value) => updateFilter('studentNis', value)} students={studentChoices} value={selectedStudent ? getNis(selectedStudent) : ''} />
          <AttendanceField label="Tahun Ajaran" onChange={(value) => updateFilter('academicYear', value)} options={years} value={filters.academicYear} />
          <AttendanceField label="Semester" onChange={(value) => updateFilter('semester', value)} options={semesters} value={filters.semester} />
          <AttendanceField label="Bulan" onChange={(value) => updateFilter('period', value)} options={periods} value={filters.period} />
        </div>
        <AttendanceSearch onChange={(value) => updateFilter('search', value)} placeholder="Cari NIS / Nama siswa..." value={filters.search} />
      </div>

      {selectedStudent ? (
        <>
          <section className="attendance-student-identity">
            <span className="attendance-student-avatar"><Icon name="user" /></span>
            <div>
              <small>Detail Kehadiran Siswa</small>
              <h3>{getStudentName(selectedStudent)}</h3>
              <p>NIS <strong>{getNis(selectedStudent)}</strong><i aria-hidden="true" />Kelas <strong>{getClassName(selectedStudent)}</strong></p>
            </div>
            <AttendanceCategoryBadge percentage={selectedRecap ? getPercentage(selectedRecap) : selectedHistory.length > 0 ? (selectedHistory.filter((row) => normalizeStatus(row.status) === 'Hadir').length / selectedHistory.length) * 100 : 0} />
          </section>

          <StudentSummary history={selectedHistory} recap={selectedRecap} />

          <section className="attendance-table-card">
            <header className="attendance-card-header">
              <div><h3>Histori Kehadiran</h3><p>Riwayat kehadiran {filters.period} &middot; Semester {filters.semester}</p></div>
              <Button className="attendance-button attendance-button-outline" onClick={() => onNotify?.('Data histori siswa siap ditinjau.')}><Icon name="eye" />Tinjau Data</Button>
            </header>
            {pagination.pageItems.length > 0 ? (
              <div className="attendance-table-scroll">
                <table className="attendance-table attendance-history-table">
                  <thead><tr><th>No</th><th>Tanggal</th><th>Hari</th><th>Status</th><th>Mata Pelajaran</th><th>Keterangan</th></tr></thead>
                  <tbody>
                    {pagination.pageItems.map((row, index) => (
                      <tr key={row.id ?? `${getHistoryIdentity(row)}-${getHistoryDate(row)}-${index}`}>
                        <td>{pagination.startIndex + index + 1}</td>
                        <td>{getHistoryDate(row)}</td>
                        <td>{row.day ?? row.dayName ?? '-'}</td>
                        <td><AttendanceStatusBadge value={row.status ?? row.attendanceStatus} /></td>
                        <td>{getSubject(row)}</td>
                        <td className="attendance-notes-cell">{row.notes ?? row.note ?? row.description ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyAttendance title="Belum ada histori absensi" description="Belum ada data kehadiran siswa pada periode yang dipilih." />
            )}
            <AttendancePagination itemLabel="riwayat" pagination={pagination} totalItems={selectedHistory.length} />
          </section>
        </>
      ) : (
        <EmptyAttendance description="Coba ubah kelas atau kata pencarian siswa." />
      )}
    </section>
  )
}

function CategoryPanel({ rows }) {
  const categories = [
    { label: 'Sangat Baik', range: '≥ 90%', tone: 'green' },
    { label: 'Baik', range: '80% - 89%', tone: 'blue' },
    { label: 'Cukup', range: '70% - 79%', tone: 'orange' },
    { label: 'Perlu Perhatian', range: '< 70%', tone: 'red' },
  ].map((item) => ({
    ...item,
    count: rows.filter((row) => getCategory(getPercentage(row)) === item.label).length,
  }))

  return (
    <aside className="attendance-category-panel">
      <header><div><h3>Kategori Kehadiran</h3><p>Pemetaan kondisi siswa pada periode aktif</p></div><Icon name="trend" /></header>
      <div className="attendance-category-list">
        {categories.map((item) => {
          const percentage = rows.length > 0 ? (item.count / rows.length) * 100 : 0
          return (
            <article key={item.label}>
              <span className={`attendance-category-symbol attendance-tone-${item.tone}`}><Icon name="clipboardCheck" /></span>
              <div><strong>{item.label} <small>({item.range})</small></strong><p>{item.count} siswa</p></div>
              <div className="attendance-category-progress"><i className={`attendance-category-bar attendance-tone-${item.tone}`} style={{ width: `${percentage}%` }} /><span>{formatPercentage(percentage)}</span></div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}

function ClassContext({ className, hasLocalEdits, rows, semester }) {
  const context = getContext(className)
  const summary = summaryFromRows(rows)
  const teacher = context.homeroom ?? context.homeroomTeacher ?? context.homeroomFullName ?? context.teacher ?? context.teacherName ?? context.waliKelas ?? '-'
  const studentCount = context.studentCount ?? context.totalStudents ?? rows.length
  const referenceAverage = !hasLocalEdits && rows.length === attendanceRecapRows.length && className === DEFAULT_CLASS
    ? 93.64
    : summary.percentage
  return (
    <section className="attendance-context-card">
      <span className="attendance-context-icon"><Icon name="users" /></span>
      <div><small>Rombongan Belajar</small><h3>{className}</h3><p>{studentCount} siswa &middot; Wali Kelas: <strong>{teacher}</strong> &middot; Semester {semester}</p></div>
      <div className="attendance-context-metric"><small>Rata-rata Kehadiran</small><strong>{formatPercentage(referenceAverage)}</strong></div>
    </section>
  )
}

function ReappliedRow(row, status) {
  const counts = attendanceCounts(row)
  const next = { ...row }
  if (status === 'Hadir') next.present = counts.present + 1
  if (status === 'Sakit') next.sick = counts.sick + 1
  if (status === 'Izin') next.excused = counts.excused + 1
  if (status === 'Tanpa Keterangan') next.absent = counts.absent + 1
  const nextCounts = attendanceCounts(next)
  const total = nextCounts.present + nextCounts.sick + nextCounts.excused + nextCounts.absent
  next.total = total
  if (row.meetings !== undefined) next.meetings = total
  next.percentage = total > 0 ? (nextCounts.present / total) * 100 : 0
  next.category = getCategory(next.percentage)
  return next
}

function normalizeEditableAttendance(row) {
  const counts = attendanceCounts(row)
  const total = counts.present + counts.sick + counts.excused + counts.absent
  return {
    ...row,
    total,
    percentage: total > 0 ? (counts.present / total) * 100 : 0,
    category: getCategory(total > 0 ? (counts.present / total) * 100 : 0),
  }
}

function AttendanceRecapTable({ pageItems, pagination }) {
  return (
    <div className="attendance-table-scroll">
      <table className="attendance-table attendance-class-table">
        <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Tanpa Ket.</th><th>Kehadiran</th><th>Status</th></tr></thead>
        <tbody>
          {pageItems.map((row, index) => {
            const counts = attendanceCounts(row)
            const percentage = getPercentage(row)
            return (
              <tr key={row.id ?? getNis(row)}>
                <td>{pagination.startIndex + index + 1}</td><td>{getNis(row)}</td><td className="attendance-name-cell">{getStudentName(row)}</td>
                <td className="attendance-number-present">{counts.present}</td><td className="attendance-number-sick">{counts.sick}</td><td className="attendance-number-excused">{counts.excused}</td><td className="attendance-number-absent">{counts.absent}</td>
                <td><strong className="attendance-percentage">{formatPercentage(percentage)}</strong></td><td><AttendanceCategoryBadge percentage={percentage} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ClassAttendanceView({ onNotify }) {
  const classes = optionList('classes', [DEFAULT_CLASS])
  const years = optionList('academicYears', [DEFAULT_YEAR])
  const semesters = optionList('semesters', [DEFAULT_SEMESTER, 'Ganjil'])
  const grades = optionList('grades', ['X', 'XI', 'XII'])
  const periods = optionList('periods', optionList('months', [DEFAULT_PERIOD]))
  const [rows, setRows] = useState(() => attendanceRecapRows.map(normalizeEditableAttendance))
  const [hasLocalEdits, setHasLocalEdits] = useState(false)
  const [filters, setFilters] = useState({
    academicYear: firstExisting(years, DEFAULT_YEAR), semester: firstExisting(semesters, DEFAULT_SEMESTER), grade: 'X', className: firstExisting(classes, DEFAULT_CLASS), period: firstExisting(periods, DEFAULT_PERIOD), search: '',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const contextRows = useMemo(() => rows.filter((row) => (
    getClassName(row) === filters.className
      && getYear(row) === filters.academicYear
      && getSemester(row) === filters.semester
      && (filters.period === 'Semua Periode' || getPeriod(row) === filters.period)
  )), [filters.academicYear, filters.className, filters.period, filters.semester, rows])
  const filteredRows = useMemo(() => contextRows.filter((row) => searchable(row, filters.search)), [contextRows, filters.search])
  const pagination = useAttendancePagination(filteredRows)

  const updateFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'grade') next.className = classes.find((name) => name.split(' ')[0] === value) ?? current.className
      return next
    })
    pagination.resetPage()
  }

  const saveAttendance = (entries) => {
    const changes = new Map(entries.map((entry) => [entry.nis, entry]))
    setRows((current) => current.map((row) => {
      const matchesContext = getClassName(row) === filters.className
        && getYear(row) === filters.academicYear
        && getSemester(row) === filters.semester
        && (filters.period === 'Semua Periode' || getPeriod(row) === filters.period)
      if (!matchesContext) return row
      const entry = changes.get(getNis(row))
      return entry ? { ...ReappliedRow(row, entry.status), latestNote: entry.note, latestDate: entry.date } : row
    }))
    setHasLocalEdits(true)
    setModalOpen(false)
    onNotify?.(`${entries.length} data absensi ${filters.className} berhasil disimpan pada local state.`)
  }

  return (
    <section className="attendance-data-view attendance-class-view">
      <div className="attendance-toolbar">
        <div className="attendance-filter-grid attendance-filter-grid-five">
          <AttendanceField label="Tahun Ajaran" onChange={(value) => updateFilter('academicYear', value)} options={years} value={filters.academicYear} />
          <AttendanceField label="Semester" onChange={(value) => updateFilter('semester', value)} options={semesters} value={filters.semester} />
          <AttendanceField label="Tingkat" onChange={(value) => updateFilter('grade', value)} options={grades} value={filters.grade} />
          <AttendanceField label="Kelas" onChange={(value) => updateFilter('className', value)} options={classes.filter((name) => name.split(' ')[0] === filters.grade)} value={filters.className} />
          <AttendanceField label="Periode" onChange={(value) => updateFilter('period', value)} options={periods} value={filters.period} />
        </div>
        <AttendanceSearch onChange={(value) => updateFilter('search', value)} value={filters.search} />
      </div>

      <div className="attendance-view-actions">
        <ClassContext className={filters.className} hasLocalEdits={hasLocalEdits} rows={contextRows} semester={filters.semester} />
        <Button className="attendance-button attendance-button-primary" onClick={() => setModalOpen(true)}><Icon name="plus" />Catat Absensi</Button>
      </div>

      <div className="attendance-split-layout">
        <section className="attendance-table-card">
          <header className="attendance-card-header"><div><h3>Rekap Kehadiran Siswa</h3><p>{filters.period} &middot; {filteredRows.length} siswa</p></div></header>
          {pagination.pageItems.length > 0 ? <AttendanceRecapTable pageItems={pagination.pageItems} pagination={pagination} /> : <EmptyAttendance actionLabel="Catat Absensi" onAction={() => setModalOpen(true)} />}
          <AttendancePagination itemLabel="siswa" pagination={pagination} totalItems={filteredRows.length} />
        </section>
        <CategoryPanel rows={contextRows} />
      </div>

      {modalOpen && (
        <AttendanceInputModal
          context={{ className: filters.className, period: filters.period, semester: filters.semester, academicYear: filters.academicYear }}
          onClose={() => setModalOpen(false)}
          onSave={saveAttendance}
          students={contextRows}
          title="Catat Absensi Kelas"
        />
      )}
    </section>
  )
}

function SubjectContext({ filters, rows }) {
  const average = rows.length > 0 ? rows.reduce((total, row) => total + getPercentage(row), 0) / rows.length : 0
  return (
    <section className="attendance-context-card attendance-subject-context">
      <span className="attendance-context-icon"><Icon name="book" /></span>
      <div><small>Rekap Mata Pelajaran</small><h3>{filters.subject}</h3><p>{filters.className} &middot; Pengampu: <strong>{filters.teacher}</strong> &middot; {filters.period}</p></div>
      <div className="attendance-context-metric"><small>Rata-rata Kehadiran</small><strong>{formatPercentage(average)}</strong></div>
    </section>
  )
}

function SubjectTable({ pageItems, pagination }) {
  return (
    <div className="attendance-table-scroll">
      <table className="attendance-table attendance-subject-table">
        <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>Pertemuan</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Tanpa Ket.</th><th>Kehadiran</th><th>Status</th></tr></thead>
        <tbody>
          {pageItems.map((row, index) => {
            const counts = attendanceCounts(row)
            const percentage = getPercentage(row)
            return (
              <tr key={row.id ?? `${getNis(row)}-${getSubject(row)}`}>
                <td>{pagination.startIndex + index + 1}</td><td>{getNis(row)}</td><td className="attendance-name-cell">{getStudentName(row)}</td><td>{numericValue(row, ['meetings', 'total', 'meetingCount'])}</td>
                <td className="attendance-number-present">{counts.present}</td><td className="attendance-number-sick">{counts.sick}</td><td className="attendance-number-excused">{counts.excused}</td><td className="attendance-number-absent">{counts.absent}</td>
                <td><strong className="attendance-percentage">{formatPercentage(percentage)}</strong></td><td><AttendanceCategoryBadge percentage={percentage} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function SubjectAttendanceView({ onNotify }) {
  const classes = optionList('classes', [DEFAULT_CLASS])
  const subjects = optionList('subjects', ['Matematika'])
  const teachers = optionList('teachers', ['Budi Santoso'])
  const years = optionList('academicYears', [DEFAULT_YEAR])
  const semesters = optionList('semesters', [DEFAULT_SEMESTER, 'Ganjil'])
  const periods = optionList('periods', optionList('months', [DEFAULT_PERIOD]))
  const [rows, setRows] = useState(() => subjectAttendanceRows.map((row) => ({ ...row })))
  const [filters, setFilters] = useState({
    className: firstExisting(classes, DEFAULT_CLASS), subject: firstExisting(subjects, 'Matematika'), teacher: firstExisting(teachers, 'Budi Santoso'), academicYear: firstExisting(years, DEFAULT_YEAR), semester: firstExisting(semesters, DEFAULT_SEMESTER), period: firstExisting(periods, DEFAULT_PERIOD), search: '',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const availableTeachers = useMemo(() => {
    const matchedTeachers = rows
      .filter((row) => getSubject(row) === filters.subject)
      .map(getTeacher)
      .filter((teacher) => teacher !== '-')
    return [...new Set(matchedTeachers)].length > 0 ? [...new Set(matchedTeachers)] : teachers
  }, [filters.subject, rows, teachers])
  const contextRows = useMemo(() => rows.filter((row) => (
    getClassName(row) === filters.className
      && getSubject(row) === filters.subject
      && (getTeacher(row) === '-' || getTeacher(row) === filters.teacher)
      && getYear(row) === filters.academicYear
      && getSemester(row) === filters.semester
      && (filters.period === 'Semua Periode' || getPeriod(row) === filters.period)
  )), [filters.academicYear, filters.className, filters.period, filters.semester, filters.subject, filters.teacher, rows])
  const filteredRows = useMemo(() => contextRows.filter((row) => searchable(row, filters.search, [getSubject(row), getTeacher(row)])), [contextRows, filters.search])
  const pagination = useAttendancePagination(filteredRows)
  const updateFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'subject') {
        next.teacher = rows.find((row) => getSubject(row) === value)?.teacher ?? current.teacher
      }
      return next
    })
    pagination.resetPage()
  }

  const saveAttendance = (entries) => {
    const changes = new Map(entries.map((entry) => [entry.nis, entry]))
    setRows((current) => current.map((row) => {
      const matchesContext = getClassName(row) === filters.className
        && getSubject(row) === filters.subject
        && getTeacher(row) === filters.teacher
        && getYear(row) === filters.academicYear
        && getSemester(row) === filters.semester
        && (filters.period === 'Semua Periode' || getPeriod(row) === filters.period)
      if (!matchesContext) return row
      const entry = changes.get(getNis(row))
      return entry ? { ...ReappliedRow(row, entry.status), latestNote: entry.note, latestDate: entry.date } : row
    }))
    setModalOpen(false)
    onNotify?.(`${entries.length} data absensi ${filters.subject} berhasil disimpan pada local state.`)
  }

  return (
    <section className="attendance-data-view attendance-subject-view">
      <div className="attendance-toolbar attendance-toolbar-subject">
        <div className="attendance-filter-grid attendance-filter-grid-six">
          <AttendanceField label="Kelas" onChange={(value) => updateFilter('className', value)} options={classes} value={filters.className} />
          <AttendanceField label="Mata Pelajaran" onChange={(value) => updateFilter('subject', value)} options={subjects} value={filters.subject} />
          <AttendanceField label="Guru" onChange={(value) => updateFilter('teacher', value)} options={availableTeachers} value={filters.teacher} />
          <AttendanceField label="Tahun Ajaran" onChange={(value) => updateFilter('academicYear', value)} options={years} value={filters.academicYear} />
          <AttendanceField label="Semester" onChange={(value) => updateFilter('semester', value)} options={semesters} value={filters.semester} />
          <AttendanceField label="Periode" onChange={(value) => updateFilter('period', value)} options={periods} value={filters.period} />
        </div>
        <AttendanceSearch onChange={(value) => updateFilter('search', value)} placeholder="Cari siswa..." value={filters.search} />
      </div>

      <div className="attendance-view-actions">
        <SubjectContext filters={filters} rows={contextRows} />
        <Button className="attendance-button attendance-button-primary" onClick={() => setModalOpen(true)}><Icon name="plus" />Catat Absensi</Button>
      </div>

      <section className="attendance-table-card">
        <header className="attendance-card-header"><div><h3>Rekap Absensi Mata Pelajaran</h3><p>{filters.subject} &middot; {filters.className} &middot; {filteredRows.length} siswa</p></div></header>
        {pagination.pageItems.length > 0 ? <SubjectTable pageItems={pagination.pageItems} pagination={pagination} /> : <EmptyAttendance actionLabel="Catat Absensi" onAction={() => setModalOpen(true)} />}
        <AttendancePagination itemLabel="siswa" pagination={pagination} totalItems={filteredRows.length} />
      </section>

      {modalOpen && (
        <AttendanceInputModal
          context={{ ...filters }}
          onClose={() => setModalOpen(false)}
          onSave={saveAttendance}
          students={contextRows}
          title="Catat Absensi Mata Pelajaran"
        />
      )}
    </section>
  )
}

function AttendanceInputModal({ context, onClose, onSave, students, title }) {
  const visibleStudents = useMemo(() => students.slice(0, DEFAULT_ROWS_PER_PAGE), [students])
  const [date, setDate] = useState('2025-05-09')
  const [records, setRecords] = useState(() => Object.fromEntries(visibleStudents.map((student) => [getNis(student), { status: 'Hadir', note: '' }])))
  const [dirtyNis, setDirtyNis] = useState(() => new Set())
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef(null)
  const saveTimerRef = useRef(null)

  const requestClose = () => {
    if (dirtyNis.size > 0 && !discardConfirm) {
      setDiscardConfirm(true)
      return
    }
    onClose()
  }

  useEffect(() => {
    dialogRef.current?.focus()
    return () => window.clearTimeout(saveTimerRef.current)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (dirtyNis.size > 0 && !discardConfirm) {
        setDiscardConfirm(true)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dirtyNis.size, discardConfirm, onClose])

  const updateRecord = (nis, key, value) => {
    setRecords((current) => ({ ...current, [nis]: { ...current[nis], [key]: value } }))
    setDirtyNis((current) => new Set(current).add(nis))
    setDiscardConfirm(false)
  }

  const markAllPresent = () => {
    setRecords((current) => Object.fromEntries(visibleStudents.map((student) => {
      const nis = getNis(student)
      return [nis, { ...(current[nis] ?? {}), status: 'Hadir' }]
    })))
    setDirtyNis(new Set(visibleStudents.map(getNis)))
    setDiscardConfirm(false)
  }

  const submit = (event) => {
    event.preventDefault()
    if (visibleStudents.length === 0 || saving) return
    setSaving(true)
    const entries = visibleStudents.map((student) => {
      const nis = getNis(student)
      return { nis, name: getStudentName(student), date, ...records[nis] }
    })
    saveTimerRef.current = window.setTimeout(() => onSave(entries), 350)
  }

  return (
    <div className="attendance-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }} role="presentation">
      <section aria-labelledby="attendance-modal-title" aria-modal="true" className="attendance-modal" ref={dialogRef} role="dialog" tabIndex="-1">
        <header className="attendance-modal-header">
          <div><small>Input Kehadiran</small><h2 id="attendance-modal-title">{title}</h2><p>Perubahan hanya disimpan pada state frontend.</p></div>
          <button aria-label="Tutup modal" onClick={requestClose} type="button">&times;</button>
        </header>

        <form onSubmit={submit}>
          <div className="attendance-modal-context">
            <label className="attendance-field"><span>Tanggal</span><input onChange={(event) => { setDate(event.target.value); setDirtyNis((current) => new Set(current).add('date')) }} required type="date" value={date} /></label>
            <div><span>Kelas</span><strong>{context.className}</strong></div>
            {context.subject && <div><span>Mata Pelajaran</span><strong>{context.subject}</strong></div>}
            {context.teacher && <div><span>Guru</span><strong>{context.teacher}</strong></div>}
            <div><span>Semester</span><strong>{context.semester}</strong></div>
          </div>

          <div className="attendance-modal-tools">
            <div><strong>{visibleStudents.length} siswa ditampilkan</strong><span>Atur pengecualian setelah menandai semua hadir.</span></div>
            <Button className="attendance-button attendance-button-outline" onClick={markAllPresent}><Icon name="checkCircle" />Tandai Semua Hadir</Button>
          </div>

          {visibleStudents.length > 0 ? (
            <div className="attendance-modal-list">
              {visibleStudents.map((student, index) => {
                const nis = getNis(student)
                const record = records[nis] ?? { status: 'Hadir', note: '' }
                const showNote = record.status !== 'Hadir'
                return (
                  <article className={dirtyNis.has(nis) ? 'attendance-modal-row attendance-row-dirty' : 'attendance-modal-row'} key={student.id ?? nis}>
                    <span className="attendance-modal-number">{index + 1}</span>
                    <div className="attendance-modal-student"><strong>{getStudentName(student)}</strong><span>{nis} &middot; {getClassName(student)}</span></div>
                    <label className="attendance-modal-status"><span className="attendance-sr-only">Status {getStudentName(student)}</span><select aria-label={`Status ${getStudentName(student)}`} onChange={(event) => updateRecord(nis, 'status', event.target.value)} value={record.status}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="attendance-modal-note"><span className="attendance-sr-only">Keterangan {getStudentName(student)}</span><input aria-label={`Keterangan ${getStudentName(student)}`} disabled={!showNote} onChange={(event) => updateRecord(nis, 'note', event.target.value)} placeholder={showNote ? 'Keterangan (opsional)' : 'Tidak perlu keterangan'} value={record.note} /></label>
                  </article>
                )
              })}
            </div>
          ) : <EmptyAttendance title="Belum ada siswa pada konteks ini" description="Ubah filter kelas atau mata pelajaran sebelum mencatat absensi." />}

          {discardConfirm && <div className="attendance-discard-alert"><Icon name="info" /><span><strong>Ada perubahan yang belum disimpan.</strong> Klik “Buang Perubahan” untuk menutup modal.</span></div>}

          <footer className="attendance-modal-footer">
            <span className={dirtyNis.size > 0 ? 'attendance-dirty-indicator attendance-is-dirty' : 'attendance-dirty-indicator'}><i aria-hidden="true" />{dirtyNis.size > 0 ? `${dirtyNis.size} perubahan belum disimpan` : 'Belum ada perubahan'}</span>
            <div>
              <Button className="attendance-button attendance-button-secondary" onClick={requestClose}>{discardConfirm ? 'Buang Perubahan' : 'Batal'}</Button>
              <Button className="attendance-button attendance-button-primary" disabled={visibleStudents.length === 0 || saving} type="submit"><Icon name="save" />{saving ? 'Menyimpan...' : 'Simpan Absensi'}</Button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
