import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { canAccessModule } from '../../constants/roles.js'

function MobileBottomNav({
  isNotificationOpen = false,
  onToggleNotification,
  isAccountOpen = false,
  onToggleAccount,
  isSheetOpen = false,
}) {
  const location = useLocation()
  const pathname = location.pathname

  const [isScrollHidden, setIsScrollHidden] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)
  const [hasExternalSheet, setHasExternalSheet] = useState(false)
  const lastScrollTopRef = useRef(0)
  const accumulatedDeltaRef = useRef(0)
  const lastScrollDirectionRef = useRef(null)

  // Reset to visible on route navigation during render (React pattern)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setIsScrollHidden(false)
  }

  // Reset accumulated scroll deltas on route change
  useEffect(() => {
    accumulatedDeltaRef.current = 0
    lastScrollDirectionRef.current = null
  }, [pathname])

  // Observe if any modal/sheet is open via document.body class
  useEffect(() => {
    const checkSheet = () => {
      const open =
        document.body.classList.contains('mobile-sheet-open') ||
        document.body.classList.contains('academic-modal-open') ||
        Boolean(document.querySelector('.master-mobile-sheet-backdrop')) ||
        Boolean(document.querySelector('.academic-modal-backdrop')) ||
        Boolean(document.querySelector('.activity-modal-backdrop'))
      setHasExternalSheet(open)
    }

    const observer = new MutationObserver(checkSheet)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    checkSheet()

    return () => observer.disconnect()
  }, [])

  // Auto-hide bottom nav based on scrolling inside .mobile-app-content
  useEffect(() => {
    const scrollOwner = document.querySelector('.mobile-app-content')
    if (!scrollOwner) return undefined

    let ticking = false
    const TOP_THRESHOLD = 24
    const MIN_DIRECTION_DELTA = 8
    const HIDE_AFTER_DOWNWARD = 22
    const SHOW_AFTER_UPWARD = 12

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollTop = scrollOwner.scrollTop
          const previousScrollTop = lastScrollTopRef.current
          const delta = currentScrollTop - previousScrollTop

          // When near the top: ALWAYS SHOW
          if (currentScrollTop <= TOP_THRESHOLD) {
            accumulatedDeltaRef.current = 0
            lastScrollDirectionRef.current = null
            setIsScrollHidden((prev) => (prev ? false : prev))
          } else if (delta > MIN_DIRECTION_DELTA) {
            // Scrolling down with hysteresis
            if (lastScrollDirectionRef.current !== 'down') {
              accumulatedDeltaRef.current = 0
              lastScrollDirectionRef.current = 'down'
            }
            accumulatedDeltaRef.current += delta
            if (accumulatedDeltaRef.current >= HIDE_AFTER_DOWNWARD) {
              setIsScrollHidden((prev) => (!prev ? true : prev))
            }
          } else if (delta < -MIN_DIRECTION_DELTA) {
            // Scrolling up with hysteresis
            if (lastScrollDirectionRef.current !== 'up') {
              accumulatedDeltaRef.current = 0
              lastScrollDirectionRef.current = 'up'
            }
            accumulatedDeltaRef.current += Math.abs(delta)
            if (accumulatedDeltaRef.current >= SHOW_AFTER_UPWARD) {
              setIsScrollHidden((prev) => (prev ? false : prev))
            }
          }

          lastScrollTopRef.current = currentScrollTop
          ticking = false
        })
        ticking = true
      }
    }

    scrollOwner.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollOwner.removeEventListener('scroll', handleScroll)
  }, [])

  const shouldHide =
    isScrollHidden || isSheetOpen || isNotificationOpen || isAccountOpen || hasExternalSheet

  const { user, roles } = useAuth()

  // Khusus role wali kelas: gantikan tab tengah (Akademik) menjadi Absensi
  const isHomeroom =
    user?.primaryRole === 'walikelas' ||
    user?.role === 'Wali Kelas' ||
    (roles.some((r) => (typeof r === 'string' ? r : r.name) === 'walikelas') &&
      !roles.some((r) => (typeof r === 'string' ? r : r.name) === 'admin'))

  const tab3Route = isHomeroom
    ? '/absensi/rekap'
    : (() => {
        if (canAccessModule(roles, 'akademik')) return '/akademik/jadwal-pelajaran'
        if (canAccessModule(roles, 'penilaian')) return '/penilaian/input-nilai'
        if (canAccessModule(roles, 'rapor-leger')) return '/rapor-leger/daftar-rapor'
        if (canAccessModule(roles, 'laporan')) return '/laporan'
        return '/dashboard'
      })()

  const tab3Label = isHomeroom ? 'Absensi' : 'Akademik'
  const tab3Icon = isHomeroom ? 'clipboardCheck' : 'academic'

  const isHomeActive =
    !isNotificationOpen &&
    !isAccountOpen &&
    (pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/dashboard/'))

  const isExploreActive =
    !isNotificationOpen &&
    !isAccountOpen &&
    (pathname === '/jelajah' || pathname.startsWith('/jelajah/'))

  const isTab3Active = isHomeroom
    ? !isNotificationOpen && !isAccountOpen && pathname.startsWith('/absensi')
    : !isNotificationOpen &&
      !isAccountOpen &&
      (pathname.startsWith('/akademik') ||
        pathname.startsWith('/penilaian') ||
        pathname.startsWith('/rapor-leger') ||
        pathname.startsWith('/jurnal-mengajar') ||
        pathname.startsWith('/laporan') ||
        pathname.startsWith('/kegiatan-siswa'))

  return (
    <nav
      className={`mobile-bottom-tabs ${shouldHide ? 'is-hidden' : ''}`}
      aria-label="Navigasi Bawah Aplikasi"
      aria-hidden={shouldHide ? 'true' : undefined}
    >
      <div className="mobile-bottom-tabs-inner">
        {/* Tab 1: Beranda */}
        <Link
          to="/dashboard"
          className={`mobile-tab-btn ${isHomeActive ? 'active' : ''}`}
          aria-label="Beranda"
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <div className="mobile-tab-icon-box">
            <Icon name="home" />
          </div>
          <span className="mobile-tab-label">Beranda</span>
        </Link>

        {/* Tab 2: Jelajah (Education Discovery Route) */}
        <Link
          to="/jelajah"
          className={`mobile-tab-btn ${isExploreActive ? 'active' : ''}`}
          aria-label="Jelajah Pendidikan"
          aria-current={isExploreActive ? 'page' : undefined}
        >
          <div className="mobile-tab-icon-box">
            <Icon name="rocket" />
          </div>
          <span className="mobile-tab-label">Jelajah</span>
        </Link>

        {/* Tab 3: Absensi (Khusus Wali Kelas) / Akademik (Role Lain) */}
        <Link
          to={tab3Route}
          className={`mobile-tab-btn ${isTab3Active ? 'active' : ''}`}
          aria-label={tab3Label}
          aria-current={isTab3Active ? 'page' : undefined}
        >
          <div className="mobile-tab-icon-box">
            <Icon name={tab3Icon} />
          </div>
          <span className="mobile-tab-label">{tab3Label}</span>
        </Link>

        {/* Tab 4: Notifikasi */}
        <button
          type="button"
          onClick={onToggleNotification}
          className={`mobile-tab-btn ${isNotificationOpen ? 'active' : ''}`}
          aria-label="Notifikasi"
          aria-expanded={isNotificationOpen}
          aria-haspopup="dialog"
        >
          <div className="mobile-tab-icon-box">
            <Icon name="bell" />
          </div>
          <span className="mobile-tab-label">Notifikasi</span>
        </button>

        {/* Tab 5: Akun */}
        <button
          type="button"
          onClick={onToggleAccount}
          className={`mobile-tab-btn ${isAccountOpen ? 'active' : ''}`}
          aria-label="Akun dan Profil"
          aria-expanded={isAccountOpen}
          aria-haspopup="dialog"
        >
          <div className="mobile-tab-icon-box">
            <Icon name="user" />
          </div>
          <span className="mobile-tab-label">Akun</span>
        </button>
      </div>
    </nav>
  )
}

export default MobileBottomNav
