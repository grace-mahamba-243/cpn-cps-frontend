// Ce service centralise les appels HTTP vers le module enfants du backend.
// Il expose les operations CRUD pour les dossiers administratifs des enfants.
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
  if (reponse.status === 404) return 'Dossier enfant introuvable.'
  if (reponse.status >= 500) return 'Le serveur est indisponible pour le moment.'
  return 'Une erreur inattendue est survenue.'
}

// Ce service expose les operations CRUD du module enfants via l API REST.
const serviceDossiersEnfants = {
  // Retourne la liste de tous les enfants.
  async lister(recherche = '') {
    const params = new URLSearchParams()
    if (recherche.trim()) params.set('recherche', recherche.trim())
    const suffixe = params.toString() ? `?${params.toString()}` : ''

    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants${suffixe}`, { headers: construireEntetes() })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return Array.isArray(corps) ? corps : []
  },

  // Retourne un enfant par son identifiant.
  async recupererParId(enfantId) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}`, {
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

  // Retourne le dossier enfant lié à un accouchement et un index de nouveau-né.
  async recupererParAccouchementEtIndex(accouchementId, indexNouveauNe) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/par-accouchement/${encodeURIComponent(accouchementId)}/${encodeURIComponent(indexNouveauNe)}`, {
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

  // Cree un nouveau dossier administratif enfant.
  async creer(dossier) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants`, {
        method: 'POST',
        headers: construireEntetes(),
        body: JSON.stringify(enrichirAvecUtilisateur(dossier)),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return corps
  },

  // Retourne le resume complet du dossier enfant (avec suivis, nutritions et doses).
  async recupererResume(enfantId) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}/resume`, {
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

  // --- Suivi enfant ---

  async listerSuivis(enfantId) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}/suivis`, {
        headers: construireEntetes(),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }
    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return Array.isArray(corps) ? corps : []
  },

  async ajouterSuivi(enfantId, donnees) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}/suivis`, {
        method: 'POST',
        headers: construireEntetes(),
        body: JSON.stringify(enrichirAvecUtilisateur(donnees)),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }
    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return corps
  },

  // --- Vaccination ---

  async listerVaccinations(enfantId) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}/vaccinations`, {
        headers: construireEntetes(),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }
    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return Array.isArray(corps) ? corps : []
  },

  async enregistrerVaccination(enfantId, donnees) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}/vaccinations`, {
        method: 'POST',
        headers: construireEntetes(),
        body: JSON.stringify(enrichirAvecUtilisateur(donnees)),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }
    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return corps
  },

  // --- Examens ---

  // Retourne la liste des examens d'un enfant.
  async listerExamens(enfantId) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}/examens`, {
        headers: construireEntetes(),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }
    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return Array.isArray(corps?.examens) ? corps.examens : []
  },

  // Demande un nouvel examen pour un enfant.
  async demanderExamen(enfantId, donnees) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/enfants/${encodeURIComponent(enfantId)}/examens`, {
        method: 'POST',
        headers: construireEntetes(),
        body: JSON.stringify(enrichirAvecUtilisateur(donnees)),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }
    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return corps?.examen ?? corps
  },
}

export default serviceDossiersEnfants
