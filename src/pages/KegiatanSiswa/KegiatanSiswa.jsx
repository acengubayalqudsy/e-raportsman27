import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import StudentActivityTabs from '../../components/kegiatan-siswa/StudentActivityTabs.jsx'
import StudentActivitySummary from '../../components/kegiatan-siswa/StudentActivitySummary.jsx'
import StudentParticipationView from '../../components/kegiatan-siswa/StudentParticipationView.jsx'
import StudentScoreView from '../../components/kegiatan-siswa/StudentScoreView.jsx'
import {
  CocurricularNotesView,
  HomeroomNotesView,
} from '../../components/kegiatan-siswa/StudentNotesViews.jsx'
import { activitySummaryByTab, activityTabs } from '../../data/kegiatanSiswa.js'
import './KegiatanSiswa.css'

function KegiatanSiswa() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const activeTab = activityTabs.find((tab) => tab.route === location.pathname) ?? activityTabs[0]

  const views = {
    'keikutsertaan-ekstrakurikuler': <StudentParticipationView onNotify={setNotice} />,
    'nilai-ekstrakurikuler': <StudentScoreView onNotify={setNotice} />,
    'catatan-kokurikuler': <CocurricularNotesView onNotify={setNotice} />,
    'catatan-wali-kelas': <HomeroomNotesView onNotify={setNotice} />,
  }

  return (
    <section className="activity-page">
      <header className="activity-header">
        <div>
          <h2>Kegiatan Siswa</h2>
          <p>Kelola kegiatan dan catatan perkembangan siswa secara terintegrasi</p>
        </div>
        <div className="activity-breadcrumb">
          <Breadcrumb items={['Dashboard', 'Kegiatan Siswa', activeTab.label]} />
        </div>
      </header>

      <StudentActivityTabs activeKey={activeTab.key} />
      <StudentActivitySummary items={activitySummaryByTab[activeTab.key]} />
      {views[activeTab.key]}

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
