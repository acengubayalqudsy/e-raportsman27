import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import sman27Logo from '../../assets/logo/sman-27-garut-logo.png'
import { navItems } from '../../data/navigation.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { canAccessModule } from '../../constants/roles.js'

function Sidebar({ collapsed, onNavigate }) {
  const location = useLocation()
  const { roles } = useAuth()
  const visibleNavItems = navItems.filter((item) => canAccessModule(roles, item.key))

  // Helper to determine the active section key based on pathname
  const getActiveSectionKey = (pathname) => {
    const matched = visibleNavItems.find((item) => {
      if (item.basePath) {
        return pathname.startsWith(item.basePath)
      }
      return pathname === item.route
    })
    return matched?.key || null
  }

  const [prevPathname, setPrevPathname] = useState(location.pathname)
  // Initialize expanded menu to the active section on initial load if it has children
  const [expandedMenu, setExpandedMenu] = useState(() => {
    const activeKey = getActiveSectionKey(location.pathname)
    const activeItem = visibleNavItems.find((item) => item.key === activeKey)
    return activeItem?.children && activeItem.children.length > 0 ? activeKey : null
  })

  // When pathname changes to a DIFFERENT section, auto-expand the new section without an effect
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    const prevSectionKey = getActiveSectionKey(prevPathname)
    const currentSectionKey = getActiveSectionKey(location.pathname)
    if (currentSectionKey !== prevSectionKey) {
      const currentItem = visibleNavItems.find((item) => item.key === currentSectionKey)
      if (currentItem?.children && currentItem.children.length > 0) {
        setExpandedMenu(currentSectionKey)
      } else {
        setExpandedMenu(null)
      }
    }
  }

  const isItemActive = (item) => {
    if (item.basePath) {
      return location.pathname.startsWith(item.basePath)
    }
    return location.pathname === item.route
  }

  const handleParentClick = (e, item) => {
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
      const isCurrentlyExpanded = expandedMenu === item.key

      if (isCurrentlyExpanded) {
        // Toggle CLOSED
        setExpandedMenu(null)
        // If user is already on a route in this section, prevent re-navigation/scroll jump
        if (isItemActive(item)) {
          e.preventDefault()
        }
      } else {
        // Toggle OPEN
        setExpandedMenu(item.key)
        // If already in this section, prevent re-navigating to default route if user is on a subpage
        if (isItemActive(item)) {
          e.preventDefault()
        } else {
          onNavigate?.()
        }
      }
    } else {
      onNavigate?.()
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="school-crest">
          <img src={sman27Logo} alt="Logo SMAN 27 Garut" />
        </div>
        <div className="brand-copy">
          <h1>SMAN 27 GARUT</h1>
          <p>Aplikasi Rapor</p>
        </div>
      </div>

      <div className="sidebar-scroll">
        <nav className="side-nav" aria-label="Navigasi utama">
          {visibleNavItems.map((item) => {
            const active = isItemActive(item)
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = hasChildren && expandedMenu === item.key

            return (
              <div className="nav-group" key={item.key || item.label}>
                <Link
                  className={`nav-item ${active ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
                  onClick={(e) => handleParentClick(e, item)}
                  to={item.route}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="nav-icon-box">
                    {item.iconAsset ? (
                      <img className="nav-icon-image" src={item.iconAsset} alt="" aria-hidden="true" />
                    ) : (
                      <Icon name={item.icon} className="nav-icon-fallback" />
                    )}
                  </div>
                  <span>{item.label}</span>
                  {hasChildren && (
                    <Icon
                      name="chevron"
                      className={`nav-chevron ${isExpanded ? 'expanded' : ''}`}
                    />
                  )}
                </Link>

                {hasChildren && isExpanded && (
                  <div className={`submenu ${item.submenuClass || ''}`}>
                    {item.children.map((subItem) => (
                      <Link
                        className={`submenu-item ${item.submenuItemClass || ''} ${
                          location.pathname === subItem.route ? 'active' : ''
                        }`}
                        key={subItem.route || subItem.label}
                        onClick={onNavigate}
                        to={subItem.route}
                      >
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="academic-card">
          <p>Tahun Ajaran Aktif</p>
          <strong>2024/2025</strong>
          <div className="semester-line">
            <span>Semester</span>
            <b>Genap</b>
          </div>
          <button type="button">
            <Icon name="calendar" />
            Ubah Tahun Ajaran
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
