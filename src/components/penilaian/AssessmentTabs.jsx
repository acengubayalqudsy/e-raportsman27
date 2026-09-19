import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { assessmentTabs } from '../../data/penilaian.js'

function AssessmentTabs({ activeKey }) {
  return (
    <nav className="assessment-tabs no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi penilaian">
      {assessmentTabs.map((tab) => (
        <Link
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`assessment-tab ${activeKey === tab.key ? 'active' : ''}`}
          key={tab.key}
          to={tab.route}
        >
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default AssessmentTabs
