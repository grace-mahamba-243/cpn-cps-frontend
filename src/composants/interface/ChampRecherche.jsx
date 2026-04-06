function ChampRecherche({ placeholder = 'Rechercher...', className, ...props }) {
  return (
    <div className={['champ-recherche', className].filter(Boolean).join(' ')}>
      <span className="champ-recherche__icone">SR</span>
      <input className="champ-recherche__controle" placeholder={placeholder} {...props} />
    </div>
  )
}

export default ChampRecherche