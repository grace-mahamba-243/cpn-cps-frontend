import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import BadgeEtat from '../../../composants/interface/BadgeEtat'
import Bouton from '../../../composants/interface/Bouton'
import Carte from '../../../composants/interface/Carte'
import useAuthentification from '../../authentification/hooks/useAuthentification'
import { PERMISSIONS, normaliserCodeRole, obtenirRoleParCode } from '../controle-acces'
import serviceGestionAcces from '../../../services/api/serviceGestionAcces'

function determinerIconeRole(roleCode) {
  if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN') {
    return 'shield_person'
  }

  if (roleCode === 'MEDECIN') {
    return 'stethoscope'
  }

  if (roleCode === 'RECEPTION') {
    return 'hail'
  }

  return 'manage_accounts'
}

function determinerVariantRole(roleCode) {
  if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN') {
    return 'primaire'
  }

  if (roleCode === 'MEDECIN') {
    return 'tertiaire'
  }

  return 'neutre'
}

function formaterActionPermission(action) {
  if (action === 'consulter') {
    return 'Consulter'
  }

  if (action === 'gerer') {
    return 'Gérer'
  }

  return action.charAt(0).toUpperCase() + action.slice(1)
}

function formaterModulePermission(code) {
  const segments = code.split('.')

  return segments
    .slice(0, -1)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/_/g, ' '))
    .join(' / ')
}

