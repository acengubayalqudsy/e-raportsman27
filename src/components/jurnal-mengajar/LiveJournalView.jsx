import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import assessmentService from '../../services/assessmentService.js'
import journalService from '../../services/journalService.js'

const emptyForm = {
  id: null,
  academic_year_id: '',
  semester_id: '',
  class_id: '',
  subject_id: '',
  teacher_id: '',
  schedule_id: '',
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

function errorMessage(result, fallback) {
  if (result.status === 401) return 'Sesi Anda berakhir. Silakan masuk kembali.'
  if (result.status === 403) return 'Anda tidak memiliki akses ke jurnal ini.'
  if (result.status === 404) return 'Jurnal atau konteks tidak ditemukan.'
  if (result.status === 409) return result.error || 'Jurnal dengan konteks tersebut sudah ada.'
  if (result.status === 422) return result.errors
    ? Object.values(result.errors).flat().join(' ')
    : result.error || 'Data jurnal tidak valid.'
  if (result.status >= 500) return 'Terjadi gangguan pada server. Silakan coba lagi.'
  return result.error || fallback
}

function normalizeJournal(journal) {
  return {
    ...journal,
    activities: journal.activities || '',
    attendance_percentage: Number(journal.attendance_percentage || 0),
  }
}

function closeForm(setForm, setEditing) {
  setForm(emptyForm)
  setEditing(false)
}

function LiveJournalView({ onNotify = () => {} }) {
  const { selectedYearId, selectedSemesterId, availableYears, availableSemesters } = useAcademicContext()
  const [context, setContext] = useState(null)
  const [journals, setJournals] = useState([])
  const [filters, setFilters] = useState({ class_id: '', subject_id: '', status: '', date_from: '', date_to: '' })
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const courses = useMemo(() => context?.assigned_courses || [], [context])
  const classes = useMemo(() => {
    const seen = new Set()
    return courses.filter((course) => {
      if (!course.class_id || seen.has(String(course.class_id))) return false
      seen.add(String(course.class_id))
      return true
    })
  }, [courses])
  const subjects = useMemo(() => courses.filter((course) => (
    !filters.class_id || String(course.class_id) === String(filters.class_id)
  )), [courses, filters.class_id])

  const loadContext = useCallback(async () => {
    const result = await assessmentService.getContext()
    if (!result.success) {
      setError(errorMessage(result, 'Gagal memuat konteks jurnal.'))
      return null
    }
    setContext(result.data)
    return result.data
  }, [])

  const loadJournals = useCallback(async (nextFilters = {}) => {
    setIsLoading(true)
    const result = await journalService.list({
      academic_year_id: selectedYearId,
      semester_id: selectedSemesterId,
      ...nextFilters,
    })
    if (!result.success) setError(errorMessage(result, 'Gagal memuat jurnal mengajar.'))
    else {
      setJournals((Array.isArray(result.data) ? result.data : []).map(normalizeJournal))
      setError('')
    }
    setIsLoading(false)
    return result
  }, [selectedSemesterId, selectedYearId])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      await loadContext()
      await loadJournals()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadContext, loadJournals])

  const filteredJournals = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('id-ID')
    if (!keyword) return journals
    return journals.filter((journal) => [
      journal.material,
      journal.activities,
      journal.class_name,
      journal.subject_name,
      journal.teacher_name,
    ].some((value) => String(value || '').toLocaleLowerCase('id-ID').includes(keyword)))
  }, [journals, query])

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  const openCreate = () => {
    const course = subjects[0] || courses[0]
    setEditing(false)
    setForm({
      ...emptyForm,
      academic_year_id: selectedYearId,
      semester_id: selectedSemesterId,
      class_id: course?.class_id || classes[0]?.class_id || '',
      subject_id: course?.subject_id || '',
      teacher_id: course?.teacher_id || '',
      date: new Date().toISOString().slice(0, 10),
    })
    setFormError('')
  }

  const openEdit = (journal) => {
    setEditing(true)
    setForm({ ...emptyForm, ...journal, activities: journal.activities || '' })
    setFormError('')
  }

  const save = async (event) => {
    event.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    setFormError('')
    const payload = { ...form }
    delete payload.id
    const result = editing ? await journalService.update(form.id, payload) : await journalService.create(payload)
    if (!result.success) {
      setFormError(errorMessage(result, 'Gagal menyimpan jurnal mengajar.'))
      setIsSaving(false)
      return
    }
    const refreshed = await journalService.list({
      academic_year_id: selectedYearId,
      semester_id: selectedSemesterId,
      ...filters,
    })
    if (!refreshed.success) {
      setFormError(errorMessage(refreshed, 'Jurnal tersimpan, tetapi gagal memuat ulang data.'))
    } else {
      setJournals((Array.isArray(refreshed.data) ? refreshed.data : []).map(normalizeJournal))
      setForm(emptyForm)
      onNotify(editing ? 'Jurnal mengajar berhasil diperbarui.' : 'Jurnal mengajar berhasil ditambahkan.')
    }
    setIsSaving(false)
  }

  const remove = async (journal) => {
    if (!window.confirm('Hapus jurnal mengajar ini?')) return
    const result = await journalService.remove(journal.id)
    if (!result.success) {
      setError(errorMessage(result, 'Gagal menghapus jurnal mengajar.'))
      return
    }
    const refreshed = await journalService.list({ academic_year_id: selectedYearId, semester_id: selectedSemesterId, ...filters })
    if (refreshed.success) {
      setJournals((Array.isArray(refreshed.data) ? refreshed.data : []).map(normalizeJournal))
      onNotify('Jurnal mengajar berhasil dihapus.')
    } else setError(errorMessage(refreshed, 'Jurnal terhapus, tetapi gagal memuat ulang data.'))
  }

  const setFilter = (event) => {
    const next = { ...filters, [event.target.name]: event.target.value }
    setFilters(next)
    void loadJournals(next)
  }

  if (isLoading && !context) return <div className="journal-live-state" role="status">Memuat jurnal mengajar...</div>

  return (
    <div className="journal-live-view">
      <div className="journal-live-toolbar">
        <label className="journal-filter-field"><span>Tahun Ajaran</span><select value={selectedYearId} disabled><option>{availableYears.find((year) => String(year.id) === String(selectedYearId))?.name || '-'}</option></select></label>
        <label className="journal-filter-field"><span>Semester</span><select value={selectedSemesterId} disabled><option>{availableSemesters.find((semester) => String(semester.id) === String(selectedSemesterId))?.name || '-'}</option></select></label>
        <label className="journal-filter-field"><span>Kelas</span><select name="class_id" onChange={setFilter} value={filters.class_id}><option value="">Semua kelas</option>{classes.map((course) => <option key={course.class_id} value={course.class_id}>{course.class_name}</option>)}</select></label>
        <label className="journal-filter-field"><span>Mata Pelajaran</span><select name="subject_id" onChange={setFilter} value={filters.subject_id}><option value="">Semua mapel</option>{subjects.map((course) => <option key={`${course.class_id}-${course.subject_id}`} value={course.subject_id}>{course.subject_name}</option>)}</select></label>
        <label className="journal-search"><span className="sr-only">Cari jurnal</span><input aria-label="Cari jurnal" onChange={(event) => setQuery(event.target.value)} placeholder="Cari materi atau kegiatan..." value={query} /><Icon name="search" /></label>
      </div>
      {error && <div className="journal-live-error" role="alert">{error}</div>}
      <div className="journal-live-actions"><Button className="journal-button journal-button-primary" onClick={openCreate}><Icon name="plus" />Tambah Jurnal</Button></div>
      {isLoading && <div className="journal-live-state" role="status">Memuat data...</div>}
      {!isLoading && filteredJournals.length === 0 && !error && <EmptyState className="journal-empty-state"><span className="journal-empty-icon"><Icon name="journal" /></span><strong>Belum ada jurnal mengajar</strong><p>Jurnal pada konteks akademik ini belum tersedia.</p></EmptyState>}
      {!isLoading && filteredJournals.length > 0 && (
        <div className="journal-live-table-wrap"><table className="journal-live-table"><thead><tr><th>Tanggal</th><th>Kelas / Mapel</th><th>Pertemuan</th><th>Materi</th><th>Kehadiran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {filteredJournals.map((journal) => <tr key={journal.id}><td>{journal.date}</td><td><strong>{journal.class_name}</strong><small>{journal.subject_name}</small></td><td>{journal.meeting}</td><td><strong>{journal.material || '-'}</strong><small>{journal.activities || '-'}</small></td><td>{journal.attendance_present}/{journal.attendance_total}<small>{journal.attendance_percentage}%</small></td><td>{journal.status}</td><td><button aria-label={`Edit jurnal ${journal.id}`} onClick={() => openEdit(journal)} type="button"><Icon name="edit" /></button><button aria-label={`Hapus jurnal ${journal.id}`} onClick={() => remove(journal)} type="button"><Icon name="trash" /></button></td></tr>)}
        </tbody></table></div>
      )}
      {(form.academic_year_id || editing) && (
        <div className="journal-modal-backdrop" role="presentation"><section aria-labelledby="journal-live-form-title" aria-modal="true" className="journal-modal journal-form-modal" role="dialog">
          <header className="journal-modal-header"><div><small>{editing ? 'Perbarui jurnal' : 'Catat pertemuan baru'}</small><h2 id="journal-live-form-title">{editing ? 'Edit Jurnal Mengajar' : 'Tambah Jurnal Mengajar'}</h2></div><button aria-label="Tutup form jurnal" onClick={() => closeForm(setForm, setEditing)} type="button">&times;</button></header>
          {formError && <div className="journal-live-error" role="alert">{formError}</div>}
          <form className="journal-live-form" onSubmit={save}><label className="journal-form-field"><span>Tanggal</span><input name="date" onChange={updateForm} required type="date" value={form.date} /></label><label className="journal-form-field"><span>Pertemuan</span><input min="1" name="meeting" onChange={updateForm} required type="number" value={form.meeting} /></label><label className="journal-form-field"><span>Kelas</span><select name="class_id" onChange={updateForm} required value={form.class_id}>{classes.map((course) => <option key={course.class_id} value={course.class_id}>{course.class_name}</option>)}</select></label><label className="journal-form-field"><span>Mata Pelajaran</span><select name="subject_id" onChange={updateForm} required value={form.subject_id}>{courses.filter((course) => !form.class_id || String(course.class_id) === String(form.class_id)).map((course) => <option key={`${course.class_id}-${course.subject_id}`} value={course.subject_id}>{course.subject_name}</option>)}</select></label><label className="journal-form-field"><span>Materi</span><input name="material" onChange={updateForm} type="text" value={form.material} /></label><label className="journal-form-field"><span>Metode</span><input name="method" onChange={updateForm} type="text" value={form.method} /></label><label className="journal-form-field"><span>Media</span><input name="media" onChange={updateForm} type="text" value={form.media} /></label><label className="journal-form-field"><span>Hadir</span><input min="0" name="attendance_present" onChange={updateForm} type="number" value={form.attendance_present} /></label><label className="journal-form-field"><span>Total Siswa</span><input min="0" name="attendance_total" onChange={updateForm} type="number" value={form.attendance_total} /></label><label className="journal-form-field journal-form-field-wide"><span>Kegiatan</span><textarea name="activities" onChange={updateForm} value={form.activities} /></label><label className="journal-form-field journal-form-field-wide"><span>Catatan</span><textarea name="notes" onChange={updateForm} value={form.notes} /></label><div className="journal-live-form-actions"><Button className="journal-button journal-button-secondary" onClick={() => closeForm(setForm, setEditing)}>Batal</Button><Button className="journal-button journal-button-primary" disabled={isSaving} type="submit">{isSaving ? 'Menyimpan...' : 'Simpan Jurnal'}</Button></div></form>
        </section></div>
      )}
    </div>
  )
}

export default LiveJournalView
