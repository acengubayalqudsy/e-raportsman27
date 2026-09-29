import { useEffect, useMemo, useState } from 'react'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import assessmentService from '../../services/assessmentService.js'
import academicService from '../../services/academicService.js'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import AttendanceSummary from './AttendanceSummary.jsx'

const statusOptions = [
  { value: '', label: 'Pilih status' },
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
  const { allSemesters, availableYears } = useAcademicContext()
  const { hasRole } = useAuth()
  const isAdmin = Boolean(hasRole && hasRole('admin'))

  const [context, setContext] = useState(null)
  const [allClasses, setAllClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(localDate)

  const [data, setData] = useState(null)
  const [draftOverrides, setDraftOverrides] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [isContextLoading, setIsContextLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  const scope = mode === 'per-mapel' ? 'subject' : 'class'

  // 1. Load context and classes strictly reflecting Master Data and Admin assignments
  useEffect(() => {
    let isMounted = true
    async function loadInitialContext() {
      setIsContextLoading(true)
      setError('')
      try {
        const [ctxRes, classesRes] = await Promise.all([
          assessmentService.getContext(),
          isAdmin ? academicService.getClasses({ per_page: 100 }) : Promise.resolve(null),
        ])

        if (!isMounted) return

        if (classesRes?.success && Array.isArray(classesRes.data)) {
          setAllClasses(classesRes.data)
        }

        if (!ctxRes.success || !ctxRes.data) {
          setError(ctxRes.error || 'Gagal memuat konteks akademik.')
          setIsContextLoading(false)
          return
        }

        const nextContext = ctxRes.data
        setContext(nextContext)

        const homeroomList = Array.isArray(nextContext.homeroom_classes) && nextContext.homeroom_classes.length > 0
          ? nextContext.homeroom_classes
          : (nextContext.homeroom_class ? [nextContext.homeroom_class] : [])

        const initialClassId = String(
          homeroomList[0]?.class_id
          || homeroomList[0]?.id
          || nextContext.assigned_courses?.[0]?.class_id
          || (isAdmin ? classesRes?.data?.[0]?.id : '')
          || ''
        )

        setSelectedClassId(initialClassId)

        const initialClassObj = homeroomList.find((c) => String(c.class_id || c.id) === initialClassId)
          || nextContext.assigned_courses?.find((c) => String(c.class_id) === initialClassId)
          || (isAdmin ? classesRes?.data?.find((c) => String(c.id) === initialClassId) : null)

        const initialYearId = String(
          initialClassObj?.academic_year_id
          || nextContext.active_academic_year?.id
          || ''
        )
        setSelectedYearId(initialYearId)

        const initialSemId = String(
          initialClassObj?.semester_id
          || nextContext.active_semester?.id
          || ''
        )
        setSelectedSemesterId(initialSemId)

        if (!initialClassId) {
          setError('Belum ada kelas yang ditugaskan oleh Administrator untuk akun ini.')
        }
      } catch {
        if (isMounted) {
          setError('Terjadi kendala saat memuat data konteks akademik.')
        }
      } finally {
        if (isMounted) setIsContextLoading(false)
      }
    }

    loadInitialContext()
    return () => { isMounted = false }
  }, [isAdmin])

  // 2. Class Options
  const classOptions = useMemo(() => {
    const map = new Map()

    if (Array.isArray(context?.homeroom_classes) && context.homeroom_classes.length > 0) {
      context.homeroom_classes.forEach((cls) => {
        const id = String(cls.class_id || cls.id)
        if (id) {
          map.set(id, {
            id,
            name: cls.class_name || cls.name,
            academic_year_id: cls.academic_year_id,
            academic_year_name: cls.academic_year_name,
            semester_id: cls.semester_id,
            semester_name: cls.semester_name,
          })
        }
      })
    } else if (context?.homeroom_class) {
      const cls = context.homeroom_class
      const id = String(cls.class_id || cls.id)
      if (id) {
        map.set(id, {
          id,
          name: cls.class_name || cls.name,
          academic_year_id: cls.academic_year_id,
          academic_year_name: cls.academic_year_name,
          semester_id: cls.semester_id,
          semester_name: cls.semester_name,
        })
      }
    }

    if (Array.isArray(context?.assigned_courses)) {
      context.assigned_courses.forEach((course) => {
        const id = String(course.class_id)
        if (id && !map.has(id)) {
          map.set(id, {
            id,
            name: course.class_name,
            academic_year_id: course.academic_year_id,
            semester_id: course.semester_id,
          })
        }
      })
    }

    if (isAdmin && Array.isArray(allClasses)) {
      allClasses.forEach((cls) => {
        const id = String(cls.id)
        if (!map.has(id)) {
          map.set(id, {
            id,
            name: cls.name,
            academic_year_id: cls.academic_year_id,
            academic_year_name: cls.academic_year?.name,
          })
        }
      })
    }

    return Array.from(map.values())
  }, [context, isAdmin, allClasses])

  const selectedClass = classOptions.find((c) => String(c.id) === String(selectedClassId)) || classOptions[0] || null

  // 3. Cascaded Semesters for selected class's year
  const matchingSemesters = useMemo(() => {
    const targetYearId = selectedYearId || String(selectedClass?.academic_year_id || '')
    if (!targetYearId) return allSemesters || []
    return (allSemesters || []).filter((s) => String(s.academic_year_id) === String(targetYearId))
  }, [allSemesters, selectedYearId, selectedClass])

  const effectiveSemesterId = selectedSemesterId
    || String(selectedClass?.semester_id || matchingSemesters.find((s) => s.status === 'Aktif')?.id || matchingSemesters[0]?.id || '')

  const handleClassChange = (newClassId) => {
    setSelectedClassId(newClassId)
    setCourseId('')
    setStudentId('')
    const cls = classOptions.find((c) => String(c.id) === String(newClassId))
    if (cls) {
      const nextYearId = String(cls.academic_year_id || selectedYearId)
      setSelectedYearId(nextYearId)

      const sems = (allSemesters || []).filter((s) => String(s.academic_year_id) === nextYearId)
      const nextSemId = String(
        cls.semester_id
        || sems.find((s) => s.status === 'Aktif')?.id
        || sems[0]?.id
        || ''
      )
      if (nextSemId) setSelectedSemesterId(nextSemId)
    }
  }

  const handleYearChange = (newYearId) => {
    setSelectedYearId(newYearId)
    const sems = (allSemesters || []).filter((s) => String(s.academic_year_id) === String(newYearId))
    const nextSemId = String(sems.find((s) => s.status === 'Aktif')?.id || sems[0]?.id || '')
    if (nextSemId) setSelectedSemesterId(nextSemId)
  }

  // 4. Fetch Attendance Entries
  useEffect(() => {
    if (!selectedClassId || !effectiveSemesterId) return undefined
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError('')
      const result = await assessmentService.getAttendanceEntries({
        class_id: selectedClassId,
        semester_id: effectiveSemesterId,
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
        if (semester?.start_date && semester?.end_date) {
          if (date < semester.start_date || date > semester.end_date) {
            setDate(semester.start_date)
          }
        }
      }
      setIsLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [selectedClassId, effectiveSemesterId, courseId, date, mode, refresh, scope, studentId])

  const usableData = data?.class?.id === Number(selectedClassId) && data?.semester?.id === Number(effectiveSemesterId) ? data : null
  const students = useMemo(() => usableData?.students || [], [usableData])
  const selectedStudent = useMemo(() => students.find((student) => String(student.student_id) === studentId), [students, studentId])
  const visibleStudents = useMemo(() => {
    return mode === 'per-siswa' ? (selectedStudent ? [selectedStudent] : []) : students
  }, [mode, selectedStudent, students])

  const drafts = useMemo(() => {
    if (!usableData) return {}
    const dateEntries = new Map(
      usableData.entries
        .filter((entry) => entry.attendance_date === date)
        .map((entry) => [String(entry.student_id), entry])
    )
    return Object.fromEntries(
      usableData.students.map((student) => {
        const entry = dateEntries.get(String(student.student_id))
        return [
          student.student_id,
          {
            status: entry?.status || '',
            notes: entry?.notes || '',
            ...draftOverrides[student.student_id],
          },
        ]
      })
    )
  }, [date, draftOverrides, usableData])

  const history = useMemo(() => (
    mode === 'per-siswa'
      ? (usableData?.entries || []).filter((entry) => String(entry.student_id) === studentId)
      : []
  ), [usableData, mode, studentId])

  const updateDraft = (id, field, value) => {
    setDraftOverrides((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), [field]: value },
    }))
    setIsDirty(true)
  }

  const save = async () => {
    if (!usableData?.can_edit || !isDirty || isSaving || visibleStudents.length === 0) return
    setIsSaving(true)
    const result = await assessmentService.saveAttendanceEntries({
      class_id: Number(selectedClassId),
      semester_id: Number(effectiveSemesterId),
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

  // 5. Summary items for tabs
  const summaryItems = useMemo(() => {
    if (mode === 'per-siswa' && selectedStudent) {
      return [
        {
          title: 'Siswa Dipilih',
          value: selectedStudent.name,
          caption: `NIS ${selectedStudent.nis || '-'}`,
          icon: 'users',
          tone: 'green',
          captionIcon: 'users',
        },
        {
          title: 'Total Sakit',
          value: String(selectedStudent.attendance?.sick ?? 0),
          caption: 'Akumulasi sakit semester ini',
          icon: 'activityLog',
          tone: 'orange',
          captionIcon: 'users',
        },
        {
          title: 'Total Izin',
          value: String(selectedStudent.attendance?.permitted ?? 0),
          caption: 'Akumulasi izin semester ini',
          icon: 'document',
          tone: 'purple',
          captionIcon: 'download',
        },
        {
          title: 'Total Alpa',
          value: String(selectedStudent.attendance?.absent ?? 0),
          caption: 'Tanpa keterangan semester ini',
          icon: 'screen',
          tone: 'teal',
          captionIcon: 'info',
        },
      ]
    }

    const total = visibleStudents.length
    const hadirCount = visibleStudents.filter((s) => (drafts[s.student_id]?.status === 'Hadir')).length
    const sakitCount = visibleStudents.filter((s) => (drafts[s.student_id]?.status === 'Sakit')).length
    const izinCount = visibleStudents.filter((s) => (drafts[s.student_id]?.status === 'Izin')).length
    const alpaCount = visibleStudents.filter((s) => (drafts[s.student_id]?.status === 'Alpa')).length

    return [
      {
        title: 'Total Siswa',
        value: String(total),
        caption: selectedClass?.name || 'Konteks kelas',
        icon: 'users',
        tone: 'green',
        captionIcon: 'users',
      },
      {
        title: 'Hadir Hari Ini',
        value: String(hadirCount),
        caption: `${total ? Math.round((hadirCount / total) * 100) : 0}% kehadiran`,
        icon: 'clipboard',
        tone: 'blue',
        captionIcon: 'arrowUp',
      },
      {
        title: 'Sakit',
        value: String(sakitCount),
        caption: 'Status sakit tanggal ini',
        icon: 'activityLog',
        tone: 'orange',
        captionIcon: 'users',
      },
      {
        title: 'Izin',
        value: String(izinCount),
        caption: 'Status izin tanggal ini',
        icon: 'document',
        tone: 'purple',
        captionIcon: 'download',
      },
      {
        title: 'Alpa',
        value: String(alpaCount),
        caption: 'Tanpa keterangan tanggal ini',
        icon: 'screen',
        tone: 'teal',
        captionIcon: 'info',
      },
    ]
  }, [mode, selectedStudent, visibleStudents, drafts, selectedClass])

  if (isContextLoading) {
    return (
      <div className="attendance-skeleton-container" role="status" aria-label="Memuat konteks absensi">
        <div className="attendance-skeleton-card">
          <div className="attendance-skeleton-header">
            <div className="attendance-skeleton-spinner" />
            <span className="attendance-skeleton-text">Memuat konteks absensi...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="attendance-live attendance-detail-view" aria-label="Absensi terintegrasi">
      {/* 1. Summary Cards */}
      <AttendanceSummary items={summaryItems} />

      {/* 2. Filter Card */}
      <div className="attendance-filter-card">
        <div className="attendance-filter-grid">
          <label className="attendance-field">
            <span>Kelas</span>
            <select
              disabled={classOptions.length === 0}
              onChange={(event) => handleClassChange(event.target.value)}
              value={selectedClassId}
            >
              {classOptions.length === 0 && <option value="">Belum ada kelas ditugaskan</option>}
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </label>

          <label className="attendance-field">
            <span>Semester</span>
            <select
              disabled={matchingSemesters.length === 0}
              onChange={(event) => setSelectedSemesterId(event.target.value)}
              value={effectiveSemesterId}
            >
              {matchingSemesters.map((semester) => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </label>

          <label className="attendance-field">
            <span>Tahun Ajaran</span>
            <select
              onChange={(event) => handleYearChange(event.target.value)}
              value={selectedYearId || selectedClass?.academic_year_id || ''}
            >
              {availableYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </label>

          <label className="attendance-field">
            <span>Tanggal</span>
            <input
              max={usableData?.semester?.end_date}
              min={usableData?.semester?.start_date}
              onChange={(event) => {
                setDate(event.target.value)
                setDraftOverrides({})
                setIsDirty(false)
              }}
              type="date"
              value={date}
            />
          </label>

          {mode === 'per-mapel' && (
            <label className="attendance-field">
              <span>Mata Pelajaran</span>
              <select
                onChange={(event) => setCourseId(event.target.value)}
                value={courseId}
              >
                <option value="">Pilih mapel</option>
                {(usableData?.courses || []).map((course) => (
                  <option key={course.id} value={course.id}>{course.subject_name}</option>
                ))}
              </select>
            </label>
          )}

          {mode === 'per-siswa' && (
            <label className="attendance-field">
              <span>Pilih Siswa</span>
              <select
                onChange={(event) => setStudentId(event.target.value)}
                value={studentId}
              >
                <option value="">Pilih siswa</option>
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.nis} - {student.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      {error && <div className="attendance-live-error" role="alert">{error}</div>}
      {isLoading && <div className="attendance-live-state" role="status">Memuat data absensi...</div>}

      {!isLoading && !selectedClassId && (
        <EmptyState className="attendance-empty">
          <strong>Belum ada kelas yang ditugaskan</strong>
          <p>Hubungi administrator untuk mengatur penugasan wali kelas pada modul Master Data.</p>
        </EmptyState>
      )}

      {!isLoading && usableData && visibleStudents.length === 0 && (
        <EmptyState className="attendance-empty">
          <strong>Belum ada siswa dalam kelas ini</strong>
          <p>Pastikan anggota rombel kelas {selectedClass?.name} telah didaftarkan di Master Data.</p>
        </EmptyState>
      )}

      {!isLoading && usableData && visibleStudents.length > 0 && (
        <div className="attendance-table-card">
          <div className="attendance-live-context">
            <div className="attendance-context-title">
              <Icon name="building" />
              <strong>{usableData.class.name}</strong>
              <span className="attendance-badge-soft">{usableData.semester.academic_year} &bull; {usableData.semester.name}</span>
            </div>
            <small>
              {mode === 'per-siswa'
                ? `Riwayat kehadiran kelas dan input tanggal ${date} untuk siswa terpilih.`
                : mode === 'per-mapel'
                  ? `Kehadiran mapel tanggal ${date}. Terintegrasi dengan jadwal dan jurnal mengajar.`
                  : `Kehadiran harian seluruh siswa kelas tanggal ${date}.`}
            </small>
          </div>

          <div className="attendance-live-table-wrap">
            <table className="attendance-live-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                  <th className="sticky-col">Siswa</th>
                  <th style={{ width: '180px' }}>Status ({date})</th>
                  <th style={{ minWidth: '220px' }}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student, idx) => {
                  const currentStatus = drafts[student.student_id]?.status || ''
                  return (
                    <tr key={student.student_id}>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td className="sticky-col">
                        <div className="attendance-student-meta">
                          <strong>{student.name}</strong>
                          <small>NIS {student.nis || '-'} &bull; NISN {student.nisn || '-'}</small>
                        </div>
                      </td>
                      <td>
                        <select
                          aria-label={`Status ${student.name}`}
                          className={`attendance-status-select status-${currentStatus.toLowerCase() || 'none'}`}
                          disabled={!usableData.can_edit}
                          onChange={(event) => updateDraft(student.student_id, 'status', event.target.value)}
                          value={currentStatus}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label={`Keterangan ${student.name}`}
                          className="attendance-text-input"
                          disabled={!usableData.can_edit}
                          maxLength="255"
                          onChange={(event) => updateDraft(student.student_id, 'notes', event.target.value)}
                          placeholder="Catatan kehadiran (opsional)..."
                          value={drafts[student.student_id]?.notes || ''}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="attendance-live-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {mode !== 'per-siswa' && usableData.can_edit && (
                <Button
                  className="attendance-button attendance-button-outline"
                  onClick={() => {
                    setDraftOverrides(
                      Object.fromEntries(
                        visibleStudents.map((student) => [student.student_id, { ...drafts[student.student_id], status: 'Hadir' }])
                      )
                    )
                    setIsDirty(true)
                  }}
                >
                  <Icon name="checkCircle" />
                  Semua Hadir
                </Button>
              )}
            </div>
            <div>
              {usableData.can_edit ? (
                <Button
                  className="attendance-button attendance-button-primary"
                  disabled={!isDirty || isSaving}
                  onClick={save}
                >
                  <Icon name="check" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
                </Button>
              ) : (
                <span className="attendance-readonly-note">
                  <Icon name="info" />
                  Input tersedia untuk wali kelas, guru mapel yang ditugaskan, atau admin.
                </span>
              )}
            </div>
          </div>

          {/* Riwayat Kehadiran (Khusus Per Siswa) */}
          {mode === 'per-siswa' && (
            <div className="attendance-detail-history" style={{ marginTop: '24px' }}>
              <div className="attendance-history-header">
                <Icon name="calendar" />
                <h3>Riwayat Kehadiran Semester Ini</h3>
              </div>
              {history.length === 0 ? (
                <p className="attendance-history-empty">Belum ada riwayat kehadiran harian yang tersimpan untuk siswa ini.</p>
              ) : (
                <div className="attendance-live-table-wrap">
                  <table className="attendance-live-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Keterangan</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry, idx) => (
                        <tr key={entry.id}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td><strong>{entry.attendance_date}</strong></td>
                          <td>
                            <span className={`attendance-badge-status status-${(entry.status || '').toLowerCase()}`}>
                              {entry.status || '-'}
                            </span>
                          </td>
                          <td>{entry.notes || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Button
                              className="attendance-button attendance-button-secondary attendance-button-sm"
                              onClick={() => {
                                setDate(entry.attendance_date)
                                setDraftOverrides({})
                                setIsDirty(false)
                              }}
                            >
                              <Icon name="edit" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default AttendanceDetailView
