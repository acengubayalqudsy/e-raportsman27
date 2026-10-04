import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../common/Icon.jsx'

function MasterMobileActionSheet({
  isOpen,
  onClose,
  title = 'Aksi Data',
  onViewDetail,
  onEdit,
  onDelete,
  extraActions = [],
}) {
  useEffect(() => {
    if (!isOpen) return undefined

    // 1. Lock background scrolling on the actual mobile scroll owner
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
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sheetContent = (
    <div className="master-mobile-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="master-mobile-sheet-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="master-mobile-sheet-handle" />

        <div className="master-mobile-sheet-header">
          <h4 className="master-mobile-sheet-title">{title}</h4>
          <button
            type="button"
            className="master-mobile-sheet-close"
            onClick={onClose}
            aria-label="Tutup menu aksi"
          >
            &times;
          </button>
        </div>

        <div className="master-mobile-sheet-action-list">
          {onViewDetail && (
            <button
              type="button"
              className="master-mobile-action-btn"
              onClick={() => {
                onClose()
                onViewDetail()
              }}
            >
              <Icon name="eye" />
              <span>Lihat Detail</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              className="master-mobile-action-btn"
              onClick={() => {
                onClose()
                onEdit()
              }}
            >
              <Icon name="edit" />
              <span>Edit Data</span>
            </button>
          )}

          {extraActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`master-mobile-action-btn ${action.danger ? 'danger' : ''}`}
              onClick={() => {
                onClose()
                action.onClick()
              }}
            >
              {action.icon && <Icon name={action.icon} />}
              <span>{action.label}</span>
            </button>
          ))}

          {onDelete && (
            <div className="master-mobile-sheet-destructive-section">
              <button
                type="button"
                className="master-mobile-action-btn danger"
                onClick={() => {
                  onClose()
                  onDelete()
                }}
              >
                <Icon name="trash" />
                <span>Hapus Data</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(sheetContent, document.body)
    : sheetContent
}

export default MasterMobileActionSheet
