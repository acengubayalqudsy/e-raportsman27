import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { canAccessModule } from '../../constants/roles.js'

const moreMenuItems = [
  {
    key: 'master-data',
    label: 'Master Data',
    icon: 'layers',
    route: '/master-data/siswa',
    desc: 'Siswa, Guru, Kelas, Mapel',
  },
  {
    key: 'rapor-leger',
    label: 'Rapor & Leger',
    icon: 'report',
    route: '/rapor-leger',
    desc: 'Cetak Rapor & Leger Nilai',
  },
  {
    key: 'kegiatan-siswa',
    label: 'Kegiatan Siswa',
    icon: 'cap',
    route: '/kegiatan-siswa/keikutsertaan-ekstrakurikuler',
    desc: 'Ekstrakurikuler & Prestasi',
  },
  {
    key: 'jurnal-mengajar',
    label: 'Jurnal Mengajar',
    icon: 'journal',
    route: '/jurnal-mengajar/jurnal',
    desc: 'Jurnal Guru & Agenda',
  },
  {
    key: 'laporan',
    label: 'Laporan',
    icon: 'document',
    route: '/laporan',
    desc: 'Statistik & Unduh Laporan',
  },
  {
    key: 'pengaturan',
    label: 'Pengaturan',
    icon: 'settings',
    route: '/pengaturan/identitas-sekolah',
    desc: 'Konfigurasi & Profil Sistem',
  },
]

function MobileMoreSheet({ isOpen, onClose, roles = [] }) {
  const location = useLocation()

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isRouteActive = (route) => {
    const base = route.split('/')[1]
    return location.pathname.startsWith(`/${base}`)
  }

  return (
    <div className="mobile-sheet-overlay" onClick={onClose}>
      <div
        className="mobile-sheet-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Lainnya"
      >
        <div className="mobile-sheet-handle-wrapper">
          <div className="mobile-sheet-handle" />
        </div>

        <div className="mobile-sheet-header">
          <div>
            <h3 className="mobile-sheet-title">Menu Lainnya</h3>
            <p className="mobile-sheet-subtitle">Tahun Ajaran 2024/2025 • Genap</p>
          </div>
          <button
            type="button"
            className="mobile-sheet-close-btn"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="mobile-sheet-grid">
          {moreMenuItems.filter((item) => canAccessModule(roles, item.key)).map((item) => {
            const active = isRouteActive(item.route)
            return (
              <Link
                key={item.key}
                to={item.route}
                onClick={onClose}
                className={`mobile-sheet-card ${active ? 'active' : ''}`}
              >
                <div className={`mobile-sheet-icon-box ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} />
                </div>
                <div className="mobile-sheet-card-info">
                  <span className="mobile-sheet-card-label">{item.label}</span>
                  <span className="mobile-sheet-card-desc">{item.desc}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileMoreSheet
