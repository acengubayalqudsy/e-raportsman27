import { useMemo, useState } from 'react'
import Icon from '../common/Icon.jsx'
import MasterPagination from '../master-data/MasterPagination.jsx'
import { getReportRows, reportDetailMeta, reportOptions } from '../../data/laporan.js'

function StatusBadge({ status }) {
  return <span className={`reporting-status reporting-status-${String(status).toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}

function SelectField({ label, value, values, onChange }) {
  return (
    <label className="reporting-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  )
}

function valueForRow(key, row) {
  if (key === 'nilai') return [row.nis, row.name, row.className, 84 + (row.id % 9), 78 + (row.id % 10), 82 + (row.id % 11), 80 + (row.id % 12), row.finalScore.toFixed(2), row.predicate]
  if (key === 'absensi') return [row.nis, row.name, row.className, row.present, row.sick, row.permitted, row.absent, `${row.attendancePercentage.toFixed(2)}%`]
  if (key === 'ekstrakurikuler') return [row.nis, row.name, row.className, row.extracurricular, row.extracurricularGrade, row.extracurricularDescription, 'Aktif']
  if (key === 'kokurikuler') return [row.nis, row.name, row.className, row.cocurricularNote, row.reportStatus]
  if (key === 'per-siswa') return [row.nis, row.name, row.className, row.finalScore.toFixed(2), `${row.attendancePercentage.toFixed(2)}%`, row.extracurricular, row.reportStatus]
  if (key === 'per-kelas') return [row.className, row.homeroomTeacher, row.studentCount, row.average, row.attendance, row.rank, row.activity, row.reportStatus]
  return [row.className, row.grade, row.studentCount, row.average, row.attendance, row.rank, row.reportStatus]
}

function matchesFilters(row, key, filters) {
  const className = row.className
  const grade = row.grade ?? className?.split(' ')[0]
  if (row.academicYear && row.academicYear !== filters.academicYear) return false
  if (row.semester && row.semester !== filters.semester) return false
  if (filters.className !== 'Semua Kelas' && className !== filters.className) return false
  if (filters.grade !== 'Semua Tingkat' && grade !== filters.grade) return false
  if ((key === 'nilai' || key === 'per-siswa') && filters.subject !== 'Semua Mata Pelajaran' && row.subject !== filters.subject) return false
  if (key === 'nilai' && filters.teacher !== 'Semua Guru' && row.teacher !== filters.teacher) return false
  if (key === 'ekstrakurikuler' && filters.extracurricular !== 'Semua Ekstrakurikuler' && row.extracurricular !== filters.extracurricular) return false
  const search = filters.search.trim().toLowerCase()
  if (!search) return true
  return Object.values(row).some((value) => String(value).toLowerCase().includes(search))
}

function StudentSnapshot({ student }) {
  if (!student) return null
  return (
    <section className="reporting-student-snapshot">
      <div><span className="reporting-avatar"><Icon name="user" /></span><div><h3>{student.name}</h3><p>{student.nis} · {student.className}</p></div></div>
      <dl>
        <div><dt>Rata-rata Nilai</dt><dd>{student.finalScore.toFixed(2)}</dd></div>
        <div><dt>Kehadiran</dt><dd>{student.attendancePercentage.toFixed(2)}%</dd></div>
        <div><dt>Ekstrakurikuler</dt><dd>{student.extracurricular}</dd></div>
        <div><dt>Status Rapor</dt><dd><StatusBadge status={student.reportStatus} /></dd></div>
      </dl>
    </section>
  )
}

function ReportDataView({ activeKey, filters, onFiltersChange, onPreview, onNotify }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const meta = reportDetailMeta[activeKey]
  const rows = getReportRows(activeKey)

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesFilters(row, activeKey, filters)),
    [activeKey, filters, rows],
  )
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageRows = filteredRows.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage)

  const updateFilter = (name, value) => {
    setCurrentPage(1)
    onFiltersChange({ ...filters, [name]: value })
  }
  const detailReport = { ...meta, icon: 'document' }
  const firstStudent = filteredRows.find((row) => row.name)

  return (
    <section className="reporting-detail-view">
      <section className="reporting-detail-toolbar">
        <div className="reporting-detail-fields">
          <SelectField label="Tahun Ajaran" onChange={(value) => updateFilter('academicYear', value)} value={filters.academicYear} values={reportOptions.academicYears} />
          <SelectField label="Semester" onChange={(value) => updateFilter('semester', value)} value={filters.semester} values={reportOptions.semesters} />
          <SelectField label="Kelas" onChange={(value) => updateFilter('className', value)} value={filters.className} values={reportOptions.classes} />
          {(activeKey === 'per-kelas' || activeKey === 'rekapitulasi-rapor') && <SelectField label="Tingkat" onChange={(value) => updateFilter('grade', value)} value={filters.grade} values={reportOptions.grades} />}
          {activeKey === 'nilai' && <SelectField label="Mata Pelajaran" onChange={(value) => updateFilter('subject', value)} value={filters.subject} values={reportOptions.subjects} />}
          {activeKey === 'nilai' && <SelectField label="Guru" onChange={(value) => updateFilter('teacher', value)} value={filters.teacher} values={reportOptions.teachers} />}
          {activeKey === 'absensi' && <SelectField label="Bulan" onChange={(value) => updateFilter('month', value)} value={filters.month} values={reportOptions.months} />}
          {activeKey === 'ekstrakurikuler' && <SelectField label="Ekstrakurikuler" onChange={(value) => updateFilter('extracurricular', value)} value={filters.extracurricular} values={reportOptions.extracurriculars} />}
        </div>
        <div className="reporting-detail-actions">
          <label className="reporting-search"><Icon name="search" /><input onChange={(event) => updateFilter('search', event.target.value)} placeholder="Cari siswa / laporan..." type="search" value={filters.search} /></label>
          <button onClick={() => onNotify('Export laporan disimulasikan pada frontend.')} type="button"><Icon name="download" /> Export</button>
          <button className="primary" onClick={() => onPreview(detailReport)} type="button"><Icon name="eye" /> Preview Laporan</button>
        </div>
      </section>

      {activeKey === 'per-siswa' && <StudentSnapshot student={firstStudent} />}

      <section className="reporting-table-card">
        <header><div><h3>{meta.title}</h3><p>{meta.subtitle}</p></div><span>{filteredRows.length} data</span></header>
        <div className="reporting-table-scroll">
          <table className="reporting-table">
            <thead><tr><th>No</th>{meta.columns.map((column) => <th key={column}>{column}</th>)}<th>Aksi</th></tr></thead>
            <tbody>
              {pageRows.length ? pageRows.map((row, index) => (
                <tr key={row.id}>
                  <td>{(safeCurrentPage - 1) * rowsPerPage + index + 1}</td>
                  {valueForRow(activeKey, row).map((value, valueIndex) => (
                    <td key={`${row.id}-${valueIndex}`}>{value === row.reportStatus ? <StatusBadge status={value} /> : value}</td>
                  ))}
                  <td><button aria-label={`Preview ${row.name ?? row.className}`} className="reporting-table-action" onClick={() => onPreview({ ...detailReport, label: `${meta.title} · ${row.name ?? row.className}` })} type="button"><Icon name="eye" /></button></td>
                </tr>
              )) : <tr><td className="reporting-empty" colSpan={meta.columns.length + 2}><Icon name="search" /><strong>Data laporan tidak ditemukan</strong><span>Ubah filter atau kata kunci pencarian Anda.</span></td></tr>}
            </tbody>
          </table>
        </div>
        <MasterPagination currentPage={safeCurrentPage} itemLabel="laporan" onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={filteredRows.length} totalPages={totalPages} />
      </section>
      <aside className="reporting-detail-note"><Icon name="info" /><p>Laporan ini disajikan sebagai ringkasan monitoring. Preview, cetak, dan export masih menggunakan simulasi frontend.</p></aside>
    </section>
  )
}

export default ReportDataView

