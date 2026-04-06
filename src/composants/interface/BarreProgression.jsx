function BarreProgression({ valeur, label, annotation, variant = 'primaire' }) {
  const valeurNormalisee = Math.max(0, Math.min(100, valeur))

  return (
    <div className="barre-progression">
      <div className="barre-progression__entete">
        {label ? <span>{label}</span> : <span />}
        <strong className="barre-progression__valeur">{valeurNormalisee}%</strong>
      </div>

      <div className="barre-progression__piste" aria-hidden="true">
        <div
          className={`barre-progression__remplissage barre-progression__remplissage--${variant}`}
          style={{ width: `${valeurNormalisee}%` }}
        />
      </div>

      {annotation ? <p className="etat-information">{annotation}</p> : null}
    </div>
  )
}

export default BarreProgression