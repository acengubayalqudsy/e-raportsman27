import { useEffect, useState } from 'react'
import Icon from '../common/Icon.jsx'
import { createPortal } from 'react-dom'

function FilterSheetContent({
  onClose,
  filterFields = [],
  currentFilters = {},
  onApply,
  onReset,
}) {
  const [draftFilters, setDraftFilters] = useState(currentFilters)

  useEffect(() => {
    // 1. Lock background scrolling on actual mobile scroll owner
    const scrollOwner = document.querySelector('.mobile-app-content')
    const prevOverflow = scrollOwner?.style.overflowY
    if (scrollOwner) {
      scrollOwner.style.overflowY = 'hidden'
    }

    // 2. Notify layout to hide bottom navigation
    document.body.classList.add('mobile-sheet-open')

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
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

  const handleFieldChange = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApply = (e) => {
    e?.preventDefault()
    onApply(draftFilters)
    onClose()
  }

  const handleReset = () => {
    onReset()
    onClose()
  }

  const sheetContent = (
    <div className="master-mobile-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="master-mobile-sheet-container master-mobile-filter-sheet-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filter Data"
      >
        <div className="master-mobile-sheet-handle" />

        <div className="master-mobile-sheet-header">
          <div>
            <h4 className="master-mobile-sheet-title">Filter Data</h4>
            <p className="master-mobile-sheet-subtitle">Sesuaikan kriteria untuk menyaring data</p>
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

        <form className="master-mobile-filter-form" onSubmit={handleApply}>
          <div className="master-mobile-filter-body">
            {filterFields.map((field) => {
              const fieldId = `master-filter-${field.key}`
              return (
                <div key={field.key} className="master-mobile-filter-field">
                  <label htmlFor={fieldId} className="master-mobile-filter-label">
                    {field.label}
                  </label>
                  <div className="master-form-select-wrap">
                    <select
                      id={fieldId}
                      className="master-form-select"
                      disabled={field.disabled}
                      value={draftFilters[field.key] ?? (typeof field.options?.[0] === 'object' ? field.options[0].value : field.options?.[0])}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      {field.options?.map((option, optIdx) => {
                        const optVal = typeof option === 'object' ? option.value : option
                        const optLabel = typeof option === 'object' ? option.label : option
                        return (
                          <option key={optVal ?? optIdx} value={optVal}>
                            {optLabel}
                          </option>
                        )
                      })}
                    </select>
                    <Icon name="chevron" className="master-select-chevron" />
                  </div>
                </div>
              )
            })}
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

function MasterMobileFilterSheet(props) {
  if (!props.isOpen) return null
  return <FilterSheetContent {...props} />
}

export default MasterMobileFilterSheet
