import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormulaireConnexion from '../../modules/authentification/composants/FormulaireConnexion'
import PanneauMarqueConnexion from '../../modules/authentification/composants/PanneauMarqueConnexion'

function ConnexionPage() {
  const navigate = useNavigate()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [seSouvenir, setSeSouvenir] = useState(true)

  const gererSoumission = (event) => {
    event.preventDefault()
    navigate('/tableau-de-bord')
  }

  return (
    <section className="page-connexion">
      <PanneauMarqueConnexion />

      <FormulaireConnexion
        identifiant={identifiant}
        motDePasse={motDePasse}
        seSouvenir={seSouvenir}
        onIdentifiantChange={(event) => setIdentifiant(event.target.value)}
        onMotDePasseChange={(event) => setMotDePasse(event.target.value)}
        onSeSouvenirChange={(event) => setSeSouvenir(event.target.checked)}
        onSubmit={gererSoumission}
      />
    </section>
  )
}

export default ConnexionPage