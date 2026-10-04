import { useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon.jsx'
import SearchInput from '../common/SearchInput.jsx'
import MasterMobileFilterSheet from './MasterMobileFilterSheet.jsx'

function MasterMobileToolbar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Cari...',
  filterFields = [],
  filters = {},
  onFilterChange,
  onFilterReset,
  activeFilterCount = 0,
  onAdd,
  addLabel = 'Tambah',
  onImport,
  importLabel = 'Import Data',
  onExport,
  exportLabel = 'Export Data',
  exportDisabled = false,
  extraActions = [],
  filterAriaLabel,
  primaryAction,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isOverflowOpen, setIsOverflowOpen] = useState(false)
  const overflowRef = useRef(null)

  // Close overflow dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOverflowOpen) return undefined

    const handleClickOutside = (e) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target)) {
        setIsOverflowOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOverflowOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOverflowOpen])

  const handleApplyFilters = (draftFilters) => {
    Object.entries(draftFilters).forEach(([key, val]) => {
      onFilterChange?.(key, val)
    })
  }

  const hasFilters = filterFields && filterFields.length > 0
  const hasOverflow = Boolean(onImport || onExport || (extraActions && extraActions.length > 0))

  // Clean accessible label for filter button
  const computedFilterAriaLabel =
    filterAriaLabel ||
    (addLabel ? `Filter Data ${addLabel.replace(/^Tambah\s+/i, '')}` : 'Filter Data')

  return (
    <div className="master-mobile-toolbar-wrapper">
      {/* ROW 1: Search (flex: 1) + Filter button */}
      <div className="master-mobile-search-row">
        <div className="master-mobile-search-container">
          <div className="master-mobile-search-input-wrap">
            <SearchInput
              className="master-mobile-search-field"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <Icon name="search" className="master-mobile-search-icon" />
          </div>

          {hasFilters && (
            <button
              type="button"
              className={`master-mobile-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(true)}
              aria-label={computedFilterAriaLabel}
            >
              <Icon name="filter" />
              {activeFilterCount > 0 && (
                <span className="master-mobile-filter-badge">{activeFilterCount}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ROW 2: Wide Primary CTA (Tambah) + Secondary Actions Overflow (⋮) */}
      <div className={`master-mobile-cta-row ${!primaryAction && !onAdd ? 'has-only-overflow' : ''}`}>
        {primaryAction ? (
          primaryAction
        ) : onAdd ? (
          <button
            type="button"
            className="master-mobile-primary-cta"
            onClick={onAdd}
            aria-label={addLabel}
          >
            <Icon name="plus" />
            <span>{addLabel}</span>
          </button>
        ) : null}

        {hasOverflow && (
          <div className="master-mobile-overflow-wrap" ref={overflowRef}>
            <button
              type="button"
              className={`master-mobile-overflow-btn ${isOverflowOpen ? 'active' : ''}`}
              onClick={() => setIsOverflowOpen((prev) => !prev)}
              aria-label="Aksi lainnya"
              aria-expanded={isOverflowOpen}
              aria-haspopup="true"
            >
              <Icon name="moreVertical" />
            </button>

            {isOverflowOpen && (
              <div
                className={`master-mobile-overflow-menu ${!primaryAction && !onAdd ? 'align-left' : 'align-right'}`}
                role="menu"
              >
                {onImport && (
                  <button
                    type="button"
                    className="master-mobile-overflow-item"
                    role="menuitem"
                    onClick={() => {
                      setIsOverflowOpen(false)
                      onImport()
                    }}
                  >
                    <Icon name="download" />
                    <span>{importLabel || 'Import Data'}</span>
                  </button>
                )}

                {onExport && (
                  <button
                    type="button"
                    className="master-mobile-overflow-item"
                    role="menuitem"
                    disabled={exportDisabled}
                    onClick={() => {
                      if (exportDisabled) return
                      setIsOverflowOpen(false)
                      onExport()
                    }}
                  >
                    <Icon name="upload" />
                    <span>{exportLabel || 'Export Data'}</span>
                  </button>
                )}

                {extraActions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="master-mobile-overflow-item"
                    role="menuitem"
                    disabled={action.disabled}
                    onClick={() => {
                      if (action.disabled) return
                      setIsOverflowOpen(false)
                      action.onClick?.()
                    }}
                  >
                    {action.icon && <Icon name={action.icon} />}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet Modal */}
      {hasFilters && (
        <MasterMobileFilterSheet
          activeFilterCount={activeFilterCount}
          filterFields={filterFields}
          filters={filters}
          isOpen={isFilterOpen}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterOpen(false)}
          onReset={onFilterReset}
          title={`Filter ${addLabel.replace(/^Tambah\s+/i, '') || 'Data'}`}
        />
      )}
    </div>
  )
}

export default MasterMobileToolbar
