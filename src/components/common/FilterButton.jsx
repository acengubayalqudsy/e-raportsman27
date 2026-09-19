import Button from './Button.jsx'

function FilterButton({ children = 'Filter', className = '', ...props }) {
  return (
    <Button className={className} {...props}>
      {children}
    </Button>
  )
}

export default FilterButton
