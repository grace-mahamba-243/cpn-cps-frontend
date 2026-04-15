import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AvatarInitiales from '../../../composants/interface/AvatarInitiales'
import Bouton from '../../../composants/interface/Bouton'
import Alerte from '../../../composants/interface/Alerte'
import serviceUtilisateurs from '../../../services/api/serviceUtilisateurs'

const TAILLE_PAGE = 6

function extraireInitiales(nomAffichage = '') {
  return nomAffichage
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((fragment) => fragment[0]?.toUpperCase() ?? '')
    .join('')
}

function formaterIdentifiantSecondaire(utilisateur) {
  if (utilisateur.email) {
    return utilisateur.email
  }

  if (utilisateur.unite) {
    return utilisateur.unite
  }

  return 'Information complementaire indisponible'
}

function determinerVariantRole(roleCode) {
  if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN') {
    return 'primaire'
  }

  if (roleCode === 'MEDECIN' || roleCode === 'SAGE_FEMME') {
    return 'tertiaire'
  }

  if (roleCode === 'INFIRMIERE') {
    return 'secondaire'
  }

  return 'neutre'
}

function determinerVariantStatut(actif) {
  return actif ? 'tertiaire' : 'danger'
}

function libelleStatut(actif) {
  return actif ? 'Actif' : 'Inactif'
}

