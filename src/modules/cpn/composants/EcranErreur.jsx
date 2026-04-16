// Écran affiché en cas d'erreur lors du chargement du dossier CPN.

function EcranErreur({ message, onReessayer }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container/20">
        <span className="material-symbols-outlined text-4xl text-error">error</span>
      </div>
      <div>
        <p className="text-lg font-bold text-on-surface">Impossible de charger le dossier</p>
        <p className="mt-1 text-sm text-on-surface-variant">{message}</p>
      </div>
      <button onClick={onReessayer} className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity">
        <span className="material-symbols-outlined text-base">refresh</span>
        Réessayer
      </button>
    </div>
  )
}

export default EcranErreur
