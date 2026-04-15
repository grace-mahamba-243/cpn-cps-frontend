const DELAI_SIMULE_MS = 220

// Les donnees statiques ont ete supprimees. Ce service est conserve uniquement
// comme reference de l interface. Toutes les pages utilisent desormais api/serviceRendezVous.js.
const rendezVousSimules = []

let etatRendezVous = [...rendezVousSimules]

function attendre() {
  return new Promise((resolve) => {
    setTimeout(resolve, DELAI_SIMULE_MS)
  })
}

function dupliquer(valeur) {
  return JSON.parse(JSON.stringify(valeur))
}

function genererIdRendezVous() {
  const suffixe = String(Date.now()).slice(-6)
  return `rdv-${suffixe}`
}

// Ce service simule les operations administratives de rendez-vous sans exposer de donnees cliniques.
const serviceRendezVous = {
  async lister() {
    await attendre()
    return dupliquer(etatRendezVous)
  },

  async recupererParId(rendezVousId) {
    await attendre()
    const rendezVous = etatRendezVous.find((ligne) => ligne.id === rendezVousId)
    return rendezVous ? dupliquer(rendezVous) : null
  },

  async creer(donneesRendezVous) {
    await attendre()

    const nouveauRendezVous = {
      id: genererIdRendezVous(),
      date: donneesRendezVous.date,
      heure: donneesRendezVous.heure,
      typePatient: donneesRendezVous.typePatient,
      nomPatient: donneesRendezVous.nomPatient,
      numeroDossier: donneesRendezVous.numeroDossier,
      service: donneesRendezVous.service,
      typeRendezVous: donneesRendezVous.typeRendezVous,
      statut: donneesRendezVous.statut,
      motif: donneesRendezVous.motif,
      creeLe: new Date().toISOString(),
      arriveeEnregistreeLe: null,
    }

    etatRendezVous = [nouveauRendezVous, ...etatRendezVous]
    return dupliquer(nouveauRendezVous)
  },

  async enregistrerArrivee(rendezVousId) {
    await attendre()
    const index = etatRendezVous.findIndex((ligne) => ligne.id === rendezVousId)

    if (index === -1) {
      return null
    }

    const courant = etatRendezVous[index]
    const misAJour = {
      ...courant,
      statut: 'Arrive',
      arriveeEnregistreeLe: new Date().toISOString(),
    }

    etatRendezVous = [
      ...etatRendezVous.slice(0, index),
      misAJour,
      ...etatRendezVous.slice(index + 1),
    ]

    return dupliquer(misAJour)
  },

  // Retourne le nombre de rendez-vous deja enregistres pour un service et une date donnee.
  // Utilise pour verifier la capacite journaliere avant de bloquer l enregistrement.
  async compterParServiceEtDate(service, date) {
    await attendre()
    return etatRendezVous.filter(
      (rdv) => normaliserCle(rdv.service) === normaliserCle(service) && rdv.date === date && normaliserCle(rdv.statut) !== 'annule',
    ).length
  },
}

function normaliserCle(valeur = '') {
  return valeur
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default serviceRendezVous
