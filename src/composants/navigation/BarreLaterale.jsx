import { NavLink, useLocation } from 'react-router-dom'
import AvatarInitiales from '../interface/AvatarInitiales'
import useAuthentification from '../../modules/authentification/hooks/useAuthentification'
import { obtenirNavigationAutorisee } from '../../application/routes/registreRoutes'
import { normaliserCodeRole, PERMISSIONS } from '../../modules/gestion-acces/controle-acces'

const LIENS_SIDEBAR_RECEPTION = [
  { path: '/reception', label: 'Tableau de bord', icone: 'dashboard', cheminsActifs: ['/reception'] },
  { path: '/patients', label: 'Meres', icone: 'person', cheminsActifs: ['/patients'] },
  { path: '/enfants', label: 'Enfants', icone: 'child_care', cheminsActifs: ['/enfants'] },
  { path: '/rendez-vous', label: 'Rendez-vous', icone: 'calendar_today', cheminsActifs: ['/rendez-vous'] },
]

const LIENS_SIDEBAR_ADMIN = [
  { path: '/patients', label: 'Meres', icone: 'person', cheminsActifs: ['/patients'] },
  { path: '/enfants', label: 'Enfants', icone: 'child_care', cheminsActifs: ['/enfants'] },
  { path: '/admin/utilisateurs', label: 'Utilisateur', icone: 'group', cheminsActifs: ['/admin/utilisateurs'] },
]

function extraireInitiales(nomAffichage = '') {
  return nomAffichage
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((fragment) => fragment[0]?.toUpperCase() ?? '')
    .join('')
}

// Ce composant affiche la navigation laterale de l'espace prive, les raccourcis principaux
// et l'action de deconnexion pour la session en cours.
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

  if (estProfilAdmin) {
    return (
      <aside className="barre-laterale border-r border-slate-100 bg-white">
        <div className="flex h-full flex-col px-6 py-10">
          <div className="mb-12 px-2">
            <h1 className="text-[22px] font-bold leading-tight text-slate-900">Afia Himbi</h1>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">GESTION MEDICALE</p>
          </div>

          <nav className="flex-1 space-y-2" aria-label="Navigation administration">
            {LIENS_SIDEBAR_ADMIN.map((lien) => {
              const estActif = (lien.cheminsActifs ?? [lien.path]).some((chemin) => pathname.startsWith(chemin))

              return (
                <NavLink
                  key={`${lien.path}-${lien.label}`}
                  to={lien.path}
                  end
                  className={
                    estActif
                      ? 'flex items-center gap-4 rounded-xl bg-primary/5 px-4 py-3.5 font-bold text-primary transition-all'
                      : 'flex items-center gap-4 rounded-xl px-4 py-3.5 text-slate-500 transition-all hover:bg-slate-50'
                  }
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={estActif ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {lien.icone}
                  </span>
                  <span className="text-[15px]">{lien.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50"
              onClick={() => deconnexion()}
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
              <span className="text-[15px]">Deconnexion</span>
            </button>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100/50 bg-slate-50 p-3">
              <AvatarInitiales
                initiales={extraireInitiales(utilisateurConnecte?.nomAffichage ?? 'UC')}
                taille="moyen"
                variant="secondaire"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-slate-900">
                  {utilisateurConnecte?.nomAffichage ?? 'Utilisateur'}
                </p>
                <p className="truncate text-[11px] text-slate-500">{utilisateurConnecte?.role ?? 'Administrateur'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  if (estProfilReception) {
    return (
      <aside className="barre-laterale border-r border-slate-100 bg-white">
        <div className="flex h-full flex-col px-6 py-10">
          <div className="mb-12 px-2">
            <h1 className="text-[22px] font-bold leading-tight text-slate-900">Afia Himbi</h1>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">GESTION MEDICALE</p>
          </div>

          <nav className="flex-1 space-y-2" aria-label="Navigation reception">
            {LIENS_SIDEBAR_RECEPTION.map((lien) => {
              const estActif = (lien.cheminsActifs ?? [lien.path]).some((chemin) => pathname.startsWith(chemin))

              return (
                <NavLink
                  key={`${lien.path}-${lien.label}`}
                  to={lien.path}
                  end
                  className={
                    estActif
                      ? 'flex items-center gap-4 rounded-xl bg-primary/5 px-4 py-3.5 font-bold text-primary transition-all'
                      : 'flex items-center gap-4 rounded-xl px-4 py-3.5 text-slate-500 transition-all hover:bg-slate-50'
                  }
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={estActif ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {lien.icone}
                  </span>
                  <span className="text-[15px]">{lien.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50"
              onClick={() => deconnexion()}
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
              <span className="text-[15px]">Deconnexion</span>
            </button>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100/50 bg-slate-50 p-3">
              <AvatarInitiales
                initiales={extraireInitiales(utilisateurConnecte?.nomAffichage ?? 'UC')}
                taille="moyen"
                variant="secondaire"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-slate-900">
                  {utilisateurConnecte?.nomAffichage ?? 'Utilisateur'}
                </p>
                <p className="truncate text-[11px] text-slate-500">{utilisateurConnecte?.role ?? 'Receptionniste'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="barre-laterale">
      <div className="barre-laterale__bloc">
        <div className="barre-laterale__entete-marque">
          <h1 className="barre-laterale__marque-principale">Afia Himbi</h1>
          <p className="barre-laterale__marque">Gestion Medicale</p>
        </div>

        <nav className="barre-laterale__navigation" aria-label="Navigation principale">
          {sectionsNavigation.map(({ section, items }) => (
            <div key={section} className="barre-laterale__section">
              <p className="barre-laterale__section-titre">{section}</p>

              {items.map((lien) => (
                <NavLink
                  key={lien.path}
                  to={lien.path}
                  end={lien.path === '/reception'}
                  className={({ isActive }) =>
                    isActive ? 'barre-laterale__lien barre-laterale__lien--actif' : 'barre-laterale__lien'
                  }
                >
                  <span className="material-symbols-outlined barre-laterale__icone" aria-hidden="true">
                    {lien.icone ?? 'apps'}
                  </span>
                  <span>{lien.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="barre-laterale__bas">
        <button type="button" className="barre-laterale__deconnexion" onClick={() => deconnexion()}>
          <span className="material-symbols-outlined barre-laterale__icone-deconnexion" aria-hidden="true">
            logout
          </span>
          Deconnexion
        </button>

        <div className="barre-laterale__profil-courant">
          <AvatarInitiales
            initiales={extraireInitiales(utilisateurConnecte?.nomAffichage ?? 'UC')}
            taille="moyen"
            variant="secondaire"
          />

          <div className="barre-laterale__profil-texte">
            <p className="barre-laterale__titre">{utilisateurConnecte?.nomAffichage ?? 'Utilisateur'}</p>
            <p className="barre-laterale__role">{utilisateurConnecte?.role ?? 'Profil en cours'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default BarreLaterale