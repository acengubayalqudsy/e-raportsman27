import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import {
  academicAnnouncements,
  scheduleOptions,
  todaySchedule,
  todayScheduleMeta,
  weeklySchedule,
} from '../../data/akademik.js'
import scheduleService from '../../services/scheduleService.js'
import AcademicModal from './AcademicModal.jsx'
import AcademicSummary from './AcademicSummary.jsx'

const DEFAULT_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

function normalizeOption(option) {
  if (typeof option === 'string') return { label: option, value: option }
  return { label: option.label ?? option.value, value: option.value ?? option.label }
}

function SelectField({ label, onChange, options = [], value }) {
  return (
    <label className="academic-filter-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map(normalizeOption).map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function ScheduleCell({ className, day, item, onOpen, time }) {
  if (!item) return <span className="academic-schedule-empty">-</span>

  return (
    <button
      aria-label={`Lihat detail ${item.subject} hari ${day}`}
      className={`academic-schedule-cell ${className ?? ''}`}
      onClick={() => onOpen({ ...item, day: item.day ?? day, time: item.time ?? time })}
      type="button"
    >
      <strong>{item.subject}</strong>
      <span>{item.teacher}</span>
      {item.room && <small>{item.room}</small>}
    </button>
  )
}

function TodaySchedulePanel({ items, onOpen, onViewAll }) {
  return (
    <section className="academic-side-card academic-today-card">
      <header className="academic-side-card-header">
        <h3>Jadwal Hari Ini</h3>
        <span><Icon name="calendar" />{todayScheduleMeta.dateLabel}</span>
      </header>

      <div className="academic-today-list">
        {items.length ? items.map((item) => (
          <button
            className={`academic-today-item ${item.type ?? ''}`}
            key={item.id}
            onClick={() => item.type !== 'break' && onOpen({ ...item, day: item.day ?? todayScheduleMeta.day })}
            type="button"
          >
            <time>{item.time}</time>
            <span className="academic-today-copy">
              <strong>{item.subject}</strong>
              {item.type !== 'break' && (
                <small>{item.className}<i aria-hidden="true">•</i>{item.teacher}</small>
              )}
            </span>
            {item.room && <em className={item.room.toLowerCase().includes('lab') ? 'lab' : ''}>{item.room}</em>}
          </button>
        )) : (
          <EmptyState className="academic-side-empty">
            <Icon name="calendar" />
            <p>Tidak ada jadwal yang sesuai.</p>
          </EmptyState>
        )}
      </div>

      <button className="academic-side-footer-action" onClick={onViewAll} type="button">
        Lihat Jadwal Lengkap <Icon name="arrowRight" />
      </button>
    </section>
  )
}

function AnnouncementPanel({ items, onAction }) {
  return (
    <section className="academic-side-card academic-announcement-card">
      <header className="academic-side-card-header">
        <h3><Icon name="megaphone" />Pengumuman Akademik</h3>
        <button onClick={() => onAction('Daftar semua pengumuman dibuka.')} type="button">Lihat Semua</button>
      </header>

      <div className="academic-announcement-list">
        {items.map((item) => (
          <button className="academic-announcement-item" key={item.id} onClick={() => onAction(item.title)} type="button">
            <span className="academic-announcement-icon"><Icon name="megaphone" /></span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <time><b>{item.dateDay}</b>{item.dateMonth}</time>
          </button>
        ))}
      </div>

      <button className="academic-side-footer-action" onClick={() => onAction('Pengumuman akademik lainnya dibuka.')} type="button">
        Lihat Pengumuman Lainnya <Icon name="arrowRight" />
      </button>
    </section>
  )
}

function ScheduleDetail({ item, onClose, onEdit }) {
  if (!item) return null

  const details = [
    ['Mata Pelajaran', item.subject],
    ['Guru', item.teacher],
    ['Kelas', item.className],
    ['Hari', item.day],
    ['Jam', item.time],
    ['Ruangan', item.room],
  ]

  return (
    <AcademicModal description={`${item.day ?? ''}${item.time ? `, ${item.time}` : ''}`} onClose={onClose} title="Detail Jadwal">
      <div className="academic-schedule-detail">
        <span className="academic-schedule-detail-icon"><Icon name="calendar" /></span>
        <dl>
          {details.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>
          ))}
        </dl>
      </div>
      <footer className="academic-modal-footer">
        <Button className="academic-button secondary" onClick={() => onEdit(item)}><Icon name="edit" />Edit Jadwal</Button>
        <Button className="academic-button primary" onClick={onClose}>Tutup</Button>
      </footer>
    </AcademicModal>
  )
}

