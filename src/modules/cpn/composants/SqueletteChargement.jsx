// Squelette animé affiché pendant le chargement du dossier CPN.

function SqueletteChargement() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
      <div className="animate-pulse rounded-2xl bg-surface-container h-44" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="animate-pulse rounded-2xl bg-surface-container h-72 lg:col-span-2" />
        <div className="animate-pulse rounded-2xl bg-surface-container h-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-surface-container h-24" />
        ))}
      </div>
      <div className="animate-pulse rounded-2xl bg-surface-container h-48" />
    </div>
  )
}

export default SqueletteChargement
