import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { settingsTabs } from '../../data/pengaturan.js'

const modulePalette = {
  'identitas-sekolah': { bg: '#E0F2FE', color: '#0284C7' },
  akademik: { bg: '#E0F2FE', color: '#0284C7' },
  rapor: { bg: '#EDE9FE', color: '#7C3AED' },
  sistem: { bg: '#FEF3C7', color: '#D97706' },
  'backup-restore': { bg: '#E0F7FA', color: '#00838F' },
  'log-aktivitas': { bg: '#FFE4E6', color: '#E11D48' },
}

function SettingsMobileModuleGrid({ onItemClick }) {
  const { pathname } = useLocation()

  return (
    <section className="settings-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Data Pengaturan">
      <div className="master-mobile-grid-header">
        <div className="master-mobile-grid-header-copy">
          <h3 className="master-mobile-grid-title">Pilih Data</h3>
          <span className="master-mobile-grid-desc">Kelola konfigurasi aplikasi e-Raport</span>
        </div>
      </div>

      <div className="master-mobile-grid settings-mobile-grid-3col">
        {settingsTabs.map((item) => {
          const isActive = pathname === item.route
          const tone = modulePalette[item.key] || { bg: '#F1F5F9', color: '#008520' }

          const handleClick = (e) => {
            if (onItemClick) {
              e.preventDefault()
              onItemClick(item.route)
            }
          }

          return (
            <Link
              key={item.key}
              to={item.route}
              onClick={handleClick}
              className={`master-mobile-grid-item ${isActive ? 'active' : ''}`}
            >
              <div
                className="master-mobile-icon-box"
                style={{
                  backgroundColor: isActive ? '#008520' : tone.bg,
                  color: isActive ? '#FFFFFF' : tone.color,
                }}
              >
                <Icon name={item.icon} />
              </div>
              <span className="master-mobile-item-label">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default SettingsMobileModuleGrid
