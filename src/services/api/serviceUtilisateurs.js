import serviceGestionAcces from './serviceGestionAcces'
import { enrichirUtilisateur } from '../../modules/gestion-acces/controle-acces'

const URL_API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

async function lireCorpsJson(reponse) {
  const texte = await reponse.text()

  if (!texte) {
    return null
  }

  try {
    return JSON.parse(texte)
  } catch {
    return null
  }
}

function construireMessageErreur(reponse, corps) {
  if (typeof corps?.message === 'string') {
    return corps.message
  }

  if (reponse.status >= 500) {
    return 'Le service utilisateurs est indisponible pour le moment.'
  }

  return 'La liste des utilisateurs n a pas pu etre chargee.'
}

function formaterUtilisateurApi(utilisateur) {
  return {
    id: utilisateur.id,
    identifiant: utilisateur.identifiant,
    nomAffichage: utilisateur.nomAffichage,
    role: utilisateur.role,
    roleCode: utilisateur.roleCode,
    actif: utilisateur.actif,
    dernierAccesAt: utilisateur.dernierAccesAt,
    unite: utilisateur.unite ?? 'Service non renseigne',
    sexe: utilisateur.sexe ?? '',
    dateNaissance: utilisateur.dateNaissance ?? null,
    telephone: utilisateur.telephone ?? null,
    email: utilisateur.email ?? null,
    adresse: utilisateur.adresse ?? null,
  }
}

function enrichirProfilUtilisateur(utilisateur) {
  return {
    ...utilisateur,
    sexe: utilisateur.sexe ?? '',
    dateNaissance: utilisateur.dateNaissance ?? null,
    telephone: utilisateur.telephone ?? null,
    email: utilisateur.email ?? null,
    adresse: utilisateur.adresse ?? null,
    unite: utilisateur.unite ?? 'Service non renseigne',
  }
}

// Ce service charge la liste des utilisateurs pour l administration et applique un fallback
// local lorsque l endpoint backend n est pas encore disponible ou retourne une erreur.
const serviceUtilisateurs = {
  async recupererListe() {
    try {
      const reponse = await fetch(`${URL_API}/users`)
      const corps = await lireCorpsJson(reponse)

      if (!reponse.ok) {
        throw new Error(construireMessageErreur(reponse, corps))
      }

      const roles = serviceGestionAcces.lireEtatLocal().roles
      const utilisateurs = Array.isArray(corps?.utilisateurs)
        ? corps.utilisateurs.map((utilisateur) =>
            enrichirProfilUtilisateur(enrichirUtilisateur(formaterUtilisateurApi(utilisateur), roles)),
          )
        : []

      return {
        source: 'api',
        utilisateurs,
      }
    } catch {
      const configurationLocale = await serviceGestionAcces.recupererConfiguration()

      return {
        source: 'local',
        utilisateurs: configurationLocale.utilisateurs.map(enrichirProfilUtilisateur),
      }
    }
  },

  async recupererUtilisateur(utilisateurId) {
    try {
      const reponse = await fetch(`${URL_API}/users/${utilisateurId}`)
      const corps = await lireCorpsJson(reponse)

      if (!reponse.ok) {
        throw new Error(construireMessageErreur(reponse, corps))
      }

      const roles = serviceGestionAcces.lireEtatLocal().roles

      return {
        source: 'api',
        utilisateur: enrichirProfilUtilisateur(
          enrichirUtilisateur(formaterUtilisateurApi(corps?.utilisateur ?? corps), roles),
        ),
      }
    } catch {
      const roles = serviceGestionAcces.lireEtatLocal().roles
      const utilisateur = serviceGestionAcces.recupererUtilisateurLocalParId(utilisateurId)

      if (!utilisateur) {
        throw new Error('Utilisateur introuvable.')
      }

      return {
        source: 'local',
        utilisateur: enrichirProfilUtilisateur(enrichirUtilisateur(utilisateur, roles)),
      }
    }
  },

  async creerUtilisateur(donneesUtilisateur) {
    try {
      const reponse = await fetch(`${URL_API}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donneesUtilisateur),
      })
      const corps = await lireCorpsJson(reponse)

      if (!reponse.ok) {
        throw new Error(construireMessageErreur(reponse, corps))
      }

      return corps?.utilisateur ?? corps
    } catch {
      return serviceGestionAcces.creerUtilisateur(donneesUtilisateur)
    }
  },

  async modifierUtilisateur(utilisateurId, donneesUtilisateur) {
    try {
      const reponse = await fetch(`${URL_API}/users/${utilisateurId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donneesUtilisateur),
      })
      const corps = await lireCorpsJson(reponse)

      if (!reponse.ok) {
        throw new Error(construireMessageErreur(reponse, corps))
      }

      return corps?.utilisateur ?? corps
    } catch {
      return serviceGestionAcces.modifierUtilisateur(utilisateurId, donneesUtilisateur)
    }
  },

  async supprimerUtilisateur(utilisateurId) {
    try {
      const reponse = await fetch(`${URL_API}/users/${utilisateurId}`, {
        method: 'DELETE',
      })
      const corps = await lireCorpsJson(reponse)

      if (!reponse.ok) {
        throw new Error(construireMessageErreur(reponse, corps))
      }

      return corps ?? { id: utilisateurId }
    } catch {
      return serviceGestionAcces.supprimerUtilisateur(utilisateurId)
    }
  },
}

export default serviceUtilisateurs