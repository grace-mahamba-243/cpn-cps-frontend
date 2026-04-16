// Page affichant les informations administratives de la patiente, avec le même
// style que PageDetailDossierMere (sections bg-white, cartes LigneInfo).
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

function formaterDate(dateIso) {
  if (!dateIso) return 'Non renseigné'
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateIso))
  } catch { return dateIso }
}

function ChampLecture({ label, valeur, principal }) {
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className={`rounded-lg px-3 py-3 text-sm font-semibold ${principal ? 'bg-surface-container text-primary' : 'bg-surface-container text-on-surface'}`}>
        {valeur || <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

function PageInfoAdministrativePatiente() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const [chargement, setChargement] = useState(true)
  const [dossier, setDossier] = useState(null)

  useEffect(() => {
    let actif = true
    serviceCpn.obtenirDossier(dossierId).then((data) => {
      if (actif) { setDossier(data); setChargement(false) }
    }).catch(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [dossierId])

  if (chargement) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier administratif...</p>
        </div>
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <p>Dossier introuvable.</p>
        </div>
        <button type="button" onClick={() => navigate(`/cpn/${dossierId}`)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-bold text-on-surface">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier CPN
        </button>
      </div>
    )
  }

  const p = dossier.patiente
  const nomComplet = dossier.nomPatiente ?? '—'

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-8">

      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/cpn/${dossierId}`)}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour au dossier CPN
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Dossier administratif mère</h1>
          <p className="mt-2 text-on-surface-variant">{nomComplet}</p>
        </div>

        <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
          <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">Numéro dossier</p>
          <p className="mt-1 text-lg font-black">{p?.numeroDossier ?? '—'}</p>
        </div>
      </div>

      {/* Identité */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">person</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Identité</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom" valeur={p?.nom} />
          <ChampLecture label="Postnom" valeur={p?.postnom} />
          <ChampLecture label="Prénom" valeur={p?.prenom} />
          <ChampLecture label="Date de naissance" valeur={formaterDate(p?.dateNaissance)} />
          <ChampLecture label="Âge" valeur={p?.age ? `${p.age} ans` : ''} />
          <ChampLecture label="État matrimonial" valeur={p?.etatMatrimonial} />
        </div>
      </section>

      {/* Coordonnées */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">location_on</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Coordonnées</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ChampLecture label="Téléphone" valeur={p?.telephone} />
          <ChampLecture label="Date d'enregistrement" valeur={formaterDate(p?.dateEnregistrement)} />
        </div>
        <hr className="my-6 border-surface-container-high" />
        <ChampLecture label="Adresse complète" valeur={p?.adresse} />
      </section>

      {/* Partenaire */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">group</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Partenaire</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom du partenaire" valeur={p?.nomPartenaire} />
          <ChampLecture label="Occupation femme" valeur={p?.occupationFemme} />
          <ChampLecture label="Occupation homme" valeur={p?.occupationHomme} />
        </div>
      </section>

      {/* Contact d'urgence */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">emergency</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Contact d'urgence</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ChampLecture label="Personne à contacter" valeur={p?.personneUrgence} />
          <ChampLecture label="Téléphone du contact" valeur={p?.telephoneUrgence} />
        </div>
        <hr className="my-6 border-surface-container-high" />
        <ChampLecture label="Adresse du contact" valeur={p?.adresseUrgence} />
      </section>

    </div>
  )
}

export default PageInfoAdministrativePatiente
