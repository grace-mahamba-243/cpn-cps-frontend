import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormulaireConnexion from '../composants/FormulaireConnexion'
import PanneauMarqueConnexion from '../composants/PanneauMarqueConnexion'

export default function PageConnexion() {
  const navigate = useNavigate()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [motDePasseVisible, setMotDePasseVisible] = useState(false)
  const [enChargement, setEnChargement] = useState(false)
  const [messageErreur, setMessageErreur] = useState('')

  const gererSoumission = (event) => {
    event.preventDefault()

    if (!identifiant.trim() || !motDePasse.trim()) {
      setMessageErreur('L identifiant ou le mot de passe est incorrect.')
      return
    }

    setMessageErreur('')
    setEnChargement(true)

    setTimeout(() => {
      setEnChargement(false)
      navigate('/tableau-de-bord')
    }, 1500)
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
