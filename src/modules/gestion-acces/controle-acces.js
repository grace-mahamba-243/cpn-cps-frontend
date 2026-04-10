const creerPermission = (code, libelle, description, domaine) => ({
  code,
  libelle,
  description,
  domaine,
})

const PERMISSIONS = Object.freeze({
  TABLEAU_BORD_CONSULTER: 'tableau_bord.consulter',
  PATIENTS_CONSULTER: 'patients.consulter',
  BIBLIOTHEQUE_CONSULTER: 'bibliotheque.consulter',
  ADMIN_UTILISATEURS_GERER: 'administration.utilisateurs.gerer',
  ADMIN_ROLES_GERER: 'administration.roles.gerer',
  ADMIN_ACCES_GERER: 'administration.acces.gerer',
})

const CATALOGUE_PERMISSIONS = Object.freeze([
  creerPermission(
    PERMISSIONS.TABLEAU_BORD_CONSULTER,
    'Consulter le tableau de bord',
    'Autorise l acces au pilotage global et aux indicateurs de service.',
    'Pilotage',
  ),
  creerPermission(
    PERMISSIONS.PATIENTS_CONSULTER,
    'Consulter les patients',
    'Permet d ouvrir la liste des patientes et les resumés individuels.',
    'Soins',
  ),
  creerPermission(
    PERMISSIONS.BIBLIOTHEQUE_CONSULTER,
    'Consulter la bibliotheque UI',
    'Ouvre la bibliotheque de composants utilisee par l equipe produit.',
    'Support',
  ),
  creerPermission(
    PERMISSIONS.ADMIN_UTILISATEURS_GERER,
    'Gerer les utilisateurs',
    'Autorise la modification des profils, roles et statuts des comptes.',
    'Administration',
  ),
  creerPermission(
    PERMISSIONS.ADMIN_ROLES_GERER,
    'Gerer les roles',
    'Permet de configurer les roles fonctionnels exposes dans le frontend.',
    'Administration',
  ),
  creerPermission(
    PERMISSIONS.ADMIN_ACCES_GERER,
    'Gerer les acces',
    'Permet d attribuer ou retirer des permissions specifiques.',
    'Administration',
  ),
])

const ROLES_PAR_DEFAUT = Object.freeze([
  {
    code: 'SUPER_ADMIN',
    libelle: 'Super administrateur',
    description: 'Controle complet sur les modules, les comptes et les permissions.',
    estSysteme: true,
    permissions: CATALOGUE_PERMISSIONS.map((permission) => permission.code),
  },
  {
    code: 'ADMIN',
    libelle: 'Administrateur',
    description: 'Administre les comptes et regle les acces applicatifs.',
    estSysteme: true,
    permissions: [
      PERMISSIONS.TABLEAU_BORD_CONSULTER,
      PERMISSIONS.PATIENTS_CONSULTER,
      PERMISSIONS.BIBLIOTHEQUE_CONSULTER,
      PERMISSIONS.ADMIN_UTILISATEURS_GERER,
      PERMISSIONS.ADMIN_ROLES_GERER,
      PERMISSIONS.ADMIN_ACCES_GERER,
    ],
  },
  {
    code: 'SUPERVISEUR',
    libelle: 'Superviseur',
    description: 'Supervise les activités cliniques et consulte les espaces de suivi.',
    estSysteme: true,
    permissions: [
      PERMISSIONS.TABLEAU_BORD_CONSULTER,
      PERMISSIONS.PATIENTS_CONSULTER,
      PERMISSIONS.BIBLIOTHEQUE_CONSULTER,
    ],
  },
  {
    code: 'AGENT_CLINIQUE',
    libelle: 'Agent clinique',
    description: 'Accède aux modules de consultation nécessaires au travail de terrain.',
    estSysteme: true,
    permissions: [PERMISSIONS.TABLEAU_BORD_CONSULTER, PERMISSIONS.PATIENTS_CONSULTER],
  },
  {
    code: 'MEDECIN',
    libelle: 'Medecin',
    description: 'Consulte les espaces cliniques et les indicateurs utiles au suivi.',
    estSysteme: true,
    permissions: [
      PERMISSIONS.TABLEAU_BORD_CONSULTER,
      PERMISSIONS.PATIENTS_CONSULTER,
      PERMISSIONS.BIBLIOTHEQUE_CONSULTER,
    ],
  },
  {
    code: 'RECEPTION',
    libelle: 'Reception',
    description: 'Acces centré sur l accueil et la consultation rapide des dossiers.',
    estSysteme: true,
    permissions: [PERMISSIONS.TABLEAU_BORD_CONSULTER, PERMISSIONS.PATIENTS_CONSULTER],
  },
  {
    code: 'OBSERVATEUR',
    libelle: 'Observateur',
    description: 'Profil lecture seule limite au tableau de bord.',
    estSysteme: true,
    permissions: [PERMISSIONS.TABLEAU_BORD_CONSULTER],
  },
])

const ROLES_ADMINISTRATEURS = Object.freeze(['SUPER_ADMIN', 'ADMIN'])

