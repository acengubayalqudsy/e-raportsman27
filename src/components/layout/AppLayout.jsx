import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ADAPTIVE_DESKTOP_MIN_WIDTH, LAYOUT_MODE, LAYOUT_MODES } from '../../config/layoutConfig.js'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import MobileBottomNav from './MobileBottomNav.jsx'

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
        <Topbar compact={usesDrawer} onToggle={toggleSidebar} />
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
      <MobileBottomNav />
    </div>
  )
}

export default AppLayout
