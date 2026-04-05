import { Outlet } from 'react-router-dom'
import BarreLaterale from '../../composants/navigation/BarreLaterale'
import Entete from '../../composants/navigation/Entete'

function LayoutPrive() {
  return (
    <div className="layout-prive">
      <BarreLaterale />

      <div className="layout-prive__contenu">
        <Entete />

        <main className="layout-prive__principal">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default LayoutPrive