import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { reportTabs } from '../../data/laporan.js'
import savedReportService from '../../services/savedReportService.js'
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

  const heading = mine ? 'Laporan Saya' : activeTab?.label || 'Daftar Laporan'
  return <section className="reporting-page reporting-saved-page">
    <header className="reporting-header">
      <div><h2>{heading}</h2><p>{mine ? 'Laporan yang Anda buat dan simpan.' : 'Buat dan kelola laporan dari data akademik yang tersimpan.'}</p></div>
      <div className="reporting-breadcrumb"><Breadcrumb items={['Dashboard', 'Laporan', heading]} /></div>
    </header>
    <nav className="saved-report-nav" aria-label="Menu laporan">
      <Link className={pathname === '/laporan' ? 'active' : ''} to="/laporan">Daftar Laporan</Link>
      <Link className={mine ? 'active' : ''} to="/laporan/saya">Laporan Saya</Link>
      {reportTabs.map((tab) => <Link className={pathname === tab.route ? 'active' : ''} key={tab.key} to={tab.route}>{tab.label}</Link>)}
    </nav>
    {message && <div className="saved-report-message" role="status">{message}<button onClick={() => setMessage('')} type="button" aria-label="Tutup pesan">×</button></div>}
    {error && <div className="saved-report-error" role="alert">{error}<button onClick={() => setError('')} type="button" aria-label="Tutup kesalahan">×</button></div>}
    <div className="saved-report-toolbar">
      <div><strong>{meta.total} laporan</strong><span>{selectedSemester?.name || 'Semester belum dipilih'}</span></div>
      <button className="saved-report-primary" disabled={!selectedSemesterId || !options.classes?.length} onClick={openCreate} type="button">+ Buat Laporan</button>
    </div>
    <div className="saved-report-filters">
      <label>Jenis laporan<select disabled={!!activeTab} value={type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))}><option value="">Semua jenis</option>{reportTabs.map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}</select></label>
      <label>Kelas<select value={filters.class_id} onChange={(event) => setFilters((current) => ({ ...current, class_id: event.target.value, page: 1 }))}><option value="">Semua kelas</option>{(options.classes || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Cari laporan<input type="search" placeholder="Judul, kelas, atau pembuat" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} /></label>
    </div>
    <div className="saved-report-list">
      {contextLoading || loading ? <p className="saved-report-empty">Memuat laporan...</p> : rows.length === 0 ? <p className="saved-report-empty">Belum ada laporan tersimpan untuk pilihan ini. Pilih “Buat Laporan” untuk menambahkan.</p> : rows.map((report) => <article className="saved-report-row" key={report.id}>
        <div><strong>{report.title}</strong><span>{report.type_label} · {report.class_name}{report.student_name ? ` · ${report.student_name}` : ''}</span></div>
        <div><span>Dibuat oleh {report.creator_name || '-'}</span><small>{dateLabel(report.generated_at)} · {report.row_count} baris</small></div>
        <button onClick={() => openReport(report.id)} type="button">Lihat laporan</button>
      </article>)}
    </div>
    {meta.last_page > 1 && <div className="saved-report-pagination"><button disabled={meta.current_page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} type="button">Sebelumnya</button><span>Halaman {meta.current_page} dari {meta.last_page}</span><button disabled={meta.current_page >= meta.last_page} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} type="button">Berikutnya</button></div>}

    {showForm && <div className="saved-report-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}><section aria-labelledby="saved-report-create-title" aria-modal="true" className="saved-report-modal saved-report-create" role="dialog"><header><div><h3 id="saved-report-create-title">Buat Laporan</h3><p>Isi laporan diambil dari data kelas dan semester yang dipilih.</p></div><button aria-label="Tutup" onClick={() => setShowForm(false)} type="button">×</button></header>{error && <div className="saved-report-error" role="alert">{error}</div>}<form onSubmit={createReport}>
      <div className="saved-report-form-grid"><label>Jenis laporan<select disabled={!!activeTab} required value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, student_id: '' }))}>{reportTabs.map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}</select></label><label>Semester<input readOnly value={`${selectedSemester?.name || '-'} · ${selectedSemester?.academic_year?.name || selectedSemester?.academic_year_name || ''}`} /></label><label>Kelas<select required value={form.class_id} onChange={(event) => { setStudents([]); setForm((current) => ({ ...current, class_id: event.target.value, student_id: '' })) }}><option value="">Pilih kelas</option>{(options.classes || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{form.type === 'per-siswa' && <label>Siswa<select required value={form.student_id} onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))}><option value="">Pilih siswa</option>{students.map((item) => <option key={item.id} value={item.id}>{item.nis} · {item.name}</option>)}</select></label>}<label className="wide">Judul laporan <span>(opsional)</span><input maxLength="200" placeholder="Diisi otomatis jika kosong" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label><label className="wide">Catatan <span>(opsional)</span><textarea maxLength="2000" rows="3" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label></div>
      <footer><button onClick={() => setShowForm(false)} type="button">Batal</button><button className="saved-report-primary" disabled={busy || !form.class_id || (form.type === 'per-siswa' && !form.student_id)} type="submit">{busy ? 'Menyimpan...' : 'Buat dan Simpan'}</button></footer></form></section></div>}

    {preview && <div className="saved-report-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null) }}><section aria-labelledby="saved-report-preview-title" aria-modal="true" className="saved-report-modal saved-report-preview" role="dialog"><header><div><h3 id="saved-report-preview-title">{preview.title}</h3><p>{preview.type_label} · {preview.class_name} · {preview.semester_name} {preview.academic_year_name}</p></div><button aria-label="Tutup" onClick={() => setPreview(null)} type="button">×</button></header>{error && <div className="saved-report-error" role="alert">{error}</div>}<div className="saved-report-preview-body">
      <div className="saved-report-meta"><span>Dibuat oleh <strong>{preview.creator_name || '-'}</strong></span><span>Diperbarui <strong>{dateLabel(preview.generated_at)}</strong></span><span>Jumlah baris <strong>{preview.row_count}</strong></span></div>
      {editing ? <form className="saved-report-edit" onSubmit={saveDetails}><label>Judul<input maxLength="200" required value={preview.title} onChange={(event) => setPreview((current) => ({ ...current, title: event.target.value }))} /></label><label>Catatan<textarea maxLength="2000" rows="2" value={preview.notes || ''} onChange={(event) => setPreview((current) => ({ ...current, notes: event.target.value }))} /></label><div><button onClick={() => openReport(preview.id)} type="button">Batal</button><button className="saved-report-primary" disabled={busy} type="submit">Simpan perubahan</button></div></form> : preview.notes && <p className="saved-report-note">{preview.notes}</p>}
      <div className="saved-report-table-wrap"><table><thead><tr>{(preview.snapshot?.columns || []).map((column, index) => <th key={`${column}-${index}`}>{column}</th>)}</tr></thead><tbody>{(preview.snapshot?.rows || []).length ? preview.snapshot.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell ?? '-'}</td>)}</tr>) : <tr><td colSpan={preview.snapshot?.columns?.length || 1}>Belum ada data sumber untuk laporan ini.</td></tr>}</tbody></table></div>
    </div><footer><div>{preview.can_modify && <><button disabled={busy} onClick={() => setEditing(true)} type="button">Ubah Detail</button><button disabled={busy} onClick={refreshReport} type="button">Perbarui Data</button><button className="danger" disabled={busy} onClick={deleteReport} type="button">Hapus</button></>}</div><div><button onClick={() => exportCsv(preview)} type="button">Unduh CSV</button><button className="saved-report-primary" onClick={() => window.print()} type="button">Cetak</button></div></footer></section></div>}
  </section>
}

export default Laporan
