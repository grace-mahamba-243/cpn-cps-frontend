function PanneauMarqueConnexion() {
  return (
    <aside className="panneau-marque-connexion">
      <div>
        <div className="panneau-marque-connexion__entete">
          <span className="panneau-marque-connexion__logo">CS</span>
          <h1>Centre de Sante Himbi</h1>
        </div>

        <div className="panneau-marque-connexion__contenu">
          <h2 className="panneau-marque-connexion__titre">Maternal and Child Health Excellence</h2>
          <p className="panneau-marque-connexion__description">
            Un espace clinique numerique pour coordonner les suivis CPN, CPS et les parcours
            de soins avec rigueur.
          </p>
        </div>
      </div>

      <div className="panneau-marque-connexion__certification">
        <span className="panneau-marque-connexion__pastille">OK</span>
        <span className="panneau-marque-connexion__note">Protection certifiee des donnees medicales</span>
      </div>
    </aside>
  )
}

export default PanneauMarqueConnexion