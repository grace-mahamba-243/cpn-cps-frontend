import { createContext, useEffect, useRef, useState } from 'react'
import serviceAuthentification from '../../../services/api/serviceAuthentification'

const CLE_STOCKAGE_SESSION = 'cpn-cps-session'

const ContexteAuthentification = createContext(undefined)

function nettoyerSessionStockee() {
  localStorage.removeItem(CLE_STOCKAGE_SESSION)
}

function lireSessionStockee() {
  const sessionSerialisee = localStorage.getItem(CLE_STOCKAGE_SESSION)

  if (!sessionSerialisee) {
    return null
  }

  try {
    const session = JSON.parse(sessionSerialisee)

    if (!session?.utilisateur || !session?.expiration) {
      nettoyerSessionStockee()
      return null
    }

    return session
  } catch {
    nettoyerSessionStockee()
    return null
  }
}

function sauvegarderSession(utilisateur, expiration, sessionId = null) {
  localStorage.setItem(
    CLE_STOCKAGE_SESSION,
    JSON.stringify({
      utilisateur,
      expiration,
      sessionId,
    }),
  )
}

function sessionEstExpiree(expiration) {
  return !expiration || expiration <= Date.now()
}

// Ce composant fournit l'etat global d'authentification, gere la persistance de la session
// et expose les actions de connexion, deconnexion et expiration a toute l'application.
function FournisseurAuthentification({ children }) {
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null)
  const [sessionExpiree, setSessionExpiree] = useState(false)
  const [estInitialisation, setEstInitialisation] = useState(true)
  const expirationTimeoutRef = useRef(null)

  const viderMinuteurExpiration = () => {
    if (expirationTimeoutRef.current) {
      window.clearTimeout(expirationTimeoutRef.current)
      expirationTimeoutRef.current = null
    }
  }

  const deconnexion = ({ sessionExpiree: expirationForcee = false } = {}) => {
    const sessionCourante = lireSessionStockee()

    if (sessionCourante?.utilisateur?.identifiant) {
      void serviceAuthentification.deconnexion({
        identifiant: sessionCourante.utilisateur.identifiant,
        sessionId: sessionCourante.sessionId ?? null,
      })
    }

    viderMinuteurExpiration()
    nettoyerSessionStockee()
    setUtilisateurConnecte(null)
    setSessionExpiree(expirationForcee)
  }

  const programmerExpiration = (expiration) => {
    viderMinuteurExpiration()

    const delaiRestant = expiration - Date.now()

    if (delaiRestant <= 0) {
      deconnexion({ sessionExpiree: true })
      return
    }

    expirationTimeoutRef.current = window.setTimeout(() => {
      deconnexion({ sessionExpiree: true })
    }, delaiRestant)
  }

  const appliquerSession = (session) => {
    setUtilisateurConnecte(session.utilisateur)
    setSessionExpiree(false)
    programmerExpiration(session.expiration)
  }

  const connexion = async ({ identifiant, motDePasse }) => {
    const session = await serviceAuthentification.connexion({ identifiant, motDePasse })

    sauvegarderSession(session.utilisateur, session.expiration, session.sessionId ?? null)
    appliquerSession(session)

    return session.utilisateur
  }

  const reinitialiserSessionExpiree = () => {
    setSessionExpiree(false)
  }

  useEffect(() => {
    const session = lireSessionStockee()

    if (!session) {
      setEstInitialisation(false)
      return undefined
    }

    if (sessionEstExpiree(session.expiration)) {
      deconnexion({ sessionExpiree: true })
      setEstInitialisation(false)
      return undefined
    }

    appliquerSession(session)
    setEstInitialisation(false)

    const synchroniserSession = () => {
      const sessionMiseAJour = lireSessionStockee()

      if (!sessionMiseAJour) {
        deconnexion()
        return
      }

      if (sessionEstExpiree(sessionMiseAJour.expiration)) {
        deconnexion({ sessionExpiree: true })
        return
      }

      appliquerSession(sessionMiseAJour)
    }

    window.addEventListener('storage', synchroniserSession)

    return () => {
      window.removeEventListener('storage', synchroniserSession)
      viderMinuteurExpiration()
    }
  }, [])

  const valeur = {
    utilisateurConnecte,
    estConnecte: Boolean(utilisateurConnecte),
    estNonConnecte: !utilisateurConnecte,
    etatAuthentification: utilisateurConnecte ? 'connecte' : 'non-connecte',
    sessionExpiree,
    estInitialisation,
    connexion,
    deconnexion,
    reinitialiserSessionExpiree,
  }

  return <ContexteAuthentification.Provider value={valeur}>{children}</ContexteAuthentification.Provider>
}

export { ContexteAuthentification, FournisseurAuthentification }