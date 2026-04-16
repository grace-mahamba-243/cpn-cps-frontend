// Carte affichant le suivi gestationnel : âge gestationnel, G/P/A, DPA, DDR, contacts.
import LigneInfo from './LigneInfo'
import { formaterDateCourte } from './utilitairesCpn'

function CarteSuiviGestationnel({ dossier }) {
  const ageGest = dossier.dernierAgeGestationnel ?? dossier.ageGestionnelOuverture
  const progression = ageGest ? Math.min(Math.round((ageGest / 40) * 100), 100) : 0

  return (
    <div className="rounded-2xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-headline text-[17px] font-bold text-on-surface">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Suivi Gestationnel
        </h3>
        {dossier.misAJourLe && <span className="text-[11px] italic text-on-surface-variant">Mis à jour · {formaterDateCourte(dossier.misAJourLe)}</span>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Âge gestationnel + G/P/A */}
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-container-low p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Âge Gestationnel</p>
            <p className="mt-1 font-headline text-3xl font-black text-primary">{ageGest ? `${ageGest} SA` : '—'}</p>
            {ageGest && (
              <>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progression}%` }} />
                </div>
                <p className="mt-1.5 text-[10px] text-on-surface-variant">Progression · {progression}%</p>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['G', dossier.gestite, 'Gestité'], ['P', dossier.parite, 'Parité'], ['A', dossier.nombreAvortements, 'Avort.']].map(([l, v, lab]) => (
              <div key={l} className="rounded-xl bg-surface-container-low py-3 text-center">
                <p className="font-headline text-xl font-black text-on-surface">{l}{v ?? 0}</p>
                <p className="text-[10px] text-on-surface-variant">{lab}</p>
              </div>
            ))}
          </div>
        </div>

        {/* DPA, Contacts, DDR, Taille */}
        <div className="flex flex-col justify-center gap-5">
          <LigneInfo icone="event_available" couleur="bg-secondary-container text-on-secondary-container" label="DPA Prévue" valeur={formaterDateCourte(dossier.dateProbableAccouchement) ?? '—'} />
          <LigneInfo icone="group" couleur="bg-tertiary-container/30 text-tertiary" label="Contacts" valeur={`${dossier.nombreContacts ?? 0} visite${(dossier.nombreContacts ?? 0) > 1 ? 's' : ''}`} />
          <LigneInfo icone="calendar_today" couleur="bg-surface-container-high text-on-surface-variant" label="DDR" valeur={formaterDateCourte(dossier.derniersRegles) ?? '—'} />
          {dossier.taille && (
            <LigneInfo icone="straighten" couleur="bg-primary-container/30 text-primary" label="Taille" valeur={`${dossier.taille} cm`} />
          )}
        </div>
      </div>
    </div>
  )
}

export default CarteSuiviGestationnel
