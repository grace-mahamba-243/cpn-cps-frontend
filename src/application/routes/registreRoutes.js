import { matchPath } from 'react-router-dom'
import { normaliserCodeRole, PERMISSIONS, ROLES_ADMINISTRATEURS } from '../../modules/gestion-acces/controle-acces'
import { verifierPolitiqueProtection } from './politiqueProtection'

const ORDRE_SECTIONS_MENU = ['Principal', 'Services', 'Administration', 'Support']

const routesPrivees = [
  {
    path: '/tableau-de-bord',
    label: 'Dashboard',
    abreviation: 'TB',
    icone: 'dashboard',
    section: 'Principal',
    fil: 'Pilotage / Tableau de bord',
    titre: 'Centre de Sante Himbi',
    permissions: [],
    modePermissions: 'toutes',
    visibleMenu: true,
    visibleEntete: true,
  },
  {
    path: '/patients',
    label: 'Meres',
    abreviation: 'PT',
    icone: 'person',
    section: 'Principal',
    fil: 'Reception / Liste des meres',
    titre: 'Liste des meres',
    permissions: [],
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
    permissions: [],
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
    permissions: [],
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
    path: '/bibliotheque-composants',
    label: 'Bibliotheque UI',
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

  return '/tableau-de-bord'
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