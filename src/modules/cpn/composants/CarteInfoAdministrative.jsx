// Carte affichant les informations administratives de la patiente (adresse, état matrimonial, contacts d'urgence, etc.).
import LigneInfo from './LigneInfo'
import { formaterDateCourte } from './utilitairesCpn'

function CarteInfoAdministrative({ dossier }) {
  const p = dossier.patiente
  if (!p) return null

  const lignes = [
    { icone: 'badge', couleur: 'bg-primary-container/30 text-primary', label: 'N° Dossier Admin', valeur: p.numeroDossier },
    { icone: 'cake', couleur: 'bg-secondary-container text-on-secondary-container', label: 'Date de Naissance', valeur: formaterDateCourte(p.dateNaissance) ?? '—' },
    { icone: 'hourglass_top', couleur: 'bg-tertiary-container/30 text-tertiary', label: 'Âge', valeur: p.age ? `${p.age} ans` : '—' },
    { icone: 'call', couleur: 'bg-secondary-container text-on-secondary-container', label: 'Téléphone', valeur: p.telephone || '—' },
    { icone: 'home', couleur: 'bg-surface-container-high text-on-surface-variant', label: 'Adresse', valeur: p.adresse || '—' },
    { icone: 'favorite', couleur: 'bg-error-container/20 text-error', label: 'État Matrimonial', valeur: p.etatMatrimonial || '—' },
    { icone: 'person', couleur: 'bg-primary-container/30 text-primary', label: 'Nom du Partenaire', valeur: p.nomPartenaire || '—' },
    { icone: 'work', couleur: 'bg-tertiary-container/30 text-tertiary', label: 'Occupation (Femme)', valeur: p.occupationFemme || '—' },
    { icone: 'work', couleur: 'bg-surface-container-high text-on-surface-variant', label: 'Occupation (Homme)', valeur: p.occupationHomme || '—' },
    { icone: 'calendar_today', couleur: 'bg-secondary-container text-on-secondary-container', label: 'Date Enregistrement', valeur: formaterDateCourte(p.dateEnregistrement) ?? '—' },
  ]

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 font-headline text-[17px] font-bold text-on-surface">
        <span className="material-symbols-outlined text-secondary">person_book</span>
        Informations Administratives
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {lignes.map((l) => (
          <LigneInfo key={l.label} {...l} />
        ))}
      </div>

      {/* Contact d'urgence */}
      <div className="mt-6 rounded-xl border border-error/10 bg-error-container/5 p-4">
        <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-error">
          <span className="material-symbols-outlined text-[16px]">emergency</span>
          Contact d'Urgence
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] text-on-surface-variant">Personne</p>
            <p className="text-sm font-semibold text-on-surface">{p.personneUrgence || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant">Téléphone</p>
            <p className="text-sm font-semibold text-on-surface">{p.telephoneUrgence || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant">Adresse</p>
            <p className="text-sm font-semibold text-on-surface">{p.adresseUrgence || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarteInfoAdministrative
