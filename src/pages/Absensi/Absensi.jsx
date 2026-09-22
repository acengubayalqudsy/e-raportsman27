import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import AttendanceTabs from '../../components/absensi/AttendanceTabs.jsx'
import LiveAttendanceView from '../../components/absensi/LiveAttendanceView.jsx'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import { attendanceTabs } from '../../config/attendanceTabs.js'
import './Absensi.css'

function Absensi() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const activeTab = attendanceTabs.find((tab) => tab.route === location.pathname) ?? attendanceTabs[0]

  return (
    <section className="attendance-page">
      <header className="attendance-header">
        <div>
          <h2>Absensi</h2>
          <p>Kelola kehadiran siswa secara terstruktur dan akurat</p>
        </div>
        <div className="attendance-breadcrumb">
          <Breadcrumb items={['Dashboard', 'Absensi', activeTab.label]} />
        </div>
      </header>

      <AttendanceTabs activeKey={activeTab.key} />
      {activeTab.key === 'rekap' ? (
        <LiveAttendanceView onNotify={setNotice} />
      ) : (
        <div className="attendance-live-state" role="status">
          Tampilan {activeTab.label} belum tersedia pada API absensi semester. Rekap absensi yang tersimpan dapat dikelola melalui tab Rekap.
        </div>
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
