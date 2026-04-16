// Ce service gere les appels API du module laboratoire vers le backend NestJS.
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
  if (Array.isArray(msg)) return msg.join(' ')
  if (reponse.status === 404) return 'Demande introuvable.'
  if (reponse.status >= 500) return 'Le service laboratoire est indisponible.'
  return 'Une erreur est survenue.'
}

async function appelerApi(url, options = {}) {
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

const serviceLaboratoire = {
  // Lister toutes les demandes (avec filtre optionnel par statut)
  async listerDemandes(statut = '') {
    const params = statut ? `?statut=${encodeURIComponent(statut)}` : ''
    const corps = await appelerApi(`${URL_API}/laboratoire${params}`)
    return Array.isArray(corps?.demandes) ? corps.demandes : []
  },

  // Lister les demandes en attente (statut DEMANDE)
  async listerEnAttente() {
    const corps = await appelerApi(`${URL_API}/laboratoire/en-attente`)
    return Array.isArray(corps?.demandes) ? corps.demandes : []
  },

  // Lister les demandes en cours (statut EN_COURS)
  async listerEnCours() {
    const corps = await appelerApi(`${URL_API}/laboratoire/en-cours`)
    return Array.isArray(corps?.demandes) ? corps.demandes : []
  },

  // Historique des demandes traitees
  async listerHistorique() {
    const corps = await appelerApi(`${URL_API}/laboratoire/historique`)
    return Array.isArray(corps?.demandes) ? corps.demandes : []
  },

  // Obtenir le detail d'une demande
  async obtenirDemande(examenId) {
    const corps = await appelerApi(`${URL_API}/laboratoire/${examenId}`)
    return corps?.demande ?? null
  },

  // Prendre en charge une demande
  async prendreEnCharge(examenId, donnees = {}) {
    const corps = await appelerApi(`${URL_API}/laboratoire/${examenId}/prise-en-charge`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.demande ?? corps
  },

  // Saisir le resultat et l'envoyer vers le module clinique
  async envoyerResultat(examenId, donnees) {
    const corps = await appelerApi(`${URL_API}/laboratoire/${examenId}/resultat`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.demande ?? corps
  },
}

export default serviceLaboratoire
