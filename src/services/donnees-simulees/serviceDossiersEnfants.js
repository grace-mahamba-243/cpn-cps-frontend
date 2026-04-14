const CLE_STOCKAGE_DOSSIERS_ENFANTS = 'cpn-cps-dossiers-enfants'

const DONNEES_INITIALES = [
  {
    id: 'enfant-1',
    numeroFiche: 'EF-2024-0892',
    nom: 'Kavira',
    postnom: 'Mukoko',
    prenom: 'Emmanuella',
    sexe: 'F',
    dateNaissance: '2023-03-12',
    nomMere: 'Kahindo Marline',
    nomPere: 'Mukoko Alphonse',
    telephone: '+243 972 110 002',
    adresse: 'Quartier Himbi, Avenue de la Clinique 8',
    dateEnregistrement: '2024-01-14',
  },
  {
    id: 'enfant-2',
    numeroFiche: 'EF-2024-0891',
    nom: 'Mumbere',
    postnom: 'Salama',
    prenom: 'Jordan',
    sexe: 'M',
    dateNaissance: '2022-11-05',
    nomMere: 'Muhindo Sylvie',
    nomPere: 'Salama Vianney',
    telephone: '+243 814 556 221',
    adresse: 'Quartier Katoyi, Avenue Virunga 12',
    dateEnregistrement: '2024-01-13',
  },
  {
    id: 'enfant-3',
    numeroFiche: 'EF-2024-0890',
    nom: 'Paluku',
    postnom: 'Kalemo',
    prenom: 'David',
    sexe: 'M',
    dateNaissance: '2024-01-22',
    nomMere: 'Neema Sifa',
    nomPere: 'Kalemo Safari',
    telephone: '+243 998 443 112',
    adresse: 'Quartier Mabanga Nord, Cellule Bujovu',
    dateEnregistrement: '2024-01-12',
  },
  {
    id: 'enfant-4',
    numeroFiche: 'EF-2024-0889',
    nom: 'Kavira',
    postnom: 'Katsurana',
    prenom: 'Noella',
    sexe: 'F',
    dateNaissance: '2023-08-30',
    nomMere: 'Masika Anuarite',
    nomPere: 'Katsurana Moise',
    telephone: '+243 821 334 556',
    adresse: 'Quartier Ndosho, Avenue Lac Vert 3',
    dateEnregistrement: '2024-01-10',
  },
]

function peutUtiliserStockage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function lireDossiersStockes() {
  if (!peutUtiliserStockage()) {
    return [...DONNEES_INITIALES]
  }

  const donneesBrutes = window.localStorage.getItem(CLE_STOCKAGE_DOSSIERS_ENFANTS)

  if (!donneesBrutes) {
    window.localStorage.setItem(CLE_STOCKAGE_DOSSIERS_ENFANTS, JSON.stringify(DONNEES_INITIALES))
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

  window.localStorage.setItem(CLE_STOCKAGE_DOSSIERS_ENFANTS, JSON.stringify(dossiers))
}

const serviceDossiersEnfants = {
  async lister() {
    return lireDossiersStockes()
  },

  async recupererParId(enfantId) {
    const dossiers = lireDossiersStockes()
    return dossiers.find((dossier) => dossier.id === enfantId) ?? null
  },

  async creer(dossier) {
    const dossiers = lireDossiersStockes()
    const nouveauDossier = {
      ...dossier,
      id: `enfant-${Date.now()}`,
    }

    const prochainEtat = [nouveauDossier, ...dossiers]
    enregistrerDossiers(prochainEtat)
    return nouveauDossier
  },
}

export default serviceDossiersEnfants