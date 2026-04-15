import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import Bouton from '../../../composants/interface/Bouton'
import serviceUtilisateurs from '../../../services/api/serviceUtilisateurs'
import serviceGestionAcces from '../../../services/api/serviceGestionAcces'

const OPTIONS_ROLES_SECOURS = [
  { code: 'SUPER_ADMIN', libelle: 'Super administrateur' },
  { code: 'ADMIN', libelle: 'Administrateur' },
  { code: 'MEDECIN', libelle: 'Médecin' },
  { code: 'INFIRMIERE', libelle: 'Infirmière' },
  { code: 'SAGE_FEMME', libelle: 'Sage-femme' },
  { code: 'RECEPTION', libelle: 'Réceptionniste' },
]

const ETAT_FORMULAIRE_VIDE = {
  nomComplet: '',
  sexe: '',
  dateNaissance: '',
  telephone: '',
  email: '',
  adresse: '',
  unite: '',
  roleCode: 'RECEPTION',
  actif: true,
  motDePasseInitial: '',
  confirmationMotDePasse: '',
  accesSpecifiques: {
    ajoutes: [],
    retires: [],
  },
}

function construireFormulaire(utilisateur) {
  return {
    nomComplet: utilisateur.nomAffichage ?? '',
    sexe: utilisateur.sexe ?? '',
    dateNaissance: utilisateur.dateNaissance ? String(utilisateur.dateNaissance).slice(0, 10) : '',
    telephone: utilisateur.telephone ?? '',
    email: utilisateur.email ?? '',
    adresse: utilisateur.adresse ?? '',
    unite: utilisateur.unite ?? '',
    roleCode: utilisateur.roleCode ?? 'RECEPTION',
    actif: Boolean(utilisateur.actif),
    motDePasseInitial: '',
    confirmationMotDePasse: '',
    accesSpecifiques: {
      ajoutes: Array.isArray(utilisateur?.accesSpecifiques?.ajoutes) ? [...utilisateur.accesSpecifiques.ajoutes] : [],
      retires: Array.isArray(utilisateur?.accesSpecifiques?.retires) ? [...utilisateur.accesSpecifiques.retires] : [],
    },
  }
}

