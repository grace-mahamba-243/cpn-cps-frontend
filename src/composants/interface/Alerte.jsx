function Alerte({ type = 'info', children }) {
  return <div className={`alerte alerte--${type}`}>{children}</div>
}

export default Alerte