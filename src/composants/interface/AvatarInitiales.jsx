function AvatarInitiales({ initiales, variant = 'primaire', taille = 'moyen' }) {
  return (
    <span className={`avatar-initiales avatar-initiales--${variant} avatar-initiales--${taille}`}>
      {initiales}
    </span>
  )
}

export default AvatarInitiales