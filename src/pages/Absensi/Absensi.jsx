import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ClassAttendanceView,
  StudentAttendanceView,
  SubjectAttendanceView,
} from '../../components/absensi/AttendanceDataViews.jsx'
import AttendanceRecapView from '../../components/absensi/AttendanceRecapView.jsx'
import AttendanceSummary from '../../components/absensi/AttendanceSummary.jsx'
import AttendanceTabs from '../../components/absensi/AttendanceTabs.jsx'
import Icon from '../../components/common/Icon.jsx'
import Breadcrumb from '../../components/layout/Breadcrumb.jsx'
import { attendanceSummary, attendanceTabs } from '../../data/absensi.js'
import './Absensi.css'

function Absensi() {
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const [summaryItems, setSummaryItems] = useState(attendanceSummary)
  const activeTab = attendanceTabs.find((tab) => tab.route === location.pathname) ?? attendanceTabs[0]

  const views = {
    rekap: <AttendanceRecapView onNotify={setNotice} onSummaryChange={setSummaryItems} />,
    'per-siswa': <StudentAttendanceView onNotify={setNotice} />,
    'per-kelas': <ClassAttendanceView onNotify={setNotice} />,
    'per-mapel': <SubjectAttendanceView onNotify={setNotice} />,
  }

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
      {activeTab.key === 'rekap' && <AttendanceSummary items={summaryItems} />}
      {views[activeTab.key]}

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
