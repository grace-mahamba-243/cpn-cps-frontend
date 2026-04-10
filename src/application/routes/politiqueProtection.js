import { verifierAccesParPermissions } from '../../modules/gestion-acces/controle-acces'

function verifierPolitiqueProtection({
  estConnecte,
  sessionExpiree,
  utilisateur,
  permissionsRequises,
  modePermissions = 'toutes',
  rolesAutorises,
  doitEtreActif = false,
}) {
  if (sessionExpiree) {
    return {
      autorise: false,
      motif: 'session-expiree',
      redirection: '/session-expiree',
    }
  }

  if (!estConnecte || !utilisateur) {
    return {
      autorise: false,
      motif: 'non-connecte',
      redirection: '/connexion',
    }
  }

  if (doitEtreActif && utilisateur.actif !== true) {
    return {
      autorise: false,
      motif: 'utilisateur-inactif',
      redirection: '/acces-refuse',
    }
  }

  if (
    Array.isArray(rolesAutorises) &&
    rolesAutorises.length > 0 &&
    !rolesAutorises.includes(utilisateur.roleCode) &&
    !rolesAutorises.includes(utilisateur.role)
  ) {
    return {
      autorise: false,
      motif: 'role-interdit',
      redirection: '/acces-refuse',
    }
  }

  if (
    Array.isArray(permissionsRequises) &&
    permissionsRequises.length > 0 &&
    !verifierAccesParPermissions(utilisateur.permissions ?? [], permissionsRequises, modePermissions)
  ) {
    return {
      autorise: false,
      motif: 'permission-manquante',
      redirection: '/acces-refuse',
    }
  }

  return {
    autorise: true,
    motif: 'autorise',
    redirection: null,
  }
}

export { verifierPolitiqueProtection }