import Icon from '../common/Icon.jsx'

function JournalSummary({ items = [] }) {
  return (
    <section className="teaching-journal-summary" aria-label="Ringkasan Jurnal Mengajar">
      {items.map((item) => (
        <article className="teaching-journal-summary-card" key={item.key ?? item.title}>
          <span className={`teaching-journal-summary-icon tone-${item.tone ?? 'green'}`}>
            <Icon name={item.icon ?? 'journal'} />
          </span>
          <span className="teaching-journal-summary-copy">
            <small>{item.title}</small>
            <strong>{item.value}</strong>
            <span>{item.caption}</span>
          </span>
        </article>
      ))}
    </section>
  )
}

export default JournalSummary
