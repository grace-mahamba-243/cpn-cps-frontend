import { Link } from 'react-router-dom'
import Carte from '../../composants/interface/Carte'

function AccesRefusePage() {
  return (
    <Carte
      titre="Acces refuse"
      description="Vous n'avez pas les autorisations necessaires pour acceder a cette ressource."
    >
      <Link to="/" className="lien-texte">
        Retourner a la connexion
      </Link>
    </Carte>
  )
}

export default AccesRefusePage