// Ce composant charge un utilisateur existant, pre-remplit le formulaire puis enregistre
// les modifications vers le backend users avec un fallback local si necessaire.
function PageModifierUtilisateur() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [etat, setEtat] = useState({
    estChargement: true,
    erreur: '',
    source: 'api',
    utilisateur: null,
  })
  const [formulaire, setFormulaire] = useState(ETAT_FORMULAIRE_VIDE)
  const [reinitialiserMotDePasse, setReinitialiserMotDePasse] = useState(false)
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  const [erreurSoumission, setErreurSoumission] = useState('')
  const [configurationAcces, setConfigurationAcces] = useState({
    roles: OPTIONS_ROLES_SECOURS,
    permissions: [],
  })

  useEffect(() => {
    let estActif = true

    const chargerUtilisateur = async () => {
      try {
        const resultat = await serviceUtilisateurs.recupererUtilisateur(userId)

        if (!estActif) {
          return
        }

        setEtat({
          estChargement: false,
          erreur: '',
          source: resultat.source,
          utilisateur: resultat.utilisateur,
        })
        setFormulaire(construireFormulaire(resultat.utilisateur))
      } catch (exception) {
        if (!estActif) {
          return
        }

        setEtat({
          estChargement: false,
          erreur: exception.message,
          source: 'api',
          utilisateur: null,
        })
      }
    }

    void chargerUtilisateur()

    return () => {
      estActif = false
    }
  }, [userId])

  useEffect(() => {
    let estActif = true

    const chargerConfigurationAcces = async () => {
      const configuration = await serviceGestionAcces.recupererConfiguration()

      if (!estActif) {
        return
      }

      const roles = configuration.roles.map((role) => ({
        code: role.code,
        libelle: role.libelle,
        permissions: role.permissions ?? [],
      }))

      setConfigurationAcces({
        roles: roles.length > 0 ? roles : OPTIONS_ROLES_SECOURS,
        permissions: configuration.permissions ?? [],
      })
    }

    void chargerConfigurationAcces()

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

  const roleSelectionne =
    configurationAcces.roles.find((role) => role.code === formulaire.roleCode) ?? null

  const permissionHeriteeDuRole = (permissionCode) =>
    Array.isArray(roleSelectionne?.permissions) ? roleSelectionne.permissions.includes(permissionCode) : false

  const permissionEffective = (permissionCode) => {
    const estHeritee = permissionHeriteeDuRole(permissionCode)
    const estAjoutee = formulaire.accesSpecifiques.ajoutes.includes(permissionCode)
    const estRetiree = formulaire.accesSpecifiques.retires.includes(permissionCode)

    if (estHeritee) {
      return !estRetiree
    }

    return estAjoutee
  }

  const basculerPermission = (permissionCode) => {
    setFormulaire((formulaireCourant) => {
      const roleCourant = configurationAcces.roles.find((role) => role.code === formulaireCourant.roleCode) ?? null
      const estHeritee = Array.isArray(roleCourant?.permissions)
        ? roleCourant.permissions.includes(permissionCode)
        : false
      const estAjoutee = formulaireCourant.accesSpecifiques.ajoutes.includes(permissionCode)
      const estRetiree = formulaireCourant.accesSpecifiques.retires.includes(permissionCode)
      const estActive = estHeritee ? !estRetiree : estAjoutee
      const ajoutes = new Set(formulaireCourant.accesSpecifiques.ajoutes)
      const retires = new Set(formulaireCourant.accesSpecifiques.retires)

      if (estHeritee) {
        if (estActive) {
          retires.add(permissionCode)
          ajoutes.delete(permissionCode)
        } else {
          retires.delete(permissionCode)
        }
      } else if (estActive) {
        ajoutes.delete(permissionCode)
        retires.delete(permissionCode)
      } else {
        ajoutes.add(permissionCode)
        retires.delete(permissionCode)
      }

      return {
        ...formulaireCourant,
        accesSpecifiques: {
          ajoutes: Array.from(ajoutes).sort(),
          retires: Array.from(retires).sort(),
        },
      }
    })
  }

  const enregistrerModifications = async (event) => {
    event.preventDefault()
    setErreurSoumission('')

    if (!formulaire.nomComplet.trim()) {
      setErreurSoumission('Le nom complet est obligatoire.')
      return
    }

    if (!formulaire.sexe) {
      setErreurSoumission('Veuillez selectionner le sexe.')
      return
    }

    if (reinitialiserMotDePasse) {
      if (!formulaire.motDePasseInitial || formulaire.motDePasseInitial.length < 4) {
        setErreurSoumission('Le nouveau mot de passe doit contenir au moins 4 caracteres.')
        return
      }

      if (formulaire.motDePasseInitial !== formulaire.confirmationMotDePasse) {
        setErreurSoumission('La confirmation du mot de passe ne correspond pas.')
        return
      }
    }

    setEstEnregistrement(true)

    try {
      await serviceUtilisateurs.modifierUtilisateur(userId, {
        nomComplet: formulaire.nomComplet,
        sexe: formulaire.sexe,
        dateNaissance: formulaire.dateNaissance || null,
        telephone: formulaire.telephone || null,
        email: formulaire.email || null,
        adresse: formulaire.adresse || null,
        unite: formulaire.unite || null,
        roleCode: formulaire.roleCode,
        accesSpecifiques: formulaire.accesSpecifiques,
        actif: formulaire.actif,
        motDePasseInitial: reinitialiserMotDePasse ? formulaire.motDePasseInitial : undefined,
      })

      navigate(`/admin/utilisateurs/${userId}`, {
        replace: true,
        state: {
          messageSucces: 'Les informations de cet utilisateur ont été mises à jour.',
        },
      })
    } catch (exception) {
      setErreurSoumission(exception.message)
    } finally {
      setEstEnregistrement(false)
    }
  }

  if (etat.estChargement) {
    return (
      <div className="page-edition-utilisateur">
        <section className="edition-utilisateur__etat">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du formulaire de modification...</p>
        </section>
      </div>
    )
  }

  if (etat.erreur || !etat.utilisateur) {
    return (
      <div className="page-edition-utilisateur">
        <Alerte type="erreur" titre="Modification impossible">
          {etat.erreur || 'La fiche utilisateur demandée est introuvable.'}
        </Alerte>

        <div className="edition-utilisateur__actions-entete edition-utilisateur__actions-entete--bas">
          <button type="button" className="edition-utilisateur__action-secondaire" onClick={() => navigate('/admin/utilisateurs')}>
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-edition-utilisateur">
      {etat.source === 'local' ? (
        <Alerte type="avertissement" titre="Mode de secours local">
          Le backend utilisateur est indisponible. Les modifications seront conservees localement dans le navigateur.
        </Alerte>
      ) : null}

      {erreurSoumission ? (
        <Alerte type="erreur" titre="Enregistrement impossible">
          {erreurSoumission}
        </Alerte>
      ) : null}

      <form className="edition-utilisateur__page" onSubmit={enregistrerModifications}>
        <header className="edition-utilisateur__entete-page">
          <div className="edition-utilisateur__retour-zone">
            <button
              type="button"
              className="edition-utilisateur__retour"
              onClick={() => navigate(`/admin/utilisateurs/${userId}`)}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <div>
              <h2>Modifier l'utilisateur</h2>
              <p>Mise à jour des informations de {etat.utilisateur.nomAffichage}</p>
            </div>
          </div>

          <div className="edition-utilisateur__actions-entete">
            <button
              type="button"
              className="edition-utilisateur__action-secondaire"
              onClick={() => navigate(`/admin/utilisateurs/${userId}`)}
            >
              Annuler
            </button>

            <Bouton type="submit" variant="primaire" disabled={estEnregistrement}>
              <span className="material-symbols-outlined">save</span>
              {estEnregistrement ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Bouton>
          </div>
        </header>

        <div className="edition-utilisateur__grille">
          <section className="edition-utilisateur__carte">
            <div className="edition-utilisateur__section-entete">
              <span className="edition-utilisateur__section-barre edition-utilisateur__section-barre--primaire" />
              <h3>Informations personnelles</h3>
            </div>

            <div className="edition-utilisateur__champs">
              <label className="edition-utilisateur__champ">
                <span>Nom complet</span>
                <input
                  type="text"
                  value={formulaire.nomComplet}
                  onChange={(event) => mettreAJourChamp('nomComplet', event.target.value)}
                />
              </label>

              <div className="edition-utilisateur__grille-interne">
                <label className="edition-utilisateur__champ">
                  <span>Sexe</span>
                  <select value={formulaire.sexe} onChange={(event) => mettreAJourChamp('sexe', event.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </label>

                <label className="edition-utilisateur__champ">
                  <span>Date de naissance</span>
                  <input
                    type="date"
                    value={formulaire.dateNaissance}
                    onChange={(event) => mettreAJourChamp('dateNaissance', event.target.value)}
                  />
                </label>
              </div>

              <label className="edition-utilisateur__champ">
                <span>Téléphone</span>
                <input
                  type="tel"
                  value={formulaire.telephone}
                  onChange={(event) => mettreAJourChamp('telephone', event.target.value)}
                />
              </label>

              <label className="edition-utilisateur__champ">
                <span>Email</span>
                <input
                  type="email"
                  value={formulaire.email}
                  onChange={(event) => mettreAJourChamp('email', event.target.value)}
                />
              </label>

              <label className="edition-utilisateur__champ">
                <span>Adresse résidentielle</span>
                <input
                  type="text"
                  value={formulaire.adresse}
                  onChange={(event) => mettreAJourChamp('adresse', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="edition-utilisateur__carte">
            <div className="edition-utilisateur__section-entete">
              <span className="edition-utilisateur__section-barre edition-utilisateur__section-barre--secondaire" />
              <h3>Rôle et Sécurité</h3>
            </div>

            <div className="edition-utilisateur__champs">
              <label className="edition-utilisateur__champ">
                <span>Rôle assigné</span>
                <select value={formulaire.roleCode} onChange={(event) => mettreAJourChamp('roleCode', event.target.value)}>
                  {configurationAcces.roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <div className="edition-utilisateur__champ">
                <span>Permissions spécifiques</span>
                <div className="gestion-acces__liste-controles">
                  {configurationAcces.permissions.map((permission) => {
                    const estActive = permissionEffective(permission.code)

                    return (
                      <button
                        key={permission.code}
                        type="button"
                        className={
                          estActive
                            ? 'gestion-acces__controle-permission gestion-acces__controle-permission--actif'
                            : 'gestion-acces__controle-permission'
                        }
                        onClick={() => basculerPermission(permission.code)}
                      >
                        <span>{permission.libelle}</span>
                        <small>{permission.description}</small>
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="edition-utilisateur__champ">
                <span>Service / unité</span>
                <input
                  type="text"
                  value={formulaire.unite}
                  onChange={(event) => mettreAJourChamp('unite', event.target.value)}
                />
              </label>

              <div className="edition-utilisateur__champ">
                <span>Statut du compte</span>
                <div className="edition-utilisateur__statuts">
                  <button
                    type="button"
                    className={
                      formulaire.actif
                        ? 'edition-utilisateur__statut-option edition-utilisateur__statut-option--actif'
                        : 'edition-utilisateur__statut-option'
                    }
                    onClick={() => mettreAJourChamp('actif', true)}
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Actif
                  </button>

                  <button
                    type="button"
                    className={
                      !formulaire.actif
                        ? 'edition-utilisateur__statut-option edition-utilisateur__statut-option--inactif'
                        : 'edition-utilisateur__statut-option'
                    }
                    onClick={() => mettreAJourChamp('actif', false)}
                  >
                    <span className="material-symbols-outlined">block</span>
                    Inactif
                  </button>
                </div>
              </div>

              <div className="edition-utilisateur__identifiants">
                <h4>Identifiants de connexion</h4>

                <label className="edition-utilisateur__champ">
                  <span>Nom d'utilisateur</span>
                  <input type="text" value={etat.utilisateur.identifiant} readOnly />
                </label>

                {reinitialiserMotDePasse ? (
                  <>
                    <label className="edition-utilisateur__champ">
                      <span>Nouveau mot de passe</span>
                      <input
                        type="password"
                        value={formulaire.motDePasseInitial}
                        onChange={(event) => mettreAJourChamp('motDePasseInitial', event.target.value)}
                      />
                    </label>

                    <label className="edition-utilisateur__champ">
                      <span>Confirmer le mot de passe</span>
                      <input
                        type="password"
                        value={formulaire.confirmationMotDePasse}
                        onChange={(event) => mettreAJourChamp('confirmationMotDePasse', event.target.value)}
                      />
                    </label>
                  </>
                ) : (
                  <div className="edition-utilisateur__mot-de-passe-ligne">
                    <input type="password" value="********" readOnly />
                    <button
                      type="button"
                      className="edition-utilisateur__lien-action"
                      onClick={() => setReinitialiserMotDePasse(true)}
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}

export default PageModifierUtilisateur