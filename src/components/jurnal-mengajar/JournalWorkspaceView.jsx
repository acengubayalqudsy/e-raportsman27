import { useEffect, useMemo, useState } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import journalService from '../../services/journalService.js'
import excelService from '../../services/excelService.js'
import { MasterImportModal } from '../master-data/MasterModals.jsx'
import MasterSummary from '../master-data/MasterSummary.jsx'
import MasterMobileToolbar from '../master-data/MasterMobileToolbar.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import JournalMobileRecordCard from './JournalMobileRecordCard.jsx'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'

const labels = {
  jurnal: 'Jurnal Mengajar',
  materi: 'Materi Pembelajaran',
  'aktivitas-kelas': 'Aktivitas Kelas',
  catatan: 'Catatan Mengajar',
}

const blankForm = {
  id: null,
  assignmentId: '',
  academic_year_id: '',
  semester_id: '',
  class_id: '',
  subject_id: '',
  teacher_id: '',
  schedule_id: null,
  date: '',
  meeting: 1,
  material: '',
  chapter: '',
  activities: '',
  method: '',
  media: '',
  notes: '',
  attendance_present: 0,
  attendance_total: 0,
  status: 'Belum Lengkap',
}

function localDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function assignmentLabel(item) {
  return `${item.class_name || 'Kelas'} · ${item.subject_name || 'Mapel'} · ${item.teacher_name || 'Guru'}`
}

function chooseDate(assignment, currentDate = localDate()) {
  if (!assignment) return currentDate
  if (currentDate < assignment.start_date) return assignment.start_date
  if (currentDate > assignment.end_date) return assignment.end_date
  return currentDate
}

function withAssignment(form, assignment) {
  if (!assignment) return form
  return {
    ...form,
    assignmentId: String(assignment.id),
    academic_year_id: assignment.academic_year_id,
    semester_id: assignment.semester_id,
    class_id: assignment.class_id,
    subject_id: assignment.subject_id,
    teacher_id: assignment.teacher_id,
    schedule_id: String(form.assignmentId) === String(assignment.id) ? form.schedule_id : null,
    date: chooseDate(assignment, form.date || localDate()),
  }
}

function errorText(result, fallback) {
  if (result.errors) return Object.values(result.errors).flat().join(' ')
  return result.error || fallback
}

function FormField({ label, children, wide = false }) {
  return <label className={`journal-form-field${wide ? ' journal-form-field-wide' : ''}`}><span>{label}</span>{children}</label>
}

