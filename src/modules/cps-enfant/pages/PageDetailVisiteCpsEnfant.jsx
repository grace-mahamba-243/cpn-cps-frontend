// Ce composant affiche le détail d'une visite CPS Enfant en lecture seule avec toutes les données cliniques.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'

const LABELS_VISITE = {
  SIX_HEURES: 'Visite 6 heures', SIX_JOURS: 'Visite 6 jours', SIX_SEMAINES: 'Visite 6 semaines',
  M2: 'Visite 2 mois', M3: 'Visite 3 mois', M6: 'Visite 6 mois',
  M9: 'Visite 9 mois', M12: 'Visite 12 mois', SURPRISE: 'Visite surprise',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function ChampLecture({ label, valeur }) {
  return (
    <div className="flex flex-col">
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className="rounded-lg bg-surface-container px-3 py-2.5 text-sm font-medium text-on-surface">
        {(valeur !== null && valeur !== undefined && valeur !== '')
          ? valeur
          : <span className="font-normal italic text-on-surface-variant/60">—</span>}
      </div>
    </div>
  )
}

function TuileBool({ label, valeur, couleurVrai = 'bg-error-container text-on-error-container' }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
      valeur ? couleurVrai : 'bg-surface-container text-on-surface-variant'}`}>
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: `'FILL' ${valeur ? 1 : 0}` }}>
        {valeur ? 'check_box' : 'check_box_outline_blank'}
      </span>
      {label}
    </div>
  )
}

function SectionTitre({ icone, titre }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{icone}</span>
      <h3 className="font-semibold text-on-surface">{titre}</h3>
    </div>
  )
}

function PageDetailVisiteCpsEnfant() {
  const { dossierId, visiteId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [visite, setVisite] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')

  useEffect(() => {
    let actif = true
    Promise.all([
      serviceCpsEnfant.obtenirVisite(dossierId, visiteId),
      serviceCpsEnfant.obtenirDossier(dossierId),
    ])
      .then(([v, d]) => { if (actif) { setVisite(v); setDossier(d) } })
      .catch((e) => { if (actif) setErreur(e.message) })
      .finally(() => { if (actif) setChargement(false) })
    if (location.state?.messageSucces) {
      window.history.replaceState({ ...location.state, messageSucces: undefined }, '')
    }
    return () => { actif = false }
  }, [dossierId, visiteId])

  useEffect(() => {
    if (!messageSucces) return
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  const nomEnfant = dossier?.enfant
    ? [dossier.enfant.nom, dossier.enfant.postnom, dossier.enfant.prenom].filter(Boolean).join(' ')
    : dossier?.mereNom ? `Enfant de ${dossier.mereNom}` : '—'

  if (chargement) {
    return (
      <div className="flex items-center gap-2 py-10 text-on-surface-variant text-sm">
        <span className="material-symbols-outlined animate-spin">refresh</span> Chargement...
      </div>
    )
  }
  if (erreur || !visite) {
    return (
      <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
        {erreur || 'Visite introuvable.'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Bouton retour */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/cps-enfant/${dossierId}/visites`)}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span> Retour
        </button>
        <div>
          <h1 className="font-headline text-lg font-bold text-on-surface">{LABELS_VISITE[visite.typeVisite] ?? visite.typeVisite}</h1>
          {dossier && <p className="text-xs text-on-surface-variant">{nomEnfant} · {dossier.numeroDossierCps}</p>}
        </div>
      </div>

      {messageSucces && (
        <div className="rounded-xl bg-tertiary-container/50 px-4 py-3 text-sm font-medium text-tertiary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {messageSucces}
        </div>
      )}

      {/* En-tête gradient */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dim p-6 text-on-primary shadow-md">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Visite CPS Enfant</p>
            <h2 className="font-headline text-2xl font-bold">{LABELS_VISITE[visite.typeVisite] ?? visite.typeVisite}</h2>
            <p className="mt-1 text-sm opacity-80">{fmtDate(visite.dateVisite)}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/15 px-5 py-3 text-center backdrop-blur-md">
            {visite.poidsKg && <p className="text-2xl font-bold">{visite.poidsKg} kg</p>}
            {visite.tailleCm && <p className="text-xs opacity-80 mt-0.5">{visite.tailleCm} cm</p>}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
      </section>

      {/* Anthropométrie */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre icone="monitor_weight" titre="Anthropométrie" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ChampLecture label="Poids" valeur={visite.poidsKg ? `${visite.poidsKg} kg` : null} />
          <ChampLecture label="Taille" valeur={visite.tailleCm ? `${visite.tailleCm} cm` : null} />
          <ChampLecture label="Périmètre crânien" valeur={visite.perimetreCranienCm ? `${visite.perimetreCranienCm} cm` : null} />
        </div>
      </div>

      {/* Signes vitaux */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre icone="favorite" titre="Signes vitaux" />
        <div className="grid grid-cols-3 gap-3">
          <ChampLecture label="Température" valeur={visite.temperatureCelsius ? `${visite.temperatureCelsius} °C` : null} />
          <ChampLecture label="Fréquence cardiaque" valeur={visite.frequenceCardiaque ? `${visite.frequenceCardiaque} bpm` : null} />
          <ChampLecture label="Fréquence respiratoire" valeur={visite.frequenceRespiratoire ? `${visite.frequenceRespiratoire} /min` : null} />
        </div>
      </div>

      {/* Examen néonatal */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre icone="stethoscope" titre="Examen néonatal" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <ChampLecture label="État général" valeur={visite.etatGeneral} />
          <ChampLecture label="Allaitement" valeur={visite.allaitement} />
          <ChampLecture label="Couleur peau" valeur={visite.couleurPeau} />
          <ChampLecture label="État cordon" valeur={visite.etatCordon} />
          <ChampLecture label="Dév. psychomoteur" valeur={visite.developpementPsychomoteur} />
        </div>
        <div className="flex flex-wrap gap-2">
          <TuileBool label="Œdèmes" valeur={visite.oedemes} />
          <TuileBool label="Ictère" valeur={visite.ictere} />
          <TuileBool label="Convulsions" valeur={visite.convulsions} couleurVrai="bg-error text-on-error" />
        </div>
      </div>

      {/* Vaccinations */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre icone="vaccines" titre="Vaccinations administrées" />
        {visite.vaccinsAdministres ? (
          <div className="flex flex-wrap gap-2">
            {visite.vaccinsAdministres.split(',').map((v) => v.trim()).filter(Boolean).map((label) => (
              <span key={label} className="rounded-xl bg-tertiary-container px-4 py-2 text-sm font-medium text-on-tertiary-container">{label}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-on-surface-variant/60">Aucun vaccin enregistré</p>
        )}
      </div>

      {/* Décision */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre icone="assignment" titre="Décision et conduite" />
        <div className="grid grid-cols-2 gap-3">
          <ChampLecture label="Conduite à tenir" valeur={visite.conduiteATenir} />
          <ChampLecture label="Prochain RDV" valeur={fmtDate(visite.prochainRdvDate)} />
          <div className="col-span-2">
            <ChampLecture label="Traitement prescrit" valeur={visite.traitementPrescrit} />
          </div>
          {visite.observations && (
            <div className="col-span-2">
              <ChampLecture label="Observations" valeur={visite.observations} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageDetailVisiteCpsEnfant
