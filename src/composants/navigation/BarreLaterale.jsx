import { NavLink } from 'react-router-dom'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'

const liensNavigation = [
  { to: '/tableau-de-bord', label: 'Tableau de bord', abreviation: 'TB' },
  { to: '/patients', label: 'Patients', abreviation: 'PT' },
  { to: '/bibliotheque-composants', label: 'Bibliotheque UI', abreviation: 'UI' },
]

// Ce composant affiche la navigation laterale de l'espace prive, les raccourcis principaux
// et l'action de deconnexion pour la session en cours.
function BarreLaterale() {
  const { deconnexion, utilisateurConnecte } = useAuthentification()

  return (
    <aside className="barre-laterale">
      <div className="barre-laterale__bloc">
        <div>
          <p className="barre-laterale__marque">Centre de Sante Himbi</p>
          <h2 className="barre-laterale__titre">{utilisateurConnecte?.nomAffichage ?? 'Clinical Excellence'}</h2>
        </div>

        <nav className="barre-laterale__navigation" aria-label="Navigation principale">
          {liensNavigation.map((lien) => (
            <NavLink
              key={lien.to}
              to={lien.to}
              className={({ isActive }) =>
                isActive ? 'barre-laterale__lien barre-laterale__lien--actif' : 'barre-laterale__lien'
              }
            >
              <span className="barre-laterale__icone">{lien.abreviation}</span>
              <span>{lien.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="barre-laterale__bas">
        <button type="button" className="barre-laterale__action-principale">
          Nouvelle consultation
        </button>
        <button type="button" className="barre-laterale__deconnexion" onClick={() => deconnexion()}>
          Deconnexion
        </button>
      </div>
    </aside>
  )
}

export default BarreLaterale