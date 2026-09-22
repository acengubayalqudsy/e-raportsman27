import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import assessmentService from '../../services/assessmentService.js'
import { extracurricularService } from '../../services/extracurricularService.js'

function ActivityModal({ children, description, onClose, title, wide = false }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    dialogRef.current?.focus()
    return () => previousFocus?.focus?.()
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') onClose()
  }

  return (
    <div
      className="activity-modal-backdrop"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <section
        aria-labelledby="activity-modal-title"
        aria-modal="true"
        className={`activity-modal${wide ? ' activity-modal-wide' : ''}`}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <header className="activity-modal-header">
          <div>
            <h3 id="activity-modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>
        {children}
      </section>
    </div>
  )
}

function ParticipationFormModal({
  availableExtracurriculars = [],
  availableStudents = [],
  defaultSemester = 'Ganjil',
  defaultYear = '2024/2025',
  initialData,
  isSaving = false,
  mode,
  onClose,
  onSave,
  participations = [],
}) {
  const [formData, setFormData] = useState(() => ({
    studentId: initialData?.studentId ? String(initialData.studentId) : (availableStudents[0]?.student_id ? String(availableStudents[0].student_id) : ''),
    extracurricularId: initialData?.extracurricularId ? String(initialData.extracurricularId) : (availableExtracurriculars[0]?.id ? String(availableExtracurriculars[0].id) : ''),
    academicYear: initialData?.academicYear ?? defaultYear,
    semester: initialData?.semester ?? defaultSemester,
    yearJoined: initialData?.yearJoined ?? '2024',
    status: initialData?.status ?? 'Aktif',
    predicate: initialData?.predicate ?? 'Baik',
    description: initialData?.description ?? '',
  }))
  const [error, setError] = useState('')

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formData.studentId || !formData.extracurricularId) {
      setError('Pilih siswa dan ekstrakurikuler terlebih dahulu.')
      return
    }

    if (!/^\d{4}$/.test(formData.yearJoined)) {
      setError('Tahun gabung harus terdiri dari 4 digit angka.')
      return
    }

    // Check duplicate participation for same student and extracurricular
    const selectedEkskul = availableExtracurriculars.find((e) => String(e.id) === String(formData.extracurricularId))
    const ekskulName = selectedEkskul?.name || ''

    const isDuplicate = participations.some((p) => (
      p.id !== initialData?.id
      && String(p.studentId) === String(formData.studentId)
      && (String(p.extracurricularId) === String(formData.extracurricularId) || p.extracurricular === ekskulName)
    ))

    if (isDuplicate) {
      setError('Siswa sudah terdaftar pada ekstrakurikuler ini.')
      return
    }

    onSave({
      ...formData,
      extracurricularName: ekskulName,
      supervisor: selectedEkskul?.supervisor || '-',
    })
  }

  return (
    <ActivityModal
      description="Data keikutsertaan akan disimpan secara permanen ke database sekolah."
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Keikutsertaan Ekstrakurikuler' : 'Tambah Keikutsertaan Ekstrakurikuler'}
    >
      <form className="activity-modal-form" onSubmit={handleSubmit}>
        {error && (
          <div className="activity-form-alert" role="alert">
            <Icon name="info" />
            <span>{error}</span>
          </div>
        )}

        <div className="activity-form-grid">
          <label className="activity-field activity-field-full">
            <span>Siswa <b>*</b></span>
            <select
              aria-label="Pilih siswa"
              disabled={mode === 'edit'}
              onChange={(event) => updateField('studentId', event.target.value)}
              value={formData.studentId}
            >
              <option value="">-- Pilih Siswa --</option>
              {availableStudents.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.nis} - {student.name} ({student.className || 'Siswa'})
                </option>
              ))}
            </select>
          </label>

          <label className="activity-field activity-field-full">
            <span>Ekstrakurikuler <b>*</b></span>
            <select
              aria-label="Pilih ekstrakurikuler"
              onChange={(event) => updateField('extracurricularId', event.target.value)}
              value={formData.extracurricularId}
            >
              <option value="">-- Pilih Ekstrakurikuler --</option>
              {availableExtracurriculars.map((ekskul) => (
                <option key={ekskul.id} value={ekskul.id}>
                  {ekskul.code ? `[${ekskul.code}] ` : ''}{ekskul.name} {ekskul.supervisor && ekskul.supervisor !== '-' ? `(Pembina: ${ekskul.supervisor})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="activity-field">
            <span>Tahun Ajaran</span>
            <input
              disabled
              readOnly
              type="text"
              value={formData.academicYear}
            />
          </label>

          <label className="activity-field">
            <span>Semester</span>
            <input
              disabled
              readOnly
              type="text"
              value={formData.semester}
            />
          </label>

          <label className="activity-field">
            <span>Tahun Gabung</span>
            <input
              inputMode="numeric"
              maxLength="4"
              onChange={(event) => updateField('yearJoined', event.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 2024"
              value={formData.yearJoined}
            />
          </label>

          <label className="activity-field">
            <span>Predikat / Capaian</span>
            <select
              onChange={(event) => updateField('predicate', event.target.value)}
              value={formData.predicate}
            >
              <option value="Sangat Baik">Sangat Baik</option>
              <option value="Baik">Baik</option>
              <option value="Cukup">Cukup</option>
              <option value="Kurang">Kurang</option>
            </select>
          </label>

          <label className="activity-field activity-field-full">
            <span>Catatan / Keterangan Pembina</span>
            <textarea
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Catatan perkembangan atau keikutsertaan siswa dalam kegiatan ekskul..."
              rows="2"
              value={formData.description}
            />
          </label>
        </div>

        <footer className="activity-modal-actions">
          <Button className="activity-button activity-button-secondary" disabled={isSaving} onClick={onClose} type="button">
            Batal
          </Button>
          <Button className="activity-button activity-button-primary" disabled={isSaving} type="submit">
            <Icon name="save" />
            {isSaving ? 'Menyimpan ke Database...' : mode === 'edit' ? 'Perbarui Keikutsertaan' : 'Simpan Keikutsertaan'}
          </Button>
        </footer>
      </form>
    </ActivityModal>
  )
}

function ParticipationDetailModal({ onClose, onEdit, participation, studentParticipations = [] }) {
  return (
    <ActivityModal
      description={`${participation.nis || '-'} - ${participation.className || 'Kelas'}`}
      onClose={onClose}
      title={participation.name}
      wide
    >
      <div className="activity-detail-content">
        <div className="activity-detail-grid">
          <div><span>Ekstrakurikuler</span><strong>{participation.extracurricular}</strong></div>
          <div><span>Pembina</span><strong>{participation.supervisor || '-'}</strong></div>
          <div><span>Tahun Ajaran</span><strong>{participation.academicYear || '-'}</strong></div>
          <div><span>Semester</span><strong>{participation.semester || '-'}</strong></div>
          <div><span>Predikat</span><strong>{participation.predicate || 'Baik'}</strong></div>
          <div><span>Status</span><strong>{participation.status || 'Aktif'}</strong></div>
        </div>

        {participation.description && (
          <div className="activity-detail-notes" style={{ marginTop: '16px' }}>
            <article>
              <h4>Keterangan / Deskripsi Kegiatan</h4>
              <p>{participation.description}</p>
            </article>
          </div>
        )}

        <section className="activity-detail-list">
          <div className="activity-detail-heading">
            <div>
              <h4>Semua Kegiatan Ekstrakurikuler Siswa Ini</h4>
              <p>{studentParticipations.length} kegiatan ekstrakurikuler tercatat di database.</p>
            </div>
          </div>
          {studentParticipations.map((item) => (
            <article key={item.id}>
              <span className="activity-detail-icon"><Icon name="award" /></span>
              <div>
                <strong>{item.extracurricular}</strong>
                <span>Predikat: {item.predicate || 'Baik'} · Pembina: {item.supervisor || '-'}</span>
              </div>
              <span className="activity-status activity-status-active">
                {item.status || 'Aktif'}
              </span>
            </article>
          ))}
        </section>
      </div>

      <footer className="activity-modal-actions">
        <Button className="activity-button activity-button-secondary" onClick={onClose} type="button">Tutup</Button>
        <Button className="activity-button activity-button-primary" onClick={onEdit} type="button">
          <Icon name="edit" />Edit Keikutsertaan
        </Button>
      </footer>
    </ActivityModal>
  )
}

function StudentParticipationView({ onNotify = () => {} }) {
  const [participations, setParticipations] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [availableExtracurriculars, setAvailableExtracurriculars] = useState([])
  const [context, setContext] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Filters & UI state
  const [filters, setFilters] = useState({
    className: 'Semua Kelas',
    academicYear: 'Semua Tahun',
    semester: 'Semua Semester',
    extracurricular: 'Semua Ekskul',
    status: 'Semua Status',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [modal, setModal] = useState(null)

  const classId = context?.homeroom_class?.id || context?.assigned_courses?.[0]?.class_id
  const semesterId = context?.active_semester?.id
  const activeYearName = context?.active_semester?.academic_year || '2024/2025'
  const activeSemesterName = context?.active_semester?.name || 'Ganjil'

  // 1. Fetch active extracurricular master list from MariaDB
  useEffect(() => {
    let isMounted = true
    extracurricularService
      .getExtracurriculars({ all: 1, status: 'Aktif' })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setAvailableExtracurriculars(res.data)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  // 2. Fetch context and real student extracurricular participations from MariaDB
  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        const ctxRes = await assessmentService.getContext()
        if (!isMounted) return

        if (!ctxRes.success || !ctxRes.data) {
          setFetchError('Gagal memuat konteks akademik dari server.')
          setIsLoading(false)
          return
        }

        setContext(ctxRes.data)
        const currentClassId = ctxRes.data.homeroom_class?.id || ctxRes.data.assigned_courses?.[0]?.class_id
        const currentSemesterId = ctxRes.data.active_semester?.id

        if (!currentClassId || !currentSemesterId) {
          setFetchError('Belum ada penugasan kelas atau semester aktif yang terhubung.')
          setIsLoading(false)
          return
        }

        // Fetch supplementary data (which includes student_extracurriculars)
        const suppRes = await assessmentService.getSupplementaryData(currentClassId, currentSemesterId)
        if (!isMounted) return

        if (suppRes.success && suppRes.data) {
          const studentList = suppRes.data.students || []
          const className = suppRes.data.class?.name || 'Kelas'
          const semesterName = suppRes.data.semester?.name || ctxRes.data.active_semester?.name || 'Ganjil'
          const academicYear = suppRes.data.semester?.academic_year || ctxRes.data.active_semester?.academic_year || '2024/2025'

          // Map students for form dropdowns
          const mappedStudents = studentList.map((st) => ({
            student_id: st.student_id,
            name: st.name,
            nis: st.nis,
            className,
          }))
          setAvailableStudents(mappedStudents)

          // Flatten participations from database
          const rows = []
          studentList.forEach((st) => {
            if (Array.isArray(st.extracurriculars) && st.extracurriculars.length > 0) {
              st.extracurriculars.forEach((ekskul, idx) => {
                rows.push({
                  id: `part-${st.student_id}-${ekskul.id || idx}-${ekskul.extracurricular_id || 'x'}`,
                  participationId: `EKS-${String(st.student_id).padStart(3, '0')}-${idx + 1}`,
                  studentId: st.student_id,
                  nis: st.nis,
                  name: st.name,
                  className,
                  extracurricular: ekskul.activity_name || ekskul.name || 'Ekstrakurikuler',
                  extracurricularId: ekskul.extracurricular_id,
                  supervisor: ekskul.supervisor || '-',
                  academicYear,
                  semester: semesterName,
                  yearJoined: '2024',
                  status: 'Aktif',
                  predicate: ekskul.predicate || 'Baik',
                  description: ekskul.description || '',
                  rawEkskul: ekskul,
                })
              })
            }
          })

          setParticipations(rows)
          setFetchError(null)
        } else {
          setFetchError(suppRes.error || 'Gagal mengambil data keikutsertaan siswa.')
        }
      } catch {
        if (isMounted) {
          setFetchError('Terjadi kesalahan jaringan saat menghubungi server.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  // Lookup map to get supervisor by extracurricular name or ID
  const supervisorMap = useMemo(() => {
    const map = {}
    availableExtracurriculars.forEach((e) => {
      if (e.id) map[e.id] = e.supervisor || '-'
      if (e.name) map[e.name] = e.supervisor || '-'
    })
    return map
  }, [availableExtracurriculars])

  // Attach supervisor to participations if missing
  const populatedParticipations = useMemo(() => {
    return participations.map((p) => {
      const supervisor = p.supervisor && p.supervisor !== '-'
        ? p.supervisor
        : supervisorMap[p.extracurricularId] || supervisorMap[p.extracurricular] || '-'
      return { ...p, supervisor }
    })
  }, [participations, supervisorMap])

  // Computed filter options
  const filterClassOptions = useMemo(() => {
    const classes = new Set(populatedParticipations.map((p) => p.className))
    if (availableStudents.length > 0) classes.add(availableStudents[0].className)
    return ['Semua Kelas', ...Array.from(classes).filter(Boolean)]
  }, [populatedParticipations, availableStudents])

  const filterExtracurricularOptions = useMemo(() => {
    const names = availableExtracurriculars.map((e) => e.name)
    return ['Semua Ekskul', ...names]
  }, [availableExtracurriculars])

  const filteredParticipations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return populatedParticipations.filter((participation) => {
      const matchesSearch = !query || [participation.nis, participation.name, participation.extracurricular]
        .some((value) => String(value || '').toLowerCase().includes(query))
      const matchesClass = filters.className === 'Semua Kelas' || participation.className === filters.className
      const matchesYear = filters.academicYear === 'Semua Tahun' || participation.academicYear === filters.academicYear
      const matchesSemester = filters.semester === 'Semua Semester' || participation.semester === filters.semester
      const matchesActivity = filters.extracurricular === 'Semua Ekskul' || participation.extracurricular === filters.extracurricular
      const matchesStatus = filters.status === 'Semua Status' || participation.status === filters.status

      return matchesSearch && matchesClass && matchesYear && matchesSemester && matchesActivity && matchesStatus
    })
  }, [filters, populatedParticipations, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredParticipations.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleParticipations = filteredParticipations.slice(startIndex, startIndex + rowsPerPage)

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
    setOpenMenuId(null)
  }

  // Save / update participation persisted to MariaDB
  const handleSaveParticipation = async (formData) => {
    if (!classId || !semesterId) {
      onNotify('Konteks kelas atau semester tidak valid.')
      return
    }

    setIsSaving(true)
    const targetStudentId = Number(formData.studentId)
    const student = availableStudents.find((s) => s.student_id === targetStudentId)

    // Get current activities for this student from participations state
    const currentStudentActivities = participations
      .filter((p) => p.studentId === targetStudentId)
      .map((p) => ({
        id: p.rawEkskul?.id,
        extracurricular_id: p.extracurricularId || null,
        activity_name: p.extracurricular,
        predicate: p.predicate || 'Baik',
        description: p.description || '',
      }))

    const activitiesToSave = modal?.type === 'edit'
      ? currentStudentActivities.map((act) => {
          const editingParticipation = modal.participation
          const matches = (editingParticipation.rawEkskul?.id && act.id === editingParticipation.rawEkskul.id)
            || (act.extracurricular_id && String(act.extracurricular_id) === String(editingParticipation.extracurricularId))
            || act.activity_name === editingParticipation.extracurricular

          if (matches) {
            return {
              extracurricular_id: Number(formData.extracurricularId) || null,
              activity_name: formData.extracurricularName,
              predicate: formData.predicate || 'Baik',
              description: formData.description || '',
            }
          }
          return act
        })
      : [
          ...currentStudentActivities,
          {
            extracurricular_id: Number(formData.extracurricularId) || null,
            activity_name: formData.extracurricularName,
            predicate: formData.predicate || 'Baik',
            description: formData.description || '',
          },
        ]

    const payload = [
      {
        student_id: targetStudentId,
        activities: activitiesToSave,
      },
    ]

    const res = await assessmentService.saveExtracurriculars(classId, semesterId, payload)
    setIsSaving(false)

    if (res.success) {
      setModal(null)
      setOpenMenuId(null)
      setRefreshTrigger((prev) => prev + 1)
      onNotify(`Keikutsertaan ${student?.name || 'siswa'} berhasil disimpan ke database.`)
    } else {
      onNotify(`Gagal menyimpan keikutsertaan: ${res.error}`)
    }
  }

  // Deactivate/delete participation persisted to MariaDB
  const handleDeleteParticipation = async (participation) => {
    if (!classId || !semesterId) return

    const targetStudentId = Number(participation.studentId)
    const remainingActivities = participations
      .filter((p) => p.studentId === targetStudentId && p.id !== participation.id)
      .map((p) => ({
        extracurricular_id: p.extracurricularId || null,
        activity_name: p.extracurricular,
        predicate: p.predicate || 'Baik',
        description: p.description || '',
      }))

    const payload = [
      {
        student_id: targetStudentId,
        activities: remainingActivities,
      },
    ]

    const res = await assessmentService.saveExtracurriculars(classId, semesterId, payload)
    if (res.success) {
      setOpenMenuId(null)
      setRefreshTrigger((prev) => prev + 1)
      onNotify(`Keikutsertaan ${participation.name} pada ${participation.extracurricular} berhasil dinonaktifkan dari database.`)
    } else {
      onNotify(`Gagal mengubah status: ${res.error}`)
    }
  }

  const showDetail = (participation) => {
    setOpenMenuId(null)
    setModal({ type: 'detail', participation })
  }

  // Dynamic Popular Activities from real master database
  const popularActivities = useMemo(() => {
    const sorted = [...availableExtracurriculars].sort((a, b) => (b.members || 0) - (a.members || 0)).slice(0, 5)
    const maxMembers = Math.max(1, ...sorted.map((e) => e.members || 0))
    const totalMembers = sorted.reduce((sum, e) => sum + (e.members || 0), 0) || 1

    return sorted.map((item) => ({
      name: item.name,
      members: item.members || 0,
      percentage: `${Math.round(((item.members || 0) / totalMembers) * 100)}%`,
      bar: Math.round(((item.members || 0) / maxMembers) * 100),
    }))
  }, [availableExtracurriculars])

  const filterFields = [
    { key: 'className', label: 'Kelas', options: filterClassOptions },
    { key: 'academicYear', label: 'Tahun Ajaran', options: ['Semua Tahun', activeYearName] },
    { key: 'semester', label: 'Semester', options: ['Semua Semester', activeSemesterName] },
    { key: 'extracurricular', label: 'Ekstrakurikuler', options: filterExtracurricularOptions },
    { key: 'status', label: 'Status', options: ['Semua Status', 'Aktif', 'Tidak Aktif'] },
  ]

  return (
    <>
      <section className="activity-filter-card">
        <div className="activity-toolbar">
          <div className="activity-filter-grid activity-participation-filters">
            {filterFields.map((field) => (
              <label className="activity-field" key={field.key}>
                <span>{field.label}</span>
                <select value={filters[field.key]} onChange={(event) => updateFilter(field.key, event.target.value)}>
                  {field.options.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>

          <label className="activity-search">
            <SearchInput
              aria-label="Cari NIS, nama siswa, atau ekstrakurikuler"
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setCurrentPage(1)
                setOpenMenuId(null)
              }}
              placeholder="Cari siswa (NIS/Nama/Ekskul)..."
              value={searchQuery}
            />
            <Icon name="search" />
          </label>
        </div>

        <div className="activity-actions">
          <span className="activity-data-note">
            <Icon name="info" />
            Data keikutsertaan terhubung langsung ke MariaDB (Semester {activeSemesterName} {activeYearName})
          </span>
          <div>
            <Button
              className="activity-button activity-button-secondary"
              onClick={() => onNotify(`${filteredParticipations.length.toLocaleString('id-ID')} data keikutsertaan siap diekspor.`)}
              type="button"
            >
              <Icon name="download" />Ekspor Data
            </Button>
            <Button
              className="activity-button activity-button-primary"
              onClick={() => setModal({ type: 'add' })}
              type="button"
            >
              <Icon name="plus" />Tambah Keikutsertaan
            </Button>
          </div>
        </div>
      </section>

      <div className="activity-participation-layout">
        <section className="activity-workspace">
          <div className="activity-table-heading">
            <div>
              <h3>Daftar Keikutsertaan Ekstrakurikuler</h3>
              <p>
                {isLoading
                  ? 'Memuat data dari database...'
                  : `${filteredParticipations.length.toLocaleString('id-ID')} data keikutsertaan terdaftar`}
              </p>
            </div>
            {fetchError && (
              <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{fetchError}</span>
            )}
          </div>

          <div className="activity-table-scroll">
            <table className="activity-table activity-participation-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Ekstrakurikuler</th>
                  <th>Pembina</th>
                  <th>Predikat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="activity-empty-cell" colSpan="9">
                      <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        <div style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <span>Memuat data keikutsertaan dari database...</span>
                      </div>
                    </td>
                  </tr>
                ) : visibleParticipations.length === 0 ? (
                  <tr>
                    <td className="activity-empty-cell" colSpan="9">
                      <EmptyState className="activity-empty-state">
                        <Icon name="search" />
                        <strong>Data keikutsertaan belum ada</strong>
                        <span>Klik tombol &quot;Tambah Keikutsertaan&quot; untuk mendaftarkan siswa ke ekstrakurikuler.</span>
                      </EmptyState>
                    </td>
                  </tr>
                ) : (
                  visibleParticipations.map((participation, index) => (
                    <tr key={participation.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{participation.nis || '-'}</td>
                      <td className="activity-name-cell">{participation.name}</td>
                      <td>{participation.className}</td>
                      <td><strong className="activity-primary-cell">{participation.extracurricular}</strong></td>
                      <td>{participation.supervisor}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: participation.predicate ? '#0284c7' : '#94a3b8' }}>
                          {participation.predicate || 'Belum dinilai'}
                        </span>
                      </td>
                      <td>
                        <span className={`activity-status ${participation.status === 'Aktif' ? 'activity-status-active' : 'activity-status-inactive'}`}>
                          {participation.status}
                        </span>
                      </td>
                      <td>
                        <div className="activity-row-actions">
                          <button aria-label={`Lihat ${participation.name}`} onClick={() => showDetail(participation)} type="button">
                            <Icon name="eye" />
                          </button>
                          <button
                            aria-label={`Edit ${participation.name}`}
                            onClick={() => setModal({ type: 'edit', participation })}
                            type="button"
                          >
                            <Icon name="edit" />
                          </button>
                          <span className="activity-action-menu-wrap">
                            <button
                              aria-expanded={openMenuId === participation.id}
                              aria-label={`Aksi lainnya ${participation.name}`}
                              onClick={() => setOpenMenuId((current) => current === participation.id ? null : participation.id)}
                              type="button"
                            >
                              <Icon name="more" />
                            </button>
                            {openMenuId === participation.id && (
                              <span className="activity-action-menu">
                                <button onClick={() => showDetail(participation)} type="button">Lihat Detail</button>
                                <button onClick={() => setModal({ type: 'edit', participation })} type="button">Edit Data</button>
                                <button onClick={() => handleDeleteParticipation(participation)} type="button">
                                  Hapus / Nonaktifkan
                                </button>
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <MasterPagination
            currentPage={safePage}
            itemLabel="data"
            onPageChange={(page) => {
              setCurrentPage(page)
              setOpenMenuId(null)
            }}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setCurrentPage(1)
              setOpenMenuId(null)
            }}
            rowsPerPage={rowsPerPage}
            totalItems={filteredParticipations.length}
            totalPages={totalPages}
          />
        </section>

        <aside className="activity-participation-sidebar">
          <section className="activity-side-card">
            <header>
              <h3>Ekstrakurikuler Aktif</h3>
              <button onClick={() => onNotify('Daftar ekstrakurikuler aktif dimuat dari database.')} type="button">
                {availableExtracurriculars.length} Ekskul
              </button>
            </header>
            <div className="activity-popular-list">
              {popularActivities.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '12px' }}>Belum ada data ekskul.</p>
              ) : (
                popularActivities.map((item, index) => (
                  <article key={item.name}>
                    <b>{index + 1}</b>
                    <span><strong>{item.name}</strong><small>{item.members} peserta</small></span>
                    <i><em style={{ width: `${item.bar}%` }} /></i>
                    <small>{item.percentage}</small>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="activity-side-card">
            <header>
              <h3>Keterangan Sistem</h3>
            </header>
            <div style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                Data keikutsertaan terintegrasi dengan tabel <code>student_extracurriculars</code> di database sekolah. Nilai dan predikat yang tersimpan di sini akan otomatis terbaca pada halaman <strong>Nilai Ekstrakurikuler</strong> dan buku <strong>Rapor Siswa</strong>.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {['add', 'edit'].includes(modal?.type) && (
        <ParticipationFormModal
          availableExtracurriculars={availableExtracurriculars}
          availableStudents={availableStudents}
          defaultSemester={activeSemesterName}
          defaultYear={activeYearName}
          initialData={modal.participation}
          isSaving={isSaving}
          mode={modal.type}
          onClose={() => setModal(null)}
          onSave={handleSaveParticipation}
          participations={populatedParticipations}
        />
      )}

      {modal?.type === 'detail' && (
        <ParticipationDetailModal
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', participation: modal.participation })}
          participation={modal.participation}
          studentParticipations={populatedParticipations.filter((item) => (
            String(item.studentId) === String(modal.participation.studentId)
          ))}
        />
      )}
    </>
  )
}

export default StudentParticipationView
