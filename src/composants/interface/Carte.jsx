function Carte({ titre, description, children }) {
  return (
    <section className="carte">
      {(titre || description) && (
        <header className="carte__entete">
          {titre ? <h2 className="carte__titre">{titre}</h2> : null}
          {description ? <p className="carte__description">{description}</p> : null}
        </header>
      )}

      <div className="carte__contenu">{children}</div>
    </section>
  )
}

export default Carte