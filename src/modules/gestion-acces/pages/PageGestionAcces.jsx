import { useEffect, useState } from 'react'
import AvatarInitiales from '../../../composants/interface/AvatarInitiales'
import BadgeEtat from '../../../composants/interface/BadgeEtat'
import Bouton from '../../../composants/interface/Bouton'
import Carte from '../../../composants/interface/Carte'
import CarteIndicateur from '../../../composants/interface/CarteIndicateur'
import ChampRecherche from '../../../composants/interface/ChampRecherche'
import TableauDonnees from '../../../composants/interface/TableauDonnees'
import Alerte from '../../../composants/interface/Alerte'
import BlocTitrePage from '../../../composants/partages/BlocTitrePage'
import { routesPrivees } from '../../../application/routes/registreRoutes'
import useAuthentification from '../../authentification/hooks/useAuthentification'
import {
  calculerPermissionsUtilisateur,
  grouperPermissionsParDomaine,
  obtenirRoleParCode,
  verifierAccesParPermissions,
  PERMISSIONS,
} from '../controle-acces'
import serviceGestionAcces from '../../../services/api/serviceGestionAcces'

function formaterDate(date) {
  if (!date) {
    return 'Jamais'
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date))
  } catch {
    return 'Date indisponible'
  }
}

function determinerVariantStatut(utilisateur) {
  return utilisateur.actif ? 'tertiaire' : 'danger'
}

function extraireInitiales(nomAffichage = '') {
  return nomAffichage
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((fragment) => fragment[0]?.toUpperCase() ?? '')
    .join('')
}

function construireResumePermissions(utilisateur, roles) {
  const role = obtenirRoleParCode(utilisateur.roleCode, roles)
  const permissionsRole = new Set(role?.permissions ?? [])
  const permissionsEffectives = calculerPermissionsUtilisateur(utilisateur, roles)

  return permissionsEffectives.map((permissionCode) => ({
    permissionCode,
    estHeritee: permissionsRole.has(permissionCode),
  }))
}

