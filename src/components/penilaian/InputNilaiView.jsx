import { useMemo, useState } from 'react'
import AssessmentFilters from './AssessmentFilters.jsx'
import ScorePagination from './ScorePagination.jsx'
import ScoreTable from './ScoreTable.jsx'
import { assessmentOptions, scoreStudents } from '../../data/penilaian.js'

const createInitialStudents = () =>
  scoreStudents.map((student) => ({
    ...student,
    scores: { ...student.initialScores },
  }))

function InputNilaiView({ onNotify }) {
  const [filters, setFilters] = useState({
    className: assessmentOptions.classes[0],
    subject: assessmentOptions.subjects[0],
    assessmentType: assessmentOptions.assessmentTypes[0],
    semester: assessmentOptions.semesters[0],
  })
  const [students, setStudents] = useState(createInitialStudents)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [savedRows, setSavedRows] = useState(() => new Set())

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return students

    return students.filter((student) => {
      return student.nis.toLowerCase().includes(query) || student.name.toLowerCase().includes(query)
    })
  }, [searchQuery, students])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleStudents = filteredStudents.slice(startIndex, startIndex + rowsPerPage)

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
    setSavedRows(new Set())
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleScoreChange = (studentId, field, rawValue) => {
    const parsedValue = Number(rawValue)
    const nextValue = Number.isFinite(parsedValue) ? Math.min(100, Math.max(0, parsedValue)) : 0

    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? { ...student, scores: { ...student.scores, [field]: nextValue } }
          : student,
      ),
    )
    setSavedRows((current) => {
      const next = new Set(current)
      next.delete(studentId)
      return next
    })
  }

  const handleSaveRow = (student) => {
    setSavedRows((current) => new Set(current).add(student.id))
    onNotify(`Nilai ${student.name} berhasil disimpan.`)
  }

  const handleResetRow = (student) => {
    setStudents((current) =>
      current.map((item) =>
        item.id === student.id ? { ...item, scores: { ...item.initialScores } } : item,
      ),
    )
    setSavedRows((current) => {
      const next = new Set(current)
      next.delete(student.id)
      return next
    })
    onNotify(`Nilai ${student.name} dikembalikan ke nilai awal.`)
  }

  const handleSaveAll = () => {
    setSavedRows(new Set(students.map((student) => student.id)))
    onNotify('Semua nilai berhasil disimpan.')
  }

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  return (
    <section className="assessment-workspace">
      <AssessmentFilters
        filters={filters}
        onDownload={() => onNotify('Fitur unduh template akan tersedia pada tahap integrasi berikutnya.')}
        onFilterChange={handleFilterChange}
        onSaveAll={handleSaveAll}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
      />

      <ScoreTable
        assessmentType={filters.assessmentType}
        onReset={handleResetRow}
        onSave={handleSaveRow}
        onScoreChange={handleScoreChange}
        savedRows={savedRows}
        startIndex={startIndex}
        students={visibleStudents}
        subject={filters.subject}
      />

      <ScorePagination
        currentPage={safePage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPage={rowsPerPage}
        totalItems={filteredStudents.length}
        totalPages={totalPages}
      />
    </section>
  )
}

export default InputNilaiView
