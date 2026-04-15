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
  RECEPTION_TABLEAU_BORD_CONSULTER: 'reception.tableau_bord.consulter',
  CPN_CONSULTER: 'cpn.consulter',
  CPN_GERER: 'cpn.gerer',
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
    PERMISSIONS.RECEPTION_TABLEAU_BORD_CONSULTER,
    'Consulter le tableau de bord reception',
    'Autorise l acces a la vue d accueil de la reception et des rendez-vous.',
    'Reception',
  ),
  creerPermission(
    PERMISSIONS.CPN_CONSULTER,
    'Consulter les dossiers CPN',
    'Permet d acceder a la liste et au detail des dossiers de consultation prenatale.',
    'Soins',
  ),
  creerPermission(
    PERMISSIONS.CPN_GERER,
    'Gerer les dossiers CPN',
    'Permet d ouvrir, modifier et enregistrer les contacts et examens CPN.',
    'Soins',
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
      PERMISSIONS.RECEPTION_TABLEAU_BORD_CONSULTER,
      PERMISSIONS.ADMIN_UTILISATEURS_GERER,
      PERMISSIONS.ADMIN_ROLES_GERER,
      PERMISSIONS.ADMIN_ACCES_GERER,
    ],
  },
  {
    code: 'MEDECIN',
    libelle: 'Medecin',
    description: 'Supervise les activites cliniques et accede aux modules medicaux.',
    estSysteme: true,
    permissions: [
      PERMISSIONS.TABLEAU_BORD_CONSULTER,
      PERMISSIONS.PATIENTS_CONSULTER,
      PERMISSIONS.BIBLIOTHEQUE_CONSULTER,
      PERMISSIONS.CPN_CONSULTER,
      PERMISSIONS.CPN_GERER,
    ],
  },
  {
    code: 'SAGE_FEMME',
    libelle: 'Sage-femme',
    description: 'Assure le suivi maternel et neonatal avec acces aux modules cliniques.',
    estSysteme: true,
    permissions: [
      PERMISSIONS.TABLEAU_BORD_CONSULTER,
      PERMISSIONS.PATIENTS_CONSULTER,
      PERMISSIONS.CPN_CONSULTER,
      PERMISSIONS.CPN_GERER,
    ],
  },
  {
    code: 'INFIRMIERE',
    libelle: 'Infirmiere',
    description: 'Intervient dans la prise en charge clinique quotidienne.',
    estSysteme: true,
    permissions: [
      PERMISSIONS.TABLEAU_BORD_CONSULTER,
      PERMISSIONS.PATIENTS_CONSULTER,
      PERMISSIONS.CPN_CONSULTER,
      PERMISSIONS.CPN_GERER,
    ],
  },
  {
    code: 'RECEPTION',
    libelle: 'Reception',
    description: 'Acces centré sur l accueil et la consultation rapide des dossiers.',
    estSysteme: true,
    permissions: [
      PERMISSIONS.TABLEAU_BORD_CONSULTER,
      PERMISSIONS.PATIENTS_CONSULTER,
      PERMISSIONS.RECEPTION_TABLEAU_BORD_CONSULTER,
    ],
  },
])

const ROLES_ADMINISTRATEURS = Object.freeze(['SUPER_ADMIN', 'ADMIN'])

const ALIAS_CODES_ROLE = Object.freeze({
  SUPERADMIN: 'SUPER_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ADMINISTRATEUR: 'ADMIN',
  ADMINISTRATRICE: 'ADMIN',
  MEDECIN: 'MEDECIN',
  DOCTEUR: 'MEDECIN',
  INFIRMIERE: 'INFIRMIERE',
  INFIRMIER: 'INFIRMIERE',
  INFIRMIRE: 'INFIRMIERE',
  INFIRMIER_E: 'INFIRMIERE',
  SAGE_FEMME: 'SAGE_FEMME',
  SAGEFEMME: 'SAGE_FEMME',
  SAGE_FEMMES: 'SAGE_FEMME',
  MAIEUTICIENNE: 'SAGE_FEMME',
  RECEPTION: 'RECEPTION',
  RECEPTIONNISTE: 'RECEPTION',
  RECEPTIONISTE: 'RECEPTION',
  RECEPTIONNIST: 'RECEPTION',
  ACCUEIL: 'RECEPTION',
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
  const rolesSysteme = obtenirRolesActifs([])

  if (!codeNormalise) {
    return roles.find((role) => role.code === 'RECEPTION') ?? null
  }

  const roleTrouve = roles.find((role) => role.code === codeNormalise) ?? null
  const roleSysteme = rolesSysteme.find((role) => role.code === codeNormalise) ?? null

  if (!roleTrouve) {
    return roleSysteme
  }

  if (!roleSysteme) {
    return roleTrouve
  }

  // Les roles systeme conservent toujours leurs permissions minimales.
  return {
    ...roleTrouve,
    permissions: trierCodesPermission([...(roleTrouve.permissions ?? []), ...(roleSysteme.permissions ?? [])]),
  }
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
    roleCode: role?.code ?? normaliserCodeRole(utilisateur.roleCode ?? utilisateur.role) ?? 'RECEPTION',
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