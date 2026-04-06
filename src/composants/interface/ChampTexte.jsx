function ChampTexte({
  id,
  label,
  type = 'text',
  placeholder,
  as = 'input',
  options = [],
  aide,
  className,
  ...props
}) {
  let controle = null

  if (as === 'textarea') {
    controle = (
      <textarea
        id={id}
        placeholder={placeholder}
        className="champ-texte__controle champ-texte__controle--zone"
        {...props}
      />
    )
  } else if (as === 'select') {
    controle = (
      <select id={id} className="champ-texte__controle" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else {
    controle = (
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="champ-texte__controle"
        {...props}
      />
    )
  }

  return (
    <label htmlFor={id} className={['champ-texte', className].filter(Boolean).join(' ')}>
      <span className="champ-texte__label">{label}</span>
      {controle}
      {aide ? <span className="champ-texte__aide">{aide}</span> : null}
    </label>
  )
}

export default ChampTexte