const ALIAS_CODES_ROLE = Object.freeze({
  SUPERADMIN: 'SUPER_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ADMINISTRATEUR: 'ADMIN',
  ADMINISTRATRICE: 'ADMIN',
  SUPERVISEUR: 'SUPERVISEUR',
  SUPERVISION: 'SUPERVISEUR',
  AGENT_CLINIQUE: 'AGENT_CLINIQUE',
  AGENT: 'AGENT_CLINIQUE',
  CLINICIEN: 'AGENT_CLINIQUE',
  MEDECIN: 'MEDECIN',
  DOCTEUR: 'MEDECIN',
  RECEPTION: 'RECEPTION',
  ACCUEIL: 'RECEPTION',
  OBSERVATEUR: 'OBSERVATEUR',
  AUDIT: 'OBSERVATEUR',
})

function normaliserCodeRole(role) {
  if (!role || typeof role !== 'string') {
    return null
  }

  const code = role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return ALIAS_CODES_ROLE[code] ?? code
}

function clonerRole(role) {
  return {
    ...role,
    permissions: [...role.permissions],
  }
}

function obtenirRolesActifs(rolesPersonnalises = []) {
  if (!Array.isArray(rolesPersonnalises) || rolesPersonnalises.length === 0) {
    return ROLES_PAR_DEFAUT.map(clonerRole)
  }

  return rolesPersonnalises.map((role) => ({
    ...role,
    permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
  }))
}

function obtenirRoleParCode(roleCode, rolesPersonnalises = []) {
  const codeNormalise = normaliserCodeRole(roleCode)
  const roles = obtenirRolesActifs(rolesPersonnalises)

  if (!codeNormalise) {
    return roles.find((role) => role.code === 'OBSERVATEUR') ?? null
  }

  return roles.find((role) => role.code === codeNormalise) ?? null
}

function calculerPermissionsUtilisateur(utilisateur, rolesPersonnalises = []) {
  const role = obtenirRoleParCode(utilisateur?.roleCode ?? utilisateur?.role, rolesPersonnalises)
  const permissions = new Set(role?.permissions ?? [])
  const ajoutes = utilisateur?.accesSpecifiques?.ajoutes ?? []
  const retires = utilisateur?.accesSpecifiques?.retires ?? []

  ajoutes.forEach((permission) => permissions.add(permission))
  retires.forEach((permission) => permissions.delete(permission))

  return Array.from(permissions).sort((premierePermission, secondePermission) =>
    premierePermission.localeCompare(secondePermission),
  )
}

function enrichirUtilisateur(utilisateur, rolesPersonnalises = []) {
  if (!utilisateur) {
    return null
  }

  const role = obtenirRoleParCode(utilisateur.roleCode ?? utilisateur.role, rolesPersonnalises)
  const permissions = calculerPermissionsUtilisateur(utilisateur, rolesPersonnalises)

  return {
    ...utilisateur,
    role: role?.libelle ?? utilisateur.role ?? 'Profil non defini',
    roleCode: role?.code ?? normaliserCodeRole(utilisateur.roleCode ?? utilisateur.role) ?? 'OBSERVATEUR',
    permissions,
  }
}

function possedeUnePermission(permissionsUtilisateur = [], permission) {
  return permissionsUtilisateur.includes(permission)
}

function possedeToutesLesPermissions(permissionsUtilisateur = [], permissionsRequises = []) {
  return permissionsRequises.every((permission) => possedeUnePermission(permissionsUtilisateur, permission))
}

function possedeAuMoinsUnePermission(permissionsUtilisateur = [], permissionsRequises = []) {
  return permissionsRequises.some((permission) => possedeUnePermission(permissionsUtilisateur, permission))
}

function verifierAccesParPermissions(permissionsUtilisateur = [], permissionsRequises = [], mode = 'toutes') {
  if (!Array.isArray(permissionsRequises) || permissionsRequises.length === 0) {
    return true
  }

  if (mode === 'une') {
    return possedeAuMoinsUnePermission(permissionsUtilisateur, permissionsRequises)
  }

  return possedeToutesLesPermissions(permissionsUtilisateur, permissionsRequises)
}

function grouperPermissionsParDomaine(catalogue = CATALOGUE_PERMISSIONS) {
  return catalogue.reduce((accumulateur, permission) => {
    const groupeExistant = accumulateur.find((groupe) => groupe.domaine === permission.domaine)

    if (groupeExistant) {
      groupeExistant.permissions.push(permission)
      return accumulateur
    }

    accumulateur.push({
      domaine: permission.domaine,
      permissions: [permission],
    })

    return accumulateur
  }, [])
}

export {
  ALIAS_CODES_ROLE,
  CATALOGUE_PERMISSIONS,
  PERMISSIONS,
  ROLES_ADMINISTRATEURS,
  ROLES_PAR_DEFAUT,
  calculerPermissionsUtilisateur,
  enrichirUtilisateur,
  grouperPermissionsParDomaine,
  normaliserCodeRole,
  obtenirRoleParCode,
  obtenirRolesActifs,
  possedeAuMoinsUnePermission,
  possedeToutesLesPermissions,
  possedeUnePermission,
  verifierAccesParPermissions,
}