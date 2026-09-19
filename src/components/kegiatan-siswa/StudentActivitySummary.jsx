import Icon from '../common/Icon.jsx'

function StudentActivitySummary({ items = [] }) {
  return (
    <section className="activity-summary-grid" aria-label="Ringkasan Kegiatan Siswa">
      {items.map((item) => (
        <article className="activity-summary-card" key={item.title}>
          <span className={`activity-summary-icon ${item.tone ?? 'green'}`}>
            <Icon name={item.icon} />
          </span>
          <span className="activity-summary-copy">
            <small>{item.title}</small>
            <strong>{item.value}</strong>
            <span>{item.captionIcon && <Icon name={item.captionIcon} />}{item.caption}</span>
          </span>
        </article>
      ))}
    </section>
  )
}

export default StudentActivitySummary
