// Ligne d'information réutilisable avec icône arrondie, label et valeur.

function LigneInfo({ icone, couleur, label, valeur }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${couleur}`}>
        <span className="material-symbols-outlined text-xl">{icone}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className="text-base font-bold text-on-surface truncate">{valeur}</p>
      </div>
    </div>
  )
}

export default LigneInfo
