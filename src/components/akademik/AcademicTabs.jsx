import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { academicTabs } from '../../data/akademik.js'

function AcademicTabs({ activeKey }) {
  return (
    <nav className="academic-tabs no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi Akademik">
      {academicTabs.map((tab) => (
        <Link
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`academic-tab ${activeKey === tab.key ? 'active' : ''}`}
          key={tab.key}
          to={tab.route}
        >
          <Icon name={tab.icon} />
          <span>{tab.shortLabel ?? tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default AcademicTabs
