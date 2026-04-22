// Utilitaire partage pour injecter automatiquement l'identite de l'utilisateur connecte dans les requetes API.
const CLE_STOCKAGE_SESSION = 'cpn-cps-session'

export function obtenirUtilisateurConnecte() {
  try {
    const session = JSON.parse(localStorage.getItem(CLE_STOCKAGE_SESSION) || '{}')
    const u = session?.utilisateur
    if (!u) return null
    return { id: u.id || null, nomAffichage: u.nomAffichage || u.nom || null }
  } catch {
    return null
  }
}

export function enrichirAvecUtilisateur(donnees) {
  const u = obtenirUtilisateurConnecte()
  if (!u) return donnees
  return {
    ...donnees,
    utilisateurId: donnees.utilisateurId || u.id,
    utilisateurNom: donnees.utilisateurNom || u.nomAffichage,
  }
}
