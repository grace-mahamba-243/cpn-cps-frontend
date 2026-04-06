function CarteIndicateur({ titre, valeur, description, variation, variant = 'primaire' }) {
  return (
    <article className={`carte-indicateur carte-indicateur--${variant}`}>
      <p className="carte-indicateur__titre">{titre}</p>
      <div className="carte-indicateur__valeur">{valeur}</div>
      <p>{description}</p>
      {variation ? <p className="carte-indicateur__variation">{variation}</p> : null}
    </article>
  )
}

export default CarteIndicateur