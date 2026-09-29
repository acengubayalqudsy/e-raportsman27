import { useEffect, useMemo, useState } from 'react'
import assessmentService from '../../services/assessmentService.js'
import academicService from '../../services/academicService.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import Icon from '../common/Icon.jsx'
import { raporDocumentTypes, raporOptions } from '../../data/rapor.js'

const noop = () => {}

function RaporContextFilters({
  authoritative = false,
  includeDocument = false,
  includeStudent = false,
  includeSubject = false,
  allowClassSelection = false,
  values = {},
  onChange = noop,
  onOptionsReady = noop,
}) {
  const academicCtx = useAcademicContext()
  const { hasRole } = useAuth()
  const isAdmin = Boolean(hasRole && hasRole('admin'))
  const [context, setContext] = useState(null)
  const [allClasses, setAllClasses] = useState([])
  const [classData, setClassData] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [loading, setLoading] = useState(authoritative)
  const [error, setError] = useState('')

  // 1. Initial authoritative context and classes load
  useEffect(() => {
    if (!authoritative) return undefined

    let isMounted = true
    async function loadOptions() {
      setLoading(true)
      setError('')

      try {
        const [contextResult, classesResult] = await Promise.all([
          assessmentService.getContext(),
          isAdmin ? academicService.getClasses({ per_page: 100 }) : Promise.resolve(null),
        ])

        if (!isMounted) return

        if (classesResult?.success && Array.isArray(classesResult.data)) {
          setAllClasses(classesResult.data)
        }

        if (!contextResult.success || !contextResult.data) {
          setContext(null)
          setClassData(null)
          setError(contextResult.error || 'Gagal memuat konteks akademik.')
          setLoading(false)
          return
        }

        const nextContext = contextResult.data
        setContext(nextContext)

        // Resolve assigned homeroom classes or teaching classes
        const homeroomList = Array.isArray(nextContext.homeroom_classes) && nextContext.homeroom_classes.length > 0
          ? nextContext.homeroom_classes
          : (nextContext.homeroom_class ? [nextContext.homeroom_class] : [])

        let initialClassId = String(
          homeroomList[0]?.class_id
          || homeroomList[0]?.id
          || nextContext.assigned_courses?.[0]?.class_id
          || (isAdmin ? classesResult?.data?.[0]?.id : '')
          || ''
        )

        setSelectedClassId(initialClassId)

        // Find initial class object to align academic year and semester
        const initialClassObj = homeroomList.find((c) => String(c.class_id || c.id) === initialClassId)
          || nextContext.assigned_courses?.find((c) => String(c.class_id) === initialClassId)
          || (isAdmin ? classesResult?.data?.find((c) => String(c.id) === initialClassId) : null)

        const initialYearId = String(
          initialClassObj?.academic_year_id
          || nextContext.active_academic_year?.id
          || academicCtx?.selectedYearId
          || ''
        )
        setSelectedYearId(initialYearId)

        const initialSemId = String(
          initialClassObj?.semester_id
          || nextContext.active_semester?.id
          || academicCtx?.selectedSemesterId
          || ''
        )
        setSelectedSemesterId(initialSemId)

        if (!initialClassId) {
          setError('Belum ada kelas yang ditugaskan oleh Administrator untuk akun ini.')
          setLoading(false)
        } else if (!includeStudent && !includeSubject) {
          setLoading(false)
        }
      } catch (err) {
        console.error('[RaporContextFilters] Context load error:', err)
        if (isMounted) {
          setError('Terjadi kendala saat memuat data konteks akademik.')
          setLoading(false)
        }
      }
    }

    loadOptions()
    return () => { isMounted = false }
  }, [authoritative, academicCtx?.selectedSemesterId, academicCtx?.selectedYearId, includeStudent, includeSubject, isAdmin])

  // 2. Build authoritative class options strictly reflecting Master Data and Admin assignments
  const classOptions = useMemo(() => {
    if (!authoritative) {
      return raporOptions.classes.map((value) => ({ label: value, value }))
    }

    const map = new Map()

    // 1. Homeroom classes assigned by Admin (Primary for Wali Kelas)
    if (Array.isArray(context?.homeroom_classes) && context.homeroom_classes.length > 0) {
      context.homeroom_classes.forEach((cls) => {
        const id = String(cls.class_id || cls.id)
        if (id) {
          map.set(id, {
            value: id,
            label: cls.class_name || cls.name,
            academicYearId: cls.academic_year_id,
            academicYearName: cls.academic_year_name,
            semesterId: cls.semester_id,
            semesterName: cls.semester_name,
          })
        }
      })
    } else if (context?.homeroom_class) {
      const cls = context.homeroom_class
      const id = String(cls.class_id || cls.id)
      if (id) {
        map.set(id, {
          value: id,
          label: cls.class_name || cls.name,
          academicYearId: cls.academic_year_id,
          academicYearName: cls.academic_year_name,
          semesterId: cls.semester_id,
          semesterName: cls.semester_name,
        })
      }
    }

    // 2. Assigned teaching courses (Secondary, for teachers)
    if (Array.isArray(context?.assigned_courses)) {
      context.assigned_courses.forEach((course) => {
        const id = String(course.class_id)
        if (id && !map.has(id)) {
          map.set(id, {
            value: id,
            label: course.class_name,
            academicYearId: course.academic_year_id,
            semesterId: course.semester_id,
          })
        }
      })
    }

    // 3. Admin view: only Administrator can access and switch to any class from Master Data
    if (isAdmin) {
      allClasses.forEach((cls) => {
        const id = String(cls.id)
        if (!map.has(id)) {
          map.set(id, {
            value: id,
            label: cls.name,
            academicYearId: cls.academic_year_id,
            academicYearName: cls.academic_year?.name,
          })
        }
      })
    }

    return Array.from(map.values())
  }, [authoritative, context, allClasses, isAdmin])

  // Effective selected class
  const effectiveClassId = String(values.className ?? selectedClassId ?? classOptions[0]?.value ?? '')
  const selectedClassObj = useMemo(() => {
    return classOptions.find((c) => c.value === effectiveClassId) || classOptions[0] || null
  }, [classOptions, effectiveClassId])

  // Effective academic year
  const effectiveYearId = String(
    values.academicYear
    ?? selectedYearId
    ?? selectedClassObj?.academicYearId
    ?? context?.active_academic_year?.id
    ?? academicCtx?.selectedYearId
    ?? ''
  )

  // 3. Build Academic Year Options
  const academicYearOptions = !authoritative
    ? raporOptions.academicYears.map((value) => ({ label: value, value }))
    : (academicCtx?.availableYears?.length
        ? academicCtx.availableYears.map((y) => ({ label: y.name, value: String(y.id) }))
        : (context?.active_academic_year
            ? [{ label: context.active_academic_year.name, value: String(context.active_academic_year.id) }]
            : []))

  // 4. Build Semester Options (cascaded by effective year)
  let matchingSemesters = []
  if (!authoritative) {
    matchingSemesters = raporOptions.semesters.map((value) => ({ label: value, value }))
  } else {
    const list = (academicCtx?.allSemesters || []).filter(
      (s) => String(s.academic_year_id) === effectiveYearId
    )
    if (list.length > 0) {
      matchingSemesters = list.map((s) => ({ label: s.name, value: String(s.id) }))
    } else if (context?.active_semester) {
      matchingSemesters = [{ label: context.active_semester.name, value: String(context.active_semester.id) }]
    } else if (academicCtx?.allSemesters?.length) {
      matchingSemesters = academicCtx.allSemesters.map((s) => ({ label: s.name, value: String(s.id) }))
    }
  }
  const semesterOptions = matchingSemesters

  // Effective selected semester
  let effectiveSemesterId = ''
  if (values.semester) {
    effectiveSemesterId = String(values.semester)
  } else if (selectedSemesterId && semesterOptions.some((opt) => opt.value === String(selectedSemesterId))) {
    effectiveSemesterId = String(selectedSemesterId)
  } else if (selectedClassObj?.semesterId && semesterOptions.some((opt) => opt.value === String(selectedClassObj.semesterId))) {
    effectiveSemesterId = String(selectedClassObj.semesterId)
  } else {
    const activeSem = (academicCtx?.allSemesters || []).find(
      (s) => String(s.academic_year_id) === effectiveYearId && s.status === 'Aktif'
    )
    if (activeSem) {
      effectiveSemesterId = String(activeSem.id)
    } else {
      effectiveSemesterId = semesterOptions[0]?.value || String(context?.active_semester?.id || '')
    }
  }

  // 5. Load real students and subjects for the selected class & semester from backend
  useEffect(() => {
    if (!authoritative || (!includeStudent && !includeSubject)) return undefined
    if (!effectiveClassId || !effectiveSemesterId) return undefined

    let active = true
    async function loadClassData() {
      setLoading(true)
      setClassData(null)
      setError('')

      try {
        const result = await assessmentService.getClassRecap(effectiveClassId, effectiveSemesterId)
        if (!active) return

        if (result.success && result.data) {
          setClassData(result.data)
          setError('')
        } else {
          setClassData(null)
          setError(result.error || 'Gagal memuat pilihan data siswa/mapel.')
        }
      } catch {
        if (active) setError('Terjadi kendala saat memuat data siswa.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadClassData()
    return () => { active = false }
  }, [authoritative, effectiveClassId, effectiveSemesterId, includeStudent, includeSubject])

  // 6. Notify parent component with complete authoritative context
  useEffect(() => {
    if (!authoritative) return
    onOptionsReady({
      context,
      classData,
      classId: effectiveClassId,
      semesterId: effectiveSemesterId,
      academicYearId: effectiveYearId,
      selectedClass: selectedClassObj,
      students: classData?.students ?? [],
      subjects: classData?.subjects ?? [],
      loading,
      error,
    })
  }, [authoritative, classData, context, effectiveClassId, effectiveSemesterId, effectiveYearId, error, loading, onOptionsReady, selectedClassObj])

  // Handle class selection change with cascading year and semester
  const handleClassChange = (newClassId) => {
    setSelectedClassId(newClassId)
    setClassData(null)

    const classObj = classOptions.find((c) => c.value === newClassId)
    const nextYearId = String(classObj?.academicYearId || effectiveYearId)
    setSelectedYearId(nextYearId)

    // Find matching semester for this class/year
    const matchingSems = (academicCtx?.allSemesters || []).filter(
      (s) => String(s.academic_year_id) === nextYearId
    )
    const nextSemId = String(
      classObj?.semesterId
      || matchingSems.find((s) => s.status === 'Aktif')?.id
      || matchingSems[0]?.id
      || effectiveSemesterId
    )
    setSelectedSemesterId(nextSemId)

    onChange('className', newClassId)
    onChange('academicYear', nextYearId)
    onChange('semester', nextSemId)
  }

  // Handle semester change
  const handleSemesterChange = (newSemesterId) => {
    setSelectedSemesterId(newSemesterId)
    onChange('semester', newSemesterId)
  }

  // Handle academic year change
  const handleYearChange = (newYearId) => {
    setSelectedYearId(newYearId)
    onChange('academicYear', newYearId)

    // Auto-select first class and semester for this year
    const classesForYear = classOptions.filter((c) => String(c.academicYearId) === String(newYearId))
    if (classesForYear.length > 0 && !classesForYear.some((c) => c.value === effectiveClassId)) {
      handleClassChange(classesForYear[0].value)
    } else {
      const matchingSems = (academicCtx?.allSemesters || []).filter(
        (s) => String(s.academic_year_id) === String(newYearId)
      )
      const nextSemId = String(matchingSems.find((s) => s.status === 'Aktif')?.id || matchingSems[0]?.id || '')
      if (nextSemId) {
        setSelectedSemesterId(nextSemId)
        onChange('semester', nextSemId)
      }
    }
  }

  // 7. Field definitions
  const fields = [
    {
      key: 'className',
      label: 'Kelas',
      value: effectiveClassId,
      options: classOptions,
      disabled: !allowClassSelection && !isAdmin && classOptions.length <= 1,
      onFieldChange: handleClassChange,
    },
    {
      key: 'academicYear',
      label: 'Tahun Ajaran',
      value: effectiveYearId,
      options: academicYearOptions,
      onFieldChange: handleYearChange,
    },
    {
      key: 'semester',
      label: 'Semester',
      value: effectiveSemesterId,
      options: semesterOptions,
      onFieldChange: handleSemesterChange,
    },
  ]

  if (includeSubject) {
    fields.splice(1, 0, {
      key: 'subject',
      label: 'Mata Pelajaran',
      value: String(values.subject ?? ''),
      options: authoritative
        ? (classData?.subjects ?? []).map((subject) => ({ label: subject.name, value: String(subject.id) }))
        : [],
      onFieldChange: (val) => onChange('subject', val),
    })
  }

  if (includeStudent) {
    fields.splice(1, 0, {
      key: 'studentId',
      label: 'Pilih Siswa',
      value: String(values.studentId ?? ''),
      options: authoritative
        ? (classData?.students ?? []).map((student) => ({ label: `${student.name} - ${student.nis}`, value: String(student.student_id) }))
        : [],
      onFieldChange: (val) => onChange('studentId', val),
    })
  }

  if (includeDocument) {
    fields.splice(1, 0, {
      key: 'documentType',
      label: 'Jenis Dokumen',
      value: String(values.documentType ?? raporDocumentTypes[0]),
      options: raporDocumentTypes.map((value) => ({ label: value, value })),
      onFieldChange: (val) => onChange('documentType', val),
    })
  }

  return (
    <div className={`report-context-filters fields-${fields.length}`}>
      {authoritative && loading && (
        <div className="report-filter-message status" role="status">
          <Icon name="clock" />
          <span>Memuat konteks akademik...</span>
        </div>
      )}
      {authoritative && error && (
        <div className="report-filter-message error" role="alert">
          <Icon name="alert-circle" />
          <span>{error}</span>
        </div>
      )}
      {fields.map((field) => (
        <label className={`report-field field-${field.key}`} key={field.key}>
          <span>{field.label}</span>
          <select
            disabled={Boolean(field.disabled)}
            value={field.value}
            onChange={(event) => {
              if (field.onFieldChange) {
                field.onFieldChange(event.target.value)
              } else {
                onChange(field.key, event.target.value)
              }
            }}
          >
            {field.options.length === 0 && <option value="">Pilih {field.label.toLowerCase()}</option>}
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

export default RaporContextFilters
