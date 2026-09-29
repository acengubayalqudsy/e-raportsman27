import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'
import { assignmentService } from '../../services/assignmentService.js'
import excelService from '../../services/excelService.js'
import { formatRaporScore } from '../../data/rapor.js'
import RaporContextFilters from './RaporContextFilters.jsx'
import RaporPagination from './RaporPagination.jsx'

function DataSectionHeading({ icon, title, description, meta }) {
  return (
    <div className="report-section-heading">
      <div className="report-heading-main">
        <span className="report-heading-icon"><Icon name={icon} /></span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {meta && <small className="report-heading-meta">{meta}</small>}
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
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [context, setContext] = useState(null)

  const handleOptionsReady = useCallback((state) => {
    setContext(state.context)
    if (state.classId && state.classId !== selectedClassId) {
      setSelectedClassId(String(state.classId))
    }
    if (state.semesterId && state.semesterId !== selectedSemesterId) {
      setSelectedSemesterId(String(state.semesterId))
    }
  }, [selectedClassId, selectedSemesterId])

  const effectiveClassId = selectedClassId || context?.homeroom_class?.class_id || context?.assigned_courses?.[0]?.class_id
  const effectiveSemesterId = selectedSemesterId || context?.active_semester?.id || context?.assigned_courses?.[0]?.semester_id

  useEffect(() => {
    if (!effectiveClassId || !effectiveSemesterId) return undefined
    let isMounted = true
    async function loadRecap() {
      setLoading(true)
      setErrorMessage('')
      const res = await assessmentService.getClassRecap(effectiveClassId, effectiveSemesterId)
      if (isMounted) {
        if (res.success) setRecapData(res.data)
        else setErrorMessage(res.error || 'Gagal memuat rekap leger.')
        setLoading(false)
      }
    }
    loadRecap()
    return () => { isMounted = false }
  }, [effectiveClassId, effectiveSemesterId])

  const students = recapData?.students ?? []
  const subjects = recapData?.subjects ?? []
  const totalPages = Math.max(1, Math.ceil(students.length / rowsPerPage))
  const visibleStudents = students.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters
        authoritative
        allowClassSelection
        values={{ className: selectedClassId, semester: selectedSemesterId }}
        onChange={(key, value) => {
          if (key === 'className') {
            setSelectedClassId(value)
            setCurrentPage(1)
          }
          if (key === 'semester') {
            setSelectedSemesterId(value)
            setCurrentPage(1)
          }
        }}
        onOptionsReady={handleOptionsReady}
      />
      <section className="report-panel">
        <DataSectionHeading
          description={recapData ? `Rekap nilai kelas ${recapData.class?.name || ''} dari database operasional.` : 'Rekap nilai kelas dari database operasional.'}
          icon="table"
          meta={loading ? 'Memuat rekap leger...' : 'Geser tabel untuk melihat seluruh mata pelajaran'}
          title="Leger Nilai"
        />
        {recapData?.class?.id && recapData?.semester?.id && (
          <button
            className="report-button secondary"
            onClick={() => excelService.download('leger', 'export', { class_id: recapData.class.id, semester_id: recapData.semester.id }).catch((error) => setErrorMessage(error.message))}
            type="button"
          >
            Export Excel
          </button>
        )}
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
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [context, setContext] = useState(null)

  const handleOptionsReady = useCallback((state) => {
    setContext(state.context)
    if (state.classId && state.classId !== selectedClassId) {
      setSelectedClassId(String(state.classId))
    }
    if (state.semesterId && state.semesterId !== selectedSemesterId) {
      setSelectedSemesterId(String(state.semesterId))
    }
  }, [selectedClassId, selectedSemesterId])

  const effectiveClassId = selectedClassId || context?.homeroom_class?.class_id || context?.assigned_courses?.[0]?.class_id
  const effectiveSemesterId = selectedSemesterId || context?.active_semester?.id || context?.assigned_courses?.[0]?.semester_id

  useEffect(() => {
    if (!effectiveClassId || !effectiveSemesterId) return undefined
    let isMounted = true
    async function loadGradebooks() {
      setLoading(true)
      setErrorMessage('')
      try {
        const caRes = await assignmentService.getCourseAssignments({
          class_id: effectiveClassId,
          semester_id: effectiveSemesterId,
          per_page: 50,
        })
        let assignments = (caRes?.success && Array.isArray(caRes.data) && caRes.data.length > 0)
          ? caRes.data.map((ca) => ({ course_assignment_id: ca.id, class_id: ca.class_id, subject_id: ca.subject_id, subject_name: ca.subject_name }))
          : []

        if (assignments.length === 0) {
          const ctxCourses = context?.assigned_courses ?? []
          assignments = ctxCourses.filter((a) => String(a.class_id) === String(effectiveClassId))
        }

        if (assignments.length === 0) {
          if (isMounted) {
            setGradebooks([])
            setLoading(false)
          }
          return
        }

        const results = await Promise.all(assignments.map((assignment) => assessmentService.getGradebook(assignment.course_assignment_id)))
        if (isMounted) {
          const validBooks = results.filter((r) => r.success && r.data).map((r) => r.data)
          setGradebooks(validBooks)
          if (validBooks.length === 0 && results.some((r) => !r.success)) {
            setErrorMessage(results.find((r) => !r.success)?.error || 'Gagal memuat capaian kompetensi.')
          }
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Terjadi kendala saat memuat capaian kompetensi.')
          setLoading(false)
        }
      }
    }
    loadGradebooks()
    return () => { isMounted = false }
  }, [effectiveClassId, effectiveSemesterId, context])

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
      <RaporContextFilters
        authoritative
        allowClassSelection
        includeSubject
        values={{ className: selectedClassId, semester: selectedSemesterId, subject: selectedSubjectId }}
        onChange={(key, value) => {
          if (key === 'subject') {
            setSubjectId(value)
            setCurrentPage(1)
          }
          if (key === 'className') {
            setSelectedClassId(value)
            setSubjectId('')
            setCurrentPage(1)
          }
          if (key === 'semester') {
            setSelectedSemesterId(value)
            setSubjectId('')
            setCurrentPage(1)
          }
        }}
        onOptionsReady={handleOptionsReady}
      />
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
  const [recapData, setRecapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [context, setContext] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)

  const handleOptionsReady = useCallback((state) => {
    setContext(state.context)
    if (state.classId && state.classId !== selectedClassId) {
      setSelectedClassId(String(state.classId))
    }
    if (state.semesterId && state.semesterId !== selectedSemesterId) {
      setSelectedSemesterId(String(state.semesterId))
    }
  }, [selectedClassId, selectedSemesterId])

  const effectiveClassId = selectedClassId || context?.homeroom_class?.class_id || context?.assigned_courses?.[0]?.class_id
  const effectiveSemesterId = selectedSemesterId || context?.active_semester?.id || context?.assigned_courses?.[0]?.semester_id

  useEffect(() => {
    if (!effectiveClassId || !effectiveSemesterId) return undefined
    let active = true
    async function loadRecap() {
      setLoading(true)
      setErrorMessage('')
      const res = await assessmentService.getClassRecap(effectiveClassId, effectiveSemesterId)
      if (!active) return
      if (res.success) setRecapData(res.data)
      else setErrorMessage(res.error || 'Gagal memuat peringkat kelas.')
      setLoading(false)
    }
    loadRecap()
    return () => { active = false }
  }, [effectiveClassId, effectiveSemesterId])

  const studentsList = recapData?.students

  const sortedStudents = useMemo(() => {
    if (!studentsList?.length) return []
    return [...studentsList]
      .sort((a, b) => (Number(b.average_score) || 0) - (Number(a.average_score) || 0) || (Number(b.total_score) || 0) - (Number(a.total_score) || 0))
      .map((student, idx) => ({
        id: student.student_id,
        rank: idx + 1,
        nis: student.nis,
        name: student.name,
        totalScore: student.total_score ?? 0,
        averageScore: Number(student.average_score) || 0,
        rankingStatus: Number(student.average_score) >= 75 ? 'Tuntas' : 'Perlu Bimbingan',
      }))
  }, [studentsList])

  const studentCount = sortedStudents.length
  const totalPages = Math.max(1, Math.ceil(studentCount / rowsPerPage))
  const visibleStudents = sortedStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const classAverage = studentCount > 0 ? sortedStudents.reduce((sum, s) => sum + s.averageScore, 0) / studentCount : 0
  const highestAvg = studentCount > 0 ? sortedStudents[0].averageScore : 0
  const lowestAvg = studentCount > 0 ? sortedStudents[studentCount - 1].averageScore : 0

  const rankingSummary = [
    { label: 'Kelas', value: recapData?.class?.name || '-', icon: 'academic', tone: 'tone-0' },
    { label: 'Jumlah Siswa', value: `${studentCount} Siswa`, icon: 'users', tone: 'tone-1' },
    { label: 'Rata-rata Kelas', value: formatRaporScore(classAverage), icon: 'trend', tone: 'tone-2' },
    { label: 'Nilai Tertinggi', value: formatRaporScore(highestAvg), icon: 'award', tone: 'tone-3' },
    { label: 'Nilai Terendah', value: formatRaporScore(lowestAvg), icon: 'trend', tone: 'tone-4' },
  ]

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters
        authoritative
        allowClassSelection
        values={{ className: selectedClassId, semester: selectedSemesterId }}
        onChange={(key, val) => {
          if (key === 'className') {
            setSelectedClassId(val)
            setCurrentPage(1)
          }
          if (key === 'semester') {
            setSelectedSemesterId(val)
            setCurrentPage(1)
          }
        }}
        onOptionsReady={handleOptionsReady}
      />
      <div className="report-ranking-summary">
        {rankingSummary.map((item, index) => (
          <article className={`ranking-summary-card item-${index}`} key={item.label}>
            <span className={item.tone}><Icon name={item.icon} /></span>
            <div>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
          </article>
        ))}
      </div>
      <section className="report-panel report-ranking-panel">
        <DataSectionHeading
          description="Peringkat kelas merupakan indikator akademik internal dan tidak dicantumkan dalam buku rapor resmi Kurikulum Merdeka."
          icon="award"
          title="Peringkat Kelas"
        />

        <ViewState empty={!loading && !errorMessage && studentCount === 0} error={errorMessage} loading={loading}>
          {/* Desktop View Table */}
          <div className="report-table-scroll report-ranking-desktop-table">
            <table className="report-ranking-table">
              <thead>
                <tr>
                  <th>Peringkat</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th>Jumlah Nilai</th>
                  <th>Rata-rata</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <span className={`report-ranking-number rank-${student.rank}`}>{student.rank}</span>
                    </td>
                    <td>{student.nis}</td>
                    <td className="report-student-name">{student.name}</td>
                    <td>{student.totalScore}</td>
                    <td>
                      <strong className="report-score-emphasis">{formatRaporScore(student.averageScore)}</strong>
                    </td>
                    <td>
                      <span className="report-ranking-status">{student.rankingStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View Card List */}
          <div className="report-ranking-mobile-list">
            {visibleStudents.map((student) => {
              const isTop3 = student.rank <= 3
              return (
                <div className={`report-ranking-mobile-card ${isTop3 ? `rank-top-${student.rank}` : ''}`} key={student.id}>
                  <div className="ranking-mobile-left">
                    <span className={`report-ranking-number rank-${student.rank}`}>
                      {student.rank}
                    </span>
                    <div className="ranking-mobile-info">
                      <strong className="ranking-student-name">{student.name}</strong>
                      <div className="ranking-student-meta">
                        <span>NIS: {student.nis}</span>
                        <span className="ranking-dot">&bull;</span>
                        <span className="report-ranking-status">{student.rankingStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ranking-mobile-right">
                    <strong className="ranking-average">{formatRaporScore(student.averageScore)}</strong>
                    <small className="ranking-total">Total {student.totalScore}</small>
                  </div>
                </div>
              )
            })}
          </div>

          <RaporPagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(value) => { setRowsPerPage(value); setCurrentPage(1) }}
            rowsPerPage={rowsPerPage}
            totalItems={studentCount}
            totalPages={totalPages}
          />
        </ViewState>
      </section>
    </section>
  )
}
