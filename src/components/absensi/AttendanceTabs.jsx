import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { attendanceTabs } from '../../config/attendanceTabs.js'

const tabMeta = {
  rekap: { label: 'Rekap', shortLabel: 'Rekap', tone: 'green', icon: 'clipboard' },
  'per-siswa': { label: 'Per Siswa', shortLabel: 'Per Siswa', tone: 'blue', icon: 'users' },
  'per-kelas': { label: 'Per Kelas', shortLabel: 'Per Kelas', tone: 'purple', icon: 'building' },
  'per-mapel': { label: 'Per Mapel', shortLabel: 'Per Mapel', tone: 'amber', icon: 'book' },
}

function AttendanceTabs({ activeKey }) {
  return (
    <div className="attendance-tabs-wrapper">
      {/* Desktop horizontal navigation tabs */}
      <nav className="attendance-tabs attendance-tabs-desktop no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi Absensi Desktop">
        {attendanceTabs.map((tab) => {
          const meta = tabMeta[tab.key] || { shortLabel: tab.label, tone: 'green', icon: tab.icon }
          const isActive = activeKey === tab.key
          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`attendance-tab ${isActive ? 'active' : ''}`}
              key={tab.key}
              to={tab.route}
            >
              <Icon name={meta.icon || tab.icon} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Mobile Edlink-style 4-Card Grid (exact match to Gambar 1 Modul Rapor) */}
      <div className="attendance-mobile-card-grid" aria-label="Menu Modul Absensi">
        {attendanceTabs.map((tab) => {
          const meta = tabMeta[tab.key] || { shortLabel: tab.label, tone: 'green', icon: tab.icon }
          const isActive = activeKey === tab.key

          return (
            <Link
              key={tab.key}
              to={tab.route}
              className={`attendance-mobile-card ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`attendance-mobile-icon-box tone-${meta.tone} ${isActive ? 'active' : ''}`}>
                <Icon name={meta.icon || tab.icon} />
              </div>
              <span className="attendance-mobile-card-label">{meta.shortLabel}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default AttendanceTabs
