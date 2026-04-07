const DUREE_SESSION_MS = 30 * 60 * 1000

function pause(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function normaliserNomAffichage(identifiant) {
  const prefixe = identifiant.split('@')[0] ?? identifiant

  return prefixe
    .split(/[._-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

function determinerRole(identifiant) {
  const identifiantNormalise = identifiant.toLowerCase()

  if (identifiantNormalise.startsWith('admin')) {
    return 'Administrateur'
  }

  if (identifiantNormalise.startsWith('superviseur')) {
    return 'Superviseur'
  }

  return 'Agent clinique'
}

// Ce service centralise la logique frontend d'authentification, simule l'appel de connexion
// et retourne soit une session exploitable, soit un message d'erreur clair pour l'interface.
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

    await pause(900)

    return {
      utilisateur: {
        id: identifiantNettoye,
        identifiant: identifiantNettoye,
        nomAffichage: normaliserNomAffichage(identifiantNettoye),
        role: determinerRole(identifiantNettoye),
      },
      expiration: Date.now() + DUREE_SESSION_MS,
      message: 'Connexion reussie.',
    }
  },
}

export default serviceAuthentification