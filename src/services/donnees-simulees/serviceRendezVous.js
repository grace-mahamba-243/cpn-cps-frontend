const DELAI_SIMULE_MS = 220

const rendezVousSimules = [
  {
    id: 'rdv-001',
    date: '2026-04-13',
    heure: '08:30',
    typePatient: 'Mere',
    nomPatient: 'Kavira Malulu Clarisse',
    numeroDossier: '#CPN-2026-1101',
    service: 'Maternite (CPN)',
    typeRendezVous: 'Consultation standard',
    statut: 'Arrive',
    motif: 'Controle 2e trimestre',
    creeLe: '2026-04-12T16:10:00.000Z',
    arriveeEnregistreeLe: '2026-04-13T08:27:00.000Z',
  },
  {
    id: 'rdv-002',
    date: '2026-04-13',
    heure: '09:15',
    typePatient: 'Enfant',
    nomPatient: 'Bebe de Maman Furaha',
    numeroDossier: '#CPS-2026-2015',
    service: 'Pediatrie (CPS)',
    typeRendezVous: 'Vaccination',
    statut: 'Prevu',
    motif: 'Vaccin 3 mois',
    creeLe: '2026-04-12T17:20:00.000Z',
    arriveeEnregistreeLe: null,
  },
  {
    id: 'rdv-003',
    date: '2026-04-13',
    heure: '09:45',
    typePatient: 'Mere',
    nomPatient: 'Kahambu Zawadi Marie',
    numeroDossier: '#CPN-2026-0972',
    service: 'Gynecologie',
    typeRendezVous: 'Urgence / Surprise',
    statut: 'Surprise',
    motif: 'Douleurs pelviennes aigues',
    creeLe: '2026-04-13T09:35:00.000Z',
    arriveeEnregistreeLe: null,
  },
  {
    id: 'rdv-004',
    date: '2026-04-13',
    heure: '10:30',
    typePatient: 'Enfant',
    nomPatient: 'Mumbere Akilimali Luc',
    numeroDossier: '#CPS-2026-1888',
    service: 'Pediatrie',
    typeRendezVous: 'Consultation',
    statut: 'Reprogramme',
    motif: 'Suivi malnutrition',
    creeLe: '2026-04-12T12:05:00.000Z',
    arriveeEnregistreeLe: null,
  },
  {
    id: 'rdv-005',
    date: '2026-04-13',
    heure: '11:00',
    typePatient: 'Mere',
    nomPatient: 'Masika Bahati Rachel',
    numeroDossier: '#CPN-2026-1054',
    service: 'Maternite',
    typeRendezVous: 'Consultation standard',
    statut: 'Annule',
    motif: 'Visite post-natale',
    creeLe: '2026-04-11T09:45:00.000Z',
    arriveeEnregistreeLe: null,
  },
  {
    id: 'rdv-006',
    date: '2026-04-14',
    heure: '08:00',
    typePatient: 'Mere',
    nomPatient: 'Bisimwa Aline Grace',
    numeroDossier: '#CPN-2026-1180',
    service: 'Maternite (CPN)',
    typeRendezVous: 'Suivi',
    statut: 'Prevu',
    motif: 'CPN de suivi',
    creeLe: '2026-04-12T10:12:00.000Z',
    arriveeEnregistreeLe: null,
  },
]

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
}

export default serviceRendezVous
