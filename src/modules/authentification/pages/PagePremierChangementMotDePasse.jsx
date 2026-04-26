import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import Bouton from '../../../composants/interface/Bouton'
import { obtenirCheminAccueil } from '../../../application/routes/registreRoutes'
import useAuthentification from '../hooks/useAuthentification'

// Ce composant force l'utilisateur a remplacer le mot de passe par defaut avant d'acceder au reste de l'application.
function PagePremierChangementMotDePasse() {
  const navigate = useNavigate()
  const { utilisateurConnecte, changerMotDePasseObligatoire } = useAuthentification()
  const [motDePasseActuel, setMotDePasseActuel] = useState('12345')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [messageSucces, setMessageSucces] = useState('')
  const [estSoumission, setEstSoumission] = useState(false)

  const formulaireValide = useMemo(
    () => Boolean(motDePasseActuel.trim() && nouveauMotDePasse.trim() && confirmationMotDePasse.trim()),
    [confirmationMotDePasse, motDePasseActuel, nouveauMotDePasse],
  )

  const gererSoumission = async (event) => {
    event.preventDefault()
    setErreur('')
    setMessageSucces('')

    if (nouveauMotDePasse.trim().length < 4) {
      setErreur('Le nouveau mot de passe doit contenir au moins 4 caracteres.')
      return
    }

    if (nouveauMotDePasse !== confirmationMotDePasse) {
      setErreur('La confirmation du mot de passe ne correspond pas.')
      return
    }

    setEstSoumission(true)

    try {
      const utilisateurMisAJour = await changerMotDePasseObligatoire({
        motDePasseActuel,
        nouveauMotDePasse,
      })

      setMessageSucces('Mot de passe mis a jour avec succes. Redirection en cours...')
      navigate(obtenirCheminAccueil(utilisateurMisAJour), { replace: true })
    } catch (exception) {
      setErreur(exception.message)
    } finally {
      setEstSoumission(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6">
      <div className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 px-6 py-8 text-white sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Premiere connexion</p>
          <h1 className="mt-3 text-3xl font-semibold">Changez votre mot de passe</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
            Bonjour {utilisateurConnecte?.nomAffichage ?? 'utilisateur'}, votre compte a ete cree avec le mot de passe
            par defaut <strong>12345</strong>. Vous devez le remplacer maintenant pour continuer.
          </p>
        </div>

        <div className="space-y-6 px-6 py-8 sm:px-8">
          {erreur ? (
            <Alerte type="erreur" titre="Changement impossible">
              {erreur}
            </Alerte>
          ) : null}

          {messageSucces ? (
            <Alerte type="succes" titre="Mise a jour terminee">
              {messageSucces}
            </Alerte>
          ) : null}

          <form className="space-y-5" onSubmit={gererSoumission}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Mot de passe actuel</span>
              <input
                type="password"
                value={motDePasseActuel}
                onChange={(event) => setMotDePasseActuel(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                autoComplete="current-password"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Nouveau mot de passe</span>
              <input
                type="password"
                value={nouveauMotDePasse}
                onChange={(event) => setNouveauMotDePasse(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                autoComplete="new-password"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe</span>
              <input
                type="password"
                value={confirmationMotDePasse}
                onChange={(event) => setConfirmationMotDePasse(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                autoComplete="new-password"
              />
            </label>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Utilisez un mot de passe personnel different de <strong>12345</strong>. Tant que ce changement n'est pas fait,
              l'application ne vous laissera pas ouvrir les autres modules.
            </div>

            <Bouton type="submit" variant="primaire" disabled={!formulaireValide || estSoumission}>
              <span className="material-symbols-outlined">lock_reset</span>
              {estSoumission ? 'Mise a jour...' : 'Enregistrer le nouveau mot de passe'}
            </Bouton>
          </form>
        </div>
      </div>
    </section>
  )
}

export default PagePremierChangementMotDePasse