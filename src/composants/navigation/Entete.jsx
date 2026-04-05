import { Link } from 'react-router-dom'

function Entete() {
  return (
    <header className="entete">
      <div>
        <p className="entete__surtitre">Socle frontend</p>
        <h1 className="entete__titre">Tableau de bord</h1>
      </div>

      <Link to="/" className="entete__action">
        Retour a la connexion
      </Link>
    </header>
  )
}

export default Entete