import { Link } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import Bouton from '../../../composants/interface/Bouton'
import ChampTexte from '../../../composants/interface/ChampTexte'

function FormulaireConnexion({
  identifiant,
  motDePasse,
  seSouvenir,
  onIdentifiantChange,
  onMotDePasseChange,
  onSeSouvenirChange,
  onSubmit,
}) {
  return (
    <div className="formulaire-connexion-module">
      <div className="formulaire-connexion-module__entete">
        <h2>Bienvenue</h2>
        <p className="etat-information">Connectez-vous a votre espace clinique.</p>
      </div>

      <form className="formulaire-connexion" onSubmit={onSubmit}>
        <Alerte type="info" titre="Socle frontend pret">
          La logique metier reste separee. Cette page sert de base propre pour l integration.
        </Alerte>

        <ChampTexte
          id="identifiant"
          label="Identifiant medical ou email"
          placeholder="nom@himbihealth.com"
          value={identifiant}
          onChange={onIdentifiantChange}
          autoComplete="username"
          required
        />

        <ChampTexte
          id="mot-de-passe"
          label="Mot de passe"
          type="password"
          placeholder="********"
          value={motDePasse}
          onChange={onMotDePasseChange}
          autoComplete="current-password"
          required
        />

        <div className="formulaire-connexion__options">
          <label className="formulaire-connexion__memoire" htmlFor="souvenir">
            <input
              id="souvenir"
              type="checkbox"
              checked={seSouvenir}
              onChange={onSeSouvenirChange}
            />
            <span>Se souvenir de moi</span>
          </label>

          <Link to="/acces-refuse" className="formulaire-connexion__lien">
            Mot de passe oublie ?
          </Link>
        </div>

        <Bouton type="submit" variant="primaire" taille="grand" pleineLargeur>
          Se connecter
        </Bouton>
      </form>

      <p className="formulaire-connexion-module__pied">
        Acces reserve au personnel autorise. Besoin d aide ?{' '}
        <Link to="/acces-refuse" className="formulaire-connexion__lien">
          Contacter l administration
        </Link>
      </p>
    </div>
  )
}

export default FormulaireConnexion