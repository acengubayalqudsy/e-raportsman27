import { useEffect, useMemo, useState } from 'react'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'
import { formatRaporScore, rankedStudents } from '../../data/rapor.js'
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

function ViewState({ loading, error, empty, children }) {
  if (loading) return <p role="status" style={{ padding: '3rem', textAlign: 'center' }}>Memuat data rapor...</p>
  if (error) return <p role="alert" style={{ padding: '3rem', textAlign: 'center', color: '#b91c1c' }}>{error}</p>
  if (empty) return <p style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Belum ada data untuk konteks akademik ini.</p>
  return children
}

export function LegerNilaiView() {
  const [recapData, setRecapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)

  useEffect(() => {
    let isMounted = true
    async function loadRecap() {
      const ctx = await assessmentService.getContext()
      if (!ctx.success || !ctx.data) {
        if (isMounted) {
          setErrorMessage(ctx.error || 'Gagal memuat konteks akademik.')
          setLoading(false)
        }
        return
      }
      const classId = ctx.data.homeroom_class?.id || ctx.data.assigned_courses?.[0]?.class_id
      const semesterId = ctx.data.active_semester?.id
      if (!classId || !semesterId) {
        if (isMounted) {
          setErrorMessage('Konteks kelas atau semester aktif tidak tersedia.')
          setLoading(false)
        }
        return
      }
      const res = await assessmentService.getClassRecap(classId, semesterId)
      if (isMounted) {
        if (res.success) setRecapData(res.data)
        else setErrorMessage(res.error || 'Gagal memuat rekap leger.')
        setLoading(false)
      }
    }
    loadRecap()
    return () => { isMounted = false }
  }, [])

  const students = recapData?.students ?? []
  const subjects = recapData?.subjects ?? []
  const totalPages = Math.max(1, Math.ceil(students.length / rowsPerPage))
  const visibleStudents = students.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters authoritative />
      <section className="report-panel">
        <DataSectionHeading
          description={recapData ? `Rekap nilai kelas ${recapData.class?.name || ''} dari database operasional.` : 'Rekap nilai kelas dari database operasional.'}
          icon="table"
          meta={loading ? 'Memuat rekap leger...' : 'Geser tabel untuk melihat seluruh mata pelajaran'}
          title="Leger Nilai"
        />
        <ViewState empty={!loading && !errorMessage && students.length === 0} error={errorMessage} loading={loading}>
          <div className="report-table-scroll report-leger-scroll">
            <table className="report-leger-table">
              <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th>{subjects.map((subject) => <th key={subject.id}>{subject.code}</th>)}<th>Jumlah</th><th>Rata-rata</th><th>Status</th></tr></thead>
              <tbody>{visibleStudents.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td>{student.nis}</td>
                  <td className="report-leger-name">{student.name}</td>
                  {subjects.map((subject) => <td key={`${student.student_id}-${subject.id}`}>{student.scores?.[subject.id] ?? '-'}</td>)}
                  <td><strong>{student.total_score ?? 0}</strong></td>
                  <td><strong className="report-score-emphasis">{formatRaporScore(student.average_score)}</strong></td>
                  <td><span className="report-rank-chip" style={{ background: '#f1f5f9', color: '#475569' }}>{Number(student.average_score) >= 75 ? 'Tuntas' : 'Perlu Bimbingan'}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <RaporPagination currentPage={currentPage} onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={students.length} totalPages={totalPages} />
        </ViewState>
      </section>
    </section>
  )
}

export function LegerDeskripsiView() {
  const [gradebooks, setGradebooks] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)

  useEffect(() => {
    let isMounted = true
    async function loadGradebooks() {
      const context = await assessmentService.getContext()
      if (!context.success || !context.data) {
        if (isMounted) {
          setErrorMessage(context.error || 'Gagal memuat konteks akademik.')
          setLoading(false)
        }
        return
      }
      const assignments = context.data.assigned_courses ?? []
      if (assignments.length === 0) {
        if (isMounted) setLoading(false)
        return
      }
      const results = await Promise.all(assignments.map((assignment) => assessmentService.getGradebook(assignment.course_assignment_id)))
      if (isMounted) {
        const failed = results.find((result) => !result.success)
        if (failed) setErrorMessage(failed.error || 'Gagal memuat capaian kompetensi.')
        else setGradebooks(results.map((result) => result.data).filter(Boolean))
        setLoading(false)
      }
    }
    loadGradebooks()
    return () => { isMounted = false }
  }, [])

  const subjects = useMemo(() => gradebooks.map((book) => ({
    id: String(book.course_assignment?.subject_id),
    label: book.course_assignment?.subject_name || 'Mata Pelajaran',
  })), [gradebooks])
  const selectedSubjectId = subjectId || subjects[0]?.id || ''
  const selectedBook = gradebooks.find((book) => String(book.course_assignment?.subject_id) === selectedSubjectId)
  const students = selectedBook?.students ?? []
  const totalPages = Math.max(1, Math.ceil(students.length / rowsPerPage))
  const visibleStudents = students.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters authoritative includeSubject values={{ subject: selectedSubjectId }} onChange={(key, value) => { if (key === 'subject') { setSubjectId(value); setCurrentPage(1) } }} />
      <section className="report-panel">
        <DataSectionHeading description={selectedBook ? `Review capaian kompetensi ${selectedBook.course_assignment?.subject_name || ''} dari database.` : 'Review capaian kompetensi dari database.'} icon="document" meta="Mode hanya baca" title="Leger Deskripsi" />
        <ViewState empty={!loading && !errorMessage && students.length === 0} error={errorMessage} loading={loading}>
          <div className="report-table-scroll">
            <table className="report-description-table">
              <thead><tr><th>No</th><th>NIS</th><th>Nama Siswa</th><th>Nilai Akhir</th><th>Capaian Kompetensi</th></tr></thead>
              <tbody>{visibleStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td>{student.nis}</td>
                  <td className="report-student-name">{student.name}</td>
                  <td><strong className="report-score-emphasis">{formatRaporScore(student.final_grade?.score)}</strong></td>
                  <td>{student.final_grade?.highest_achievement || '-'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <RaporPagination currentPage={currentPage} onPageChange={setCurrentPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }} rowsPerPage={rowsPerPage} totalItems={students.length} totalPages={totalPages} />
        </ViewState>
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
        <DataSectionHeading description="Peringkat kelas merupakan indikator akademik internal dan tidak dicantumkan dalam buku rapor resmi Kurikulum Merdeka." icon="award" title="Peringkat Kelas" />
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
