// Ce service gere les appels API du journal d'activites (historique des actions).
const URL_API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

function construireEntetes() {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function lireCorpsJson(reponse) {
  const texte = await reponse.text()
  if (!texte) return null
  try { return JSON.parse(texte) } catch { return null }
}

const serviceJournal = {
  // Liste les entrées du journal avec filtres optionnels
  async lister(filtres = {}) {
    const params = new URLSearchParams()
    if (filtres.utilisateurId) params.set('utilisateurId', filtres.utilisateurId)
    if (filtres.module) params.set('module', filtres.module)
    if (filtres.typeAction) params.set('typeAction', filtres.typeAction)
    if (filtres.dateDebut) params.set('dateDebut', filtres.dateDebut)
    if (filtres.dateFin) params.set('dateFin', filtres.dateFin)
    if (filtres.limite) params.set('limite', String(filtres.limite))
    if (filtres.page) params.set('page', String(filtres.page))

    const suffixe = params.toString() ? `?${params.toString()}` : ''
    let reponse
    try {
      reponse = await fetch(`${URL_API}/journal${suffixe}`, { headers: construireEntetes() })
    } catch {
      throw new Error('Impossible de joindre le serveur.')
    }
    const corps = await lireCorpsJson(reponse)
    if (!reponse.ok) throw new Error(corps?.message ?? 'Erreur lors du chargement du journal.')
    return corps
  },
}

export default serviceJournal
