function Bouton({
  children,
  type = 'button',
  variant = 'primaire',
  taille = 'moyen',
  iconeAvant,
  iconeApres,
  pleineLargeur = false,
  ...props
}) {
  const className = [
    'bouton',
    `bouton--${variant}`,
    `bouton--${taille}`,
    pleineLargeur ? 'bouton--pleine-largeur' : '',
    props.className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} {...props} className={className}>
      {iconeAvant ? <span className="bouton__icone">{iconeAvant}</span> : null}
      {children}
      {iconeApres ? <span className="bouton__icone">{iconeApres}</span> : null}
    </button>
  )
}

export default Bouton