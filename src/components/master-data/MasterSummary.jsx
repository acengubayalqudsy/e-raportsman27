import Icon from '../common/Icon.jsx'

function MasterSummary({
  items,
  title = 'Ringkasan Data',
  subtitle = 'Statistik terkini data master',
}) {
  if (!items || items.length === 0) return null

  return (
    <section className="master-summary-wrapper master-mobile-summary-section" aria-label="Ringkasan master data">
      <div className="master-summary-header">
        <div className="master-summary-header-copy">
          <h3 className="master-summary-title">{title}</h3>
          <span className="master-summary-desc">{subtitle}</span>
        </div>
      </div>
      <div className="master-summary-grid">
        {items.map((item) => (
          <article className={`master-summary-card ${item.tone ?? ''}`} key={item.title}>
            <span className={`master-summary-icon ${item.tone ?? ''}`}>
              <Icon name={item.icon} />
            </span>
            <span className="master-summary-copy">
              <small>{item.title}</small>
              <strong>{item.value}</strong>
              <span className={`master-summary-caption ${item.positive ? 'positive' : ''}`}>
                {item.captionIcon && <Icon name={item.captionIcon} />}
                {item.caption}
              </span>
            </span>
            {item.sparkline && (
              <svg
                aria-hidden="true"
                className="master-summary-sparkline"
                preserveAspectRatio="none"
                viewBox="0 0 52 32"
              >
                <path className="master-summary-sparkline-area" d={`${item.sparkline} V32 H0 Z`} />
                <path className="master-summary-sparkline-line" d={item.sparkline} />
              </svg>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default MasterSummary
