import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LayoutPrive from '../layouts/LayoutPrive'
import LayoutPublic from '../layouts/LayoutPublic'
import RouteInviteSeulement from './RouteInviteSeulement'
import RouteProtegee from './RouteProtegee'
import PageConnexion from '../../modules/authentification/pages/PageConnexion'
import PageSessionExpiree from '../../modules/authentification/pages/PageSessionExpiree'
import BibliothequeComposantsPage from '../../pages/bibliotheque-composants/BibliothequeComposantsPage'
import PatientsPage from '../../pages/patients/PatientsPage'
import TableauDeBordPage from '../../pages/tableau-de-bord/TableauDeBordPage'
import AccesRefusePage from '../../pages/erreurs/AccesRefusePage'
import PageIntrouvable from '../../pages/erreurs/PageIntrouvable'

// Ce composant centralise le routage de l'application et applique les protections
// des routes publiques et privees selon l'etat courant de la session utilisateur.
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/connexion" replace />} />

        <Route element={<RouteInviteSeulement />}>
          <Route element={<LayoutPublic />}>
            <Route path="/connexion" element={<PageConnexion />} />
          </Route>
        </Route>

        <Route element={<LayoutPublic />}>
          <Route path="/acces-refuse" element={<AccesRefusePage />} />
          <Route path="/session-expiree" element={<PageSessionExpiree />} />
        </Route>

        <Route element={<RouteProtegee />}>
          <Route path="/tableau-de-bord" element={<LayoutPrive />}>
            <Route index element={<TableauDeBordPage />} />
          </Route>

          <Route path="/bibliotheque-composants" element={<LayoutPrive />}>
            <Route index element={<BibliothequeComposantsPage />} />
          </Route>

          <Route path="/patients" element={<LayoutPrive />}>
            <Route index element={<PatientsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<PageIntrouvable />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes