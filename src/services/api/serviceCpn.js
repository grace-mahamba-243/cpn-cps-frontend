// Ce service gere les appels API du module CPN vers le backend NestJS.
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

function creerErreurApi(message) {
  const erreur = new Error(message)
  erreur.estErreurApi = true
  return erreur
}

function construireMessageErreur(reponse, corps) {
  if (typeof corps?.message === 'string') return corps.message
  if (Array.isArray(corps?.message)) return corps.message.join(' ')
  if (reponse.status === 404) return 'Ressource introuvable.'
  if (reponse.status >= 500) return 'Le service CPN est indisponible.'
  return 'Une erreur est survenue.'
}

async function appelerApi(url, options = {}) {
  const reponse = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const corps = await lireCorpsJson(reponse)
  if (!reponse.ok) {
    throw creerErreurApi(construireMessageErreur(reponse, corps))
  }
  return corps
}

const serviceCpn = {
  // --- Dossiers ---

  async listerDossiers(recherche = '') {
    const params = recherche ? `?recherche=${encodeURIComponent(recherche)}` : ''
    const corps = await appelerApi(`${URL_API}/cpn${params}`)
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
}

export default serviceCpn
