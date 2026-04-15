import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import BadgeEtat from '../../../composants/interface/BadgeEtat'
import Bouton from '../../../composants/interface/Bouton'
import Carte from '../../../composants/interface/Carte'
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

// Ce composant affiche la liste des roles disponibles et permet d ouvrir
// directement la fiche detaillee d un role depuis la ligne correspondante.
function PageListeRoles() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [etat, setEtat] = useState({
    estChargement: true,
    erreur: '',
    roles: [],
    utilisateurs: [],
    permissions: [],
  })
  const messageSucces = location.state?.messageSucces ?? ''
  const recherche = searchParams.get('q')?.trim().toLowerCase() ?? ''

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

  const rolesEnrichis = useMemo(() => {
    return etat.roles
      .filter((role) => role?.estSysteme !== true)
      .map((role) => {
      const effectif = etat.utilisateurs.filter((utilisateur) => utilisateur.roleCode === role.code).length
      const permissionsLiees = etat.permissions
        .filter((permission) => role.permissions.includes(permission.code))
        .map((permission) => permission.libelle)

      return {
        ...role,
        effectif,
        permissionsLiees,
      }
      })
  }, [etat.permissions, etat.roles, etat.utilisateurs])

  const rolesFiltres = useMemo(() => {
    if (!recherche) {
      return rolesEnrichis
    }

    return rolesEnrichis.filter((role) =>
      [role.libelle, role.code, role.description, String(role.effectif), ...role.permissionsLiees]
        .filter(Boolean)
        .some((valeur) => valeur.toLowerCase().includes(recherche)),
    )
  }, [recherche, rolesEnrichis])

  if (etat.estChargement) {
    return (
      <div className="page-liste-roles">
        <section className="roles-admin__etat">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement des roles...</p>
        </section>
      </div>
    )
  }

  if (etat.erreur) {
    return (
      <div className="page-liste-roles">
        <Alerte type="erreur" titre="Liste indisponible">
          {etat.erreur}
        </Alerte>
      </div>
    )
  }

  return (
    <div className="page-liste-roles">
      <section className="roles-admin__entete-page">
        <div>
          <h2 className="roles-admin__titre">Rôles du système</h2>
          <p className="roles-admin__description">
            Consultez les profils disponibles et ouvrez un rôle pour gérer sa matrice de permissions.
          </p>
        </div>

        <Bouton variant="primaire" className="roles-admin__bouton-ajout" onClick={() => navigate('/admin/roles-acces/nouveau')}>
          <span className="material-symbols-outlined">add</span>
          Nouveau rôle
        </Bouton>
      </section>

      {messageSucces ? (
        <Alerte type="succes" titre="Role mis a jour">
          {messageSucces}
        </Alerte>
      ) : null}

      <Carte
        titre="Liste des roles"
        description="Touchez une ligne pour ouvrir le detail du role et modifier ses permissions."
      >
        {rolesFiltres.length > 0 ? (
          <div className="roles-admin__tableau">
            <table className="roles-admin__table">
              <thead>
                <tr>
                  <th>Rôle</th>
                  <th>Description</th>
                  <th>Effectif</th>
                  <th>Permissions</th>
                </tr>
              </thead>

              <tbody>
                {rolesFiltres.map((role) => (
                  <tr
                    key={role.code}
                    className="roles-admin__ligne roles-admin__ligne--cliquable"
                    onClick={() => navigate(`/admin/roles-acces/${role.code}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/admin/roles-acces/${role.code}`)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <td>
                      <div className="roles-admin__identite">
                        <span
                          className={[
                            'roles-admin__icone',
                            `roles-admin__icone--${determinerVariantRole(role.code)}`,
                          ].join(' ')}
                        >
                          <span className="material-symbols-outlined">{determinerIconeRole(role.code)}</span>
                        </span>

                        <div className="roles-admin__identite-texte">
                          <strong>{role.libelle}</strong>
                          <span>{role.code}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <p className="roles-admin__description-role">{role.description}</p>
                    </td>

                    <td>
                      <strong className="roles-admin__effectif">{String(role.effectif).padStart(2, '0')}</strong>
                    </td>

                    <td>
                      <BadgeEtat variant={determinerVariantRole(role.code)}>
                        {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
                      </BadgeEtat>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="roles-admin__etat-vide">
            <span className="material-symbols-outlined">manage_search</span>
            <p>Aucun rôle ne correspond à la recherche en cours.</p>
          </div>
        )}
      </Carte>
    </div>
  )
}

export default PageListeRoles