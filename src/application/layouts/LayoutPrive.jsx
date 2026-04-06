import { Outlet } from 'react-router-dom'
import BarreLaterale from '../../composants/navigation/BarreLaterale'
import EnteteApplication from '../../composants/navigation/EnteteApplication'

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