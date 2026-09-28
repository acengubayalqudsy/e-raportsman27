import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import assessmentService from '../../services/assessmentService.js'
import { extracurricularService } from '../../services/extracurricularService.js'
import { activityOptions } from '../../data/kegiatanSiswa.js'

const DEFAULT_ROWS_PER_PAGE = 8
const scorePredicates = ['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'A', 'B', 'C', 'D']

function getScoreStatus(row) {
  return row.predicate && row.description.trim() ? 'Sudah Dinilai' : 'Belum Dinilai'
}

function SelectFilter({ label, options, value, onChange }) {
  return (
    <label className="activity-filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function StudentScoreView({ classId: requestedClassId, semesterId: requestedSemesterId, onNotify }) {
  const [scoreRows, setScoreRows] = useState([])
  const [context, setContext] = useState(null)
  const [availableExtracurriculars, setAvailableExtracurriculars] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filters, setFilters] = useState({
    className: 'Semua Kelas',
    academicYear: 'Semua Tahun',
    semester: 'Semua Semester',
    extracurricular: 'Semua Ekskul',
    status: 'Semua Status',
    searchQuery: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)

  const classId = requestedClassId || context?.homeroom_class?.class_id || context?.assigned_courses?.[0]?.class_id
  const semesterId = requestedSemesterId || context?.active_semester?.id

  // Load active extracurriculars from MariaDB
  useEffect(() => {
    let isMounted = true
    extracurricularService
      .getExtracurriculars({ all: 1, status: 'Aktif' })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          const names = res.data.map((e) => e.name)
          if (names.length > 0) {
            setAvailableExtracurriculars(names)
          }
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setIsLoading(true)
      setLoadError('')
      const ctxRes = await assessmentService.getContext()
      if (!isMounted) return
      if (!ctxRes.success || !ctxRes.data) {
        setLoadError(ctxRes.error || 'Gagal memuat konteks akademik.')
        setScoreRows([])
        setIsLoading(false)
        return
      }
      setContext(ctxRes.data)
      const cId = requestedClassId || ctxRes.data.homeroom_class?.class_id || ctxRes.data.assigned_courses?.[0]?.class_id
      const sId = requestedSemesterId || ctxRes.data.active_semester?.id
      if (!cId || !sId) {
        setLoadError('Kelas atau semester aktif tidak tersedia.')
        setScoreRows([])
        setIsLoading(false)
        return
      }
      const suppRes = await assessmentService.getSupplementaryData(cId, sId)
      if (!isMounted) return
      if (!suppRes.success) {
        setLoadError(suppRes.error || 'Gagal memuat nilai ekstrakurikuler.')
        setScoreRows([])
        setIsLoading(false)
        return
      }
      const mapped = (suppRes.data?.students || []).flatMap((st) => (
        (st.extracurriculars || []).map((ekskul, idx) => ({
          id: `${st.student_id}-${ekskul.id || idx}`,
          studentId: st.student_id,
          extracurricularId: ekskul.extracurricular_id,
          nis: st.nis,
          name: st.name,
          className: suppRes.data.class?.name || ctxRes.data.homeroom_class?.class_name || 'Kelas aktif',
          academicYear: suppRes.data.semester?.academic_year || ctxRes.data.active_academic_year?.name || '',
          semester: suppRes.data.semester?.name || ctxRes.data.active_semester?.name || '',
          extracurricular: ekskul.name || ekskul.activity_name,
          predicate: ekskul.predicate || '',
          description: ekskul.description || '',
          isDirty: false,
        }))
      ))
      setScoreRows(mapped)
      setIsLoading(false)
    }
    loadData()
    return () => { isMounted = false }
  }, [requestedClassId, requestedSemesterId])

  const filterOptions = useMemo(() => ({
    classes: [...new Set(scoreRows.map((row) => row.className).filter(Boolean))],
    academicYears: [...new Set(scoreRows.map((row) => row.academicYear).filter(Boolean))],
    semesters: [...new Set(scoreRows.map((row) => row.semester).filter(Boolean))],
    extracurriculars: [...new Set([...availableExtracurriculars, ...scoreRows.map((row) => row.extracurricular)].filter(Boolean))],
  }), [availableExtracurriculars, scoreRows])

  const filteredScores = useMemo(() => {
    const keyword = filters.searchQuery.trim().toLowerCase()

    return scoreRows.filter((row) => {
      const matchesClass = filters.className === 'Semua Kelas' || row.className === filters.className
      const matchesYear = filters.academicYear === 'Semua Tahun' || row.academicYear === filters.academicYear
      const matchesSemester = filters.semester === 'Semua Semester' || row.semester === filters.semester
      const matchesExtracurricular = filters.extracurricular === 'Semua Ekskul' || row.extracurricular === filters.extracurricular
      const matchesStatus = filters.status === 'Semua Status' || getScoreStatus(row) === filters.status
      const matchesSearch = !keyword || String(row.nis || '').toLowerCase().includes(keyword) || row.name.toLowerCase().includes(keyword)

      return matchesClass && matchesYear && matchesSemester && matchesExtracurricular && matchesStatus && matchesSearch
    })
  }, [filters, scoreRows])

  const totalPages = Math.max(1, Math.ceil(filteredScores.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const firstItem = filteredScores.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1
  const visibleScores = filteredScores.slice(
    (safeCurrentPage - 1) * rowsPerPage,
    safeCurrentPage * rowsPerPage,
  )
  const dirtyCount = scoreRows.filter((row) => row.isDirty).length

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }))
    setCurrentPage(1)
  }

  const updateScore = (id, field, value) => {
    setScoreRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: value, isDirty: true } : row
    )))
  }

  const saveRow = async (id) => {
    const target = scoreRows.find((row) => row.id === id)
    if (!target?.isDirty || isSaving) return
    if (!target.predicate || !target.description.trim()) {
      onNotify?.(`Lengkapi predikat dan deskripsi ${target.name} sebelum menyimpan.`)
      return
    }
    if (scoreRows.some((row) => row.studentId === target.studentId && row.isDirty && (!row.predicate || !row.description.trim()))) {
      onNotify?.(`Lengkapi semua nilai ekstrakurikuler yang diubah untuk ${target.name} sebelum menyimpan.`)
      return
    }

    if (!classId || !semesterId) {
      onNotify?.('Kelas atau semester aktif tidak tersedia.')
      return
    }
    const studentRows = scoreRows.filter((row) => row.studentId === target.studentId)
    const activities = studentRows.map((row) => ({
      extracurricular_id: row.extracurricularId || null,
      activity_name: row.extracurricular,
      predicate: row.predicate || 'Baik',
      description: row.description,
    }))
    setIsSaving(true)
    const res = await assessmentService.saveExtracurriculars(classId, semesterId, [
      { student_id: target.studentId, activities },
    ])
    setIsSaving(false)

    if (res.success) {
      setScoreRows((current) => current.map((row) => (
        row.studentId === target.studentId ? { ...row, predicate: row.predicate || 'Baik', isDirty: false } : row
      )))
      onNotify?.(`Nilai ekstrakurikuler ${target.name} berhasil disimpan ke database.`)
    } else {
      onNotify?.(res.error || 'Gagal menyimpan nilai ekstrakurikuler.')
    }
  }

  const saveAll = async () => {
    if (dirtyCount === 0 || isSaving) {
      onNotify?.('Tidak ada perubahan nilai yang perlu disimpan.')
      return
    }

    const incompleteCount = scoreRows.filter((row) => row.isDirty && (!row.predicate || !row.description.trim())).length
    if (incompleteCount > 0) {
      onNotify?.(`${incompleteCount} nilai belum lengkap. Isi predikat dan deskripsi sebelum menyimpan.`)
      return
    }

    if (!classId || !semesterId) {
      onNotify?.('Kelas atau semester aktif tidak tersedia.')
      return
    }
    const changedStudents = new Set(scoreRows.filter((row) => row.isDirty).map((row) => row.studentId))
    const payload = [...changedStudents].map((studentId) => ({
      student_id: studentId,
      activities: scoreRows.filter((row) => row.studentId === studentId).map((row) => ({
        extracurricular_id: row.extracurricularId || null,
        activity_name: row.extracurricular,
        predicate: row.predicate || 'Baik',
        description: row.description,
      })),
    }))
    setIsSaving(true)
    const res = await assessmentService.saveExtracurriculars(classId, semesterId, payload)
    setIsSaving(false)

    if (res.success) {
      setScoreRows((current) => current.map((row) => ({ ...row, predicate: row.predicate || 'Baik', isDirty: false })))
      onNotify?.(`${dirtyCount} perubahan nilai ekstrakurikuler berhasil disimpan ke database.`)
    } else {
      onNotify?.(res.error || 'Gagal menyimpan nilai ekstrakurikuler.')
    }
  }

  return (
    <section className="activity-score-view">
      <div className="activity-score-toolbar">
        <div className="activity-filter-grid activity-score-filters">
          <SelectFilter
            label="Kelas"
            onChange={(value) => updateFilter('className', value)}
            options={['Semua Kelas', ...filterOptions.classes]}
            value={filters.className}
          />
          <SelectFilter
            label="Tahun Ajaran"
            onChange={(value) => updateFilter('academicYear', value)}
            options={['Semua Tahun', ...filterOptions.academicYears]}
            value={filters.academicYear}
          />
          <SelectFilter
            label="Semester"
            onChange={(value) => updateFilter('semester', value)}
            options={['Semua Semester', ...filterOptions.semesters]}
            value={filters.semester}
          />
          <SelectFilter
            label="Ekstrakurikuler"
            onChange={(value) => updateFilter('extracurricular', value)}
            options={['Semua Ekskul', ...filterOptions.extracurriculars]}
            value={filters.extracurricular}
          />
          <SelectFilter
            label="Status Nilai"
            onChange={(value) => updateFilter('status', value)}
            options={activityOptions.scoreStatuses || ['Semua Status', 'Sudah Dinilai', 'Belum Dinilai']}
            value={filters.status}
          />
        </div>

        <div className="activity-score-toolbar-side">
          <label className="activity-search">
            <span className="activity-sr-only">Cari siswa berdasarkan NIS atau nama</span>
            <SearchInput
              aria-label="Cari siswa berdasarkan NIS atau nama"
              onChange={(event) => updateFilter('searchQuery', event.target.value)}
              placeholder="Cari siswa (NIS/Nama)..."
              value={filters.searchQuery}
            />
            <Icon name="search" />
          </label>
          <div className="activity-score-actions">
            {dirtyCount > 0 && (
              <span className="activity-unsaved-indicator">
                <i aria-hidden="true" />
                {dirtyCount} perubahan belum disimpan
              </span>
            )}
            <Button className="activity-button primary" disabled={isSaving || dirtyCount === 0} onClick={saveAll}>
              <Icon name="save" />
              Simpan Semua Nilai
            </Button>
          </div>
        </div>
      </div>

      <section className="activity-score-card">
        <header className="activity-score-card-header">
          <div>
            <h2>Daftar Nilai Ekstrakurikuler</h2>
            <p>Lengkapi predikat dan deskripsi perkembangan kegiatan siswa.</p>
          </div>
          <span className="activity-score-total">{filteredScores.length.toLocaleString('id-ID')} data</span>
        </header>

        {loadError ? (
          <EmptyState className="activity-empty-state"><Icon name="alertCircle" /><strong>{loadError}</strong></EmptyState>
        ) : isLoading ? (
          <EmptyState className="activity-empty-state"><strong>Memuat nilai ekstrakurikuler...</strong></EmptyState>
        ) : visibleScores.length > 0 ? (
          <div className="activity-table-scroll">
            <table className="activity-table activity-score-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Ekstrakurikuler</th>
                  <th>Predikat</th>
                  <th>Deskripsi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleScores.map((row, index) => {
                  const status = getScoreStatus(row)

                  return (
                    <tr className={row.isDirty ? 'activity-row-dirty' : ''} key={row.id}>
                      <td>{firstItem + index}</td>
                      <td>{row.nis || '-'}</td>
                      <td className="activity-student-cell"><strong>{row.name}</strong></td>
                      <td>{row.className || '-'}</td>
                      <td>{row.extracurricular}</td>
                      <td>
                        <select
                          aria-label={`Predikat ${row.name}`}
                          className="activity-score-select"
                          disabled={isSaving}
                          onChange={(event) => updateScore(row.id, 'predicate', event.target.value)}
                          value={row.predicate}
                        >
                          <option value="">-</option>
                          {scorePredicates.map((predicate) => (
                            <option key={predicate} value={predicate}>{predicate}</option>
                          ))}
                        </select>
                      </td>
                      <td className="activity-score-description-cell">
                        <textarea
                          aria-label={`Deskripsi nilai ekstrakurikuler ${row.name}`}
                          className="activity-score-description"
                          disabled={isSaving}
                          maxLength="255"
                          onChange={(event) => updateScore(row.id, 'description', event.target.value)}
                          placeholder="Tulis deskripsi perkembangan siswa..."
                          rows="2"
                          value={row.description}
                        />
                      </td>
                      <td>
                        <div className="activity-score-state">
                          <span className={`activity-status ${status === 'Sudah Dinilai' ? 'is-success' : 'is-warning'}`}>
                            {status}
                          </span>
                          <small className={row.isDirty ? 'is-dirty' : 'is-saved'}>
                            <i aria-hidden="true" />
                            {row.isDirty ? 'Belum disimpan' : 'Tersimpan'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Button
                          className="activity-row-save"
                          disabled={!row.isDirty || isSaving}
                          onClick={() => saveRow(row.id)}
                          title={row.isDirty ? 'Simpan nilai' : 'Tidak ada perubahan'}
                        >
                          <Icon name="save" />
                          <span>Simpan</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState className="activity-empty-state">
            <Icon name="award" />
            <strong>Data nilai ekstrakurikuler tidak ditemukan</strong>
            <span>Coba ubah filter atau kata pencarian.</span>
          </EmptyState>
        )}

        <MasterPagination
          currentPage={safeCurrentPage}
          itemLabel="data"
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setCurrentPage(1)
          }}
          rowsPerPage={rowsPerPage}
          totalItems={filteredScores.length}
          totalPages={totalPages}
        />
      </section>
    </section>
  )
}

export { StudentScoreView }
export default StudentScoreView
