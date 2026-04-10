import { Link } from 'react-router-dom'
import illustrationConnexion from '../../assets/image.png'

// Ce composant affiche la page d'acces refuse et informe l'utilisateur que son profil
// ne dispose pas des autorisations necessaires pour atteindre la ressource demandee.
function AccesRefusePage() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(16,24,40,0.12)] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined">health_and_safety</span>
          </div>
          <div>
            <p className="font-headline text-lg font-extrabold text-on-surface">
              Centre de Sante Afia Himbi
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-on-surface-variant">
              Portail clinique securise
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
         
        </div>
      </div>

      <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden md:block">
          <img
            alt="Une mere et son bebe dans un cadre de soin hospitalier"
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={illustrationConnexion}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/60 via-primary/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />

          <div className="relative flex h-full flex-col justify-end p-8 lg:p-10">
            <div className="max-w-sm rounded-[1.75rem] border border-white/30 bg-white/25 p-6 text-white backdrop-blur-md">
              <p className="font-headline text-2xl font-extrabold leading-tight [text-shadow:_0_2px_8px_rgba(0,0,0,0.35)]">
                La securite de vos donnees reste notre priorite absolue.
              </p>
              <p className="mt-3 text-sm font-medium text-primary-container [text-shadow:_0_1px_4px_rgba(0,0,0,0.28)]">
                Portail securise pour la sante maternelle et infantile.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="space-y-5 text-center md:text-left">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-error-container/25 text-error">
                <span className="material-symbols-outlined text-[2rem]">block</span>
              </div>

              <div className="space-y-4">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
                  Acces refuse
                </h1>
                <p className="text-base leading-8 text-on-surface-variant sm:text-lg">
                  Vous ne disposez pas des autorisations necessaires pour acceder a cette section du{' '}
                  <span className="font-bold text-primary">Portail Clinique</span>.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-error/10 bg-surface-container-low p-6 shadow-[0_18px_45px_rgba(16,24,40,0.06)]">
              <p className="text-sm font-semibold text-secondary">
                <span className="font-extrabold text-on-surface">Motif :</span> Droits d'acces insuffisants ou session expiree.
              </p>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administration du Centre de Sante Afia Himbi ou votre superviseur de service.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-8 py-3.5 text-sm font-extrabold text-on-primary transition-all hover:bg-primary-dim hover:shadow-lg hover:shadow-primary/20"
                to="/"
              >
                <span className="material-symbols-outlined text-xl">login</span>
                Retour a la connexion
              </Link>
            </div>

           
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccesRefusePage