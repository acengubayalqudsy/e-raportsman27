import Icon from '../common/Icon.jsx'

function AcademicSummary({ items }) {
  return (
    <section className="academic-summary-grid" aria-label="Ringkasan Akademik">
      {items.map((item) => (
        <article className="academic-summary-card" key={item.title}>
          <span className={`academic-summary-icon ${item.tone ?? 'green'}`}>
            <Icon name={item.icon} />
          </span>
          <span className="academic-summary-copy">
            <small>{item.title}</small>
            <strong>{item.value}</strong>
            <span>{item.captionIcon && <Icon name={item.captionIcon} />}{item.caption}</span>
          </span>
        </article>
      ))}
    </section>
  )
}

export default AcademicSummary
