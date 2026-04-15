// Ce composant represente un bouton d'action rapide de la reception.
// Il affiche une icone coloree et un libelle avec un effet hover personnalise
// selon la variante choisie (mere, enfant, rdv, surprise).
function CarteActionRapide({ icone, label, variante = 'mere', onClick }) {
  return (
    <button
      type="button"
      className={`carte-action-rapide carte-action-rapide--${variante}`}
      onClick={onClick}
    >
      <span className="carte-action-rapide__icone">
        <span className="material-symbols-outlined">{icone}</span>
      </span>
      <span className="carte-action-rapide__label">{label}</span>
    </button>
  )
}

export default CarteActionRapide
