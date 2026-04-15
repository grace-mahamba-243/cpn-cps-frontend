import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersEnfants from '../../services/api/serviceDossiersEnfants'

function formaterDate(dateIso) {
  if (!dateIso) {
    return 'Non renseignée'
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

function LigneInfo({ label, valeur }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-surface-container-lowest px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{valeur || 'Non renseigné'}</p>
    </div>
  )
}

// Ce composant affiche uniquement le dossier administratif d'un enfant pour la réception.
// Il exclut volontairement tout contenu clinique lié au suivi, à la nutrition ou à la vaccination.
function PageDetailDossierEnfant() {
  const navigate = useNavigate()
  const { enfantId } = useParams()
  const [etat, setEtat] = useState({
    chargement: true,
    dossier: null,
  })

  useEffect(() => {
    let estActif = true

    const chargerDossier = async () => {
      const dossier = await serviceDossiersEnfants.recupererParId(enfantId)

      if (!estActif) {
        return
      }

      setEtat({
        chargement: false,
        dossier,
      })
    }

    void chargerDossier()

    return () => {
      estActif = false
    }
  }, [enfantId])

  if (etat.chargement) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier administratif enfant...</p>
        </div>
      </div>
    )
  }

  if (!etat.dossier) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-8 pb-16 pt-24">
        <Alerte type="erreur" titre="Dossier introuvable">
          Le dossier administratif enfant demandé est introuvable ou n est plus disponible.
        </Alerte>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-bold text-on-surface"
          onClick={() => navigate('/enfants')}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour à la liste
        </button>
      </div>
    )
  }

  const dossier = etat.dossier
  const nomComplet = [dossier.nom, dossier.postnom, dossier.prenom].filter(Boolean).join(' ')

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface"
            onClick={() => navigate('/enfants')}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour à la liste
          </button>

          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Dossier administratif enfant</h1>
          <p className="mt-2 text-on-surface-variant">{nomComplet}</p>
        </div>

        <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
          <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">Numéro fiche</p>
          <p className="mt-1 text-lg font-black">{dossier.numeroFiche}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-tertiary/15 bg-tertiary/5 px-5 py-4 text-sm text-on-surface-variant">
        <p className="flex items-start gap-3">
          <span className="material-symbols-outlined text-base text-tertiary">shield_locked</span>
          Cette page expose seulement les informations administratives de l enfant. Aucun accès clinique vers suivi enfant, nutrition ou vaccination n est présent.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-black text-on-surface">Identité</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LigneInfo label="Nom" valeur={dossier.nom} />
          <LigneInfo label="Postnom" valeur={dossier.postnom} />
          <LigneInfo label="Prénom" valeur={dossier.prenom} />
          <LigneInfo label="Sexe" valeur={dossier.sexe} />
          <LigneInfo label="Date de naissance" valeur={formaterDate(dossier.dateNaissance)} />
          <LigneInfo label="Date d enregistrement" valeur={formaterDate(dossier.dateEnregistrement)} />
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-black text-on-surface">Responsables</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LigneInfo label="Nom de la mère" valeur={dossier.nomMere} />
          <LigneInfo label="Nom du père" valeur={dossier.nomPere} />
          <LigneInfo label="Téléphone" valeur={dossier.telephone} />
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-black text-on-surface">Coordonnées</h2>
        <div className="grid grid-cols-1 gap-4">
          <LigneInfo label="Adresse" valeur={dossier.adresse} />
        </div>
      </section>
    </div>
  )
}

export default PageDetailDossierEnfant