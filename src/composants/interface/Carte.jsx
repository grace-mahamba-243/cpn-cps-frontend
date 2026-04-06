function Carte({ titre, description, actions, children, className, variant = 'standard' }) {
  return (
    <section className={['carte', `carte--${variant}`, className].filter(Boolean).join(' ')}>
      {(titre || description || actions) && (
        <header className="carte__entete">
          <div>
            {titre ? <h2 className="carte__titre">{titre}</h2> : null}
            {description ? <p className="carte__description">{description}</p> : null}
          </div>
          {actions ? <div className="carte__actions">{actions}</div> : null}
        </header>
      )}

      <div className="carte__contenu">{children}</div>
    </section>
  )
}

export default Carte