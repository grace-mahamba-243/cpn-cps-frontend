const CLE_STOCKAGE_DOSSIERS_MERES = 'cpn-cps-dossiers-meres'

const DONNEES_INITIALES = [
  {
    id: 'mere-1',
    numeroDossier: '#CPN-2023-0842',
    nom: 'Kavira',
    postnom: 'Masika',
    prenom: 'Marie',
    dateNaissance: '1995-05-10',
    age: 28,
    adresse: 'Quartier Himbi, Av. de la Paix 14',
    telephone: '+243 998 765 432',
    etatMatrimonial: 'Mariee',
    nomPartenaire: 'Masika Jean',
    occupationFemme: 'Commercante',
    occupationHomme: 'Chauffeur',
    personneUrgence: 'Kavira Chantal',
    telephoneUrgence: '+243 990 100 100',
    adresseUrgence: 'Quartier Himbi, Av. de la Paix 10',
    dateEnregistrement: '2023-10-12',
  },
  {
    id: 'mere-2',
    numeroDossier: '#CPN-2023-0855',
    nom: 'Kahambu',
    postnom: 'Zawadi',
    prenom: 'Prisca',
    dateNaissance: '1991-03-12',
    age: 32,
    adresse: 'Quartier Katindo, Cellule Museko',
    telephone: '+243 812 334 556',
    etatMatrimonial: 'Mariee',
    nomPartenaire: 'Zawadi Michel',
    occupationFemme: 'Enseignante',
    occupationHomme: 'Macon',
    personneUrgence: 'Kahambu Esperance',
    telephoneUrgence: '+243 812 300 222',
    adresseUrgence: 'Quartier Katindo, Cellule Museko',
    dateEnregistrement: '2023-10-15',
  },
  {
    id: 'mere-3',
    numeroDossier: '#CPN-2023-0861',
    nom: 'Maman',
    postnom: 'Sifa',
    prenom: 'Beatrice',
    dateNaissance: '1999-08-21',
    age: 24,
    adresse: 'Quartier Mabanga, Avenue Kasa-Vubu',
    telephone: '+243 970 123 456',
    etatMatrimonial: 'Celibataire',
    nomPartenaire: '',
    occupationFemme: 'Etudiante',
    occupationHomme: '',
    personneUrgence: 'Maman Amina',
    telephoneUrgence: '+243 970 000 456',
    adresseUrgence: 'Quartier Mabanga, Avenue Kasa-Vubu',
    dateEnregistrement: '2023-10-18',
  },
]

function peutUtiliserStockage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function lireDossiersStockes() {
  if (!peutUtiliserStockage()) {
    return [...DONNEES_INITIALES]
  }

  const donneesBrutes = window.localStorage.getItem(CLE_STOCKAGE_DOSSIERS_MERES)

  if (!donneesBrutes) {
    window.localStorage.setItem(CLE_STOCKAGE_DOSSIERS_MERES, JSON.stringify(DONNEES_INITIALES))
    return [...DONNEES_INITIALES]
  }

  try {
    const dossiers = JSON.parse(donneesBrutes)

    if (!Array.isArray(dossiers)) {
      return [...DONNEES_INITIALES]
    }

    return dossiers
  } catch {
    return [...DONNEES_INITIALES]
  }
}

function enregistrerDossiers(dossiers) {
  if (!peutUtiliserStockage()) {
    return
  }

  window.localStorage.setItem(CLE_STOCKAGE_DOSSIERS_MERES, JSON.stringify(dossiers))
}

const serviceDossiersMeres = {
  async lister() {
    return lireDossiersStockes()
  },

  async recupererParId(mereId) {
    const dossiers = lireDossiersStockes()
    return dossiers.find((dossier) => dossier.id === mereId) ?? null
  },

  async creer(dossier) {
    const dossiers = lireDossiersStockes()
    const nouveauDossier = {
      ...dossier,
      id: `mere-${Date.now()}`,
    }

    const prochainEtat = [nouveauDossier, ...dossiers]
    enregistrerDossiers(prochainEtat)
    return nouveauDossier
  },

  async modifier(mereId, donnees) {
    const dossiers = lireDossiersStockes()
    const indexDossier = dossiers.findIndex((dossier) => dossier.id === mereId)

    if (indexDossier === -1) {
      return null
    }

    const dossierActuel = dossiers[indexDossier]
    const dossierMisAJour = {
      ...dossierActuel,
      ...donnees,
      id: dossierActuel.id,
    }

    const prochainEtat = [...dossiers]
    prochainEtat[indexDossier] = dossierMisAJour
    enregistrerDossiers(prochainEtat)

    return dossierMisAJour
  },
}

export default serviceDossiersMeres