import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { activityTabs } from '../../data/kegiatanSiswa.js'

function StudentActivityTabs({ activeKey }) {
  return (
    <nav className="activity-tabs no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi Kegiatan Siswa">
      {activityTabs.map((tab) => (
        <Link
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`activity-tab ${activeKey === tab.key ? 'active' : ''}`}
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

export default StudentActivityTabs
