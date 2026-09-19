import Icon from '../common/Icon.jsx'

function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span className="breadcrumb-part" key={`${item}-${index}`}>
          {index > 0 && <Icon name="chevron" />}
          {index === items.length - 1 ? <strong>{item}</strong> : <span>{item}</span>}
        </span>
      ))}
    </nav>
  )
}

export default Breadcrumb
