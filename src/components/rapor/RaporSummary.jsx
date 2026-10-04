import Icon from '../common/Icon.jsx'

function RaporSummary({
  items,
  title = 'Ringkasan Data',
  subtitle = 'Statistik terkini rapor',
}) {
  if (!items || items.length === 0) return null

  return (
    <section className="report-summary-wrapper master-summary-wrapper master-mobile-summary-section" aria-label="Ringkasan rapor">
      <div className="report-summary-header master-summary-header">
        <div className="report-summary-header-copy master-summary-header-copy">
          <h3 className="report-summary-title master-summary-title">{title}</h3>
          <span className="report-summary-desc master-summary-desc">{subtitle}</span>
        </div>
      </div>
      <div className="report-summary-grid master-summary-grid">
        {items.map((item) => (
          <article className={`report-summary-card master-summary-card ${item.tone ?? ''}`} key={item.title}>
            <span className={`report-summary-icon master-summary-icon ${item.tone ?? ''}`}>
              <Icon name={item.icon} />
            </span>
            <span className="report-summary-copy master-summary-copy">
              <small>{item.title}</small>
              <strong>{item.value}</strong>
              <span className={`report-summary-caption master-summary-caption ${item.positive ? 'positive' : ''}`}>
                <Icon name={item.captionIcon ?? 'info'} />
                {item.caption}
              </span>
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default RaporSummary
