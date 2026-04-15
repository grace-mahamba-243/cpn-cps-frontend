import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LayoutPrive from '../layouts/LayoutPrive'
import LayoutPublic from '../layouts/LayoutPublic'
import RedirectionSectionProtegee from './RedirectionSectionProtegee'
import RouteInviteSeulement from './RouteInviteSeulement'
import RouteProtegee from './RouteProtegee'
import PageConnexion from '../../modules/authentification/pages/PageConnexion'
import PageSessionExpiree from '../../modules/authentification/pages/PageSessionExpiree'
import BibliothequeComposantsPage from '../../pages/bibliotheque-composants/BibliothequeComposantsPage'
import PatientsPage from '../../pages/patients/PatientsPage'
import EnfantsPage from '../../pages/patients/EnfantsPage'
import PageCreationDossierMere from '../../pages/patients/PageCreationDossierMere'
import PageCreationDossierEnfant from '../../pages/patients/PageCreationDossierEnfant'
import PageDetailDossierMere from '../../pages/patients/PageDetailDossierMere'
import PageDetailDossierEnfant from '../../pages/patients/PageDetailDossierEnfant'
import AccesRefusePage from '../../pages/erreurs/AccesRefusePage'
import PageIntrouvable from '../../pages/erreurs/PageIntrouvable'
import PageAjoutRole from '../../modules/gestion-acces/pages/PageAjoutRole'
import PageListeRoles from '../../modules/gestion-acces/pages/PageListeRoles'
import PageDetailRole from '../../modules/gestion-acces/pages/PageDetailRole'
import PageListeUtilisateurs from '../../modules/gestion-acces/pages/PageListeUtilisateurs'
import PageAjoutUtilisateur from '../../modules/gestion-acces/pages/PageAjoutUtilisateur'
import PageDetailUtilisateur from '../../modules/gestion-acces/pages/PageDetailUtilisateur'
import PageModifierUtilisateur from '../../modules/gestion-acces/pages/PageModifierUtilisateur'
import PageTableauDeBordReception from '../../modules/reception/pages/PageTableauDeBordReception'
import PageListeRendezVous from '../../modules/rendez-vous/pages/PageListeRendezVous'
import PageDetailRendezVous from '../../modules/rendez-vous/pages/PageDetailRendezVous'
import PageCreationRendezVous from '../../modules/rendez-vous/pages/PageCreationRendezVous'
import PageListeDossiersCpn from '../../modules/cpn/pages/PageListeDossiersCpn'
import PageOuvertureCpn from '../../modules/cpn/pages/PageOuvertureCpn'
import PageDetailDossierCpn from '../../modules/cpn/pages/PageDetailDossierCpn'
import PageNouveauContactCpn from '../../modules/cpn/pages/PageNouveauContactCpn'
import PageDetailContactCpn from '../../modules/cpn/pages/PageDetailContactCpn'
import { routesAdministration, routesPrivees } from './registreRoutes'

const composantsRoutesPrivees = {
  '/bibliotheque-composants': <BibliothequeComposantsPage />,
  '/patients': <PatientsPage />,
  '/patients/nouveau': <PageCreationDossierMere />,
  '/patients/:mereId': <PageDetailDossierMere />,
  '/patients/:mereId/modifier': <PageCreationDossierMere />,
  '/enfants': <EnfantsPage />,
  '/enfants/nouveau': <PageCreationDossierEnfant />,
  '/enfants/:enfantId': <PageDetailDossierEnfant />,
  '/reception': <PageTableauDeBordReception />,
  '/rendez-vous': <PageListeRendezVous />,
  '/rendez-vous/nouveau': <PageCreationRendezVous />,
  '/rendez-vous/:rendezVousId': <PageDetailRendezVous />,
  '/cpn': <PageListeDossiersCpn />,
  '/cpn/nouveau': <PageOuvertureCpn />,
  '/cpn/:dossierId': <PageDetailDossierCpn />,
  '/cpn/:dossierId/contacts/nouveau': <PageNouveauContactCpn />,
  '/cpn/:dossierId/contacts/:contactId': <PageDetailContactCpn />,
  '/admin/utilisateurs': <PageListeUtilisateurs />,
  '/admin/utilisateurs/nouveau': <PageAjoutUtilisateur />,
  '/admin/utilisateurs/:userId': <PageDetailUtilisateur />,
  '/admin/utilisateurs/:userId/modifier': <PageModifierUtilisateur />,
  '/admin/roles-acces': <PageListeRoles />,
  '/admin/roles-acces/nouveau': <PageAjoutRole />,
  '/admin/roles-acces/:roleCode': <PageDetailRole />,
}

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

        <Route path="/admin" element={<RedirectionSectionProtegee groupe="admin" />} />

        {routesAdministration.map((route) => (
          <Route
            key={route.path}
            element={
              <RouteProtegee
                rolesAutorises={route.rolesAutorises}
                permissionsRequises={route.permissions}
                modePermissions={route.modePermissions}
                doitEtreActif={route.doitEtreActif}
              />
            }
          >
            <Route path={route.path} element={<LayoutPrive />}>
              <Route index element={composantsRoutesPrivees[route.path]} />
            </Route>
          </Route>
        ))}

        {routesPrivees
          .filter((route) => route.groupe !== 'admin')
          .map((route) => (
          <Route
            key={route.path}
            element={
              <RouteProtegee
                rolesAutorises={route.rolesAutorises}
                permissionsRequises={route.permissions}
                modePermissions={route.modePermissions}
                doitEtreActif={route.doitEtreActif}
              />
            }
          >
            <Route path={route.path} element={<LayoutPrive />}>
              <Route index element={composantsRoutesPrivees[route.path]} />
            </Route>
          </Route>
        ))}

        <Route path="/gestion-acces" element={<RedirectionSectionProtegee groupe="admin" />} />

        <Route path="*" element={<PageIntrouvable />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes