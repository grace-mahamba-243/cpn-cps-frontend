import { Link } from 'react-router-dom'
import Carte from '../../composants/interface/Carte'

function PageIntrouvable() {
  return (
    <div className="page-centree">
      <Carte
        titre="Page introuvable"
        description="La route demandee n'existe pas dans ce socle frontend."
      >
        <Link to="/" className="lien-texte">
          Revenir a l'accueil
        </Link>
      </Carte>
    </div>
  )
}

export default PageIntrouvable