import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import Bouton from '../../composants/interface/Bouton'
import Carte from '../../composants/interface/Carte'
import ChampTexte from '../../composants/interface/ChampTexte'

function ConnexionPage() {
  const navigate = useNavigate()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const gererSoumission = (event) => {
    event.preventDefault()
    navigate('/tableau-de-bord')
  }

  return (
    <Carte
      titre="Connexion"
      description="Accedez a l'application avec un formulaire minimal en attendant la logique metier."
    >
      <form className="formulaire-connexion" onSubmit={gererSoumission}>
        <Alerte>Socle frontend pret. La logique d'authentification sera ajoutee plus tard.</Alerte>

        <ChampTexte
          id="identifiant"
          label="Identifiant"
          placeholder="Entrez votre identifiant"
          value={identifiant}
          onChange={(event) => setIdentifiant(event.target.value)}
          autoComplete="username"
          required
        />

        <ChampTexte
          id="mot-de-passe"
          label="Mot de passe"
          type="password"
          placeholder="Entrez votre mot de passe"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          autoComplete="current-password"
          required
        />

        <Bouton type="submit">Se connecter</Bouton>
      </form>
    </Carte>
  )
}

export default ConnexionPage