import { matchPath } from 'react-router-dom'
import { normaliserCodeRole, PERMISSIONS, ROLES_ADMINISTRATEURS } from '../../modules/gestion-acces/controle-acces'
import { verifierPolitiqueProtection } from './politiqueProtection'

const ORDRE_SECTIONS_MENU = ['Principal', 'Services', 'Administration', 'Support']

const routesPrivees = [
  {
    path: '/patients',
    label: 'Meres',
    abreviation: 'PT',
    icone: 'person',
    section: 'Principal',
    fil: 'Reception / Liste des meres',
    titre: 'Liste des meres',
    permissions: ['reception.tableau_bord.consulter'],
    modePermissions: 'toutes',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/patients/nouveau',
    label: 'Meres',
    abreviation: 'NM',
    icone: 'person_add',
    section: 'Principal',
    fil: 'Reception / Liste des meres / Creation',
    titre: 'Création dossier mère',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/patients/:mereId',
    label: 'Meres',
    abreviation: 'DM',
    icone: 'description',
    section: 'Principal',
    fil: 'Reception / Liste des meres / Dossier administratif',
    titre: 'Dossier administratif mère',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/patients/:mereId/modifier',
    label: 'Meres',
    abreviation: 'MM',
    icone: 'edit',
    section: 'Principal',
    fil: 'Reception / Liste des meres / Modification',
    titre: 'Modification dossier mère',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/enfants',
    label: 'Enfants',
    abreviation: 'EN',
    icone: 'child_care',
    section: 'Principal',
    fil: 'Reception / Liste des enfants',
    titre: 'Liste des enfants',
    permissions: ['reception.tableau_bord.consulter'],
    modePermissions: 'toutes',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/enfants/nouveau',
    label: 'Enfants',
    abreviation: 'NE',
    icone: 'person_add',
    section: 'Principal',
    fil: 'Reception / Liste des enfants / Creation',
    titre: 'Création dossier enfant',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/enfants/:enfantId',
    label: 'Enfants',
    abreviation: 'DE',
    icone: 'description',
    section: 'Principal',
    fil: 'Reception / Liste des enfants / Dossier administratif',
    titre: 'Dossier administratif enfant',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/reception',
    label: 'Reception',
    abreviation: 'RC',
    icone: 'storefront',
    section: 'Services',
    fil: 'Services / Reception',
    titre: 'Tableau de bord Reception',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: true,
  },
  {
    path: '/rendez-vous',
    label: 'Rendez-vous',
    abreviation: 'RDV',
    icone: 'calendar_today',
    section: 'Services',
    fil: 'Services / Rendez-vous',
    titre: 'Liste des rendez-vous',
    permissions: ['reception.tableau_bord.consulter'],
    modePermissions: 'toutes',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/rendez-vous/:rendezVousId',
    label: 'Rendez-vous',
    abreviation: 'DRV',
    icone: 'event_note',
    section: 'Services',
    fil: 'Services / Rendez-vous / Detail administratif',
    titre: 'Detail rendez-vous',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/rendez-vous/nouveau',
    label: 'Rendez-vous',
    abreviation: 'NRV',
    icone: 'calendar_add_on',
    section: 'Services',
    fil: 'Services / Rendez-vous / Creation',
    titre: 'Planifier un rendez-vous',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/reception/arrivee',
    label: 'Reception',
    abreviation: 'ARR',
    icone: 'how_to_reg',
    section: 'Services',
    fil: 'Services / Reception / Enregistrer une arrivee',
    titre: 'Enregistrer une arrivee',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn',
    label: 'CPN',
    abreviation: 'CPN',
    icone: 'pregnant_woman',
    section: 'Services',
    fil: 'Services / CPN',
    titre: 'Consultations Prénatales',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/cpn/nouveau',
    label: 'CPN',
    abreviation: 'NCPN',
    icone: 'add_circle',
    section: 'Services',
    fil: 'Services / CPN / Ouvrir un dossier',
    titre: 'Ouvrir un dossier CPN',
    permissions: [PERMISSIONS.CPN_GERER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId',
    label: 'CPN',
    abreviation: 'DCPN',
    icone: 'description',
    section: 'Services',
    fil: 'Services / CPN / Dossier',
    titre: 'Dossier CPN',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId/contacts',
    label: 'CPN',
    abreviation: 'LCCPN',
    icone: 'calendar_month',
    section: 'Services',
    fil: 'Services / CPN / Contacts',
    titre: 'Contacts CPN',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId/contacts/nouveau',
    label: 'CPN',
    abreviation: 'NCCPN',
    icone: 'add_circle',
    section: 'Services',
    fil: 'Services / CPN / Nouveau contact',
    titre: 'Nouveau contact CPN',
    permissions: [PERMISSIONS.CPN_GERER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId/contacts/:contactId',
    label: 'CPN',
    abreviation: 'DCCPN',
    icone: 'event_note',
    section: 'Services',
    fil: 'Services / CPN / Detail contact',
    titre: 'Détail contact CPN',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId/info-administrative',
    label: 'CPN',
    abreviation: 'IACPN',
    icone: 'person_book',
    section: 'Services',
    fil: 'Services / CPN / Informations administratives',
    titre: 'Informations administratives',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId/contacts/:contactId/modifier',
    label: 'CPN',
    abreviation: 'MCpnC',
    icone: 'edit',
    section: 'Services',
    fil: 'Services / CPN / Modifier contact',
    titre: 'Modifier un contact CPN',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId/dossier-ouverture',
    label: 'CPN',
    abreviation: 'DOCPN',
    icone: 'folder_open',
    section: 'Services',
    fil: 'Services / CPN / Dossier d\'ouverture',
    titre: 'Dossier d\'ouverture CPN',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/:dossierId/examens',
    label: 'CPN',
    abreviation: 'EXCPN',
    icone: 'biotech',
    section: 'Services',
    fil: 'Services / CPN / Examens',
    titre: 'Examens CPN',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cpn/historique/:patienteId',
    label: 'CPN',
    abreviation: 'HCPN',
    icone: 'history',
    section: 'Services',
    fil: 'Services / CPN / Historique grossesses',
    titre: 'Historique CPN',
    permissions: [PERMISSIONS.CPN_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/accouchements/nouveau',
    label: 'Accouchements',
    abreviation: 'NACC',
    icone: 'add_circle',
    section: 'Services',
    fil: 'Services / Accouchements / Enregistrement',
    titre: 'Enregistrer un accouchement',
    permissions: [PERMISSIONS.ACCOUCHEMENT_GERER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/accouchements/:accouchementId',
    label: 'Accouchements',
    abreviation: 'DACC',
    icone: 'description',
    section: 'Services',
    fil: 'Services / Accouchements / Détail',
    titre: 'Détail accouchement',
    permissions: [PERMISSIONS.ACCOUCHEMENT_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme',
    label: 'CPS Femme',
    abreviation: 'CPS',
    icone: 'support_agent',
    section: 'Services',
    fil: 'Services / CPS Femme',
    titre: 'Suivi postnatal — CPS Femme',
    permissions: [PERMISSIONS.CPS_FEMME_CONSULTER],
    modePermissions: 'une',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/cps-femme/nouveau',
    label: 'CPS Femme',
    abreviation: 'NCPS',
    icone: 'add_circle',
    section: 'Services',
    fil: 'Services / CPS Femme / Ouverture',
    titre: 'Ouvrir un dossier CPS',
    permissions: [PERMISSIONS.CPS_FEMME_GERER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme/:dossierId',
    label: 'CPS Femme',
    abreviation: 'DCPS',
    icone: 'description',
    section: 'Services',
    fil: 'Services / CPS Femme / Dossier',
    titre: 'Dossier CPS',
    permissions: [PERMISSIONS.CPS_FEMME_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme/:dossierId/accouchement',
    label: 'CPS Femme',
    abreviation: 'ACPS',
    icone: 'child_friendly',
    section: 'Services',
    fil: 'Services / CPS Femme / Dossier / Accouchement',
    titre: 'Infos accouchement',
    permissions: [PERMISSIONS.CPS_FEMME_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme/:dossierId/visites',
    label: 'CPS Femme',
    abreviation: 'LVCPS',
    icone: 'calendar_month',
    section: 'Services',
    fil: 'Services / CPS Femme / Dossier / Visites',
    titre: 'Visites CPS',
    permissions: [PERMISSIONS.CPS_FEMME_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme/:dossierId/visites/nouvelle',
    label: 'CPS Femme',
    abreviation: 'NVCPS',
    icone: 'add_circle',
    section: 'Services',
    fil: 'Services / CPS Femme / Dossier / Nouvelle visite',
    titre: 'Nouvelle visite CPS',
    permissions: [PERMISSIONS.CPS_FEMME_GERER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme/:dossierId/visites/:visiteId',
    label: 'CPS Femme',
    abreviation: 'DVCPS',
    icone: 'description',
    section: 'Services',
    fil: 'Services / CPS Femme / Dossier / Visite',
    titre: 'Détail visite CPS',
    permissions: [PERMISSIONS.CPS_FEMME_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme/:dossierId/examens',
    label: 'CPS Femme',
    abreviation: 'EXCPS',
    icone: 'biotech',
    section: 'Services',
    fil: 'Services / CPS Femme / Dossier / Examens',
    titre: 'Examens CPS',
    permissions: [PERMISSIONS.CPS_FEMME_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/cps-femme/historique/:patienteId',
    label: 'CPS Femme',
    abreviation: 'HCPS',
    icone: 'history',
    section: 'Services',
    fil: 'Services / CPS Femme / Historique',
    titre: 'Historique CPS',
    permissions: [PERMISSIONS.CPS_FEMME_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/laboratoire',
    label: 'Laboratoire',
    abreviation: 'LABO',
    icone: 'science',
    section: 'Services',
    fil: 'Services / Laboratoire',
    titre: "Laboratoire - Demandes d'examen",
    permissions: [PERMISSIONS.LABORATOIRE_CONSULTER],
    modePermissions: 'une',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/laboratoire/:examenId',
    label: 'Laboratoire',
    abreviation: 'DLab',
    icone: 'biotech',
    section: 'Services',
    fil: 'Services / Laboratoire / Detail demande',
    titre: "Detail demande d'examen",
    permissions: [PERMISSIONS.LABORATOIRE_CONSULTER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/bibliotheque-composants',
    abreviation: 'UI',
    icone: 'inventory_2',
    section: 'Support',
    fil: 'Support / Bibliotheque UI',
    titre: 'Bibliotheque de composants',
    permissions: [PERMISSIONS.BIBLIOTHEQUE_CONSULTER],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: true,
  },
  {
    path: '/admin/utilisateurs',
    label: 'Utilisateurs',
    abreviation: 'US',
    icone: 'group',
    section: 'Administration',
    fil: 'Administration / Utilisateurs',
    titre: 'Gestion des utilisateurs',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [PERMISSIONS.ADMIN_UTILISATEURS_GERER],
    modePermissions: 'toutes',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/admin/utilisateurs/nouveau',
    label: 'Utilisateurs',
    abreviation: 'NU',
    icone: 'person_add',
    section: 'Administration',
    fil: 'Administration / Utilisateurs / Creation',
    titre: 'Créer un nouvel utilisateur',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [PERMISSIONS.ADMIN_UTILISATEURS_GERER],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/admin/utilisateurs/:userId',
    label: 'Utilisateurs',
    abreviation: 'DU',
    icone: 'badge',
    section: 'Administration',
    fil: 'Administration / Utilisateurs / Detail',
    titre: 'Détail utilisateur',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [PERMISSIONS.ADMIN_UTILISATEURS_GERER],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/admin/utilisateurs/:userId/modifier',
    label: 'Utilisateurs',
    abreviation: 'MU',
    icone: 'edit',
    section: 'Administration',
    fil: 'Administration / Utilisateurs / Modification',
    titre: 'Modifier un utilisateur',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [PERMISSIONS.ADMIN_UTILISATEURS_GERER],
    modePermissions: 'toutes',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/admin/roles-acces',
    label: 'Rôles',
    abreviation: 'RA',
    icone: 'admin_panel_settings',
    section: 'Administration',
    fil: 'Administration / Roles',
    titre: 'Liste des rôles',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [
      PERMISSIONS.ADMIN_UTILISATEURS_GERER,
      PERMISSIONS.ADMIN_ROLES_GERER,
      PERMISSIONS.ADMIN_ACCES_GERER,
    ],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: true,
  },
  {
    path: '/admin/roles-acces/nouveau',
    label: 'Rôles',
    abreviation: 'NR',
    icone: 'add_circle',
    section: 'Administration',
    fil: 'Administration / Roles / Creation',
    titre: 'Créer un nouveau rôle',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [PERMISSIONS.ADMIN_ROLES_GERER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: false,
  },
  {
    path: '/admin/roles-acces/:roleCode',
    label: 'Rôles',
    abreviation: 'DR',
    icone: 'manage_accounts',
    section: 'Administration',
    fil: 'Administration / Roles / Detail',
    titre: 'Détail du rôle',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [PERMISSIONS.ADMIN_ROLES_GERER],
    modePermissions: 'une',
    visibleMenu: false,
    visibleEntete: true,
  },
  {
    path: '/admin/journal',
    label: 'Journal',
    abreviation: 'JA',
    icone: 'history',
    section: 'Administration',
    fil: 'Administration / Journal des activites',
    titre: 'Journal des activités',
    groupe: 'admin',
    rolesAutorises: ROLES_ADMINISTRATEURS,
    doitEtreActif: true,
    permissions: [PERMISSIONS.ADMIN_UTILISATEURS_GERER],
    modePermissions: 'toutes',
    visibleMenu: true,
    visibleEntete: true,
  },
]

const routesAdministration = routesPrivees.filter((route) => route.groupe === 'admin')

function trierSectionsMenu(premiereSection, secondeSection) {
  const premierIndex = ORDRE_SECTIONS_MENU.indexOf(premiereSection)
  const secondIndex = ORDRE_SECTIONS_MENU.indexOf(secondeSection)

  if (premierIndex === -1 && secondIndex === -1) {
    return premiereSection.localeCompare(secondeSection)
  }

  if (premierIndex === -1) {
    return 1
  }

  if (secondIndex === -1) {
    return -1
  }

  return premierIndex - secondIndex
}

function estRouteAccessible(utilisateur, route) {
  if (!route) {
    return false
  }

  return verifierPolitiqueProtection({
    estConnecte: Boolean(utilisateur),
    sessionExpiree: false,
    utilisateur,
    permissionsRequises: route.permissions,
    modePermissions: route.modePermissions,
    rolesAutorises: route.rolesAutorises,
    doitEtreActif: route.doitEtreActif,
  }).autorise
}

function filtrerRoutesAutorisees(utilisateur, { groupe, visibleMenuSeulement = false } = {}) {
  return routesPrivees.filter((route) => {
    if (groupe && route.groupe !== groupe) {
      return false
    }

    if (visibleMenuSeulement && !route.visibleMenu) {
      return false
    }

    return estRouteAccessible(utilisateur, route)
  })
}

function obtenirNavigationAutorisee(utilisateur) {
  const sections = filtrerRoutesAutorisees(utilisateur, { visibleMenuSeulement: true }).reduce(
    (accumulateur, route) => {
      const section = route.section ?? 'Navigation'
      const groupe = accumulateur.get(section) ?? []

      groupe.push(route)
      accumulateur.set(section, groupe)

      return accumulateur
    },
    new Map(),
  )

  return Array.from(sections.entries())
    .sort(([premiereSection], [secondeSection]) => trierSectionsMenu(premiereSection, secondeSection))
    .map(([section, items]) => ({ section, items }))
}

function obtenirPremiereRouteAutorisee(utilisateur, options = {}) {
  return filtrerRoutesAutorisees(utilisateur, options)[0] ?? null
}

function obtenirCheminAccueilParProfil(utilisateur) {
  const roleNormalise = normaliserCodeRole(utilisateur?.roleCode ?? utilisateur?.role) ?? ''

  if (roleNormalise === 'RECEPTION') {
    return '/reception'
  }

  return '/reception'
}

function obtenirCheminAccueil(utilisateur, { groupe, fallback = '/acces-refuse' } = {}) {
  if (!groupe) {
    const cheminPreferentiel = obtenirCheminAccueilParProfil(utilisateur)

    if (peutAccederAuChemin(cheminPreferentiel, utilisateur)) {
      return cheminPreferentiel
    }
  }

  return obtenirPremiereRouteAutorisee(utilisateur, { groupe, visibleMenuSeulement: true })?.path ?? fallback
}

function obtenirDefinitionRoute(pathname) {
  return [...routesPrivees]
    .sort((premiereRoute, secondeRoute) => secondeRoute.path.length - premiereRoute.path.length)
    .find((route) => matchPath({ path: route.path, end: true }, pathname))
}

function peutAccederAuChemin(pathname, utilisateur) {
  return estRouteAccessible(utilisateur, obtenirDefinitionRoute(pathname))
}

function obtenirRedirectionApresConnexion(utilisateur, destinationDemandee) {
  if (destinationDemandee && peutAccederAuChemin(destinationDemandee, utilisateur)) {
    return destinationDemandee
  }

  return obtenirCheminAccueil(utilisateur)
}

export {
  estRouteAccessible,
  obtenirCheminAccueil,
  obtenirDefinitionRoute,
  obtenirNavigationAutorisee,
  obtenirPremiereRouteAutorisee,
  obtenirRedirectionApresConnexion,
  peutAccederAuChemin,
  routesAdministration,
  routesPrivees,
}