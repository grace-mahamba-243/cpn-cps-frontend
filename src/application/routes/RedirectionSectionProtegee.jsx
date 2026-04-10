import { Navigate, useLocation } from 'react-router-dom'
import Chargement from '../../composants/partages/Chargement'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'
import { obtenirCheminAccueil } from './registreRoutes'

// Ce composant redirige un utilisateur connecté vers la première route autorisée
// d'une section donnée afin de garder les alias cohérents avec son rôle courant.
function RedirectionSectionProtegee({ groupe, redirectionRefusee = '/acces-refuse' }) {
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

  const destination = obtenirCheminAccueil(utilisateurConnecte, {
    groupe,
    fallback: redirectionRefusee,
  })

  return <Navigate to={destination} replace state={{ de: location.pathname }} />
}

export default RedirectionSectionProtegee