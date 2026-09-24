import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { academicAnnouncements } from '../../data/akademik.js'
import scheduleService from '../../services/scheduleService.js'
import AcademicModal from './AcademicModal.jsx'
import AcademicSummary from './AcademicSummary.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'

const DEFAULT_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

const BASE_SCHEDULE_SLOTS = [
  { period: 'Jam Ke-1', time: '07:00 - 07:45', start: '07:00', end: '07:45', isBreak: false },
  { period: 'Jam Ke-2', time: '07:45 - 08:30', start: '07:45', end: '08:30', isBreak: false },
  { period: 'Jam Ke-3', time: '08:30 - 09:15', start: '08:30', end: '09:15', isBreak: false },
  { period: 'Istirahat', time: '09:15 - 09:45', start: '09:15', end: '09:45', isBreak: true },
  { period: 'Jam Ke-4', time: '09:45 - 10:30', start: '09:45', end: '10:30', isBreak: false },
  { period: 'Jam Ke-5', time: '10:30 - 11:15', start: '10:30', end: '11:15', isBreak: false },
  { period: 'Jam Ke-6', time: '11:15 - 12:00', start: '11:15', end: '12:00', isBreak: false },
  { period: 'Istirahat', time: '12:00 - 12:45', start: '12:00', end: '12:45', isBreak: true },
  { period: 'Jam Ke-7', time: '12:45 - 13:30', start: '12:45', end: '13:30', isBreak: false },
  { period: 'Jam Ke-8', time: '13:30 - 14:15', start: '13:30', end: '14:15', isBreak: false },
]

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

