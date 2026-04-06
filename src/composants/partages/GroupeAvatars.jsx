import AvatarInitiales from '../interface/AvatarInitiales'

function GroupeAvatars({ elements, surplus }) {
  return (
    <div className="groupe-avatars">
      {elements.map((element) => (
        <AvatarInitiales
          key={`${element.initiales}-${element.variant}`}
          initiales={element.initiales}
          variant={element.variant}
          taille="petit"
        />
      ))}

      {surplus ? <span className="groupe-avatars__surplus">+{surplus}</span> : null}
    </div>
  )
}

export default GroupeAvatars