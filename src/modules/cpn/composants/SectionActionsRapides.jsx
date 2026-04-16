// Section des actions rapides : nouveau contact, liste contacts, examens, clore/réouvrir.
import { useNavigate } from 'react-router-dom'

function SectionActionsRapides({ dossierId, statut, onChangerStatut }) {
  const navigate = useNavigate()

  const actions = [
    { label: 'Nouveau Contact', icone: 'add_circle', couleur: 'bg-secondary-container text-on-secondary-container', hover: 'group-hover:bg-secondary group-hover:text-on-secondary', onClick: statut === 'OUVERT' ? () => navigate(`/cpn/${dossierId}/contacts/nouveau`) : null },
    { label: 'Contacts CPN', icone: 'calendar_month', couleur: 'bg-primary-container text-on-primary-container', hover: 'group-hover:bg-primary group-hover:text-on-primary', onClick: () => document.getElementById('section-contacts')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Examens', icone: 'biotech', couleur: 'bg-tertiary-container/30 text-tertiary', hover: 'group-hover:bg-tertiary group-hover:text-on-tertiary', onClick: () => document.getElementById('section-examens')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: statut === 'OUVERT' ? 'Clore le dossier' : 'Réouvrir', icone: statut === 'OUVERT' ? 'lock' : 'lock_open', couleur: 'bg-surface-container-high text-on-surface-variant', hover: 'group-hover:bg-error group-hover:text-on-error', onClick: onChangerStatut },
  ]

  return (
    <section>
      <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Actions Rapides</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map(({ label, icone, couleur, hover, onClick }) => (
          <button key={label} onClick={onClick} disabled={!onClick} className="group flex flex-col items-center gap-2.5 rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-all hover:shadow-md disabled:opacity-35 disabled:cursor-not-allowed">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${couleur} ${hover}`}>
              <span className="material-symbols-outlined text-xl">{icone}</span>
            </div>
            <span className="text-[12px] font-bold text-on-surface text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default SectionActionsRapides
