import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'

const reportMobileModules = [
  { key: 'semua', label: 'Daftar Laporan', route: '/laporan', icon: 'document', tone: { bg: '#E0F2FE', color: '#0284C7' } },
  { key: 'saya', label: 'Laporan Saya', route: '/laporan/saya', icon: 'user', tone: { bg: '#FEF3C7', color: '#D97706' } },
  { key: 'nilai', label: 'Laporan Nilai', route: '/laporan/nilai', icon: 'fileGrade', tone: { bg: '#D1FAE5', color: '#059669' } },
  { key: 'absensi', label: 'Laporan Absensi', route: '/laporan/absensi', icon: 'calendar', tone: { bg: '#E0F2FE', color: '#0284C7' } },
  { key: 'ekstrakurikuler', label: 'Laporan Ekstrakurikuler', route: '/laporan/ekstrakurikuler', icon: 'users', tone: { bg: '#FEF3C7', color: '#D97706' } },
  { key: 'kokurikuler', label: 'Laporan Kokurikuler', route: '/laporan/kokurikuler', icon: 'book', tone: { bg: '#EDE9FE', color: '#7C3AED' } },
  { key: 'per-kelas', label: 'Laporan Per Kelas', route: '/laporan/per-kelas', icon: 'users', tone: { bg: '#E0F7FA', color: '#00838F' } },
  { key: 'per-siswa', label: 'Laporan Per Siswa', route: '/laporan/per-siswa', icon: 'user', tone: { bg: '#FFE4E6', color: '#E11D48' } },
  { key: 'rekapitulasi-rapor', label: 'Rekapitulasi Rapor', route: '/laporan/rekapitulasi-rapor', icon: 'trophy', tone: { bg: '#ECFDF5', color: '#047857' } },
]

function ReportMobileModuleGrid() {
  const { pathname } = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)

  // Default collapsed state: 6 items (3 columns x 2 rows)
  // Expanded state: all 9 items (3 columns x 3 rows)
  const displayedModules = isExpanded ? reportMobileModules : reportMobileModules.slice(0, 6)

  return (
    <section className="report-mobile-module-grid-wrapper master-mobile-module-grid-wrapper" aria-label="Pilih Data Laporan">
      <div className="master-mobile-grid-header">
        <div className="master-mobile-grid-header-copy">
          <h3 className="master-mobile-grid-title">Pilih Data</h3>
          <span className="master-mobile-grid-desc">Kelola dan cetak berbagai laporan akademik</span>
        </div>
        <button
          type="button"
          className="master-mobile-grid-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Tutup' : 'Lihat Semua (9)'}
        </button>
      </div>

      <div className="master-mobile-grid report-mobile-grid-3col">
        {displayedModules.map((item) => {
          const isActive = pathname === item.route

          return (
            <Link
              key={item.key}
              to={item.route}
              className={`master-mobile-grid-item ${isActive ? 'active' : ''}`}
            >
              <div
                className="master-mobile-icon-box"
                style={{
                  backgroundColor: isActive ? '#008520' : item.tone.bg,
                  color: isActive ? '#FFFFFF' : item.tone.color,
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

export default ReportMobileModuleGrid

