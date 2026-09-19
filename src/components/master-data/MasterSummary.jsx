import Icon from '../common/Icon.jsx'

function MasterSummary({ items }) {
  return (
    <section className="master-summary-grid" aria-label="Ringkasan master data">
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
    </section>
  )
}

export default MasterSummary
