import { useEffect, useMemo, useState } from 'react'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import assessmentService from '../../services/assessmentService.js'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'

const statusOptions = [
  { value: '', label: 'Belum diisi' },
  { value: 'Hadir', label: 'Hadir' },
  { value: 'Sakit', label: 'Sakit' },
  { value: 'Izin', label: 'Izin' },
  { value: 'Alpa', label: 'Alpa' },
]

function localDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function AttendanceDetailView({ mode, onNotify }) {
  const { availableYears, availableSemesters, selectedYearId, selectedSemesterId, setSelectedYearId, setSelectedSemesterId } = useAcademicContext()
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(localDate)
  const [data, setData] = useState(null)
  const [draftOverrides, setDraftOverrides] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const scope = mode === 'per-mapel' ? 'subject' : 'class'
  const usableData = data?.class?.id === Number(classId) && data?.semester?.id === Number(selectedSemesterId) ? data : null
  const drafts = useMemo(() => {
    if (!usableData) return {}
    const dateEntries = new Map(usableData.entries.filter((entry) => entry.attendance_date === date).map((entry) => [String(entry.student_id), entry]))
    return Object.fromEntries(usableData.students.map((student) => {
      const entry = dateEntries.get(String(student.student_id))
      return [student.student_id, { status: entry?.status || '', notes: entry?.notes || '', ...draftOverrides[student.student_id] }]
    }))
  }, [date, draftOverrides, usableData])

  useEffect(() => {
    if (!selectedSemesterId) return undefined
    let cancelled = false
    assessmentService.getAttendanceClasses(selectedSemesterId).then((result) => {
      if (cancelled) return
      if (!result.success) {
        setClasses([])
        setError(result.error)
        return
      }
      setClasses(result.data)
      setClassId((current) => result.data.some((item) => String(item.id) === current) ? current : String(result.data[0]?.id || ''))
    })
    return () => { cancelled = true }
  }, [selectedSemesterId])

  useEffect(() => {
    if (!classId || !selectedSemesterId) return undefined
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError('')
      const result = await assessmentService.getAttendanceEntries({
        class_id: classId,
        semester_id: selectedSemesterId,
        scope,
        ...(scope === 'subject' && courseId ? { course_assignment_id: courseId } : {}),
        ...(mode === 'per-siswa' ? (studentId ? { student_id: studentId } : {}) : { date }),
      })
      if (cancelled) return
      if (!result.success) {
        setData(null)
        setError(result.error)
      } else {
        setData(result.data)
        setDraftOverrides({})
        setIsDirty(false)
        if (scope === 'subject' && !result.data.courses.some((course) => String(course.id) === courseId)) {
          setCourseId(String(result.data.courses[0]?.id || ''))
        }
        if (mode === 'per-siswa' && !result.data.students.some((student) => String(student.student_id) === studentId)) {
          setStudentId(String(result.data.students[0]?.student_id || ''))
        }
        const semester = result.data.semester
        if (date < semester.start_date || date > semester.end_date) {
          setDate(semester.start_date)
        }
      }
      setIsLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [classId, courseId, date, mode, refresh, scope, selectedSemesterId, studentId])

  const students = usableData?.students || []
  const selectedStudent = students.find((student) => String(student.student_id) === studentId)
  const visibleStudents = mode === 'per-siswa' ? (selectedStudent ? [selectedStudent] : []) : students
  const history = useMemo(() => mode === 'per-siswa'
    ? (usableData?.entries || []).filter((entry) => String(entry.student_id) === studentId)
    : [], [usableData, mode, studentId])

  const updateDraft = (id, field, value) => {
    setDraftOverrides((current) => ({ ...current, [id]: { ...(current[id] || {}), [field]: value } }))
    setIsDirty(true)
  }

  const save = async () => {
    if (!usableData?.can_edit || !isDirty || isSaving || visibleStudents.length === 0) return
    setIsSaving(true)
    const result = await assessmentService.saveAttendanceEntries({
      class_id: Number(classId),
      semester_id: Number(selectedSemesterId),
      scope,
      ...(scope === 'subject' ? { course_assignment_id: Number(courseId) } : {}),
      date,
      items: visibleStudents.map((student) => ({
        student_id: student.student_id,
        status: drafts[student.student_id]?.status || null,
        notes: drafts[student.student_id]?.notes || null,
      })),
    })
    setIsSaving(false)
    if (result.success) {
      onNotify?.(result.message || 'Absensi berhasil disimpan.')
      setRefresh((current) => current + 1)
    } else {
      setError(result.error || 'Gagal menyimpan absensi.')
    }
  }

  return (
    <section className="attendance-live attendance-detail-view">
      <div className="attendance-live-toolbar">
        <label className="attendance-field"><span>Tahun Ajaran</span><select value={selectedYearId} onChange={(event) => setSelectedYearId(event.target.value)}>{availableYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
        <label className="attendance-field"><span>Semester</span><select value={selectedSemesterId} onChange={(event) => setSelectedSemesterId(event.target.value)}>{availableSemesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label>
        <label className="attendance-field"><span>Kelas</span><select value={classId} onChange={(event) => { setClassId(event.target.value); setCourseId(''); setStudentId('') }}><option value="">Pilih kelas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        {mode === 'per-mapel' && <label className="attendance-field"><span>Mata Pelajaran</span><select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">Pilih mapel</option>{(usableData?.courses || []).map((course) => <option key={course.id} value={course.id}>{course.subject_name}</option>)}</select></label>}
        {mode === 'per-siswa' && <label className="attendance-field"><span>Siswa</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">Pilih siswa</option>{students.map((student) => <option key={student.student_id} value={student.student_id}>{student.nis} - {student.name}</option>)}</select></label>}
        <label className="attendance-field"><span>Tanggal</span><input type="date" min={usableData?.semester?.start_date} max={usableData?.semester?.end_date} value={date} onChange={(event) => { setDate(event.target.value); setDraftOverrides({}); setIsDirty(false) }} /></label>
      </div>

      {error && <div className="attendance-live-error" role="alert">{error}</div>}
      {isLoading && <div className="attendance-live-state" role="status">Memuat data absensi...</div>}
      {!isLoading && !classId && <EmptyState className="attendance-empty"><strong>Belum ada kelas untuk semester ini</strong><p>Periksa penugasan mengajar atau wali kelas pada modul Akademik.</p></EmptyState>}
      {!isLoading && usableData && visibleStudents.length === 0 && <EmptyState className="attendance-empty"><strong>Belum ada siswa dalam kelas ini</strong><p>Tambahkan anggota rombel pada modul Akademik.</p></EmptyState>}
      {!isLoading && usableData && visibleStudents.length > 0 && (
        <>
          <div className="attendance-live-context"><strong>{usableData.class.name}</strong><span>{usableData.semester.academic_year} · {usableData.semester.name}</span><small>{mode === 'per-siswa' ? 'Riwayat absensi kelas dan input untuk tanggal yang dipilih.' : mode === 'per-mapel' ? 'Kehadiran berdasarkan penugasan mata pelajaran.' : 'Kehadiran harian siswa dalam kelas.'}</small></div>
          {mode === 'per-siswa' && selectedStudent && <div className="attendance-detail-summary"><span>Sakit: <strong>{selectedStudent.attendance.sick}</strong></span><span>Izin: <strong>{selectedStudent.attendance.permitted}</strong></span><span>Alpa: <strong>{selectedStudent.attendance.absent}</strong></span></div>}
          <div className="attendance-live-table-wrap"><table className="attendance-live-table"><thead><tr><th>NIS</th><th>Nama Siswa</th><th>Status {date}</th><th>Keterangan</th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.student_id}><td>{student.nis || '-'}</td><td><strong>{student.name}</strong></td><td><select aria-label={`Status ${student.name}`} disabled={!usableData.can_edit} value={drafts[student.student_id]?.status || ''} onChange={(event) => updateDraft(student.student_id, 'status', event.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td><td><input aria-label={`Keterangan ${student.name}`} disabled={!usableData.can_edit} maxLength="255" value={drafts[student.student_id]?.notes || ''} onChange={(event) => updateDraft(student.student_id, 'notes', event.target.value)} placeholder="Opsional" /></td></tr>)}</tbody></table></div>
          <div className="attendance-live-actions">
            {mode !== 'per-siswa' && usableData.can_edit && <Button className="attendance-button attendance-button-outline" onClick={() => { setDraftOverrides((current) => Object.fromEntries(visibleStudents.map((student) => [student.student_id, { ...current[student.student_id], status: 'Hadir' }]))); setIsDirty(true) }}>Semua Hadir</Button>}
            {usableData.can_edit ? <Button className="attendance-button attendance-button-primary" disabled={!isDirty || isSaving} onClick={save}>{isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</Button> : <span>Input tersedia untuk wali kelas, guru mapel yang ditugaskan, atau admin.</span>}
          </div>
          {mode === 'per-siswa' && <div className="attendance-detail-history"><h3>Riwayat Kehadiran Kelas</h3>{history.length === 0 ? <p>Belum ada riwayat kehadiran harian.</p> : <div className="attendance-live-table-wrap"><table className="attendance-live-table"><thead><tr><th>Tanggal</th><th>Status</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody>{history.map((entry) => <tr key={entry.id}><td>{entry.attendance_date}</td><td>{entry.status}</td><td>{entry.notes || '-'}</td><td><Button className="attendance-button attendance-button-outline" onClick={() => { setDate(entry.attendance_date); setDraftOverrides({}); setIsDirty(false) }}>Edit</Button></td></tr>)}</tbody></table></div>}</div>}
        </>
      )}
    </section>
  )
}

export default AttendanceDetailView
