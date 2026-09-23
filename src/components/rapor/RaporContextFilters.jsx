import { useEffect, useState } from 'react'
import assessmentService from '../../services/assessmentService.js'
import { raporDocumentTypes, raporOptions } from '../../data/rapor.js'

const noop = () => {}

function RaporContextFilters({
  authoritative = false,
  includeDocument = false,
  includeStudent = false,
  includeSubject = false,
  values = {},
  onChange = noop,
  onOptionsReady = noop,
}) {
  const [context, setContext] = useState(null)
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(authoritative)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authoritative) return undefined

    let isMounted = true
    async function loadOptions() {
      setLoading(true)
      setError('')
      const contextResult = await assessmentService.getContext()
      if (!isMounted) return

      if (!contextResult.success || !contextResult.data) {
        setContext(null)
        setClassData(null)
        setError(contextResult.error || 'Gagal memuat konteks akademik.')
        setLoading(false)
        return
      }

      const nextContext = contextResult.data
      setContext(nextContext)
      const classId = nextContext.homeroom_class?.id || nextContext.assigned_courses?.[0]?.class_id
      const semesterId = nextContext.active_semester?.id
      if ((includeStudent || includeSubject) && classId && semesterId) {
        const recapResult = await assessmentService.getClassRecap(classId, semesterId)
        if (!isMounted) return
        if (!recapResult.success) {
          setClassData(null)
          setError(recapResult.error || 'Gagal memuat pilihan akademik.')
        } else {
          setClassData(recapResult.data)
        }
      }
      setLoading(false)
    }

    loadOptions()
    return () => { isMounted = false }
  }, [authoritative, includeStudent, includeSubject])

  useEffect(() => {
    if (!authoritative) return
    onOptionsReady({
      context,
      classData,
      loading,
      error,
    })
  }, [authoritative, classData, context, error, loading, onOptionsReady])

  const fields = [
    {
      key: 'className',
      label: 'Kelas',
      options: authoritative
        ? (context?.homeroom_class
            ? [{ label: context.homeroom_class.name, value: String(context.homeroom_class.id) }]
            : context?.assigned_courses?.[0]?.class_id
              ? [{ label: context.assigned_courses[0].class_name, value: String(context.assigned_courses[0].class_id) }]
              : [])
        : raporOptions.classes.map((value) => ({ label: value, value })),
    },
    {
      key: 'academicYear',
      label: 'Tahun Ajaran',
      options: authoritative
        ? (context?.active_academic_year ? [{ label: context.active_academic_year.name, value: String(context.active_academic_year.id) }] : [])
        : raporOptions.academicYears.map((value) => ({ label: value, value })),
    },
    {
      key: 'semester',
      label: 'Semester',
      options: authoritative
        ? (context?.active_semester ? [{ label: context.active_semester.name, value: String(context.active_semester.id) }] : [])
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
  if (includeDocument) fields.push({ key: 'documentType', label: 'Jenis Dokumen', options: raporDocumentTypes.map((value) => ({ label: value, value })) })

  return (
    <div className={`report-context-filters fields-${fields.length}`}>
      {authoritative && loading && <p role="status">Memuat konteks akademik...</p>}
      {authoritative && error && <p role="alert">{error}</p>}
      {fields.map((field) => (
        <label className="report-field" key={field.key}>
          <span>{field.label}</span>
          <select
            {...(Object.prototype.hasOwnProperty.call(values, field.key)
              ? { value: values[field.key] }
              : { defaultValue: field.options[0]?.value ?? '' })}
            onChange={(event) => onChange(field.key, event.target.value)}
          >
            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ))}
    </div>
  )
}

export default RaporContextFilters
