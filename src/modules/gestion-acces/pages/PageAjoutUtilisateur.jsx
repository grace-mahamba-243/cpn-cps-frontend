import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import Bouton from '../../../composants/interface/Bouton'
import serviceUtilisateurs from '../../../services/api/serviceUtilisateurs'
import { ROLES_PAR_DEFAUT } from '../controle-acces'

const ROLES_CREATION_UTILISATEUR = ROLES_PAR_DEFAUT.map((role) => ({
  code: role.code,
  libelle: role.libelle,
}))

const ETAT_INITIAL_FORMULAIRE = {
  nomComplet: '',
  sexe: '',
  dateNaissance: '',
  telephone: '',
  roleCode: 'RECEPTION',
  motDePasseInitial: '',
  confirmationMotDePasse: '',
  actif: true,
}

// Ce composant affiche le formulaire principal de creation d utilisateur et envoie
// les informations minimales au backend users, avec un fallback local si necessaire.
function PageAjoutUtilisateur() {
  const navigate = useNavigate()
  const [formulaire, setFormulaire] = useState(ETAT_INITIAL_FORMULAIRE)
  const [erreur, setErreur] = useState('')
  const [estEnregistrement, setEstEnregistrement] = useState(false)

  const mettreAJourChamp = (champ, valeur) => {
    setFormulaire((formulaireCourant) => ({
      ...formulaireCourant,
      [champ]: valeur,
    }))
  }

  const enregistrerUtilisateur = async (event) => {
    event.preventDefault()
    setErreur('')

    if (!formulaire.nomComplet.trim()) {
      setErreur('Le nom complet est obligatoire.')
      return
    }

    if (!formulaire.sexe) {
      setErreur('Veuillez selectionner le sexe.')
      return
    }

    if (!formulaire.roleCode) {
      setErreur('Ajoutez d abord un role avant de creer un utilisateur.')
      return
    }

    if (!formulaire.motDePasseInitial || formulaire.motDePasseInitial.length < 4) {
      setErreur('Le mot de passe initial doit contenir au moins 4 caracteres.')
      return
    }

    if (formulaire.motDePasseInitial !== formulaire.confirmationMotDePasse) {
      setErreur('La confirmation du mot de passe ne correspond pas.')
      return
    }

    setEstEnregistrement(true)

    try {
      await serviceUtilisateurs.creerUtilisateur({
        nomComplet: formulaire.nomComplet,
        sexe: formulaire.sexe,
        dateNaissance: formulaire.dateNaissance || null,
        telephone: formulaire.telephone || null,
        roleCode: formulaire.roleCode,
        motDePasseInitial: formulaire.motDePasseInitial,
        actif: formulaire.actif,
      })

      navigate('/admin/utilisateurs', {
        replace: true,
        state: {
          messageSucces: 'Le nouvel utilisateur a ete enregistre avec succes.',
        },
      })
    } catch (exception) {
      setErreur(exception.message)
    } finally {
      setEstEnregistrement(false)
    }
  }

  return (
    <div className="page-ajout-utilisateur">
      <header className="ajout-utilisateur__entete-page">
        <h2 className="ajout-utilisateur__titre">Créer un nouvel utilisateur</h2>
        <p className="ajout-utilisateur__description">
          Renseignez les informations essentielles pour enregistrer un nouveau membre du personnel hospitalier.
        </p>
      </header>

      {erreur ? (
        <Alerte type="erreur" titre="Enregistrement impossible">
          {erreur}
        </Alerte>
      ) : null}

      <form className="ajout-utilisateur__formulaire" onSubmit={enregistrerUtilisateur}>
        <section className="ajout-utilisateur__section">
          <div className="ajout-utilisateur__section-entete">
            <span className="ajout-utilisateur__section-barre ajout-utilisateur__section-barre--primaire" />
            <h3 className="ajout-utilisateur__section-titre">Informations personnelles</h3>
          </div>

          <div className="ajout-utilisateur__grille">
            <label className="ajout-utilisateur__champ">
              <span>Nom complet</span>
              <input
                type="text"
                placeholder="ex: Jean-Pierre Mukwege"
                value={formulaire.nomComplet}
                onChange={(event) => mettreAJourChamp('nomComplet', event.target.value)}
              />
            </label>

            <label className="ajout-utilisateur__champ">
              <span>Sexe</span>
              <select value={formulaire.sexe} onChange={(event) => mettreAJourChamp('sexe', event.target.value)}>
                <option value="">Sélectionner le genre</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </label>

            <label className="ajout-utilisateur__champ">
              <span>Date de naissance</span>
              <input
                type="date"
                value={formulaire.dateNaissance}
                onChange={(event) => mettreAJourChamp('dateNaissance', event.target.value)}
              />
            </label>

            <label className="ajout-utilisateur__champ">
              <span>Téléphone</span>
              <input
                type="tel"
                placeholder="+243 000 000 000"
                value={formulaire.telephone}
                onChange={(event) => mettreAJourChamp('telephone', event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="ajout-utilisateur__section">
          <div className="ajout-utilisateur__section-entete">
            <span className="ajout-utilisateur__section-barre ajout-utilisateur__section-barre--secondaire" />
            <h3 className="ajout-utilisateur__section-titre">Rôle et Sécurité</h3>
          </div>

          <div className="ajout-utilisateur__grille">
            <label className="ajout-utilisateur__champ">
              <span>Rôle</span>
              <select value={formulaire.roleCode} onChange={(event) => mettreAJourChamp('roleCode', event.target.value)}>
                {ROLES_CREATION_UTILISATEUR.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.libelle}
                  </option>
                ))}
              </select>
            </label>

            <label className="ajout-utilisateur__champ">
              <span>Mot de passe initial</span>
              <input
                type="password"
                placeholder="••••••••"
                value={formulaire.motDePasseInitial}
                onChange={(event) => mettreAJourChamp('motDePasseInitial', event.target.value)}
              />
            </label>

            <div className="ajout-utilisateur__champ">
              <span>Statut du compte</span>
              <div className="ajout-utilisateur__segmente">
                <button
                  type="button"
                  className={
                    formulaire.actif
                      ? 'ajout-utilisateur__segmente-bouton ajout-utilisateur__segmente-bouton--actif'
                      : 'ajout-utilisateur__segmente-bouton'
                  }
                  onClick={() => mettreAJourChamp('actif', true)}
                >
                  Actif
                </button>
                <button
                  type="button"
                  className={
                    !formulaire.actif
                      ? 'ajout-utilisateur__segmente-bouton ajout-utilisateur__segmente-bouton--actif'
                      : 'ajout-utilisateur__segmente-bouton'
                  }
                  onClick={() => mettreAJourChamp('actif', false)}
                >
                  Inactif
                </button>
              </div>
            </div>

            <label className="ajout-utilisateur__champ">
              <span>Confirmer le mot de passe</span>
              <input
                type="password"
                placeholder="••••••••"
                value={formulaire.confirmationMotDePasse}
                onChange={(event) => mettreAJourChamp('confirmationMotDePasse', event.target.value)}
              />
            </label>
          </div>
        </section>

        <div className="ajout-utilisateur__actions">
          <button
            type="button"
            className="ajout-utilisateur__action-retour"
            onClick={() => navigate('/admin/utilisateurs')}
          >
            Annuler
          </button>

          <Bouton
            type="submit"
            variant="primaire"
            disabled={estEnregistrement}
          >
            <span className="material-symbols-outlined">person_add</span>
            {estEnregistrement ? 'Enregistrement...' : "Enregistrer l'utilisateur"}
          </Bouton>
        </div>
      </form>
    </div>
  )
}

export default PageAjoutUtilisateur