// Ce composant affiche le detail d un role avec sa matrice de permissions
// et permet de modifier directement les acces herites par ce profil.
function PageDetailRole() {
  const { roleCode } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { possedePermission } = useAuthentification()
  const [etat, setEtat] = useState({
    estChargement: true,
    erreur: '',
    roles: [],
    utilisateurs: [],
    permissions: [],
  })
  const [messageAction, setMessageAction] = useState({ type: '', titre: '', message: '' })
  const recherche = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const peutGererRoles = possedePermission(PERMISSIONS.ADMIN_ROLES_GERER)
  const codeRoleNormalise = normaliserCodeRole(roleCode)

  useEffect(() => {
    let estActif = true

    const chargerConfiguration = async () => {
      try {
        const configuration = await serviceGestionAcces.recupererConfiguration()

        if (!estActif) {
          return
        }

        setEtat({
          estChargement: false,
          erreur: '',
          roles: configuration.roles,
          utilisateurs: configuration.utilisateurs,
          permissions: configuration.permissions,
        })
      } catch (exception) {
        if (!estActif) {
          return
        }

        setEtat({
          estChargement: false,
          erreur: exception.message,
          roles: [],
          utilisateurs: [],
          permissions: [],
        })
      }
    }

    void chargerConfiguration()

    return () => {
      estActif = false
    }
  }, [])

  const roleSelectionne = useMemo(() => {
    return obtenirRoleParCode(codeRoleNormalise, etat.roles)
  }, [codeRoleNormalise, etat.roles])

  const effectifRole = useMemo(() => {
    if (!roleSelectionne) {
      return 0
    }

    return etat.utilisateurs.filter((utilisateur) => utilisateur.roleCode === roleSelectionne.code).length
  }, [etat.utilisateurs, roleSelectionne])

  const matricePermissions = useMemo(() => {
    const groupes = new Map()

    etat.permissions.forEach((permission) => {
      const module = formaterModulePermission(permission.code)
      const action = permission.code.split('.').at(-1) ?? permission.code
      const moduleCourant = groupes.get(module) ?? {
        module,
        description: permission.description,
        permissions: {},
      }

      moduleCourant.permissions[action] = permission
      groupes.set(module, moduleCourant)
    })

    return Array.from(groupes.values())
      .filter((ligne) => {
        if (!recherche) {
          return true
        }

        return [
          ligne.module,
          ligne.description,
          ...Object.values(ligne.permissions).map((permission) => permission.libelle),
        ]
          .filter(Boolean)
          .some((valeur) => valeur.toLowerCase().includes(recherche))
      })
      .sort((premier, second) => premier.module.localeCompare(second.module))
  }, [etat.permissions, recherche])

  const actionsDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        etat.permissions.map((permission) => permission.code.split('.').at(-1) ?? permission.code),
      ),
    ).sort((premiere, seconde) => premiere.localeCompare(seconde))
  }, [etat.permissions])

  const gererBasculePermission = async (permissionCode) => {
    if (!roleSelectionne) {
      return
    }

    const permissions = roleSelectionne.permissions.includes(permissionCode)
      ? roleSelectionne.permissions.filter((permission) => permission !== permissionCode)
      : [...roleSelectionne.permissions, permissionCode]

    try {
      const configuration = await serviceGestionAcces.mettreAJourRole(roleSelectionne.code, permissions)

      setEtat((etatCourant) => ({
        ...etatCourant,
        roles: configuration.roles,
        utilisateurs: configuration.utilisateurs,
        permissions: configuration.permissions,
      }))
      setMessageAction({
        type: 'succes',
        titre: 'Matrice mise a jour',
        message: `Les permissions du rôle ${roleSelectionne.libelle} ont été actualisées.`,
      })
    } catch (exception) {
      setMessageAction({
        type: 'erreur',
        titre: 'Mise a jour impossible',
        message: exception.message,
      })
    }
  }

  if (etat.estChargement) {
    return (
      <div className="page-detail-role">
        <section className="detail-role__etat">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du role...</p>
        </section>
      </div>
    )
  }

  if (etat.erreur) {
    return (
      <div className="page-detail-role">
        <Alerte type="erreur" titre="Role indisponible">
          {etat.erreur}
        </Alerte>
      </div>
    )
  }

  if (!roleSelectionne) {
    return (
      <div className="page-detail-role">
        <Alerte type="erreur" titre="Role introuvable">
          Le rôle demandé est introuvable.
        </Alerte>

        <div className="detail-role__actions-bas">
          <Bouton variant="secondaire" onClick={() => navigate('/admin/roles-acces')}>
            Retour à la liste des rôles
          </Bouton>
        </div>
      </div>
    )
  }

  return (
    <div className="page-detail-role">
      <section className="detail-role__hero">
        <div className="detail-role__hero-identite">
          <span className={['detail-role__icone', `detail-role__icone--${determinerVariantRole(roleSelectionne.code)}`].join(' ')}>
            <span className="material-symbols-outlined">{determinerIconeRole(roleSelectionne.code)}</span>
          </span>

          <div className="detail-role__hero-texte">
            <div className="detail-role__hero-badges">
              <BadgeEtat variant={determinerVariantRole(roleSelectionne.code)}>{roleSelectionne.code}</BadgeEtat>
              {roleSelectionne.estSysteme ? <BadgeEtat variant="neutre">Rôle système</BadgeEtat> : null}
            </div>

            <h2>Détails du rôle : {roleSelectionne.libelle}</h2>
            <p>{roleSelectionne.description}</p>
          </div>
        </div>

        <div className="detail-role__hero-actions">
          <Bouton variant="secondaire" onClick={() => navigate('/admin/roles-acces')}>
            Retour à la liste
          </Bouton>
        </div>
      </section>

      {messageAction.message ? (
        <Alerte type={messageAction.type} titre={messageAction.titre}>
          {messageAction.message}
        </Alerte>
      ) : null}

      {!peutGererRoles ? (
        <Alerte type="avertissement" titre="Gestion des roles en lecture seule">
          Votre profil peut consulter cette page mais ne peut pas modifier la matrice de permissions.
        </Alerte>
      ) : null}

      <section className="detail-role__indicateurs">
        <Carte>
          <div className="detail-role__indicateur">
            <span className="material-symbols-outlined">group</span>
            <div>
              <strong>{String(effectifRole).padStart(2, '0')}</strong>
              <p>utilisateur{effectifRole > 1 ? 's' : ''} avec ce rôle</p>
            </div>
          </div>
        </Carte>

        <Carte>
          <div className="detail-role__indicateur">
            <span className="material-symbols-outlined">verified_user</span>
            <div>
              <strong>{roleSelectionne.permissions.length}</strong>
              <p>permission{roleSelectionne.permissions.length > 1 ? 's' : ''} actives</p>
            </div>
          </div>
        </Carte>
      </section>

      <Carte
        titre="Matrice des permissions"
        description="Touchez une cellule pour autoriser ou révoquer une permission sur ce rôle."
      >
        {matricePermissions.length > 0 ? (
          <div className="detail-role__tableau-wrap">
            <table className="detail-role__tableau">
              <thead>
                <tr>
                  <th>Module</th>
                  {actionsDisponibles.map((action) => (
                    <th key={action}>{formaterActionPermission(action)}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {matricePermissions.map((ligne) => (
                  <tr key={ligne.module}>
                    <td>
                      <div className="detail-role__module">
                        <strong>{ligne.module}</strong>
                        <p>{ligne.description}</p>
                      </div>
                    </td>

                    {actionsDisponibles.map((action) => {
                      const permission = ligne.permissions[action]
                      const estAutorisee = permission ? roleSelectionne.permissions.includes(permission.code) : false

                      return (
                        <td key={`${ligne.module}-${action}`} className="detail-role__cellule-action">
                          {permission ? (
                            <button
                              type="button"
                              className={
                                estAutorisee
                                  ? 'detail-role__permission detail-role__permission--active'
                                  : 'detail-role__permission detail-role__permission--inactive'
                              }
                              onClick={() => void gererBasculePermission(permission.code)}
                              disabled={!peutGererRoles}
                              title={permission.libelle}
                            >
                              {estAutorisee ? 'Autorisé' : 'Non autorisé'}
                            </button>
                          ) : (
                            <span className="detail-role__permission-vide">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="detail-role__etat-vide">
            <span className="material-symbols-outlined">manage_search</span>
            <p>Aucune permission ne correspond à la recherche en cours.</p>
          </div>
        )}
      </Carte>
    </div>
  )
}

export default PageDetailRole