function TodaySchedulePanel({ dateLabel, items, onOpen, onViewAll }) {
  return (
    <section className="academic-side-card academic-today-card">
      <header className="academic-side-card-header">
        <h3>Jadwal Hari Ini</h3>
        <span><Icon name="calendar" />{dateLabel}</span>
      </header>

      <div className="academic-today-list">
        {items.length ? items.map((item) => (
          <button
            className={`academic-today-item ${item.type ?? ''}`}
            key={item.id}
            onClick={() => item.type !== 'break' && onOpen({ ...item, day: item.day })}
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
            <p>Tidak ada jadwal pembelajaran pada hari ini.</p>
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
          <button
            className="academic-announcement-item"
            key={item.id}
            onClick={() => onAction(`Pengumuman: ${item.title}`)}
            type="button"
          >
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
    ['Status', item.status || 'Aktif'],
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

  const classList = options.classes || []
  const subjectList = options.subjects || []
  const teacherList = options.teachers || []
  const roomList = options.rooms || []
  const caList = options.course_assignments || []

  const activeYearId = options.selectedYear?.id || options.academic_years?.find((y) => y.status === 'Aktif')?.id || 1
  const activeSemesterId = options.selectedSemester?.id || options.semesters?.find((s) => s.status === 'Aktif')?.id || 1

  const [formData, setFormData] = useState({
    academic_year_id: initialData?.academic_year_id || activeYearId,
    semester_id: initialData?.semester_id || activeSemesterId,
    class_id: initialData?.class_id || classList[0]?.id || '',
    subject_id: initialData?.subject_id || subjectList[0]?.id || '',
    teacher_id: initialData?.teacher_id || teacherList[0]?.id || '',
    room_id: initialData?.room_id || roomList[0]?.id || '',
    course_assignment_id: initialData?.course_assignment_id || '',
    day_of_week: initialData?.day || initialData?.day_of_week || 'Senin',
    start_time: initialData?.start_time ? initialData.start_time.substring(0, 5) : '07:30',
    end_time: initialData?.end_time ? initialData.end_time.substring(0, 5) : '09:00',
    status: initialData?.status || 'Aktif',
    notes: initialData?.notes || '',
  })

  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value }

      // Auto-resolve matching course assignment if teacher, subject, class are selected
      if (key === 'class_id' || key === 'subject_id' || key === 'teacher_id') {
        const cId = Number(key === 'class_id' ? value : next.class_id)
        const sId = Number(key === 'subject_id' ? value : next.subject_id)
        const tId = Number(key === 'teacher_id' ? value : next.teacher_id)
        const matchingCa = caList.find(
          (ca) => Number(ca.class_id) === cId && Number(ca.subject_id) === sId && Number(ca.teacher_id) === tId
        )
        if (matchingCa) {
          next.course_assignment_id = matchingCa.id
        }
      }

      return next
    })
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
        academic_year_id: Number(formData.academic_year_id),
        semester_id: Number(formData.semester_id),
        class_id: Number(formData.class_id),
        subject_id: Number(formData.subject_id),
        teacher_id: Number(formData.teacher_id),
        room_id: Number(formData.room_id),
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: formData.status || 'Aktif',
        notes: formData.notes || '',
      }

      if (formData.course_assignment_id) {
        payload.course_assignment_id = Number(formData.course_assignment_id)
      }

      const res = await onSave(payload)
      if (res && !res.success) {
        const msg = res.error || (res.errors ? Object.values(res.errors).flat().join(' ') : 'Terjadi bentrok jadwal pada guru, kelas, atau ruangan.')
        setErrorMessage(msg)
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
        <div style={{ background: '#f8fafc', padding: '0.625rem 0.875rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem', color: '#475569', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Icon name="info" />
          <span>Tahun Ajaran: <strong>{options.selectedYear?.name ?? '-'}</strong> | Semester: <strong>{options.selectedSemester?.name ?? '-'}</strong></span>
        </div>

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
              onChange={(e) => handleChange('class_id', e.target.value)}
              required
              value={formData.class_id}
            >
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Mata Pelajaran <b>*</b></span>
            <select
              onChange={(e) => handleChange('subject_id', e.target.value)}
              required
              value={formData.subject_id}
            >
              {subjectList.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </label>

          <label>
            <span>Guru Pengajar <b>*</b></span>
            <select
              onChange={(e) => handleChange('teacher_id', e.target.value)}
              required
              value={formData.teacher_id}
            >
              {teacherList.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.nip ? `(${t.nip})` : ''}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Ruangan <b>*</b></span>
            <select
              onChange={(e) => handleChange('room_id', e.target.value)}
              required
              value={formData.room_id}
            >
              {roomList.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </label>

          <label>
            <span>Hari <b>*</b></span>
            <select
              onChange={(e) => handleChange('day_of_week', e.target.value)}
              required
              value={formData.day_of_week}
            >
              {DEFAULT_DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Status <b>*</b></span>
            <select
              onChange={(e) => handleChange('status', e.target.value)}
              required
              value={formData.status}
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </label>

          <label>
            <span>Jam Mulai <b>*</b></span>
            <input
              onChange={(e) => handleChange('start_time', e.target.value)}
              required
              type="time"
              value={formData.start_time}
            />
          </label>

          <label>
            <span>Jam Selesai <b>*</b></span>
            <input
              onChange={(e) => handleChange('end_time', e.target.value)}
              required
              type="time"
              value={formData.end_time}
            />
          </label>

          <label className="full-width">
            <span>Catatan / Keterangan</span>
            <input
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Contoh: Pembelajaran di ruang laboratorium"
              type="text"
              value={formData.notes}
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
  const {
    academicYears,
    semesters,
    activeAcademicYear,
    activeSemester,
    selectedAcademicYearId,
    selectedSemesterId,
  } = useAcademicContext()

  const currentYearObj = academicYears?.find((y) => Number(y.id) === Number(selectedAcademicYearId)) || activeAcademicYear || academicYears?.[0]
  const currentSemesterObj = semesters?.find((s) => Number(s.id) === Number(selectedSemesterId)) || activeSemester || semesters?.[0]

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

  const classOptions = useMemo(() => {
    return apiOptions.classes?.length ? apiOptions.classes.map((c) => c.name) : []
  }, [apiOptions.classes])

  const gradeOptions = ['Semua Tingkat', 'X', 'XI', 'XII']
  const semesterOptions = useMemo(() => {
    return apiOptions.semesters?.length ? apiOptions.semesters.map((s) => s.name) : ['Ganjil', 'Genap']
  }, [apiOptions.semesters])

  const dayOptions = ['Semua Hari', ...DEFAULT_DAYS]

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('Semua Tingkat')
  const [selectedSemester, setSelectedSemester] = useState('Ganjil')
  const [selectedDay, setSelectedDay] = useState('Semua Hari')
  const [query, setQuery] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInitialData, setModalInitialData] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const notify = (message) => {
    onNotify?.(message)
  }

  // Fetch options from API
  useEffect(() => {
    let isMounted = true
    scheduleService
      .getOptions({ academic_year_id: selectedAcademicYearId, semester_id: selectedSemesterId })
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setApiOptions(res.data)
          if (res.data.classes?.length && !selectedClass) {
            setSelectedClass(res.data.classes[0].name)
          }
          if (res.data.selectedSemester?.name) {
            setSelectedSemester(res.data.selectedSemester.name)
          }
        }
      })
      .catch((err) => console.error('Failed to load schedule options:', err))

    return () => {
      isMounted = false
    }
  }, [refreshTrigger, selectedClass, selectedAcademicYearId, selectedSemesterId])

  // Fetch real schedules from API
  useEffect(() => {
    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      scheduleService
        .getSchedules({ per_page: 100, academic_year_id: selectedAcademicYearId, semester_id: selectedSemesterId })
        .then((res) => {
          if (!isMounted) return
          if (res.success && Array.isArray(res.data)) {
            setApiSchedules(res.data)
          }
        })
        .catch((err) => console.error('Failed to load schedules:', err))
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [refreshTrigger, selectedAcademicYearId, selectedSemesterId])

  const selectClass = (className) => {
    setSelectedClass(className)
    const gradePart = className.split(' ')[0]
    if (['X', 'XI', 'XII'].includes(gradePart)) {
      setSelectedGrade(gradePart)
    }
  }

  const selectGrade = (grade) => {
    setSelectedGrade(grade)
    if (grade !== 'Semua Tingkat') {
      const matchingClass = classOptions.find((cName) => cName.startsWith(grade))
      if (matchingClass) setSelectedClass(matchingClass)
    }
  }

  const visibleDays = selectedDay === 'Semua Hari' ? DEFAULT_DAYS : DEFAULT_DAYS.filter((day) => day === selectedDay)
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')

  // Build rows combining slots and real schedules from database
  const effectiveRows = useMemo(() => {
    const classSchedules = apiSchedules.filter((s) => {
      const clsName = s.school_class?.name || s.class_name || ''
      return !selectedClass || clsName === selectedClass
    })

    return BASE_SCHEDULE_SLOTS.map((slot, index) => {
      if (slot.isBreak) {
        return {
          id: `break-${index}`,
          period: slot.period,
          time: slot.time,
          isBreak: true,
          slots: {},
        }
      }

      const slots = {}
      DEFAULT_DAYS.forEach((day) => {
        const matchingSched = classSchedules.find((sched) => {
          if (sched.day_of_week !== day) return false
          const sStart = sched.start_time?.substring(0, 5)
          const sEnd = sched.end_time?.substring(0, 5)
          return sStart && sEnd && sStart < slot.end && sEnd > slot.start
        })

        if (matchingSched) {
          slots[day] = {
            id: matchingSched.id,
            subject: matchingSched.subject?.name || matchingSched.subject_name || '-',
            teacher: matchingSched.teacher?.name || matchingSched.teacher_name || '-',
            room: matchingSched.room?.name || matchingSched.room_name || '-',
            className: matchingSched.school_class?.name || matchingSched.class_name || '-',
            day: matchingSched.day_of_week,
            time: `${matchingSched.start_time?.substring(0, 5)} - ${matchingSched.end_time?.substring(0, 5)}`,
            status: matchingSched.status,
            raw: matchingSched,
          }
        }
      })

      return {
        id: `slot-${index}`,
        period: slot.period,
        time: slot.time,
        isBreak: false,
        slots,
      }
    })
  }, [apiSchedules, selectedClass])

  const visibleRows = useMemo(() => {
    if (!normalizedQuery) return effectiveRows
    return effectiveRows.filter(
      (row) =>
        row.isBreak ||
        visibleDays.some((day) => {
          const item = row.slots?.[day]
          return item && `${item.subject} ${item.teacher} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
        })
    )
  }, [effectiveRows, normalizedQuery, visibleDays])

  const todayDay = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()] || 'Senin'
  const activeDayForToday = selectedDay === 'Semua Hari' ? todayDay : selectedDay

  const visibleTodaySchedule = useMemo(() => {
    const matched = apiSchedules.filter((s) => {
      const matchDay = s.day_of_week === activeDayForToday
      const clsName = s.school_class?.name || s.class_name || ''
      const matchClass = !selectedClass || clsName === selectedClass
      return matchDay && matchClass
    })

    return matched.map((s) => ({
      id: s.id,
      day: s.day_of_week,
      time: `${s.start_time?.substring(0, 5)} - ${s.end_time?.substring(0, 5)}`,
      subject: s.subject?.name || s.subject_name || '-',
      teacher: s.teacher?.name || s.teacher_name || '-',
      className: s.school_class?.name || s.class_name || '-',
      room: s.room?.name || s.room_name || '-',
      status: s.status,
      raw: s,
    }))
  }, [apiSchedules, activeDayForToday, selectedClass])

  const cellMatches = (item) => {
    if (!item || !normalizedQuery) return true
    return `${item.subject} ${item.teacher} ${item.room ?? ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
  }

  const summaryCards = useMemo(() => {
    const totalClasses = apiOptions.classes?.length || 0
    const totalSubjects = apiOptions.subjects?.length || 0
    const totalTeachers = apiOptions.teachers?.length || 0
    const totalSchedules = apiSchedules.length

    return [
      {
        title: 'Total Kelas',
        value: String(totalClasses),
        caption: 'Rombel Terdaftar',
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
        title: 'Total Sesi Jadwal',
        value: String(totalSchedules),
        caption: 'Sesi Terjadwal',
        icon: 'clock',
        tone: 'purple',
      },
      {
        title: 'Jadwal Terpublikasi',
        value: totalSchedules > 0 ? '100%' : '0%',
        caption: 'Sinkron Database',
        icon: 'checkCircle',
        tone: 'teal',
      },
    ]
  }, [apiOptions, apiSchedules])

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

  const currentDateLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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
          <Button className="academic-button secondary" onClick={() => notify('Filter lanjutan siap digunakan.')}>
            <Icon name="filter" />Filter Lanjutan
          </Button>
          <Button className="academic-button secondary" onClick={() => notify('Jadwal berhasil disiapkan untuk ekspor.')}>
            <Icon name="download" />Ekspor Jadwal
          </Button>
          <Button className="academic-button secondary" onClick={() => notify('Jadwal berhasil disiapkan untuk dicetak.')}>
            <Icon name="printer" />Cetak Jadwal
          </Button>
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
            <h2>Jadwal Pelajaran - {selectedClass || 'Semua Kelas'}</h2>
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
                        return (
                          <td key={day}>
                            <ScheduleCell
                              className={!cellMatches(item) ? 'muted' : ''}
                              day={day}
                              item={cellMatches(item) ? item : null}
                              onOpen={setSelectedSchedule}
                              time={row.time}
                            />
                          </td>
                        )
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

          <div className="academic-schedule-note">
            <Icon name="info" /><strong>Catatan:</strong> Jadwal sinkron langsung dengan basis data pembelajaran sekolah.
          </div>
        </section>

        <aside className="academic-schedule-sidebar">
          <TodaySchedulePanel
            dateLabel={currentDateLabel}
            items={visibleTodaySchedule}
            onOpen={setSelectedSchedule}
            onViewAll={() => notify('Jadwal lengkap ditampilkan pada tabel mingguan.')}
          />
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
          options={{
            ...apiOptions,
            selectedYear: currentYearObj,
            selectedSemester: currentSemesterObj,
          }}
        />
      )}
    </div>
  )
}

export default AcademicScheduleView
