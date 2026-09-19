import { Link } from 'react-router-dom'
import Icon from '../common/Icon.jsx'

function SettingsCategoryCards({ activeKey, items }) {
  return (
    <nav aria-label="Kategori pengaturan" className="settings-category-grid">
      {items.map((item) => (
        <article
          className={`settings-category-card settings-tone-${item.tone} ${activeKey === item.key ? 'active' : ''}`}
          key={item.key}
        >
          <span className="settings-category-icon"><Icon name={item.icon} /></span>
          <div>
            <h3>{item.label}</h3>
            <p>{item.description}</p>
          </div>
          <Link aria-current={activeKey === item.key ? 'page' : undefined} to={item.route}>
            Kelola
          </Link>
        </article>
      ))}
    </nav>
  )
}

export default SettingsCategoryCards
