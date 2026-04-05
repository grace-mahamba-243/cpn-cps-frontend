function Bouton({ children, type = 'button', variant = 'primaire', ...props }) {
  const className = ['bouton', `bouton--${variant}`, props.className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} {...props} className={className}>
      {children}
    </button>
  )
}

export default Bouton