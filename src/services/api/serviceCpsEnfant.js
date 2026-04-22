// Ce service gere les appels API du module CPS Enfant vers le backend NestJS.
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
  if (reponse.status >= 500) return 'Le service CPS Enfant est indisponible.'
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

const serviceCpsEnfant = {
  // Recherche un enfant par nom ou numero dossier
  async rechercherEnfants(terme) {
    const params = terme ? `?terme=${encodeURIComponent(terme)}` : ''
    const corps = await appelerApi(`${URL_API}/cps-enfant/enfants/rechercher${params}`)
    return Array.isArray(corps?.enfants) ? corps.enfants : []
  },

  // Recupere la liste des dossiers CPS Enfant
  async listerDossiers(recherche = '') {
    const params = recherche ? `?recherche=${encodeURIComponent(recherche)}` : ''
    const corps = await appelerApi(`${URL_API}/cps-enfant${params}`)
    return Array.isArray(corps?.dossiers) ? corps.dossiers : Array.isArray(corps) ? corps : []
  },

  // Recupere le dossier CPS ouvert d'un enfant par son id
  async dossierParEnfantId(enfantId) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/par-enfant/${enfantId}`)
    return corps?.dossier ?? corps ?? null
  },

  // Recupere le detail d'un dossier CPS Enfant par son id
  async obtenirDossier(id) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/${id}`)
    return corps?.dossier ?? corps ?? null
  },

  // Ouvre un nouveau dossier CPS Enfant
  async ouvrirDossier(donnees) {
    const corps = await appelerApi(`${URL_API}/cps-enfant`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.dossier ?? corps ?? null
  },

  // Cloture un dossier CPS Enfant
  async cloturerDossier(id, notes) {
    return appelerApi(`${URL_API}/cps-enfant/${id}/cloture`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  },

  // Recupere les visites d'un dossier
  async listerVisites(dossierId) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/${dossierId}/visites`)
    return Array.isArray(corps?.visites) ? corps.visites : Array.isArray(corps) ? corps : []
  },

  // Ajoute une visite CPS Enfant
  async ajouterVisite(dossierId, donnees) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/${dossierId}/visites`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.visite ?? corps ?? null
  },

  // Recupere le detail d'une visite
  async obtenirVisite(dossierId, visiteId) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/${dossierId}/visites/${visiteId}`)
    return corps?.visite ?? corps ?? null
  },

  // Retourne les examens biologiques / échographies du dossier CPS Enfant
  async listerExamens(dossierId) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/${dossierId}/examens`)
    return Array.isArray(corps) ? corps : []
  },

  // Demande un nouvel examen pour ce dossier CPS Enfant
  async demanderExamen(dossierId, donnees) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/${dossierId}/examens`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.examen ?? corps
  },

  // Enregistre un résultat ou interprétation pour un examen CPS Enfant
  async enregistrerResultat(dossierId, examenId, donnees) {
    const corps = await appelerApi(`${URL_API}/cps-enfant/${dossierId}/examens/${examenId}`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.examen ?? corps
  },

  // Alias pour interprétation échographie
  async entrerInterpretation(dossierId, examenId, donnees) {
    return this.enregistrerResultat(dossierId, examenId, { interpretation: donnees.interpretation, statut: 'RESULTAT_RECU' })
  },

  // Supprimer un dossier CPS Enfant (uniquement si aucune visite ni examen)
  async supprimerDossier(dossierId) {
    return appelerApi(`${URL_API}/cps-enfant/${dossierId}`, { method: 'DELETE' })
  },
}

export default serviceCpsEnfant
