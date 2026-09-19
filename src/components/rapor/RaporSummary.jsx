import Icon from '../common/Icon.jsx'

function RaporSummary({ items }) {
  return (
    <section className="report-summary-grid" aria-label="Ringkasan rapor">
      {items.map((item) => (
        <article className="report-summary-card" key={item.title}>
          <span className={`report-summary-icon ${item.tone}`}><Icon name={item.icon} /></span>
          <span className="report-summary-copy">
            <small>{item.title}</small>
            <strong>{item.value}</strong>
            <span className={item.positive ? 'positive' : ''}>
              <Icon name={item.captionIcon ?? 'info'} />
              {item.caption}
            </span>
          </span>
        </article>
      ))}
    </section>
  )
}

export default RaporSummary
