import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { masterTabs } from '../../data/masterData.js'

const moduleColors = {
  siswa: { bg: '#E0F2FE', color: '#0284C7' },
  guru: { bg: '#EDE9FE', color: '#7C3AED' },
  kelas: { bg: '#D1FAE5', color: '#059669' },
  ruangan: { bg: '#FEF3C7', color: '#D97706' },
  'mata-pelajaran': { bg: '#EEF2FF', color: '#4F46E5' },
  'tahun-ajaran': { bg: '#FFE4E6', color: '#E11D48' },
  semester: { bg: '#E0F2FE', color: '#0284C7' },
  agama: { bg: '#F3E8FF', color: '#9333EA' },
  ekstrakurikuler: { bg: '#FFEDD5', color: '#EA580C' },
  'pengguna-role': { bg: '#F1F5F9', color: '#475569' },
}

function MasterMobileModuleGrid({ activeKey }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Default collapsed state: 6 items (3 columns x 2 rows)
  const displayedTabs = isExpanded ? masterTabs : masterTabs.slice(0, 6)

  return (
    <section className="master-mobile-module-grid-wrapper" aria-label="Pilih Data Master">
      <div className="master-mobile-grid-header">
        <div className="master-mobile-grid-header-copy">
          <h3 className="master-mobile-grid-title">Pilih Data</h3>
          <span className="master-mobile-grid-desc">Kelola data master sekolah</span>
        </div>
        <button
          type="button"
          className="master-mobile-grid-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Tutup' : 'Lihat Semua (10)'}
        </button>
      </div>

      <div className="master-mobile-grid">
        {displayedTabs.map((tab, idx) => {
          const isActive = tab.key === activeKey
          const palette = moduleColors[tab.key] || { bg: '#F1F5F9', color: '#008520' }
          // When expanded, the 10th item is alone on the 4th row: center it in column 2 of 3
          const isTenthItem = isExpanded && idx === 9

          return (
            <Link
              key={tab.key}
              to={tab.route}
              className={`master-mobile-grid-item ${isActive ? 'active' : ''} ${isTenthItem ? 'last-item-balanced' : ''}`}
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

export default MasterMobileModuleGrid
