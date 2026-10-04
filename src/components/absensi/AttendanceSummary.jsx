import Icon from '../common/Icon.jsx'

function AttendanceSummary({
  items = [],
  title = 'Ringkasan Data',
  subtitle = 'Statistik terkini kehadiran siswa',
}) {
  if (!items || items.length === 0) return null

  return (
    <section className="attendance-summary-wrapper master-summary-wrapper master-mobile-summary-section" aria-label="Ringkasan Absensi">
      <div className="attendance-summary-header master-summary-header">
        <div className="attendance-summary-header-copy master-summary-header-copy">
          <h3 className="attendance-summary-title master-summary-title">{title}</h3>
          <span className="attendance-summary-desc master-summary-desc">{subtitle}</span>
        </div>
      </div>

      <div className="attendance-summary-grid master-summary-grid">
        {items.map((item) => {
          const isPositive = item.positive || item.trend === 'up'

          return (
            <article className={`attendance-summary-card master-summary-card ${item.tone ?? 'green'}`} key={item.title}>
              <span className={`attendance-summary-icon master-summary-icon ${item.tone ?? 'green'}`}>
                <Icon name={item.icon} />
              </span>
              <span className="attendance-summary-copy master-summary-copy">
                <small>{item.title}</small>
                <strong>{item.value}</strong>
                <span className={`attendance-summary-caption ${isPositive ? 'positive' : ''}`}>
                  {(item.captionIcon || item.trend) && <Icon name={item.captionIcon ?? 'arrowUp'} />}
                  {item.caption}
                </span>
              </span>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default AttendanceSummary
