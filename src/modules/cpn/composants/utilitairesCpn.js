// Fonctions utilitaires partagées pour le module CPN (formatage dates, calcul âge).

export function calculerAge(dateNaissance) {
  if (!dateNaissance) return null
  return Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000))
}

export function formaterDateFr(isoStr) {
  if (!isoStr) return null
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoStr))
  } catch { return isoStr }
}

export function formaterDateCourte(isoStr) {
  if (!isoStr) return null
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(isoStr))
  } catch { return isoStr }
}
