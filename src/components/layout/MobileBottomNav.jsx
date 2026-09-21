import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import MobileMoreSheet from './MobileMoreSheet.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { canAccessModule } from '../../constants/roles.js'

function MobileBottomNav() {
  const location = useLocation()
  const { roles } = useAuth()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isBerandaActive = location.pathname === '/' || location.pathname.startsWith('/dashboard')
  const isAkademikActive = location.pathname.startsWith('/akademik')
  const isPenilaianActive = location.pathname.startsWith('/penilaian')
  const isAbsensiActive = location.pathname.startsWith('/absensi')

  const otherRoutes = [
    '/master-data',
    '/rapor-leger',
    '/kegiatan-siswa',
    '/jurnal-mengajar',
    '/laporan',
    '/pengaturan',
  ]
  const isLainnyaActive =
    isMoreOpen || otherRoutes.some((route) => location.pathname.startsWith(route))

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah Mobile">
        <div className="mobile-bottom-nav-inner">
          {/* Tab 1: Beranda */}
          {canAccessModule(roles, 'akademik') && <Link
            to="/dashboard"
            className={`mobile-nav-item ${isBerandaActive ? 'active' : ''}`}
            aria-label="Beranda"
          >
            <div className="mobile-nav-icon-wrap">
              <Icon name="home" />
            </div>
            <span className="mobile-nav-label">Beranda</span>
          </Link>}

          {/* Tab 2: Akademik */}
          {canAccessModule(roles, 'penilaian') && <Link
            to="/akademik"
            className={`mobile-nav-item ${isAkademikActive ? 'active' : ''}`}
            aria-label="Akademik"
          >
            <div className="mobile-nav-icon-wrap">
              <Icon name="academic" />
            </div>
            <span className="mobile-nav-label">Akademik</span>
          </Link>}

          {/* Tab 3: FAB Penilaian (Tombol Tengah Menonjol) */}
          {canAccessModule(roles, 'absensi') && <Link
            to="/penilaian"
            className={`mobile-nav-fab-item ${isPenilaianActive ? 'active' : ''}`}
            aria-label="Penilaian"
          >
            <div className="mobile-nav-fab-button">
              <Icon name="grade" />
            </div>
            <span className="mobile-nav-label">Penilaian</span>
          </Link>}

          {/* Tab 4: Absensi */}
          <Link
            to="/absensi/rekap"
            className={`mobile-nav-item ${isAbsensiActive ? 'active' : ''}`}
            aria-label="Absensi"
          >
            <div className="mobile-nav-icon-wrap">
              <Icon name="clipboardCheck" />
            </div>
            <span className="mobile-nav-label">Absensi</span>
          </Link>

          {/* Tab 5: Lainnya */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`mobile-nav-item ${isLainnyaActive ? 'active' : ''}`}
            aria-label="Menu Lainnya"
          >
            <div className="mobile-nav-icon-wrap">
              <Icon name="sliders" />
            </div>
            <span className="mobile-nav-label">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Menu Lainnya */}
      <MobileMoreSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} roles={roles} />
    </>
  )
}

export default MobileBottomNav
