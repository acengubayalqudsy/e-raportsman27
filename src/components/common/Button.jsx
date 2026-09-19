function Button({ children, className = '', type = 'button', ...props }) {
  return (
    <button className={className} type={type} {...props}>
      {children}
    </button>
  )
}

export default Button