function JournalWorkspaceView({ mode = 'jurnal', onNotify }) {
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint.isMobile
  const { selectedYearId, selectedSemesterId, availableYears, availableSemesters } = useAcademicContext()
  const [assignments, setAssignments] = useState([])
  const [journals, setJournals] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filters, setFilters] = useState({ class_id: '', subject_id: '', search: '' })
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [optionsError, setOptionsError] = useState('')
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const title = labels[mode] || labels.jurnal

  useEffect(() => {
    if (!selectedSemesterId) return undefined
    let cancelled = false
    journalService.options(selectedSemesterId).then((result) => {
      if (cancelled) return
      setAssignments(result.success && Array.isArray(result.data) ? result.data : [])
      setOptionsError(result.success ? '' : errorText(result, 'Gagal memuat penugasan mengajar.'))
    })
    return () => { cancelled = true }
  }, [selectedSemesterId])

  useEffect(() => {
    if (!selectedSemesterId) return undefined
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      const result = await journalService.list({
        academic_year_id: selectedYearId,
        semester_id: selectedSemesterId,
        class_id: filters.class_id,
        subject_id: filters.subject_id,
        search: filters.search,
        page,
        per_page: 25,
      })
      if (cancelled) return
      if (result.success) {
        setJournals(Array.isArray(result.data) ? result.data : [])
        setMeta(result.meta || { current_page: 1, last_page: 1, total: 0 })
        setError('')
        if (result.meta && page > result.meta.last_page) setPage(result.meta.last_page)
      } else {
        setJournals([])
        setError(errorText(result, 'Gagal memuat jurnal.'))
      }
      setIsLoading(false)
    }, filters.search ? 250 : 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [filters.class_id, filters.search, filters.subject_id, page, refresh, selectedSemesterId, selectedYearId])

  useEffect(() => {
    if (!form) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape' && !isSaving) setForm(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [form, isSaving])

  // Lock scroll / hide bottom nav while form modal is open (mobile only)
  useEffect(() => {
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768
    if (form && isMobileViewport) {
      document.body.classList.add('mobile-sheet-open')
    } else {
      document.body.classList.remove('mobile-sheet-open')
    }
    return () => {
      document.body.classList.remove('mobile-sheet-open')
    }
  }, [form])

  const classes = useMemo(() => [...new Map(assignments.map((assignment) => [assignment.class_id, assignment.class_name])).entries()], [assignments])
  const subjects = useMemo(() => [...new Map(assignments
    .filter((assignment) => !filters.class_id || String(assignment.class_id) === filters.class_id)
    .map((assignment) => [assignment.subject_id, assignment.subject_name])).entries()], [assignments, filters.class_id])
  const formAssignment = assignments.find((assignment) => String(assignment.id) === form?.assignmentId)

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, ...(key === 'class_id' ? { subject_id: '' } : {}) }))
    setPage(1)
  }

  // Active filter count: count only selectable optional filters (Kelas, Mapel)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.class_id) count += 1
    if (filters.subject_id) count += 1
    return count
  }, [filters.class_id, filters.subject_id])

  const searchPlaceholder = useMemo(() => {
    if (mode === 'materi') return 'Cari materi...'
    if (mode === 'aktivitas-kelas') return 'Cari aktivitas...'
    if (mode === 'catatan') return 'Cari catatan...'
    return 'Cari materi, aktivitas, catatan...'
  }, [mode])

  const addLabel = useMemo(() => {
    if (mode === 'jurnal') return 'Tambah Jurnal'
    if (mode === 'materi') return 'Tambah Materi'
    if (mode === 'aktivitas-kelas') return 'Tambah Aktivitas'
    if (mode === 'catatan') return 'Tambah Catatan'
    return 'Tambah'
  }, [mode])

  // Ringkasan Data: only 100% REAL metrics from authoritative state
  const summaryItems = useMemo(() => [
    {
      title: mode === 'jurnal' ? 'Total Jurnal' : mode === 'materi' ? 'Total Materi' : mode === 'aktivitas-kelas' ? 'Total Aktivitas' : 'Total Catatan',
      value: (meta.total ?? 0).toLocaleString('id-ID'),
      icon: mode === 'materi' ? 'book' : mode === 'aktivitas-kelas' ? 'users' : mode === 'catatan' ? 'clipboard' : 'journal',
      tone: 'green',
      caption: 'Catatan tersimpan',
      positive: true,
    },
    {
      title: 'Penugasan Aktif',
      value: (assignments.length || 0).toLocaleString('id-ID'),
      icon: 'award',
      tone: 'blue',
      caption: 'Semester ini',
      positive: assignments.length > 0,
    },
  ], [assignments.length, meta.total, mode])

  const currentYearName = availableYears.find((year) => String(year.id) === String(selectedYearId))?.name || '-'
  const currentSemesterName = availableSemesters.find((semester) => String(semester.id) === String(selectedSemesterId))?.name || '-'

  const filterFields = useMemo(() => [
    {
      key: 'year_context',
      label: 'Tahun Ajaran',
      disabled: true,
      options: [{ value: selectedYearId, label: currentYearName }],
    },
    {
      key: 'semester_context',
      label: 'Semester',
      disabled: true,
      options: [{ value: selectedSemesterId, label: currentSemesterName }],
    },
    {
      key: 'class_id',
      label: 'Kelas',
      options: [
        { value: '', label: 'Semua kelas' },
        ...classes.map(([id, name]) => ({ value: String(id), label: name })),
      ],
    },
    {
      key: 'subject_id',
      label: 'Mata Pelajaran',
      options: [
        { value: '', label: 'Semua mapel' },
        ...subjects.map(([id, name]) => ({ value: String(id), label: name })),
      ],
    },
  ], [classes, currentSemesterName, currentYearName, selectedSemesterId, selectedYearId, subjects])

  const handleMobileFilterChange = (key, val) => {
    if (key === 'class_id') {
      updateFilter('class_id', val)
    } else if (key === 'subject_id') {
      updateFilter('subject_id', val)
    }
  }

  const handleMobileFilterReset = () => {
    setFilters((prev) => ({ ...prev, class_id: '', subject_id: '' }))
    setPage(1)
  }

  const openCreate = () => {
    const candidates = assignments.filter((assignment) =>
      (!filters.class_id || String(assignment.class_id) === filters.class_id)
      && (!filters.subject_id || String(assignment.subject_id) === filters.subject_id))
    if (candidates.length === 0) {
      onNotify?.('Belum ada penugasan mengajar aktif pada semester ini.')
      return
    }
    setForm(withAssignment({ ...blankForm, date: localDate() }, candidates[0]))
    setFormError('')
  }

  const openEdit = (journal) => {
    const assignment = assignments.find((item) =>
      String(item.class_id) === String(journal.class_id)
      && String(item.subject_id) === String(journal.subject_id)
      && String(item.teacher_id) === String(journal.teacher_id))
    setForm({
      ...blankForm,
      ...journal,
      material: journal.material || '',
      chapter: journal.chapter || '',
      activities: journal.activities || '',
      method: journal.method || '',
      media: journal.media || '',
      notes: journal.notes || '',
      assignmentId: assignment ? String(assignment.id) : '',
    })
    setFormError(assignment ? '' : 'Penugasan untuk jurnal ini tidak aktif pada semester yang dipilih.')
  }

  const updateForm = (event) => {
    const { name, value } = event.target
    if (name === 'assignmentId') {
      const assignment = assignments.find((item) => String(item.id) === value)
      setForm((current) => withAssignment(current, assignment))
    } else {
      setForm((current) => ({ ...current, [name]: value }))
    }
    setFormError('')
  }

  const save = async (event) => {
    event.preventDefault()
    if (!form || isSaving) return
    if (!formAssignment) {
      setFormError('Pilih penugasan mengajar yang aktif terlebih dahulu.')
      return
    }
    if (mode === 'jurnal' && ![form.material, form.activities, form.notes].some((value) => value.trim())) {
      setFormError('Isi materi, aktivitas kelas, atau catatan mengajar sebelum menyimpan.')
      return
    }
    if (mode === 'materi' && !form.material.trim()) {
      setFormError('Isi materi pembelajaran sebelum menyimpan.')
      return
    }
    if (mode === 'aktivitas-kelas' && !form.activities.trim()) {
      setFormError('Isi aktivitas kelas sebelum menyimpan.')
      return
    }
    if (mode === 'catatan' && !form.notes.trim()) {
      setFormError('Isi catatan mengajar sebelum menyimpan.')
      return
    }
    if (Number(form.attendance_present) > Number(form.attendance_total)) {
      setFormError('Jumlah hadir tidak boleh melebihi jumlah siswa.')
      return
    }
    if (form.date < formAssignment.start_date || form.date > formAssignment.end_date) {
      setFormError('Tanggal harus berada dalam rentang semester yang dipilih.')
      return
    }

    const payload = {
      academic_year_id: Number(form.academic_year_id),
      semester_id: Number(form.semester_id),
      class_id: Number(form.class_id),
      subject_id: Number(form.subject_id),
      teacher_id: Number(form.teacher_id),
      schedule_id: form.schedule_id || null,
      date: form.date,
      meeting: Number(form.meeting),
      material: form.material,
      chapter: form.chapter,
      activities: form.activities,
      method: form.method,
      media: form.media,
      notes: form.notes,
      attendance_present: Number(form.attendance_present) || 0,
      attendance_total: Number(form.attendance_total) || 0,
      status: form.status,
    }
    setIsSaving(true)
    const result = form.id
      ? await journalService.update(form.id, payload)
      : await journalService.create(payload)
    setIsSaving(false)
    if (!result.success) {
      setFormError(errorText(result, `Gagal menyimpan ${title.toLowerCase()}.`))
      return
    }
    setForm(null)
    setPage(1)
    setRefresh((current) => current + 1)
    onNotify?.(`${title} berhasil ${form.id ? 'diperbarui' : 'ditambahkan'}.`)
  }

  const remove = async (journal) => {
    if (!window.confirm('Hapus jurnal mengajar ini beserta materi, aktivitas, dan catatannya?')) return
    const result = await journalService.remove(journal.id)
    if (!result.success) {
      setError(errorText(result, 'Gagal menghapus jurnal.'))
      return
    }
    setRefresh((current) => current + 1)
    onNotify?.('Jurnal mengajar berhasil dihapus.')
  }

  const handleExport = () => {
    if (!selectedSemesterId) return
    excelService.download('journals', 'export', {
      academic_year_id: selectedYearId,
      semester_id: selectedSemesterId,
      class_id: filters.class_id,
      subject_id: filters.subject_id,
      search: filters.search,
    }).catch((cause) => onNotify?.(cause.message))
  }

  const renderDetails = (journal) => {
    if (mode === 'materi') return <><strong>{journal.material || 'Belum diisi'}</strong><small>{[journal.chapter, journal.method, journal.media].filter(Boolean).join(' · ') || '-'}</small></>
    if (mode === 'aktivitas-kelas') return <><strong>{journal.activities || 'Belum diisi'}</strong><small>Kehadiran: {journal.attendance_present}/{journal.attendance_total}</small></>
    if (mode === 'catatan') return <strong>{journal.notes || 'Belum diisi'}</strong>
    return <><strong>{journal.material || 'Belum diisi'}</strong><small>{journal.activities || '-'}</small></>
  }

  return (
    <section className="journal-workspace">
      {/* Desktop Filter Toolbar */}
      {!isMobile && (
        <div className="journal-workspace-toolbar journal-desktop-only">
          <label className="journal-filter-field"><span>Tahun Ajaran</span><select disabled value={selectedYearId}><option value={selectedYearId}>{availableYears.find((year) => String(year.id) === String(selectedYearId))?.name || '-'}</option></select></label>
          <label className="journal-filter-field"><span>Semester</span><select disabled value={selectedSemesterId}><option value={selectedSemesterId}>{availableSemesters.find((semester) => String(semester.id) === String(selectedSemesterId))?.name || '-'}</option></select></label>
          <label className="journal-filter-field"><span>Kelas</span><select value={filters.class_id} onChange={(event) => updateFilter('class_id', event.target.value)}><option value="">Semua kelas</option>{classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label className="journal-filter-field"><span>Mata Pelajaran</span><select value={filters.subject_id} onChange={(event) => updateFilter('subject_id', event.target.value)}><option value="">Semua mapel</option>{subjects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label className="journal-filter-field"><span>Cari</span><input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Materi, aktivitas, catatan..." /></label>
        </div>
      )}

      {/* Desktop Heading with Action Buttons */}
      {!isMobile && (
        <div className="journal-workspace-heading journal-desktop-only">
          <div>
            <h3>{title}</h3>
            <p>{meta.total} catatan pertemuan pada konteks yang dipilih.</p>
          </div>
          <div>
            <Button className="journal-button journal-button-secondary" disabled={!selectedSemesterId} onClick={() => setShowImport(true)}>
              <Icon name="download" />Import Excel
            </Button>
            <Button className="journal-button journal-button-secondary" disabled={!selectedSemesterId} onClick={handleExport}>
              <Icon name="download" />Export Excel
            </Button>
            <Button className="journal-button journal-button-primary" disabled={!selectedSemesterId || assignments.length === 0} onClick={openCreate}>
              <Icon name="plus" />Tambah {mode === 'jurnal' ? 'Jurnal' : mode === 'materi' ? 'Materi' : mode === 'catatan' ? 'Catatan' : 'Aktivitas'}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile-Only Flow: Ringkasan Data + Toolbar */}
      {isMobile && (
        <>
          <MasterSummary
            items={summaryItems}
            title="Ringkasan Data"
            subtitle="Statistik terkini jurnal mengajar"
          />

          <div className="journal-mobile-toolbar-card">
            <MasterMobileToolbar
              searchQuery={filters.search}
              onSearchChange={(val) => updateFilter('search', val)}
              searchPlaceholder={searchPlaceholder}
              filterFields={filterFields}
              filters={{
                year_context: selectedYearId,
                semester_context: selectedSemesterId,
                class_id: filters.class_id,
                subject_id: filters.subject_id,
              }}
              onFilterChange={handleMobileFilterChange}
              onFilterReset={handleMobileFilterReset}
              activeFilterCount={activeFilterCount}
              onAdd={openCreate}
              addLabel={addLabel}
              onImport={() => setShowImport(true)}
              importLabel="Import Excel"
              onExport={handleExport}
              exportLabel="Export Excel"
              exportDisabled={!selectedSemesterId}
            />
          </div>
        </>
      )}

      {/* Data Section Card (Desktop table or Mobile Cards) */}
      <section className="journal-data-section-card" aria-label={`Daftar ${title}`}>
        {isMobile && (
          <div className="journal-data-section-header">
            <div className="journal-data-section-copy">
              <h3 className="journal-data-section-title">{title}</h3>
              <span className="journal-data-section-desc">Daftar catatan pertemuan pembelajaran</span>
            </div>
            <span className="journal-data-section-count">
              {meta.total} data
            </span>
          </div>
        )}

        {(error || optionsError) && <div className="journal-live-error" role="alert">{error || optionsError}</div>}

        {!selectedSemesterId ? (
          <div className="journal-live-state" role="status">Pilih semester untuk melihat jurnal mengajar.</div>
        ) : isLoading ? (
          <div className="journal-live-state" role="status">Memuat {title.toLowerCase()}...</div>
        ) : journals.length === 0 ? (
          <EmptyState className="journal-empty-state">
            <strong>Belum ada {title.toLowerCase()}</strong>
            <p>{assignments.length === 0 ? 'Tambahkan penugasan mengajar aktif pada modul Akademik.' : 'Klik tombol tambah untuk membuat catatan pertemuan.'}</p>
          </EmptyState>
        ) : (
          <>
            {/* Desktop Table View */}
            {!isMobile && (
              <div className="journal-live-table-wrap journal-desktop-only">
                <table className="journal-live-table journal-workspace-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Kelas / Mapel</th>
                      <th>Pertemuan</th>
                      <th>{mode === 'jurnal' ? 'Materi / Aktivitas' : title}</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.map((journal) => (
                      <tr key={journal.id}>
                        <td>{journal.date}</td>
                        <td>
                          <strong>{journal.class_name}</strong>
                          <small>{journal.subject_name} · {journal.teacher_name}</small>
                        </td>
                        <td>{journal.meeting}</td>
                        <td className="journal-workspace-detail">{renderDetails(journal)}</td>
                        <td>{journal.status}</td>
                        <td>
                          <Button aria-label={`Edit ${title} ${journal.id}`} className="journal-workspace-icon-button" onClick={() => openEdit(journal)}>
                            <Icon name="edit" />
                          </Button>
                          {mode === 'jurnal' && (
                            <Button aria-label={`Hapus jurnal ${journal.id}`} className="journal-workspace-icon-button is-danger" onClick={() => remove(journal)}>
                              <Icon name="trash" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Record Cards List */}
            {isMobile && (
              <div className="journal-mobile-record-list">
                {journals.map((journal) => (
                  <JournalMobileRecordCard
                    key={journal.id}
                    journal={journal}
                    mode={mode}
                    onEdit={openEdit}
                    onDelete={mode === 'jurnal' ? remove : null}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="journal-pagination-wrapper">
            {!isMobile && (
              <div className="journal-workspace-pagination journal-desktop-only">
                <span>Halaman {meta.current_page} dari {meta.last_page}</span>
                <Button className="journal-button journal-button-secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Sebelumnya
                </Button>
                <Button className="journal-button journal-button-secondary" disabled={page >= meta.last_page} onClick={() => setPage((current) => current + 1)}>
                  Berikutnya
                </Button>
              </div>
            )}

            {isMobile && (
              <MasterPagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                totalItems={meta.total}
                rowsPerPage={25}
                onPageChange={(p) => setPage(p)}
                onRowsPerPageChange={() => {}}
              />
            )}
          </div>
        )}
      </section>

      {/* Import Modal */}
      {showImport && (
        <MasterImportModal
          entityLabel="Jurnal Mengajar"
          module="journals"
          context={{ semester_id: selectedSemesterId, class_id: filters.class_id }}
          onClose={() => setShowImport(false)}
          onComplete={(count) => {
            setShowImport(false)
            setRefresh((value) => value + 1)
            onNotify?.(`${count} jurnal berhasil diperbarui.`)
          }}
        />
      )}

      {/* Create / Edit Form Modal */}
      {form && (
        <div
          className="journal-modal-backdrop"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setForm(null) }}
          role="presentation"
        >
          <section
            aria-labelledby="journal-workspace-form-title"
            aria-modal="true"
            className="journal-modal journal-form-modal journal-workspace-modal"
            role="dialog"
          >
            <header className="journal-modal-header">
              <div>
                <small>{form.id ? 'Ubah catatan pertemuan' : 'Catat pertemuan baru'}</small>
                <h2 id="journal-workspace-form-title">{form.id ? 'Edit' : 'Tambah'} {title}</h2>
              </div>
              <button
                aria-label="Tutup form"
                disabled={isSaving}
                onClick={() => setForm(null)}
                type="button"
              >
                &times;
              </button>
            </header>
            <form className="journal-live-form" onSubmit={save}>
              {formError && <div className="journal-live-error journal-form-field-wide" role="alert">{formError}</div>}
              <FormField label="Penugasan Mengajar" wide>
                <select name="assignmentId" required value={form.assignmentId} onChange={updateForm}>
                  <option value="">Pilih kelas, mapel, dan guru</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{assignmentLabel(assignment)}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tanggal">
                <input
                  name="date"
                  type="date"
                  required
                  min={formAssignment?.start_date}
                  max={formAssignment?.end_date}
                  value={form.date}
                  onChange={updateForm}
                />
              </FormField>
              <FormField label="Pertemuan Ke">
                <input
                  name="meeting"
                  type="number"
                  required
                  min="1"
                  value={form.meeting}
                  onChange={updateForm}
                />
              </FormField>
              {(mode === 'jurnal' || mode === 'materi') && (
                <>
                  <FormField label="Materi Pembelajaran" wide>
                    <textarea
                      name="material"
                      rows="3"
                      value={form.material}
                      onChange={updateForm}
                      placeholder="Materi yang diajarkan..."
                    />
                  </FormField>
                  <FormField label="Bab / Topik">
                    <input
                      name="chapter"
                      maxLength="255"
                      value={form.chapter}
                      onChange={updateForm}
                    />
                  </FormField>
                  <FormField label="Metode">
                    <input
                      name="method"
                      maxLength="100"
                      value={form.method}
                      onChange={updateForm}
                    />
                  </FormField>
                  <FormField label="Media" wide>
                    <input
                      name="media"
                      maxLength="255"
                      value={form.media}
                      onChange={updateForm}
                    />
                  </FormField>
                </>
              )}
              {(mode === 'jurnal' || mode === 'aktivitas-kelas') && (
                <>
                  <FormField label="Aktivitas Kelas" wide>
                    <textarea
                      name="activities"
                      rows="3"
                      value={form.activities}
                      onChange={updateForm}
                      placeholder="Kegiatan siswa dan guru di kelas..."
                    />
                  </FormField>
                  <FormField label="Jumlah Hadir">
                    <input
                      name="attendance_present"
                      type="number"
                      min="0"
                      value={form.attendance_present}
                      onChange={updateForm}
                    />
                  </FormField>
                  <FormField label="Total Siswa">
                    <input
                      name="attendance_total"
                      type="number"
                      min="0"
                      value={form.attendance_total}
                      onChange={updateForm}
                    />
                  </FormField>
                </>
              )}
              {(mode === 'jurnal' || mode === 'catatan') && (
                <FormField label="Catatan Mengajar" wide>
                  <textarea
                    name="notes"
                    rows="3"
                    value={form.notes}
                    onChange={updateForm}
                    placeholder="Refleksi atau tindak lanjut pembelajaran..."
                  />
                </FormField>
              )}
              <FormField label="Status">
                <select name="status" value={form.status} onChange={updateForm}>
                  <option value="Belum Lengkap">Belum Lengkap</option>
                  <option value="Lengkap">Lengkap</option>
                  <option value="Perlu Diperiksa">Perlu Diperiksa</option>
                </select>
              </FormField>
              <div className="journal-live-form-actions">
                <Button className="journal-button journal-button-secondary" disabled={isSaving} onClick={() => setForm(null)} type="button">
                  Batal
                </Button>
                <Button className="journal-button journal-button-primary" disabled={isSaving} type="submit">
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default JournalWorkspaceView
