// Carte affichant la fiche initiale : antécédents, facteurs de risque, bilan sanguin et notes.

function CarteFicheInitiale({ dossier }) {
  const facteursRisque = dossier.facteursRisque ?? []
  const groupeRhesus = dossier.groupeSanguin ? `${dossier.groupeSanguin}${dossier.rhesus ?? ''}` : null
  const aDesAntecedents = [dossier.antecedentsMedicaux, dossier.antecedentsChirurgicaux, dossier.antecedentsGynecologiques, dossier.antecedentsObstetricaux].some(Boolean)

  return (
    <div className="flex flex-col rounded-2xl bg-surface-container-low p-6">
      <h3 className="mb-5 flex items-center gap-2 font-headline text-[17px] font-bold text-on-surface">
        <span className="material-symbols-outlined text-tertiary">history_edu</span>
        Fiche Initiale
      </h3>
      <div className="flex flex-1 flex-col gap-3">
        {/* Antécédents */}
        <div className="rounded-xl bg-surface-container-lowest p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Antécédents</p>
          {aDesAntecedents ? (
            <ul className="space-y-1">
              {[
                ['Médicaux', dossier.antecedentsMedicaux],
                ['Chirurgicaux', dossier.antecedentsChirurgicaux],
                ['Gynéco.', dossier.antecedentsGynecologiques],
                ['Obstétr.', dossier.antecedentsObstetricaux],
              ].filter(([, v]) => v).map(([k, v]) => (
                <li key={k} className="flex items-start gap-2 text-sm leading-snug">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-on-surface"><span className="font-semibold text-on-surface-variant">{k} :</span> {v}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm font-medium">RAS</span>
            </div>
          )}
        </div>

        {/* Facteurs de risque */}
        <div className="rounded-xl bg-surface-container-lowest p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Facteurs de Risque</p>
          {facteursRisque.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {facteursRisque.map((f) => (
                <span key={f} className="rounded-full bg-error-container/15 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-error">{f.replace(/_/g, ' ')}</span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-on-surface-variant/50">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span className="text-sm">Aucun identifié</span>
            </div>
          )}
        </div>

        {/* Bilan sanguin */}
        <div className="rounded-xl bg-surface-container-lowest p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Bilan Sanguin</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">Groupe / Rhésus</span>
              <span className="font-semibold">{groupeRhesus ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">VIH</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${dossier.vihStatut === 'POSITIF' ? 'bg-error-container/15 text-error' : dossier.vihStatut === 'NEGATIF' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{dossier.vihStatut}</span>
            </div>
            {dossier.allergies && (
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Allergies</span>
                <span className="max-w-[60%] truncate text-right font-semibold">{dossier.allergies}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {dossier.notes && (
          <div className="rounded-xl bg-surface-container-lowest p-4">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Notes</p>
            <p className="text-sm leading-relaxed text-on-surface">{dossier.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CarteFicheInitiale
