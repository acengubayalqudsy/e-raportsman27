import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { activityTabs } from '../../data/kegiatanSiswa.js'

const activityColorMap = {
  'keikutsertaan-ekstrakurikuler': { bg: '#E0F2FE', color: '#0284C7' },
  'nilai-ekstrakurikuler': { bg: '#FEF3C7', color: '#D97706' },
  'catatan-kokurikuler': { bg: '#EDE9FE', color: '#7C3AED' },
  'catatan-wali-kelas': { bg: '#D1FAE5', color: '#059669' },
}

function StudentActivityMobileModuleGrid({ activeKey }) {
  return (
    <section className="activity-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Modul Kegiatan Siswa">
      <div className="master-mobile-grid-header">
        <div className="master-mobile-grid-header-copy">
          <h3 className="master-mobile-grid-title">Pilih Data</h3>
          <span className="master-mobile-grid-desc">Kelola kegiatan dan perkembangan siswa</span>
        </div>
      </div>

      <div className="master-mobile-grid activity-mobile-grid-4col">
        {activityTabs.map((tab) => {
          const isActive = tab.key === activeKey
          const palette = activityColorMap[tab.key] || { bg: '#E2E8F0', color: '#475569' }

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
              <span className="master-mobile-item-label">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default StudentActivityMobileModuleGrid
