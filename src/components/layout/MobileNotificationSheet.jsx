import { useEffect } from 'react'
import Icon from '../common/Icon.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'

function MobileNotificationSheet({ isOpen, onClose }) {
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

  const yearDisplay = selectedYear?.name || activeAcademicYear?.name || '2024/2025'
  const semDisplay = selectedSemester?.name || activeSemester?.name || 'Genap'

  return (
    <div className="mobile-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="mobile-sheet-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Pusat Notifikasi"
      >
        <div className="mobile-sheet-handle-wrapper">
          <div className="mobile-sheet-handle" />
        </div>

        <div className="mobile-sheet-header">
          <div>
            <h2 className="mobile-sheet-title">Notifikasi</h2>
            <p className="mobile-sheet-subtitle">
              Tahun Ajaran {yearDisplay} • Semester {semDisplay.replace(/^semester\s*/i, '')}
            </p>
          </div>
          <button
            type="button"
            className="mobile-sheet-close-btn"
            onClick={onClose}
            aria-label="Tutup notifikasi"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="mobile-notification-body">
          {/* Real Empty State - No mock notification data per Step 13 */}
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon-box">
              <Icon name="bell" />
            </div>
            <h3 className="mobile-empty-title">Tidak Ada Notifikasi Baru</h3>
            <p className="mobile-empty-desc">
              Pemberitahuan terkini seputar penilaian, kehadiran, dan rapor akan ditampilkan di sini.
            </p>
          </div>
        </div>

        <div className="mobile-sheet-footer">
          <button
            type="button"
            className="mobile-sheet-secondary-btn"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileNotificationSheet
