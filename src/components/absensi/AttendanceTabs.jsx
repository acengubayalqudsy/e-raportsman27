import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { attendanceTabs } from '../../data/absensi.js'

function AttendanceTabs({ activeKey }) {
  return (
    <nav className="attendance-tabs no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi Absensi">
      {attendanceTabs.map((tab) => (
        <Link
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`attendance-tab ${activeKey === tab.key ? 'active' : ''}`}
          key={tab.key}
          to={tab.route}
        >
          <Icon name={tab.icon} />
          <span>{tab.shortLabel ?? tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default AttendanceTabs
