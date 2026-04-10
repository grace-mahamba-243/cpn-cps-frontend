import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import Bouton from '../../../composants/interface/Bouton'
import serviceGestionAcces from '../../../services/api/serviceGestionAcces'

const ETAT_INITIAL_FORMULAIRE = {
  libelle: '',
  code: '',
  description: '',
  permissions: [],
}

// Ce composant affiche le formulaire de creation d un role et permet
// de definir son identite ainsi que ses permissions initiales.
function PageAjoutRole() {
  const navigate = useNavigate()
  const [formulaire, setFormulaire] = useState(ETAT_INITIAL_FORMULAIRE)
  const [permissionsDisponibles, setPermissionsDisponibles] = useState([])
  const [erreur, setErreur] = useState('')
  const [estChargement, setEstChargement] = useState(true)
  const [estEnregistrement, setEstEnregistrement] = useState(false)

  useEffect(() => {
    let estActif = true

    const chargerConfiguration = async () => {
      try {
        const configuration = await serviceGestionAcces.recupererConfiguration()

        if (!estActif) {
          return
        }

        setPermissionsDisponibles(configuration.permissions)
        setEstChargement(false)
      } catch (exception) {
        if (!estActif) {
          return
        }

        setErreur(exception.message)
        setEstChargement(false)
      }
    }

    void chargerConfiguration()

    return () => {
      estActif = false
    }
  }, [])

  const mettreAJourChamp = (champ, valeur) => {
    setFormulaire((formulaireCourant) => ({
      ...formulaireCourant,
      [champ]: valeur,
    }))
  }

  const basculerPermission = (permissionCode) => {
    setFormulaire((formulaireCourant) => ({
      ...formulaireCourant,
      permissions: formulaireCourant.permissions.includes(permissionCode)
        ? formulaireCourant.permissions.filter((permission) => permission !== permissionCode)
        : [...formulaireCourant.permissions, permissionCode],
    }))
  }

  const enregistrerRole = async (event) => {
    event.preventDefault()
    setErreur('')

    if (!formulaire.libelle.trim()) {
      setErreur('Le libellé du rôle est obligatoire.')
      return
    }

    if (!formulaire.description.trim()) {
      setErreur('La description du rôle est obligatoire.')
      return
    }

    setEstEnregistrement(true)

    try {
      const role = await serviceGestionAcces.creerRole({
        libelle: formulaire.libelle,
        code: formulaire.code,
        description: formulaire.description,
        permissions: formulaire.permissions,
      })

      navigate(`/admin/roles-acces/${role.code}`, {
        replace: true,
        state: {
          messageSucces: 'Le nouveau rôle a été enregistré avec succès.',
        },
      })
    } catch (exception) {
      setErreur(exception.message)
    } finally {
      setEstEnregistrement(false)
    }
  }

  if (estChargement) {
    return (
      <div className="page-ajout-role">
        <section className="ajout-role__etat">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du formulaire de rôle...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-ajout-role">
      <header className="ajout-role__entete-page">
        <h2 className="ajout-role__titre">Créer un nouveau rôle</h2>
        <p className="ajout-role__description">
          Définissez l identité du rôle et choisissez ses permissions initiales.
        </p>
      </header>

      {erreur ? (
        <Alerte type="erreur" titre="Enregistrement impossible">
          {erreur}
        </Alerte>
      ) : null}

      <form className="ajout-role__formulaire" onSubmit={enregistrerRole}>
        <section className="ajout-role__section">
          <div className="ajout-role__section-entete">
            <span className="ajout-role__section-barre ajout-role__section-barre--primaire" />
            <h3 className="ajout-role__section-titre">Informations du rôle</h3>
          </div>

          <div className="ajout-role__grille">
            <label className="ajout-role__champ">
              <span>Libellé</span>
              <input
                type="text"
                placeholder="ex: Sage-femme"
                value={formulaire.libelle}
                onChange={(event) => mettreAJourChamp('libelle', event.target.value)}
              />
            </label>

            <label className="ajout-role__champ">
              <span>Code du rôle</span>
              <input
                type="text"
                placeholder="ex: SAGE_FEMME"
                value={formulaire.code}
                onChange={(event) => mettreAJourChamp('code', event.target.value)}
              />
            </label>

            <label className="ajout-role__champ ajout-role__champ--large">
              <span>Description</span>
              <textarea
                rows="4"
                placeholder="Décrivez la responsabilité principale de ce rôle."
                value={formulaire.description}
                onChange={(event) => mettreAJourChamp('description', event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="ajout-role__section">
          <div className="ajout-role__section-entete">
            <span className="ajout-role__section-barre ajout-role__section-barre--secondaire" />
            <h3 className="ajout-role__section-titre">Permissions initiales</h3>
          </div>

          <div className="ajout-role__permissions">
            {permissionsDisponibles.map((permission) => (
              <label key={permission.code} className="ajout-role__permission">
                <input
                  type="checkbox"
                  checked={formulaire.permissions.includes(permission.code)}
                  onChange={() => basculerPermission(permission.code)}
                />
                <div>
                  <strong>{permission.libelle}</strong>
                  <span>{permission.description}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        <div className="ajout-role__actions">
          <button type="button" className="ajout-role__action-retour" onClick={() => navigate('/admin/roles-acces')}>
            Annuler
          </button>

          <Bouton type="submit" variant="primaire" disabled={estEnregistrement}>
            <span className="material-symbols-outlined">add</span>
            {estEnregistrement ? 'Enregistrement...' : 'Enregistrer le rôle'}
          </Bouton>
        </div>
      </form>
    </div>
  )
}

export default PageAjoutRole