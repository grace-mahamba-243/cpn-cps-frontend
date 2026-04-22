// Bandeau héro affichant l'identité de la patiente, ses badges et le prochain RDV.
import { useNavigate } from 'react-router-dom'
import { calculerAge, formaterDateFr } from './utilitairesCpn'

function BandeauPatiente({ dossier }) {
  const navigate = useNavigate()
  const p = dossier.patiente
  const age = p?.age ?? calculerAge(dossier.dateNaissancePatiente)
  const groupeRhesus = dossier.groupeSanguin ? `${dossier.groupeSanguin}${dossier.rhesus ?? ''}` : null
  const dernierContact = dossier.contacts?.[0] ?? null

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dim p-8 text-on-primary shadow-md">
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Identité */}
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-md">
            <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>
          </div>
          <div>
            <h2 className="font-headline text-2xl font-extrabold leading-tight md:text-3xl">{dossier.nomPatiente ?? '—'}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold tracking-wide">{dossier.numeroDossierCpn}</span>
              {age !== null && <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold">{age} ans</span>}
              {groupeRhesus && <span className="rounded-full border border-outline-variant/50-container/30 bg-tertiary-container/20 px-3 py-0.5 text-[11px] font-bold text-tertiary-container">{groupeRhesus}</span>}
              <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${dossier.statut === 'OUVERT' ? 'bg-white/20' : 'bg-error-container/40 text-on-error'}`}>{dossier.statut}</span>
              {p?.id && (
                <button
                  type="button"
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-[11px] font-semibold transition hover:bg-white/20"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  Dossier mère
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Prochain RDV */}
        <div className="min-w-[190px] rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-70">Prochain RDV</p>
          {dernierContact?.prochainRdvDate ? (
            <>
              <p className="font-headline text-xl font-bold">{formaterDateFr(dernierContact.prochainRdvDate)}</p>
              {dernierContact.prochainRdvNotes && <p className="mt-0.5 text-xs opacity-80">{dernierContact.prochainRdvNotes}</p>}
            </>
          ) : (
            <p className="text-sm opacity-60">Aucun planifié</p>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
    </section>
  )
}

export default BandeauPatiente
