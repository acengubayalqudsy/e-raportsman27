import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
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
    admin: 'Administrator Sistem',
    guru: 'Guru Mata Pelajaran',
    walikelas: 'Wali Kelas',
    kepala_sekolah: 'Kepala Sekolah',
    siswa: 'Siswa',
  }
  return roleMap[normalized] || normalized || 'Pengguna'
}

function getPageMetadata(pathname) {
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    return { title: 'Beranda', isHome: true }
  }
  if (pathname.startsWith('/jelajah')) {
    return { title: 'Jelajah', isHome: false }
  }
  if (pathname.startsWith('/master-data')) {
    return { title: 'Master Data', isHome: false }
  }
  if (pathname.startsWith('/akademik')) {
    return { title: 'Akademik', isHome: false }
  }
  if (pathname.startsWith('/penilaian')) {
    return { title: 'Penilaian', isHome: false }
  }
  if (pathname.startsWith('/rapor-leger')) {
    return { title: 'Rapor & Leger', isHome: false }
  }
  if (pathname.startsWith('/kegiatan-siswa')) {
    return { title: 'Kegiatan Siswa', isHome: false }
  }
  if (pathname.startsWith('/absensi')) {
    return { title: 'Absensi', isHome: false }
  }
  if (pathname.startsWith('/jurnal-mengajar')) {
    return { title: 'Jurnal Mengajar', isHome: false }
  }
  if (pathname.startsWith('/laporan')) {
    return { title: 'Laporan', isHome: false }
  }
  if (pathname.startsWith('/pengaturan')) {
    return { title: 'Pengaturan', isHome: false }
  }
  return { title: 'E-Raport', isHome: false }
}

function MobileAppHeader({ onOpenNotifications, onOpenAccount }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, roles } = useAuth()

  const displayName = user?.name || 'Administrator'
  const displayRole = user?.role || (roles?.[0] ? getRoleLabel(roles[0]) : 'Administrator Sistem')
  const initials = getInitials(displayName)

  const { title: pageTitle, isHome } = getPageMetadata(location.pathname)

  return (
    <header className="mobile-app-header" aria-label="Header Aplikasi Mobile">
      <div className="mobile-header-bar">
        {isHome ? (
          /* =================================================================
             Edlink-Style Mobile Hero Header (Home/Dashboard)
             ================================================================= */
          <>
            <div className="mobile-hero-identity">
              <button
                type="button"
                className="mobile-hero-avatar-btn"
                onClick={onOpenAccount}
                aria-label={`Profil ${displayName}`}
              >
                <span className="mobile-hero-avatar-text">{initials}</span>
              </button>

              <button
                type="button"
                className="mobile-hero-user-trigger"
                onClick={onOpenAccount}
                aria-label={`Akun ${displayName}, ${displayRole}`}
              >
                <div className="mobile-hero-name-row">
                  <span className="mobile-hero-name">{displayName}</span>
                  <Icon name="chevron" className="mobile-hero-chevron" />
                </div>
                <span className="mobile-hero-role">
                  {displayRole} • SMAN 27 Garut
                </span>
              </button>
            </div>

            <div className="mobile-hero-actions">
              <button
                type="button"
                className="mobile-hero-action-btn"
                onClick={onOpenNotifications}
                aria-label="Lihat Notifikasi"
              >
                <Icon name="bell" />
                <span className="mobile-header-badge-dot" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="mobile-hero-action-btn"
                onClick={() => {
                  /* Reserved for future Chat feature development */
                }}
                aria-label="Pesan dan Obrolan"
                title="Pesan / Chat"
              >
                <Icon name="chat" />
              </button>
            </div>
          </>
        ) : (
          /* =================================================================
             Subpage Header: Back Navigation + Page Title + Notification
             ================================================================= */
          <>
            <div className="mobile-subpage-left">
              <button
                type="button"
                className="mobile-header-back-btn"
                onClick={() => navigate(-1)}
                aria-label="Kembali ke halaman sebelumnya"
              >
                <Icon name="chevronLeft" className="mobile-header-back-icon" />
                <span className="mobile-header-back-text">Kembali</span>
              </button>
            </div>

            <div className="mobile-subpage-center">
              <h1 className="mobile-header-title">{pageTitle}</h1>
            </div>

            <div className="mobile-subpage-right">
              <button
                type="button"
                className="mobile-header-action-btn"
                onClick={onOpenNotifications}
                aria-label="Lihat Notifikasi"
              >
                <Icon name="bell" />
                <span className="mobile-header-badge-dot" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="mobile-header-profile-btn"
                onClick={onOpenAccount}
                aria-label={`Buka Profil ${displayName}`}
              >
                <span className="mobile-header-avatar-initials">{initials}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export default MobileAppHeader
