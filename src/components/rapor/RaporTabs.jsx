import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { raporTabs } from '../../data/rapor.js'

const tabMeta = {
  'daftar-rapor': { shortLabel: 'Daftar Rapor', tone: 'green', icon: 'report' },
  'generate-rapor': { shortLabel: 'Generate', tone: 'teal', icon: 'document' },
  'rapor-per-siswa': { shortLabel: 'Per Siswa', tone: 'blue', icon: 'users' },
  'leger-nilai': { shortLabel: 'Leger Nilai', tone: 'purple', icon: 'table' },
  'leger-deskripsi': { shortLabel: 'Deskripsi', tone: 'amber', icon: 'document' },
  'peringkat-kelas': { shortLabel: 'Peringkat', tone: 'orange', icon: 'cap' },
  'cover-rapor': { shortLabel: 'Cover', tone: 'green', icon: 'report' },
  'cetak-export': { shortLabel: 'Cetak PDF', tone: 'blue', icon: 'download' },
}

function RaporTabs({ activeKey }) {
  return (
    <div className="report-tabs-wrapper">
      {/* Desktop horizontal navigation tabs */}
      <nav className="report-tabs report-tabs-desktop no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi Rapor dan Leger Desktop">
        {raporTabs.map((tab) => (
          <Link
            aria-current={activeKey === tab.key ? 'page' : undefined}
            className={`report-tab ${activeKey === tab.key ? 'active' : ''}`}
            key={tab.key}
            to={tab.route}
          >
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile Edlink-style 8-Card Grid (4 per row) */}
      <div className="report-mobile-card-grid" aria-label="Menu Modul Rapor dan Leger">
        {raporTabs.map((tab) => {
          const meta = tabMeta[tab.key] || { shortLabel: tab.label, tone: 'green', icon: tab.icon }
          const isActive = activeKey === tab.key

          return (
            <Link
              key={tab.key}
              to={tab.route}
              className={`report-mobile-card ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`report-mobile-icon-box tone-${meta.tone} ${isActive ? 'active' : ''}`}>
                <Icon name={meta.icon || tab.icon} />
              </div>
              <span className="report-mobile-card-label">{meta.shortLabel}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default RaporTabs
