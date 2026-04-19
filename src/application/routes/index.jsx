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
import PageEnregistrementArrivee from '../../modules/rendez-vous/pages/PageEnregistrementArrivee'
import PageListeRendezVous from '../../modules/rendez-vous/pages/PageListeRendezVous'
import PageDetailRendezVous from '../../modules/rendez-vous/pages/PageDetailRendezVous'
import PageCreationRendezVous from '../../modules/rendez-vous/pages/PageCreationRendezVous'
import PageListeDossiersCpn from '../../modules/cpn/pages/PageListeDossiersCpn'
import PageFileAttenteGenerale from '../../modules/tableau-bord-clinique/pages/PageFileAttenteGenerale'
import PageOuvertureCpn from '../../modules/cpn/pages/PageOuvertureCpn'
import PageDetailDossierCpn from '../../modules/cpn/pages/PageDetailDossierCpn'
import PageNouveauContactCpn from '../../modules/cpn/pages/PageNouveauContactCpn'
import PageDetailContactCpn from '../../modules/cpn/pages/PageDetailContactCpn'
import PageInfoAdministrativePatiente from '../../modules/cpn/pages/PageInfoAdministrativePatiente'
import PageDossierOuvertureCpn from '../../modules/cpn/pages/PageDossierOuvertureCpn'
import PageListeContactsCpn from '../../modules/cpn/pages/PageListeContactsCpn'
import PageExamensCpn from '../../modules/cpn/pages/PageExamensCpn'
import PageHistoriqueCpn from '../../modules/cpn/pages/PageHistoriqueCpn'
import PageListeAccouchements from '../../modules/accouchement/pages/PageListeAccouchements'
import PageNouvelAccouchement from '../../modules/accouchement/pages/PageNouvelAccouchement'
import PageDetailAccouchement from '../../modules/accouchement/pages/PageDetailAccouchement'
import PageListeDossiersCpsFemme from '../../modules/cps-femme/pages/PageListeDossiersCpsFemme'
import PageOuvertureCpsFemme from '../../modules/cps-femme/pages/PageOuvertureCpsFemme'
import PageDetailDossierCpsFemme from '../../modules/cps-femme/pages/PageDetailDossierCpsFemme'
import PageInfoAccouchementCps from '../../modules/cps-femme/pages/PageInfoAccouchementCps'
import PageListeVisitesCps from '../../modules/cps-femme/pages/PageListeVisitesCps'
import PageNouvelleVisiteCps from '../../modules/cps-femme/pages/PageNouvelleVisiteCps'
import PageDetailVisiteCps from '../../modules/cps-femme/pages/PageDetailVisiteCps'
import PageExamensCpsFemme from '../../modules/cps-femme/pages/PageExamensCpsFemme'
import PageHistoriqueCpsFemme from '../../modules/cps-femme/pages/PageHistoriqueCpsFemme'
import PageListeDossiersCpsEnfant from '../../modules/cps-enfant/pages/PageListeDossiersCpsEnfant'
import PageOuvertureCpsEnfant from '../../modules/cps-enfant/pages/PageOuvertureCpsEnfant'
import PageDetailDossierCpsEnfant from '../../modules/cps-enfant/pages/PageDetailDossierCpsEnfant'
import PageListeVisitesCpsEnfant from '../../modules/cps-enfant/pages/PageListeVisitesCpsEnfant'
import PageNouvelleVisiteCpsEnfant from '../../modules/cps-enfant/pages/PageNouvelleVisiteCpsEnfant'
import PageDetailVisiteCpsEnfant from '../../modules/cps-enfant/pages/PageDetailVisiteCpsEnfant'
import PageExamensCpsEnfant from '../../modules/cps-enfant/pages/PageExamensCpsEnfant'
import PageJournalActivites from '../../modules/administration/pages/PageJournalActivites'
import PageListeDemandesLaboratoire from '../../modules/laboratoire/pages/PageListeDemandesLaboratoire'
import PageDetailDemandeLaboratoire from '../../modules/laboratoire/pages/PageDetailDemandeLaboratoire'
import PageDetailDossierEnfantModule from '../../modules/dossier-enfant/pages/PageDetailDossierEnfant'
import PageNouveauSuiviEnfant from '../../modules/dossier-enfant/pages/PageNouveauSuiviEnfant'
import PageNouvelleNutritionEnfant from '../../modules/dossier-enfant/pages/PageNouvelleNutritionEnfant'
import PageNouvelleVaccinationEnfant from '../../modules/dossier-enfant/pages/PageNouvelleVaccinationEnfant'
import PageVaccinationsEnfant from '../../modules/dossier-enfant/pages/PageVaccinationsEnfant'
import PageExamensEnfant from '../../modules/dossier-enfant/pages/PageExamensEnfant'
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
  '/reception/arrivee': <PageEnregistrementArrivee />,
  '/rendez-vous': <PageListeRendezVous />,
  '/rendez-vous/nouveau': <PageCreationRendezVous />,
  '/rendez-vous/:rendezVousId': <PageDetailRendezVous />,
  '/file-attente': <PageFileAttenteGenerale />,
  '/cpn': <PageListeDossiersCpn />,
  '/cpn/nouveau': <PageOuvertureCpn />,
  '/cpn/:dossierId': <PageDetailDossierCpn />,
  '/cpn/:dossierId/contacts': <PageListeContactsCpn />,
  '/cpn/:dossierId/contacts/nouveau': <PageNouveauContactCpn />,
  '/cpn/:dossierId/contacts/:contactId': <PageDetailContactCpn />,
  '/cpn/:dossierId/contacts/:contactId/modifier': <PageNouveauContactCpn />,
  '/cpn/:dossierId/examens': <PageExamensCpn />,
  '/cpn/:dossierId/info-administrative': <PageInfoAdministrativePatiente />,
  '/cpn/:dossierId/dossier-ouverture': <PageDossierOuvertureCpn />,
  '/cpn/historique/:patienteId': <PageHistoriqueCpn />,
  '/accouchements': <PageListeAccouchements />,
  '/accouchements/nouveau': <PageNouvelAccouchement />,
  '/accouchements/:accouchementId': <PageDetailAccouchement />,
  '/cps-femme': <PageListeDossiersCpsFemme />,
  '/cps-femme/nouveau': <PageOuvertureCpsFemme />,
  '/cps-femme/:dossierId': <PageDetailDossierCpsFemme />,
  '/cps-femme/:dossierId/accouchement': <PageInfoAccouchementCps />,
  '/cps-femme/:dossierId/visites': <PageListeVisitesCps />,
  '/cps-femme/:dossierId/visites/nouvelle': <PageNouvelleVisiteCps />,
  '/cps-femme/:dossierId/visites/:visiteId': <PageDetailVisiteCps />,
  '/cps-femme/:dossierId/examens': <PageExamensCpsFemme />,
  '/cps-femme/historique/:patienteId': <PageHistoriqueCpsFemme />,
  '/cps-enfant': <PageListeDossiersCpsEnfant />,
  '/cps-enfant/nouveau': <PageOuvertureCpsEnfant />,
  '/cps-enfant/:dossierId': <PageDetailDossierCpsEnfant />,
  '/cps-enfant/:dossierId/visites': <PageListeVisitesCpsEnfant />,
  '/cps-enfant/:dossierId/visites/nouvelle': <PageNouvelleVisiteCpsEnfant />,
  '/cps-enfant/:dossierId/visites/:visiteId': <PageDetailVisiteCpsEnfant />,
  '/cps-enfant/:dossierId/examens': <PageExamensCpsEnfant />,
  '/admin/utilisateurs': <PageListeUtilisateurs />,
  '/admin/utilisateurs/nouveau': <PageAjoutUtilisateur />,
  '/admin/utilisateurs/:userId': <PageDetailUtilisateur />,
  '/admin/utilisateurs/:userId/modifier': <PageModifierUtilisateur />,
  '/admin/roles-acces': <PageListeRoles />,
  '/admin/roles-acces/nouveau': <PageAjoutRole />,
  '/admin/roles-acces/:roleCode': <PageDetailRole />,
  '/admin/journal': <PageJournalActivites />,
  '/laboratoire': <PageListeDemandesLaboratoire />,
  '/laboratoire/:examenId': <PageDetailDemandeLaboratoire />,
  '/dossier-enfant/:enfantId': <PageDetailDossierEnfantModule />,
  '/dossier-enfant/:enfantId/suivis/nouveau': <PageNouveauSuiviEnfant />,
  '/dossier-enfant/:enfantId/nutritions/nouvelle': <PageNouvelleNutritionEnfant />,
  '/dossier-enfant/:enfantId/vaccinations': <PageVaccinationsEnfant />,
  '/dossier-enfant/:enfantId/vaccinations/nouvelle': <PageNouvelleVaccinationEnfant />,
  '/dossier-enfant/:enfantId/examens': <PageExamensEnfant />,
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