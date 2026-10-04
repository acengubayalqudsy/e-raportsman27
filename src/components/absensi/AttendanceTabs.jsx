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

      {/* Mobile Edlink-style White Section Module Grid (Matching Gambar 1) */}
      <section className="attendance-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Modul Absensi">
        <div className="master-mobile-grid-header">
          <div className="master-mobile-grid-header-copy">
            <h3 className="master-mobile-grid-title">Pilih Data</h3>
            <span className="master-mobile-grid-desc">Kelola kegiatan dan kehadiran siswa</span>
          </div>
        </div>

        <div className="attendance-mobile-card-grid master-mobile-grid activity-mobile-grid-4col" aria-label="Menu Modul Absensi">
          {attendanceTabs.map((tab) => {
            const meta = tabMeta[tab.key] || { shortLabel: tab.label, tone: 'green', icon: tab.icon }
            const isActive = activeKey === tab.key

            return (
              <Link
                key={tab.key}
                to={tab.route}
                className={`attendance-mobile-card master-mobile-grid-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`attendance-mobile-icon-box master-mobile-icon-box tone-${meta.tone} ${isActive ? 'active' : ''}`}>
                  <Icon name={meta.icon || tab.icon} />
                </div>
                <span className="attendance-mobile-card-label master-mobile-item-label">{meta.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AttendanceTabs
