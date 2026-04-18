import { NavLink, useLocation } from 'react-router-dom'
import AvatarInitiales from '../interface/AvatarInitiales'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'
import { obtenirNavigationAutorisee } from '../../application/routes/registreRoutes'
import { normaliserCodeRole, PERMISSIONS } from '../../modules/gestion-acces/controle-acces'

const LIENS_SIDEBAR_RECEPTION = [
  { path: '/reception', label: 'Tableau de bord', icone: 'dashboard', cheminsActifs: ['/reception'] },
  { path: '/patients', label: 'Mères', icone: 'person', cheminsActifs: ['/patients'] },
  { path: '/enfants', label: 'Enfants', icone: 'child_care', cheminsActifs: ['/enfants'] },
  { path: '/rendez-vous', label: 'Rendez-vous', icone: 'calendar_today', cheminsActifs: ['/rendez-vous'] },
]

const LIENS_SIDEBAR_ADMIN = [
  { path: '/admin/utilisateurs', label: 'Utilisateurs', icone: 'group', cheminsActifs: ['/admin/utilisateurs'] },
  { path: '/admin/journal', label: 'Journal des activités', icone: 'history', cheminsActifs: ['/admin/journal'] },
]

function extraireInitiales(nomAffichage = '') {
  return nomAffichage
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((fragment) => fragment[0]?.toUpperCase() ?? '')
    .join('')
}

// Rendu partagé pour tous les profils avec un design unifié et moderne.
function RenduBarreLaterale({ liens, labelNav, utilisateurConnecte, deconnexion, pathname, sections }) {
  return (
    <aside className="barre-laterale" style={{ background: '#fff', borderRight: '1px solid #e8f0f3' }}>
      <div className="flex h-full flex-col overflow-hidden">

        {/* En-tête marque */}
        <div className="shrink-0 px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #006784 0%, #005a74 100%)' }}
            >
              <span
                className="material-symbols-outlined text-lg text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_hospital
              </span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900">Afia Himbi</h1>
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest" style={{ color: '#006784' }}>
                Gestion Médicale
              </p>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="mx-6 mb-4 h-px bg-slate-100" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3" aria-label={labelNav}>
          {liens ? (
            <div className="space-y-0.5">
              {liens.map((lien) => {
                const estActif = (lien.cheminsActifs ?? [lien.path]).some((chemin) =>
                  pathname.startsWith(chemin)
                )
                return (
                  <NavLink
                    key={`${lien.path}-${lien.label}`}
                    to={lien.path}
                    end
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                    style={
                      estActif
                        ? { background: '#f0f9fc', color: '#006784' }
                        : { color: '#64748b' }
                    }
                  >
                    <span
                    className="material-symbols-outlined text-xl shrink-0"
                      style={estActif ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {lien.icone}
                    </span>
                    <span className={`text-sm ${estActif ? 'font-semibold' : 'font-medium'}`}>
                      {lien.label}
                    </span>
                    {estActif && (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: '#006784' }}
                      />
                    )}
                  </NavLink>
                )
              })}
            </div>
          ) : (
            sections?.map(({ section, items }) => (
              <div key={section} className="mb-4">
                <p className="mb-1 px-3 text-[0.625rem] font-bold uppercase tracking-widest text-slate-400">
                  {section}
                </p>
                <div className="space-y-0.5">
                  {items.map((lien) => (
                    <NavLink
                      key={lien.path}
                      to={lien.path}
                      end={lien.path === '/reception'}
                      style={({ isActive }) =>
                        isActive
                          ? { background: '#f0f9fc', color: '#006784' }
                          : { color: '#64748b' }
                      }
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className="material-symbols-outlined text-xl shrink-0"
                            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {lien.icone ?? 'apps'}
                          </span>
                          <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {lien.label}
                          </span>
                          {isActive && (
                            <span
                              className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ background: '#006784' }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* Bas : déconnexion + profil */}
        <div className="shrink-0 px-3 pb-5 pt-2">
          <div className="mx-3 mb-3 h-px bg-slate-100" />

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-500 transition-colors hover:bg-red-50"
            onClick={() => deconnexion()}
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="text-sm font-medium">Déconnexion</span>
          </button>

          <div
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: '#f8fafc' }}
          >
            <AvatarInitiales
              initiales={extraireInitiales(utilisateurConnecte?.nomAffichage ?? 'UC')}
              taille="moyen"
              variant="secondaire"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {utilisateurConnecte?.nomAffichage ?? 'Utilisateur'}
              </p>
              <p className="truncate text-xs font-medium text-slate-400">
                {utilisateurConnecte?.role ?? 'Profil'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// Ce composant affiche la navigation latérale de l'espace privé, les raccourcis principaux
// et l'action de déconnexion pour la session en cours.
function BarreLaterale() {
  const { pathname } = useLocation()
  const { deconnexion, utilisateurConnecte } = useAuthentification()
  const sectionsNavigation = obtenirNavigationAutorisee(utilisateurConnecte)
  const roleNormalise = normaliserCodeRole(utilisateurConnecte?.roleCode ?? utilisateurConnecte?.role) ?? ''
  const permissionsUtilisateur = Array.isArray(utilisateurConnecte?.permissions)
    ? utilisateurConnecte.permissions
    : []
  const aPermissionReception = permissionsUtilisateur.includes(PERMISSIONS.RECEPTION_TABLEAU_BORD_CONSULTER)
  const aPermissionAdministration =
    permissionsUtilisateur.includes(PERMISSIONS.ADMIN_UTILISATEURS_GERER) ||
    permissionsUtilisateur.includes(PERMISSIONS.ADMIN_ROLES_GERER) ||
    permissionsUtilisateur.includes(PERMISSIONS.ADMIN_ACCES_GERER)
  const estProfilReception =
    roleNormalise === 'RECEPTION' ||
    roleNormalise.includes('RECEPTION') ||
    roleNormalise.includes('ACCUEIL') ||
    aPermissionReception
  const estProfilAdmin =
    roleNormalise === 'SUPER_ADMIN' ||
    roleNormalise === 'ADMIN' ||
    roleNormalise.includes('ADMIN') ||
    aPermissionAdministration

  const props = { utilisateurConnecte, deconnexion, pathname }

  if (estProfilAdmin) {
    return <RenduBarreLaterale {...props} liens={LIENS_SIDEBAR_ADMIN} labelNav="Navigation administration" />
  }

  if (estProfilReception) {
    return <RenduBarreLaterale {...props} liens={LIENS_SIDEBAR_RECEPTION} labelNav="Navigation réception" />
  }

  return <RenduBarreLaterale {...props} sections={sectionsNavigation} labelNav="Navigation principale" />
}

export default BarreLaterale
