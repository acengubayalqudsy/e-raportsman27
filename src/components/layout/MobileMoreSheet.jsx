import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { canAccessModule } from '../../constants/roles.js'
import { useAcademicContext } from '../../context/AcademicContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

const moreMenuItems = [
  {
    key: 'master-data',
    label: 'Master Data',
    icon: 'layers',
    route: '/master-data/siswa',
    desc: 'Siswa, Guru, Kelas, Mapel',
  },
  {
    key: 'akademik',
    label: 'Akademik',
    icon: 'academic',
    route: '/akademik/jadwal-pelajaran',
    desc: 'Rombel, Penugasan & Jadwal',
  },
  {
    key: 'penilaian',
    label: 'Penilaian',
    icon: 'grade',
    route: '/penilaian/input-nilai',
    desc: 'Input Nilai & Validasi',
  },
  {
    key: 'rapor-leger',
    label: 'Rapor & Leger',
    icon: 'report',
    route: '/rapor-leger',
    desc: 'Cetak Rapor & Leger Nilai',
  },
  {
    key: 'kegiatan-siswa',
    label: 'Kegiatan Siswa',
    icon: 'cap',
    route: '/kegiatan-siswa/keikutsertaan-ekstrakurikuler',
    desc: 'Ekstrakurikuler & Prestasi',
  },
  {
    key: 'absensi',
    label: 'Absensi',
    icon: 'clipboardCheck',
    route: '/absensi/rekap',
    desc: 'Rekap Presensi & Kehadiran',
  },
  {
    key: 'jurnal-mengajar',
    label: 'Jurnal Mengajar',
    icon: 'journal',
    route: '/jurnal-mengajar/jurnal',
    desc: 'Jurnal Guru & Agenda',
  },
  {
    key: 'laporan',
    label: 'Laporan',
    icon: 'document',
    route: '/laporan',
    desc: 'Statistik & Unduh Laporan',
  },
  {
    key: 'pengaturan',
    label: 'Pengaturan',
    icon: 'settings',
    route: '/pengaturan/identitas-sekolah',
    desc: 'Konfigurasi & Profil Sistem',
  },
  {
    key: 'jelajah',
    label: 'Jelajah Berita',
    icon: 'rocket',
    route: '/jelajah',
    desc: 'Informasi & Berita Pendidikan',
  },
]

function MobileMoreSheet({ isOpen, onClose, roles = [] }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { selectedYear, selectedSemester, activeAcademicYear, activeSemester } = useAcademicContext()

  const yearDisplay = selectedYear?.name || activeAcademicYear?.name || '2024/2025'
  const semDisplay = selectedSemester?.name || activeSemester?.name || 'Genap'

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isRouteActive = (route) => {
    const base = route.split('/')[1]
    return location.pathname.startsWith(`/${base}`)
  }

  const handleLogout = () => {
    onClose()
    logout()
  }

  const accessibleItems = moreMenuItems.filter((item) => canAccessModule(roles, item.key))

  return (
    <div className="mobile-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="mobile-sheet-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Jelajah Modul E-Raport"
      >
        <div className="mobile-sheet-handle-wrapper">
          <div className="mobile-sheet-handle" />
        </div>

        <div className="mobile-sheet-header">
          <div>
            <h2 className="mobile-sheet-title">Jelajah E-Raport</h2>
            <p className="mobile-sheet-subtitle">
              Tahun Ajaran {yearDisplay} • Semester {semDisplay.toLowerCase().startsWith('semester') ? semDisplay.replace(/^semester\s*/i, '') : semDisplay}
            </p>
          </div>
          <button
            type="button"
            className="mobile-sheet-close-btn"
            onClick={onClose}
            aria-label="Tutup jelajah"
          >
            <Icon name="close" />
          </button>
        </div>

        {accessibleItems.length > 0 && (
          <div className="mobile-sheet-grid">
            {accessibleItems.map((item) => {
              const active = isRouteActive(item.route)
              return (
                <Link
                  key={item.key}
                  to={item.route}
                  onClick={onClose}
                  className={`mobile-sheet-card ${active ? 'active' : ''}`}
                >
                  <div className={`mobile-sheet-icon-box ${active ? 'active' : ''}`}>
                    <Icon name={item.icon} />
                  </div>
                  <div className="mobile-sheet-card-info">
                    <span className="mobile-sheet-card-label">{item.label}</span>
                    <span className="mobile-sheet-card-desc">{item.desc}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* User Account & App Version Info Section */}
        <div className="mobile-sheet-account-section">
          <div className="mobile-sheet-user-card">
            <div className="mobile-sheet-user-meta">
              <strong>{user?.name || 'Administrator'}</strong>
              <small>{user?.role || 'Pengguna'} • {user?.email || 'SMAN 27 Garut'}</small>
            </div>
            <button
              type="button"
              className="mobile-sheet-logout-btn"
              onClick={handleLogout}
              aria-label="Keluar dari akun"
            >
              <Icon name="logout" />
              <span>Keluar</span>
            </button>
          </div>

          <div className="mobile-sheet-version-tag">
            <span>Aplikasi Rapor SMAN 27 Garut • v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMoreSheet
