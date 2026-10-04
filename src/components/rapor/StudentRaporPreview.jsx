import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'
import excelService from '../../services/excelService.js'
import { settingsService } from '../../services/settingsService.js'
import { assignmentService } from '../../services/assignmentService.js'
import RaporContextFilters from './RaporContextFilters.jsx'
import SupplementaryDataModal from './SupplementaryDataModal.jsx'
import StudentReportDocument from './StudentReportDocument.jsx'

function StudentRaporPreview({ onNotify }) {
  const [searchParams] = useSearchParams()
  const paramStudentId = searchParams.get('student_id')

  const [studentId, setStudentId] = useState(paramStudentId || '')
  const [prevParamStudentId, setPrevParamStudentId] = useState(paramStudentId)

  if (paramStudentId !== prevParamStudentId) {
    setPrevParamStudentId(paramStudentId)
    setStudentId(paramStudentId || '')
  }

  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [supplementaryStudent, setSupplementaryStudent] = useState(null)
  const [supplementaryLoading, setSupplementaryLoading] = useState(false)
  const [supplementaryError, setSupplementaryError] = useState('')
  const [filterState, setFilterState] = useState({ loading: true, error: '', classData: null })
  const [reloadNonce, setReloadNonce] = useState(0)
  const [showSupplementaryModal, setShowSupplementaryModal] = useState(false)
  const [modalTab, setModalTab] = useState('absensi')
  const [documentSettings, setDocumentSettings] = useState({ school: null, date: '', homeroom: null })

  useEffect(() => {
    const classId = filterState.classId
    const semesterId = filterState.semesterId || filterState.context?.active_semester?.id
    if (!classId || !semesterId) return undefined
    let active = true
    Promise.allSettled([
      settingsService.get('identity'),
      settingsService.get('academic'),
      assignmentService.getHomerooms({ class_id: classId, semester_id: semesterId, status: 'Aktif', per_page: 100 }),
    ]).then(([identity, academic, assignments]) => {
      if (!active) return
      const school = identity.status === 'fulfilled' ? identity.value : null
      const date = academic.status === 'fulfilled' ? academic.value?.reportDistributionDate : ''
      const homeroom = assignments.status === 'fulfilled'
        ? assignments.value.data?.find((item) => String(item.class_id) === String(classId) && String(item.semester_id) === String(semesterId) && item.status === 'Aktif')
        : null
      setDocumentSettings({ school, date, homeroom })
    })
    return () => { active = false }
  }, [filterState.classId, filterState.semesterId, filterState.context?.active_semester?.id])

  const handleOptionsReady = useCallback((state) => {
    setFilterState(state)
    const students = state.classData?.students || []
    if (students.length > 0) {
      if (!paramStudentId || !students.some((s) => String(s.student_id) === String(paramStudentId))) {
        setStudentId((current) => {
          if (!current || !students.some((s) => String(s.student_id) === String(current))) {
            return String(students[0].student_id)
          }
          return current
        })
      }
    }
  }, [paramStudentId])

  useEffect(() => {
    if (!studentId) return undefined
    let isMounted = true
    async function loadReport() {
      setLoading(true)
      setErrorMessage('')
      setReportData(null)
      const semId = filterState.semesterId || filterState.context?.active_semester?.id || filterState.context?.assigned_courses?.[0]?.semester_id
      const res = await assessmentService.getReportCard(studentId, semId)
      if (isMounted && res.success && res.data) {
        setReportData(res.data)
      } else if (isMounted) {
        setReportData(null)
        setErrorMessage(res.error || 'Gagal memuat data rapor siswa.')
      }
      if (isMounted) setLoading(false)
    }
    loadReport()
    return () => { isMounted = false }
  }, [studentId, filterState.semesterId, filterState.context?.active_semester?.id, filterState.context?.assigned_courses, reloadNonce])

  useEffect(() => {
    const classId = filterState.classId
    const semesterId = filterState.semesterId || filterState.context?.active_semester?.id || filterState.context?.assigned_courses?.[0]?.semester_id
    if (!studentId || !classId || !semesterId) return undefined

    let isMounted = true
    async function loadSupplementary() {
      setSupplementaryLoading(true)
      setSupplementaryError('')
      const res = await assessmentService.getSupplementaryData(classId, semesterId)
      if (!isMounted) return
      if (res.success) {
        setSupplementaryStudent(res.data?.students?.find((student) => String(student.student_id) === String(studentId)) ?? null)
      } else {
        setSupplementaryStudent(null)
        setSupplementaryError(res.error || 'Gagal memuat data pelengkap rapor siswa.')
      }
      setSupplementaryLoading(false)
    }
    loadSupplementary()
    return () => { isMounted = false }
  }, [filterState.classId, filterState.semesterId, filterState.context, studentId, reloadNonce])

  const studentInfo = reportData?.student
  const reportStatus = reportData?.report_status ?? '-'
  const cocurriculars = supplementaryStudent
    ? (supplementaryStudent.cocurriculars ?? [])
    : (reportData?.cocurricular ? [reportData.cocurricular] : [])

  const handlePrint = () => {
    window.print()
    if (onNotify) onNotify('Membuka dialog pencetakan rapor...')
  }

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters
        authoritative
        allowClassSelection
        includeStudent
        onChange={(key, value) => {
          if (key === 'studentId') setStudentId(value)
          if (key === 'className') {
            setStudentId('')
            setReportData(null)
            setSupplementaryStudent(null)
          }
        }}
        onOptionsReady={handleOptionsReady}
        values={{ studentId }}
      />
      {filterState.loading && !filterState.error && (
        <div style={{ textAlign: 'center', padding: '1.25rem', color: '#64748b', fontSize: '12px' }}>
          <span className="spinner-border spinner-border-sm" style={{ marginRight: '8px' }} />
          Memuat data siswa...
        </div>
      )}
      {studentInfo && <div className="report-preview-toolbar">
        <div>
          <span><Icon name="user" /></span>
          <div>
            <strong>{studentInfo.name}</strong>
            <small>NIS {studentInfo.nis} &bull; NISN {studentInfo.nisn}</small>
          </div>
          <span style={{
            marginLeft: '1rem', fontSize: '0.75rem', padding: '0.2rem 0.6rem',
            borderRadius: '4px', fontWeight: 600,
            background: reportStatus === 'TERVALIDASI' ? '#dcfce7' : '#fef3c7',
            color: reportStatus === 'TERVALIDASI' ? '#166534' : '#92400e',
          }}>{reportStatus}</span>
        </div>
        <div>
          <Button className="report-button secondary" onClick={() => { setModalTab('absensi'); setShowSupplementaryModal(true); }}>
            <Icon name="edit" />
            Kelola Data Pelengkap
          </Button>
          <Button className="report-button secondary" onClick={() => excelService.download('report_card', 'export', { student_id: studentId, semester_id: filterState.context?.active_semester?.id || filterState.context?.assigned_courses?.[0]?.semester_id }).catch((error) => onNotify(error.message))}>
            <Icon name="download" />Export Excel
          </Button>
          <Button className="report-button secondary" disabled={supplementaryLoading} onClick={handlePrint}>
            <Icon name="eye" />
            Preview Cetak
          </Button>
          <Button className="report-button primary" disabled={supplementaryLoading} onClick={handlePrint}>
            <Icon name="download" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>}

      {supplementaryError && <p role="alert" className="student-report-data-error">{supplementaryError}</p>}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Memuat data rapor...</p>
      ) : errorMessage ? (
        <p role="alert" style={{ textAlign: 'center', padding: '3rem', color: '#b91c1c' }}>{errorMessage}</p>
      ) : !reportData ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Pilih siswa untuk melihat rapor.</p>
      ) : (
        <StudentReportDocument
          report={reportData || { student: studentInfo, academic_results: [] }}
          school={documentSettings.school}
          homeroom={documentSettings.homeroom}
          reportDate={documentSettings.date}
          cocurriculars={cocurriculars}
        />
      )}

      <SupplementaryDataModal
        activeTab={modalTab}
        classId={filterState.classId}
        isOpen={showSupplementaryModal}
        onClose={() => setShowSupplementaryModal(false)}
        onSaved={(msg) => {
          onNotify?.(msg)
          setReloadNonce((n) => n + 1)
        }}
        semesterId={filterState.semesterId || filterState.context?.active_semester?.id || filterState.context?.assigned_courses?.[0]?.semester_id}
      />
    </section>
  )
}

export default StudentRaporPreview
