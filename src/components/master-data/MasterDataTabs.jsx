import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { masterTabs } from '../../data/masterData.js'

function MasterDataTabs({ activeKey }) {
  return (
    <nav className="master-tabs no-scrollbar scrollbar-none scroll-smooth" aria-label="Navigasi Master Data">
      {masterTabs.map((tab) => (
        <Link
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`master-tab ${activeKey === tab.key ? 'active' : ''}`}
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

export default MasterDataTabs
