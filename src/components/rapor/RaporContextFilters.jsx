import { raporDocumentTypes, raporOptions, raporStudents, raporSubjects } from '../../data/rapor.js'

function RaporContextFilters({ includeDocument = false, includeStudent = false, includeSubject = false, values = {}, onChange = () => {} }) {
  const fields = [
    { key: 'className', label: 'Kelas', options: raporOptions.classes.map((value) => ({ label: value, value })) },
    { key: 'academicYear', label: 'Tahun Ajaran', options: raporOptions.academicYears.map((value) => ({ label: value, value })) },
    { key: 'semester', label: 'Semester', options: raporOptions.semesters.map((value) => ({ label: value, value })) },
  ]

  if (includeSubject) fields.splice(1, 0, { key: 'subject', label: 'Mata Pelajaran', options: raporSubjects.map((subject) => ({ label: subject.label, value: subject.key })) })
  if (includeStudent) fields.push({ key: 'studentId', label: 'Pilih Siswa', options: raporStudents.map((student) => ({ label: `${student.name} - ${student.nis}`, value: String(student.id) })) })
  if (includeDocument) fields.push({ key: 'documentType', label: 'Jenis Dokumen', options: raporDocumentTypes.map((value) => ({ label: value, value })) })

  return (
    <div className={`report-context-filters fields-${fields.length}`}>
      {fields.map((field) => (
        <label className="report-field" key={field.key}>
          <span>{field.label}</span>
          <select
            {...(Object.prototype.hasOwnProperty.call(values, field.key)
              ? { value: values[field.key] }
              : { defaultValue: field.options[0].value })}
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