function ScheduleFormModal({ initialData = null, onClose, onSave, options = {} }) {
  const isEdit = Boolean(initialData?.id && typeof initialData.id === 'number')

  const fallbackClasses = [
    { id: 1, name: 'X Merdeka 1', code: 'X-1' },
    { id: 2, name: 'X Merdeka 2', code: 'X-2' },
    { id: 3, name: 'X Merdeka 3', code: 'X-3' },
  ]
  const fallbackSubjects = [
    { id: 1, name: 'Bahasa Indonesia', code: 'BIN' },
    { id: 2, name: 'Matematika', code: 'MAT' },
    { id: 3, name: 'Fisika', code: 'FIS' },
  ]
  const fallbackTeachers = [
    { id: 1, name: 'Asep Hidayat, S.Pd.', nip: '198106052006041005' },
    { id: 2, name: 'Budi Santoso, M.Pd.', nip: '197503122000031002' },
  ]
  const fallbackRooms = [
    { id: 1, name: 'Ruang Kelas X-1', code: 'R-X-1' },
    { id: 2, name: 'Ruang Kelas X-2', code: 'R-X-2' },
    { id: 3, name: 'Ruang Kelas XI-1', code: 'R-XI-1' },
    { id: 4, name: 'Ruang Kelas XII-1', code: 'R-XII-1' },
    { id: 5, name: 'Laboratorium Komputer', code: 'LAB-KOMP' },
    { id: 6, name: 'Laboratorium IPA', code: 'LAB-IPA' },
    { id: 7, name: 'Perpustakaan Utama', code: 'PERPUS' },
    { id: 8, name: 'Aula Serbaguna', code: 'AULA' },
  ]

  const classList = options.classes?.length ? options.classes : fallbackClasses
  const subjectList = options.subjects?.length ? options.subjects : fallbackSubjects
  const teacherList = options.teachers?.length ? options.teachers : fallbackTeachers
  const roomList = options.rooms?.length ? options.rooms : fallbackRooms

  const [formData, setFormData] = useState({
    academic_year_id: initialData?.academic_year_id || options.selectedYear?.id || 1,
    semester_id: initialData?.semester_id || options.selectedSemester?.id || 1,
    class_id: initialData?.class_id || classList[0]?.id || '',
    subject_id: initialData?.subject_id || subjectList[0]?.id || '',
    teacher_id: initialData?.teacher_id || teacherList[0]?.id || '',
    room_id: initialData?.room_id || roomList[0]?.id || '',
    day_of_week: initialData?.day || initialData?.day_of_week || 'Senin',
    start_time: initialData?.start_time ? initialData.start_time.substring(0, 5) : '07:30',
    end_time: initialData?.end_time ? initialData.end_time.substring(0, 5) : '09:00',
    status: initialData?.status || 'Aktif',
    notes: initialData?.notes || '',
  })

  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errorMessage) setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (formData.start_time >= formData.end_time) {
      setErrorMessage('Jam mulai harus lebih awal daripada jam selesai.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        academic_year_id: Number(formData.academic_year_id) || options.selectedYear?.id || 1,
        semester_id: Number(formData.semester_id) || options.selectedSemester?.id || 1,
        class_id: Number(formData.class_id) || Number(classList[0]?.id) || 1,
        subject_id: Number(formData.subject_id) || Number(subjectList[0]?.id) || 1,
        teacher_id: Number(formData.teacher_id) || Number(teacherList[0]?.id) || 1,
        room_id: Number(formData.room_id) || Number(roomList[0]?.id) || 1,
      }

      const res = await onSave(payload)
      if (res && !res.success) {
        setErrorMessage(res.error || 'Terjadi bentrok jadwal pada guru, kelas, atau ruangan.')
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat menyimpan jadwal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AcademicModal
      description={isEdit ? 'Perbarui sesi jadwal pembelajaran.' : 'Tambah sesi jadwal pelajaran baru ke sistem dengan validasi bentrok otomatis.'}
      onClose={onClose}
      title={isEdit ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
      wide
    >
      <form className="academic-entity-form" onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="academic-conflict-alert" role="alert">
            <Icon name="info" />
            <div>
              <strong>Validasi / Bentrok Jadwal:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="academic-form-grid">
          <label>
            <span>Kelas / Rombel <b>*</b></span>
            <select
              required
              value={formData.class_id || classList[0]?.id}
              onChange={(e) => handleChange('class_id', e.target.value)}
            >
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name || c.code}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Mata Pelajaran <b>*</b></span>
            <select
              required
              value={formData.subject_id || subjectList[0]?.id}
              onChange={(e) => handleChange('subject_id', e.target.value)}
            >
              {subjectList.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </label>

          <label>
            <span>Guru Pengajar <b>*</b></span>
            <select
              required
              value={formData.teacher_id || teacherList[0]?.id}
              onChange={(e) => handleChange('teacher_id', e.target.value)}
            >
              {teacherList.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.nip ? `(${t.nip})` : ''}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Ruangan <b>*</b></span>
            <select
              required
              value={formData.room_id || roomList[0]?.id}
              onChange={(e) => handleChange('room_id', e.target.value)}
            >
              {roomList.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </label>

          <label>
            <span>Hari <b>*</b></span>
            <select
              required
              value={formData.day_of_week}
              onChange={(e) => handleChange('day_of_week', e.target.value)}
            >
              {DEFAULT_DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Status <b>*</b></span>
            <select
              required
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </label>

          <label>
            <span>Jam Mulai <b>*</b></span>
            <input
              required
              type="time"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
            />
          </label>

          <label>
            <span>Jam Selesai <b>*</b></span>
            <input
              required
              type="time"
              value={formData.end_time}
              onChange={(e) => handleChange('end_time', e.target.value)}
            />
          </label>

          <label className="full-width">
            <span>Catatan / Keterangan</span>
            <input
              placeholder="Contoh: Pembelajaran di ruang laboratorium"
              type="text"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </label>
        </div>

        <footer className="academic-modal-footer">
          <Button className="academic-button secondary" disabled={isSubmitting} onClick={onClose} type="button">
            Batal
          </Button>
          <Button className="academic-button primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
          </Button>
        </footer>
      </form>
    </AcademicModal>
  )
}

function AcademicScheduleView({ onNotify }) {
  const classOptions = scheduleOptions.classes ?? []
  const gradeOptions = scheduleOptions.grades ?? []
  const semesterOptions = scheduleOptions.semesters ?? []
  const dayOptions = scheduleOptions.days ?? ['Semua Hari', ...DEFAULT_DAYS]
  const scheduleDays = weeklySchedule.days ?? DEFAULT_DAYS

  const [selectedClass, setSelectedClass] = useState(weeklySchedule.className ?? normalizeOption(classOptions[0] ?? '').value)
  const [selectedGrade, setSelectedGrade] = useState(normalizeOption(gradeOptions[0] ?? 'X').value)
  const [selectedSemester, setSelectedSemester] = useState(weeklySchedule.semester ?? normalizeOption(semesterOptions[0] ?? '').value)
  const [selectedDay, setSelectedDay] = useState(normalizeOption(dayOptions[0] ?? 'Semua Hari').value)
  const [query, setQuery] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInitialData, setModalInitialData] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // API State
  const [apiOptions, setApiOptions] = useState({
    academic_years: [],
    semesters: [],
    classes: [],
    subjects: [],
    teachers: [],
    rooms: [],
    course_assignments: [],
    selectedYear: null,
    selectedSemester: null,
  })
  const [apiSchedules, setApiSchedules] = useState([])

  const notify = (message) => {
    onNotify?.(message)
  }

  // Fetch options from API
  useEffect(() => {
    let isMounted = true
    scheduleService
      .getOptions()
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setApiOptions(res.data)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  // Fetch real schedules from API
  useEffect(() => {
    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      scheduleService
        .getSchedules({ per_page: 100 })
        .then((res) => {
          if (!isMounted) return
          if (res.success && Array.isArray(res.data)) {
            setApiSchedules(res.data)
          }
        })
        .catch(() => {})
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [refreshTrigger])

  const selectClass = (className) => {
    setSelectedClass(className)
    setSelectedGrade(className.split(' ')[0])
  }

  const selectGrade = (grade) => {
    setSelectedGrade(grade)
    const matchingClass = classOptions
      .map(normalizeOption)
      .find((option) => option.value.split(' ')[0] === grade)
    if (matchingClass) setSelectedClass(matchingClass.value)
  }

  const visibleDays = selectedDay === 'Semua Hari' ? scheduleDays : scheduleDays.filter((day) => day === selectedDay)
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const contextMatches = selectedClass === weeklySchedule.className
    && (!weeklySchedule.semester || selectedSemester === weeklySchedule.semester)
    && (!selectedGrade || selectedClass.startsWith(selectedGrade))

  // Build rows combining weekly base schedule and any newly created real schedules
  const effectiveRows = useMemo(() => {
    // If we have schedules for this class in API, we overlay them
    const classSchedules = apiSchedules.filter((s) => {
      const clsName = s.school_class?.name || s.class_name
      return clsName === selectedClass
    })

    if (!classSchedules.length) {
      return weeklySchedule.rows
    }

    return weeklySchedule.rows.map((row) => {
      if (row.isBreak) return row
      const [start, end] = (row.time || '').split(' - ')
      const updatedSlots = { ...(row.slots || {}) }

      classSchedules.forEach((sched) => {
        const sStart = sched.start_time?.substring(0, 5)
        const sEnd = sched.end_time?.substring(0, 5)
        if (sStart && sEnd && start && end && (sStart < end) && (sEnd > start)) {
          updatedSlots[sched.day_of_week] = {
            id: sched.id,
            subject: sched.subject?.name || sched.subject_name,
            teacher: sched.teacher?.name || sched.teacher_name,
            room: sched.room?.name || sched.room_name,
            className: sched.school_class?.name || sched.class_name,
            day: sched.day_of_week,
            time: `${sStart} - ${sEnd}`,
          }
        }
      })

      return {
        ...row,
        slots: updatedSlots,
      }
    })
  }, [apiSchedules, selectedClass])

  const visibleRows = !contextMatches
    ? []
    : !normalizedQuery
      ? effectiveRows
      : effectiveRows.filter((row) => row.isBreak || visibleDays.some((day) => {
          const item = row.slots?.[day]
          return item && `${item.subject} ${item.teacher} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
        }))

  const visibleTodaySchedule = !contextMatches || (selectedDay !== 'Semua Hari' && selectedDay !== todayScheduleMeta.day)
    ? []
    : todaySchedule.filter((item) => {
        if (item.type === 'break' || !normalizedQuery) return true
        return `${item.subject} ${item.teacher} ${item.className} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
      })

  const cellMatches = (item) => {
    if (!item || !normalizedQuery) return true
    return `${item.subject} ${item.teacher} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
  }

  // Summary cards with proper tone and icons
  const summaryCards = useMemo(() => {
    const totalClasses = apiOptions.classes?.length || 18
    const totalSubjects = apiOptions.subjects?.length || 24
    const totalTeachers = apiOptions.teachers?.length || 87

    return [
      {
        title: 'Total Kelas',
        value: String(totalClasses),
        caption: 'Rombel Aktif',
        icon: 'calendar',
        tone: 'green',
      },
      {
        title: 'Total Mata Pelajaran',
        value: String(totalSubjects),
        caption: 'Mapel Aktif',
        icon: 'book',
        tone: 'blue',
      },
      {
        title: 'Total Guru',
        value: String(totalTeachers),
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
  }, [apiOptions])

  const handleSaveSchedule = async (payload) => {
    if (modalInitialData?.id && typeof modalInitialData.id === 'number') {
      const res = await scheduleService.updateSchedule(modalInitialData.id, payload)
      if (res.success) {
        notify('Jadwal berhasil diperbarui.')
        setIsModalOpen(false)
        setRefreshTrigger((prev) => prev + 1)
        return { success: true }
      }
      return res
    }

    const res = await scheduleService.createSchedule(payload)
    if (res.success) {
      notify('Jadwal baru berhasil ditambahkan.')
      setIsModalOpen(false)
      setRefreshTrigger((prev) => prev + 1)
      return { success: true }
    }
    return res
  }

  return (
    <div className="academic-schedule-view">
      <AcademicSummary items={summaryCards} />

      <section className="academic-filter-card" aria-label="Filter jadwal pelajaran">
        <div className="academic-filter-row">
          <div className="academic-filter-fields">
            <SelectField label="Kelas" onChange={selectClass} options={classOptions} value={selectedClass} />
            <SelectField label="Tingkat" onChange={selectGrade} options={gradeOptions} value={selectedGrade} />
            <SelectField label="Semester" onChange={setSelectedSemester} options={semesterOptions} value={selectedSemester} />
            <SelectField label="Hari" onChange={setSelectedDay} options={dayOptions} value={selectedDay} />
          </div>

          <label className="academic-schedule-search">
            <SearchInput
              aria-label="Cari mata pelajaran atau guru"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari mata pelajaran / guru..."
              value={query}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="academic-filter-actions">
          <Button
            className="academic-button secondary"
            onClick={() => {
              setRefreshTrigger((prev) => prev + 1)
              notify('Jadwal berhasil disegarkan dari server.')
            }}
          >
            <Icon name="refresh" />Segarkan
          </Button>
          <Button className="academic-button secondary" onClick={() => notify('Filter lanjutan siap digunakan.')}><Icon name="filter" />Filter Lanjutan</Button>
          <Button className="academic-button secondary" onClick={() => notify('Jadwal berhasil disiapkan untuk ekspor.')}><Icon name="download" />Ekspor Jadwal</Button>
          <Button className="academic-button secondary" onClick={() => notify('Jadwal berhasil disiapkan untuk dicetak.')}><Icon name="printer" />Cetak Jadwal</Button>
          <Button
            className="academic-button primary"
            onClick={() => {
              setModalInitialData(null)
              setIsModalOpen(true)
            }}
          >
            <Icon name="plus" />Tambah Jadwal
          </Button>
        </div>
      </section>

      <div className="academic-schedule-layout">
        <section className="academic-schedule-card">
          <header className="academic-schedule-card-header">
            <h2>Jadwal Pelajaran - {selectedClass}</h2>
          </header>

          {visibleRows.length ? (
            <div className="academic-weekly-scroll">
              <table className="academic-weekly-table">
                <thead>
                  <tr>
                    <th>Jam</th>
                    {visibleDays.map((day) => <th key={day}>{day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, rIdx) => (
                    <tr className={row.isBreak ? 'academic-break-row' : ''} key={row.id || `row-${rIdx}`}>
                      <th scope="row">
                        <strong>{row.period}</strong>
                        <span>{row.time}</span>
                      </th>
                      {visibleDays.map((day) => {
                        const item = row.slots?.[day]
                        if (row.isBreak) return <td key={day}><span className="academic-break-label">{item?.subject ?? 'Istirahat'}</span></td>
                        return <td key={day}><ScheduleCell className={!cellMatches(item) ? 'muted' : ''} day={day} item={cellMatches(item) ? item : null} onOpen={setSelectedSchedule} time={row.time} /></td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState className="academic-schedule-empty-state">
              <Icon name="calendar" />
              <h3>Jadwal tidak ditemukan</h3>
              <p>Ubah filter kelas, semester, hari, atau kata pencarian.</p>
            </EmptyState>
          )}

          <div className="academic-schedule-note"><Icon name="info" /><strong>Catatan:</strong> Jadwal dapat berubah sewaktu-waktu sesuai kebijakan sekolah.</div>
        </section>

        <aside className="academic-schedule-sidebar">
          <TodaySchedulePanel items={visibleTodaySchedule} onOpen={setSelectedSchedule} onViewAll={() => notify('Jadwal lengkap ditampilkan pada tabel mingguan.')} />
          <AnnouncementPanel items={academicAnnouncements} onAction={notify} />
        </aside>
      </div>

      <ScheduleDetail
        item={selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        onEdit={(item) => {
          setSelectedSchedule(null)
          setModalInitialData(item)
          setIsModalOpen(true)
        }}
      />

      {isModalOpen && (
        <ScheduleFormModal
          initialData={modalInitialData}
          onClose={() => {
            setIsModalOpen(false)
            setModalInitialData(null)
          }}
          onSave={handleSaveSchedule}
          options={apiOptions}
        />
      )}

    </div>
  )
}

export default AcademicScheduleView
