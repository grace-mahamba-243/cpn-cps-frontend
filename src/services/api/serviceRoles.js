const URL_API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

async function lireCorpsJson(reponse) {
  const texte = await reponse.text()

  if (!texte) {
    return null
  }

  try {
    return JSON.parse(texte)
  } catch {
    return null
  }
}

function extraireMessageErreur(corps, messageParDefaut) {
  if (typeof corps?.message === 'string') {
    return corps.message
  }

  if (Array.isArray(corps?.message) && corps.message.length > 0) {
    return corps.message.join(' ')
  }

  return messageParDefaut
}

// Ce service centralise les appels API backend du module roles.
const serviceRoles = {
  async recupererListe() {
    const reponse = await fetch(`${URL_API}/roles`)
    const corps = await lireCorpsJson(reponse)

    if (!reponse.ok) {
      throw new Error(extraireMessageErreur(corps, 'Impossible de charger les roles.'))
    }

    if (Array.isArray(corps?.roles)) {
      return corps.roles
    }

    return []
  },

  async creerRole(donneesRole) {
    const reponse = await fetch(`${URL_API}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        libelle: donneesRole.libelle,
        code: donneesRole.code,
      }),
    })

    const corps = await lireCorpsJson(reponse)

    if (!reponse.ok) {
      throw new Error(extraireMessageErreur(corps, 'Impossible de creer le role.'))
    }

    return corps?.role ?? corps
  },
}

export default serviceRoles
