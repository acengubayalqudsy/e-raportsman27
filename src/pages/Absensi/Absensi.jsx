import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import AttendanceTabs from '../../components/absensi/AttendanceTabs.jsx'
import AttendanceDetailView from '../../components/absensi/AttendanceDetailView.jsx'
import LiveAttendanceView from '../../components/absensi/LiveAttendanceView.jsx'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import { attendanceTabs } from '../../config/attendanceTabs.js'
import './Absensi.css'

function Absensi() {
  const location = useLocation()
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint.isMobile
  const [notice, setNotice] = useState('')
  const activeTab = attendanceTabs.find((tab) => tab.route === location.pathname) ?? attendanceTabs[0]

  return (
    <section className="attendance-page">
      {!isMobile && (
        <header className="attendance-header">
          <div className="attendance-desktop-title">
            <h2>Absensi</h2>
            <p>Kelola kehadiran siswa secara terstruktur dan akurat</p>
          </div>
          <div className="attendance-breadcrumb">
            <Breadcrumb items={['Dashboard', 'Absensi', activeTab.label]} />
          </div>
        </header>
      )}

      <AttendanceTabs activeKey={activeTab.key} />
      {activeTab.key === 'rekap' ? (
        <LiveAttendanceView onNotify={setNotice} />
      ) : (
        <AttendanceDetailView key={activeTab.key} mode={activeTab.key} onNotify={setNotice} />
      )}

      {notice && (
        <div className="attendance-toast" role="status" aria-live="polite">
          <span><Icon name="checkCircle" /></span>
          <p>{notice}</p>
          <button aria-label="Tutup notifikasi" onClick={() => setNotice('')} type="button">&times;</button>
        </div>
      )}
    </section>
  )
}

export default Absensi
