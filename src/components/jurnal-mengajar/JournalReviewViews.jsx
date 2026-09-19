import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import {
  classActivities,
  journalOptions,
  learningMaterials,
  teachingNotes,
} from '../../data/jurnalMengajar.js'

const DEFAULT_CONTEXT = {
  academicYear: '2024/2025',
  semester: 'Genap',
  className: 'X Merdeka 3',
  subject: 'Matematika',
  teacher: 'Budi Santoso',
}

function normalize(value) {
  return String(value ?? '').trim().toLocaleLowerCase('id-ID')
}

function statusSlug(value) {
  return normalize(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return value
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${day} ${months[month - 1]} ${year}`
}

function matchesQuery(query, ...values) {
  const keyword = normalize(query)
  if (!keyword) return true
  return values.some((value) => normalize(value).includes(keyword))
}

function activitiesFromJournal(journal) {
  if (Array.isArray(journal.activities)) return journal.activities.filter(Boolean)
  return String(journal.activities ?? journal.activityText ?? '')
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const activityTypeByMethod = {
  Ceramah: 'Ceramah',
  Diskusi: 'Diskusi',
  'Tanya Jawab': 'Tanya Jawab',
  Demonstrasi: 'Latihan Soal',
  Praktikum: 'Praktikum',
  Presentasi: 'Presentasi',
  Penugasan: 'Penugasan',
  Evaluasi: 'Evaluasi',
}

function notify(onNotify, message) {
  if (typeof onNotify === 'function') onNotify(message)
}

function useReviewPagination(totalItems) {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const totalPages = Math.ceil(totalItems / rowsPerPage)
  const currentPage = Math.min(page, Math.max(totalPages, 1))
  const startIndex = (currentPage - 1) * rowsPerPage

  return {
    currentPage,
    pageItems: { startIndex, endIndex: startIndex + rowsPerPage },
    reset: () => setPage(1),
    rowsPerPage,
    setCurrentPage: setPage,
    setRowsPerPage: (value) => {
      setRowsPerPage(value)
      setPage(1)
    },
    totalPages,
  }
}

function ReviewPagination({ itemLabel, pagination, totalItems }) {
  return (
    <div className="journal-pagination">
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

function FilterField({ label, onChange, options, value }) {
  return (
    <label className="journal-filter-field">
      <span>{label}</span>
      <select onChange={onChange} value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function JournalSearch({ onChange, placeholder, value }) {
  return (
    <label className="journal-search">
      <SearchInput aria-label={placeholder} onChange={onChange} placeholder={placeholder} value={value} />
      <Icon name="search" />
    </label>
  )
}

function StatusBadge({ value }) {
  return <span className={`journal-status journal-status-${statusSlug(value)}`}>{value}</span>
}

function RowActions({ onDetail, onEdit }) {
  return (
    <div className="journal-row-actions">
      <button aria-label="Lihat detail" onClick={onDetail} title="Lihat detail" type="button"><Icon name="eye" /></button>
      {onEdit && <button aria-label="Edit data" onClick={onEdit} title="Edit data" type="button"><Icon name="edit" /></button>}
    </div>
  )
}

function EmptyReview({ actionLabel, description, onAction, title }) {
  return (
    <EmptyState className="journal-empty-state">
      <span className="journal-empty-icon"><Icon name="journal" /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {onAction && (
        <Button className="journal-button journal-button-primary" onClick={onAction}>
          <Icon name="plus" />{actionLabel}
        </Button>
      )}
    </EmptyState>
  )
}

function ReviewModal({ children, eyebrow, onRequestClose, title, wide = false }) {
  const dialogRef = useRef(null)
  const closeHandlerRef = useRef(onRequestClose)

  useEffect(() => {
    closeHandlerRef.current = onRequestClose
  }, [onRequestClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeHandlerRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className="journal-modal-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onRequestClose() }}
      role="presentation"
    >
      <section
        aria-labelledby="journal-review-modal-title"
        aria-modal="true"
        className={`journal-modal journal-review-modal${wide ? ' journal-modal-wide' : ''}`}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <header className="journal-modal-header">
          <div>
            <small>{eyebrow}</small>
            <h2 id="journal-review-modal-title">{title}</h2>
          </div>
          <button aria-label="Tutup modal" onClick={onRequestClose} type="button">&times;</button>
        </header>
        {children}
      </section>
    </div>
  )
}

function FormField({ children, error, label, required = false, wide = false }) {
  return (
    <label className={`journal-form-field${error ? ' has-error' : ''}${wide ? ' journal-form-field-wide' : ''}`}>
      <span>{label}{required && <i aria-hidden="true">*</i>}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  )
}

function DirtyNotice({ confirmClose, dirty }) {
  if (confirmClose) {
    return (
      <div className="journal-unsaved-alert" role="alert">
        <Icon name="info" />
        <div><strong>Perubahan belum disimpan.</strong><span>Klik Buang Perubahan untuk menutup form.</span></div>
      </div>
    )
  }

  return (
    <span className={`journal-dirty-indicator${dirty ? ' active' : ''}`}>
      <i />{dirty ? 'Perubahan belum disimpan' : 'Belum ada perubahan'}
    </span>
  )
}

const emptyMaterialForm = {
  ...DEFAULT_CONTEXT,
  title: '',
  chapter: 'Bab 1',
  meetingRange: '',
  status: 'Belum Dimulai',
  progress: 0,
  description: '',
}

function MaterialFormModal({ initialData, mode, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ ...emptyMaterialForm, ...initialData }))
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [errors, setErrors] = useState({})

  const requestClose = () => {
    if (dirty && !confirmClose) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setDirty(true)
    setConfirmClose(false)
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Materi pembelajaran wajib diisi.'
    if (!form.chapter.trim()) nextErrors.chapter = 'Bab wajib diisi.'
    if (!form.meetingRange.trim()) nextErrors.meetingRange = 'Rentang pertemuan wajib diisi.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSave({ ...form, progress: Number(form.progress) || 0 })
  }

  return (
    <ReviewModal
      eyebrow={mode === 'edit' ? 'Perbarui rencana materi' : 'Rencana pembelajaran baru'}
      onRequestClose={requestClose}
      title={mode === 'edit' ? 'Edit Materi Pembelajaran' : 'Tambah Materi Pembelajaran'}
    >
      <form onSubmit={submit}>
        <div className="journal-review-form">
          <div className="journal-form-grid journal-form-grid-two">
            <FormField label="Tahun Ajaran"><select name="academicYear" onChange={updateField} value={form.academicYear}>{journalOptions.academicYears.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Semester"><select name="semester" onChange={updateField} value={form.semester}>{journalOptions.semesters.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Kelas"><select name="className" onChange={updateField} value={form.className}>{journalOptions.classes.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Mata Pelajaran"><select name="subject" onChange={updateField} value={form.subject}>{journalOptions.subjects.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Guru"><select name="teacher" onChange={updateField} value={form.teacher}>{journalOptions.teachers.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField error={errors.chapter} label="Bab" required><input name="chapter" onChange={updateField} placeholder="Contoh: Bab 1" value={form.chapter} /></FormField>
            <FormField error={errors.title} label="Materi Pembelajaran" required wide><input name="title" onChange={updateField} placeholder="Masukkan nama materi" value={form.title} /></FormField>
            <FormField error={errors.meetingRange} label="Rentang Pertemuan" required><input name="meetingRange" onChange={updateField} placeholder="Contoh: 1 - 2" value={form.meetingRange} /></FormField>
            <FormField label="Status"><select name="status" onChange={updateField} value={form.status}>{['Belum Dimulai', 'Berjalan', 'Selesai'].map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Progress"><input max="100" min="0" name="progress" onChange={updateField} type="number" value={form.progress} /></FormField>
            <FormField label="Deskripsi" wide><textarea name="description" onChange={updateField} placeholder="Ringkasan materi (opsional)" rows="3" value={form.description} /></FormField>
          </div>
          {confirmClose && <DirtyNotice confirmClose dirty={dirty} />}
        </div>
        <footer className="journal-modal-footer">
          {!confirmClose ? <DirtyNotice dirty={dirty} /> : <span />}
          <div>
            <Button className="journal-button journal-button-secondary" onClick={requestClose}>{confirmClose ? 'Buang Perubahan' : 'Batal'}</Button>
            <Button className="journal-button journal-button-primary" type="submit"><Icon name="save" />Simpan Materi</Button>
          </div>
        </footer>
      </form>
    </ReviewModal>
  )
}

function DetailValue({ label, value }) {
  return <div className="journal-detail-value"><span>{label}</span><strong>{value || '-'}</strong></div>
}

function MaterialDetailModal({ item, onClose, onEdit }) {
  return (
    <ReviewModal eyebrow="Detail Materi Pembelajaran" onRequestClose={onClose} title={item.title}>
      <div className="journal-review-detail">
        <div className="journal-detail-grid">
          <DetailValue label="Mata Pelajaran" value={item.subject} />
          <DetailValue label="Kelas" value={item.className} />
          <DetailValue label="Guru" value={item.teacher} />
          <DetailValue label="Bab" value={item.chapter} />
          <DetailValue label="Pertemuan" value={item.meetingRange} />
          <DetailValue label="Status" value={item.status} />
        </div>
        <section className="journal-detail-section">
          <span>Deskripsi</span>
          <p>{item.description || 'Belum ada deskripsi materi.'}</p>
        </section>
        <section className="journal-detail-section">
          <div className="journal-progress-heading"><span>Progress Materi</span><strong>{item.progress}%</strong></div>
          <div className="journal-progress-track"><span style={{ width: `${Math.min(100, item.progress)}%` }} /></div>
        </section>
      </div>
      <footer className="journal-modal-footer"><span /><div><Button className="journal-button journal-button-secondary" onClick={onClose}>Tutup</Button><Button className="journal-button journal-button-primary" onClick={onEdit}><Icon name="edit" />Edit Materi</Button></div></footer>
    </ReviewModal>
  )
}

export function LearningMaterialsView({
  items = learningMaterials,
  onItemsChange = () => {},
  onNotify,
  onRecentActivitiesChange = () => {},
}) {
  const [filters, setFilters] = useState(DEFAULT_CONTEXT)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)

  const filteredItems = useMemo(() => items.filter((item) => (
    item.academicYear === filters.academicYear
    && item.semester === filters.semester
    && item.className === filters.className
    && item.subject === filters.subject
    && item.teacher === filters.teacher
    && matchesQuery(query, item.title, item.chapter, item.subject, item.className, item.teacher, item.status)
  )), [filters, items, query])
  const pagination = useReviewPagination(filteredItems.length)
  const pageItems = filteredItems.slice(pagination.pageItems.startIndex, pagination.pageItems.endIndex)

  const progress = useMemo(() => {
    const total = filteredItems.length
    const completed = filteredItems.filter(({ status }) => status === 'Selesai').length
    const inProgress = filteredItems.filter(({ status }) => status === 'Berjalan').length
    const notStarted = filteredItems.filter(({ status }) => status === 'Belum Dimulai').length
    const percentage = total ? Math.round((completed / total) * 100) : 0
    return { total, completed, inProgress, notStarted, percentage }
  }, [filteredItems])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    pagination.reset()
  }

  const saveMaterial = (values) => {
    const isEdit = modal?.type === 'edit'
    if (modal?.type === 'edit') {
      onItemsChange((current) => current.map((item) => item.id === modal.item.id ? { ...item, ...values } : item))
      notify(onNotify, 'Materi pembelajaran berhasil diperbarui.')
    } else {
      onItemsChange((current) => [{ ...values, id: `MTR-LOCAL-${Date.now()}`, number: current.length + 1, progressLabel: `${values.progress}%`, journalCount: 0 }, ...current])
      notify(onNotify, 'Materi pembelajaran berhasil ditambahkan.')
    }
    onRecentActivitiesChange((current) => [{
      id: `ACT-MATERIAL-${Date.now()}`,
      type: isEdit ? 'updated' : 'created',
      title: isEdit ? 'Materi pembelajaran diperbarui' : 'Materi pembelajaran ditambahkan',
      description: `${values.subject} · ${values.className}`,
      timestamp: 'Baru saja',
      icon: 'book',
      tone: isEdit ? 'blue' : 'green',
    }, ...current].slice(0, 5))
    setModal(null)
    pagination.reset()
  }

  return (
    <section className="journal-review-view journal-material-view">
      <article className="journal-material-progress-card">
        <div className="journal-progress-copy">
          <span>Progress Materi</span>
          <h3>{filters.subject} <small>&mdash; {filters.className}</small></h3>
          <div className="journal-progress-track"><span style={{ width: `${progress.percentage}%` }} /></div>
        </div>
        <div className="journal-progress-stats">
          <div><span>Total Materi</span><strong>{progress.total}</strong></div>
          <div><span>Sudah Disampaikan</span><strong>{progress.completed}</strong></div>
          <div><span>Sedang Berjalan</span><strong>{progress.inProgress}</strong></div>
          <div><span>Belum Disampaikan</span><strong>{progress.notStarted}</strong></div>
          <div className="journal-progress-total"><span>Progress</span><strong>{progress.percentage}%</strong></div>
        </div>
      </article>

      <section className="journal-filter-card">
        <div className="journal-filter-grid journal-filter-grid-five">
          <FilterField label="Tahun Ajaran" onChange={(event) => updateFilter('academicYear', event.target.value)} options={journalOptions.academicYears} value={filters.academicYear} />
          <FilterField label="Semester" onChange={(event) => updateFilter('semester', event.target.value)} options={journalOptions.semesters} value={filters.semester} />
          <FilterField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={journalOptions.classes} value={filters.className} />
          <FilterField label="Mata Pelajaran" onChange={(event) => updateFilter('subject', event.target.value)} options={journalOptions.subjects} value={filters.subject} />
          <FilterField label="Guru" onChange={(event) => updateFilter('teacher', event.target.value)} options={journalOptions.teachers} value={filters.teacher} />
        </div>
        <div className="journal-filter-actions">
          <JournalSearch onChange={(event) => { setQuery(event.target.value); pagination.reset() }} placeholder="Cari materi pembelajaran..." value={query} />
          <Button className="journal-button journal-button-primary" onClick={() => setModal({ type: 'add' })}><Icon name="plus" />Tambah Materi</Button>
        </div>
      </section>

      <section className="journal-table-card">
        <header className="journal-table-header"><div><h3>Daftar Materi Pembelajaran</h3><p>{filters.subject} &middot; {filters.className}</p></div><span>{filteredItems.length} materi</span></header>
        {pageItems.length ? (
          <div className="journal-table-scroll">
            <table className="journal-table journal-material-table">
              <thead><tr><th>No</th><th>Materi</th><th>Mata Pelajaran</th><th>Bab</th><th>Pertemuan</th><th>Progress</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {pageItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>{pagination.pageItems.startIndex + index + 1}</td>
                    <td className="journal-primary-cell"><strong>{item.title}</strong><span>{item.description}</span></td>
                    <td>{item.subject}</td><td>{item.chapter}</td><td>{item.meetingRange}</td>
                    <td><div className="journal-table-progress"><span><i style={{ width: `${Math.min(100, item.progress)}%` }} /></span><strong>{item.progress}%</strong></div></td>
                    <td><StatusBadge value={item.status} /></td>
                    <td><RowActions onDetail={() => setModal({ type: 'detail', item })} onEdit={() => setModal({ type: 'edit', item })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyReview actionLabel="Tambah Materi" description="Coba ubah filter atau catat rencana materi baru." onAction={() => setModal({ type: 'add' })} title="Materi pembelajaran tidak ditemukan" />}
        <ReviewPagination itemLabel="materi" pagination={pagination} totalItems={filteredItems.length} />
      </section>

      {modal?.type === 'add' && <MaterialFormModal initialData={filters} mode="add" onClose={() => setModal(null)} onSave={saveMaterial} />}
      {modal?.type === 'edit' && <MaterialFormModal initialData={modal.item} mode="edit" onClose={() => setModal(null)} onSave={saveMaterial} />}
      {modal?.type === 'detail' && <MaterialDetailModal item={modal.item} onClose={() => setModal(null)} onEdit={() => setModal({ type: 'edit', item: modal.item })} />}
    </section>
  )
}

function ActivityDetailModal({ item, onClose }) {
  const details = Array.isArray(item.activityDetails) ? item.activityDetails : [item.activity]
  return (
    <ReviewModal eyebrow="Detail Aktivitas Kelas" onRequestClose={onClose} title={item.activity}>
      <div className="journal-review-detail">
        <div className="journal-detail-grid">
          <DetailValue label="Tanggal" value={item.dateLabel || formatDate(item.date)} />
          <DetailValue label="Pertemuan" value={`Ke-${item.meeting}`} />
          <DetailValue label="Kelas" value={item.className} />
          <DetailValue label="Mata Pelajaran" value={item.subject} />
          <DetailValue label="Guru" value={item.teacher} />
          <DetailValue label="Status" value={item.status} />
        </div>
        <section className="journal-detail-section"><span>Materi Pembelajaran</span><h3>{item.material}</h3></section>
        <section className="journal-detail-section"><span>Rangkaian Aktivitas</span><ul>{details.map((detail, index) => <li key={`${detail}-${index}`}>{detail}</li>)}</ul></section>
        <div className="journal-detail-grid"><DetailValue label="Metode" value={item.method} /><DetailValue label="Media" value={item.media} /><DetailValue label="Partisipasi" value={item.participation} /></div>
      </div>
      <footer className="journal-modal-footer"><span /><div><Button className="journal-button journal-button-primary" onClick={onClose}>Tutup</Button></div></footer>
    </ReviewModal>
  )
}

export function ClassActivitiesView({ journals = [], onNotify }) {
  const [filters, setFilters] = useState({
    className: DEFAULT_CONTEXT.className,
    subject: DEFAULT_CONTEXT.subject,
    teacher: DEFAULT_CONTEXT.teacher,
    date: 'Semua Tanggal',
    activityType: 'Semua Aktivitas',
  })
  const [query, setQuery] = useState('')
  const [detailItem, setDetailItem] = useState(null)
  const activityItems = useMemo(() => {
    if (!journals.length) return classActivities

    const initialByJournal = new Map(classActivities.map((item) => [item.journalId, item]))
    return journals.map((journal, index) => {
      const initial = initialByJournal.get(journal.id) ?? {}
      const details = activitiesFromJournal(journal)
      return {
        ...initial,
        id: initial.id ?? `AKT-${journal.id}`,
        journalId: journal.id,
        number: index + 1,
        academicYear: journal.academicYear,
        semester: journal.semester,
        month: journal.month,
        date: journal.date,
        dateLabel: journal.dateLabel || formatDate(journal.date),
        time: journal.time,
        meeting: journal.meeting ?? journal.meetingNumber,
        className: journal.className,
        subject: journal.subject,
        teacher: journal.teacher,
        material: journal.material ?? journal.materialTitle,
        activity: details[0] || 'Aktivitas pembelajaran',
        activityTitle: details[0] || 'Aktivitas pembelajaran',
        activityDetails: details,
        activityType: activityTypeByMethod[journal.method] ?? 'Aktivitas Pembelajaran',
        method: journal.method,
        media: journal.media,
        participation: initial.participation ?? 'Aktif',
        status: journal.status === 'Lengkap' ? 'Selesai' : 'Perlu Tindak Lanjut',
      }
    })
  }, [journals])
  const dateOptions = useMemo(() => ['Semua Tanggal', ...Array.from(new Set(activityItems.map(({ dateLabel, date }) => dateLabel || formatDate(date))))], [activityItems])

  const filteredItems = useMemo(() => activityItems.filter((item) => (
    item.className === filters.className
    && item.subject === filters.subject
    && item.teacher === filters.teacher
    && (filters.date === 'Semua Tanggal' || (item.dateLabel || formatDate(item.date)) === filters.date)
    && (
      filters.activityType === 'Semua Aktivitas'
      || normalize(item.activityType) === normalize(filters.activityType)
      || normalize(item.activity).includes(normalize(filters.activityType))
      || item.activityDetails?.some((detail) => normalize(detail).includes(normalize(filters.activityType)))
    )
    && matchesQuery(query, item.activity, item.activityDetails?.join(' '), item.material, item.teacher, item.className, item.subject, item.activityType)
  )), [activityItems, filters, query])
  const pagination = useReviewPagination(filteredItems.length)
  const pageItems = filteredItems.slice(pagination.pageItems.startIndex, pagination.pageItems.endIndex)
  const activitySummary = useMemo(() => {
    const counts = filteredItems.reduce((result, item) => ({ ...result, [item.activityType]: (result[item.activityType] || 0) + 1 }), {})
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filteredItems])
  const maxActivity = Math.max(1, ...activitySummary.map(([, count]) => count))

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    pagination.reset()
  }

  return (
    <section className="journal-review-view journal-activity-view">
      <section className="journal-filter-card">
        <div className="journal-filter-grid journal-filter-grid-five">
          <FilterField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={journalOptions.classes} value={filters.className} />
          <FilterField label="Mata Pelajaran" onChange={(event) => updateFilter('subject', event.target.value)} options={journalOptions.subjects} value={filters.subject} />
          <FilterField label="Guru" onChange={(event) => updateFilter('teacher', event.target.value)} options={journalOptions.teachers} value={filters.teacher} />
          <FilterField label="Tanggal" onChange={(event) => updateFilter('date', event.target.value)} options={dateOptions} value={filters.date} />
          <FilterField label="Jenis Aktivitas" onChange={(event) => updateFilter('activityType', event.target.value)} options={journalOptions.activityTypes} value={filters.activityType} />
        </div>
        <div className="journal-filter-actions">
          <JournalSearch onChange={(event) => { setQuery(event.target.value); pagination.reset() }} placeholder="Cari aktivitas..." value={query} />
          <Button className="journal-button journal-button-secondary" onClick={() => notify(onNotify, 'Aktivitas kelas merupakan hasil review dari jurnal mengajar.') }><Icon name="info" />Informasi</Button>
        </div>
      </section>

      <div className="journal-review-split">
        <section className="journal-table-card">
          <header className="journal-table-header"><div><h3>Daftar Aktivitas Kelas</h3><p>Review kegiatan pembelajaran dari jurnal yang telah dicatat.</p></div><span>{filteredItems.length} aktivitas</span></header>
          {pageItems.length ? (
            <div className="journal-table-scroll">
              <table className="journal-table journal-activity-table">
                <thead><tr><th>No</th><th>Tanggal</th><th>Kelas</th><th>Mata Pelajaran</th><th>Aktivitas</th><th>Guru</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {pageItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>{pagination.pageItems.startIndex + index + 1}</td><td>{item.dateLabel || formatDate(item.date)}</td><td>{item.className}</td><td>{item.subject}</td>
                      <td className="journal-primary-cell"><strong>{item.activity}</strong><span>{item.material} &middot; {item.activityType}</span></td>
                      <td>{item.teacher}</td><td><StatusBadge value={item.status} /></td><td><RowActions onDetail={() => setDetailItem(item)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyReview description="Coba ubah filter atau kata pencarian." title="Aktivitas kelas tidak ditemukan" />}
          <ReviewPagination itemLabel="aktivitas" pagination={pagination} totalItems={filteredItems.length} />
        </section>

        <aside className="journal-activity-summary-card">
          <header><div><h3>Aktivitas Bulan Ini</h3><p>Distribusi aktivitas pembelajaran</p></div><Icon name="trend" /></header>
          <div className="journal-activity-bars">
            {activitySummary.length ? activitySummary.map(([label, count], index) => (
              <div className={`journal-activity-bar journal-tone-${['green', 'blue', 'purple', 'orange', 'teal', 'red'][index]}`} key={label}>
                <div><span>{label}</span><strong>{count}</strong></div>
                <div className="journal-progress-track"><span style={{ width: `${(count / maxActivity) * 100}%` }} /></div>
              </div>
            )) : <p className="journal-side-empty">Belum ada aktivitas pada filter ini.</p>}
          </div>
          <div className="journal-review-note"><Icon name="info" /><p>Aktivitas berasal dari jurnal mengajar dan tidak diinput ulang di halaman ini.</p></div>
        </aside>
      </div>

      {detailItem && <ActivityDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </section>
  )
}

const emptyNoteForm = {
  ...DEFAULT_CONTEXT,
  date: '2025-05-09',
  meeting: 1,
  category: journalOptions.noteCategories[0],
  note: '',
  followUp: '',
  status: 'Perlu Tindak Lanjut',
}

function NoteFormModal({ initialData, mode, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ ...emptyNoteForm, ...initialData }))
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [errors, setErrors] = useState({})

  const requestClose = () => {
    if (dirty && !confirmClose) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setDirty(true)
    setConfirmClose(false)
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.date) nextErrors.date = 'Tanggal wajib diisi.'
    if (!form.note.trim()) nextErrors.note = 'Catatan mengajar wajib diisi.'
    if (!form.followUp.trim()) nextErrors.followUp = 'Rencana tindak lanjut wajib diisi.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSave({ ...form, meeting: Number(form.meeting) || 1 })
  }

  return (
    <ReviewModal eyebrow={mode === 'edit' ? 'Perbarui catatan guru' : 'Catatan pembelajaran baru'} onRequestClose={requestClose} title={mode === 'edit' ? 'Edit Catatan Mengajar' : 'Tambah Catatan Mengajar'}>
      <form onSubmit={submit}>
        <div className="journal-review-form">
          <div className="journal-form-grid journal-form-grid-two">
            <FormField error={errors.date} label="Tanggal" required><input name="date" onChange={updateField} type="date" value={form.date} /></FormField>
            <FormField label="Pertemuan Ke"><input min="1" name="meeting" onChange={updateField} type="number" value={form.meeting} /></FormField>
            <FormField label="Kelas"><select name="className" onChange={updateField} value={form.className}>{journalOptions.classes.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Mata Pelajaran"><select name="subject" onChange={updateField} value={form.subject}>{journalOptions.subjects.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Guru"><select name="teacher" onChange={updateField} value={form.teacher}>{journalOptions.teachers.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Kategori"><select name="category" onChange={updateField} value={form.category}>{journalOptions.noteCategories.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField error={errors.note} label="Catatan Mengajar" required wide><textarea name="note" onChange={updateField} placeholder="Tuliskan kendala atau perkembangan pembelajaran" rows="4" value={form.note} /></FormField>
            <FormField error={errors.followUp} label="Rencana Tindak Lanjut" required wide><textarea name="followUp" onChange={updateField} placeholder="Tuliskan rencana pertemuan berikutnya" rows="4" value={form.followUp} /></FormField>
            <FormField label="Status"><select name="status" onChange={updateField} value={form.status}>{['Perlu Tindak Lanjut', 'Ditindaklanjuti'].map((item) => <option key={item}>{item}</option>)}</select></FormField>
          </div>
          {confirmClose && <DirtyNotice confirmClose dirty={dirty} />}
        </div>
        <footer className="journal-modal-footer">
          {!confirmClose ? <DirtyNotice dirty={dirty} /> : <span />}
          <div>
            <Button className="journal-button journal-button-secondary" onClick={requestClose}>{confirmClose ? 'Buang Perubahan' : 'Batal'}</Button>
            <Button className="journal-button journal-button-primary" type="submit"><Icon name="save" />Simpan Catatan</Button>
          </div>
        </footer>
      </form>
    </ReviewModal>
  )
}

function NoteDetailModal({ item, onClose, onEdit }) {
  return (
    <ReviewModal eyebrow="Detail Catatan Mengajar" onRequestClose={onClose} title={item.category}>
      <div className="journal-review-detail">
        <div className="journal-detail-grid">
          <DetailValue label="Tanggal" value={item.dateLabel || formatDate(item.date)} />
          <DetailValue label="Pertemuan" value={`Ke-${item.meeting}`} />
          <DetailValue label="Guru" value={item.teacher} />
          <DetailValue label="Kelas" value={item.className} />
          <DetailValue label="Mata Pelajaran" value={item.subject} />
          <DetailValue label="Status" value={item.status} />
        </div>
        <section className="journal-detail-note"><Icon name="clipboard" /><div><span>Catatan</span><p>{item.note}</p></div></section>
        <section className="journal-detail-note journal-follow-up-note"><Icon name="arrowRight" /><div><span>Rencana Tindak Lanjut</span><p>{item.followUp}</p></div></section>
      </div>
      <footer className="journal-modal-footer"><span /><div><Button className="journal-button journal-button-secondary" onClick={onClose}>Tutup</Button><Button className="journal-button journal-button-primary" onClick={onEdit}><Icon name="edit" />Edit Catatan</Button></div></footer>
    </ReviewModal>
  )
}

export function TeachingNotesView({
  items = teachingNotes,
  onItemsChange = () => {},
  onNotify,
  onRecentActivitiesChange = () => {},
}) {
  const [filters, setFilters] = useState({ ...DEFAULT_CONTEXT, category: 'Semua Kategori' })
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)

  const filteredItems = useMemo(() => items.filter((item) => (
    item.academicYear === filters.academicYear
    && item.semester === filters.semester
    && item.className === filters.className
    && item.subject === filters.subject
    && item.teacher === filters.teacher
    && (filters.category === 'Semua Kategori' || item.category === filters.category)
    && matchesQuery(query, item.note, item.followUp, item.category, item.teacher, item.className, item.subject, item.material)
  )), [filters, items, query])
  const pagination = useReviewPagination(filteredItems.length)
  const pageItems = filteredItems.slice(pagination.pageItems.startIndex, pagination.pageItems.endIndex)

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    pagination.reset()
  }

  const saveNote = (values) => {
    const isEdit = modal?.type === 'edit'
    if (modal?.type === 'edit') {
      onItemsChange((current) => current.map((item) => item.id === modal.item.id ? { ...item, ...values, dateLabel: formatDate(values.date), excerpt: values.note.length > 72 ? `${values.note.slice(0, 72)}...` : values.note } : item))
      notify(onNotify, 'Catatan mengajar berhasil diperbarui.')
    } else {
      onItemsChange((current) => [{ ...values, id: `CTT-LOCAL-${Date.now()}`, number: current.length + 1, dateLabel: formatDate(values.date), excerpt: values.note.length > 72 ? `${values.note.slice(0, 72)}...` : values.note }, ...current])
      notify(onNotify, 'Catatan mengajar berhasil ditambahkan.')
    }
    onRecentActivitiesChange((current) => [{
      id: `ACT-NOTE-${Date.now()}`,
      type: isEdit ? 'updated' : 'created',
      title: isEdit ? 'Catatan mengajar diperbarui' : 'Catatan mengajar ditambahkan',
      description: `${values.subject} · ${values.className}`,
      timestamp: 'Baru saja',
      icon: 'clipboard',
      tone: isEdit ? 'blue' : 'green',
    }, ...current].slice(0, 5))
    setModal(null)
    pagination.reset()
  }

  return (
    <section className="journal-review-view journal-notes-view">
      <section className="journal-filter-card">
        <div className="journal-filter-grid journal-filter-grid-six">
          <FilterField label="Tahun Ajaran" onChange={(event) => updateFilter('academicYear', event.target.value)} options={journalOptions.academicYears} value={filters.academicYear} />
          <FilterField label="Semester" onChange={(event) => updateFilter('semester', event.target.value)} options={journalOptions.semesters} value={filters.semester} />
          <FilterField label="Kelas" onChange={(event) => updateFilter('className', event.target.value)} options={journalOptions.classes} value={filters.className} />
          <FilterField label="Mata Pelajaran" onChange={(event) => updateFilter('subject', event.target.value)} options={journalOptions.subjects} value={filters.subject} />
          <FilterField label="Guru" onChange={(event) => updateFilter('teacher', event.target.value)} options={journalOptions.teachers} value={filters.teacher} />
          <FilterField label="Kategori" onChange={(event) => updateFilter('category', event.target.value)} options={['Semua Kategori', ...journalOptions.noteCategories]} value={filters.category} />
        </div>
        <div className="journal-filter-actions">
          <JournalSearch onChange={(event) => { setQuery(event.target.value); pagination.reset() }} placeholder="Cari catatan mengajar..." value={query} />
          <Button className="journal-button journal-button-primary" onClick={() => setModal({ type: 'add' })}><Icon name="plus" />Tambah Catatan</Button>
        </div>
      </section>

      <section className="journal-table-card">
        <header className="journal-table-header"><div><h3>Daftar Catatan Mengajar</h3><p>Catatan perkembangan, kendala, dan tindak lanjut pembelajaran.</p></div><span>{filteredItems.length} catatan</span></header>
        {pageItems.length ? (
          <div className="journal-table-scroll">
            <table className="journal-table journal-notes-table">
              <thead><tr><th>No</th><th>Tanggal</th><th>Guru</th><th>Kelas</th><th>Mata Pelajaran</th><th>Kategori</th><th>Catatan</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {pageItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>{pagination.pageItems.startIndex + index + 1}</td><td>{item.dateLabel || formatDate(item.date)}</td><td>{item.teacher}</td><td>{item.className}</td><td>{item.subject}</td>
                    <td><span className="journal-category-badge">{item.category}</span></td>
                    <td className="journal-note-cell"><p>{item.excerpt || item.note}</p><span>Pertemuan ke-{item.meeting}</span></td>
                    <td><StatusBadge value={item.status} /></td>
                    <td><RowActions onDetail={() => setModal({ type: 'detail', item })} onEdit={() => setModal({ type: 'edit', item })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyReview actionLabel="Tambah Catatan" description="Coba ubah filter atau tambahkan catatan baru." onAction={() => setModal({ type: 'add' })} title="Catatan mengajar tidak ditemukan" />}
        <ReviewPagination itemLabel="catatan" pagination={pagination} totalItems={filteredItems.length} />
      </section>

      <div className="journal-review-note"><Icon name="info" /><p>Catatan membantu guru menyiapkan tindak lanjut, bukan menggantikan data penilaian atau absensi.</p></div>

      {modal?.type === 'add' && (
        <NoteFormModal
          initialData={{
            ...filters,
            category: filters.category === 'Semua Kategori' ? journalOptions.noteCategories[0] : filters.category,
          }}
          mode="add"
          onClose={() => setModal(null)}
          onSave={saveNote}
        />
      )}
      {modal?.type === 'edit' && <NoteFormModal initialData={modal.item} mode="edit" onClose={() => setModal(null)} onSave={saveNote} />}
      {modal?.type === 'detail' && <NoteDetailModal item={modal.item} onClose={() => setModal(null)} onEdit={() => setModal({ type: 'edit', item: modal.item })} />}
    </section>
  )
}
