import { useEffect, useMemo, useRef, useState } from 'react'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import assessmentService from '../../services/assessmentService.js'
import academicService from '../../services/academicService.js'
import excelService from '../../services/excelService.js'
import { MasterImportModal } from '../master-data/MasterModals.jsx'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'
import AttendanceSummary from './AttendanceSummary.jsx'

function normalizeRows(students) {
  return (Array.isArray(students) ? students : []).map((student) => ({
    ...student,
    attendance: {
      sick: Number(student.attendance?.sick ?? 0),
      permitted: Number(student.attendance?.permitted ?? 0),
      absent: Number(student.attendance?.absent ?? 0),
      notes: student.attendance?.notes ?? '',
      is_recorded: Boolean(student.attendance?.is_recorded),
    },
  }))
}

function getErrorMessage(result, fallback) {
  if (result.status === 401) return 'Sesi Anda berakhir. Silakan masuk kembali.'
  if (result.status === 403) return 'Anda tidak memiliki akses ke kelas atau semester ini.'
  if (result.status === 404) return 'Konteks kelas atau semester tidak ditemukan.'
  if (result.status === 422) return result.error || 'Data absensi tidak valid.'
  if (result.status >= 500) return 'Terjadi gangguan pada server. Silakan coba lagi.'
  return result.error || fallback
}

