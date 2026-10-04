import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { reportTabs } from '../../data/laporan.js'
import savedReportService from '../../services/savedReportService.js'
import excelService from '../../services/excelService.js'
import Icon from '../../components/common/Icon.jsx'
import MasterSummary from '../../components/master-data/MasterSummary.jsx'
import MasterMobileToolbar from '../../components/master-data/MasterMobileToolbar.jsx'
import MasterPagination from '../../components/master-data/MasterPagination.jsx'
import ReportMobileModuleGrid from '../../components/laporan/ReportMobileModuleGrid.jsx'
import ReportMobileRecordCard from '../../components/laporan/ReportMobileRecordCard.jsx'
import './Laporan.css'

const emptyForm = { type: 'nilai', class_id: '', student_id: '', title: '', notes: '' }
const dateLabel = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'

function exportCsv(report) {
  const lines = [report.snapshot?.columns || [], ...(report.snapshot?.rows || [])]
    .map((row) => row.map((value) => '"' + String(value ?? '').replaceAll('"', '""') + '"').join(','))
  const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${report.type}-${report.class_name || 'laporan'}-${report.id}.csv`.replaceAll(/[^a-zA-Z0-9._-]/g, '_')
  link.click()
  URL.revokeObjectURL(url)
}

function Laporan() {
  const { pathname } = useLocation()
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint.isMobile

  const { selectedSemesterId, selectedSemester, isLoading: contextLoading } = useAcademicContext()
  const activeTab = reportTabs.find((tab) => tab.route === pathname)
  const mine = pathname === '/laporan/saya'
  const [filters, setFilters] = useState({ class_id: '', type: '', search: '', page: 1 })
  const [options, setOptions] = useState({ classes: [] })
  const [students, setStudents] = useState([])
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [preview, setPreview] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const type = activeTab?.key || filters.type

  // Hide mobile bottom nav when modal sheets are open (mobile only)
  useEffect(() => {
    if (!isMobile) return undefined
    if (showForm || preview) {
      document.body.classList.add('mobile-sheet-open')
    } else {
      document.body.classList.remove('mobile-sheet-open')
    }
    return () => {
      document.body.classList.remove('mobile-sheet-open')
    }
  }, [isMobile, showForm, preview])

  useEffect(() => {
    document.querySelector('.app-content-wrapper')?.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  useEffect(() => {
    if (!selectedSemesterId) return
    let alive = true
    savedReportService.options({ semester_id: selectedSemesterId }).then((result) => {
      if (!alive) return
      if (result.success) {
        setOptions(result.data)
        setStudents([])
        const validClass = (id) => (result.data.classes || []).some((item) => String(item.id) === String(id))
        setFilters((current) => current.class_id && !validClass(current.class_id)
          ? { ...current, class_id: '', page: 1 } : current)
        setForm((current) => current.class_id && !validClass(current.class_id)
          ? { ...current, class_id: '', student_id: '' } : current)
      } else setError(result.error)
    })
    return () => { alive = false }
  }, [selectedSemesterId])

  useEffect(() => {
    if (!selectedSemesterId || !form.class_id) return
    let alive = true
    savedReportService.options({ semester_id: selectedSemesterId, class_id: form.class_id }).then((result) => {
      if (alive && result.success) setStudents(result.data.students || [])
    })
    return () => { alive = false }
  }, [selectedSemesterId, form.class_id])

  async function loadReports() {
    if (!selectedSemesterId) return
    setLoading(true)
    const result = await savedReportService.list({
      semester_id: selectedSemesterId, mine: mine ? 1 : undefined,
      type: activeTab?.key || filters.type, class_id: filters.class_id,
      search: filters.search.trim(), page: filters.page,
    })
    if (result.success) {
      setRows(result.data || [])
      setMeta(result.meta || { current_page: 1, last_page: 1, total: 0 })
      setError('')
    } else setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    if (!selectedSemesterId) return undefined
    savedReportService.list({
      semester_id: selectedSemesterId, mine: mine ? 1 : undefined,
      type: activeTab?.key || filters.type, class_id: filters.class_id,
      search: filters.search.trim(), page: filters.page,
    }).then((result) => {
      if (!alive) return
      if (result.success) {
        setRows(result.data || [])
        setMeta(result.meta || { current_page: 1, last_page: 1, total: 0 })
        setError('')
      } else setError(result.error)
      setLoading(false)
    })
    return () => { alive = false }
  }, [selectedSemesterId, mine, activeTab?.key, filters.type, filters.class_id, filters.search, filters.page])

  function openCreate() {
    setForm({ ...emptyForm, type: activeTab?.key || 'nilai', class_id: filters.class_id })
    setError('')
    setShowForm(true)
  }

  async function createReport(event) {
    event.preventDefault()
    if (!selectedSemesterId) return
    setBusy(true)
    setError('')
    const result = await savedReportService.create({
      ...form, semester_id: selectedSemesterId,
      student_id: form.type === 'per-siswa' ? form.student_id : null,
      title: form.title.trim() || null,
    })
    setBusy(false)
    if (!result.success) {
      setError(Object.values(result.errors || {}).flat().join(' ') || result.error)
      return
    }
    setShowForm(false)
    setMessage('Laporan berhasil dibuat dari data tersimpan.')
    setPreview(result.data)
    await loadReports()
  }

  async function openReport(id) {
    setBusy(true)
    const result = await savedReportService.get(id)
    setBusy(false)
    if (!result.success) { setError(result.error); return }
    setEditing(false)
    setPreview(result.data)
  }

  async function saveDetails(event) {
    event.preventDefault()
    setBusy(true)
    const result = await savedReportService.update(preview.id, {
      title: preview.title.trim(), notes: preview.notes || null,
    })
    setBusy(false)
    if (!result.success) {
      setError(Object.values(result.errors || {}).flat().join(' ') || result.error)
      return
    }
    setPreview(result.data)
    setEditing(false)
    setMessage('Detail laporan berhasil diperbarui.')
    await loadReports()
  }

  async function refreshReport() {
    setBusy(true)
    const result = await savedReportService.refresh(preview.id)
    setBusy(false)
    if (!result.success) { setError(result.error); return }
    setPreview(result.data)
    setMessage('Isi laporan diperbarui dari data terbaru.')
    await loadReports()
  }

  async function deleteReport() {
    if (!window.confirm(`Hapus laporan “${preview.title}”?`)) return
    setBusy(true)
    const result = await savedReportService.remove(preview.id)
    setBusy(false)
    if (!result.success) { setError(result.error); return }
    setPreview(null)
    setMessage('Laporan berhasil dihapus.')
    await loadReports()
  }

  // Active filter count (class_id + type if on root/mine)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.class_id) count += 1
    if (!activeTab && filters.type) count += 1
    return count
  }, [activeTab, filters.class_id, filters.type])

  // Summary Items: REAL metrics only
  const summaryItems = useMemo(() => [
    {
      title: 'Total Laporan',
      value: (meta.total ?? 0).toLocaleString('id-ID'),
      icon: 'document',
      tone: 'green',
      caption: 'Tersimpan di sistem',
      positive: true,
    },
    {
      title: 'Kelas Tersedia',
      value: (options.classes?.length || 0).toLocaleString('id-ID'),
      icon: 'award',
      tone: 'blue',
      caption: 'Semester ini',
      positive: options.classes?.length > 0,
    },
  ], [meta.total, options.classes?.length])

  // Mobile Filter Sheet Fields
  const filterFields = useMemo(() => [
    {
      key: 'semester',
      label: 'Semester',
      disabled: true,
      options: [{ value: selectedSemesterId || '', label: selectedSemester?.name || '-' }],
    },
    {
      key: 'class_id',
      label: 'Kelas',
      options: [
        { value: '', label: 'Semua kelas' },
        ...(options.classes || []).map((c) => ({ value: String(c.id), label: c.name })),
      ],
    },
    {
      key: 'type',
      label: 'Jenis Laporan',
      disabled: Boolean(activeTab),
      options: [
        { value: '', label: 'Semua jenis' },
        ...reportTabs.map((t) => ({ value: t.key, label: t.label })),
      ],
    },
  ], [activeTab, options.classes, selectedSemester?.name, selectedSemesterId])

  const handleMobileFilterChange = (key, val) => {
    setFilters((current) => ({ ...current, [key]: val, page: 1 }))
  }

  const handleMobileFilterReset = () => {
    setFilters((current) => ({ ...current, class_id: '', type: '', page: 1 }))
  }

  const heading = mine ? 'Laporan Saya' : activeTab?.label || 'Daftar Laporan'

  return (
    <section className="reporting-page reporting-saved-page">
      {/* Desktop Header & Breadcrumb */}
      {!isMobile && (
        <header className="reporting-header reporting-desktop-only">
          <div>
            <h2>{heading}</h2>
            <p>{mine ? 'Laporan yang Anda buat dan simpan.' : 'Buat dan kelola laporan dari data akademik yang tersimpan.'}</p>
          </div>
          <div className="reporting-breadcrumb">
            <Breadcrumb items={['Dashboard', 'Laporan', heading]} />
          </div>
        </header>
      )}

      {/* Desktop Horizontal Nav */}
      {!isMobile && (
        <nav className="saved-report-nav reporting-desktop-only" aria-label="Menu laporan">
          <Link className={pathname === '/laporan' ? 'active' : ''} to="/laporan">Daftar Laporan</Link>
          <Link className={mine ? 'active' : ''} to="/laporan/saya">Laporan Saya</Link>
          {reportTabs.map((tab) => (
            <Link className={pathname === tab.route ? 'active' : ''} key={tab.key} to={tab.route}>
              {tab.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Mobile 3x3 Module Grid */}
      {isMobile && (
        <ReportMobileModuleGrid />
      )}

      {/* Alert Messages */}
      {message && (
        <div className="saved-report-message" role="status">
          {message}
          <button onClick={() => setMessage('')} type="button" aria-label="Tutup pesan">×</button>
        </div>
      )}
      {error && (
        <div className="saved-report-error" role="alert">
          {error}
          <button onClick={() => setError('')} type="button" aria-label="Tutup kesalahan">×</button>
        </div>
      )}

      {/* Desktop Toolbar */}
      {!isMobile && (
        <div className="saved-report-toolbar reporting-desktop-only">
          <div>
            <strong>{meta.total} laporan</strong>
            <span>{selectedSemester?.name || 'Semester belum dipilih'}</span>
          </div>
          <button
            className="saved-report-primary"
            disabled={!selectedSemesterId || !options.classes?.length}
            onClick={openCreate}
            type="button"
          >
            + Buat Laporan
          </button>
        </div>
      )}

      {/* Desktop Filters */}
      {!isMobile && (
        <div className="saved-report-filters reporting-desktop-only">
          <label>
            Jenis laporan
            <select
              disabled={Boolean(activeTab)}
              value={type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))}
            >
              <option value="">Semua jenis</option>
              {reportTabs.map((tab) => (
                <option key={tab.key} value={tab.key}>{tab.label}</option>
              ))}
            </select>
          </label>
          <label>
            Kelas
            <select
              value={filters.class_id}
              onChange={(event) => setFilters((current) => ({ ...current, class_id: event.target.value, page: 1 }))}
            >
              <option value="">Semua kelas</option>
              {(options.classes || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Cari laporan
            <input
              type="search"
              placeholder="Judul, kelas, atau pembuat"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
            />
          </label>
        </div>
      )}

      {/* Mobile Flow: Ringkasan Data + Toolbar */}
      {isMobile && (
        <>
          <MasterSummary
            items={summaryItems}
            title="Ringkasan Data"
            subtitle="Statistik terkini laporan akademik"
          />

          <div className="report-mobile-toolbar-card">
            <MasterMobileToolbar
              searchQuery={filters.search}
              onSearchChange={(val) => setFilters((current) => ({ ...current, search: val, page: 1 }))}
              searchPlaceholder="Cari judul, kelas, atau pembuat..."
              filterFields={filterFields}
              filters={{
                semester: selectedSemesterId,
                class_id: filters.class_id,
                type: type || '',
              }}
              onFilterChange={handleMobileFilterChange}
              onFilterReset={handleMobileFilterReset}
              activeFilterCount={activeFilterCount}
              onAdd={openCreate}
              addLabel="Buat Laporan"
              extraActions={[
                {
                  icon: 'refresh',
                  label: 'Segarkan Data',
                  onClick: () => loadReports(),
                },
              ]}
            />
          </div>
        </>
      )}

      {/* Data Section Card */}
      <section className="report-data-section-card" aria-label={`Daftar ${heading}`}>
        {isMobile && (
          <div className="report-data-section-header">
            <div className="report-data-section-copy">
              <h3 className="report-data-section-title">{heading}</h3>
              <span className="report-data-section-desc">Daftar laporan akademik yang tersimpan</span>
            </div>
            <span className="report-data-section-count">
              {meta.total} data
            </span>
          </div>
        )}

        {/* Desktop List */}
        {!isMobile && (
          <div className="saved-report-list reporting-desktop-only">
            {contextLoading || loading ? (
              <p className="saved-report-empty">Memuat laporan...</p>
            ) : rows.length === 0 ? (
              <p className="saved-report-empty">Belum ada laporan tersimpan untuk pilihan ini. Pilih “Buat Laporan” untuk menambahkan.</p>
            ) : (
              rows.map((report) => (
                <article className="saved-report-row" key={report.id}>
                  <div>
                    <strong>{report.title}</strong>
                    <span>{report.type_label} · {report.class_name}{report.student_name ? ` · ${report.student_name}` : ''}</span>
                  </div>
                  <div>
                    <span>Dibuat oleh {report.creator_name || '-'}</span>
                    <small>{dateLabel(report.generated_at)} · {report.row_count} baris</small>
                  </div>
                  <button onClick={() => openReport(report.id)} type="button">Lihat laporan</button>
                </article>
              ))
            )}
          </div>
        )}

        {/* Mobile Record Cards List */}
        {isMobile && (
          <div className="report-mobile-record-list">
            {contextLoading || loading ? (
              <p className="saved-report-empty">Memuat laporan...</p>
            ) : rows.length === 0 ? (
              <p className="saved-report-empty">Belum ada laporan tersimpan untuk pilihan ini. Pilih “Buat Laporan” untuk menambahkan.</p>
            ) : (
              rows.map((report) => (
                <ReportMobileRecordCard
                  key={report.id}
                  report={report}
                  onOpen={() => openReport(report.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="report-pagination-wrapper">
            {!isMobile && (
              <div className="saved-report-pagination reporting-desktop-only">
                <button
                  disabled={meta.current_page <= 1}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                  type="button"
                >
                  Sebelumnya
                </button>
                <span>Halaman {meta.current_page} dari {meta.last_page}</span>
                <button
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                  type="button"
                >
                  Berikutnya
                </button>
              </div>
            )}

            {isMobile && (
              <MasterPagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                totalItems={meta.total}
                rowsPerPage={20}
                onPageChange={(p) => setFilters((current) => ({ ...current, page: p }))}
                onRowsPerPageChange={() => {}}
              />
            )}
          </div>
        )}
      </section>

      {/* Create Modal Form */}
      {showForm && (
        <div
          className="saved-report-overlay"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}
        >
          <section aria-labelledby="saved-report-create-title" aria-modal="true" className="saved-report-modal saved-report-create" role="dialog">
            <div className="master-mobile-sheet-handle-wrapper" aria-hidden="true">
              <div className="master-mobile-sheet-handle" />
            </div>
            <header>
              <div>
                <h3 id="saved-report-create-title">Buat Laporan</h3>
                <p>Isi laporan diambil dari data kelas dan semester yang dipilih.</p>
              </div>
              <button aria-label="Tutup" className="saved-report-close-btn" onClick={() => setShowForm(false)} type="button">×</button>
            </header>
            {error && <div className="saved-report-error" role="alert">{error}</div>}
            <form onSubmit={createReport}>
              <div className="saved-report-form-grid">
                <div className="saved-report-field-group">
                  <div className="saved-report-field-header">
                    <span className="saved-report-field-label">
                      Jenis Laporan <b className="required-star">*</b>
                    </span>
                  </div>
                  <div className="saved-report-select-wrap">
                    <select
                      id="report-field-type"
                      disabled={Boolean(activeTab)}
                      required
                      value={form.type}
                      onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, student_id: '' }))}
                    >
                      {reportTabs.map((tab) => (
                        <option key={tab.key} value={tab.key}>{tab.label}</option>
                      ))}
                    </select>
                    <Icon name="chevron" className="saved-report-select-chevron" />
                  </div>
                </div>

                <div className="saved-report-field-group">
                  <div className="saved-report-field-header">
                    <span className="saved-report-field-label">
                      Semester
                    </span>
                  </div>
                  <input
                    id="report-field-semester"
                    readOnly
                    value={`${selectedSemester?.name || '-'} · ${selectedSemester?.academic_year?.name || selectedSemester?.academic_year_name || ''}`}
                  />
                </div>

                <div className="saved-report-field-group">
                  <div className="saved-report-field-header">
                    <span className="saved-report-field-label">
                      Kelas <b className="required-star">*</b>
                    </span>
                  </div>
                  <div className="saved-report-select-wrap">
                    <select
                      id="report-field-class"
                      required
                      value={form.class_id}
                      onChange={(event) => {
                        setStudents([])
                        setForm((current) => ({ ...current, class_id: event.target.value, student_id: '' }))
                      }}
                    >
                      <option value="">Pilih kelas</option>
                      {(options.classes || []).map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <Icon name="chevron" className="saved-report-select-chevron" />
                  </div>
                </div>

                {form.type === 'per-siswa' && (
                  <div className="saved-report-field-group">
                    <div className="saved-report-field-header">
                      <span className="saved-report-field-label">
                        Siswa <b className="required-star">*</b>
                      </span>
                    </div>
                    <div className="saved-report-select-wrap">
                      <select
                        id="report-field-student"
                        required
                        value={form.student_id}
                        onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))}
                      >
                        <option value="">Pilih siswa</option>
                        {students.map((item) => (
                          <option key={item.id} value={item.id}>{item.nis} · {item.name}</option>
                        ))}
                      </select>
                      <Icon name="chevron" className="saved-report-select-chevron" />
                    </div>
                  </div>
                )}

                <div className="saved-report-field-group wide">
                  <div className="saved-report-field-header">
                    <span className="saved-report-field-label">
                      Judul Laporan
                    </span>
                    <span className="saved-report-field-badge">Opsional</span>
                  </div>
                  <input
                    id="report-field-title"
                    maxLength="200"
                    placeholder="Diisi otomatis jika kosong"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>

                <div className="saved-report-field-group wide">
                  <div className="saved-report-field-header">
                    <span className="saved-report-field-label">
                      Catatan
                    </span>
                    <span className="saved-report-field-badge">Opsional</span>
                  </div>
                  <textarea
                    id="report-field-notes"
                    maxLength="2000"
                    rows="3"
                    placeholder="Tambahkan catatan jika diperlukan..."
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </div>
              </div>

              <footer>
                <button
                  type="button"
                  className="saved-report-cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </button>
                <button
                  className="saved-report-primary"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? 'Menyimpan...' : 'Buat dan Simpan'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="saved-report-overlay"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null) }}
        >
          <section aria-labelledby="saved-report-preview-title" aria-modal="true" className="saved-report-modal saved-report-preview" role="dialog">
            <div className="master-mobile-sheet-handle-wrapper" aria-hidden="true">
              <div className="master-mobile-sheet-handle" />
            </div>
            <header>
              <div>
                <h3 id="saved-report-preview-title">{preview.title}</h3>
                <p>{preview.type_label} · {preview.class_name} · {preview.semester_name} {preview.academic_year_name}</p>
              </div>
              <button aria-label="Tutup" className="saved-report-close-btn" onClick={() => setPreview(null)} type="button">×</button>
            </header>
            {error && <div className="saved-report-error" role="alert">{error}</div>}
            <div className="saved-report-preview-body">
              <div className="saved-report-meta">
                <span>Dibuat oleh <strong>{preview.creator_name || '-'}</strong></span>
                <span>Diperbarui <strong>{dateLabel(preview.generated_at)}</strong></span>
                <span>Jumlah baris <strong>{preview.row_count}</strong></span>
              </div>
              {editing ? (
                <form className="saved-report-edit" onSubmit={saveDetails}>
                  <label>
                    Judul
                    <input
                      maxLength="200"
                      required
                      value={preview.title}
                      onChange={(event) => setPreview((current) => ({ ...current, title: event.target.value }))}
                    />
                  </label>
                  <label>
                    Catatan
                    <textarea
                      maxLength="2000"
                      rows="2"
                      value={preview.notes || ''}
                      onChange={(event) => setPreview((current) => ({ ...current, notes: event.target.value }))}
                    />
                  </label>
                  <div>
                    <button onClick={() => openReport(preview.id)} type="button">Batal</button>
                    <button className="saved-report-primary" disabled={busy} type="submit">Simpan perubahan</button>
                  </div>
                </form>
              ) : (
                preview.notes && <p className="saved-report-note">{preview.notes}</p>
              )}
              <div className="saved-report-table-wrap">
                <table>
                  <thead>
                    <tr>
                      {(preview.snapshot?.columns || []).map((column, index) => (
                        <th key={`${column}-${index}`}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.snapshot?.rows || []).length ? (
                      preview.snapshot.rows.map((row, index) => (
                        <tr key={index}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell ?? '-'}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={preview.snapshot?.columns?.length || 1}>Belum ada data sumber untuk laporan ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <footer>
              <div>
                {preview.can_modify && (
                  <>
                    <button disabled={busy} onClick={() => setEditing(true)} type="button">Ubah Detail</button>
                    <button disabled={busy} onClick={refreshReport} type="button">Perbarui Data</button>
                    <button className="danger" disabled={busy} onClick={deleteReport} type="button">Hapus</button>
                  </>
                )}
              </div>
              <div>
                <button onClick={() => exportCsv(preview)} type="button">Unduh CSV</button>
                <button onClick={() => excelService.downloadSavedReport(preview.id).catch((cause) => setError(cause.message))} type="button">Export Excel</button>
                <button className="saved-report-primary" onClick={() => window.print()} type="button">Cetak</button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </section>
  )
}

export default Laporan
