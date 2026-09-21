import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import MasterDataTabs from '../../components/master-data/MasterDataTabs.jsx'
import MasterReferenceView from '../../components/master-data/MasterReferenceView.jsx'
import MasterRoomView from '../../components/master-data/MasterRoomView.jsx'
import MasterStudentView from '../../components/master-data/MasterStudentView.jsx'
import MasterTeacherView from '../../components/master-data/MasterTeacherView.jsx'
import { masterTabs } from '../../data/masterData.js'
import './MasterData.css'

function MasterData() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const activeTab = masterTabs.find((tab) => location.pathname.endsWith(`/${tab.key}`)) ?? masterTabs[0]

  return (
    <section className="master-page">
      <header className="master-header">
        <div><h2>Master Data</h2><p>Kelola data master sekolah dengan terstruktur dan akurat</p></div>
        <div className="master-breadcrumb"><Breadcrumb items={['Dashboard', 'Master Data', activeTab.label]} /></div>
      </header>

      <MasterDataTabs activeKey={activeTab.key} />

      {activeTab.key === 'siswa' ? (
        <MasterStudentView onNotify={setNotice} />
      ) : activeTab.key === 'guru' ? (
        <MasterTeacherView onNotify={setNotice} />
      ) : activeTab.key === 'ruangan' ? (
        <MasterRoomView onNotify={setNotice} />
      ) : (
        <MasterReferenceView activeKey={activeTab.key} key={activeTab.key} onNotify={setNotice} />
      )}

      {notice && (
        <div className="master-toast" role="status" aria-live="polite">
          <span><Icon name="checkCircle" /></span><p>{notice}</p><button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default MasterData
