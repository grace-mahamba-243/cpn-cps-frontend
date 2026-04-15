// Ce service centralise les appels HTTP vers le module patientes du backend.
// Il expose les operations CRUD pour les dossiers administratifs des meres.

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

function construireEntetes() {
  try {
    const session = JSON.parse(sessionStorage.getItem('session') ?? '{}')
    const token = session?.token ?? null
    const entetes = { 'Content-Type': 'application/json' }
    if (token) entetes['Authorization'] = `Bearer ${token}`
    return entetes
  } catch {
    return { 'Content-Type': 'application/json' }
  }
}

function construireMessageErreur(reponse, corps) {
  if (typeof corps?.message === 'string') return corps.message
  if (Array.isArray(corps?.message) && corps.message.length > 0) return corps.message[0]
  if (reponse.status === 404) return 'Dossier patiente introuvable.'
  if (reponse.status >= 500) return 'Le serveur est indisponible pour le moment.'
  return 'Une erreur inattendue est survenue.'
}

// Ce service expose les operations CRUD du module patientes via l API REST.
const serviceDossiersMeres = {
  // Retourne la liste de toutes les patientes.
  async lister(recherche = '') {
    const params = new URLSearchParams()
    if (recherche.trim()) params.set('recherche', recherche.trim())
    const suffixe = params.toString() ? `?${params.toString()}` : ''

    let reponse
    try {
      reponse = await fetch(`${URL_API}/patientes${suffixe}`, { headers: construireEntetes() })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return Array.isArray(corps) ? corps : []
  },

  // Retourne une patiente par son identifiant.
  async recupererParId(mereId) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/patientes/${encodeURIComponent(mereId)}`, {
        headers: construireEntetes(),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (reponse.status === 404) return null
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return corps
  },

  // Cree un nouveau dossier administratif patiente.
  async creer(dossier) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/patientes`, {
        method: 'POST',
        headers: construireEntetes(),
        body: JSON.stringify(dossier),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return corps
  },

  // Met a jour un dossier administratif patiente.
  async modifier(mereId, donnees) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/patientes/${encodeURIComponent(mereId)}`, {
        method: 'PATCH',
        headers: construireEntetes(),
        body: JSON.stringify(donnees),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (reponse.status === 404) return null
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return corps
  },
}

export default serviceDossiersMeres
