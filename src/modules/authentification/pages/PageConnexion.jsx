import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FormulaireConnexion from '../composants/FormulaireConnexion'
import PanneauMarqueConnexion from '../composants/PanneauMarqueConnexion'
import useAuthentification from '../hooks/useAuthentification'

// Ce composant gere l'ecran de connexion, pilote le formulaire et redirige l'utilisateur
// vers l'espace prive quand la session est ouverte avec succes.
export default function PageConnexion() {
  const location = useLocation()
  const navigate = useNavigate()
  const { connexion, estConnecte, reinitialiserSessionExpiree } = useAuthentification()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [motDePasseVisible, setMotDePasseVisible] = useState(false)
  const [enChargement, setEnChargement] = useState(false)
  const [messageErreur, setMessageErreur] = useState('')
  const formulaireValide = Boolean(identifiant.trim() && motDePasse.trim())
  const destinationApresConnexion = location.state?.de ?? '/tableau-de-bord'

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
      await connexion({ identifiant, motDePasse })
      navigate(destinationApresConnexion, { replace: true })
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

      <div className="fixed bottom-8 right-8 z-50">
        <button className="group flex h-14 w-14 items-center justify-center rounded-full bg-tertiary text-on-tertiary shadow-xl transition-transform hover:scale-110 active:scale-95">
          <span className="material-symbols-outlined">support_agent</span>
          <span className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-on-surface px-3 py-1 text-xs text-surface opacity-0 transition-opacity group-hover:opacity-100">
            Assistance Directe
          </span>
        </button>
      </div>
    </>
  )
}
