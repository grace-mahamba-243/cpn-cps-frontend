import { NavLink } from 'react-router-dom'

const liensNavigation = [
  { to: '/tableau-de-bord', label: 'Tableau de bord', abreviation: 'TB' },
  { to: '/patients', label: 'Patients', abreviation: 'PT' },
  { to: '/bibliotheque-composants', label: 'Bibliotheque UI', abreviation: 'UI' },
]

function BarreLaterale() {
  return (
    <aside className="barre-laterale">
      <div className="barre-laterale__bloc">
        <div>
          <p className="barre-laterale__marque">Centre de Sante Himbi</p>
          <h2 className="barre-laterale__titre">Clinical Excellence</h2>
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
        <NavLink to="/" className="barre-laterale__deconnexion">
          Retour a la connexion
        </NavLink>
      </div>
    </aside>
  )
}

export default BarreLaterale