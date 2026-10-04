import Icon from '../common/Icon.jsx'

function dateLabel(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

function ReportMobileRecordCard({ report, onOpen }) {
  return (
    <article className="report-mobile-card" onClick={onOpen} role="button" tabIndex={0}>
      <div className="report-mobile-card-header">
        <span className="report-mobile-type-badge">
          {report.type_label || 'Laporan'}
        </span>
        <span className="report-mobile-rows-count">
          {report.row_count || 0} baris
        </span>
      </div>

      <div className="report-mobile-card-body">
        <h4 className="report-mobile-card-title">{report.title}</h4>
        <p className="report-mobile-card-context">
          <span className="report-mobile-class-name">{report.class_name || 'Semua Kelas'}</span>
          {report.student_name && <span className="report-mobile-student-name"> · {report.student_name}</span>}
        </p>

        <div className="report-mobile-card-meta">
          <span className="report-mobile-meta-creator">
            <Icon name="user" className="report-mobile-meta-icon" />
            {report.creator_name || 'Sistem'}
          </span>
          <span className="report-mobile-meta-date">
            <Icon name="calendar" className="report-mobile-meta-icon" />
            {dateLabel(report.generated_at)}
          </span>
        </div>
      </div>

      <div className="report-mobile-card-footer">
        <button
          type="button"
          className="report-mobile-view-btn"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          aria-label={`Lihat laporan ${report.title}`}
        >
          <span>Lihat Laporan</span>
          <Icon name="chevron" className="report-mobile-view-icon" />
        </button>
      </div>
    </article>
  )
}

export default ReportMobileRecordCard
