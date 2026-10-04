import { useEffect, useState } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import { useLocation } from 'react-router-dom'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import assessmentService from '../../services/assessmentService.js'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import StudentActivityTabs from '../../components/kegiatan-siswa/StudentActivityTabs.jsx'
import StudentActivityMobileModuleGrid from '../../components/kegiatan-siswa/StudentActivityMobileModuleGrid.jsx'
import StudentParticipationView from '../../components/kegiatan-siswa/StudentParticipationView.jsx'
import StudentScoreView from '../../components/kegiatan-siswa/StudentScoreView.jsx'
import {
  CocurricularNotesView,
  HomeroomNotesView,
} from '../../components/kegiatan-siswa/StudentNotesViews.jsx'
import { activityTabs } from '../../data/kegiatanSiswa.js'
import './KegiatanSiswa.css'

function KegiatanSiswa() {
  const location = useLocation()
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint.isMobile
  const [notice, setNotice] = useState('')
  const { selectedSemesterId } = useAcademicContext()
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classError, setClassError] = useState('')
  const [isClassLoading, setIsClassLoading] = useState(true)
  const [loadedSemesterId, setLoadedSemesterId] = useState('')
  const activeTab = activityTabs.find((tab) => tab.route === location.pathname) ?? activityTabs[0]
  const classReady = !isClassLoading && loadedSemesterId === selectedSemesterId

  useEffect(() => {
    if (!selectedSemesterId) return undefined
    let cancelled = false
    assessmentService.getAttendanceClasses(selectedSemesterId).then((result) => {
      if (cancelled) return
      setClasses(result.data || [])
      setClassError(result.success ? '' : result.error)
      setSelectedClassId((current) => result.data?.some((item) => String(item.id) === current) ? current : String(result.data?.[0]?.id || ''))
      setLoadedSemesterId(selectedSemesterId)
      setIsClassLoading(false)
    })
    return () => { cancelled = true }
  }, [selectedSemesterId])

  const views = {
    'keikutsertaan-ekstrakurikuler': (
      <StudentParticipationView
        classId={selectedClassId}
        semesterId={selectedSemesterId}
        classes={classes}
        onClassChange={setSelectedClassId}
        onNotify={setNotice}
      />
    ),
    'nilai-ekstrakurikuler': (
      <StudentScoreView
        classId={selectedClassId}
        semesterId={selectedSemesterId}
        classes={classes}
        onClassChange={setSelectedClassId}
        onNotify={setNotice}
      />
    ),
    'catatan-kokurikuler': (
      <CocurricularNotesView
        classId={selectedClassId}
        semesterId={selectedSemesterId}
        classes={classes}
        onClassChange={setSelectedClassId}
        onNotify={setNotice}
      />
    ),
    'catatan-wali-kelas': (
      <HomeroomNotesView
        classId={selectedClassId}
        semesterId={selectedSemesterId}
        classes={classes}
        onClassChange={setSelectedClassId}
        onNotify={setNotice}
      />
    ),
  }

  return (
    <section className="activity-page">
      {!isMobile && (
        <>
          <header className="activity-header">
            <div className="activity-desktop-title">
              <h2>Kegiatan Siswa</h2>
              <p>Kelola kegiatan dan catatan perkembangan siswa secara terintegrasi</p>
            </div>
            <div className="activity-breadcrumb">
              <Breadcrumb items={['Dashboard', 'Kegiatan Siswa', activeTab.label]} />
            </div>
          </header>

          <div className="activity-desktop-tabs-wrapper">
            <StudentActivityTabs activeKey={activeTab.key} />
          </div>

          <div className="activity-class-context activity-desktop-class-context">
            <label className="activity-filter-field">
              <span>Kelas</span>
              <select
                disabled={!classReady || classes.length === 0}
                value={classReady ? selectedClassId : ''}
                onChange={(event) => setSelectedClassId(event.target.value)}
              >
                <option value="">Pilih kelas</option>
                {classReady && classes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <small>
              {!classReady
                ? 'Memuat kelas...'
                : classError || (classes.length === 0 ? 'Belum ada kelas pada semester ini.' : 'Data mengikuti kelas dan semester yang dipilih.')}
            </small>
          </div>
        </>
      )}

      {isMobile && (
        <StudentActivityMobileModuleGrid activeKey={activeTab.key} />
      )}

      {classReady && selectedClassId && selectedSemesterId ? (
        <div key={`${activeTab.key}-${selectedClassId}-${selectedSemesterId}`}>
          {views[activeTab.key]}
        </div>
      ) : null}

      {notice && (
        <div className="activity-toast" role="status" aria-live="polite">
          <span><Icon name="checkCircle" /></span>
          <p>{notice}</p>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default KegiatanSiswa
