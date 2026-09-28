import { useEffect, useState } from 'react'
import assessmentService from '../../services/assessmentService.js'
import academicService from '../../services/academicService.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
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
  const [context, setContext] = useState(null)
  const [allClasses, setAllClasses] = useState([])
  const [classData, setClassData] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(authoritative)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authoritative) return undefined

    let isMounted = true
    async function loadOptions() {
      setLoading(true)
      setError('')

      try {
        const [contextResult, classesResult] = await Promise.all([
          assessmentService.getContext(),
          allowClassSelection ? academicService.getSchoolClasses({ per_page: 100 }) : Promise.resolve({ success: false, data: [] }),
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

        let classId = nextContext.homeroom_class?.class_id || nextContext.homeroom_class?.id || nextContext.assigned_courses?.[0]?.class_id
        if (!classId && classesResult?.success && classesResult.data.length > 0) {
          classId = classesResult.data[0].id
        }

        const semesterId = nextContext.active_semester?.id
          || nextContext.assigned_courses?.[0]?.semester_id
          || academicCtx?.selectedSemester?.id
          || academicCtx?.activeSemester?.id

        setSelectedClassId(String(classId || ''))

        if (!includeStudent && !includeSubject) {
          setLoading(false)
        } else if (!classId || !semesterId) {
          setError('Kelas atau semester belum tersedia untuk akun ini.')
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setError('Terjadi kendala saat memuat data konteks akademik.')
          setLoading(false)
        }
      }
    }

    loadOptions()
    return () => { isMounted = false }
  }, [authoritative, allowClassSelection, includeStudent, includeSubject, academicCtx?.selectedSemester?.id, academicCtx?.activeSemester?.id])

  useEffect(() => {
    if (!authoritative || (!includeStudent && !includeSubject)) return undefined
    const semesterId = context?.active_semester?.id
      || context?.assigned_courses?.[0]?.semester_id
      || academicCtx?.selectedSemester?.id
      || academicCtx?.activeSemester?.id

    if (!selectedClassId || !semesterId) return undefined
    let active = true

    async function loadClassData() {
      setLoading(true)
      setClassData(null)
      const result = await assessmentService.getClassRecap(selectedClassId, semesterId)
      if (!active) return
      setClassData(result.success ? result.data : null)
      setError(result.success ? '' : result.error || 'Gagal memuat pilihan akademik.')
      setLoading(false)
    }

    loadClassData()
    return () => { active = false }
  }, [authoritative, context, includeStudent, includeSubject, selectedClassId, academicCtx?.selectedSemester?.id, academicCtx?.activeSemester?.id])

  useEffect(() => {
    if (!authoritative) return
    onOptionsReady({
      context,
      classData,
      classId: selectedClassId,
      loading,
      error,
    })
  }, [authoritative, classData, context, error, loading, onOptionsReady, selectedClassId])

  const classOptions = [...new Map([
    ...(context?.homeroom_class ? [[context.homeroom_class.class_id || context.homeroom_class.id, {
      label: context.homeroom_class.class_name || context.homeroom_class.name,
      value: String(context.homeroom_class.class_id || context.homeroom_class.id),
    }]] : []),
    ...(context?.assigned_courses || []).map((course) => [course.class_id, { label: course.class_name, value: String(course.class_id) }]),
    ...(allowClassSelection ? allClasses.map((c) => [c.id, { label: c.name, value: String(c.id) }]) : []),
  ]).values()]

  const fields = [
    {
      key: 'className',
      label: 'Kelas',
      options: authoritative
        ? (allowClassSelection ? classOptions : classOptions.filter((option) => option.value === selectedClassId))
        : raporOptions.classes.map((value) => ({ label: value, value })),
    },
    {
      key: 'academicYear',
      label: 'Tahun Ajaran',
      options: authoritative
        ? (context?.active_academic_year
            ? [{ label: context.active_academic_year.name, value: String(context.active_academic_year.id) }]
            : (academicCtx?.selectedYear ? [{ label: academicCtx.selectedYear.name, value: String(academicCtx.selectedYear.id) }] : []))
        : raporOptions.academicYears.map((value) => ({ label: value, value })),
    },
    {
      key: 'semester',
      label: 'Semester',
      options: authoritative
        ? (context?.active_semester
            ? [{ label: context.active_semester.name, value: String(context.active_semester.id) }]
            : (academicCtx?.selectedSemester ? [{ label: academicCtx.selectedSemester.name, value: String(academicCtx.selectedSemester.id) }] : []))
        : raporOptions.semesters.map((value) => ({ label: value, value })),
    },
  ]

  if (includeSubject) {
    fields.splice(1, 0, {
      key: 'subject',
      label: 'Mata Pelajaran',
      options: authoritative
        ? (classData?.subjects ?? []).map((subject) => ({ label: subject.name, value: String(subject.id) }))
        : [],
    })
  }

  if (includeStudent) {
    fields.push({
      key: 'studentId',
      label: 'Pilih Siswa',
      options: authoritative
        ? (classData?.students ?? []).map((student) => ({ label: `${student.name} - ${student.nis}`, value: String(student.student_id) }))
        : [],
    })
  }

  if (includeDocument) {
    fields.push({
      key: 'documentType',
      label: 'Jenis Dokumen',
      options: raporDocumentTypes.map((value) => ({ label: value, value })),
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
            {...(field.key === 'className' && authoritative
              ? { value: selectedClassId }
              : Object.prototype.hasOwnProperty.call(values, field.key)
              ? { value: values[field.key] }
              : { defaultValue: field.options[0]?.value ?? '' })}
            onChange={(event) => {
              if (field.key === 'className' && authoritative) {
                setClassData(null)
                setLoading(true)
                setSelectedClassId(event.target.value)
              }
              onChange(field.key, event.target.value)
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
