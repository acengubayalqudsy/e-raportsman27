import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import MobileMoreSheet from './MobileMoreSheet.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { canAccessModule } from '../../constants/roles.js'

function getMobileNavTabs(roles = []) {
  const tabs = [
    {
      key: 'beranda',
      label: 'Beranda',
      route: '/dashboard',
      icon: 'home',
      match: (path) => path === '/' || path.startsWith('/dashboard'),
    },
  ]

  // Tab 2: Penilaian, Rapor, or Akademik
  if (canAccessModule(roles, 'penilaian')) {
    tabs.push({
      key: 'penilaian',
      label: 'Penilaian',
      route: '/penilaian',
      icon: 'grade',
      match: (path) => path.startsWith('/penilaian'),
    })
  } else if (canAccessModule(roles, 'rapor-leger')) {
    tabs.push({
      key: 'rapor',
      label: 'Rapor',
      route: '/rapor-leger',
      icon: 'report',
      match: (path) => path.startsWith('/rapor-leger'),
    })
  } else if (canAccessModule(roles, 'akademik')) {
    tabs.push({
      key: 'akademik',
      label: 'Akademik',
      route: '/akademik',
      icon: 'academic',
      match: (path) => path.startsWith('/akademik'),
    })
  } else {
    tabs.push({
      key: 'rapor',
      label: 'Rapor',
      route: '/rapor-leger',
      icon: 'report',
      match: (path) => path.startsWith('/rapor-leger'),
    })
  }

  // Tab 3: Absensi
  if (canAccessModule(roles, 'absensi')) {
    tabs.push({
      key: 'absensi',
      label: 'Absensi',
      route: '/absensi/rekap',
      icon: 'clipboardCheck',
      match: (path) => path.startsWith('/absensi'),
    })
  } else {
    tabs.push({
      key: 'laporan',
      label: 'Laporan',
      route: '/laporan',
      icon: 'document',
      match: (path) => path.startsWith('/laporan'),
    })
  }

  // Tab 4: Kegiatan Siswa, Jurnal Mengajar, Master Data, or Laporan
  const hasHomeroom = roles.some((r) => (typeof r === 'string' ? r : r.name) === 'walikelas')
  if (hasHomeroom && canAccessModule(roles, 'kegiatan-siswa')) {
    tabs.push({
      key: 'kegiatan',
      label: 'Kegiatan',
      route: '/kegiatan-siswa/keikutsertaan-ekstrakurikuler',
      icon: 'cap',
      match: (path) => path.startsWith('/kegiatan-siswa'),
    })
  } else if (canAccessModule(roles, 'jurnal-mengajar')) {
    tabs.push({
      key: 'jurnal',
      label: 'Jurnal',
      route: '/jurnal-mengajar/jurnal',
      icon: 'journal',
      match: (path) => path.startsWith('/jurnal-mengajar'),
    })
  } else if (canAccessModule(roles, 'master-data')) {
    tabs.push({
      key: 'master-data',
      label: 'Master',
      route: '/master-data/siswa',
      icon: 'layers',
      match: (path) => path.startsWith('/master-data'),
    })
  } else if (canAccessModule(roles, 'laporan')) {
    tabs.push({
      key: 'laporan',
      label: 'Laporan',
      route: '/laporan',
      icon: 'document',
      match: (path) => path.startsWith('/laporan'),
    })
  } else {
    tabs.push({
      key: 'kegiatan',
      label: 'Kegiatan',
      route: '/kegiatan-siswa/keikutsertaan-ekstrakurikuler',
      icon: 'cap',
      match: (path) => path.startsWith('/kegiatan-siswa'),
    })
  }

  // Tab 5: Laporan
  tabs.push({
    key: 'laporan',
    label: 'Laporan',
    route: '/laporan',
    icon: 'document',
    match: (path) => path.startsWith('/laporan'),
  })

  return tabs
}

function MobileBottomNav() {
  const location = useLocation()
  const { roles } = useAuth()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const tabs = useMemo(() => getMobileNavTabs(roles), [roles])

  const otherRoutes = [
    '/master-data',
    '/rapor-leger',
    '/kegiatan-siswa',
    '/jurnal-mengajar',
    '/laporan',
    '/pengaturan',
  ]

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah Mobile">
        <div className="mobile-bottom-nav-inner">
          {tabs.map((tab) => {
            if (tab.isAction) {
              const isActionActive =
                isMoreOpen ||
                (otherRoutes.some((route) => location.pathname.startsWith(route)) &&
                  !tabs.slice(0, 4).some((t) => t.match && t.match(location.pathname)))

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setIsMoreOpen(true)}
                  className={`mobile-nav-item ${isActionActive ? 'active' : ''}`}
                  aria-label={tab.label}
                >
                  <div className="mobile-nav-icon-wrap">
                    <Icon name={tab.icon} />
                  </div>
                  <span className="mobile-nav-label">{tab.label}</span>
                </button>
              )
            }

            const isActive = tab.match ? tab.match(location.pathname) : false

            return (
              <Link
                key={tab.key}
                to={tab.route}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                aria-label={tab.label}
              >
                <div className="mobile-nav-icon-wrap">
                  <Icon name={tab.icon} />
                </div>
                <span className="mobile-nav-label">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Sheet Menu Lainnya */}
      <MobileMoreSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} roles={roles} />
    </>
  )
}

export default MobileBottomNav
