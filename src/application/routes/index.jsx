import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LayoutPrive from '../layouts/LayoutPrive'
import LayoutPublic from '../layouts/LayoutPublic'
import ConnexionPage from '../../pages/authentification/ConnexionPage'
import TableauDeBordPage from '../../pages/tableau-de-bord/TableauDeBordPage'
import AccesRefusePage from '../../pages/erreurs/AccesRefusePage'
import PageIntrouvable from '../../pages/erreurs/PageIntrouvable'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LayoutPublic />}>
          <Route index element={<ConnexionPage />} />
          <Route path="/acces-refuse" element={<AccesRefusePage />} />
        </Route>

        <Route path="/tableau-de-bord" element={<LayoutPrive />}>
          <Route index element={<TableauDeBordPage />} />
        </Route>

        <Route path="*" element={<PageIntrouvable />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes