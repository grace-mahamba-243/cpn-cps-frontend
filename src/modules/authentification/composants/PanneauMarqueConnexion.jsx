import illustrationConnexion from '../../../assets/login-bg.png'

function PanneauMarqueConnexion() {
  return (
    <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden p-12 md:flex">
      <div className="absolute inset-0">
        <img
          alt="Personnel medical avec nouveau-ne"
          className="h-full w-full object-cover object-[center_20%]"
          src={illustrationConnexion}
        />
        <div className="absolute inset-0 bg-primary/40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 [text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]">
          <span className="material-symbols-outlined text-4xl text-white">medical_services</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Centre de Sante Afia Himbi
          </h1>
        </div>
        <div className="h-1 w-12 rounded-full bg-tertiary-container" />
      </div>

      <div className="relative z-10 mb-12 space-y-6">
        <p className="text-center text-xl font-bold italic leading-relaxed text-white [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)] md:text-2xl">
          "Une mère suivie avec amour, c'est un enfant accueilli dans la vie avec espoir"
        </p>
      </div>
    </aside>
  )
}

export default PanneauMarqueConnexion