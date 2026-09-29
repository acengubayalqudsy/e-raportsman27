import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import { assessmentService } from '../../services/assessmentService.js'
import academicService from '../../services/academicService.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import RaporPagination from './RaporPagination.jsx'
import RaporSummary from './RaporSummary.jsx'
import SupplementaryDataModal from './SupplementaryDataModal.jsx'

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
  const lower = (status || '').toLowerCase()
  if (lower.includes('final')) return 'rapor-final'
  if (lower.includes('tervalidasi')) return 'tervalidasi'
  if (lower.includes('draf')) return 'draf-pratinjau'
  return lower.replaceAll(' ', '-').replaceAll(/[()]/g, '')
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
  const navigate = useNavigate()
  const { selectedYear, allSemesters } = useAcademicContext()
  const { hasRole } = useAuth()
  const isAdmin = Boolean(hasRole && hasRole('admin'))
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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('absensi')

  useEffect(() => {
    let active = true
    const loadContext = async () => {
      setLoadingContext(true)
      const [result, classesRes] = await Promise.all([
        assessmentService.getContext(),
        isAdmin ? academicService.getClasses({ per_page: 100 }) : Promise.resolve(null),
      ])
      if (!active) return
      if (!result.success) {
        setError(result.error)
        setLoadingContext(false)
        return
      }

      const homeroomList = Array.isArray(result.data.homeroom_classes) && result.data.homeroom_classes.length > 0
        ? result.data.homeroom_classes
        : (result.data.homeroom_class ? [result.data.homeroom_class] : [])
      const courses = result.data.assigned_courses ?? []

      const classMap = new Map()
      homeroomList.forEach((cls) => {
        const id = cls.class_id || cls.id
        if (id) {
          classMap.set(String(id), {
            id,
            name: cls.class_name || cls.name,
            academic_year_id: cls.academic_year_id,
            academic_year_name: cls.academic_year_name,
            semester_id: cls.semester_id,
            semester_name: cls.semester_name,
          })
        }
      })
      courses.forEach((course) => {
        const id = String(course.class_id)
        if (id && !classMap.has(id)) {
          classMap.set(id, {
            id: course.class_id,
            name: course.class_name,
            academic_year_id: course.academic_year_id,
            semester_id: course.semester_id,
          })
        }
      })

      if (isAdmin && classesRes?.success && Array.isArray(classesRes.data)) {
        classesRes.data.forEach((cls) => {
          const id = String(cls.id)
          if (!classMap.has(id)) {
            classMap.set(id, {
              id: cls.id,
              name: cls.name,
              academic_year_id: cls.academic_year_id,
              academic_year_name: cls.academic_year?.name,
            })
          }
        })
      }

      const classes = Array.from(classMap.values())
      const initialClass = classes[0]
      const initialClassId = String(initialClass?.id ?? '')

      const initialYearId = String(initialClass?.academic_year_id || result.data.active_academic_year?.id || '')
      const sems = (allSemesters || []).filter((s) => String(s.academic_year_id) === initialYearId)
      const semesters = sems.length > 0 ? sems : (result.data.active_semester ? [result.data.active_semester] : [])

      const initialSemesterId = String(
        initialClass?.semester_id
        || semesters.find((s) => s.status === 'Aktif')?.id
        || semesters[0]?.id
        || result.data.active_semester?.id
        || ''
      )

      setContextOptions({ classes, semesters })
      setFilters((current) => ({
        ...current,
        classId: current.classId || initialClassId,
        semesterId: current.semesterId || initialSemesterId,
      }))
      if (!initialClassId) {
        setError('Belum ada kelas yang ditugaskan oleh Administrator untuk akun ini.')
      }
      setLoadingContext(false)
    }
    loadContext()
    return () => { active = false }
  }, [allSemesters, isAdmin])

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
    if (key === 'classId') {
      const cls = contextOptions.classes.find((c) => String(c.id) === String(value))
      const yearId = String(cls?.academic_year_id || '')
      const sems = (allSemesters || []).filter((s) => String(s.academic_year_id) === yearId)
      const nextSemesters = sems.length > 0 ? sems : contextOptions.semesters
      const nextSemId = String(
        cls?.semester_id
        || nextSemesters.find((s) => s.status === 'Aktif')?.id
        || nextSemesters[0]?.id
        || filters.semesterId
      )
      setContextOptions((prev) => ({ ...prev, semesters: nextSemesters }))
      setFilters((current) => ({ ...current, classId: value, semesterId: nextSemId }))
    } else {
      setFilters((current) => ({ ...current, [key]: value }))
    }
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
            <label className="report-field"><span>Status Rapor</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>{statusOptions.map(([label, value]) => <option key={value || 'all'} value={value}>{label}</option>)}</select></label>
            <label className="report-field"><span>Semester</span><select value={filters.semesterId} onChange={(event) => updateFilter('semesterId', event.target.value)} disabled={loadingContext}><option value="">Pilih semester</option>{contextOptions.semesters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="report-field"><span>Tahun Ajaran</span><input readOnly value={academicYear?.name ?? selectedYear?.name ?? '-'} aria-label="Tahun ajaran authoritative" /></label>
          </div>
          <label className="report-search"><SearchInput aria-label="Cari siswa berdasarkan NIS, NISN, atau nama" onChange={(event) => { setSearchQuery(event.target.value); setPagination((current) => ({ ...current, current_page: 1 })) }} placeholder="Cari siswa (NIS/NISN/Nama)..." value={searchQuery} /><Icon name="search" /></label>
        </div>

        <div className="report-list-actions">
          <p><Icon name="info" />Data daftar rapor dan status berasal dari konteks akademik serta backend penilaian.</p>
          <div>
            <Button
              className="report-button secondary"
              disabled={!filters.classId || !filters.semesterId}
              onClick={() => { setModalTab('absensi'); setModalOpen(true); }}
            >
              <Icon name="edit" />Kelola Data Pelengkap
            </Button>
            <Button
              className="report-button secondary"
              onClick={() => navigate('/rapor-leger/generate-rapor')}
            >
              <Icon name="settings" />Kesiapan & Generate
            </Button>
            <Button className="report-button primary" onClick={refreshData}>
              <Icon name="reset" />Refresh Data
            </Button>
          </div>
        </div>

        {displayError && <div className="report-error-state" role="alert"><Icon name="info" /><strong>{error}</strong><span>Periksa konteks kelas dan semester, lalu coba refresh.</span></div>}
        <div className="report-table-heading"><h3>Daftar Rapor Siswa</h3>{selectedSemester && <span>{selectedClass?.name} - {selectedSemester.name}</span>}</div>
        <div className="report-table-scroll">
          <table className="report-list-table">
            <thead><tr><th>No</th><th>NIS</th><th>NISN</th><th>Nama Siswa</th><th>Tanggal Lahir</th><th>Status Rapor</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td className="report-empty-row" colSpan="7"><span className="report-spinner" />Memuat data daftar rapor...</td></tr> : records.length === 0 ? <tr><td className="report-empty-row" colSpan="7"><Icon name="search" /><strong>{displayError ? 'Daftar rapor tidak dapat dimuat.' : 'Tidak ada siswa pada konteks ini.'}</strong><span>{displayError ? 'Tidak ada fallback ke data statis.' : 'Ubah filter atau gunakan kata kunci yang berbeda.'}</span></td></tr> : records.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{pageStart + index}</td>
                  <td>{student.nis ?? '-'}</td>
                  <td>{student.nisn ?? '-'}</td>
                  <td className="report-student-name">{student.name ?? '-'}</td>
                  <td>{student.birth ?? '-'}</td>
                  <td><span className={`report-status ${statusSlug(student.report_status)}`}>{student.report_status}</span></td>
                  <td>
                    <div className="report-row-actions">
                      <button onClick={() => navigate(`/rapor-leger/rapor-per-siswa?student_id=${student.student_id}`)} type="button">
                        <Icon name="eye" />Preview
                      </button>
                      <span className="report-more-wrap">
                        <button aria-label={`Aksi lainnya untuk ${student.name}`} className="icon-only" onClick={() => setOpenMenuId((current) => current === student.student_id ? null : student.student_id)} type="button">
                          <Icon name="more" />
                        </button>
                        {openMenuId === student.student_id && (
                          <span className="report-action-menu">
                            <button onClick={() => { setOpenMenuId(null); navigate(`/rapor-leger/rapor-per-siswa?student_id=${student.student_id}`); }} type="button">
                              Lihat Rapor
                            </button>
                            <button onClick={() => { setOpenMenuId(null); setModalTab('absensi'); setModalOpen(true); }} type="button">
                              Input Data Pelengkap
                            </button>
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <RaporPagination currentPage={pagination.current_page} onPageChange={(page) => setPagination((current) => ({ ...current, current_page: page }))} onRowsPerPageChange={(value) => setPagination((current) => ({ ...current, per_page: value, current_page: 1 }))} rowsPerPage={pagination.per_page} totalItems={pagination.total} totalPages={pagination.last_page} />
      </section>
      <div className="report-support-grid">
        <section className="report-support-card">
          <h3>Keterangan Status Rapor</h3>
          <div className="report-legend-grid">
            {statusLegend.map(([status, description]) => (
              <div key={status} className="report-legend-item">
                <span className={`report-status ${statusSlug(status)}`}>{status}</span>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="report-support-card">
          <h3>Aksi Cepat</h3>
          <div className="report-quick-grid">
            <Link to="/rapor-leger/generate-rapor" className="report-quick-card-item">
              <div className="report-quick-icon tone-blue"><Icon name="settings" /></div>
              <div className="report-quick-text"><strong>Preview Rapor</strong><small>Lihat data rapor siswa</small></div>
            </Link>
            <Link to="/rapor-leger/rapor-per-siswa" className="report-quick-card-item">
              <div className="report-quick-icon tone-purple"><Icon name="eye" /></div>
              <div className="report-quick-text"><strong>Preview Acak</strong><small>Lihat contoh rapor</small></div>
            </Link>
            <Link to="/rapor-leger/leger-nilai" className="report-quick-card-item">
              <div className="report-quick-icon tone-green"><Icon name="table" /></div>
              <div className="report-quick-text"><strong>Leger Nilai</strong><small>Rekap nilai kelas</small></div>
            </Link>
            <Link to="/rapor-leger/cetak-export" className="report-quick-card-item">
              <div className="report-quick-icon tone-orange"><Icon name="document" /></div>
              <div className="report-quick-text"><strong>Export PDF</strong><small>Persiapkan dokumen</small></div>
            </Link>
          </div>
        </section>
      </div>

      <SupplementaryDataModal
        activeTab={modalTab}
        classId={filters.classId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(msg) => {
          onNotify?.(msg)
          refreshData()
        }}
        semesterId={filters.semesterId}
      />
    </>
  )
}

export default DaftarRaporView
