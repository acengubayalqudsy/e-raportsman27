import Icon from '../common/Icon.jsx'
import { assessmentSummary } from '../../data/penilaian.js'

function AssessmentSummary() {
  return (
    <section className="assessment-summary-wrapper master-summary-wrapper master-mobile-summary-section" aria-label="Ringkasan Data Penilaian">
      <div className="assessment-summary-header master-summary-header">
        <div className="assessment-summary-header-copy master-summary-header-copy">
          <h3 className="assessment-summary-title master-summary-title">Ringkasan Data</h3>
          <span className="assessment-summary-desc master-summary-desc">Statistik terkini penilaian</span>
        </div>
      </div>

      <div className="assessment-summary-grid master-summary-grid">
        {assessmentSummary.map((item) => {
          const isMockTrend = item.trend && item.caption?.includes('semester lalu')

          return (
            <article className={`assessment-summary-card master-summary-card ${item.tone}`} key={item.title}>
              <span className={`assessment-summary-icon master-summary-icon ${item.tone}`}>
                <Icon name={item.icon} />
              </span>
              <span className="assessment-summary-copy master-summary-copy">
                <small>{item.title}</small>
                <strong>{item.value}</strong>
                <span className={`assessment-summary-caption ${item.trend && !isMockTrend ? 'positive' : ''}`}>
                  {!isMockTrend && item.trend && <Icon name="arrowUp" />}
                  {isMockTrend ? (
                    <span className="desktop-only-trend">{item.caption}</span>
                  ) : (
                    item.caption
                  )}
                </span>
              </span>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default AssessmentSummary
