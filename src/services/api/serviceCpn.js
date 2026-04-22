// Ce service gere les appels API du module CPN vers le backend NestJS.
import { enrichirAvecUtilisateur } from './utilitairesApi'

const URL_API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

async function lireCorpsJson(reponse) {
  const texte = await reponse.text()
  if (!texte) return null
  try {
    return JSON.parse(texte)
  } catch {
    return null
  }
}

function creerErreurApi(message, statut, corps) {
  const erreur = new Error(message)
  erreur.estErreurApi = true
  erreur.statut = statut
  erreur.corps = corps
  return erreur
}

function construireMessageErreur(reponse, corps) {
  const msg = corps?.message
  if (typeof msg === 'string') return msg
  if (typeof msg === 'object' && msg?.message) return msg.message
  if (Array.isArray(msg)) return msg.join(' ')
  if (reponse.status === 404) return 'Ressource introuvable.'
  if (reponse.status >= 500) return 'Le service CPN est indisponible.'
  return 'Une erreur est survenue.'
}

async function appelerApi(url, options = {}) {
  if (options.body && (options.method === 'POST' || options.method === 'PATCH' || options.method === 'PUT')) {
    try {
      const d = JSON.parse(options.body)
      options = { ...options, body: JSON.stringify(enrichirAvecUtilisateur(d)) }
    } catch { /* corps non-JSON */ }
  }
  const reponse = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const corps = await lireCorpsJson(reponse)
  if (!reponse.ok) {
    throw creerErreurApi(construireMessageErreur(reponse, corps), reponse.status, corps)
  }
  return corps
}

const serviceCpn = {
  // --- Dossiers ---

  async listerDossiers(recherche = '') {
    // Supprimer le '#' en tête pour permettre la saisie de "#CPN-2026-XXXX"
    const terme = recherche ? recherche.replace(/^#/, '').trim() : ''
    const params = terme ? `?recherche=${encodeURIComponent(terme)}` : ''
    const corps = await appelerApi(`${URL_API}/cpn${params}`)
    return Array.isArray(corps?.dossiers) ? corps.dossiers : []
  },

  async dossierParPatienteId(patienteId) {
    const corps = await appelerApi(`${URL_API}/cpn?patienteId=${encodeURIComponent(patienteId)}`)
    const liste = Array.isArray(corps?.dossiers) ? corps.dossiers : []
    return liste[0] ?? null // retourne le dossier le plus récent ou null
  },

  async listerDossiersParPatiente(patienteId) {
    const corps = await appelerApi(`${URL_API}/cpn?patienteId=${encodeURIComponent(patienteId)}`)
    return Array.isArray(corps?.dossiers) ? corps.dossiers : []
  },

  async obtenirDossier(dossierId) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}`)
    return corps?.dossier ?? null
  },

  async ouvrirDossier(donnees) {
    const corps = await appelerApi(`${URL_API}/cpn`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.dossier ?? corps
  },

  async modifierDossier(dossierId, donnees) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.dossier ?? corps
  },

  // --- Contacts ---

  async ajouterContact(dossierId, donnees) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.contact ?? corps
  },

  async obtenirContact(dossierId, contactId) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/contacts/${contactId}`)
    return corps?.contact ?? null
  },

  async modifierContact(dossierId, contactId, donnees) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.contact ?? corps
  },

  async analyserContact(dossierId, donnees) {
    // Filtrer les valeurs nulles/undefined pour éviter les erreurs de validation côté backend
    const donneesPropres = Object.fromEntries(
      Object.entries(donnees).filter(([, v]) => v != null),
    )
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/contacts/analyser`, {
      method: 'POST',
      body: JSON.stringify(donneesPropres),
    })
    return corps
  },

  // --- Examens ---

  async listerExamens(dossierId) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/examens`)
    return Array.isArray(corps?.examens) ? corps.examens : []
  },

  async demanderExamen(dossierId, donnees) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/examens`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.examen ?? corps
  },

  async enregistrerResultatExamen(dossierId, examenId, donnees) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/examens/${examenId}`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.examen ?? corps
  },

  // Saisir l'interprétation d'une échographie (patiente revient avec ses images)
  async entrerInterpretationEchographie(dossierId, examenId, donnees) {
    const corps = await appelerApi(`${URL_API}/cpn/${dossierId}/examens/${examenId}/interpretation`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.examen ?? corps
  },

  // Supprimer un dossier CPN (uniquement si pas d'accouchement lié et aucun contact)
  async supprimerDossier(dossierId) {
    return appelerApi(`${URL_API}/cpn/${dossierId}`, { method: 'DELETE' })
  },
}

export default serviceCpn
