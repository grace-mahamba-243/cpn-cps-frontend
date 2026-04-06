import { NavLink, useLocation } from 'react-router-dom'
import AvatarInitiales from '../interface/AvatarInitiales'

const onglets = [
  { to: '/tableau-de-bord', label: 'Dashboard' },
  { to: '/patients', label: 'Patients' },
  { to: '/bibliotheque-composants', label: 'Bibliotheque' },
]

const contenuParRoute = {
  '/tableau-de-bord': {
    fil: 'Dashboard / Overview',
    titre: 'Centre de Sante Himbi',
  },
  '/patients': {
    fil: 'Dashboard / Patients',
    titre: 'Gestion des patients',
  },
  '/bibliotheque-composants': {
    fil: 'Dashboard / Bibliotheque UI',
    titre: 'Bibliotheque de composants',
  },
}

function EnteteApplication() {
  const { pathname } = useLocation()
  const contenu = contenuParRoute[pathname] ?? contenuParRoute['/tableau-de-bord']

  return (
    <header className="entete-application">
      <div className="entete-application__bloc">
        <p className="entete-application__fil">{contenu.fil}</p>
        <h1 className="entete-application__titre">{contenu.titre}</h1>
        <nav className="entete-application__navigation" aria-label="Navigation secondaire">
          {onglets.map((onglet) => (
            <NavLink
              key={onglet.to}
              to={onglet.to}
              className={({ isActive }) =>
                isActive
                  ? 'entete-application__onglet entete-application__onglet--actif'
                  : 'entete-application__onglet'
              }
            >
              {onglet.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="entete-application__actions">
        <span className="entete-application__raccourci">NT</span>
        <span className="entete-application__raccourci">RG</span>

        <div className="entete-application__profil">
          <div className="entete-application__profil-texte">
            <span className="entete-application__profil-nom">Dr Sarah Mwamba</span>
            <span className="entete-application__profil-role">Chief Obstetrician</span>
          </div>

          <AvatarInitiales initiales="SM" variant="primaire" />
        </div>
      </div>
    </header>
  )
}

export default EnteteApplication