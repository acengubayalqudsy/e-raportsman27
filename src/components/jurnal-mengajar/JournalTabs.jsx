import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'
import { journalTabs } from '../../config/journalTabs.js'

function JournalTabs({ activeKey }) {
  return (
    <nav className="teaching-journal-tabs" aria-label="Navigasi Jurnal Mengajar">
      {journalTabs.map((tab) => (
        <Link
          aria-current={activeKey === tab.key ? 'page' : undefined}
          className={`teaching-journal-tab${activeKey === tab.key ? ' active' : ''}`}
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

export default JournalTabs
