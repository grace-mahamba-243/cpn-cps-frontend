import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import serviceAuthentification from '../../../services/api/serviceAuthentification'
import serviceGestionAcces from '../../../services/api/serviceGestionAcces'
import {
  enrichirUtilisateur,
  possedeAuMoinsUnePermission,
  possedeToutesLesPermissions,
  possedeUnePermission,
  verifierAccesParPermissions,
} from '../../gestion-acces/controle-acces'

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

function enrichirUtilisateurAuthentifie(utilisateur) {
  const utilisateurLocal = serviceGestionAcces.recupererUtilisateurLocalParIdentifiant(
    utilisateur?.identifiant,
  )
  const roles = serviceGestionAcces.lireEtatLocal().roles

  return enrichirUtilisateur(
    {
      ...utilisateurLocal,
      ...utilisateur,
      accesSpecifiques: utilisateurLocal?.accesSpecifiques ?? utilisateur?.accesSpecifiques,
    },
    roles,
  )
}

function fusionnerUtilisateurAuthentifie(utilisateurSource, utilisateurMaj) {
  return {
    ...utilisateurSource,
    ...utilisateurMaj,
    accesSpecifiques: utilisateurSource?.accesSpecifiques ?? utilisateurMaj?.accesSpecifiques,
  }
}

function determinerEtatSessionInitial() {
  const session = lireSessionStockee()

  if (!session) {
    return {
      utilisateurConnecte: null,
      sessionExpiree: false,
      estInitialisation: false,
    }
  }

  if (sessionEstExpiree(session.expiration)) {
    nettoyerSessionStockee()

    return {
      utilisateurConnecte: null,
      sessionExpiree: true,
      estInitialisation: false,
    }
  }

  return {
    utilisateurConnecte: enrichirUtilisateurAuthentifie(session.utilisateur),
    sessionExpiree: false,
    estInitialisation: false,
  }
}

// Ce composant fournit l'etat global d'authentification, gere la persistance de la session
// et expose les actions de connexion, deconnexion et expiration a toute l'application.
function FournisseurAuthentification({ children }) {
  const etatSessionInitial = determinerEtatSessionInitial()
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(etatSessionInitial.utilisateurConnecte)
  const [sessionExpiree, setSessionExpiree] = useState(etatSessionInitial.sessionExpiree)
  const [estInitialisation] = useState(etatSessionInitial.estInitialisation)
  const expirationTimeoutRef = useRef(null)

  const viderMinuteurExpiration = () => {
    if (expirationTimeoutRef.current) {
      window.clearTimeout(expirationTimeoutRef.current)
      expirationTimeoutRef.current = null
    }
  }

  const deconnexion = useCallback(({ sessionExpiree: expirationForcee = false } = {}) => {
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
  }, [])

  const programmerExpiration = useCallback(
    (expiration) => {
    viderMinuteurExpiration()

    const delaiRestant = expiration - Date.now()

    if (delaiRestant <= 0) {
      deconnexion({ sessionExpiree: true })
      return
    }

    expirationTimeoutRef.current = window.setTimeout(() => {
      deconnexion({ sessionExpiree: true })
    }, delaiRestant)
    },
    [deconnexion],
  )

  const appliquerSession = useCallback(
    (session) => {
    setUtilisateurConnecte(enrichirUtilisateurAuthentifie(session.utilisateur))
    setSessionExpiree(false)
    programmerExpiration(session.expiration)
    },
    [programmerExpiration],
  )

  const connexion = async ({ identifiant, motDePasse }) => {
    const session = await serviceAuthentification.connexion({ identifiant, motDePasse })
    const utilisateurEnrichi = enrichirUtilisateurAuthentifie(session.utilisateur)

    sauvegarderSession(utilisateurEnrichi, session.expiration, session.sessionId ?? null)
    appliquerSession({ ...session, utilisateur: utilisateurEnrichi })

    return utilisateurEnrichi
  }

  const changerMotDePasseObligatoire = async ({ motDePasseActuel, nouveauMotDePasse }) => {
    if (!utilisateurConnecte?.identifiant) {
      throw new Error("Aucun utilisateur connecte pour changer le mot de passe.")
    }

    const reponse = await serviceAuthentification.changerMotDePasse({
      identifiant: utilisateurConnecte.identifiant,
      motDePasseActuel,
      nouveauMotDePasse,
    })

    const sessionCourante = lireSessionStockee()
    const utilisateurFusionne = fusionnerUtilisateurAuthentifie(utilisateurConnecte, reponse.utilisateur)
    const utilisateurEnrichi = enrichirUtilisateurAuthentifie(utilisateurFusionne)

    if (sessionCourante) {
      sauvegarderSession(utilisateurEnrichi, sessionCourante.expiration, sessionCourante.sessionId ?? null)
    }

    setUtilisateurConnecte(utilisateurEnrichi)

    return utilisateurEnrichi
  }

  const reinitialiserSessionExpiree = () => {
    setSessionExpiree(false)
  }

  useEffect(() => {
    const session = lireSessionStockee()

    if (!session) {
      return undefined
    }

    if (sessionEstExpiree(session.expiration)) {
      nettoyerSessionStockee()
      return undefined
    }

    viderMinuteurExpiration()
    expirationTimeoutRef.current = window.setTimeout(
      () => deconnexion({ sessionExpiree: true }),
      session.expiration - Date.now(),
    )

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

    const synchroniserConfigurationAcces = () => {
      const sessionMiseAJour = lireSessionStockee()

      if (!sessionMiseAJour) {
        return
      }

      const utilisateurEnrichi = enrichirUtilisateurAuthentifie(sessionMiseAJour.utilisateur)

      sauvegarderSession(utilisateurEnrichi, sessionMiseAJour.expiration, sessionMiseAJour.sessionId ?? null)
      setUtilisateurConnecte(utilisateurEnrichi)
    }

    window.addEventListener('storage', synchroniserSession)
    window.addEventListener(serviceGestionAcces.evenementMiseAJour, synchroniserConfigurationAcces)

    return () => {
      window.removeEventListener('storage', synchroniserSession)
      window.removeEventListener(serviceGestionAcces.evenementMiseAJour, synchroniserConfigurationAcces)
      viderMinuteurExpiration()
    }
  }, [appliquerSession, deconnexion])

  const permissionsUtilisateur = utilisateurConnecte?.permissions ?? []

  const valeur = {
    utilisateurConnecte,
    permissionsUtilisateur,
    estConnecte: Boolean(utilisateurConnecte),
    estNonConnecte: !utilisateurConnecte,
    etatAuthentification: utilisateurConnecte ? 'connecte' : 'non-connecte',
    sessionExpiree,
    estInitialisation,
    connexion,
    changerMotDePasseObligatoire,
    deconnexion,
    possedePermission: (permission) => possedeUnePermission(permissionsUtilisateur, permission),
    possedeToutesLesPermissions: (permissions) =>
      possedeToutesLesPermissions(permissionsUtilisateur, permissions),
    possedeAuMoinsUnePermission: (permissions) =>
      possedeAuMoinsUnePermission(permissionsUtilisateur, permissions),
    peutAcceder: (permissions, { mode = 'toutes' } = {}) =>
      verifierAccesParPermissions(permissionsUtilisateur, permissions, mode),
    reinitialiserSessionExpiree,
  }

  return <ContexteAuthentification.Provider value={valeur}>{children}</ContexteAuthentification.Provider>
}

export { ContexteAuthentification, FournisseurAuthentification }