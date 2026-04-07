import { Outlet } from 'react-router-dom'
import BarreLaterale from '../../composants/navigation/BarreLaterale'
import EnteteApplication from '../../composants/navigation/EnteteApplication'

// Ce composant structure l'espace prive avec la barre laterale, l'entete
// et la zone principale qui accueillent les pages deja autorisees par le routage protege.
function LayoutPrive() {
  return (
    <div className="layout-prive">
      <BarreLaterale />

      <div className="layout-prive__contenu">
        <EnteteApplication />

        <main className="layout-prive__principal">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default LayoutPrive