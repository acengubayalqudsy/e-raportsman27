import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { raporTabs } from '../../data/rapor.js'

function RaporTabs({ activeKey }) {
  return (
    <nav className="report-tabs no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi Rapor dan Leger">
      {raporTabs.map((tab) => (
        <Link
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`report-tab ${activeKey === tab.key ? 'active' : ''}`}
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

export default RaporTabs
