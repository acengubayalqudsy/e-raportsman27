import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { journalTabs } from '../../config/journalTabs.js'

const journalColorMap = {
  jurnal: { bg: '#E0F2FE', color: '#0284C7' },
  materi: { bg: '#FEF3C7', color: '#D97706' },
  'aktivitas-kelas': { bg: '#EDE9FE', color: '#7C3AED' },
  catatan: { bg: '#D1FAE5', color: '#059669' },
}

function JournalMobileModuleGrid({ activeKey }) {
  return (
    <section className="journal-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Data Jurnal Mengajar">
      <div className="master-mobile-grid-header">
        <div className="master-mobile-grid-header-copy">
          <h3 className="master-mobile-grid-title">Pilih Data</h3>
          <span className="master-mobile-grid-desc">Kelola jurnal dan aktivitas pembelajaran</span>
        </div>
      </div>

      <div className="master-mobile-grid journal-mobile-grid-4col">
        {journalTabs.map((tab) => {
          const isActive = tab.key === activeKey
          const palette = journalColorMap[tab.key] || { bg: '#E2E8F0', color: '#475569' }

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

export default JournalMobileModuleGrid
