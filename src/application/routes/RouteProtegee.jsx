import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Chargement from '../../composants/partages/Chargement'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'
import { verifierPolitiqueProtection } from './politiqueProtection'

// Ce composant protege les routes privees, verifie la session en cours
// et redirige vers la connexion, la session expiree ou l'acces refuse selon le contexte.
function RouteProtegee({
  rolesAutorises,
  permissionsRequises,
  modePermissions = 'toutes',
  doitEtreActif = false,
}) {
  const location = useLocation()
  const { estConnecte, estInitialisation, sessionExpiree, utilisateurConnecte } = useAuthentification()

  if (estInitialisation) {
    return <Chargement message="Verification de la session en cours..." />
  }

  const decision = verifierPolitiqueProtection({
    estConnecte,
    sessionExpiree,
    utilisateur: utilisateurConnecte,
    permissionsRequises,
    modePermissions,
    rolesAutorises,
    doitEtreActif,
  })

  if (!decision.autorise) {
    return <Navigate to={decision.redirection} replace state={{ de: location.pathname, motif: decision.motif }} />
  }

  return <Outlet />
}

export default RouteProtegee