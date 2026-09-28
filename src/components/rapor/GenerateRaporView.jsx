import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import SupplementaryDataModal from './SupplementaryDataModal.jsx'

function GenerateRaporView({ onNotify }) {
  const navigate = useNavigate()
  const { selectedYear, selectedSemester } = useAcademicContext()
  const [context, setContext] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [supplementary, setSupplementary] = useState(null)
  const [validationStatuses, setValidationStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('absensi')

  const classes = [...new Map([
    ...(context?.homeroom_class ? [[context.homeroom_class.class_id, { id: context.homeroom_class.class_id, name: context.homeroom_class.class_name }]] : []),
    ...(context?.assigned_courses || []).map((course) => [course.class_id, { id: course.class_id, name: course.class_name }]),
  ]).values()]
  const effectiveClassId = selectedClassId || (classes[0]?.id ? String(classes[0].id) : '')
  const classId = effectiveClassId
  const semesterId = context?.active_semester?.id || context?.assigned_courses?.[0]?.semester_id || selectedSemester?.id

  const refreshData = async () => {
    if (!classId || !semesterId) return
    setLoading(true)
    setErrorMessage('')
    const [suppRes, valRes] = await Promise.all([
      assessmentService.getSupplementaryData(classId, semesterId),
      assessmentService.getValidationStatus(classId, semesterId),
    ])

    setSupplementary(suppRes.success ? suppRes.data : null)
    setValidationStatuses(valRes.success && Array.isArray(valRes.data) ? valRes.data : [])
    if (!suppRes.success || !valRes.success) setErrorMessage(suppRes.error || valRes.error || 'Gagal memuat data rapor.')
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      const ctxRes = await assessmentService.getContext()
      if (isMounted && ctxRes.success && ctxRes.data) {
        setContext(ctxRes.data)
        setSelectedClassId(String(ctxRes.data.homeroom_class?.class_id || ctxRes.data.assigned_courses?.[0]?.class_id || ''))
      } else if (isMounted) {
        setErrorMessage(ctxRes.error || 'Gagal memuat konteks akademik.')
      }
    }
    init()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (!classId || !semesterId) return undefined
    let active = true
    async function loadSelectedClass() {
      setLoading(true)
      setErrorMessage('')
      setSupplementary(null)
      setValidationStatuses([])
      const [suppRes, valRes] = await Promise.all([
        assessmentService.getSupplementaryData(classId, semesterId),
        assessmentService.getValidationStatus(classId, semesterId),
      ])
      if (!active) return
      setSupplementary(suppRes.success ? suppRes.data : null)
      setValidationStatuses(valRes.success && Array.isArray(valRes.data) ? valRes.data : [])
      if (!suppRes.success || !valRes.success) setErrorMessage(suppRes.error || valRes.error || 'Gagal memuat data rapor.')
      setLoading(false)
    }
    loadSelectedClass()
    return () => { active = false }
  }, [classId, semesterId])

  // Calculate real readiness metrics
  const totalStudents = supplementary?.students?.length || 0
  const attendanceFilledCount = supplementary?.students?.filter((s) => s.attendance?.is_recorded).length || 0
  const extracurricularCount = supplementary?.students?.filter((s) => s.extracurriculars?.length > 0).length || 0
  const cocurricularCount = supplementary?.students?.filter((s) => s.cocurriculars?.length > 0).length || 0
  const homeroomNotesCount = supplementary?.students?.filter((s) => s.homeroom_note?.trim()).length || 0

  const allCoursesLocked = validationStatuses.length > 0 && validationStatuses.every((v) => v.is_locked)
  const lockedCount = validationStatuses.filter((v) => v.is_locked).length
  const totalCourses = validationStatuses.length

  const readinessItems = [
    {
      id: 'data-akademik',
      label: 'Nilai Akademik',
      description: totalCourses ? `${lockedCount} dari ${totalCourses} mata pelajaran telah divalidasi` : 'Menunggu kalkulasi nilai guru',
      progress: `${lockedCount}/${totalCourses || 1}`,
      isComplete: allCoursesLocked,
      actionTab: null,
    },
    {
      id: 'absensi',
      label: 'Rekap Absensi / Ketidakhadiran',
      description: totalStudents ? `${attendanceFilledCount} dari ${totalStudents} siswa terdata` : 'Belum diisi',
      progress: `${attendanceFilledCount}/${totalStudents || 1}`,
      isComplete: totalStudents > 0 && attendanceFilledCount >= totalStudents,
      actionTab: 'absensi',
    },
    {
      id: 'ekstrakurikuler',
      label: 'Ekstrakurikuler',
      description: totalStudents ? `${extracurricularCount} dari ${totalStudents} siswa memiliki catatan ekskul` : 'Belum diisi',
      progress: `${extracurricularCount}/${totalStudents || 1}`,
      isComplete: totalStudents > 0 && extracurricularCount > 0,
      actionTab: 'ekstrakurikuler',
    },
    {
      id: 'kokurikuler',
      label: 'Catatan Projek Kokurikuler (P5)',
      description: totalStudents ? `${cocurricularCount} dari ${totalStudents} siswa memiliki catatan P5` : 'Belum diisi',
      progress: `${cocurricularCount}/${totalStudents || 1}`,
      isComplete: totalStudents > 0 && cocurricularCount > 0,
      actionTab: 'kokurikuler',
    },
    {
      id: 'catatan-wali-kelas',
      label: 'Catatan Wali Kelas',
      description: totalStudents ? `${homeroomNotesCount} dari ${totalStudents} siswa telah memiliki catatan` : 'Belum diisi',
      progress: `${homeroomNotesCount}/${totalStudents || 1}`,
      isComplete: totalStudents > 0 && homeroomNotesCount >= totalStudents,
      actionTab: 'catatan-wali-kelas',
    },
  ]

  const incompleteItems = readinessItems.filter((i) => !i.isComplete)

  const openEditor = (tabKey) => {
    if (tabKey) {
      if (!selectedClassId && classes.length > 0) {
        setSelectedClassId(String(classes[0].id))
      }
      setModalTab(tabKey)
      setModalOpen(true)
    }
  }

  return (
    <section className="report-secondary-workspace">
      <div className="report-context-filters fields-3">
        <label className="report-field"><span>Kelas</span><select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}><option value="">Pilih kelas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="report-field"><span>Tahun Ajaran</span><input readOnly value={context?.active_academic_year?.name || selectedYear?.name || '-'} /></label>
        <label className="report-field"><span>Semester</span><input readOnly value={context?.active_semester?.name || selectedSemester?.name || '-'} /></label>
      </div>
      {errorMessage && <p role="alert" className="report-generate-warning">{errorMessage}</p>}
      <div className="report-generate-layout">
        <section className="report-panel">
          <div className="report-section-heading">
            <div className="report-heading-main">
              <span className="report-heading-icon"><Icon name="clipboardCheck" /></span>
              <div>
                <h3>Kesiapan Data Rapor</h3>
                <p>Kelengkapan data akademik dan nonakademik rombel binaan.</p>
              </div>
            </div>
            <span className={`report-readiness-overall ${incompleteItems.length ? 'warning' : 'complete'}`}>
              {loading ? 'Memeriksa kelengkapan...' : incompleteItems.length ? `${incompleteItems.length} perlu dilengkapi` : 'Semua lengkap'}
            </span>
          </div>

          <div className="report-readiness-list">
            {readinessItems.map((item) => (
              <article className="report-readiness-item" key={item.id}>
                <div className="report-readiness-header">
                  <span className={`report-readiness-icon ${item.isComplete ? 'complete' : 'warning'}`}>
                    <Icon name={item.isComplete ? 'check' : 'info'} />
                  </span>
                  <div className="report-readiness-text">
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span className={`report-readiness-status ${item.isComplete ? 'complete' : 'warning'}`}>
                    {item.isComplete ? 'Lengkap' : 'Belum Lengkap'}
                  </span>
                </div>
                <div className="report-readiness-actions-row">
                  {item.actionTab ? (
                    <button
                      className="report-readiness-action"
                      onClick={() => openEditor(item.actionTab)}
                      type="button"
                    >
                      <Icon name="edit" />
                      <span>Input / Edit Data</span>
                    </button>
                  ) : (
                    <span className="report-readiness-note">
                      <Icon name="user" />
                      <span>Diinput Guru Mapel</span>
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="report-generate-card">
          <span className="report-generate-icon"><Icon name="settings" /></span>
          <h3>Generate Draf Rapor Kelas</h3>
          <p>Menyiapkan pratinjau rapor untuk seluruh siswa rombel binaan.</p>
          <dl className="report-generate-details">
            <div><dt>Kelas</dt><dd>{classes.find((item) => String(item.id) === selectedClassId)?.name || '-'}</dd></div>
            <div><dt>Jumlah Siswa</dt><dd>{totalStudents} siswa</dd></div>
            <div><dt>Tahun Ajaran</dt><dd>{context?.active_academic_year?.name || selectedYear?.name || '-'}</dd></div>
            <div><dt>Semester</dt><dd>{context?.active_semester?.name || selectedSemester?.name || '-'}</dd></div>
          </dl>

          <div className="report-policy-note">
            <strong>Catatan Kebijakan:</strong> Rapor yang dihasilkan berstatus <em>DRAF PRATINJAU</em>. Penerbitan <em>RAPOR FINAL</em> resmi ditangguhkan hingga SK Pembobotan dan Format disahkan kepala sekolah SMAN 27 Garut.
          </div>

          <Button
            className="report-button primary"
            disabled={loading || !classId || !totalStudents || Boolean(errorMessage)}
            onClick={() => navigate('/rapor-leger/rapor-per-siswa')}
          >
            <Icon name="eye" />
            Lihat Pratinjau Rapor
          </Button>
        </aside>
      </div>

      <SupplementaryDataModal
        activeTab={modalTab}
        classId={classId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(msg) => {
          onNotify?.(msg)
          refreshData()
        }}
        semesterId={semesterId}
      />
    </section>
  )
}

export default GenerateRaporView
