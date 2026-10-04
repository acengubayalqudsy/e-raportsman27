import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { academicTabs } from '../../data/akademik.js'

const academicModuleColors = {
  'rombongan-belajar': { bg: '#E0F2FE', color: '#0284C7' },
  'penugasan-guru': { bg: '#EDE9FE', color: '#7C3AED' },
  'penugasan-wali-kelas': { bg: '#FEF3C7', color: '#D97706' },
  'jadwal-pelajaran': { bg: '#D1FAE5', color: '#059669' },
  'pembagian-ruangan': { bg: '#EEF2FF', color: '#4F46E5' },
}

function AcademicMobileModuleGrid({ activeKey }) {
  return (
    <section className="academic-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Modul Akademik">
      <div className="master-mobile-grid-header">
        <div className="master-mobile-grid-header-copy">
          <h3 className="master-mobile-grid-title">Pilih Data</h3>
          <span className="master-mobile-grid-desc">Kelola kegiatan akademik sekolah</span>
        </div>
      </div>

      <div className="master-mobile-grid">
        {academicTabs.map((tab) => {
          const isActive = tab.key === activeKey
          const palette = academicModuleColors[tab.key] || { bg: '#F1F5F9', color: '#008520' }

          return (
            <Link
              key={tab.key}
              to={tab.route}
              className={`master-mobile-grid-item ${isActive ? 'active' : ''}`}
            >
              <div
                className="master-mobile-icon-box"
                style={{
                  backgroundColor: isActive ? '#008520' : palette.bg,
                  color: isActive ? '#FFFFFF' : palette.color,
                }}
              >
                <Icon name={tab.icon} />
              </div>
              <span className="master-mobile-item-label">{tab.shortLabel || tab.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default AcademicMobileModuleGrid