// Ce composant fournit l espace frontend d administration pour gerer les utilisateurs,
// les roles, les permissions effectives et la visibilite des menus/routes selon le profil.
function PageGestionAcces() {
  const { possedePermission, peutAcceder } = useAuthentification()
  const [configuration, setConfiguration] = useState({
    roles: [],
    utilisateurs: [],
    permissions: [],
  })
  const [recherche, setRecherche] = useState('')
  const [messageAction, setMessageAction] = useState(null)
  const [estChargement, setEstChargement] = useState(true)
  const [roleSelectionneCode, setRoleSelectionneCode] = useState('ADMIN')
  const [utilisateurSelectionneId, setUtilisateurSelectionneId] = useState(null)

  const peutGererUtilisateurs = possedePermission(PERMISSIONS.ADMIN_UTILISATEURS_GERER)
  const peutGererRoles = possedePermission(PERMISSIONS.ADMIN_ROLES_GERER)
  const peutGererAcces = possedePermission(PERMISSIONS.ADMIN_ACCES_GERER)

  useEffect(() => {
    let estActif = true

    const chargerConfiguration = async () => {
      setEstChargement(true)

      const prochaineConfiguration = await serviceGestionAcces.recupererConfiguration()

      if (!estActif) {
        return
      }

      setConfiguration(prochaineConfiguration)
      setRoleSelectionneCode((roleCourant) => {
        if (prochaineConfiguration.roles.some((role) => role.code === roleCourant)) {
          return roleCourant
        }

        return prochaineConfiguration.roles[0]?.code ?? 'ADMIN'
      })
      setUtilisateurSelectionneId((utilisateurCourant) => {
        if (prochaineConfiguration.utilisateurs.some((utilisateur) => utilisateur.id === utilisateurCourant)) {
          return utilisateurCourant
        }

        return prochaineConfiguration.utilisateurs[0]?.id ?? null
      })
      setEstChargement(false)
    }

    void chargerConfiguration()

    return () => {
      estActif = false
    }
  }, [])

  const roles = configuration.roles
  const utilisateurs = configuration.utilisateurs
  const groupesPermissions = grouperPermissionsParDomaine(configuration.permissions)

  const utilisateursFiltres = utilisateurs.filter((utilisateur) => {
    const terme = recherche.trim().toLowerCase()

    if (!terme) {
      return true
    }

    return [utilisateur.nomAffichage, utilisateur.identifiant, utilisateur.role, utilisateur.unite]
      .filter(Boolean)
      .some((valeur) => valeur.toLowerCase().includes(terme))
  })

  const utilisateurSelectionne =
    utilisateurs.find((utilisateur) => utilisateur.id === utilisateurSelectionneId) ?? utilisateurs[0] ?? null
  const roleSelectionne =
    roles.find((role) => role.code === roleSelectionneCode) ?? roles[0] ?? null

  const utilisateursActifs = utilisateurs.filter((utilisateur) => utilisateur.actif).length
  const permissionsAdmin = configuration.permissions.filter((permission) => permission.domaine === 'Administration').length
  const apercuMenus = utilisateurSelectionne
    ? routesPrivees.filter((route) =>
        verifierAccesParPermissions(
          utilisateurSelectionne.permissions,
          route.permissions,
          route.modePermissions,
        ),
      )
    : []

  const appliquerConfiguration = (prochaineConfiguration, message) => {
    setConfiguration(prochaineConfiguration)
    setMessageAction(message)
  }

  const gererChangementRoleUtilisateur = async (utilisateurId, roleCode) => {
    const prochaineConfiguration = await serviceGestionAcces.mettreAJourUtilisateur(utilisateurId, {
      roleCode,
      accesSpecifiques: { ajoutes: [], retires: [] },
    })

    appliquerConfiguration(prochaineConfiguration, 'Le role utilisateur a ete mis a jour.')
  }

  const gererChangementStatutUtilisateur = async (utilisateur) => {
    const prochaineConfiguration = await serviceGestionAcces.mettreAJourUtilisateur(utilisateur.id, {
      actif: !utilisateur.actif,
    })

    appliquerConfiguration(
      prochaineConfiguration,
      utilisateur.actif ? 'Le compte a ete desactive.' : 'Le compte a ete reactive.',
    )
  }

  const gererBasculePermissionRole = async (permissionCode) => {
    if (!roleSelectionne) {
      return
    }

    const permissions = roleSelectionne.permissions.includes(permissionCode)
      ? roleSelectionne.permissions.filter((permission) => permission !== permissionCode)
      : [...roleSelectionne.permissions, permissionCode]

    const prochaineConfiguration = await serviceGestionAcces.mettreAJourRole(roleSelectionne.code, permissions)

    appliquerConfiguration(prochaineConfiguration, 'La matrice des permissions du role a ete mise a jour.')
  }

  const gererBasculePermissionUtilisateur = async (permissionCode) => {
    if (!utilisateurSelectionne) {
      return
    }

    const prochaineConfiguration = await serviceGestionAcces.basculerPermissionUtilisateur(
      utilisateurSelectionne.id,
      permissionCode,
    )

    appliquerConfiguration(prochaineConfiguration, 'Les acces specifiques de l utilisateur ont ete actualises.')
  }

  const colonnes = [
    {
      key: 'utilisateur',
      label: 'Utilisateur',
      render: (utilisateur) => (
        <button
          type="button"
          className={
            utilisateur.id === utilisateurSelectionne?.id
              ? 'gestion-acces__utilisateur gestion-acces__utilisateur--actif'
              : 'gestion-acces__utilisateur'
          }
          onClick={() => setUtilisateurSelectionneId(utilisateur.id)}
        >
          <AvatarInitiales initiales={extraireInitiales(utilisateur.nomAffichage)} taille="petit" />
          <span className="gestion-acces__utilisateur-texte">
            <strong>{utilisateur.nomAffichage}</strong>
            <span>{utilisateur.identifiant}</span>
          </span>
        </button>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (utilisateur) => <BadgeEtat variant="primaire">{utilisateur.role}</BadgeEtat>,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (utilisateur) => (
        <BadgeEtat variant={determinerVariantStatut(utilisateur)}>
          {utilisateur.actif ? 'Actif' : 'Desactive'}
        </BadgeEtat>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      align: 'droite',
      render: (utilisateur) => utilisateur.permissions.length,
    },
  ]

  return (
    <div className="page-gestion-acces">
      <BlocTitrePage
        surtitre="Module 2"
        titre="Gestion des roles et acces"
        description="Pilotez les utilisateurs, la matrice des roles, les acces specifiques et le rendu conditionnel des menus depuis un registre frontend unique, pret a etre branche sur l API backend lorsqu elle sera exposee."
        actions={
          <BadgeEtat variant="primaire">
            {peutAcceder(
              [
                PERMISSIONS.ADMIN_UTILISATEURS_GERER,
                PERMISSIONS.ADMIN_ROLES_GERER,
                PERMISSIONS.ADMIN_ACCES_GERER,
              ],
              { mode: 'une' },
            )
              ? 'Profil administrateur'
              : 'Acces limite'}
          </BadgeEtat>
        }
      />

      {messageAction ? (
        <Alerte variant="succes" titre="Configuration enregistree">
          {messageAction}
        </Alerte>
      ) : null}

      {estChargement ? (
        <Carte titre="Chargement" description="Recuperation de la configuration locale des acces.">
          <p>Initialisation du module d administration en cours...</p>
        </Carte>
      ) : null}

      {!estChargement ? (
        <>
          <section className="grille-indicateurs">
            <CarteIndicateur
              titre="Utilisateurs actifs"
              valeur={String(utilisateursActifs)}
              description="Comptes actuellement actifs dans la configuration frontend"
              variation={`${utilisateurs.length} comptes total`}
              variant="primaire"
            />
            <CarteIndicateur
              titre="Roles disponibles"
              valeur={String(roles.length)}
              description="Profils exploitables par les routes et menus"
              variation={`${permissionsAdmin} permissions d administration`}
              variant="tertiaire"
            />
            <CarteIndicateur
              titre="Menus visibles"
              valeur={String(apercuMenus.length)}
              description="Apercu des sections visibles pour le profil selectionne"
              variation={utilisateurSelectionne ? utilisateurSelectionne.nomAffichage : 'Aucun profil choisi'}
              variant="danger"
            />
          </section>

          <section className="grille-gestion-acces">
            <div className="gestion-acces__colonne-principale">
              <Carte
                titre="Utilisateurs"
                description="Selectionnez un compte pour ajuster son role, son statut et ses exceptions d acces."
                actions={
                  <div className="gestion-acces__actions-entete">
                    <ChampRecherche
                      placeholder="Rechercher un utilisateur, un role ou une unite"
                      value={recherche}
                      onChange={(event) => setRecherche(event.target.value)}
                    />
                  </div>
                }
              >
                <div className="gestion-acces__tableau">
                  <TableauDonnees colonnes={colonnes} lignes={utilisateursFiltres} />
                </div>
              </Carte>

              {utilisateurSelectionne ? (
                <Carte
                  titre={`Profil de ${utilisateurSelectionne.nomAffichage}`}
                  description="Le detail utilisateur montre les permissions effectives et leur origine."
                >
                  <div className="gestion-acces__fiche-utilisateur">
                    <div className="gestion-acces__fiche-entete">
                      <div className="gestion-acces__fiche-identite">
                        <AvatarInitiales initiales={extraireInitiales(utilisateurSelectionne.nomAffichage)} taille="grand" />
                        <div>
                          <h3>{utilisateurSelectionne.nomAffichage}</h3>
                          <p>{utilisateurSelectionne.identifiant}</p>
                          <p>{utilisateurSelectionne.unite}</p>
                        </div>
                      </div>

                      <div className="gestion-acces__fiche-actions">
                        <label className="gestion-acces__champ-inline">
                          <span>Role</span>
                          <select
                            value={utilisateurSelectionne.roleCode}
                            onChange={(event) =>
                              void gererChangementRoleUtilisateur(
                                utilisateurSelectionne.id,
                                event.target.value,
                              )
                            }
                            disabled={!peutGererUtilisateurs}
                          >
                            {roles.map((role) => (
                              <option key={role.code} value={role.code}>
                                {role.libelle}
                              </option>
                            ))}
                          </select>
                        </label>

                        <Bouton
                          variant={utilisateurSelectionne.actif ? 'danger' : 'secondaire'}
                          onClick={() => void gererChangementStatutUtilisateur(utilisateurSelectionne)}
                          disabled={!peutGererUtilisateurs}
                        >
                          {utilisateurSelectionne.actif ? 'Desactiver le compte' : 'Reactiver le compte'}
                        </Bouton>
                      </div>
                    </div>

                    {!peutGererUtilisateurs ? (
                      <Alerte variant="avertissement" titre="Gestion des utilisateurs en lecture seule">
                        Votre profil peut consulter cette page mais ne peut pas modifier les comptes.
                      </Alerte>
                    ) : null}

                    <div className="gestion-acces__meta-grille">
                      <div>
                        <span className="gestion-acces__meta-label">Dernier acces</span>
                        <strong>{formaterDate(utilisateurSelectionne.dernierAccesAt)}</strong>
                      </div>
                      <div>
                        <span className="gestion-acces__meta-label">Permissions effectives</span>
                        <strong>{utilisateurSelectionne.permissions.length}</strong>
                      </div>
                      <div>
                        <span className="gestion-acces__meta-label">Menus visibles</span>
                        <strong>{apercuMenus.length}</strong>
                      </div>
                    </div>

                    <div className="gestion-acces__blocs-inline">
                      <div className="gestion-acces__panneau-sous-carte">
                        <p className="gestion-acces__sous-titre">Menus visibles</p>
                        <div className="gestion-acces__liste-badges">
                          {apercuMenus.map((route) => (
                            <BadgeEtat key={route.path} variant="neutre">
                              {route.label}
                            </BadgeEtat>
                          ))}
                        </div>
                      </div>

                      <div className="gestion-acces__panneau-sous-carte">
                        <p className="gestion-acces__sous-titre">Permissions effectives</p>
                        <div className="gestion-acces__liste-permissions-effectives">
                          {construireResumePermissions(utilisateurSelectionne, roles).map((permission) => {
                            const details = configuration.permissions.find(
                              (permissionCatalogue) => permissionCatalogue.code === permission.permissionCode,
                            )

                            return (
                              <button
                                key={permission.permissionCode}
                                type="button"
                                className={
                                  permission.estHeritee
                                    ? 'gestion-acces__puce-permission'
                                    : 'gestion-acces__puce-permission gestion-acces__puce-permission--specifique'
                                }
                                onClick={() => void gererBasculePermissionUtilisateur(permission.permissionCode)}
                                disabled={!peutGererAcces}
                              >
                                <span>{details?.libelle ?? permission.permissionCode}</span>
                                <small>{permission.estHeritee ? 'heritage role' : 'exception utilisateur'}</small>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="gestion-acces__groupes-permissions">
                      {groupesPermissions.map((groupe) => (
                        <div key={groupe.domaine} className="gestion-acces__groupe-permissions">
                          <div className="gestion-acces__groupe-entete">
                            <h3>{groupe.domaine}</h3>
                            <p>{groupe.permissions.length} permissions disponibles</p>
                          </div>

                          <div className="gestion-acces__liste-controles">
                            {groupe.permissions.map((permission) => {
                              const estActive = utilisateurSelectionne.permissions.includes(permission.code)

                              return (
                                <button
                                  key={permission.code}
                                  type="button"
                                  className={
                                    estActive
                                      ? 'gestion-acces__controle-permission gestion-acces__controle-permission--actif'
                                      : 'gestion-acces__controle-permission'
                                  }
                                  onClick={() => void gererBasculePermissionUtilisateur(permission.code)}
                                  disabled={!peutGererAcces}
                                >
                                  <span>{permission.libelle}</span>
                                  <small>{permission.description}</small>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Carte>
              ) : null}
            </div>

            <div className="gestion-acces__colonne-secondaire">
              <Carte
                titre="Roles"
                description="Le registre de roles alimente la garde de route et l affichage conditionnel des menus."
              >
                <div className="gestion-acces__liste-roles">
                  {roles.map((role) => (
                    <button
                      key={role.code}
                      type="button"
                      className={
                        role.code === roleSelectionne?.code
                          ? 'gestion-acces__carte-role gestion-acces__carte-role--active'
                          : 'gestion-acces__carte-role'
                      }
                      onClick={() => setRoleSelectionneCode(role.code)}
                    >
                      <div>
                        <strong>{role.libelle}</strong>
                        <p>{role.description}</p>
                      </div>
                      <BadgeEtat variant="neutre">{role.permissions.length} permissions</BadgeEtat>
                    </button>
                  ))}
                </div>
              </Carte>

              {roleSelectionne ? (
                <Carte
                  titre={`Matrice du role ${roleSelectionne.libelle}`}
                  description="Activez ou retirez les permissions qui doivent etre heritees par ce role."
                >
                  {!peutGererRoles ? (
                    <Alerte variant="avertissement" titre="Gestion des roles en lecture seule">
                      Votre profil ne peut pas modifier la matrice de permissions des roles.
                    </Alerte>
                  ) : null}

                  <div className="gestion-acces__groupes-permissions">
                    {groupesPermissions.map((groupe) => (
                      <div key={groupe.domaine} className="gestion-acces__groupe-permissions">
                        <div className="gestion-acces__groupe-entete">
                          <h3>{groupe.domaine}</h3>
                          <p>{groupe.permissions.length} permissions</p>
                        </div>

                        <div className="gestion-acces__liste-controles">
                          {groupe.permissions.map((permission) => {
                            const estActive = roleSelectionne.permissions.includes(permission.code)

                            return (
                              <button
                                key={permission.code}
                                type="button"
                                className={
                                  estActive
                                    ? 'gestion-acces__controle-permission gestion-acces__controle-permission--actif'
                                    : 'gestion-acces__controle-permission'
                                }
                                onClick={() => void gererBasculePermissionRole(permission.code)}
                                disabled={!peutGererRoles}
                              >
                                <span>{permission.libelle}</span>
                                <small>{permission.description}</small>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Carte>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default PageGestionAcces