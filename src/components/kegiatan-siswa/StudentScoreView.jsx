import { useMemo, useState } from 'react'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import { activityOptions, scores as initialScores } from '../../data/kegiatanSiswa.js'

const DEFAULT_ROWS_PER_PAGE = 8

function normalizeScores(rows) {
  return rows.map((row) => ({
    ...row,
    name: row.name || row.studentName || '-',
    extracurricular: row.extracurricular || row.extracurricularName || '-',
    predicate: row.predicate || row.predikat || '',
    description: row.description || row.keterangan || '',
    isDirty: false,
  }))
}

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

function StudentScoreView({ onNotify }) {
  const [scoreRows, setScoreRows] = useState(() => normalizeScores(initialScores))
  const [filters, setFilters] = useState({
    className: 'Semua Kelas',
    academicYear: activityOptions.academicYears?.[0] || 'Semua Tahun',
    semester: activityOptions.semesters?.[0] || 'Semua Semester',
    extracurricular: 'Semua Ekskul',
    status: 'Semua Status',
    searchQuery: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)

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

  const saveRow = (id) => {
    const target = scoreRows.find((row) => row.id === id)
    if (!target?.isDirty) return
    if (!target.predicate || !target.description.trim()) {
      onNotify?.(`Lengkapi predikat dan deskripsi ${target.name} sebelum menyimpan.`)
      return
    }

    setScoreRows((current) => current.map((row) => (
      row.id === id
        ? { ...row, status: getScoreStatus(row), predikat: row.predicate, keterangan: row.description, isDirty: false }
        : row
    )))
    onNotify?.(`Nilai ekstrakurikuler ${target.name} berhasil disimpan.`)
  }

  const saveAll = () => {
    if (dirtyCount === 0) {
      onNotify?.('Tidak ada perubahan nilai yang perlu disimpan.')
      return
    }

    const incompleteCount = scoreRows.filter((row) => row.isDirty && (!row.predicate || !row.description.trim())).length
    if (incompleteCount > 0) {
      onNotify?.(`${incompleteCount} nilai belum lengkap. Isi predikat dan deskripsi sebelum menyimpan.`)
      return
    }

    setScoreRows((current) => current.map((row) => (
      row.isDirty
        ? { ...row, status: getScoreStatus(row), predikat: row.predicate, keterangan: row.description, isDirty: false }
        : row
    )))
    onNotify?.(`${dirtyCount} perubahan nilai ekstrakurikuler berhasil disimpan.`)
  }

  return (
    <section className="activity-score-view">
      <div className="activity-score-toolbar">
        <div className="activity-filter-grid activity-score-filters">
          <SelectFilter
            label="Kelas"
            onChange={(value) => updateFilter('className', value)}
            options={['Semua Kelas', ...(activityOptions.classes || [])]}
            value={filters.className}
          />
          <SelectFilter
            label="Tahun Ajaran"
            onChange={(value) => updateFilter('academicYear', value)}
            options={['Semua Tahun', ...(activityOptions.academicYears || [])]}
            value={filters.academicYear}
          />
          <SelectFilter
            label="Semester"
            onChange={(value) => updateFilter('semester', value)}
            options={['Semua Semester', ...(activityOptions.semesters || [])]}
            value={filters.semester}
          />
          <SelectFilter
            label="Ekstrakurikuler"
            onChange={(value) => updateFilter('extracurricular', value)}
            options={['Semua Ekskul', ...(activityOptions.extracurriculars || [])]}
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
            <Button className="activity-button primary" onClick={saveAll}>
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

        {visibleScores.length > 0 ? (
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
                          onChange={(event) => updateScore(row.id, 'predicate', event.target.value)}
                          value={row.predicate}
                        >
                          <option value="">-</option>
                          {(activityOptions.predicates || ['A', 'B', 'C', 'D']).map((predicate) => (
                            <option key={predicate} value={predicate}>{predicate}</option>
                          ))}
                        </select>
                      </td>
                      <td className="activity-score-description-cell">
                        <textarea
                          aria-label={`Deskripsi nilai ekstrakurikuler ${row.name}`}
                          className="activity-score-description"
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
                          disabled={!row.isDirty}
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
