import { NavLink } from 'react-router-dom'

function BarreLaterale() {
  return (
    <aside className="barre-laterale">
      <div>
        <p className="barre-laterale__marque">CPN / CPS</p>
        <h2 className="barre-laterale__titre">Navigation</h2>
      </div>

      <nav className="barre-laterale__navigation" aria-label="Navigation principale">
        <NavLink
          to="/tableau-de-bord"
          className={({ isActive }) =>
            isActive ? 'barre-laterale__lien barre-laterale__lien--actif' : 'barre-laterale__lien'
          }
        >
          Tableau de bord
        </NavLink>
      </nav>
    </aside>
  )
}

export default BarreLaterale