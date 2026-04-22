// Affiche le nom de la personne qui a enregistre ou modifie une fiche, en bas de page.
export default function InfoEnregistrement({ enregistrePar, modifiePar }) {
  if (!enregistrePar && !modifiePar) return null

  return (
    <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-500">
      {enregistrePar && (
        <p>
          <span className="font-medium text-gray-600">Enregistré par :</span> {enregistrePar}
        </p>
      )}
      {modifiePar && (
        <p className="mt-1">
          <span className="font-medium text-gray-600">Dernière modification par :</span>{' '}
          {modifiePar}
        </p>
      )}
    </div>
  )
}
