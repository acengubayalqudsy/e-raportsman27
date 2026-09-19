import Icon from '../common/Icon.jsx'

function AttendanceSummary({ items = [] }) {
  return (
    <section className="attendance-summary-grid" aria-label="Ringkasan Absensi">
      {items.map((item) => {
        const isPositive = item.positive || item.trend === 'up'

        return (
          <article className="attendance-summary-card" key={item.title}>
            <span className={`attendance-summary-icon ${item.tone ?? 'green'}`}>
              <Icon name={item.icon} />
            </span>
            <span className="attendance-summary-copy">
              <small>{item.title}</small>
              <strong>{item.value}</strong>
              <span className={isPositive ? 'positive' : ''}>
                {(item.captionIcon || item.trend) && <Icon name={item.captionIcon ?? 'arrowUp'} />}
                {item.caption}
              </span>
            </span>
          </article>
        )
      })}
    </section>
  )
}

export default AttendanceSummary
