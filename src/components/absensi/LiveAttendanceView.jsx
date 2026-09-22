import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import assessmentService from '../../services/assessmentService.js'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Icon from '../common/Icon.jsx'

const initialRows = []

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

function uniqueClasses(context) {
  const candidates = [
    context?.homeroom_class,
    ...(Array.isArray(context?.assigned_courses) ? context.assigned_courses : []),
  ]
  const seen = new Set()

  return candidates.reduce((classes, item) => {
    if (!item?.class_id || seen.has(String(item.class_id))) return classes
    seen.add(String(item.class_id))
    classes.push({ id: item.class_id, name: item.class_name || `Kelas ${item.class_id}` })
    return classes
  }, [])
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
  const {
    availableYears,
    availableSemesters,
    selectedSemesterId,
    selectedYearId,
    selectedSemester,
    selectedYear,
    setSelectedSemesterId,
    setSelectedYearId,
  } = useAcademicContext()
  const [context, setContext] = useState(null)
  const [classId, setClassId] = useState('')
  const [rows, setRows] = useState(initialRows)
  const [isContextLoading, setIsContextLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const classes = useMemo(() => uniqueClasses(context), [context])

  const loadContext = useCallback(async () => {
    setIsContextLoading(true)
    const result = await assessmentService.getContext()
    if (!result.success) {
      setError(getErrorMessage(result, 'Gagal memuat konteks akademik.'))
      setContext(null)
    } else {
      setContext(result.data)
      const authorizedClasses = uniqueClasses(result.data)
      if (authorizedClasses[0]) setClassId(String(authorizedClasses[0].id))
      setError('')
    }
    setIsContextLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadContext(), 0)
    return () => window.clearTimeout(timer)
  }, [loadContext])

  useEffect(() => {
    if (!classId || !selectedSemesterId) return undefined

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      assessmentService.getSupplementaryData(classId, selectedSemesterId).then((result) => {
        if (cancelled) return
        if (!result.success) {
          setRows([])
          setError(getErrorMessage(result, 'Gagal memuat data absensi.'))
        } else {
          setRows(normalizeRows(result.data?.students))
        }
        setIsLoading(false)
      })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [classId, selectedSemesterId])

  const visibleRows = classId && selectedSemesterId ? rows : []

  const updateRow = (studentId, field, value) => {
    setRows((currentRows) => currentRows.map((row) => (
      row.student_id === studentId
        ? { ...row, attendance: { ...row.attendance, [field]: value } }
        : row
    )))
  }

  const save = async () => {
    setIsSaving(true)
    setError('')
    const result = await assessmentService.saveAttendance(
      classId,
      selectedSemesterId,
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
      const refreshed = await assessmentService.getSupplementaryData(classId, selectedSemesterId)
      if (refreshed.success) {
        setRows(normalizeRows(refreshed.data?.students))
        onNotify(result.message)
      } else {
        setError(getErrorMessage(refreshed, 'Data tersimpan, tetapi gagal memuat ulang data.'))
      }
    }
    setIsSaving(false)
  }

  if (isContextLoading) {
    return <div className="attendance-live-state" role="status">Memuat konteks absensi...</div>
  }

  return (
    <section className="attendance-live" aria-label="Absensi terintegrasi">
      <div className="attendance-live-toolbar">
        <label className="attendance-field">
          <span>Tahun Ajaran</span>
          <select onChange={(event) => setSelectedYearId(event.target.value)} value={selectedYearId}>
            {!selectedYear && <option value="">Pilih tahun ajaran</option>}
            {availableYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </label>
        <label className="attendance-field">
          <span>Semester</span>
          <select onChange={(event) => setSelectedSemesterId(event.target.value)} value={selectedSemesterId}>
            {!selectedSemester && <option value="">Pilih semester</option>}
            {availableSemesters.map((semester) => (
              <option key={semester.id} value={semester.id}>{semester.name}</option>
            ))}
          </select>
        </label>
        <label className="attendance-field">
          <span>Kelas</span>
          <select disabled={classes.length === 0} onChange={(event) => setClassId(event.target.value)} value={classId}>
            {classes.length === 0 && <option value="">Tidak ada kelas terotorisasi</option>}
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="attendance-live-error" role="alert">{error}</div>}
      {isLoading && <div className="attendance-live-state" role="status">Memuat data absensi...</div>}
      {!isLoading && !error && visibleRows.length === 0 && (
        <EmptyState className="attendance-empty">
          <span className="attendance-empty-icon"><Icon name="clipboard" /></span>
          <strong>Belum ada siswa pada konteks ini</strong>
          <p>Pastikan kelas, semester, dan keanggotaan siswa sudah tersedia.</p>
        </EmptyState>
      )}
      {!isLoading && visibleRows.length > 0 && (
        <>
          <div className="attendance-live-context">
            <strong>{context?.homeroom_class?.class_name || visibleRows.length + ' siswa'}</strong>
            <span>{selectedYear?.name || '-'} · {selectedSemester?.name || '-'}</span>
            <small>Backend menyimpan rekap semester; data harian dan persentase belum tersedia pada schema saat ini.</small>
          </div>
          <div className="attendance-live-table-wrap">
            <table className="attendance-live-table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Sakit</th>
                  <th>Izin</th>
                  <th>Alpa</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.student_id}>
                    <td>
                      <strong>{row.name}</strong>
                      <small>{row.nis || row.nisn || '-'}</small>
                    </td>
                    {['sick', 'permitted', 'absent'].map((field) => (
                      <td key={field}>
                        <input
                          aria-label={`${field} ${row.name}`}
                          min="0"
                          onChange={(event) => updateRow(row.student_id, field, event.target.value)}
                          type="number"
                          value={row.attendance[field]}
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        aria-label={`Catatan ${row.name}`}
                        maxLength="255"
                        onChange={(event) => updateRow(row.student_id, 'notes', event.target.value)}
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
            <Button className="attendance-button attendance-button-primary" disabled={isSaving} onClick={save}>
              {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

export default LiveAttendanceView
