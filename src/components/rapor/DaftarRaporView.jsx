import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { assessmentService } from '../../services/assessmentService.js'
import RaporPagination from './RaporPagination.jsx'
import RaporSummary from './RaporSummary.jsx'

const statusOptions = [
  ['Semua Status', ''],
  ['DRAF PRATINJAU', 'DRAF PRATINJAU'],
  ['TERVALIDASI (DRAF - Menunggu Konfirmasi Kebijakan Sekolah)', 'TERVALIDASI (DRAF - Menunggu Konfirmasi Kebijakan Sekolah)'],
  ['RAPOR FINAL', 'RAPOR FINAL'],
]

const statusLegend = [
  ['DRAF PRATINJAU', 'Nilai belum seluruhnya terkunci.'],
  ['TERVALIDASI (DRAF - Menunggu Konfirmasi Kebijakan Sekolah)', 'Nilai terkunci, menunggu konfirmasi kebijakan sekolah.'],
  ['RAPOR FINAL', 'Nilai terkunci, data lengkap, dan konfigurasi sekolah disetujui.'],
]

function statusSlug(status) {
  return status.toLowerCase().replaceAll(' ', '-').replaceAll(/[()]/g, '')
}

function formatSummary(summary, contextName) {
  const total = summary?.total_students ?? 0
  const complete = summary?.complete_count ?? 0
  return [
    { title: 'Total Siswa', value: String(total), caption: contextName || 'Konteks belum dipilih', icon: 'document', tone: 'green', captionIcon: 'users' },
    { title: 'Rapor Draf', value: String(summary?.draft_count ?? 0), caption: `${total ? Math.round(((summary?.draft_count ?? 0) / total) * 100) : 0}% dari total siswa`, icon: 'users', tone: 'blue', captionIcon: 'trend' },
    { title: 'Tervalidasi', value: String(summary?.validated_draft_count ?? 0), caption: 'Menunggu konfirmasi sekolah', icon: 'clock', tone: 'orange', captionIcon: 'users' },
    { title: 'Rapor Final', value: String(summary?.final_count ?? 0), caption: `${complete} data lengkap`, icon: 'download', tone: 'purple', captionIcon: 'download' },
    { title: 'Terkunci', value: String(summary?.locked_count ?? 0), caption: 'Status nilai seluruh mapel', icon: 'info', tone: 'teal', captionIcon: 'info' },
  ]
}

