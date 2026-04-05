import { Outlet } from 'react-router-dom'

function LayoutPublic() {
  return (
    <div className="layout-public">
      <main className="conteneur-authentification">
        <Outlet />
      </main>
    </div>
  )
}

export default LayoutPublic