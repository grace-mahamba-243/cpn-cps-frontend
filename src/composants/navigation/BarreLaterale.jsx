import { NavLink } from 'react-router-dom'
import AvatarInitiales from '../interface/AvatarInitiales'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'
import { obtenirNavigationAutorisee } from '../../application/routes/registreRoutes'

function extraireInitiales(nomAffichage = '') {
  return nomAffichage
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((fragment) => fragment[0]?.toUpperCase() ?? '')
    .join('')
}

// Ce composant affiche la navigation laterale de l'espace prive, les raccourcis principaux
// et l'action de deconnexion pour la session en cours.
function BarreLaterale() {
  const { deconnexion, utilisateurConnecte } = useAuthentification()
  const sectionsNavigation = obtenirNavigationAutorisee(utilisateurConnecte)

  return (
    <aside className="barre-laterale">
      <div className="barre-laterale__bloc">
        <div className="barre-laterale__entete-marque">
          <h1 className="barre-laterale__marque-principale">Afia Himbi</h1>
          <p className="barre-laterale__marque">Gestion Medicale</p>
        </div>

        <nav className="barre-laterale__navigation" aria-label="Navigation principale">
          {sectionsNavigation.map(({ section, items }) => (
            <div key={section} className="barre-laterale__section">
              <p className="barre-laterale__section-titre">{section}</p>

              {items.map((lien) => (
                <NavLink
                  key={lien.path}
                  to={lien.path}
                  end={lien.path === '/tableau-de-bord'}
                  className={({ isActive }) =>
                    isActive ? 'barre-laterale__lien barre-laterale__lien--actif' : 'barre-laterale__lien'
                  }
                >
                  <span className="material-symbols-outlined barre-laterale__icone" aria-hidden="true">
                    {lien.icone ?? 'apps'}
                  </span>
                  <span>{lien.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="barre-laterale__bas">
        <button type="button" className="barre-laterale__deconnexion" onClick={() => deconnexion()}>
          <span className="material-symbols-outlined barre-laterale__icone-deconnexion" aria-hidden="true">
            logout
          </span>
          Deconnexion
        </button>

        <div className="barre-laterale__profil-courant">
          <AvatarInitiales
            initiales={extraireInitiales(utilisateurConnecte?.nomAffichage ?? 'UC')}
            taille="moyen"
            variant="secondaire"
          />

          <div className="barre-laterale__profil-texte">
            <p className="barre-laterale__titre">{utilisateurConnecte?.nomAffichage ?? 'Utilisateur'}</p>
            <p className="barre-laterale__role">{utilisateurConnecte?.role ?? 'Profil en cours'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default BarreLaterale