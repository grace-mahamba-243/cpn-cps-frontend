function EtatVide({
  titre = 'Aucune donnee disponible',
  description = 'Le contenu apparaitra ici lorsque les modules seront ajoutes.',
}) {
  return (
    <div className="etat-vide">
      <h3 className="etat-vide__titre">{titre}</h3>
      <p className="etat-vide__description">{description}</p>
    </div>
  )
}

export default EtatVide