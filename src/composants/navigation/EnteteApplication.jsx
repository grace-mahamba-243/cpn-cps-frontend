import { useLocation, useSearchParams } from 'react-router-dom'
import { obtenirDefinitionRoute } from '../../application/routes/registreRoutes'

// Ce composant affiche le contexte de navigation courant et les onglets visibles selon
// les permissions de la session, avec le profil connecte reflété dans l entete privee.
function EnteteApplication() {
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const contenu = obtenirDefinitionRoute(pathname)
  const valeurRecherche = searchParams.get('q') ?? ''

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
          placeholder={contenu ? `Rechercher dans ${contenu.label.toLowerCase()}...` : 'Rechercher un dossier...'}
          onChange={gererChangementRecherche}
        />
      </div>

      <div className="entete-application__actions">
        <div className="entete-application__separateur" aria-hidden="true" />
      </div>
    </header>
  )
}

export default EnteteApplication