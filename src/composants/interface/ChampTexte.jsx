function ChampTexte({
  id,
  label,
  type = 'text',
  placeholder,
  className,
  ...props
}) {
  return (
    <label htmlFor={id} className={["champ-texte", className].filter(Boolean).join(' ')}>
      <span className="champ-texte__label">{label}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="champ-texte__input"
        {...props}
      />
    </label>
  )
}

export default ChampTexte