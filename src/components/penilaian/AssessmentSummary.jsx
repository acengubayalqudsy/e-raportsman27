import Icon from '../common/Icon.jsx'
import { assessmentSummary } from '../../data/penilaian.js'

function AssessmentSummary() {
  return (
    <section className="assessment-summary-grid" aria-label="Ringkasan penilaian">
      {assessmentSummary.map((item) => (
        <article className="assessment-summary-card" key={item.title}>
          <span className={`assessment-summary-icon ${item.tone}`}>
            <Icon name={item.icon} />
          </span>
          <span className="assessment-summary-copy">
            <small>{item.title}</small>
            <strong>{item.value}</strong>
            <span className={item.trend ? 'positive' : ''}>
              <Icon name={item.trend ? 'arrowUp' : item.icon === 'book' ? 'users' : 'user'} />
              {item.caption}
            </span>
          </span>
        </article>
      ))}
    </section>
  )
}

export default AssessmentSummary
