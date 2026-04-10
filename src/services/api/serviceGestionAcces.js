import {
  CATALOGUE_PERMISSIONS,
  PERMISSIONS,
  ROLES_PAR_DEFAUT,
  calculerPermissionsUtilisateur,
  enrichirUtilisateur,
  obtenirRoleParCode,
  obtenirRolesActifs,
} from '../../modules/gestion-acces/controle-acces'

const CLE_STOCKAGE_GESTION_ACCES = 'cpn-cps-gestion-acces'
const EVENEMENT_GESTION_ACCES = 'cpn-cps-gestion-acces-mis-a-jour'

const ETAT_PAR_DEFAUT = Object.freeze({
  roles: ROLES_PAR_DEFAUT.map((role) => ({
    ...role,
    permissions: [...role.permissions],
  })),
  utilisateurs: [
    {
      id: 'usr-001',
      identifiant: 'superadmin',
      nomAffichage: 'Mireille Mumbere',
      roleCode: 'SUPER_ADMIN',
      actif: true,
      sexe: 'F',
      dateNaissance: '1989-03-14',
      telephone: '+243 970 000 111',
      email: 'mireille.mumbere@afiahimbi.cd',
      adresse: 'Quartier Himbi 2, Goma',
      unite: 'Direction generale',
      dernierAccesAt: '2026-04-09T07:10:00.000Z',
      accesSpecifiques: { ajoutes: [], retires: [] },
    },
    {
      id: 'usr-002',
      identifiant: 'admin',
      nomAffichage: 'Josue Safari',
      roleCode: 'ADMIN',
      actif: true,
      sexe: 'M',
      dateNaissance: '1990-08-02',
      telephone: '+243 976 120 450',
      email: 'josue.safari@afiahimbi.cd',
      adresse: 'Avenue du Lac, Himbi',
      unite: 'Administration',
      dernierAccesAt: '2026-04-09T06:25:00.000Z',
      accesSpecifiques: { ajoutes: [], retires: [] },
    },
    {
      id: 'usr-003',
      identifiant: 'dr.mwamba',
      nomAffichage: 'Dr Sarah Mwamba',
      roleCode: 'MEDECIN',
      actif: true,
      sexe: 'F',
      dateNaissance: '1988-05-12',
      telephone: '+243 812 345 678',
      email: 'sarah.mwamba@afiahimbi.cd',
      adresse: 'Av. du Lac, Quartier Himbi, Goma, RDC',
      unite: 'Maternite',
      dernierAccesAt: '2026-04-08T14:48:00.000Z',
      accesSpecifiques: { ajoutes: [], retires: [] },
    },
    {
      id: 'usr-004',
      identifiant: 'reception1',
      nomAffichage: 'Aline Kavira',
      roleCode: 'RECEPTION',
      actif: true,
      sexe: 'F',
      dateNaissance: '1994-11-25',
      telephone: '+243 811 220 003',
      email: 'aline.kavira@afiahimbi.cd',
      adresse: 'Katindo, Goma',
      unite: 'Accueil',
      dernierAccesAt: '2026-04-08T12:05:00.000Z',
      accesSpecifiques: { ajoutes: [PERMISSIONS.BIBLIOTHEQUE_CONSULTER], retires: [] },
    },
    {
      id: 'usr-005',
      identifiant: 'audit',
      nomAffichage: 'Equipe audit',
      roleCode: 'OBSERVATEUR',
      actif: false,
      sexe: '',
      dateNaissance: null,
      telephone: null,
      email: 'audit@afiahimbi.cd',
      adresse: null,
      unite: 'Qualite',
      dernierAccesAt: '2026-04-02T09:20:00.000Z',
      accesSpecifiques: { ajoutes: [], retires: [] },
    },
  ],
})

function peutUtiliserStockage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normaliserUtilisateur(utilisateur) {
  return {
    ...utilisateur,
    accesSpecifiques: {
      ajoutes: Array.isArray(utilisateur?.accesSpecifiques?.ajoutes)
        ? [...utilisateur.accesSpecifiques.ajoutes]
        : [],
      retires: Array.isArray(utilisateur?.accesSpecifiques?.retires)
        ? [...utilisateur.accesSpecifiques.retires]
        : [],
    },
  }
}

function clonerEtat(etat) {
  return {
    roles: obtenirRolesActifs(etat.roles),
    utilisateurs: etat.utilisateurs.map(normaliserUtilisateur),
  }
}

function lireEtatLocal() {
  if (!peutUtiliserStockage()) {
    return clonerEtat(ETAT_PAR_DEFAUT)
  }

  const donneesBrutes = window.localStorage.getItem(CLE_STOCKAGE_GESTION_ACCES)

  if (!donneesBrutes) {
    return clonerEtat(ETAT_PAR_DEFAUT)
  }

  try {
    const etat = JSON.parse(donneesBrutes)

    if (!Array.isArray(etat?.roles) || !Array.isArray(etat?.utilisateurs)) {
      return clonerEtat(ETAT_PAR_DEFAUT)
    }

    return clonerEtat(etat)
  } catch {
    return clonerEtat(ETAT_PAR_DEFAUT)
  }
}