function DaftarRaporView({ onNotify }) {
  const [contextOptions, setContextOptions] = useState({ classes: [], semesters: [] })
  const [filters, setFilters] = useState({ classId: '', semesterId: '', status: '' })
  const [academicYear, setAcademicYear] = useState(null)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 8, last_page: 1, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingContext, setLoadingContext] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    let active = true
    const loadContext = async () => {
      setLoadingContext(true)
      const result = await assessmentService.getContext()
      if (!active) return
      if (!result.success) {
        setError(result.error)
        setLoadingContext(false)
        return
      }
      const courses = result.data.assigned_courses ?? []
      const classes = [...new Map(courses.map((course) => [course.class_id, { id: course.class_id, name: course.class_name }])).values()]
      if (result.data.homeroom_class && !classes.some((item) => item.id === result.data.homeroom_class.class_id)) {
        classes.push({ id: result.data.homeroom_class.class_id, name: result.data.homeroom_class.class_name })
      }
      const semester = result.data.active_semester
      setContextOptions({ classes, semesters: semester ? [semester] : [] })
      setFilters((current) => ({ ...current, classId: current.classId || String(classes[0]?.id ?? ''), semesterId: current.semesterId || String(semester?.id ?? '') }))
      setLoadingContext(false)
    }
    loadContext()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!filters.classId || !filters.semesterId) return
    let active = true
    const loadList = async () => {
      setLoading(true)
      setError('')
      const result = await assessmentService.getReportList({
        class_id: filters.classId,
        semester_id: filters.semesterId,
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: searchQuery.trim(),
        status: filters.status,
      })
      if (!active) return
      if (!result.success) {
        setRecords([])
        setSummary(null)
        setError(result.error)
      } else {
        setRecords(result.data.students ?? [])
        setSummary(result.data.summary ?? null)
        setPagination((current) => ({ ...current, ...(result.data.pagination ?? {}), per_page: current.per_page }))
        setAcademicYear(result.data.context?.academic_year ?? null)
      }
      setLoading(false)
    }
    loadList()
    return () => { active = false }
  }, [filters.classId, filters.semesterId, filters.status, pagination.current_page, pagination.per_page, searchQuery, reloadNonce])

  const selectedClass = contextOptions.classes.find((item) => String(item.id) === String(filters.classId))
  const selectedSemester = contextOptions.semesters.find((item) => String(item.id) === String(filters.semesterId))
  const summaryItems = useMemo(() => formatSummary(summary, selectedClass?.name), [selectedClass?.name, summary])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPagination((current) => ({ ...current, current_page: 1 }))
  }

  const refreshData = () => {
    setPagination((current) => ({ ...current, current_page: 1 }))
    setReloadNonce((current) => current + 1)
    onNotify('Memuat ulang daftar rapor dari server.')
  }

  const displayError = error && !loadingContext
  const pageStart = pagination.total === 0 ? 0 : ((pagination.current_page - 1) * pagination.per_page) + 1

  return (
    <>
      <RaporSummary items={summaryItems} />
      <section className="report-list-workspace">
        <div className="report-list-toolbar">
          <div className="report-filter-grid">
            <label className="report-field"><span>Kelas</span><select value={filters.classId} onChange={(event) => updateFilter('classId', event.target.value)} disabled={loadingContext}><option value="">Pilih kelas</option>{contextOptions.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="report-field"><span>Tahun Ajaran</span><input readOnly value={academicYear?.name ?? '-'} aria-label="Tahun ajaran authoritative" /></label>
            <label className="report-field"><span>Semester</span><select value={filters.semesterId} onChange={(event) => updateFilter('semesterId', event.target.value)} disabled={loadingContext}><option value="">Pilih semester</option>{contextOptions.semesters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="report-field"><span>Status Rapor</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>{statusOptions.map(([label, value]) => <option key={value || 'all'} value={value}>{label}</option>)}</select></label>
          </div>
          <label className="report-search"><SearchInput aria-label="Cari siswa berdasarkan NIS, NISN, atau nama" onChange={(event) => { setSearchQuery(event.target.value); setPagination((current) => ({ ...current, current_page: 1 })) }} placeholder="Cari siswa (NIS/NISN/Nama)..." value={searchQuery} /><Icon name="search" /></label>
        </div>

        <div className="report-list-actions">
          <p><Icon name="info" />Data daftar rapor dan status berasal dari konteks akademik serta backend penilaian.</p>
          <div><Button className="report-button secondary" disabled title="Workflow generate belum termasuk Phase 2F"><Icon name="settings" />Generate Semua Rapor</Button><Button className="report-button primary" onClick={refreshData}><Icon name="reset" />Refresh Data</Button></div>
        </div>

        {displayError && <div className="report-error-state" role="alert"><Icon name="info" /><strong>{error}</strong><span>Periksa konteks kelas dan semester, lalu coba refresh.</span></div>}
        <div className="report-table-heading"><h3>Daftar Rapor Siswa</h3>{selectedSemester && <span>{selectedClass?.name} - {selectedSemester.name}</span>}</div>
        <div className="report-table-scroll">
          <table className="report-list-table">
            <thead><tr><th>No</th><th>NIS</th><th>NISN</th><th>Nama Siswa</th><th>Tanggal Lahir</th><th>Status Rapor</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td className="report-empty-row" colSpan="7"><span className="report-spinner" />Memuat data daftar rapor...</td></tr> : records.length === 0 ? <tr><td className="report-empty-row" colSpan="7"><Icon name="search" /><strong>{displayError ? 'Daftar rapor tidak dapat dimuat.' : 'Tidak ada siswa pada konteks ini.'}</strong><span>{displayError ? 'Tidak ada fallback ke data statis.' : 'Ubah filter atau gunakan kata kunci yang berbeda.'}</span></td></tr> : records.map((student, index) => (
                <tr key={student.student_id}><td>{pageStart + index}</td><td>{student.nis ?? '-'}</td><td>{student.nisn ?? '-'}</td><td className="report-student-name">{student.name ?? '-'}</td><td>{student.birth ?? '-'}</td><td><span className={`report-status ${statusSlug(student.report_status)}`}>{student.report_status}</span></td><td><div className="report-row-actions"><button onClick={() => onNotify(`Preview rapor ${student.name} tersedia pada halaman Rapor Per Siswa.`)} type="button"><Icon name="eye" />Preview</button><span className="report-more-wrap"><button aria-label={`Aksi lainnya untuk ${student.name}`} className="icon-only" onClick={() => setOpenMenuId((current) => current === student.student_id ? null : student.student_id)} type="button"><Icon name="more" /></button>{openMenuId === student.student_id && <span className="report-action-menu"><button onClick={() => onNotify(`Membuka rapor ${student.name}.`)} type="button">Lihat Rapor</button><button disabled type="button">Generate Ulang</button><button disabled type="button">Tandai Perlu Revisi</button></span>}</span></div></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <RaporPagination currentPage={pagination.current_page} onPageChange={(page) => setPagination((current) => ({ ...current, current_page: page }))} onRowsPerPageChange={(value) => setPagination((current) => ({ ...current, per_page: value, current_page: 1 }))} rowsPerPage={pagination.per_page} totalItems={pagination.total} totalPages={pagination.last_page} />
      </section>
      <div className="report-support-grid">
        <section className="report-support-card"><h3>Keterangan Status Rapor</h3><div className="report-legend-grid">{statusLegend.map(([status, description]) => <div key={status}><span className={`report-status ${statusSlug(status)}`}>{status}</span><p>{description}</p></div>)}</div></section>
        <section className="report-support-card"><h3>Aksi Cepat</h3><div className="report-quick-grid"><Link to="/rapor-leger/generate-rapor"><Icon name="settings" /><span><strong>Preview Rapor</strong><small>Lihat data rapor siswa</small></span></Link><Link to="/rapor-leger/rapor-per-siswa"><Icon name="eye" /><span><strong>Preview Acak</strong><small>Lihat contoh rapor siswa</small></span></Link><Link to="/rapor-leger/leger-nilai"><Icon name="table" /><span><strong>Leger Nilai Kelas</strong><small>Lihat rekap nilai kelas</small></span></Link><Link to="/rapor-leger/cetak-export"><Icon name="document" /><span><strong>Export Leger PDF</strong><small>Persiapkan dokumen</small></span></Link></div></section>
      </div>
    </>
  )
}

export default DaftarRaporView
