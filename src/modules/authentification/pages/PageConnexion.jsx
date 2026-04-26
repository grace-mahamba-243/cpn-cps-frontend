import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FormulaireConnexion from '../composants/FormulaireConnexion'
import PanneauMarqueConnexion from '../composants/PanneauMarqueConnexion'
import useAuthentification from '../hooks/useAuthentification'
import { obtenirRedirectionApresConnexion } from '../../../application/routes/registreRoutes'

// Ce composant gere l'ecran de connexion, pilote le formulaire et redirige l'utilisateur
// vers l'espace prive quand la session est ouverte avec succes.
export default function PageConnexion() {
  const location = useLocation()
  const navigate = useNavigate()
  const { connexion, estConnecte, utilisateurConnecte, reinitialiserSessionExpiree } = useAuthentification()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [motDePasseVisible, setMotDePasseVisible] = useState(false)
  const [enChargement, setEnChargement] = useState(false)
  const [messageErreur, setMessageErreur] = useState('')
  const formulaireValide = Boolean(identifiant.trim() && motDePasse.trim())
  const destinationApresConnexion = obtenirRedirectionApresConnexion(utilisateurConnecte, location.state?.de)

  useEffect(() => {
    reinitialiserSessionExpiree()
  }, [reinitialiserSessionExpiree])

  useEffect(() => {
    if (estConnecte) {
      navigate(destinationApresConnexion, { replace: true })
    }
  }, [destinationApresConnexion, estConnecte, navigate])

  const gererSoumission = async (event) => {
    event.preventDefault()

    setMessageErreur('')
    setEnChargement(true)

    try {
      const utilisateurAuthentifie = await connexion({ identifiant, motDePasse })
      navigate(obtenirRedirectionApresConnexion(utilisateurAuthentifie, location.state?.de), { replace: true })
    } catch (error) {
      setMessageErreur(error.message)
    } finally {
      setEnChargement(false)
    }
  }

  const gererChangementIdentifiant = (event) => {
    setIdentifiant(event.target.value)
    if (messageErreur) {
      setMessageErreur('')
    }
  }

  const gererChangementMotDePasse = (event) => {
    setMotDePasse(event.target.value)
    if (messageErreur) {
      setMessageErreur('')
    }
  }

  return (
    <>
      <main className="relative left-1/2 grid min-h-screen w-screen -translate-x-1/2 md:grid-cols-2">
        <PanneauMarqueConnexion />

        <FormulaireConnexion
          identifiant={identifiant}
          motDePasse={motDePasse}
          motDePasseVisible={motDePasseVisible}
          enChargement={enChargement}
          messageErreur={messageErreur}
          formulaireValide={formulaireValide}
          onIdentifiantChange={gererChangementIdentifiant}
          onMotDePasseChange={gererChangementMotDePasse}
          onMotDePasseVisibleChange={() => setMotDePasseVisible((visible) => !visible)}
          onSubmit={gererSoumission}
        />
      </main>

    </>
  )
}