function enregistrerEtatLocal(etat) {
  if (!peutUtiliserStockage()) {
    return
  }

  window.localStorage.setItem(CLE_STOCKAGE_GESTION_ACCES, JSON.stringify(etat))
  window.dispatchEvent(new CustomEvent(EVENEMENT_GESTION_ACCES))
}

function enrichirUtilisateurs(utilisateurs, roles) {
  return utilisateurs.map((utilisateur) => enrichirUtilisateur(utilisateur, roles))
}

function trierCodesPermission(permissions) {
  return [...new Set(permissions)].sort((premierePermission, secondePermission) =>
    premierePermission.localeCompare(secondePermission),
  )
}

function creerIdentifiantDepuisNom(nomComplet) {
  const base = nomComplet
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')

  const suffixe = String(Date.now()).slice(-4)

  return `${base || 'utilisateur'}.${suffixe}`
}

function creerCodeRoleDepuisLibelle(libelle) {
  return libelle
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

const serviceGestionAcces = {
  evenementMiseAJour: EVENEMENT_GESTION_ACCES,

  lireEtatLocal,

  recupererUtilisateurLocalParIdentifiant(identifiant) {
    const etat = lireEtatLocal()

    return etat.utilisateurs.find(
      (utilisateur) => utilisateur.identifiant.toLowerCase() === identifiant?.trim().toLowerCase(),
    )
  },

  recupererUtilisateurLocalParId(utilisateurId) {
    const etat = lireEtatLocal()

    return etat.utilisateurs.find((utilisateur) => utilisateur.id === utilisateurId)
  },

  async recupererConfiguration() {
    const etat = lireEtatLocal()

    return {
      roles: obtenirRolesActifs(etat.roles),
      utilisateurs: enrichirUtilisateurs(etat.utilisateurs, etat.roles),
      permissions: [...CATALOGUE_PERMISSIONS],
    }
  },

  async mettreAJourRole(roleCode, permissions) {
    const etat = lireEtatLocal()
    const codeRecherche = roleCode?.trim().toUpperCase()

    const roles = etat.roles.map((role) =>
      role.code === codeRecherche
        ? {
            ...role,
            permissions: trierCodesPermission(permissions),
          }
        : role,
    )

    const prochainEtat = {
      ...etat,
      roles,
    }

    enregistrerEtatLocal(prochainEtat)

    return {
      roles: obtenirRolesActifs(roles),
      utilisateurs: enrichirUtilisateurs(etat.utilisateurs, roles),
      permissions: [...CATALOGUE_PERMISSIONS],
    }
  },

  async mettreAJourUtilisateur(utilisateurId, patch) {
    const etat = lireEtatLocal()

    const utilisateurs = etat.utilisateurs.map((utilisateur) =>
      utilisateur.id === utilisateurId
        ? normaliserUtilisateur({
            ...utilisateur,
            ...patch,
            accesSpecifiques: patch?.accesSpecifiques
              ? {
                  ajoutes: trierCodesPermission(patch.accesSpecifiques.ajoutes ?? []),
                  retires: trierCodesPermission(patch.accesSpecifiques.retires ?? []),
                }
              : utilisateur.accesSpecifiques,
          })
        : utilisateur,
    )

    const prochainEtat = {
      ...etat,
      utilisateurs,
    }

    enregistrerEtatLocal(prochainEtat)

    return {
      roles: obtenirRolesActifs(etat.roles),
      utilisateurs: enrichirUtilisateurs(utilisateurs, etat.roles),
      permissions: [...CATALOGUE_PERMISSIONS],
    }
  },

  async basculerPermissionUtilisateur(utilisateurId, permissionCode) {
    const etat = lireEtatLocal()

    const utilisateurs = etat.utilisateurs.map((utilisateur) => {
      if (utilisateur.id !== utilisateurId) {
        return utilisateur
      }

      const role = obtenirRoleParCode(utilisateur.roleCode, etat.roles)
      const permissionEstDansRole = role?.permissions.includes(permissionCode) ?? false
      const permissionEffective = calculerPermissionsUtilisateur(utilisateur, etat.roles).includes(permissionCode)
      const ajoutes = new Set(utilisateur.accesSpecifiques?.ajoutes ?? [])
      const retires = new Set(utilisateur.accesSpecifiques?.retires ?? [])

      if (permissionEstDansRole) {
        if (permissionEffective) {
          retires.add(permissionCode)
          ajoutes.delete(permissionCode)
        } else {
          retires.delete(permissionCode)
        }
      } else if (permissionEffective) {
        ajoutes.delete(permissionCode)
        retires.delete(permissionCode)
      } else {
        ajoutes.add(permissionCode)
        retires.delete(permissionCode)
      }

      return normaliserUtilisateur({
        ...utilisateur,
        accesSpecifiques: {
          ajoutes: trierCodesPermission(Array.from(ajoutes)),
          retires: trierCodesPermission(Array.from(retires)),
        },
      })
    })

    const prochainEtat = {
      ...etat,
      utilisateurs,
    }

    enregistrerEtatLocal(prochainEtat)

    return {
      roles: obtenirRolesActifs(etat.roles),
      utilisateurs: enrichirUtilisateurs(utilisateurs, etat.roles),
      permissions: [...CATALOGUE_PERMISSIONS],
    }
  },

  async creerUtilisateur(donneesUtilisateur) {
    const etat = lireEtatLocal()
    const utilisateur = normaliserUtilisateur({
      id: `usr-${Date.now()}`,
      identifiant: donneesUtilisateur.identifiant ?? creerIdentifiantDepuisNom(donneesUtilisateur.nomComplet),
      nomAffichage: donneesUtilisateur.nomComplet,
      roleCode: donneesUtilisateur.roleCode,
      actif: donneesUtilisateur.actif,
      sexe: donneesUtilisateur.sexe ?? '',
      dateNaissance: donneesUtilisateur.dateNaissance ?? null,
      telephone: donneesUtilisateur.telephone ?? null,
      email: donneesUtilisateur.email ?? null,
      adresse: donneesUtilisateur.adresse ?? null,
      unite: donneesUtilisateur.unite ?? 'Service non renseigne',
      dernierAccesAt: null,
      accesSpecifiques: { ajoutes: [], retires: [] },
    })

    const prochainEtat = {
      ...etat,
      utilisateurs: [utilisateur, ...etat.utilisateurs],
    }

    enregistrerEtatLocal(prochainEtat)

    return enrichirUtilisateur(utilisateur, etat.roles)
  },

  async creerRole(donneesRole) {
    const etat = lireEtatLocal()
    const libelle = donneesRole.libelle?.trim()
    const description = donneesRole.description?.trim()
    const code = creerCodeRoleDepuisLibelle(donneesRole.code?.trim() || libelle || '')

    if (!libelle) {
      throw new Error('Le libellé du rôle est obligatoire.')
    }

    if (!description) {
      throw new Error('La description du rôle est obligatoire.')
    }

    if (!code) {
      throw new Error('Le code du rôle est invalide.')
    }

    if (etat.roles.some((role) => role.code === code)) {
      throw new Error('Un rôle avec ce code existe déjà.')
    }

    const role = {
      code,
      libelle,
      description,
      estSysteme: false,
      permissions: trierCodesPermission(donneesRole.permissions ?? []),
    }

    enregistrerEtatLocal({
      ...etat,
      roles: [role, ...etat.roles],
    })

    return role
  },

  async modifierUtilisateur(utilisateurId, donneesUtilisateur) {
    const etat = lireEtatLocal()
    let utilisateurMisAJour = null

    const utilisateurs = etat.utilisateurs.map((utilisateur) => {
      if (utilisateur.id !== utilisateurId) {
        return utilisateur
      }

      utilisateurMisAJour = normaliserUtilisateur({
        ...utilisateur,
        nomAffichage: donneesUtilisateur.nomComplet?.trim() || utilisateur.nomAffichage,
        roleCode: donneesUtilisateur.roleCode ?? utilisateur.roleCode,
        actif: typeof donneesUtilisateur.actif === 'boolean' ? donneesUtilisateur.actif : utilisateur.actif,
        sexe: donneesUtilisateur.sexe ?? utilisateur.sexe ?? '',
        dateNaissance: donneesUtilisateur.dateNaissance ?? utilisateur.dateNaissance ?? null,
        telephone: donneesUtilisateur.telephone ?? utilisateur.telephone ?? null,
        email: donneesUtilisateur.email ?? utilisateur.email ?? null,
        adresse: donneesUtilisateur.adresse ?? utilisateur.adresse ?? null,
        unite: donneesUtilisateur.unite ?? utilisateur.unite ?? 'Service non renseigne',
      })

      return utilisateurMisAJour
    })

    if (!utilisateurMisAJour) {
      throw new Error('Utilisateur introuvable.')
    }

    enregistrerEtatLocal({
      ...etat,
      utilisateurs,
    })

    return enrichirUtilisateur(utilisateurMisAJour, etat.roles)
  },

  async supprimerUtilisateur(utilisateurId) {
    const etat = lireEtatLocal()
    const utilisateur = etat.utilisateurs.find((element) => element.id === utilisateurId)

    if (!utilisateur) {
      throw new Error('Utilisateur introuvable.')
    }

    enregistrerEtatLocal({
      ...etat,
      utilisateurs: etat.utilisateurs.filter((element) => element.id !== utilisateurId),
    })

    return {
      id: utilisateurId,
      message: 'Utilisateur supprimé avec succès.',
    }
  },
}

export default serviceGestionAcces