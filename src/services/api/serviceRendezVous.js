// Ce service centralise les appels HTTP vers le module rendez-vous du backend.
// Il normalise les donnees entre le format backend (champs snake_case, statuts UPPERCASE)
// et le format attendu par les composants frontend (champs French, statuts capitalized).

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

function obtenirTokenSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem('session') ?? '{}')
    return session?.token ?? null
  } catch {
    return null
  }
}

function construireEntetes() {
  const entetes = { 'Content-Type': 'application/json' }
  const token = obtenirTokenSession()
  if (token) entetes['Authorization'] = `Bearer ${token}`
  return entetes
}

function construireMessageErreur(reponse, corps) {
  if (typeof corps?.message === 'string') return corps.message
  if (Array.isArray(corps?.message) && corps.message.length > 0) return corps.message[0]
  if (reponse.status === 404) return 'Rendez-vous introuvable.'
  if (reponse.status >= 500) return 'Le serveur est indisponible pour le moment.'
  return 'Une erreur inattendue est survenue.'
}

// Mappage statut backend (UPPERCASE) → frontend (capitalized)
const STATUT_VERS_FRONTEND = {
  EN_ATTENTE: 'Prevu',
  PROGRAMME: 'Prevu',
  CONFIRME: 'Prevu',
  ARRIVE: 'Arrive',
  TERMINE: 'Termine',
  ANNULE: 'Annule',
  REPROGRAMME: 'Reprogramme',
  SURPRISE: 'Surprise',
}

// Mappage statut frontend → backend
const STATUT_VERS_BACKEND = {
  Prevu: 'EN_ATTENTE',
  Arrive: 'ARRIVE',
  Termine: 'TERMINE',
  Annule: 'ANNULE',
  Reprogramme: 'REPROGRAMME',
  Surprise: 'SURPRISE',
}

// Derive les initiales (ex: "Kavira Masika Marie" → "KM")
function deriveInitiales(nomComplet = '') {
  return nomComplet
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join('')
}

// Normalise une entite rendez-vous venant du backend vers le format frontend.
function normaliserDepuisApi(entite) {
  const statutFrontend = STATUT_VERS_FRONTEND[entite.statut] ?? entite.statut
  return {
    id: entite.id,
    date: entite.dateRdv,
    heure: entite.heureRdv,
    typePatient: entite.typePatient ?? 'Mere',
    nomPatient: entite.nomPatient,
    initialesPatient: entite.initialesPatient ?? deriveInitiales(entite.nomPatient),
    numeroDossier: entite.refDossier ?? '',
    service: entite.serviceDestination ?? '',
    typeRendezVous: entite.typeRdv === 'SURPRISE' ? 'Surprise' : 'Consultation',
    statut: statutFrontend,
    motif: entite.motif,
    observations: entite.observations ?? null,
    creePar: entite.creePar ?? null,
    creeLe: entite.creeLe,
    misAJourLe: entite.misAJourLe ?? null,
    arriveeEnregistreeLe: entite.statut === 'ARRIVE' ? entite.misAJourLe : null,
  }
}

// Normalise une creation/mise a jour frontend vers le DTO backend attendu.
function normaliserVersApi(donnees) {
  const typeRdv =
    donnees.typeRendezVous === 'Surprise' || (donnees.typeRendezVous ?? '').includes('Urgence')
      ? 'SURPRISE'
      : 'PROGRAMME'

  const statut = STATUT_VERS_BACKEND[donnees.statut] ?? 'EN_ATTENTE'

  return {
    dateRdv: donnees.date,
    heureRdv: donnees.heure,
    motif: donnees.motif,
    statut,
    typeRdv,
    nomPatient: donnees.nomPatient,
    initialesPatient: donnees.initialesPatient ?? deriveInitiales(donnees.nomPatient),
    typePatient: donnees.typePatient ?? null,
    refDossier: donnees.numeroDossier ?? null,
    serviceDestination: donnees.service ?? null,
    observations: donnees.observations ?? null,
    creePar: donnees.creePar ?? null,
  }
}

// Ce service expose les operations CRUD du module rendez-vous via l API REST.
const serviceRendezVousApi = {
  // Retourne la liste des rendez-vous avec filtres optionnels.
  async lister(filtres = {}) {
    const params = new URLSearchParams()
    if (filtres.date) params.set('date', filtres.date)
    if (filtres.dateDebut) params.set('dateDebut', filtres.dateDebut)
    if (filtres.dateFin) params.set('dateFin', filtres.dateFin)
    if (filtres.statut) params.set('statut', STATUT_VERS_BACKEND[filtres.statut] ?? filtres.statut)
    if (filtres.typeRdv) params.set('typeRdv', filtres.typeRdv)
    if (filtres.serviceDestination) params.set('serviceDestination', filtres.serviceDestination)
    if (filtres.recherche) params.set('recherche', filtres.recherche)

    const suffixe = params.toString() ? `?${params.toString()}` : ''

    let reponse
    try {
      reponse = await fetch(`${URL_API}/rendez-vous${suffixe}`, {
        headers: construireEntetes(),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur. Verifiez votre connexion.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return Array.isArray(corps) ? corps.map(normaliserDepuisApi) : []
  },

  // Retourne le detail d un rendez-vous par son identifiant (normalise).
  async recupererParId(id) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/rendez-vous/${encodeURIComponent(id)}`, {
        headers: construireEntetes(),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return normaliserDepuisApi(corps)
  },

  // Cree un nouveau rendez-vous (planifie ou surprise).
  async creer(donnees) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/rendez-vous`, {
        method: 'POST',
        headers: construireEntetes(),
        body: JSON.stringify(normaliserVersApi(donnees)),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return normaliserDepuisApi(corps)
  },

  // Enregistre l arrivee d un patient (passage statut → ARRIVE).
  async enregistrerArrivee(id) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/rendez-vous/${encodeURIComponent(id)}/statut`, {
        method: 'PATCH',
        headers: construireEntetes(),
        body: JSON.stringify({ statut: 'ARRIVE' }),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return normaliserDepuisApi(corps)
  },

  // Compte le nombre de rendez-vous actifs pour un service et une date (verification capacite).
  async compterParServiceEtDate(service, date) {
    const liste = await this.lister({ date, serviceDestination: service })
    return liste.filter((rdv) => {
      const s = (rdv.statut ?? '').toLowerCase()
      return s !== 'annule'
    }).length
  },

  // Met a jour le statut d un rendez-vous.
  async mettreAJourStatut(id, statut) {
    const statutBackend = STATUT_VERS_BACKEND[statut] ?? statut
    let reponse
    try {
      reponse = await fetch(`${URL_API}/rendez-vous/${encodeURIComponent(id)}/statut`, {
        method: 'PATCH',
        headers: construireEntetes(),
        body: JSON.stringify({ statut: statutBackend }),
      })
    } catch {
      throw new Error('Impossible de mettre a jour le statut.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return normaliserDepuisApi(corps)
  },

  // Reprogramme un rendez-vous avec une nouvelle date et heure.
  async reprogrammer(id, date, heure) {
    let reponse
    try {
      reponse = await fetch(`${URL_API}/rendez-vous/${encodeURIComponent(id)}/reprogrammer`, {
        method: 'PATCH',
        headers: construireEntetes(),
        body: JSON.stringify({ dateRdv: date, heureRdv: heure }),
      })
    } catch {
      throw new Error('Impossible de reprogrammer le rendez-vous.')
    }

    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(construireMessageErreur(reponse, corps))
    return normaliserDepuisApi(corps)
  },
}

export default serviceRendezVousApi