// Ce composant affiche la liste des utilisateurs administrables avec recherche,
// filtres et pagination, en s appuyant sur l API users avec un fallback local.
function PageListeUtilisateurs() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const messageSucces = location.state?.messageSucces ?? ''
  const [etatListe, setEtatListe] = useState({
    source: 'api',
    utilisateurs: [],
  })
  const [estChargement, setEstChargement] = useState(true)
  const [filtreRole, setFiltreRole] = useState('TOUS')
  const [filtreStatut, setFiltreStatut] = useState('TOUS')
  const [pageDemandee, setPageDemandee] = useState(1)
  const recherche = searchParams.get('q') ?? ''

  useEffect(() => {
    let estActif = true

    const chargerUtilisateurs = async () => {
      setEstChargement(true)
      const resultat = await serviceUtilisateurs.recupererListe()

      if (!estActif) {
        return
      }

      setEtatListe(resultat)
      setEstChargement(false)
    }

    void chargerUtilisateurs()

    return () => {
      estActif = false
    }
  }, [])

  useEffect(() => {
    setPageDemandee(1)
  }, [recherche])

  const rolesDisponibles = useMemo(() => {
    return Array.from(new Set(etatListe.utilisateurs.map((utilisateur) => utilisateur.role))).sort(
      (premierRole, secondRole) => premierRole.localeCompare(secondRole),
    )
  }, [etatListe.utilisateurs])

  const utilisateursFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    return etatListe.utilisateurs.filter((utilisateur) => {
      const rechercheValide =
        !terme ||
        [
          utilisateur.nomAffichage,
          utilisateur.identifiant,
          utilisateur.role,
          utilisateur.email,
          utilisateur.unite,
        ]
          .filter(Boolean)
          .some((valeur) => valeur.toLowerCase().includes(terme))

      const roleValide = filtreRole === 'TOUS' || utilisateur.role === filtreRole
      const statutValide =
        filtreStatut === 'TOUS' ||
        (filtreStatut === 'ACTIF' ? utilisateur.actif : !utilisateur.actif)

      return rechercheValide && roleValide && statutValide
    })
  }, [etatListe.utilisateurs, filtreRole, filtreStatut, recherche])

  const totalPages = Math.max(1, Math.ceil(utilisateursFiltres.length / TAILLE_PAGE))

  const pageCourante = Math.min(pageDemandee, totalPages)

  const indexDebut = (pageCourante - 1) * TAILLE_PAGE
  const utilisateursPage = utilisateursFiltres.slice(indexDebut, indexDebut + TAILLE_PAGE)

  return (
    <div className="page-utilisateurs-admin">
      <section className="utilisateurs-admin__entete-page">
        <div>
          <h2 className="utilisateurs-admin__titre">Gestion des utilisateurs</h2>
          <p className="utilisateurs-admin__description">
            Gerez les acces et les permissions de votre personnel medical.
          </p>
        </div>

        <Bouton
          variant="primaire"
          className="utilisateurs-admin__bouton-ajout"
          onClick={() => navigate('/admin/utilisateurs/nouveau')}
        >
          <span className="material-symbols-outlined">person_add</span>
          Nouvel utilisateur
        </Bouton>
      </section>

      {messageSucces ? (
        <Alerte type="succes" titre="Utilisateur cree">
          {messageSucces}
        </Alerte>
      ) : null}

      {etatListe.source === 'local' ? (
        <Alerte type="avertissement" titre="Mode de secours local">
          L endpoint backend des utilisateurs n a pas repondu. La page utilise provisoirement les donnees locales du frontend.
        </Alerte>
      ) : null}

      <section className="utilisateurs-admin__filtres-carte">
        <div className="utilisateurs-admin__filtres">
          <div className="utilisateurs-admin__filtres-intro">
            <span className="material-symbols-outlined">filter_alt</span>
            <span>Filtrer par :</span>
          </div>

          <div className="utilisateurs-admin__filtres-champs">
            <select
              value={filtreRole}
              onChange={(event) => {
                setFiltreRole(event.target.value)
                setPageDemandee(1)
              }}
            >
              <option value="TOUS">Tous les roles</option>
              {rolesDisponibles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <select
              value={filtreStatut}
              onChange={(event) => {
                setFiltreStatut(event.target.value)
                setPageDemandee(1)
              }}
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </div>
        </div>
      </section>

      <section className="utilisateurs-admin__table-carte">
        {estChargement ? (
          <div className="utilisateurs-admin__etat-chargement">
            <span className="material-symbols-outlined">hourglass_top</span>
            <p>Chargement de la liste des utilisateurs...</p>
          </div>
        ) : (
          <>
            <div className="utilisateurs-admin__tableau">
              <table className="utilisateurs-admin__table">
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Identifiant</th>
                    <th>Role</th>
                    <th>Statut</th>
                  </tr>
                </thead>

                <tbody>
                  {utilisateursPage.map((utilisateur) => (
                    <tr
                      key={utilisateur.id}
                      className="utilisateurs-admin__ligne utilisateurs-admin__ligne--cliquable"
                      onClick={() => navigate(`/admin/utilisateurs/${utilisateur.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/admin/utilisateurs/${utilisateur.id}`)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td>
                        <div
                          className={
                            utilisateur.actif
                              ? 'utilisateurs-admin__identite'
                              : 'utilisateurs-admin__identite utilisateurs-admin__identite--inactive'
                          }
                        >
                          <AvatarInitiales
                            initiales={extraireInitiales(utilisateur.nomAffichage)}
                            taille="petit"
                            variant={determinerVariantRole(utilisateur.roleCode)}
                          />
                          <div className="utilisateurs-admin__identite-texte">
                            <strong>{utilisateur.nomAffichage}</strong>
                            <span>{formaterIdentifiantSecondaire(utilisateur)}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="utilisateurs-admin__matricule">{utilisateur.identifiant}</span>
                      </td>

                      <td>
                        <span className="utilisateurs-admin__role-texte">{utilisateur.role}</span>
                      </td>

                      <td>
                        <span
                          className={
                            determinerVariantStatut(utilisateur.actif) === 'tertiaire'
                              ? 'utilisateurs-admin__statut utilisateurs-admin__statut--actif'
                              : 'utilisateurs-admin__statut utilisateurs-admin__statut--inactif'
                          }
                        >
                          {libelleStatut(utilisateur.actif)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="utilisateurs-admin__pagination">
              <div className="utilisateurs-admin__pagination-resume">
                <span>
                  {utilisateursFiltres.length} utilisateur{utilisateursFiltres.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="utilisateurs-admin__pagination-actions">
                <button
                  type="button"
                  className="utilisateurs-admin__pagination-bouton"
                  onClick={() => setPageDemandee((page) => Math.max(1, page - 1))}
                  disabled={pageCourante === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === pageCourante
                        ? 'utilisateurs-admin__pagination-bouton utilisateurs-admin__pagination-bouton--actif'
                        : 'utilisateurs-admin__pagination-bouton'
                    }
                    onClick={() => setPageDemandee(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="utilisateurs-admin__pagination-bouton"
                  onClick={() => setPageDemandee((page) => Math.min(totalPages, page + 1))}
                  disabled={pageCourante === totalPages}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default PageListeUtilisateurs