// Ce service gere les appels API du module accouchements vers le backend NestJS.
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
  if (reponse.status >= 500) return 'Le service accouchements est indisponible.'
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

const serviceAccouchement = {
  // Recherche une patiente par nom, dossier ou telephone
  async rechercherPatientes(terme) {
    const params = terme ? `?terme=${encodeURIComponent(terme)}` : ''
    const corps = await appelerApi(`${URL_API}/accouchements/patientes/rechercher${params}`)
    return Array.isArray(corps?.patientes) ? corps.patientes : []
  },

  // Recupere la liste des accouchements
  async listerAccouchements(recherche = '') {
    const params = recherche ? `?recherche=${encodeURIComponent(recherche)}` : ''
    const corps = await appelerApi(`${URL_API}/accouchements${params}`)
    return Array.isArray(corps?.accouchements) ? corps.accouchements : []
  },

  // Recupere le detail d un accouchement par son id
  async obtenirAccouchement(id) {
    const corps = await appelerApi(`${URL_API}/accouchements/${id}`)
    return corps?.accouchement ?? null
  },

  // Enregistre un nouvel accouchement
  async enregistrerAccouchement(donnees) {
    const corps = await appelerApi(`${URL_API}/accouchements`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.accouchement ?? null
  },
}

export default serviceAccouchement
