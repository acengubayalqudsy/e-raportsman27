import { useEffect, useState } from 'react'
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
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [rows, setRows] = useState(initialRows)
  const [isContextLoading, setIsContextLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedSemesterId) return undefined
    let cancelled = false
    assessmentService.getAttendanceClasses(selectedSemesterId).then((result) => {
      if (cancelled) return
      if (!result.success) {
        setClasses([])
        setError(getErrorMessage(result, 'Gagal memuat daftar kelas.'))
      } else {
        setClasses(result.data)
        setClassId((current) => result.data.some((item) => String(item.id) === current) ? current : String(result.data[0]?.id || ''))
        setError('')
      }
      setIsContextLoading(false)
    })
    return () => { cancelled = true }
  }, [selectedSemesterId])

  useEffect(() => {
    if (!classId || !selectedSemesterId) return undefined

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError('')
      assessmentService.getAttendanceEntries({ class_id: classId, semester_id: selectedSemesterId, scope: 'class', date: new Date().toISOString().slice(0, 10) }).then((result) => {
        if (cancelled) return
        if (!result.success) {
          setRows([])
          setCanEdit(false)
          setError(getErrorMessage(result, 'Gagal memuat data absensi.'))
        } else {
          setRows(normalizeRows(result.data?.students))
          setCanEdit(Boolean(result.data?.can_edit))
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
    if (!canEdit || isSaving || rows.length === 0) return
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
      const refreshed = await assessmentService.getAttendanceEntries({ class_id: classId, semester_id: selectedSemesterId, scope: 'class', date: new Date().toISOString().slice(0, 10) })
      if (refreshed.success) {
        setRows(normalizeRows(refreshed.data?.students))
        onNotify(result.message)
      } else {
        setError(getErrorMessage(refreshed, 'Data tersimpan, tetapi gagal memuat ulang data.'))
      }
    }
    setIsSaving(false)
  }

  if (!selectedSemesterId) {
    return <div className="attendance-live-state" role="status">Pilih tahun ajaran dan semester untuk melihat absensi.</div>
  }

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
            <strong>{classes.find((item) => String(item.id) === classId)?.name || visibleRows.length + ' siswa'}</strong>
            <span>{selectedYear?.name || '-'} · {selectedSemester?.name || '-'}</span>
            <small>Rekap semester ini digunakan pada rapor. Input kehadiran harian kelas akan memperbarui jumlah sakit, izin, dan alpa.</small>
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
                          disabled={!canEdit || isSaving}
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
                        disabled={!canEdit || isSaving}
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
            {canEdit ? <Button className="attendance-button attendance-button-primary" disabled={isSaving} onClick={save}>{isSaving ? 'Menyimpan...' : 'Simpan Rekap'}</Button> : <span>Rekap hanya dapat diubah oleh wali kelas atau admin.</span>}
          </div>
        </>
      )}
    </section>
  )
}

export default LiveAttendanceView
