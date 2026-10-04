import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import Icon from '../common/Icon.jsx'

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getRoleLabel(role) {
  const normalized = typeof role === 'string' ? role : role?.name || ''
  const roleMap = {
    admin: 'Admin Sistem',
    guru: 'Guru Mata Pelajaran',
    walikelas: 'Wali Kelas',
    kepala_sekolah: 'Kepala Sekolah',
    siswa: 'Siswa',
  }
  return roleMap[normalized] || normalized || 'Pengguna'
}

function MobileAccountSheet({ isOpen, onClose, onOpenAcademic }) {
  const { user, roles, logout } = useAuth()
  const navigate = useNavigate()
  const { selectedYear, selectedSemester, activeAcademicYear, activeSemester } =
    useAcademicContext()

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const displayName = user?.name || 'Administrator'
  const displayRole = user?.role || (roles?.[0] ? getRoleLabel(roles[0]) : 'Pengguna')
  const email = user?.email || 'admin@sman27garut.sch.id'
  const initials = getInitials(displayName)

  const yearDisplay = selectedYear?.name || activeAcademicYear?.name || '2024/2025'
  const rawSem = selectedSemester?.name || activeSemester?.name || 'Genap'
  const semDisplay = rawSem.toLowerCase().startsWith('semester') ? rawSem : `Semester ${rawSem}`

  const handleLogout = () => {
    onClose()
    logout()
    navigate('/login', { replace: true })
  }

  const handleAcademicClick = () => {
    onClose()
    onOpenAcademic?.()
  }

  return (
    <div className="mobile-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="mobile-sheet-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Profil dan Pengaturan Akun"
      >
        <div className="mobile-sheet-handle-wrapper">
          <div className="mobile-sheet-handle" />
        </div>

        <div className="mobile-sheet-header">
          <div>
            <h2 className="mobile-sheet-title">Akun & Profil</h2>
            <p className="mobile-sheet-subtitle">SMAN 27 Garut</p>
          </div>
          <button
            type="button"
            className="mobile-sheet-close-btn"
            onClick={onClose}
            aria-label="Tutup akun"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="mobile-account-body">
          {/* User Profile Card */}
          <div className="mobile-account-user-card">
            <div className="mobile-account-avatar">
              <span>{initials}</span>
            </div>
            <div className="mobile-account-info">
              <strong className="mobile-account-name">{displayName}</strong>
              <span className="mobile-account-role-badge">{displayRole}</span>
              <small className="mobile-account-email">{email}</small>
            </div>
          </div>

          {/* Academic Year Shortcut Card */}
          <div className="mobile-account-section-card">
            <div className="mobile-account-row-content">
              <div className="mobile-account-icon-pill">
                <Icon name="calendar" />
              </div>
              <div className="mobile-account-text">
                <span className="mobile-account-row-title">Tahun Pelajaran & Semester</span>
                <span className="mobile-account-row-desc">
                  {yearDisplay} • {semDisplay}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="mobile-account-action-chip"
              onClick={handleAcademicClick}
              aria-label="Ubah tahun ajaran"
            >
              Ubah
            </button>
          </div>

          {/* Logout Action */}
          <div className="mobile-account-logout-card">
            <button
              type="button"
              className="mobile-account-logout-btn"
              onClick={handleLogout}
              aria-label="Keluar dari akun aplikasi"
            >
              <Icon name="logout" />
              <span>Keluar dari Aplikasi</span>
            </button>
          </div>

          {/* App Version Tag */}
          <div className="mobile-account-version">
            <span>Aplikasi E-Raport SMAN 27 Garut • v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileAccountSheet
