import { useEffect, useMemo, useState } from 'react'
import AssessmentFilters from './AssessmentFilters.jsx'
import ScorePagination from './ScorePagination.jsx'
import ScoreTable from './ScoreTable.jsx'
import assessmentService from '../../services/assessmentService.js'
import { assessmentOptions, scoreStudents } from '../../data/penilaian.js'

const createInitialStudents = () =>
  scoreStudents.map((student) => ({
    ...student,
    scores: { ...student.initialScores },
  }))

function InputNilaiView({ onNotify }) {
  const [assignedCourses, setAssignedCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [isLocked, setIsLocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  // 1. Load context (assigned courses) on mount
  useEffect(() => {
    let isMounted = true
    async function loadContext() {
      setIsLoading(true)
      const res = await assessmentService.getContext()
      if (isMounted && res.success && res.data) {
        const courses = res.data.assigned_courses || []
        setAssignedCourses(courses)

        if (courses.length > 0) {
          const first = courses[0]
          setSelectedCourseId(first.course_assignment_id)
          setFilters((prev) => ({
            ...prev,
            className: first.class_name,
            subject: first.subject_name,
            semester: res.data.active_semester?.name || prev.semester,
          }))
        }
      }
      if (isMounted) setIsLoading(false)
    }
    loadContext()
    return () => { isMounted = false }
  }, [])

  // 2. Load Gradebook when selected course changes
  useEffect(() => {
    if (!selectedCourseId) return
    let isMounted = true

    async function loadGradebook() {
      setIsLoading(true)
      const res = await assessmentService.getGradebook(selectedCourseId)
      if (isMounted && res.success && res.data) {
        const gb = res.data
        setIsLocked(Boolean(gb.is_locked))
        setAssessments(gb.assessments || [])

        if (gb.students && gb.students.length > 0) {
          // Normalize student score structure
          const loadedStudents = gb.students.map((st) => {
            const scoresObj = {}
            if (st.scores) {
              Object.entries(st.scores).forEach(([assId, sc]) => {
                scoresObj[assId] = sc.final_score !== null && sc.final_score !== undefined ? sc.final_score : ''
              })
            }
            return {
              id: st.id,
              nis: st.nis,
              name: st.name,
              kkm: 75,
              scores: scoresObj,
              final_grade: st.final_grade,
            }
          })
          setStudents(loadedStudents)
          // Mark all loaded rows as saved initially
          setSavedRows(new Set(loadedStudents.map((s) => s.id)))
        }
      }
      if (isMounted) setIsLoading(false)
    }

    loadGradebook()
    return () => { isMounted = false }
  }, [selectedCourseId])

  // Derive dropdown options from assigned courses
  const classOptions = useMemo(() => {
    if (!assignedCourses.length) return assessmentOptions.classes
    return [...new Set(assignedCourses.map((c) => c.class_name))]
  }, [assignedCourses])

  const subjectOptions = useMemo(() => {
    if (!assignedCourses.length) return assessmentOptions.subjects
    const filtered = assignedCourses.filter((c) => c.class_name === filters.className)
    return [...new Set(filtered.map((c) => c.subject_name))]
  }, [assignedCourses, filters.className])

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return students

    return students.filter((student) => {
      return (
        (student.nis && student.nis.toLowerCase().includes(query)) ||
        (student.name && student.name.toLowerCase().includes(query))
      )
    })
  }, [searchQuery, students])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const visibleStudents = filteredStudents.slice(startIndex, startIndex + rowsPerPage)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }

      // If class changed, pick matching course assignment
      if (key === 'className' || key === 'subject') {
        const cls = key === 'className' ? value : next.className
        const sbj = key === 'subject' ? value : next.subject
        const match = assignedCourses.find((c) => c.class_name === cls && c.subject_name === sbj)
        if (match) {
          setSelectedCourseId(match.course_assignment_id)
        } else {
          const firstForClass = assignedCourses.find((c) => c.class_name === cls)
          if (firstForClass) {
            next.subject = firstForClass.subject_name
            setSelectedCourseId(firstForClass.course_assignment_id)
          }
        }
      }

      return next
    })
    setCurrentPage(1)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleScoreChange = (studentId, fieldKey, rawValue) => {
    if (isLocked) return

    const parsedValue = rawValue === '' ? '' : Number(rawValue)
    const nextValue = parsedValue === '' ? '' : Number.isFinite(parsedValue) ? Math.min(100, Math.max(0, parsedValue)) : 0

    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? { ...student, scores: { ...student.scores, [fieldKey]: nextValue } }
          : student,
      ),
    )

    setSavedRows((current) => {
      const next = new Set(current)
      next.delete(studentId)
      return next
    })
  }

  // Save single student's scores to backend
  const handleSaveRow = async (student) => {
    if (isLocked) {
      onNotify('Nilai telah divalidasi dan dikunci. Perubahan tidak diizinkan.')
      return
    }

    if (!selectedCourseId || !assessments.length) {
      setSavedRows((current) => new Set(current).add(student.id))
      onNotify(`Nilai ${student.name} berhasil disimpan secara lokal.`)
      return
    }

    const payloadScores = assessments.map((ass) => ({
      assessment_id: ass.id,
      student_id: student.id,
      score: student.scores[ass.id] !== '' && student.scores[ass.id] !== undefined ? student.scores[ass.id] : null,
    }))

    setIsSaving(true)
    const res = await assessmentService.saveBatchScores(selectedCourseId, payloadScores)
    setIsSaving(false)

    if (res.success) {
      setSavedRows((current) => new Set(current).add(student.id))
      onNotify(`Nilai ${student.name} berhasil disimpan ke database.`)
    } else {
      onNotify(res.error || `Gagal menyimpan nilai ${student.name}.`)
    }
  }

  // Reset student row
  const handleResetRow = (student) => {
    if (isLocked) return
    setStudents((current) =>
      current.map((item) =>
        item.id === student.id ? { ...item, scores: { ...item.scores } } : item,
      ),
    )
    onNotify(`Nilai ${student.name} dikembalikan ke nilai awal.`)
  }

  // Save all students' scores in one atomic transaction
  const handleSaveAll = async () => {
    if (isLocked) {
      onNotify('Nilai telah divalidasi dan dikunci. Perubahan tidak diizinkan.')
      return
    }

    if (!selectedCourseId || !assessments.length) {
      setSavedRows(new Set(students.map((s) => s.id)))
      onNotify('Semua nilai berhasil disimpan secara lokal.')
      return
    }

    const allScores = []
    students.forEach((st) => {
      assessments.forEach((ass) => {
        const val = st.scores[ass.id]
        if (val !== undefined && val !== '') {
          allScores.push({
            assessment_id: ass.id,
            student_id: st.id,
            score: Number(val),
          })
        }
      })
    })

    if (!allScores.length) {
      onNotify('Tidak ada nilai untuk disimpan.')
      return
    }

    setIsSaving(true)
    const res = await assessmentService.saveBatchScores(selectedCourseId, allScores)
    setIsSaving(false)

    if (res.success) {
      setSavedRows(new Set(students.map((s) => s.id)))
      onNotify(res.message || 'Semua nilai berhasil disimpan secara transaksional ke database.')
    } else {
      onNotify(res.error || 'Gagal menyimpan nilai massal.')
    }
  }

  // Calculate final grades and competency achievements
  const handleCalculateFinal = async () => {
    if (!selectedCourseId) return

    setIsSaving(true)
    const res = await assessmentService.calculateFinalGrades(selectedCourseId)
    setIsSaving(false)

    if (res.success) {
      onNotify('Nilai akhir & capaian kompetensi berhasil dihitung otomatis!')
      // Refresh gradebook
      const gbRes = await assessmentService.getGradebook(selectedCourseId)
      if (gbRes.success && gbRes.data?.students) {
        setStudents((prev) =>
          prev.map((s) => {
            const updated = gbRes.data.students.find((us) => us.id === s.id)
            return updated ? { ...s, final_grade: updated.final_grade } : s
          }),
        )
      }
    } else {
      onNotify(res.error || 'Gagal menghitung nilai akhir.')
    }
  }

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  return (
    <section className="assessment-workspace">
      <AssessmentFilters
        classOptions={classOptions}
        filters={filters}
        isLocked={isLocked}
        isSaving={isSaving}
        onDownload={() => onNotify('Fitur unduh template Excel telah disiapkan.')}
        onFilterChange={handleFilterChange}
        onSaveAll={handleSaveAll}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        subjectOptions={subjectOptions}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Memuat data nilai dari server...</p>
        </div>
      ) : (
        <ScoreTable
          assessmentType={filters.assessmentType}
          assessments={assessments}
          isLocked={isLocked}
          onCalculateFinal={handleCalculateFinal}
          onReset={handleResetRow}
          onSave={handleSaveRow}
          onScoreChange={handleScoreChange}
          savedRows={savedRows}
          startIndex={startIndex}
          students={visibleStudents}
          subject={filters.subject}
        />
      )}

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
