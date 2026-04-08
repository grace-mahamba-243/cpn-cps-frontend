import { Link } from 'react-router-dom'

// Ce composant affiche le formulaire de connexion avec les champs, les messages d'erreur
// et le bouton de soumission relies a la logique de la page par les props.
function FormulaireConnexion({
  identifiant,
  motDePasse,
  motDePasseVisible,
  enChargement,
  messageErreur,
  formulaireValide,
  onIdentifiantChange,
  onMotDePasseChange,
  onMotDePasseVisibleChange,
  onSubmit,
}) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-white p-8 md:p-24">
      <div className="mb-8 text-center md:hidden">
        <h1 className="text-2xl font-extrabold text-primary">Centre de Sante Afia Himbi</h1>
      </div>

      <div className="mb-10 text-center">
        <h2 className="mb-2 text-3xl font-bold text-on-surface">Bienvenue dans votre espace</h2>
        <p className="font-medium text-on-surface-variant">
          Connectez-vous pour acceder a vos services
        </p>
      </div>

      <form className="w-full max-w-[340px] space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="ml-1 block text-sm font-semibold text-on-surface-variant" htmlFor="identifiant">
            Identifiant
          </label>
          <div className="group relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant transition-colors group-focus-within:text-primary">
              person
            </span>
            <input
              autoComplete="username"
              className="w-full rounded-xl border-none bg-surface-container py-3 pl-12 pr-4 text-on-surface transition-all placeholder:text-outline-variant/60 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
              id="identifiant"
              onChange={onIdentifiantChange}
              placeholder="Saisissez votre identifiant"
              type="text"
              value={identifiant}
            />
          </div>
          <p className="ml-1 text-xs text-on-surface-variant">
            Utilisez les informations de connexion attribuees a votre compte.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="block text-sm font-semibold text-on-surface-variant" htmlFor="mot-de-passe">
              Mot de passe
            </label>
            <Link className="text-xs font-bold text-primary transition-all hover:underline" to="/acces-refuse">
              Oublie?
            </Link>
          </div>
          <div className="group relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant transition-colors group-focus-within:text-primary">
              lock
            </span>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border-none bg-surface-container py-3 pl-12 pr-14 text-on-surface transition-all placeholder:text-outline-variant/60 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
              id="mot-de-passe"
              onChange={onMotDePasseChange}
              placeholder="••••••••"
              type={motDePasseVisible ? 'text' : 'password'}
              value={motDePasse}
            />
            <button
              aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant transition-colors hover:text-on-surface"
              onClick={onMotDePasseVisibleChange}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">
                {motDePasseVisible ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {messageErreur ? (
          <div className="flex w-full items-center gap-3 rounded-r-lg border-l-4 border-error bg-error-container/10 p-4 text-sm font-medium text-error">
            <span className="material-symbols-outlined shrink-0">error</span>
            <span>{messageErreur}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 pt-4">
          <button
            className="flex w-full items-center justify-center gap-3 rounded-full bg-primary py-4 text-lg font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
            disabled={enChargement || !formulaireValide}
            type="submit"
          >
            {!enChargement ? <span className="material-symbols-outlined">login</span> : null}
            <span>Se connecter</span>
          </button>

          {enChargement ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-on-surface-variant">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Verification des acces...</span>
            </div>
          ) : null}
        </div>
      </form>

      <div className="mt-12 text-center">
        <p className="text-sm text-on-surface-variant">
          Besoin d aide ?{' '}
          <Link className="font-bold text-primary hover:underline" to="/acces-refuse">
            Contacter l assistance technique
          </Link>
        </p>
      </div>
    </section>
  )
}

export default FormulaireConnexion