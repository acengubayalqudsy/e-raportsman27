import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../common/Icon.jsx'

function RaporMobileFilterSheetContent({
  onClose,
  classes = [],
  semesters = [],
  statusOptions = [],
  academicYearName = '-',
  currentFilters = { classId: '', semesterId: '', status: '' },
  loadingContext = false,
  allSemesters = [],
  onApply,
  onReset,
}) {
  const [draftFilters, setDraftFilters] = useState(currentFilters)
  const [availableSemesters, setAvailableSemesters] = useState(semesters)

  useEffect(() => {
    const scrollOwner = document.querySelector('.mobile-app-content')
    const prevOverflow = scrollOwner?.style.overflowY
    if (scrollOwner) {
      scrollOwner.style.overflowY = 'hidden'
    }
    document.body.classList.add('mobile-sheet-open')

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      if (scrollOwner) {
        scrollOwner.style.overflowY = prevOverflow || ''
      }
      document.body.classList.remove('mobile-sheet-open')
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleClassChange = (newClassId) => {
    const cls = classes.find((c) => String(c.id) === String(newClassId))
    const yearId = String(cls?.academic_year_id || '')
    const sems = (allSemesters || []).filter((s) => String(s.academic_year_id) === yearId)
    const nextSemesters = sems.length > 0 ? sems : semesters
    const nextSemId = String(
      cls?.semester_id ||
      nextSemesters.find((s) => s.status === 'Aktif')?.id ||
      nextSemesters[0]?.id ||
      draftFilters.semesterId
    )
    setAvailableSemesters(nextSemesters)
    setDraftFilters((prev) => ({
      ...prev,
      classId: newClassId,
      semesterId: nextSemId,
    }))
  }

  const handleFieldChange = (key, value) => {
    if (key === 'classId') {
      handleClassChange(value)
    } else {
      setDraftFilters((prev) => ({ ...prev, [key]: value }))
    }
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    onApply?.(draftFilters)
    onClose?.()
  }

  const handleReset = () => {
    onReset?.()
    onClose?.()
  }

  const sheetContent = (
    <div className="master-mobile-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="master-mobile-sheet-container master-mobile-filter-sheet-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filter Rapor"
      >
        <div className="master-mobile-sheet-handle" />

        <div className="master-mobile-sheet-header">
          <div>
            <h4 className="master-mobile-sheet-title">Filter Rapor</h4>
            <p className="master-mobile-sheet-subtitle">Sesuaikan kriteria untuk menyaring daftar rapor</p>
          </div>
          <button
            type="button"
            className="master-mobile-sheet-close"
            onClick={onClose}
            aria-label="Tutup filter"
          >
            &times;
          </button>
        </div>

        <form className="master-mobile-filter-form" onSubmit={handleSubmit}>
          <div className="master-mobile-filter-body">
            {/* 1. Kelas */}
            <div className="master-mobile-filter-field">
              <label htmlFor="rapor-filter-class" className="master-mobile-filter-label">
                Kelas
              </label>
              <div className="master-form-select-wrap">
                <select
                  id="rapor-filter-class"
                  className="master-form-select"
                  disabled={loadingContext}
                  value={draftFilters.classId}
                  onChange={(e) => handleFieldChange('classId', e.target.value)}
                >
                  <option value="">Pilih kelas</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" className="master-select-chevron" />
              </div>
            </div>

            {/* 2. Status Rapor */}
            <div className="master-mobile-filter-field">
              <label htmlFor="rapor-filter-status" className="master-mobile-filter-label">
                Status Rapor
              </label>
              <div className="master-form-select-wrap">
                <select
                  id="rapor-filter-status"
                  className="master-form-select"
                  value={draftFilters.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  {statusOptions.map(([label, value]) => (
                    <option key={value || 'all'} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" className="master-select-chevron" />
              </div>
            </div>

            {/* 3. Semester */}
            <div className="master-mobile-filter-field">
              <label htmlFor="rapor-filter-semester" className="master-mobile-filter-label">
                Semester
              </label>
              <div className="master-form-select-wrap">
                <select
                  id="rapor-filter-semester"
                  className="master-form-select"
                  disabled={loadingContext}
                  value={draftFilters.semesterId}
                  onChange={(e) => handleFieldChange('semesterId', e.target.value)}
                >
                  <option value="">Pilih semester</option>
                  {availableSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" className="master-select-chevron" />
              </div>
            </div>

            {/* 4. Tahun Ajaran (Authoritative Context) */}
            <div className="master-mobile-filter-field">
              <label htmlFor="rapor-filter-year" className="master-mobile-filter-label">
                Tahun Ajaran
              </label>
              <div className="master-form-select-wrap">
                <input
                  id="rapor-filter-year"
                  readOnly
                  value={academicYearName}
                  aria-label="Tahun ajaran authoritative"
                  className="master-form-select"
                  style={{ cursor: 'default', background: '#F8FAFC', color: '#64748B' }}
                />
              </div>
            </div>
          </div>

          <div className="master-mobile-filter-footer">
            <button
              type="button"
              className="master-mobile-filter-reset-btn"
              onClick={handleReset}
            >
              Reset
            </button>
            <button
              type="submit"
              className="master-mobile-filter-apply-btn"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(sheetContent, document.body)
    : sheetContent
}

function RaporMobileFilterSheet(props) {
  if (!props.isOpen) return null
  return <RaporMobileFilterSheetContent {...props} />
}

export default RaporMobileFilterSheet
