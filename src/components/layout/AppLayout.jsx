import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ADAPTIVE_DESKTOP_MIN_WIDTH, LAYOUT_MODE, LAYOUT_MODES } from '../../config/layoutConfig.js'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import MobileAppHeader from './MobileAppHeader.jsx'
import MobileBottomNav from './MobileBottomNav.jsx'
import MobileMoreSheet from './MobileMoreSheet.jsx'
import MobileNotificationSheet from './MobileNotificationSheet.jsx'
import MobileAccountSheet from './MobileAccountSheet.jsx'
import MobileAcademicSheet from './MobileAcademicSheet.jsx'

function getDefaultSidebarOpen(layoutMode, breakpoint) {
  if (layoutMode === LAYOUT_MODES.strict) return true
  if (layoutMode === LAYOUT_MODES.adaptive) return breakpoint.width >= ADAPTIVE_DESKTOP_MIN_WIDTH
  if (layoutMode === LAYOUT_MODES.responsive) return breakpoint.isDesktopLike
  return true
}

function AppLayout() {
  const breakpoint = useBreakpoint()
  const defaultSidebarOpen = getDefaultSidebarOpen(LAYOUT_MODE, breakpoint)
  const [sidebarPreference, setSidebarPreference] = useState(null)
  const sidebarOpen =
    sidebarPreference?.device === breakpoint.device ? sidebarPreference.open : defaultSidebarOpen
  const usesDrawer = LAYOUT_MODE === LAYOUT_MODES.adaptive && breakpoint.isMobile
  const isStrict = LAYOUT_MODE === LAYOUT_MODES.strict

  // Mobile Bottom Sheet States
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isAcademicOpen, setIsAcademicOpen] = useState(false)
  const { roles } = useAuth()

  useEffect(() => {
    if (!usesDrawer || !sidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSidebarPreference({ device: breakpoint.device, open: false })
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [breakpoint.device, sidebarOpen, usesDrawer])

  const closeSidebarOnMobile = () => {
    if (usesDrawer) {
      setSidebarPreference({ device: breakpoint.device, open: false })
    }
  }

  const toggleSidebar = () => {
    if (isStrict) return
    setSidebarPreference({ device: breakpoint.device, open: !sidebarOpen })
  }

  const isAnyLayoutSheetOpen =
    isMoreOpen || isNotificationOpen || isAccountOpen || isAcademicOpen

  useEffect(() => {
    if (!breakpoint.isMobile) {
      document.body.classList.remove('mobile-sheet-open')
      document.body.classList.remove('academic-modal-open')
      return undefined
    }
    const scrollOwner = document.querySelector('.mobile-app-content')
    if (isAnyLayoutSheetOpen) {
      document.body.classList.add('mobile-sheet-open')
      if (scrollOwner) {
        scrollOwner.style.overflowY = 'hidden'
      }
    } else {
      if (!document.querySelector('.master-mobile-sheet-backdrop')) {
        document.body.classList.remove('mobile-sheet-open')
        if (scrollOwner) {
          scrollOwner.style.overflowY = ''
        }
      }
    }
    return () => {
      document.body.classList.remove('mobile-sheet-open')
      if (scrollOwner) {
        scrollOwner.style.overflowY = ''
      }
    }
  }, [isAnyLayoutSheetOpen, breakpoint.isMobile])

  // ==========================================
  // MOBILE APP SHELL (WIDTH <= 767PX)
  // Edlink-inspired / Native iOS App Structure
  // ==========================================
  if (breakpoint.isMobile) {
    return (
      <div className="mobile-app-shell">
        <MobileAppHeader
          onOpenAcademic={() => setIsAcademicOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenAccount={() => setIsAccountOpen(true)}
        />

        <main className="mobile-app-content">
          <Outlet />
        </main>

        <MobileBottomNav
          isNotificationOpen={isNotificationOpen}
          onToggleNotification={() => setIsNotificationOpen((prev) => !prev)}
          isAccountOpen={isAccountOpen}
          onToggleAccount={() => setIsAccountOpen((prev) => !prev)}
          isSheetOpen={isAnyLayoutSheetOpen}
        />

        {/* Coordinated Mobile Bottom Sheets */}
        <MobileMoreSheet
          isOpen={isMoreOpen}
          onClose={() => setIsMoreOpen(false)}
          roles={roles}
        />

        <MobileNotificationSheet
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
        />

        <MobileAccountSheet
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          onOpenAcademic={() => {
            setIsAccountOpen(false)
            setIsAcademicOpen(true)
          }}
        />

        <MobileAcademicSheet
          isOpen={isAcademicOpen}
          onClose={() => setIsAcademicOpen(false)}
        />
      </div>
    )
  }

  // ==========================================
  // DESKTOP & TABLET SHELL (WIDTH >= 768PX)
  // Preserved 100% Unchanged (No Desktop Regression)
  // ==========================================
  const shellClassName = [
    'app-shell',
    `layout-mode-${LAYOUT_MODE}`,
    `layout-device-${breakpoint.device}`,
    usesDrawer ? 'layout-drawer' : '',
    usesDrawer && sidebarOpen ? 'drawer-open' : '',
    !sidebarOpen ? 'sidebar-collapsed' : '',
    isStrict ? 'strict-layout' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClassName}>
      <Sidebar collapsed={!sidebarOpen} onNavigate={closeSidebarOnMobile} />
      <button
        className="sidebar-backdrop"
        onClick={() => setSidebarPreference({ device: breakpoint.device, open: false })}
        type="button"
        aria-label="Tutup sidebar"
      />
      <div className="app-main">
        <Topbar compact={false} onToggle={toggleSidebar} />
        <div className="app-content-wrapper">
          <main className="dashboard-content">
            <Outlet />
          </main>
          <footer className="dashboard-footer">
            <span>{'\u00a9'} 2025 SMAN 27 Garut. All rights reserved.</span>
            <span>Aplikasi Rapor v1.0.0</span>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