function LiveAttendanceView({ onNotify = () => {} }) {
  const { allSemesters, availableYears } = useAcademicContext()
  const { hasRole } = useAuth()
  const isAdmin = Boolean(hasRole && hasRole('admin'))

  const [context, setContext] = useState(null)
  const [allClasses, setAllClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')

  const [rows, setRows] = useState([])
  const [isContextLoading, setIsContextLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [error, setError] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // 1. Load authoritative context and classes
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

  // 2. Build class options strictly reflecting Master Data & Admin assignments
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

  const attReqIdRef = useRef(0)

  const selectedClass = classOptions.find((c) => String(c.id) === String(selectedClassId)) || null

  // 3. Filtered semesters matching selected class's academic year
  const matchingSemesters = useMemo(() => {
    const targetYearId = selectedYearId || String(selectedClass?.academic_year_id || '')
    if (!targetYearId) return allSemesters || []
    return (allSemesters || []).filter((s) => String(s.academic_year_id) === String(targetYearId))
  }, [allSemesters, selectedYearId, selectedClass])

  const effectiveSemesterId = selectedSemesterId
    || String(selectedClass?.semester_id || matchingSemesters.find((s) => s.status === 'Aktif')?.id || matchingSemesters[0]?.id || '')

  const selectedSemesterObj = (allSemesters || []).find((s) => String(s.id) === String(effectiveSemesterId))
  const selectedYearObj = (availableYears || []).find((y) => String(y.id) === String(selectedYearId || selectedClass?.academic_year_id))

  // 4. Handle class change: auto-cascade year and semester with immediate clear
  const handleClassChange = (newClassId) => {
    setRows([])
    setCanEdit(false)
    setSelectedClassId(newClassId)
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
    setRows([])
    setCanEdit(false)
    setSelectedYearId(newYearId)
    const sems = (allSemesters || []).filter((s) => String(s.academic_year_id) === String(newYearId))
    const nextSemId = String(sems.find((s) => s.status === 'Aktif')?.id || sems[0]?.id || '')
    setSelectedSemesterId(nextSemId)
    const validClasses = classOptions.filter((c) => !c.academic_year_id || String(c.academic_year_id) === String(newYearId))
    if (!validClasses.some((c) => String(c.id) === String(selectedClassId))) {
      setSelectedClassId(validClasses[0]?.id || '')
    }
  }

  const handleSemesterChange = (newSemId) => {
    setRows([])
    setCanEdit(false)
    setSelectedSemesterId(newSemId)
  }

  // 5. Load attendance entries for the selected class and semester with race guard
  useEffect(() => {
    if (!selectedClassId || !effectiveSemesterId) {
      return undefined
    }

    const reqId = ++attReqIdRef.current
    let cancelled = false

    const timer = window.setTimeout(() => {
      setRows([])
      setCanEdit(false)
      setIsLoading(true)
      setError('')

      assessmentService.getAttendanceEntries({
        class_id: selectedClassId,
        semester_id: effectiveSemesterId,
        scope: 'class',
        date: new Date().toISOString().slice(0, 10),
      }).then((result) => {
        if (cancelled || reqId !== attReqIdRef.current) return
        if (!result.success) {
          setRows([])
          setCanEdit(false)
          setError(getErrorMessage(result, 'Gagal memuat data absensi.'))
        } else {
          setRows(normalizeRows(result.data?.students))
          setCanEdit(Boolean(result.data?.can_edit))
        }
        setIsLoading(false)
      }).catch((err) => {
        if (cancelled || reqId !== attReqIdRef.current) return
        setRows([])
        setCanEdit(false)
        setError(err?.message || 'Gagal memuat data absensi.')
        setIsLoading(false)
      })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [selectedClassId, effectiveSemesterId, refreshKey])

  const visibleRows = useMemo(() => {
    return selectedClassId && effectiveSemesterId ? rows : []
  }, [selectedClassId, effectiveSemesterId, rows])

  const updateRow = (studentId, field, value) => {
    setRows((currentRows) => currentRows.map((row) => (
      row.student_id === studentId
        ? { ...row, attendance: { ...row.attendance, [field]: value } }
        : row
    )))
  }

  const save = async () => {
    if (!canEdit || isSaving || rows.length === 0) return
    setIsSaving(true)
    setError('')
    const result = await assessmentService.saveAttendance(
      selectedClassId,
      effectiveSemesterId,
      rows.map((row) => ({
        student_id: row.student_id,
        sick: Number(row.attendance.sick) || 0,
        permitted: Number(row.attendance.permitted) || 0,
        absent: Number(row.attendance.absent) || 0,
        notes: row.attendance.notes || null,
      })),
    )

    if (!result.success) {
      setError(getErrorMessage(result, 'Gagal menyimpan data absensi.'))
    } else {
      const refreshed = await assessmentService.getAttendanceEntries({
        class_id: selectedClassId,
        semester_id: effectiveSemesterId,
        scope: 'class',
        date: new Date().toISOString().slice(0, 10),
      })
      if (refreshed.success) {
        setRows(normalizeRows(refreshed.data?.students))
        onNotify(result.message || 'Rekap absensi berhasil disimpan.')
      } else {
        setError(getErrorMessage(refreshed, 'Data tersimpan, tetapi gagal memuat ulang data.'))
      }
    }
    setIsSaving(false)
  }

  // 6. Summary cards computation matching Gambar 1 style
  const summaryItems = useMemo(() => {
    const total = visibleRows.length
    const totalSick = visibleRows.reduce((acc, r) => acc + (Number(r.attendance?.sick) || 0), 0)
    const totalPermitted = visibleRows.reduce((acc, r) => acc + (Number(r.attendance?.permitted) || 0), 0)
    const totalAbsent = visibleRows.reduce((acc, r) => acc + (Number(r.attendance?.absent) || 0), 0)
    const recordedCount = visibleRows.filter((r) => (
      r.attendance?.is_recorded
      || r.attendance?.sick > 0
      || r.attendance?.permitted > 0
      || r.attendance?.absent > 0
      || r.attendance?.notes
    )).length

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
        title: 'Terdata',
        value: String(recordedCount),
        caption: `${total ? Math.round((recordedCount / total) * 100) : 0}% terekam di sistem`,
        icon: 'clipboard',
        tone: 'blue',
        captionIcon: 'arrowUp',
      },
      {
        title: 'Sakit',
        value: String(totalSick),
        caption: 'Total akumulasi sakit',
        icon: 'activityLog',
        tone: 'orange',
        captionIcon: 'users',
      },
      {
        title: 'Izin',
        value: String(totalPermitted),
        caption: 'Total akumulasi izin',
        icon: 'document',
        tone: 'purple',
        captionIcon: 'download',
      },
      {
        title: 'Alpa',
        value: String(totalAbsent),
        caption: 'Total tanpa keterangan',
        icon: 'screen',
        tone: 'teal',
        captionIcon: 'info',
      },
    ]
  }, [visibleRows, selectedClass])

  if (isContextLoading) {
    return (
      <div className="attendance-skeleton-container" role="status" aria-label="Memuat konteks absensi">
        <div className="attendance-skeleton-card">
          <div className="attendance-skeleton-header">
            <div className="attendance-skeleton-spinner" />
            <span className="attendance-skeleton-text">Memuat konteks absensi...</span>
          </div>
          <div className="attendance-skeleton-grid">
            <div className="attendance-skeleton-box skeleton-pulse" />
            <div className="attendance-skeleton-box skeleton-pulse" />
            <div className="attendance-skeleton-box skeleton-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="attendance-live" aria-label="Absensi terintegrasi">
      {/* 1. Summary Cards (Stat Cards) matching Gambar 1 */}
      <AttendanceSummary items={summaryItems} />

      {/* 2. Filter Grid Toolbar matching Gambar 1 */}
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
              onChange={(event) => handleSemesterChange(event.target.value)}
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

          <div className="attendance-actions-toolbar">
            <span>Aksi Dokumen</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {canEdit && (
                <Button
                  className="attendance-button attendance-button-secondary"
                  disabled={!selectedClassId}
                  onClick={() => setShowImport(true)}
                >
                  <Icon name="cloudUpload" />
                  Import Excel
                </Button>
              )}
              <Button
                className="attendance-button attendance-button-secondary"
                disabled={!selectedClassId}
                onClick={() => excelService.download('attendance', 'export', {
                  class_id: selectedClassId,
                  semester_id: effectiveSemesterId,
                }).catch((cause) => setError(cause.message))}
              >
                <Icon name="download" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showImport && selectedClassId && (
        <MasterImportModal
          context={{ class_id: selectedClassId, semester_id: effectiveSemesterId }}
          entityLabel="Absensi Harian Kelas"
          module="attendance"
          onClose={() => setShowImport(false)}
          onComplete={(count) => {
            setShowImport(false)
            setRefreshKey((key) => key + 1)
            onNotify(`${count} data absensi berhasil diimport.`)
          }}
        />
      )}

      {error && <div className="attendance-live-error" role="alert">{error}</div>}
      {isLoading && <div className="attendance-live-state" role="status">Memuat data absensi dari server...</div>}

      {!isLoading && !error && visibleRows.length === 0 && (
        <EmptyState className="attendance-empty">
          <span className="attendance-empty-icon"><Icon name="clipboard" /></span>
          <strong>Belum ada siswa pada konteks ini</strong>
          <p>Pastikan data anggota rombel kelas {selectedClass?.name || ''} sudah diinput Admin di Master Data.</p>
        </EmptyState>
      )}

      {!isLoading && visibleRows.length > 0 && (
        <div className="attendance-table-card">
          <div className="attendance-live-context">
            <div className="attendance-context-title">
              <Icon name="building" />
              <strong>{selectedClass?.name || 'Kelas'}</strong>
              <span className="attendance-badge-soft">{selectedYearObj?.name || '-'} · {selectedSemesterObj?.name || '-'}</span>
            </div>
            <small>Rekap semester ini terintegrasi ke modul rapor. Perubahan sakit, izin, dan alpa akan tersimpan secara permanen.</small>
          </div>

          <div className="attendance-live-table-wrap">
            <table className="attendance-live-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                  <th className="sticky-col">Siswa</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Sakit</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Izin</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Alpa</th>
                  <th style={{ minWidth: '220px' }}>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, idx) => (
                  <tr key={row.student_id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td className="sticky-col">
                      <div className="attendance-student-meta">
                        <strong>{row.name}</strong>
                        <small>NIS {row.nis || '-'} &bull; NISN {row.nisn || '-'}</small>
                      </div>
                    </td>
                    <td>
                      <input
                        aria-label={`Sakit ${row.name}`}
                        className="attendance-num-input input-sick"
                        disabled={!canEdit || isSaving}
                        min="0"
                        onChange={(event) => updateRow(row.student_id, 'sick', event.target.value)}
                        type="number"
                        value={row.attendance.sick}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Izin ${row.name}`}
                        className="attendance-num-input input-permitted"
                        disabled={!canEdit || isSaving}
                        min="0"
                        onChange={(event) => updateRow(row.student_id, 'permitted', event.target.value)}
                        type="number"
                        value={row.attendance.permitted}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Alpa ${row.name}`}
                        className="attendance-num-input input-absent"
                        disabled={!canEdit || isSaving}
                        min="0"
                        onChange={(event) => updateRow(row.student_id, 'absent', event.target.value)}
                        type="number"
                        value={row.attendance.absent}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Catatan ${row.name}`}
                        className="attendance-text-input"
                        disabled={!canEdit || isSaving}
                        maxLength="255"
                        onChange={(event) => updateRow(row.student_id, 'notes', event.target.value)}
                        placeholder="Catatan wali kelas (opsional)..."
                        type="text"
                        value={row.attendance.notes}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="attendance-live-actions">
            {canEdit ? (
              <Button
                className="attendance-button attendance-button-primary"
                disabled={isSaving}
                onClick={save}
              >
                <Icon name="check" />
                {isSaving ? 'Menyimpan...' : 'Simpan Rekap Absensi'}
              </Button>
            ) : (
              <span className="attendance-readonly-note">
                <Icon name="info" />
                Rekap absensi hanya dapat diubah oleh wali kelas yang ditugaskan atau administrator.
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default LiveAttendanceView
