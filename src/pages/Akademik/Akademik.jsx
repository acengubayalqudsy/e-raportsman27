import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import {
  AcademicHomeroomView,
  AcademicRombelView,
  AcademicRoomAllocationView,
  AcademicTeacherAssignmentView,
} from '../../components/akademik/AcademicDataViews.jsx'
import AcademicScheduleView from '../../components/akademik/AcademicScheduleView.jsx'
import AcademicTabs from '../../components/akademik/AcademicTabs.jsx'
import { academicTabs } from '../../data/akademik.js'
import './Akademik.css'

function Akademik() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const activeTab = academicTabs.find((tab) => tab.route === location.pathname)
    ?? academicTabs.find((tab) => tab.key === 'jadwal-pelajaran')
    ?? academicTabs[0]

  const views = {
    'rombongan-belajar': <AcademicRombelView onNotify={setNotice} />,
    'penugasan-guru': <AcademicTeacherAssignmentView onNotify={setNotice} />,
    'penugasan-wali-kelas': <AcademicHomeroomView onNotify={setNotice} />,
    'jadwal-pelajaran': <AcademicScheduleView onNotify={setNotice} />,
    'pembagian-ruangan': <AcademicRoomAllocationView onNotify={setNotice} />,
  }

  return (
    <section className="academic-page">
      <header className="academic-header">
        <div><h2>Akademik</h2><p>Kelola kegiatan akademik sekolah</p></div>
        <div className="academic-breadcrumb">
          <Breadcrumb items={['Dashboard', 'Akademik', activeTab.label]} />
        </div>
      </header>

      <AcademicTabs activeKey={activeTab.key} />
      {views[activeTab.key]}

      {notice && (
        <div className="academic-toast" role="status" aria-live="polite">
          <span><Icon name="checkCircle" /></span>
          <p>{notice}</p>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default Akademik
