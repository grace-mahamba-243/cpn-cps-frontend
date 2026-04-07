import { Navigate, Outlet } from 'react-router-dom'
import Chargement from '../../composants/partages/Chargement'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'

// Ce composant reserve certaines routes aux invites et renvoie un utilisateur deja connecte
// vers son espace prive pour eviter l'acces a la page de connexion.
function RouteInviteSeulement({ redirectionConnecte = '/tableau-de-bord' }) {
  const { estConnecte, estInitialisation } = useAuthentification()

  if (estInitialisation) {
    return <Chargement message="Verification de la session en cours..." />
  }

  if (estConnecte) {
    return <Navigate to={redirectionConnecte} replace />
  }

  return <Outlet />
}

export default RouteInviteSeulement