function BadgeEtat({ children, variant = 'primaire' }) {
  return (
    <span className={`badge-etat badge-etat--${variant}`}>
      <span className="badge-etat__point" />
      {children}
    </span>
  )
}

export default BadgeEtat