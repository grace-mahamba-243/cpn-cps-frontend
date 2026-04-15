const CLE_STOCKAGE_DOSSIERS_ENFANTS = 'cpn-cps-dossiers-enfants'

// Les donnees initiales statiques ont ete supprimees.
// Ce service est conserve pour compatibilite mais toutes les pages utilisent api/serviceDossiersEnfants.js.
const DONNEES_INITIALES = []

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