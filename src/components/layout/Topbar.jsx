import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import Icon from '../common/Icon.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function PeriodSelectors({ className = '' }) {
  const {
    availableYears,
    availableSemesters,
    selectedYearId,
    selectedSemesterId,
    setSelectedYearId,
    setSelectedSemesterId,
    selectedYear,
    selectedSemester,
    activeAcademicYear,
    activeSemester,
    isLoading,
  } = useAcademicContext()

  const yearDisplay = selectedYear?.name || activeAcademicYear?.name || (isLoading ? 'Memuat...' : 'Belum tersedia')
  const rawSem = selectedSemester?.name || activeSemester?.name || (isLoading ? 'Memuat...' : 'Belum tersedia')
  const semDisplay = rawSem.toLowerCase().startsWith('semester') || rawSem === 'Belum tersedia' || rawSem === 'Memuat...' ? rawSem : `Semester ${rawSem}`

  return (
    <div className={`period-selectors ${className}`} aria-label="Konteks tahun ajaran">
      <div className="period-selector-item">
        <button type="button" title="Tahun Ajaran Aktif">
          {yearDisplay}
          <Icon name="chevron" />
        </button>
        <select
          className="period-native-select"
          value={selectedYearId || ''}
          onChange={(e) => setSelectedYearId(e.target.value)}
          aria-label="Pilih Tahun Ajaran"
        >
          {availableYears.map((yr) => (
            <option key={yr.id} value={yr.id}>
              {yr.name}
            </option>
          ))}
        </select>
      </div>

      <div className="period-selector-item">
        <button type="button" title="Semester Aktif">
          {semDisplay}
          <Icon name="chevron" />
        </button>
        <select
          className="period-native-select"
          value={selectedSemesterId || ''}
          onChange={(e) => setSelectedSemesterId(e.target.value)}
          aria-label="Pilih Semester"
        >
          {availableSemesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.name.toLowerCase().startsWith('semester') ? sem.name : `Semester ${sem.name}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function MobileAcademicCard() {
  const {
    availableYears,
    availableSemesters,
    selectedYearId,
    selectedSemesterId,
    setSelectedYearId,
    setSelectedSemesterId,
    selectedYear,
    selectedSemester,
    activeAcademicYear,
    activeSemester,
    isLoading,
  } = useAcademicContext()

  const yearDisplay = selectedYear?.name || activeAcademicYear?.name || (isLoading ? 'Memuat...' : '2026/2027')
  const rawSem = selectedSemester?.name || activeSemester?.name || (isLoading ? 'Memuat...' : 'Ganjil')
  const semDisplay = rawSem.toLowerCase().startsWith('semester') ? rawSem : `Semester ${rawSem}`

  return (
    <div className="mobile-academic-card" aria-label="Konteks Tahun Pelajaran dan Semester">
      <div className="mobile-academic-col">
        <div className="mobile-academic-content">
          <span className="mobile-academic-label">Tahun Ajaran</span>
          <span className="mobile-academic-value">
            {yearDisplay}
            <Icon name="chevron" className="mobile-academic-chevron" />
          </span>
        </div>
        <select
          className="mobile-academic-native-select"
          value={selectedYearId || ''}
          onChange={(e) => setSelectedYearId(e.target.value)}
          aria-label="Pilih Tahun Ajaran"
        >
          {availableYears.map((yr) => (
            <option key={yr.id} value={yr.id}>
              {yr.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mobile-academic-divider" />

      <div className="mobile-academic-col">
        <div className="mobile-academic-content">
          <span className="mobile-academic-label">Semester</span>
          <span className="mobile-academic-value">
            {semDisplay}
            <Icon name="chevron" className="mobile-academic-chevron" />
          </span>
        </div>
        <select
          className="mobile-academic-native-select"
          value={selectedSemesterId || ''}
          onChange={(e) => setSelectedSemesterId(e.target.value)}
          aria-label="Pilih Semester"
        >
          {availableSemesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.name.toLowerCase().startsWith('semester') ? sem.name : `Semester ${sem.name}`}
            </option>
          ))}
        </select>
      </div>
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
  const initials = getInitials(displayName)

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

  if (compact) {
    return (
      <div className="mobile-user-header-wrap" ref={menuRef}>
        <button
          className="mobile-user-trigger"
          type="button"
          aria-label={`Menu pengguna ${displayName}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <div className="mobile-avatar">
            <span>{initials}</span>
          </div>
          <div className="mobile-user-info">
            <div className="mobile-user-name-row">
              <span className="mobile-user-name">{displayName}</span>
              <Icon name="chevron" className="mobile-chevron-icon" />
            </div>
            <span className="mobile-user-role">{displayRole}</span>
          </div>
        </button>

        {isOpen && (
          <div className="profile-menu mobile-dropdown-menu" role="menu">
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

  return (
    <div className="profile-menu-wrap" ref={menuRef}>
      <button
        className="profile-button"
        type="button"
        aria-label={`Buka menu profil ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="avatar">
          <span>{initials}</span>
        </span>
        <span className="profile-copy">
          <strong>{displayName}</strong>
          <small>{displayRole}</small>
        </span>
        <Icon name="chevron" />
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
      <header className="mobile-app-header-container">
        <div className="mobile-green-header">
          <div className="mobile-green-header-inner">
            <ProfileMenu compact />

            <div className="mobile-header-actions">
              <button
                className="mobile-notification-btn"
                type="button"
                aria-label="Notifikasi"
              >
                <Icon name="bell" />
                <span className="mobile-notification-dot" />
              </button>
            </div>
          </div>
        </div>

        <div className="mobile-academic-card-wrapper">
          <MobileAcademicCard />
        </div>
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
