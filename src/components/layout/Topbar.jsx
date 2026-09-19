import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import Icon from '../common/Icon.jsx'
import sman27Logo from '../../assets/logo/sman-27-garut-logo.png'

function PeriodSelectors({ className = '' }) {
  return (
    <div className={`period-selectors ${className}`} aria-label="Konteks tahun ajaran">
      <button type="button">
        2024/2025
        <Icon name="chevron" />
      </button>
      <button type="button">
        Semester Genap
        <Icon name="chevron" />
      </button>
    </div>
  )
}

function ProfileMenu({ compact = false }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const displayName = user?.name || 'Administrator'
  const displayRole = user?.role || 'Super Admin'

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`profile-menu-wrap${compact ? ' profile-menu-wrap-mobile' : ''}`} ref={menuRef}>
      <button
        className={`profile-button${compact ? ' mobile-profile-button' : ''}`}
        type="button"
        aria-label={`Buka menu profil ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="avatar">
          <span>ADM</span>
        </span>
        {!compact && (
          <>
            <span className="profile-copy">
              <strong>{displayName}</strong>
              <small>{displayRole}</small>
            </span>
            <Icon name="chevron" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-account">
            <strong>{displayName}</strong>
            <small>{user?.email || displayRole}</small>
          </div>
          <button type="button" role="menuitem" onClick={handleLogout}>
            <Icon name="logout" />
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}

function Topbar({ compact = false, onToggle }) {
  if (compact) {
    return (
      <header className="topbar mobile-topbar">
        <div className="mobile-topbar-main">
          <div className="mobile-topbar-brand">
            <img src={sman27Logo} alt="Logo SMAN 27 Garut" />
            <span>
              <strong>Aplikasi Rapor</strong>
              <small>SMAN 27 GARUT</small>
            </span>
          </div>

          <div className="mobile-topbar-actions">
            <button className="notification-button" type="button" aria-label="Notifikasi">
              <Icon name="bell" />
              <span>3</span>
            </button>
            <ProfileMenu compact />
          </div>
        </div>

        <PeriodSelectors className="mobile-period-selectors" />
      </header>
    )
  }

  return (
    <header className="topbar">
      <button className="icon-button menu-button" type="button" onClick={onToggle} aria-label="Toggle sidebar">
        <Icon name="menu" />
      </button>

      <div className="topbar-actions">
        <PeriodSelectors />

        <button className="notification-button" type="button" aria-label="Notifikasi">
          <Icon name="bell" />
          <span>3</span>
        </button>

        <ProfileMenu />
      </div>
    </header>
  )
}

export default Topbar
