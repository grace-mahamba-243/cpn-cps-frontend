import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/donnees-simulees/serviceRendezVous'

function formaterDate(dateIso) {
  if (!dateIso) {
    return 'Non renseigne'
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

function formaterDateHeure(dateIso) {
  if (!dateIso) {
    return 'Non enregistre'
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

function LigneInfo({ label, valeur }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-surface-container-lowest px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{valeur || 'Non renseigne'}</p>
    </div>
  )
}

// Ce composant affiche uniquement le detail administratif d un rendez-vous sans aucune information clinique.
function PageDetailRendezVous() {
  const navigate = useNavigate()
  const { rendezVousId } = useParams()
  const [etat, setEtat] = useState({
    chargement: true,
    rendezVous: null,
  })

  useEffect(() => {
    let estActif = true

    const chargerRendezVous = async () => {
      const rendezVous = await serviceRendezVous.recupererParId(rendezVousId)

      if (!estActif) {
        return
      }

      setEtat({
        chargement: false,
        rendezVous,
      })
    }

    void chargerRendezVous()

    return () => {
      estActif = false
    }
  }, [rendezVousId])

  if (etat.chargement) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du rendez-vous...</p>
        </div>
      </div>
    )
  }

  if (!etat.rendezVous) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-8 pb-16 pt-24">
        <Alerte type="erreur" titre="Rendez-vous introuvable">
          Le rendez-vous demande est introuvable ou n est plus disponible.
        </Alerte>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-bold text-on-surface"
          onClick={() => navigate('/rendez-vous')}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour a la liste
        </button>
      </div>
    )
  }

  const rendezVous = etat.rendezVous

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface"
            onClick={() => navigate('/rendez-vous')}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour a la liste
          </button>

          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Detail administratif rendez-vous</h1>
          <p className="mt-2 text-on-surface-variant">{rendezVous.nomPatient}</p>
        </div>

        <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
          <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">Numero dossier</p>
          <p className="mt-1 font-mono text-sm font-bold">{rendezVous.numeroDossier}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-tertiary/15 bg-tertiary/5 px-5 py-4 text-sm text-on-surface-variant">
        <p className="flex items-start gap-3">
          <span className="material-symbols-outlined text-base text-tertiary">shield_locked</span>
          Cette fiche reste administrative. Les details cliniques lies a ce rendez-vous ne sont pas accessibles ici.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-black text-on-surface">Informations generales</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LigneInfo label="Date" valeur={formaterDate(rendezVous.date)} />
          <LigneInfo label="Heure" valeur={rendezVous.heure} />
          <LigneInfo label="Type patient" valeur={rendezVous.typePatient} />
          <LigneInfo label="Service" valeur={rendezVous.service} />
          <LigneInfo label="Type rendez-vous" valeur={rendezVous.typeRendezVous} />
          <LigneInfo label="Statut" valeur={rendezVous.statut} />
          <LigneInfo label="Motif" valeur={rendezVous.motif} />
          <LigneInfo label="Cree le" valeur={formaterDateHeure(rendezVous.creeLe)} />
          <LigneInfo label="Arrivee enregistree" valeur={formaterDateHeure(rendezVous.arriveeEnregistreeLe)} />
        </div>
      </section>
    </div>
  )
}

export default PageDetailRendezVous
