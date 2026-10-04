import { useEffect } from 'react'
import Icon from '../common/Icon.jsx'
import { useAcademicContext } from '../../context/AcademicContext.jsx'

function MobileAcademicSheet({ isOpen, onClose }) {
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

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const yearDisplay = selectedYear?.name || activeAcademicYear?.name || (isLoading ? 'Memuat...' : '2024/2025')
  const rawSem = selectedSemester?.name || activeSemester?.name || (isLoading ? 'Memuat...' : 'Genap')
  const semDisplay = rawSem.toLowerCase().startsWith('semester') ? rawSem : `Semester ${rawSem}`

  return (
    <div className="mobile-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="mobile-sheet-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan Tahun Ajaran dan Semester"
      >
        <div className="mobile-sheet-handle-wrapper">
          <div className="mobile-sheet-handle" />
        </div>

        <div className="mobile-sheet-header">
          <div>
            <h2 className="mobile-sheet-title">Tahun Pelajaran & Semester</h2>
            <p className="mobile-sheet-subtitle">
              Aktif saat ini: <strong>{yearDisplay}</strong> ({semDisplay})
            </p>
          </div>
          <button
            type="button"
            className="mobile-sheet-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="mobile-academic-sheet-body">
          {/* Tahun Ajaran Section */}
          <div className="mobile-academic-form-group">
            <label htmlFor="mobile-academic-year-select" className="mobile-academic-field-label">
              Pilih Tahun Pelajaran
            </label>
            <div className="mobile-academic-select-wrap">
              <select
                id="mobile-academic-year-select"
                className="mobile-academic-sheet-select"
                value={selectedYearId || ''}
                onChange={(e) => setSelectedYearId(e.target.value)}
              >
                {availableYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.name}
                  </option>
                ))}
              </select>
              <Icon name="chevron" className="mobile-select-chevron" />
            </div>
          </div>

          {/* Semester Section */}
          <div className="mobile-academic-form-group">
            <label htmlFor="mobile-academic-semester-select" className="mobile-academic-field-label">
              Pilih Semester
            </label>
            <div className="mobile-academic-select-wrap">
              <select
                id="mobile-academic-semester-select"
                className="mobile-academic-sheet-select"
                value={selectedSemesterId || ''}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
              >
                {availableSemesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name.toLowerCase().startsWith('semester') ? sem.name : `Semester ${sem.name}`}
                  </option>
                ))}
              </select>
              <Icon name="chevron" className="mobile-select-chevron" />
            </div>
          </div>

          <div className="mobile-academic-sheet-actions">
            <button
              type="button"
              className="mobile-sheet-primary-btn"
              onClick={onClose}
            >
              Simpan & Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileAcademicSheet
