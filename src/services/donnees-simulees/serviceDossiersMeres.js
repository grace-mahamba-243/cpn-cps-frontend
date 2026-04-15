const CLE_STOCKAGE_DOSSIERS_MERES = 'cpn-cps-dossiers-meres'

// Les donnees initiales statiques ont ete supprimees.
// Ce service est conserve pour compatibilite mais toutes les pages utilisent api/serviceDossiersMeres.js.
const DONNEES_INITIALES = []

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