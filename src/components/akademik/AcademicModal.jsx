function AcademicModal({ children, description, onClose, title, wide = false }) {
  return (
    <div className="academic-modal-backdrop" role="presentation">
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
}

export default AcademicModal
