import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LayoutPrive from '../layouts/LayoutPrive'
import LayoutPublic from '../layouts/LayoutPublic'
import PageConnexion from '../../modules/authentification/pages/PageConnexion'
import PageSessionExpiree from '../../modules/authentification/pages/PageSessionExpiree'
import BibliothequeComposantsPage from '../../pages/bibliotheque-composants/BibliothequeComposantsPage'
import PatientsPage from '../../pages/patients/PatientsPage'
import TableauDeBordPage from '../../pages/tableau-de-bord/TableauDeBordPage'
import AccesRefusePage from '../../pages/erreurs/AccesRefusePage'
import PageIntrouvable from '../../pages/erreurs/PageIntrouvable'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LayoutPublic />}>
          <Route index element={<PageConnexion />} />
          <Route path="/acces-refuse" element={<AccesRefusePage />} />
          <Route path="/session-expiree" element={<PageSessionExpiree />} />
        </Route>

        <Route path="/tableau-de-bord" element={<LayoutPrive />}>
          <Route index element={<TableauDeBordPage />} />
        </Route>

        <Route path="/bibliotheque-composants" element={<LayoutPrive />}>
          <Route index element={<BibliothequeComposantsPage />} />
        </Route>

        <Route path="/patients" element={<LayoutPrive />}>
          <Route index element={<PatientsPage />} />
        </Route>

        <Route path="*" element={<PageIntrouvable />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes