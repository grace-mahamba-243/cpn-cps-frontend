// Ce service gere les appels API du module CPS Femme vers le backend NestJS.
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
  if (reponse.status >= 500) return 'Le service CPS Femme est indisponible.'
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

const serviceCpsFemme = {
  // Recherche une patiente par nom, dossier ou telephone
  async rechercherPatientes(terme) {
    const params = terme ? `?terme=${encodeURIComponent(terme)}` : ''
    const corps = await appelerApi(`${URL_API}/cps-femme/patientes/rechercher${params}`)
    return Array.isArray(corps?.patientes) ? corps.patientes : []
  },

  // Recupere la liste des dossiers CPS
  async listerDossiers(recherche = '') {
    const params = recherche ? `?recherche=${encodeURIComponent(recherche)}` : ''
    const corps = await appelerApi(`${URL_API}/cps-femme${params}`)
    return Array.isArray(corps?.dossiers) ? corps.dossiers : []
  },

  // Recupere le detail d un dossier CPS par son id
  async obtenirDossier(id) {
    const corps = await appelerApi(`${URL_API}/cps-femme/${id}`)
    return corps?.dossier ?? null
  },

  // Ouvre un nouveau dossier CPS
  async ouvrirDossier(donnees) {
    const corps = await appelerApi(`${URL_API}/cps-femme`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.dossier ?? null
  },

  // Modifie un dossier CPS existant
  async modifierDossier(id, donnees) {
    const corps = await appelerApi(`${URL_API}/cps-femme/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.dossier ?? null
  },

  // Cloture un dossier CPS
  async cloturerDossier(id, donnees) {
    return appelerApi(`${URL_API}/cps-femme/${id}/cloture`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
  },

  // Recupere les visites d un dossier CPS
  async listerVisites(dossierId) {
    const corps = await appelerApi(`${URL_API}/cps-femme/${dossierId}/visites`)
    return Array.isArray(corps?.visites) ? corps.visites : []
  },

  // Ajoute une visite CPS
  async ajouterVisite(dossierId, donnees) {
    const corps = await appelerApi(`${URL_API}/cps-femme/${dossierId}/visites`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.visite ?? null
  },

  // Recupere le detail d une visite
  async obtenirVisite(dossierId, visiteId) {
    const corps = await appelerApi(`${URL_API}/cps-femme/${dossierId}/visites/${visiteId}`)
    return corps?.visite ?? null
  },

  // Modifie une visite CPS
  async modifierVisite(dossierId, visiteId, donnees) {
    const corps = await appelerApi(`${URL_API}/cps-femme/${dossierId}/visites/${visiteId}`, {
      method: 'PATCH',
      body: JSON.stringify(donnees),
    })
    return corps?.visite ?? null
  },

  // Retourne le premier dossier CPS (ouvert) d'une patiente, ou null
  async dossierParPatienteId(patienteId) {
    const corps = await appelerApi(
      `${URL_API}/cps-femme?patienteId=${encodeURIComponent(patienteId)}`,
    )
    const liste = Array.isArray(corps?.dossiers) ? corps.dossiers : []
    return liste.find((d) => d.statut === 'OUVERT') ?? liste[0] ?? null
  },

  // Ajoute un enfant à partir d'un dossier CPS (hérite les infos de la mère)
  async ajouterEnfant(dossierId, donnees) {
    const corps = await appelerApi(`${URL_API}/cps-femme/${dossierId}/ajouter-enfant`, {
      method: 'POST',
      body: JSON.stringify(donnees),
    })
    return corps?.enfant ?? null
  },
}

export default serviceCpsFemme
