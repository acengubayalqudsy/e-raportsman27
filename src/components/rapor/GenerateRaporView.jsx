import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'
import academicService from '../../services/academicService.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import SupplementaryDataModal from './SupplementaryDataModal.jsx'

function GenerateRaporView({ onNotify }) {
  const navigate = useNavigate()
  const { selectedYear, allSemesters } = useAcademicContext()
  const { hasRole } = useAuth()
  const isAdmin = Boolean(hasRole && hasRole('admin'))
  const [context, setContext] = useState(null)
  const [allClasses, setAllClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [supplementary, setSupplementary] = useState(null)
  const [validationStatuses, setValidationStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('absensi')

  const classes = useMemo(() => {
    const list = []
    const map = new Map()

    const homeroomList = Array.isArray(context?.homeroom_classes) && context.homeroom_classes.length > 0
      ? context.homeroom_classes
      : (context?.homeroom_class ? [context.homeroom_class] : [])

    homeroomList.forEach((cls) => {
      const id = String(cls.class_id || cls.id)
      if (id && !map.has(id)) {
        map.set(id, true)
        list.push({
          id,
          name: cls.class_name || cls.name,
          academic_year_id: cls.academic_year_id,
          academic_year_name: cls.academic_year_name,
          semester_id: cls.semester_id,
          semester_name: cls.semester_name,
        })
      }
    })

    ;(context?.assigned_courses || []).forEach((course) => {
      const id = String(course.class_id)
      if (id && !map.has(id)) {
        map.set(id, true)
        list.push({
          id,
          name: course.class_name,
          academic_year_id: course.academic_year_id,
          semester_id: course.semester_id,
        })
      }
    })

    if (isAdmin && Array.isArray(allClasses)) {
      allClasses.forEach((cls) => {
        const id = String(cls.id)
        if (id && !map.has(id)) {
          map.set(id, true)
          list.push({
            id,
            name: cls.name,
            academic_year_id: cls.academic_year_id,
            academic_year_name: cls.academic_year?.name,
          })
        }
      })
    }

    return list
  }, [context, isAdmin, allClasses])

  const effectiveClassId = selectedClassId || (classes[0]?.id ? String(classes[0].id) : '')
  const selectedClass = classes.find((c) => String(c.id) === String(effectiveClassId)) || classes[0] || null

  const filteredSemesters = (allSemesters || []).filter(
    (s) => String(s.academic_year_id) === String(selectedClass?.academic_year_id)
  )
  const availableSemesters = filteredSemesters.length > 0
    ? filteredSemesters
    : (context?.active_semester ? [context.active_semester] : [])

  const effectiveSemesterId = selectedSemesterId
    || String(selectedClass?.semester_id || availableSemesters.find((s) => s.status === 'Aktif')?.id || availableSemesters[0]?.id || context?.active_semester?.id || '')

  const selectedSemesterObj = availableSemesters.find((s) => String(s.id) === String(effectiveSemesterId))

  const handleClassChange = (newClassId) => {
    setSelectedClassId(newClassId)
    const cls = classes.find((c) => String(c.id) === String(newClassId))
    const sems = (allSemesters || []).filter((s) => String(s.academic_year_id) === String(cls?.academic_year_id))
    const nextSemId = String(
      cls?.semester_id
      || sems.find((s) => s.status === 'Aktif')?.id
      || sems[0]?.id
      || ''
    )
    if (nextSemId) setSelectedSemesterId(nextSemId)
  }

  const refreshData = async () => {
    if (!effectiveClassId || !effectiveSemesterId) return
    setLoading(true)
    setErrorMessage('')
    const [suppRes, valRes] = await Promise.all([
      assessmentService.getSupplementaryData(effectiveClassId, effectiveSemesterId),
      assessmentService.getValidationStatus(effectiveClassId, effectiveSemesterId),
    ])

    setSupplementary(suppRes.success ? suppRes.data : null)
    setValidationStatuses(valRes.success && Array.isArray(valRes.data) ? valRes.data : [])
    if (!suppRes.success || !valRes.success) setErrorMessage(suppRes.error || valRes.error || 'Gagal memuat data rapor.')
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      const [ctxRes, classesRes] = await Promise.all([
        assessmentService.getContext(),
        isAdmin ? academicService.getClasses({ per_page: 100 }) : Promise.resolve(null),
      ])
      if (!isMounted) return
      if (classesRes?.success && Array.isArray(classesRes.data)) {
        setAllClasses(classesRes.data)
      }
      if (ctxRes.success && ctxRes.data) {
        setContext(ctxRes.data)
        const initialClassId = String(
          ctxRes.data.homeroom_classes?.[0]?.class_id
          || ctxRes.data.homeroom_class?.class_id
          || ctxRes.data.assigned_courses?.[0]?.class_id
          || (isAdmin ? classesRes?.data?.[0]?.id : '')
          || ''
        )
        setSelectedClassId(initialClassId)
        if (!initialClassId) {
          setErrorMessage('Belum ada kelas yang ditugaskan oleh Administrator untuk akun ini.')
        }
      } else {
        setErrorMessage(ctxRes.error || 'Gagal memuat konteks akademik.')
      }
    }
    init()
    return () => { isMounted = false }
  }, [isAdmin])

  useEffect(() => {
    if (!effectiveClassId || !effectiveSemesterId) return undefined
    let active = true
    async function loadSelectedClass() {
      setLoading(true)
      setErrorMessage('')
      setSupplementary(null)
      setValidationStatuses([])
      const [suppRes, valRes] = await Promise.all([
        assessmentService.getSupplementaryData(effectiveClassId, effectiveSemesterId),
        assessmentService.getValidationStatus(effectiveClassId, effectiveSemesterId),
      ])
      if (!active) return
      setSupplementary(suppRes.success ? suppRes.data : null)
      setValidationStatuses(valRes.success && Array.isArray(valRes.data) ? valRes.data : [])
      if (!suppRes.success || !valRes.success) setErrorMessage(suppRes.error || valRes.error || 'Gagal memuat data rapor.')
      setLoading(false)
    }
    loadSelectedClass()
    return () => { active = false }
  }, [effectiveClassId, effectiveSemesterId])

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
        <label className="report-field">
          <span>Kelas</span>
          <select value={effectiveClassId} onChange={(event) => handleClassChange(event.target.value)}>
            <option value="">Pilih kelas</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="report-field">
          <span>Tahun Ajaran</span>
          <input readOnly value={selectedClass?.academic_year_name || context?.active_academic_year?.name || selectedYear?.name || '-'} />
        </label>
        <label className="report-field">
          <span>Semester</span>
          <select value={effectiveSemesterId} onChange={(event) => setSelectedSemesterId(event.target.value)}>
            {availableSemesters.map((sem) => (
              <option key={sem.id} value={sem.id}>{sem.name}</option>
            ))}
          </select>
        </label>
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
            <div><dt>Kelas</dt><dd>{selectedClass?.name || '-'}</dd></div>
            <div><dt>Jumlah Siswa</dt><dd>{totalStudents} siswa</dd></div>
            <div><dt>Tahun Ajaran</dt><dd>{selectedClass?.academic_year_name || context?.active_academic_year?.name || selectedYear?.name || '-'}</dd></div>
            <div><dt>Semester</dt><dd>{selectedSemesterObj?.name || context?.active_semester?.name || '-'}</dd></div>
          </dl>

          <div className="report-policy-note">
            <strong>Catatan Kebijakan:</strong> Rapor yang dihasilkan berstatus <em>DRAF PRATINJAU</em>. Penerbitan <em>RAPOR FINAL</em> resmi ditangguhkan hingga SK Pembobotan dan Format disahkan kepala sekolah SMAN 27 Garut.
          </div>

          <Button
            className="report-button primary"
            disabled={loading || !effectiveClassId || !totalStudents || Boolean(errorMessage)}
            onClick={() => navigate('/rapor-leger/rapor-per-siswa')}
          >
            <Icon name="eye" />
            Lihat Pratinjau Rapor
          </Button>
        </aside>
      </div>

      <SupplementaryDataModal
        activeTab={modalTab}
        classId={effectiveClassId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(msg) => {
          onNotify?.(msg)
          refreshData()
        }}
        semesterId={effectiveSemesterId}
      />
    </section>
  )
}

export default GenerateRaporView
