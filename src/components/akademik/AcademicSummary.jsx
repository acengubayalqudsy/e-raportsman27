import Icon from '../common/Icon.jsx'

function AcademicSummary({
  items,
  title = 'Ringkasan Data',
  subtitle = 'Statistik terkini kegiatan akademik',
}) {
  if (!items || items.length === 0) return null

  return (
    <section className="academic-summary-wrapper master-summary-wrapper master-mobile-summary-section" aria-label={title}>
      <div className="academic-summary-header master-summary-header">
        <div className="academic-summary-header-copy master-summary-header-copy">
          <h3 className="academic-summary-title master-summary-title">{title}</h3>
          <span className="academic-summary-desc master-summary-desc">{subtitle}</span>
        </div>
      </div>
      <div className="academic-summary-grid master-summary-grid">
        {items.map((item) => (
          <article className={`academic-summary-card master-summary-card ${item.tone ?? 'green'}`} key={item.title}>
            <span className={`academic-summary-icon master-summary-icon ${item.tone ?? 'green'}`}>
              <Icon name={item.icon} />
            </span>
            <span className="academic-summary-copy master-summary-copy">
              <small>{item.title}</small>
              <strong>{item.value}</strong>
              <span className="academic-summary-caption">
                {item.captionIcon && <Icon name={item.captionIcon} />}
                {item.caption}
              </span>
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AcademicSummary
