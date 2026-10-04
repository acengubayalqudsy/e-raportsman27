import { useEffect, useMemo, useRef, useState } from 'react'
import AssessmentFilters from './AssessmentFilters.jsx'
import ScorePagination from './ScorePagination.jsx'
import ScoreTable from './ScoreTable.jsx'
import assessmentService from '../../services/assessmentService.js'
import excelService from '../../services/excelService.js'
import { MasterImportModal } from '../master-data/MasterModals.jsx'
import Icon from '../common/Icon.jsx'
import MasterMobileToolbar from '../master-data/MasterMobileToolbar.jsx'

const assessmentTypes = ['Semua Jenis', 'Formatif', 'Sumatif Lingkup Materi', 'Sumatif Akhir Semester']

function InputNilaiView({ onNotify }) {
  const [assignedCourses, setAssignedCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [isLocked, setIsLocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [savedScores, setSavedScores] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [objectives, setObjectives] = useState([])
  const [newObjective, setNewObjective] = useState({ code: '', description: '' })
  const [newAssessment, setNewAssessment] = useState({ title: '', type: 'Formatif', learning_objective_id: '', passing_grade: '75', assessment_date: '' })

  const [filters, setFilters] = useState({
    className: '',
    subject: '',
    assessmentType: assessmentTypes[0],
    semester: '',
  })

  const [students, setStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(8)
  const [savedRows, setSavedRows] = useState(() => new Set())
  const gbReqIdRef = useRef(0)

  // 1. Load context (assigned courses) on mount
  useEffect(() => {
    let isMounted = true
    async function loadContext() {
      setIsLoading(true)
      const res = await assessmentService.getContext()
      if (!isMounted) return

      if (res.success && res.data) {
        const courses = res.data.assigned_courses || []
        setAssignedCourses(courses)

        if (courses.length > 0) {
          const first = courses[0]
          setSelectedCourseId(first.course_assignment_id)
          setFilters((prev) => ({
            ...prev,
            className: first.class_name,
            subject: first.subject_name,
            semester: first.semester_name || res.data.active_semester?.name || '',
          }))
          setLoadError('')
        } else {
          setSelectedCourseId(null)
          setFilters({
            className: '',
            subject: '',
            assessmentType: assessmentTypes[0],
            semester: res.data.active_semester?.name || '',
          })
          setStudents([])
          setAssessments([])
          setSavedScores({})
          setIsLocked(false)
          setSavedRows(new Set())
          setLoadError('Belum ada penugasan mengajar aktif untuk akun ini.')
        }
      } else {
        setSelectedCourseId(null)
        setAssignedCourses([])
        setStudents([])
        setAssessments([])
        setLoadError(res.error || 'Gagal memuat penugasan mengajar.')
      }
      setIsLoading(false)
    }
    loadContext()
    return () => { isMounted = false }
  }, [])

  // 2. Load Gradebook when selected course changes with race guard
  useEffect(() => {
    if (!selectedCourseId) return

    const reqId = ++gbReqIdRef.current
    let cancelled = false

    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      setLoadError('')
      setStudents([])
      setAssessments([])
      setSavedScores({})
      setIsLocked(false)
      setSavedRows(new Set())

      const res = await assessmentService.getGradebook(selectedCourseId)
      if (cancelled || reqId !== gbReqIdRef.current) return

      if (res.success && res.data) {
        const gb = res.data
        setIsLocked(Boolean(gb.is_locked))
        setAssessments(gb.assessments || [])

        const loadedStudents = (gb.students || []).map((st) => {
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
            kkm: gb.assessments?.[0]?.passing_grade ?? 75,
            scores: scoresObj,
            final_grade: st.final_grade,
          }
        })
        setStudents(loadedStudents)
        setSavedScores(Object.fromEntries(loadedStudents.map((s) => [s.id, { ...s.scores }])))
        // Mark all loaded rows as saved initially
        setSavedRows(new Set(loadedStudents.map((s) => s.id)))
      } else {
        setLoadError(res.error || 'Gagal memuat buku nilai.')
      }
      setIsLoading(false)
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [selectedCourseId, reloadKey])

  const selectedCourse = assignedCourses.find((course) => course.course_assignment_id === selectedCourseId)

  useEffect(() => {
    if (!showCreate || !selectedCourse?.subject_id) return
    let active = true
    assessmentService.getLearningObjectives({
      subject_id: selectedCourse.subject_id,
      semester_id: selectedCourse.semester_id,
      grade: selectedCourse.grade,
    }).then((res) => {
      if (active) setObjectives(res.success ? res.data : [])
    })
    return () => { active = false }
  }, [showCreate, selectedCourse?.subject_id, selectedCourse?.semester_id, selectedCourse?.grade])

  // Derive dropdown options from assigned courses
  const classOptions = useMemo(() => {
    return [...new Set(assignedCourses.map((c) => c.class_name))]
  }, [assignedCourses])

  const subjectOptions = useMemo(() => {
    const filtered = assignedCourses.filter((c) => c.class_name === filters.className && c.semester_name === filters.semester)
    return [...new Set(filtered.map((c) => c.subject_name))]
  }, [assignedCourses, filters.className, filters.semester])

  const semesterOptions = useMemo(() => [...new Set(assignedCourses.map((c) => c.semester_name).filter(Boolean))], [assignedCourses])
  const visibleAssessments = assessments.filter((assessment) => filters.assessmentType === 'Semua Jenis' || assessment.type === filters.assessmentType)

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
    const next = { ...filters, [key]: value }
    if (key === 'className' || key === 'subject' || key === 'semester') {
      let matching = assignedCourses.filter((course) =>
        course.class_name === next.className && course.semester_name === next.semester)
      if (!matching.length) {
        matching = assignedCourses.filter((course) =>
          key === 'semester' ? course.semester_name === next.semester : course.class_name === next.className)
      }
      const chosen = matching.find((course) => course.subject_name === next.subject) || matching[0]
      next.className = chosen?.class_name || next.className
      next.semester = chosen?.semester_name || next.semester
      next.subject = chosen?.subject_name || ''
      setSelectedCourseId(chosen?.course_assignment_id || null)
      setShowCreate(false)
      if (!chosen) {
        setStudents([])
        setAssessments([])
      }
    }
    setFilters(next)
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
      onNotify('Buat instrumen penilaian terlebih dahulu sebelum mengisi nilai.')
      return
    }

    const payloadScores = assessments.filter((ass) =>
      (student.scores[ass.id] ?? '') !== (savedScores[student.id]?.[ass.id] ?? '')
    ).map((ass) => ({
      assessment_id: ass.id,
      student_id: student.id,
      score: student.scores[ass.id] !== '' && student.scores[ass.id] !== undefined ? student.scores[ass.id] : null,
    }))

    if (!payloadScores.length) {
      onNotify(`Tidak ada perubahan nilai ${student.name}.`)
      return
    }

    setIsSaving(true)
    const res = await assessmentService.saveBatchScores(selectedCourseId, payloadScores)
    setIsSaving(false)

    if (res.success) {
      setSavedScores((current) => ({ ...current, [student.id]: { ...student.scores } }))
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
        item.id === student.id ? { ...item, scores: { ...(savedScores[student.id] || {}) } } : item,
      ),
    )
    setSavedRows((current) => new Set(current).add(student.id))
    onNotify(`Nilai ${student.name} dikembalikan ke nilai awal.`)
  }

  // Save all students' scores in one atomic transaction
  const handleSaveAll = async () => {
    if (isLocked) {
      onNotify('Nilai telah divalidasi dan dikunci. Perubahan tidak diizinkan.')
      return
    }

    if (!selectedCourseId || !assessments.length) {
      onNotify('Buat instrumen penilaian terlebih dahulu sebelum mengisi nilai.')
      return
    }

    const allScores = []
    students.forEach((st) => {
      assessments.forEach((ass) => {
        const val = st.scores[ass.id]
        if ((val ?? '') !== (savedScores[st.id]?.[ass.id] ?? '')) {
          allScores.push({
            assessment_id: ass.id,
            student_id: st.id,
            score: val === '' || val === undefined ? null : Number(val),
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
      setSavedScores(Object.fromEntries(students.map((st) => [st.id, { ...st.scores }])))
      setSavedRows(new Set(students.map((s) => s.id)))
      onNotify(res.message || 'Semua nilai berhasil disimpan secara transaksional ke database.')
    } else {
      onNotify(res.error || 'Gagal menyimpan nilai massal.')
    }
  }

  // Calculate final grades and competency achievements
  const handleCalculateFinal = async () => {
    if (!selectedCourseId || !assessments.length || isLocked) return
    const hasUnsavedScores = students.some((student) => assessments.some((assessment) =>
      (student.scores[assessment.id] ?? '') !== (savedScores[student.id]?.[assessment.id] ?? '')
    ))
    if (hasUnsavedScores) {
      onNotify('Simpan perubahan nilai sebelum menghitung nilai akhir.')
      return
    }

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

  const handleCreateObjective = async (event) => {
    event.preventDefault()
    if (!selectedCourse || !newObjective.code.trim() || !newObjective.description.trim()) return
    setIsSaving(true)
    const res = await assessmentService.createLearningObjective({
      subject_id: selectedCourse.subject_id,
      academic_year_id: selectedCourse.academic_year_id,
      semester_id: selectedCourse.semester_id,
      grade: selectedCourse.grade,
      code: newObjective.code.trim(),
      description: newObjective.description.trim(),
    })
    setIsSaving(false)
    if (res.success) {
      setObjectives((current) => [...current, res.data])
      setNewAssessment((current) => ({ ...current, learning_objective_id: String(res.data.id) }))
      setNewObjective({ code: '', description: '' })
      onNotify('Tujuan pembelajaran berhasil ditambahkan.')
    } else {
      onNotify(res.error || 'Gagal menambahkan tujuan pembelajaran.')
    }
  }

  const handleCreateAssessment = async (event) => {
    event.preventDefault()
    if (!selectedCourseId || !newAssessment.title.trim()) return
    setIsSaving(true)
    const res = await assessmentService.createAssessment({
      course_assignment_id: selectedCourseId,
      type: newAssessment.type,
      title: newAssessment.title.trim(),
      passing_grade: Number(newAssessment.passing_grade),
      ...(newAssessment.learning_objective_id ? { learning_objective_id: Number(newAssessment.learning_objective_id) } : {}),
      ...(newAssessment.assessment_date ? { assessment_date: newAssessment.assessment_date } : {}),
    })
    setIsSaving(false)
    if (res.success) {
      setNewAssessment({ title: '', type: 'Formatif', learning_objective_id: '', passing_grade: '75', assessment_date: '' })
      setFilters((current) => ({ ...current, assessmentType: 'Semua Jenis' }))
      setShowCreate(false)
      setReloadKey((current) => current + 1)
      onNotify('Instrumen penilaian berhasil ditambahkan. Kolom nilai siap diisi.')
    } else {
      onNotify(res.error || 'Gagal menambahkan instrumen penilaian.')
    }
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.className) count++
    if (filters.subject) count++
    if (filters.assessmentType && filters.assessmentType !== 'Semua Jenis') count++
    if (filters.semester) count++
    return count
  }, [filters])

  const mobileFilterFields = useMemo(() => [
    {
      key: 'className',
      label: 'Kelas',
      options: classOptions.length ? classOptions : ['Belum tersedia'],
    },
    {
      key: 'subject',
      label: 'Mata Pelajaran',
      options: subjectOptions.length ? subjectOptions : ['Belum tersedia'],
    },
    {
      key: 'assessmentType',
      label: 'Jenis Penilaian',
      options: assessmentTypes,
    },
    {
      key: 'semester',
      label: 'Semester',
      options: semesterOptions.length ? semesterOptions : ['Belum tersedia'],
    },
  ], [classOptions, subjectOptions, semesterOptions])

  return (
    <section className="assessment-workspace">
      {/* Desktop Toolbar */}
      <div className="assessment-desktop-toolbar-container">
        <AssessmentFilters
          classOptions={classOptions}
          canSave={Boolean(selectedCourseId && assessments.length && students.length && !isLoading && !loadError)}
          semesterOptions={semesterOptions}
          assessmentTypes={assessmentTypes}
          filters={filters}
          isLocked={isLocked}
          isSaving={isSaving}
          onFilterChange={handleFilterChange}
          onSaveAll={handleSaveAll}
          onSearchChange={handleSearchChange}
          searchQuery={searchQuery}
          subjectOptions={subjectOptions}
        />

        {selectedCourseId && !loadError && (
          <div className="assessment-create-area">
            <button className="assessment-button secondary" disabled={isLocked || isSaving} onClick={() => setShowImport(true)} type="button">Import Excel</button>
            <button className="assessment-button secondary" onClick={() => excelService.download('scores', 'export', { course_assignment_id: selectedCourseId }).catch((error) => onNotify(error.message))} type="button">Export Excel</button>
            <button className="assessment-button secondary" disabled={isLocked || isSaving} onClick={() => setShowCreate((current) => !current)} type="button">
              {showCreate ? 'Tutup Formulir' : '+ Tambah Instrumen Penilaian'}
            </button>
            {!assessments.length && !isLoading && <span>Belum ada instrumen penilaian. Tambahkan instrumen untuk mulai mengisi nilai.</span>}
          </div>
        )}
      </div>

      {/* Mobile Toolbar (Search + Filter Sheet + Primary CTA + Overflow) */}
      <div className="assessment-mobile-toolbar-wrapper">
        <MasterMobileToolbar
          activeFilterCount={activeFilterCount}
          exportLabel="Export Excel"
          extraActions={[
            {
              label: showCreate ? 'Tutup Form Tambah' : '+ Tambah Instrumen Penilaian',
              icon: 'plus',
              disabled: isLocked || isSaving || !selectedCourseId,
              onClick: () => setShowCreate((prev) => !prev),
            },
          ]}
          filterFields={mobileFilterFields}
          filters={filters}
          importLabel="Import Excel"
          onExport={selectedCourseId ? () => excelService.download('scores', 'export', { course_assignment_id: selectedCourseId }).catch((error) => onNotify(error.message)) : undefined}
          onFilterChange={handleFilterChange}
          onFilterReset={() => {
            const first = assignedCourses[0]
            if (first) {
              setSelectedCourseId(first.course_assignment_id)
              setFilters({
                className: first.class_name,
                subject: first.subject_name,
                assessmentType: assessmentTypes[0],
                semester: first.semester_name || '',
              })
            }
          }}
          onImport={selectedCourseId && !isLocked ? () => setShowImport(true) : undefined}
          onSearchChange={handleSearchChange}
          primaryAction={
            <button
              aria-label="Simpan Semua Nilai"
              className="master-mobile-primary-cta"
              disabled={isLocked || isSaving || !selectedCourseId || !assessments.length || !students.length || isLoading || Boolean(loadError)}
              onClick={handleSaveAll}
              type="button"
            >
              <Icon name={isLocked ? "lock" : "save"} />
              <span>{isLocked ? 'Nilai Terkunci' : isSaving ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
            </button>
          }
          searchPlaceholder="Cari siswa (NIS/Nama)..."
          searchQuery={searchQuery}
        />
      </div>

      {loadError && <div className="assessment-data-message" role="alert">{loadError}</div>}

      {showCreate && selectedCourse && !isLocked && (
        <div className="assessment-create-panel">
          <form onSubmit={handleCreateObjective}>
            <h3>Tambah Tujuan Pembelajaran</h3>
            <p>Opsional. Tujuan pembelajaran baru akan langsung terpilih untuk instrumen berikutnya.</p>
            <div className="assessment-create-fields">
              <label>Kode TP<input maxLength="30" onChange={(event) => setNewObjective((current) => ({ ...current, code: event.target.value }))} placeholder="Contoh: TP-01" required value={newObjective.code} /></label>
              <label>Deskripsi TP<input onChange={(event) => setNewObjective((current) => ({ ...current, description: event.target.value }))} required value={newObjective.description} /></label>
              <button className="assessment-button secondary" disabled={isSaving} type="submit">Simpan TP</button>
            </div>
          </form>
          <form onSubmit={handleCreateAssessment}>
            <h3>Tambah Instrumen Penilaian</h3>
            <div className="assessment-create-fields">
              <label>Judul<input maxLength="100" onChange={(event) => setNewAssessment((current) => ({ ...current, title: event.target.value }))} required value={newAssessment.title} /></label>
              <label>Jenis<select onChange={(event) => setNewAssessment((current) => ({ ...current, type: event.target.value }))} value={newAssessment.type}>{assessmentTypes.slice(1).map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              <label>Tujuan Pembelajaran<select onChange={(event) => setNewAssessment((current) => ({ ...current, learning_objective_id: event.target.value }))} value={newAssessment.learning_objective_id}><option value="">Tanpa TP</option>{objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.code} — {objective.description}</option>)}</select></label>
              <label>KKTP<input max="100" min="0" onChange={(event) => setNewAssessment((current) => ({ ...current, passing_grade: event.target.value }))} required type="number" value={newAssessment.passing_grade} /></label>
              <label>Tanggal<input onChange={(event) => setNewAssessment((current) => ({ ...current, assessment_date: event.target.value }))} type="date" value={newAssessment.assessment_date} /></label>
              <button className="assessment-button primary" disabled={isSaving} type="submit">{isSaving ? 'Menyimpan...' : 'Simpan Instrumen'}</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Memuat data nilai dari server...</p>
        </div>
      ) : selectedCourseId && !loadError ? (
        <ScoreTable
          assessmentType={filters.assessmentType}
          assessments={visibleAssessments}
          isLocked={isLocked}
          isSaving={isSaving}
          onCalculateFinal={handleCalculateFinal}
          onReset={handleResetRow}
          onSave={handleSaveRow}
          onScoreChange={handleScoreChange}
          savedRows={savedRows}
          startIndex={startIndex}
          students={visibleStudents}
          subject={filters.subject}
        />
      ) : null}

      {selectedCourseId && !loadError && <ScorePagination
        currentPage={safePage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPage={rowsPerPage}
        totalItems={filteredStudents.length}
        totalPages={totalPages}
      />}
      {showImport && selectedCourseId && <MasterImportModal
        context={{ course_assignment_id: selectedCourseId }}
        entityLabel="Nilai"
        module="scores"
        onClose={() => setShowImport(false)}
        onComplete={(count) => { setShowImport(false); setReloadKey((key) => key + 1); onNotify(`${count} nilai berhasil diimport.`) }}
      />}
    </section>
  )
}

export default InputNilaiView
