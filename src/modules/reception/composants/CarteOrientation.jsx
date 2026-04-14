// Ce composant represente une carte d'orientation administrative vers un service medical.
// Il permet a la receptionniste de diriger rapidement un patient vers
// le bon service (CPN, CPS, Vaccination, etc.).
function CarteOrientation({ icone, nom, description, variante = 'primaire', onClick }) {
  return (
    <button
      type="button"
      className={`carte-orientation carte-orientation--${variante}`}
      onClick={onClick}
    >
      <span
        className={`material-symbols-outlined carte-orientation__icone carte-orientation__icone--${variante}`}
      >
        {icone}
      </span>
      <h4 className="carte-orientation__nom">{nom}</h4>
      <p className="carte-orientation__description">{description}</p>
    </button>
  )
}

export default CarteOrientation
