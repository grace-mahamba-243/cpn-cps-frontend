import { useLocation, useSearchParams } from 'react-router-dom'
import { obtenirDefinitionRoute } from '../../application/routes/registreRoutes'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'
import { normaliserCodeRole, PERMISSIONS } from '../../modules/gestion-acces/controle-acces'

// Ce composant affiche le contexte de navigation courant et les onglets visibles selon
// les permissions de la session, avec le profil connecte reflété dans l entete privee.
function EnteteApplication() {
  const { pathname } = useLocation()
  const { utilisateurConnecte } = useAuthentification()
  const [searchParams, setSearchParams] = useSearchParams()
  const contenu = obtenirDefinitionRoute(pathname)
  const valeurRecherche = searchParams.get('q') ?? ''
  const roleNormalise = normaliserCodeRole(utilisateurConnecte?.roleCode ?? utilisateurConnecte?.role) ?? ''
  const permissionsUtilisateur = Array.isArray(utilisateurConnecte?.permissions)
    ? utilisateurConnecte.permissions
    : []
  const aPermissionReception = permissionsUtilisateur.includes(PERMISSIONS.RECEPTION_TABLEAU_BORD_CONSULTER)
  const estProfilReception =
    roleNormalise === 'RECEPTION' ||
    roleNormalise.includes('RECEPTION') ||
    roleNormalise.includes('ACCUEIL')
  const estProfilAdmin =
    roleNormalise === 'SUPER_ADMIN' ||
    roleNormalise === 'ADMIN' ||
    roleNormalise.includes('ADMIN') ||
    permissionsUtilisateur.includes(PERMISSIONS.ADMIN_UTILISATEURS_GERER) ||
    permissionsUtilisateur.includes(PERMISSIONS.ADMIN_ROLES_GERER) ||
    permissionsUtilisateur.includes(PERMISSIONS.ADMIN_ACCES_GERER)

  const gererChangementRecherche = (event) => {
    const prochaineValeur = event.target.value
    const prochainsParametres = new URLSearchParams(searchParams)

    if (prochaineValeur.trim()) {
      prochainsParametres.set('q', prochaineValeur)
    } else {
      prochainsParametres.delete('q')
    }

    setSearchParams(prochainsParametres, { replace: true })
  }

  if (estProfilReception && !estProfilAdmin) {
    return (
      <header className="entete-application">
        <div className="entete-application__recherche">
          <span className="material-symbols-outlined entete-application__recherche-icone" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            className="entete-application__recherche-champ"
            value={valeurRecherche}
            placeholder="Rechercher une patiente ou un dossier..."
            onChange={gererChangementRecherche}
          />
        </div>

        <div className="entete-application__actions" />
      </header>
    )
  }

  return (
    <header className="entete-application">
      <div className="entete-application__recherche">
        <span className="text-lg font-bold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {contenu?.titre ?? ''}
        </span>
      </div>

      <div className="entete-application__actions">
        <div className="entete-application__separateur" aria-hidden="true" />
      </div>
    </header>
  )
}

export default EnteteApplication