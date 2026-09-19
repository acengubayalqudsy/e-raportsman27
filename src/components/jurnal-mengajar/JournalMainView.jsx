import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  createJournalRecord,
  journalOptions,
  journalSummary,
  monthlyJournalSummary,
  todayTeachingSchedule,
  todayTeachingScheduleMeta,
} from '../../data/jurnalMengajar.js'
import { JournalDetailModal, JournalFormModal } from './JournalModals.jsx'
import JournalSummary from './JournalSummary.jsx'

const DEFAULT_ROWS_PER_PAGE = 8

function SelectField({ label, onChange, options = [], value }) {
  return (
    <label className="journal-filter-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function attendanceValues(journal) {
  const present = journal.attendance?.present ?? journal.attendancePresent ?? journal.present ?? 0
  const total = journal.attendance?.total ?? journal.attendanceTotal ?? journal.totalStudents ?? 0
  const percentage = journal.attendance?.percentage
    ?? journal.attendancePercentage
    ?? (total ? (Number(present) / Number(total)) * 100 : 0)
  const percentageLabel = journal.attendance?.percentageLabel
    ?? journal.attendancePercentageLabel
    ?? `${Number(percentage).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

  return { percentage, percentageLabel, present, total }
}

function activityItems(journal) {
  if (Array.isArray(journal.activities)) return journal.activities
  return String(journal.activities ?? journal.activityText ?? '')
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function JournalStatus({ journal }) {
  const tone = journal.statusTone ?? (
    journal.status === 'Lengkap'
      ? 'green'
      : journal.status === 'Belum Lengkap'
        ? 'orange'
        : 'blue'
  )

  return <span className={`journal-status tone-${tone}`}>{journal.status}</span>
}

function formatPercentage(value) {
  return `${Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function buildContextSummary(contextJournals, filters) {
  const total = contextJournals.length
  const complete = contextJournals.filter(({ status }) => status === 'Lengkap').length
  const incomplete = total - complete
  const completePercentage = total ? (complete / total) * 100 : 0
  const incompletePercentage = total ? (incomplete / total) * 100 : 0
  const todayCount = todayTeachingSchedule.filter((item) => (
    item.className === filters.className
    && item.subject === filters.subject
    && item.teacher === filters.teacher
  )).length
  const teacherCount = new Set(contextJournals.map(({ teacher }) => teacher).filter(Boolean)).size

  return journalSummary.map((item) => {
    if (item.key === 'total') return { ...item, value: total.toLocaleString('id-ID'), caption: 'Pertemuan pada filter' }
    if (item.key === 'complete') return { ...item, value: complete.toLocaleString('id-ID'), caption: formatPercentage(completePercentage) }
    if (item.key === 'incomplete') return { ...item, value: incomplete.toLocaleString('id-ID'), caption: formatPercentage(incompletePercentage) }
    if (item.key === 'today') return { ...item, value: todayCount.toLocaleString('id-ID'), caption: 'Jadwal sesuai filter' }
    if (item.key === 'teachers') return { ...item, value: teacherCount.toLocaleString('id-ID'), caption: 'Guru pada filter' }
    return item
  })
}

function TodaySchedulePanel({ journals, onCreate, onOpen }) {
  const findExisting = (schedule) => journals.find(({ id }) => id === schedule.journalId)
    ?? journals.find((journal) => (
      journal.date === schedule.date
      && journal.time === schedule.time
      && journal.className === schedule.className
      && journal.subject === schedule.subject
      && journal.teacher === schedule.teacher
    ))

  return (
    <section className="journal-side-card journal-today-card">
      <header className="journal-side-card-header">
        <h3>Jadwal Hari Ini</h3>
        <span><Icon name="calendar" />{todayTeachingScheduleMeta.dateLabel}</span>
      </header>

      <div className="journal-today-list">
        {todayTeachingSchedule.map((schedule) => {
          const existingJournal = findExisting(schedule)

          return (
            <article className="journal-today-item" key={schedule.id}>
              <span className="journal-schedule-number">{schedule.period}</span>
              <div className="journal-today-copy">
                <time>{schedule.time}</time>
                <strong>{schedule.subject}</strong>
                <small>{schedule.className}<i aria-hidden="true">&middot;</i>{schedule.teacher}</small>
              </div>
              <span className={`journal-room-badge${schedule.room.toLowerCase().includes('lab') ? ' lab' : ''}`}>{schedule.room}</span>
              <button
                aria-label={`${existingJournal ? 'Lihat' : 'Buat'} jurnal ${schedule.subject} ${schedule.time}`}
                className={existingJournal ? 'has-journal' : ''}
                onClick={() => existingJournal ? onOpen(existingJournal) : onCreate(schedule)}
                title={existingJournal ? 'Lihat Jurnal' : 'Buat Jurnal'}
                type="button"
              >
                <Icon name={existingJournal ? 'eye' : 'plus'} />
              </button>
            </article>
          )
        })}
      </div>

      <button className="journal-side-footer-action" onClick={() => onCreate(null)} type="button">
        Tambah Jurnal Manual <Icon name="arrowRight" />
      </button>
    </section>
  )
}

function MonthlySummaryPanel({ contextual, filters, journals }) {
  const summary = useMemo(() => {
    if (!contextual) return monthlyJournalSummary

    const complete = journals.filter(({ status }) => status === 'Lengkap').length
    const needsAttention = journals.length - complete
    const averageAttendance = journals.length
      ? journals.reduce((total, journal) => total + Number(attendanceValues(journal).percentage || 0), 0) / journals.length
      : 0

    return {
      ...monthlyJournalSummary,
      month: filters.month,
      items: [
        { key: 'meetings', label: 'Total Pertemuan', value: journals.length.toLocaleString('id-ID'), icon: 'calendar', tone: 'blue' },
        { key: 'filled', label: 'Jurnal Lengkap', value: complete.toLocaleString('id-ID'), icon: 'journal', tone: 'green' },
        { key: 'attention', label: 'Perlu Dilengkapi', value: needsAttention.toLocaleString('id-ID'), icon: 'clock', tone: 'orange' },
        { key: 'attendance', label: 'Rata-rata Kehadiran', value: formatPercentage(averageAttendance), icon: 'users', tone: 'teal' },
      ],
    }
  }, [contextual, filters.month, journals])

  return (
    <section className="journal-side-card journal-monthly-card">
      <header className="journal-side-card-header">
        <h3>{summary.title} <small>({summary.month})</small></h3>
      </header>
      <div className="journal-monthly-list">
        {summary.items.map((item) => (
          <div key={item.key}>
            <span className={`journal-side-icon tone-${item.tone}`}><Icon name={item.icon} /></span>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecentActivityPanel({ activities, onNotify }) {
  return (
    <section className="journal-side-card journal-recent-card">
      <header className="journal-side-card-header">
        <h3>Aktivitas Terbaru</h3>
        <button onClick={() => onNotify('Semua aktivitas jurnal siap ditampilkan.')} type="button">Lihat Semua</button>
      </header>
      <div className="journal-recent-list">
        {activities.map((activity) => (
          <button key={activity.id} onClick={() => onNotify(activity.title)} type="button">
            <span className={`journal-side-icon tone-${activity.tone}`}><Icon name={activity.icon} /></span>
            <span>
              <strong>{activity.title}</strong>
              <small>{activity.description}</small>
            </span>
            <time>{activity.timestamp}</time>
          </button>
        ))}
      </div>
    </section>
  )
}

const monthNumberByName = {
  Januari: 1,
  Februari: 2,
  Maret: 3,
  April: 4,
  Mei: 5,
  Juni: 6,
  Juli: 7,
  Agustus: 8,
  September: 9,
  Oktober: 10,
  November: 11,
  Desember: 12,
}

function monthsForAcademicContext(academicYear, semester) {
  const [startYear, endYear] = String(academicYear ?? '').split('/').map(Number)
  const monthNumbers = semester === 'Ganjil' ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6]
  const year = semester === 'Ganjil' ? startYear : endYear

  if (!year) return journalOptions.months
  return monthNumbers.map((month) => {
    const name = Object.keys(monthNumberByName).find((key) => monthNumberByName[key] === month)
    return `${name} ${year}`
  })
}

function dateFromAcademicContext(academicYear, semester, monthLabel) {
  const [startYear, endYear] = String(academicYear ?? '').split('/').map(Number)
  const [monthName, labelYear] = String(monthLabel ?? '').split(' ')
  const month = monthNumberByName[monthName]
  const semesterMonths = semester === 'Ganjil' ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6]
  const fallbackMonth = semester === 'Ganjil' ? 8 : 5
  const safeMonth = semesterMonths.includes(month) ? month : fallbackMonth
  const academicYearForMonth = safeMonth >= 7 ? startYear : endYear
  const safeYear = Number(labelYear) === academicYearForMonth ? Number(labelYear) : academicYearForMonth

  if (!safeYear) return todayTeachingScheduleMeta.date
  return `${safeYear}-${String(safeMonth).padStart(2, '0')}-09`
}

function createInitialJournal(filters, schedule, journals) {
  const relevantJournals = journals.filter((journal) => (
    journal.className === (schedule?.className ?? filters.className)
    && journal.subject === (schedule?.subject ?? filters.subject)
    && journal.teacher === (schedule?.teacher ?? filters.teacher)
  ))

  return {
    academicYear: filters.academicYear,
    semester: filters.semester,
    month: filters.month,
    date: schedule?.date ?? dateFromAcademicContext(filters.academicYear, filters.semester, filters.month),
    className: schedule?.className ?? filters.className,
    subject: schedule?.subject ?? filters.subject,
    teacher: schedule?.teacher ?? filters.teacher,
    time: schedule?.time ?? journalOptions.timeSlots[0],
    meeting: relevantJournals.length + 1,
    material: '',
    chapter: '',
    activities: [],
    method: journalOptions.methods[1] ?? journalOptions.methods[0],
    media: journalOptions.media[0],
    notes: '',
    attendancePresent: 22,
    attendanceTotal: 25,
    status: 'Lengkap',
    room: schedule?.room ?? 'Ruang 201',
  }
}

function JournalMainView({
  journals = [],
  onJournalsChange = () => {},
  onNotify = () => {},
  onRecentActivitiesChange = () => {},
  recentActivities = [],
}) {
  const [filters, setFilters] = useState({
    academicYear: journalOptions.academicYears[0],
    semester: journalOptions.semesters[0],
    className: journalOptions.classes[0],
    subject: journalOptions.subjects[0],
    teacher: journalOptions.teachers[0],
    month: journalOptions.months[0],
  })
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)
  const [formModal, setFormModal] = useState(null)
  const [detailJournal, setDetailJournal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [contextualSummary, setContextualSummary] = useState(false)
  const loadingTimerRef = useRef(null)

  useEffect(() => () => window.clearTimeout(loadingTimerRef.current), [])

  const contextJournals = useMemo(() => journals.filter((journal) => (
    journal.academicYear === filters.academicYear
        && journal.semester === filters.semester
        && journal.className === filters.className
        && journal.subject === filters.subject
        && journal.teacher === filters.teacher
        && journal.month === filters.month
  )), [filters, journals])

  const filteredJournals = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')

    return contextJournals.filter((journal) => {

      if (!normalizedQuery) return true

      const searchable = [
        journal.material,
        journal.materialTitle,
        journal.activityText,
        ...activityItems(journal),
        journal.teacher,
        journal.className,
        journal.subject,
      ].join(' ').toLocaleLowerCase('id-ID')

      return searchable.includes(normalizedQuery)
    })
  }, [contextJournals, query])

  const summaryItems = useMemo(
    () => contextualSummary ? buildContextSummary(contextJournals, filters) : journalSummary,
    [contextJournals, contextualSummary, filters],
  )
  const monthOptions = useMemo(
    () => Array.from(new Set([filters.month, ...monthsForAcademicContext(filters.academicYear, filters.semester)])),
    [filters.academicYear, filters.month, filters.semester],
  )

  const totalPages = Math.max(1, Math.ceil(filteredJournals.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const visibleJournals = filteredJournals.slice(
    (safeCurrentPage - 1) * rowsPerPage,
    safeCurrentPage * rowsPerPage,
  )

  const setFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'academicYear' || key === 'semester') {
        const availableMonths = monthsForAcademicContext(next.academicYear, next.semester)
        if (!availableMonths.includes(next.month)) next.month = availableMonths.at(-2) ?? availableMonths[0]
      }
      return next
    })
    setContextualSummary(true)
    setCurrentPage(1)
  }

  const updateQuery = (value) => {
    setQuery(value)
    setCurrentPage(1)
  }

  const openCreate = (schedule = null) => {
    const scheduleContext = schedule ? {
      ...filters,
      academicYear: '2024/2025',
      semester: 'Genap',
      month: 'Mei 2025',
    } : filters
    setDetailJournal(null)
    setFormModal({
      mode: 'add',
      data: createInitialJournal(scheduleContext, schedule, journals),
    })
  }

  const openEdit = (journal) => {
    setDetailJournal(null)
    setFormModal({ mode: 'edit', data: journal })
  }

  const saveJournal = (values) => {
    const existing = journals.find((journal) => journal.id === values.id)
    const normalizedValues = {
      ...values,
      present: values.attendancePresent ?? values.present,
      totalStudents: values.attendanceTotal ?? values.totalStudents,
      month: values.month ?? filters.month,
    }
    const record = {
      ...(existing ?? {}),
      ...createJournalRecord(normalizedValues, values.id),
      id: values.id ?? `JRN-LOCAL-${Date.now()}`,
      number: existing?.number ?? journals.length + 1,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }

    onJournalsChange((current) => existing
      ? current.map((journal) => journal.id === existing.id ? record : journal)
      : [record, ...current])
    setFilters((current) => ({
      ...current,
      academicYear: record.academicYear,
      semester: record.semester,
      className: record.className,
      subject: record.subject,
      teacher: record.teacher,
      month: record.month,
    }))
    setCurrentPage(1)
    setQuery('')
    setContextualSummary(true)
    setFormModal(null)
    onRecentActivitiesChange((current) => [{
      id: `ACT-LOCAL-${Date.now()}`,
      type: existing ? 'updated' : 'created',
      title: existing ? `Jurnal ${record.subject} diperbarui` : `Jurnal ${record.subject} ditambahkan`,
      description: `${record.className} · ${record.teacher}`,
      timestamp: 'Baru saja',
      icon: 'journal',
      tone: existing ? 'blue' : 'green',
    }, ...current].slice(0, 5))
    onNotify(existing ? 'Jurnal mengajar berhasil diperbarui.' : 'Jurnal mengajar berhasil ditambahkan.')
  }

  const simulateFilter = () => {
    if (isLoading) return
    setIsLoading(true)
    window.clearTimeout(loadingTimerRef.current)
    loadingTimerRef.current = window.setTimeout(() => {
      setIsLoading(false)
      setContextualSummary(true)
      setCurrentPage(1)
      onNotify('Filter jurnal telah diterapkan pada data frontend.')
    }, 400)
  }

  return (
    <div className="journal-main-view">
      <JournalSummary items={summaryItems} />

      <section className="journal-filter-card" aria-label="Filter jurnal mengajar">
        <div className="journal-filter-toolbar">
          <div className="journal-filter-grid journal-filter-grid-six">
            <SelectField label="Tahun Ajaran" onChange={(value) => setFilter('academicYear', value)} options={journalOptions.academicYears} value={filters.academicYear} />
            <SelectField label="Semester" onChange={(value) => setFilter('semester', value)} options={journalOptions.semesters} value={filters.semester} />
            <SelectField label="Kelas" onChange={(value) => setFilter('className', value)} options={journalOptions.classes} value={filters.className} />
            <SelectField label="Mata Pelajaran" onChange={(value) => setFilter('subject', value)} options={journalOptions.subjects} value={filters.subject} />
            <SelectField label="Guru" onChange={(value) => setFilter('teacher', value)} options={journalOptions.teachers} value={filters.teacher} />
            <SelectField label="Bulan" onChange={(value) => setFilter('month', value)} options={monthOptions} value={filters.month} />
          </div>

          <label className="journal-search">
            <SearchInput
              aria-label="Cari materi atau kegiatan"
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Cari materi / kegiatan..."
              value={query}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="journal-filter-actions">
          <Button className="journal-button journal-button-secondary" disabled={isLoading} onClick={simulateFilter}>
            <Icon className={isLoading ? 'journal-spin' : ''} name={isLoading ? 'reset' : 'filter'} />
            {isLoading ? 'Menerapkan...' : 'Filter Lanjutan'}
          </Button>
          <Button className="journal-button journal-button-secondary" onClick={() => onNotify('Fitur export jurnal akan diintegrasikan pada tahap berikutnya.')}>
            <Icon name="download" />Export Data
          </Button>
          <Button className="journal-button journal-button-primary" onClick={() => openCreate()}>
            <Icon name="plus" />Tambah Jurnal
          </Button>
        </div>
      </section>

      <div className="journal-content-layout">
        <section className={`journal-table-card${isLoading ? ' is-loading' : ''}`}>
          <header className="journal-table-header">
            <div>
              <h3>Daftar Jurnal Mengajar - {filters.className} ({filters.subject})</h3>
              <p>{filters.teacher} &middot; {filters.month}</p>
            </div>
            <span>{filteredJournals.length} jurnal</span>
          </header>

          {visibleJournals.length ? (
            <>
              <div className="journal-table-scroll">
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Tanggal</th>
                      <th>Jam</th>
                      <th>Pertemuan<br />Ke</th>
                      <th>Materi Pembelajaran</th>
                      <th>Kegiatan Pembelajaran</th>
                      <th>Metode</th>
                      <th>Media</th>
                      <th>Kehadiran</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleJournals.map((journal, index) => {
                      const activities = activityItems(journal)
                      const attendance = attendanceValues(journal)

                      return (
                        <tr key={journal.id}>
                          <td>{(safeCurrentPage - 1) * rowsPerPage + index + 1}</td>
                          <td>{journal.dateLabel ?? journal.date}</td>
                          <td>{journal.time}</td>
                          <td>{journal.meeting ?? journal.meetingNumber}</td>
                          <td className="journal-material-cell"><strong>{journal.material ?? journal.materialTitle}</strong><small>{journal.chapter}</small></td>
                          <td className="journal-activity-cell">
                            <ul>{activities.slice(0, 3).map((activity, itemIndex) => <li key={`${activity}-${itemIndex}`}>{activity}</li>)}</ul>
                          </td>
                          <td><span className="journal-method-badge">{journal.method}</span></td>
                          <td><span className="journal-media-badge">{journal.media}</span></td>
                          <td className="journal-attendance-cell"><strong>{attendance.present}/{attendance.total}</strong><small className={attendance.percentage < 80 ? 'warning' : ''}>{attendance.percentageLabel}</small></td>
                          <td><JournalStatus journal={journal} /></td>
                          <td>
                            <div className="journal-row-actions">
                              <button aria-label={`Lihat jurnal ${journal.material}`} onClick={() => setDetailJournal(journal)} title="Lihat detail" type="button"><Icon name="eye" /></button>
                              <button aria-label={`Edit jurnal ${journal.material}`} onClick={() => openEdit(journal)} title="Edit jurnal" type="button"><Icon name="edit" /></button>
                              <button aria-label={`Menu jurnal ${journal.material}`} onClick={() => onNotify('Pilihan aksi jurnal siap digunakan.')} title="Aksi lainnya" type="button"><Icon name="more" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <MasterPagination
                currentPage={safeCurrentPage}
                itemLabel="jurnal"
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }}
                rowsPerPage={rowsPerPage}
                totalItems={filteredJournals.length}
                totalPages={totalPages}
              />
            </>
          ) : (
            <EmptyState className="journal-empty-state">
              <span><Icon name="journal" /></span>
              <h3>{query ? 'Jurnal tidak ditemukan' : 'Belum ada jurnal mengajar'}</h3>
              <p>{query ? 'Coba ubah filter atau kata pencarian.' : 'Catat kegiatan pembelajaran pada pertemuan ini.'}</p>
              <Button className="journal-button journal-button-primary" onClick={() => openCreate()}><Icon name="plus" />Tambah Jurnal</Button>
            </EmptyState>
          )}

          <div className="journal-information-note">
            <Icon name="info" />
            <div><strong>Informasi</strong><span>Jurnal mengajar menjadi catatan aktivitas pembelajaran; informasi kehadiran hanya merupakan ringkasan dari Absensi.</span></div>
          </div>
        </section>

        <aside className="journal-side-panels" aria-label="Informasi pendukung jurnal">
          <TodaySchedulePanel journals={journals} onCreate={openCreate} onOpen={setDetailJournal} />
          <MonthlySummaryPanel contextual={contextualSummary} filters={filters} journals={contextJournals} />
          <RecentActivityPanel activities={recentActivities} onNotify={onNotify} />
        </aside>
      </div>

      {formModal && (
        <JournalFormModal
          initialData={formModal.data}
          journals={journals}
          mode={formModal.mode}
          onClose={() => setFormModal(null)}
          onOpenDuplicate={(journal) => { setFormModal(null); setDetailJournal(journal) }}
          onSave={saveJournal}
          options={journalOptions}
        />
      )}
      {detailJournal && <JournalDetailModal journal={detailJournal} onClose={() => setDetailJournal(null)} onEdit={openEdit} />}
    </div>
  )
}

export default JournalMainView
