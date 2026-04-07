import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Chargement from '../../composants/partages/Chargement'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'

// Ce composant protege les routes privees, verifie la session en cours
// et redirige vers la connexion, la session expiree ou l'acces refuse selon le contexte.
function RouteProtegee({ rolesAutorises }) {
  const location = useLocation()
  const { estConnecte, estInitialisation, sessionExpiree, utilisateurConnecte } = useAuthentification()

  if (estInitialisation) {
    return <Chargement message="Verification de la session en cours..." />
  }

  if (sessionExpiree) {
    return <Navigate to="/session-expiree" replace state={{ de: location.pathname }} />
  }

  if (!estConnecte) {
    return <Navigate to="/connexion" replace state={{ de: location.pathname }} />
  }

  if (rolesAutorises?.length && !rolesAutorises.includes(utilisateurConnecte?.role)) {
    return <Navigate to="/acces-refuse" replace state={{ de: location.pathname }} />
  }

  return <Outlet />
}

export default RouteProtegee