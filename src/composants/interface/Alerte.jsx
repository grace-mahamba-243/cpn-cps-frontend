function Alerte({ type = 'info', titre, children, className }) {
  return (
    <div className={['alerte', `alerte--${type}`, className].filter(Boolean).join(' ')}>
      {titre ? <p className="alerte__titre">{titre}</p> : null}
      <div>{children}</div>
    </div>
  )
}

export default Alerte