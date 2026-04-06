function BlocTitrePage({ surtitre, titre, description, actions }) {
  return (
    <header className="bloc-titre-page">
      <div className="bloc-titre-page__contenu">
        {surtitre ? <p className="bloc-titre-page__surtitre">{surtitre}</p> : null}
        <h2 className="bloc-titre-page__titre">{titre}</h2>
        {description ? <p className="bloc-titre-page__description">{description}</p> : null}
      </div>

      {actions ? <div className="bloc-titre-page__actions">{actions}</div> : null}
    </header>
  )
}

export default BlocTitrePage