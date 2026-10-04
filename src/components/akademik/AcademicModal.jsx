import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function AcademicModal({ children, description, onClose, title, wide = false }) {
  useEffect(() => {
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768
    if (isMobileViewport) {
      document.body.classList.add('mobile-sheet-open')
      document.body.classList.add('academic-modal-open')
    }
    const scrollOwner = document.querySelector('.mobile-app-content')
    const prevOverflow = scrollOwner?.style?.overflowY
    if (isMobileViewport && scrollOwner) {
      scrollOwner.style.overflowY = 'hidden'
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('mobile-sheet-open')
      document.body.classList.remove('academic-modal-open')
      if (isMobileViewport && scrollOwner) {
        scrollOwner.style.overflowY = prevOverflow || ''
      }
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  const modalContent = (
    <div className="academic-modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <section
        aria-labelledby="academic-modal-title"
        aria-modal="true"
        className={`academic-modal ${wide ? 'wide' : ''}`}
        role="dialog"
      >
        <header>
          <div>
            <h3 id="academic-modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button aria-label="Tutup modal" onClick={onClose} type="button">&times;</button>
        </header>
        {children}
      </section>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent
}

export default AcademicModal
