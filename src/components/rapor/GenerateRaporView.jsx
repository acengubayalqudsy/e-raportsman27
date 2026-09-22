import { useEffect, useState } from 'react'
import Button from '../common/Button.jsx'
import Icon from '../common/Icon.jsx'
import assessmentService from '../../services/assessmentService.js'
import RaporContextFilters from './RaporContextFilters.jsx'
import SupplementaryDataModal from './SupplementaryDataModal.jsx'

function GenerateRaporView({ onNotify }) {
  const [context, setContext] = useState(null)
  const [supplementary, setSupplementary] = useState(null)
  const [validationStatuses, setValidationStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('absensi')

  const classId = context?.homeroom_class?.id || context?.assigned_courses?.[0]?.class_id
  const semesterId = context?.active_semester?.id

  const refreshData = async () => {
    if (!classId || !semesterId) return
    setLoading(true)
    const [suppRes, valRes] = await Promise.all([
      assessmentService.getSupplementaryData(classId, semesterId),
      assessmentService.getValidationStatus(classId, semesterId),
    ])

    if (suppRes.success && suppRes.data) {
      setSupplementary(suppRes.data)
    }
    if (valRes.success && Array.isArray(valRes.data)) {
      setValidationStatuses(valRes.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      setLoading(true)
      const ctxRes = await assessmentService.getContext()
      if (isMounted && ctxRes.success && ctxRes.data) {
        setContext(ctxRes.data)
        const cId = ctxRes.data.homeroom_class?.id || ctxRes.data.assigned_courses?.[0]?.class_id
        const sId = ctxRes.data.active_semester?.id
        if (cId && sId) {
          const [suppRes, valRes] = await Promise.all([
            assessmentService.getSupplementaryData(cId, sId),
            assessmentService.getValidationStatus(cId, sId),
          ])
          if (isMounted && suppRes.success) setSupplementary(suppRes.data)
          if (isMounted && valRes.success) setValidationStatuses(valRes.data)
        }
      }
      if (isMounted) setLoading(false)
    }
    init()
    return () => { isMounted = false }
  }, [])

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
      setModalTab(tabKey)
      setModalOpen(true)
    }
  }

  const handleGenerateDraft = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      onNotify?.('Draf Pratinjau Rapor berhasil disiapkan. Seluruh dokumen siap diperiksa pada tab Rapor Per Siswa.')
    }, 500)
  }

  return (
    <section className="report-secondary-workspace">
      <RaporContextFilters />
      <div className="report-generate-layout">
        <section className="report-panel">
          <div className="report-section-heading">
            <div>
              <span><Icon name="clipboardCheck" /></span>
              <div>
                <h3>Kesiapan Data Rapor (Database Riil)</h3>
                <p>Kelengkapan data akademik dan nonakademik rombel binaan.</p>
              </div>
            </div>
            <span className={`report-readiness-overall ${incompleteItems.length ? 'warning' : 'complete'}`}>
              {loading ? 'Memeriksa database...' : incompleteItems.length ? `${incompleteItems.length} perlu dilengkapi` : 'Semua lengkap'}
            </span>
          </div>

          <div className="report-readiness-list">
            {readinessItems.map((item) => (
              <article className="report-readiness-item" key={item.id}>
                <span className={`report-readiness-icon ${item.isComplete ? 'complete' : 'warning'}`}>
                  <Icon name={item.isComplete ? 'check' : 'info'} />
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
                <span className="report-readiness-progress">{item.progress}</span>
                <span className={`report-readiness-status ${item.isComplete ? 'complete' : 'warning'}`}>
                  {item.isComplete ? 'Lengkap' : 'Belum Lengkap'}
                </span>
                {item.actionTab ? (
                  <button
                    onClick={() => openEditor(item.actionTab)}
                    type="button"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#2563eb',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Input / Edit Data
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Diinput Guru Mapel</span>
                )}
              </article>
            ))}
          </div>
        </section>

        <aside className="report-generate-card">
          <span className="report-generate-icon"><Icon name="settings" /></span>
          <h3>Generate Draf Rapor Kelas</h3>
          <p>Menyiapkan pratinjau rapor untuk seluruh siswa rombel binaan berdasarkan data yang tersimpan di MariaDB.</p>
          <dl>
            <div><dt>Kelas</dt><dd>{context?.homeroom_class?.name || '-'}</dd></div>
            <div><dt>Jumlah Siswa</dt><dd>{totalStudents} siswa</dd></div>
            <div><dt>Tahun Ajaran</dt><dd>{context?.active_semester?.academic_year || '2025/2026'}</dd></div>
            <div><dt>Semester</dt><dd>{context?.active_semester?.name || 'Ganjil'}</dd></div>
          </dl>

          <div style={{ margin: '1rem 0', padding: '0.75rem', borderRadius: '6px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.8rem', color: '#92400e' }}>
            <strong>Catatan Kebijakan:</strong> Rapor yang dihasilkan berstatus <em>DRAF PRATINJAU</em>. Penerbitan <em>RAPOR FINAL</em> resmi ditangguhkan hingga SK Pembobotan dan Format disahkan kepala sekolah SMAN 27 Garut.
          </div>

          <Button
            className="report-button primary"
            disabled={isGenerating || loading}
            onClick={handleGenerateDraft}
          >
            {isGenerating ? <span className="report-spinner" /> : <Icon name="settings" />}
            {isGenerating ? 'Memproses Draf...' : 'Generate Draf Pratinjau Rapor'}
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
