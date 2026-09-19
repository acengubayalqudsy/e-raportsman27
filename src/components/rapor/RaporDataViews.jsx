import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import {
  calculateStudentAverage,
  calculateStudentTotal,
  formatRaporScore,
  rankedStudents,
  raporStudents,
  raporSubjects,
} from '../../data/rapor.js'
import RaporContextFilters from './RaporContextFilters.jsx'
import RaporPagination from './RaporPagination.jsx'

function DataSectionHeading({ icon, title, description, meta }) {
  return (
    <div className="report-section-heading">
      <div><span><Icon name={icon} /></span><div><h3>{title}</h3><p>{description}</p></div></div>
      {meta && <small>{meta}</small>}
    </div>
  )
}

export function LegerNilaiView() {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const totalPages = Math.ceil(raporStudents.length / rowsPerPage)
  const visibleStudents = raporStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const rankById = new Map(rankedStudents.map((student) => [student.id, student.rank]))

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters />
      <section className="report-panel">
        <DataSectionHeading description="Rekap seluruh nilai mata pelajaran kelas X Merdeka 3." icon="table" meta="Geser tabel untuk melihat seluruh mata pelajaran" title="Leger Nilai" />
        <div className="report-table-scroll report-leger-scroll">
          <table className="report-leger-table">
            <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th>{raporSubjects.map((subject) => <th key={subject.key}>{subject.code}</th>)}<th>Jumlah</th><th>Rata-rata</th><th>Peringkat</th></tr></thead>
            <tbody>{visibleStudents.map((student, index) => <tr key={student.id}><td>{(currentPage - 1) * rowsPerPage + index + 1}</td><td>{student.nis}</td><td className="report-leger-name">{student.name}</td>{raporSubjects.map((subject) => <td key={`${student.id}-${subject.key}`}>{student.scores[subject.key]}</td>)}<td><strong>{calculateStudentTotal(student)}</strong></td><td><strong className="report-score-emphasis">{formatRaporScore(calculateStudentAverage(student))}</strong></td><td><span className="report-rank-chip">{rankById.get(student.id)}</span></td></tr>)}</tbody>
          </table>
        </div>
        <RaporPagination currentPage={currentPage} onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={raporStudents.length} totalPages={totalPages} />
      </section>
    </section>
  )
}

export function LegerDeskripsiView() {
  const [subjectKey, setSubjectKey] = useState('matematika')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const totalPages = Math.ceil(raporStudents.length / rowsPerPage)
  const visibleStudents = raporStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const activeSubject = raporSubjects.find((subject) => subject.key === subjectKey) ?? raporSubjects[0]

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters includeSubject values={{ subject: subjectKey }} onChange={(key, value) => { if (key === 'subject') { setSubjectKey(value); setCurrentPage(1) } }} />
      <section className="report-panel">
        <DataSectionHeading description={`Review capaian kompetensi ${activeSubject.label}. Editing tetap dilakukan melalui modul Penilaian.`} icon="document" meta="Mode hanya baca" title="Leger Deskripsi" />
        <div className="report-table-scroll">
          <table className="report-description-table">
            <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>Nilai Akhir</th><th>Predikat</th><th>Capaian Kompetensi</th></tr></thead>
            <tbody>{visibleStudents.map((student, index) => {
              const result = student.academicResults.find((item) => item.subjectKey === subjectKey)
              return <tr key={student.id}><td>{(currentPage - 1) * rowsPerPage + index + 1}</td><td>{student.nis}</td><td className="report-student-name">{student.name}</td><td><strong className="report-score-emphasis">{formatRaporScore(result.score)}</strong></td><td><span className="report-predicate">{result.predicate}</span></td><td>{result.description}</td></tr>
            })}</tbody>
          </table>
        </div>
        <RaporPagination currentPage={currentPage} onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={raporStudents.length} totalPages={totalPages} />
      </section>
    </section>
  )
}

export function PeringkatKelasView() {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const totalPages = Math.ceil(rankedStudents.length / rowsPerPage)
  const visibleStudents = rankedStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const classAverage = rankedStudents.reduce((sum, student) => sum + student.averageScore, 0) / rankedStudents.length
  const rankingSummary = [
    ['Kelas', 'X Merdeka 3'], ['Jumlah Siswa', '36'], ['Rata-rata Kelas', formatRaporScore(classAverage)],
    ['Nilai Tertinggi', formatRaporScore(rankedStudents[0].averageScore)], ['Nilai Terendah', formatRaporScore(rankedStudents.at(-1).averageScore)],
  ]

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters />
      <div className="report-ranking-summary">{rankingSummary.map(([label, value], index) => <article key={label}><span className={`tone-${index}`}><Icon name={index === 0 ? 'academic' : index === 1 ? 'users' : 'trend'} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
      <section className="report-panel">
        <DataSectionHeading description="Peringkat dihitung dari rata-rata 16 mata pelajaran pada mock data frontend." icon="award" title="Peringkat Kelas" />
        <div className="report-table-scroll">
          <table className="report-ranking-table">
            <thead><tr><th>Peringkat</th><th>NIS</th><th>Nama Siswa</th><th>Jumlah Nilai</th><th>Rata-rata</th><th>Status</th></tr></thead>
            <tbody>{visibleStudents.map((student) => <tr key={student.id}><td><span className={`report-ranking-number rank-${student.rank}`}>{student.rank}</span></td><td>{student.nis}</td><td className="report-student-name">{student.name}</td><td>{student.totalScore}</td><td><strong className="report-score-emphasis">{formatRaporScore(student.averageScore)}</strong></td><td><span className="report-ranking-status">{student.rankingStatus}</span></td></tr>)}</tbody>
          </table>
        </div>
        <RaporPagination currentPage={currentPage} onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={rankedStudents.length} totalPages={totalPages} />
      </section>
    </section>
  )
}
