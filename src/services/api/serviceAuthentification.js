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

function construireMessageErreur(reponse, corps) {
  if (typeof corps?.message === 'string') {
    return corps.message
  }

  if (Array.isArray(corps?.message) && corps.message.length > 0) {
    return corps.message[0]
  }

  if (reponse.status === 401) {
    return 'Identifiant ou mot de passe invalide.'
  }

  if (reponse.status >= 500) {
    return 'Le serveur est indisponible pour le moment. Veuillez reessayer.'
  }

  return 'La connexion a echoue. Veuillez verifier les informations saisies.'
}

function normaliserSession(payload) {
  const utilisateur = payload?.utilisateur
  const expiration = Number(payload?.expiration ?? payload?.session?.expiration)
  const sessionId = payload?.session?.id ?? null

  if (!utilisateur || !Number.isFinite(expiration)) {
    throw new Error('La reponse du serveur est incomplete pour initialiser la session.')
  }

  return {
    utilisateur,
    expiration,
    sessionId,
    message: payload?.message ?? 'Connexion reussie.',
  }
}

function normaliserUtilisateur(payload) {
  const utilisateur = payload?.utilisateur

  if (!utilisateur) {
    throw new Error("La reponse du serveur est incomplete pour mettre a jour l'utilisateur.")
  }

  return {
    utilisateur,
    message: payload?.message ?? 'Mot de passe modifie avec succes.',
  }
}

// Ce service centralise les appels HTTP d'authentification et normalise les reponses
// du backend pour les rendre directement exploitables par le frontend.
const serviceAuthentification = {
  async connexion({ identifiant, motDePasse }) {
    const identifiantNettoye = identifiant.trim()
    const motDePasseNettoye = motDePasse.trim()

    if (!identifiantNettoye || !motDePasseNettoye) {
      throw new Error('Veuillez renseigner votre identifiant et votre mot de passe.')
    }

    if (motDePasseNettoye.length < 4) {
      throw new Error('Le mot de passe doit contenir au moins 4 caracteres.')
    }

    let reponse

    try {
      reponse = await fetch(`${URL_API}/auth/connexion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifiant: identifiantNettoye,
          motDePasse: motDePasseNettoye,
        }),
      })
    } catch {
      throw new Error('Impossible de joindre le serveur d authentification.')
    }

    const corps = await lireCorpsJson(reponse)

    if (!reponse.ok) {
      throw new Error(construireMessageErreur(reponse, corps))
    }

    return normaliserSession(corps)
  },

  async deconnexion({ identifiant, sessionId }) {
    if (!identifiant) {
      return
    }

    try {
      await fetch(`${URL_API}/auth/deconnexion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifiant,
          sessionId,
        }),
      })
    } catch {
      return
    }
  },

  async changerMotDePasse({ identifiant, motDePasseActuel, nouveauMotDePasse }) {
    const identifiantNettoye = identifiant.trim()
    const motDePasseActuelNettoye = motDePasseActuel.trim()
    const nouveauMotDePasseNettoye = nouveauMotDePasse.trim()

    if (!identifiantNettoye || !motDePasseActuelNettoye || !nouveauMotDePasseNettoye) {
      throw new Error('Veuillez renseigner tous les champs obligatoires.')
    }

    if (nouveauMotDePasseNettoye.length < 4) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 4 caracteres.')
    }

    let reponse

    try {
      reponse = await fetch(`${URL_API}/auth/changer-mot-de-passe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifiant: identifiantNettoye,
          motDePasseActuel: motDePasseActuelNettoye,
          nouveauMotDePasse: nouveauMotDePasseNettoye,
        }),
      })
    } catch {
      throw new Error("Impossible de joindre le serveur d'authentification.")
    }

    const corps = await lireCorpsJson(reponse)

    if (!reponse.ok) {
      throw new Error(construireMessageErreur(reponse, corps))
    }

    return normaliserUtilisateur(corps)
  },
}

export default serviceAuthentification