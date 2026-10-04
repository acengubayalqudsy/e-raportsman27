import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { raporTabs } from '../../data/rapor.js'

const tabMeta = {
  'daftar-rapor': { shortLabel: 'Daftar Rapor', icon: 'report', bg: '#E7F7EC', color: '#008520' },
  'generate-rapor': { shortLabel: 'Generate', icon: 'document', bg: '#E0F2FE', color: '#0284C7' },
  'rapor-per-siswa': { shortLabel: 'Per Siswa', icon: 'users', bg: '#EEF2FF', color: '#4F46E5' },
  'leger-nilai': { shortLabel: 'Leger Nilai', icon: 'table', bg: '#F3E8FF', color: '#9333EA' },
  'leger-deskripsi': { shortLabel: 'Deskripsi', icon: 'document', bg: '#FEF3C7', color: '#D97706' },
  'peringkat-kelas': { shortLabel: 'Peringkat', icon: 'cap', bg: '#FFEDD5', color: '#EA580C' },
  'cover-rapor': { shortLabel: 'Cover', icon: 'report', bg: '#E7F7EC', color: '#008520' },
  'cetak-export': { shortLabel: 'Cetak PDF', icon: 'download', bg: '#E0F2FE', color: '#0284C7' },
}

function RaporTabs({ activeKey }) {
  const activeIndex = raporTabs.findIndex((tab) => tab.key === activeKey)
  // Default collapsed state: 6 items (3 columns x 2 rows)
  // Auto-expand if active tab is beyond index 5 (Cover or Cetak PDF) so the user immediately sees active tab
  const [isExpanded, setIsExpanded] = useState(activeIndex >= 6)

  const displayedTabs = isExpanded ? raporTabs : raporTabs.slice(0, 6)

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

      {/* Mobile Edlink-style White Section Module Grid (Matching Master Data) */}
      <section className="rapor-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Data Rapor dan Leger">
        <div className="master-mobile-grid-header">
          <div className="master-mobile-grid-header-copy">
            <h3 className="master-mobile-grid-title">Pilih Data</h3>
            <span className="master-mobile-grid-desc">Kelola rapor, leger, dan dokumen akademik siswa</span>
          </div>
          <button
            type="button"
            className="master-mobile-grid-toggle"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Tutup' : 'Lihat Semua (8)'}
          </button>
        </div>

        <div className="master-mobile-grid rapor-mobile-grid-3col">
          {displayedTabs.map((tab) => {
            const meta = tabMeta[tab.key] || { shortLabel: tab.label, icon: tab.icon, bg: '#F1F5F9', color: '#008520' }
            const isActive = activeKey === tab.key

            return (
              <Link
                key={tab.key}
                to={tab.route}
                className={`master-mobile-grid-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className="master-mobile-icon-box"
                  style={{
                    backgroundColor: isActive ? '#008520' : meta.bg,
                    color: isActive ? '#FFFFFF' : meta.color,
                  }}
                >
                  <Icon name={meta.icon || tab.icon} />
                </div>
                <span className="master-mobile-item-label">{meta.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default RaporTabs
