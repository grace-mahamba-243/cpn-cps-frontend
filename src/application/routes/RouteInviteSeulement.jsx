import { Navigate, Outlet } from 'react-router-dom'
import Chargement from '../../composants/partages/Chargement'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'
import { obtenirCheminAccueil } from './registreRoutes'

// Ce composant reserve certaines routes aux invites et renvoie un utilisateur deja connecte
// vers son espace prive pour eviter l'acces a la page de connexion.
function RouteInviteSeulement() {
  const { estConnecte, estInitialisation, utilisateurConnecte } = useAuthentification()

  if (estInitialisation) {
    return <Chargement message="Verification de la session en cours..." />
  }

  if (estConnecte) {
    return <Navigate to={obtenirCheminAccueil(utilisateurConnecte)} replace />
  }

  return <Outlet />
}

export default RouteInviteSeulement