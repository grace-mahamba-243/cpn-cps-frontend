// Ce composant orchestre la vue détaillée d'un dossier CPS Enfant avec bandeau, raccourcis et modale clôture.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'

// Retourne true si le dossier dépasse 59 mois depuis son ouverture.
function estExpire(dateOuverture) {
  if (!dateOuverture) return false
  const limite = new Date(dateOuverture)
  limite.setMonth(limite.getMonth() + 59)
  return new Date() > limite
}

const ORDRE_PROTOCOLE = ['SIX_HEURES', 'SIX_JOURS', 'SIX_SEMAINES', 'M2', 'M3', 'M6', 'M9', 'M12']
const LABELS_VISITE = {
  SIX_HEURES: '6 heures', SIX_JOURS: '6 jours', SIX_SEMAINES: '6 semaines',
  M2: '2 mois', M3: '3 mois', M6: '6 mois', M9: '9 mois', M12: '12 mois', SURPRISE: 'Surprise',
}

function BandeauEnfant({ dossier }) {
  const enfant = dossier.enfant
  const nom = enfant
    ? [enfant.nom, enfant.postnom, enfant.prenom].filter(Boolean).join(' ')
    : dossier.mereNom ? `Enfant de ${dossier.mereNom}` : '—'
  const faits = new Set((dossier.visites ?? []).map((v) => v.typeVisite))
  const prochain = ORDRE_PROTOCOLE.find((t) => !faits.has(t))
  const prochaineVisite = prochain ? `Prochaine : visite ${LABELS_VISITE[prochain]}` : 'Protocole complet'
  const groupeRhesus = dossier.groupeSanguin ? `${dossier.groupeSanguin}${dossier.rhesus ?? ''}` : null

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dim p-8 text-on-primary shadow-md">
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-md">
            <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
          </div>
          <div>
            <h2 className="font-headline text-2xl font-extrabold leading-tight md:text-3xl">{nom}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold tracking-wide">{dossier.numeroDossierCps}</span>
              {groupeRhesus && (
                <span className="rounded-full border border-white/15 bg-tertiary-container/20 px-3 py-0.5 text-[11px] font-bold text-tertiary-container">{groupeRhesus}</span>
              )}
              <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${dossier.statut === 'OUVERT' ? 'bg-white/20' : 'bg-error-container/40 text-on-error'}`}>
                {dossier.statut}
              </span>
              {dossier.poidsNaissanceG && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold">
                  Naissance : {dossier.poidsNaissanceG} g
                </span>
              )}
            </div>
            {dossier.mereNom && (
              <p className="mt-2 text-xs opacity-80">Mère : {dossier.mereNom}</p>
            )}
          </div>
        </div>
        <div className="min-w-[190px] rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-70">Visites postnatales</p>
          <p className="font-headline text-xl font-bold">{(dossier.visites ?? []).length} visite(s)</p>
          <p className="mt-0.5 text-xs opacity-80">{prochaineVisite}</p>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
    </section>
  )
}

function CarteRaccourci({ icone, titre, sousTitre, badge, couleurIcone, couleurBadge, onClick }) {
  return (
    <button onClick={onClick}
      className="group relative flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${couleurIcone}`}>
        <span className="material-symbols-outlined text-2xl">{icone}</span>
      </div>
      <p className="text-sm font-bold text-on-surface">{titre}</p>
      {badge !== null && badge !== undefined && (
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${couleurBadge}`}>{badge}</span>
      )}
    </button>
  )
}

function PageDetailDossierCpsEnfant() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [modaleClotureOuverte, setModaleClotureOuverte] = useState(false)
  const [notesCloture, setNotesCloture] = useState('')
  const [clotureEnCours, setClotureEnCours] = useState(false)

  const chargerDossier = async () => {
    setChargement(true); setErreur('')
    try {
      const data = await serviceCpsEnfant.obtenirDossier(dossierId)
      setDossier(data)
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerDossier()
    if (location.state?.messageSucces) {
      window.history.replaceState({ ...location.state, messageSucces: undefined }, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId])

  useEffect(() => {
    if (!messageSucces) return
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  const cloturerDossier = async () => {
    setClotureEnCours(true)
    try {
      await serviceCpsEnfant.cloturerDossier(dossierId, notesCloture)
      setModaleClotureOuverte(false)
      setMessageSucces('Dossier clôturé avec succès.')
      await chargerDossier()
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setClotureEnCours(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">refresh</span>
        Chargement...
      </div>
    )
  }
  if (erreur || !dossier) {
    return (
      <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
        {erreur || 'Dossier introuvable.'}
      </div>
    )
  }

  const nbVisites = (dossier.visites ?? []).length
  const faits = new Set((dossier.visites ?? []).map((v) => v.typeVisite))
  const prochain = ORDRE_PROTOCOLE.find((t) => !faits.has(t))
  const expire = estExpire(dossier.dateOuverture)
  const dossierActif = dossier.statut === 'OUVERT' && !expire

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Bouton retour */}
      <button onClick={() => navigate('/cps-enfant')}
        className="flex w-fit items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Retour à la liste
      </button>

      {/* Message succès */}
      {messageSucces && (
        <div className="rounded-xl bg-tertiary-container/50 px-4 py-3 text-sm font-medium text-tertiary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {messageSucces}
        </div>
      )}

      {/* Bandeau expiration 59 mois */}
      {expire && (
        <div className="flex items-start gap-3 rounded-xl bg-error-container/40 px-5 py-4 text-sm text-on-error-container">
          <span className="material-symbols-outlined text-xl text-error mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
          <div>
            <p className="font-bold text-error">Suivi CPS terminé — 59 mois écoulés</p>
            <p className="mt-0.5 text-on-error-container/80">Ce dossier a dépassé la durée maximale de suivi CPS Enfant (0–59 mois). Il est automatiquement clôturé et ne peut plus recevoir de nouvelles visites ni examens.</p>
          </div>
        </div>
      )}

      {/* Bandeau hero */}
      <BandeauEnfant dossier={dossier} />

      {/* Boutons d'action rapide */}
      <div className="flex flex-wrap gap-3">
        {dossierActif && (
          <button
            onClick={() => navigate(`/cps-enfant/${dossierId}/visites/nouvelle`)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Nouvelle visite
            {prochain && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{LABELS_VISITE[prochain]}</span>}
          </button>
        )}
        {dossierActif && (
          <button
            onClick={() => setModaleClotureOuverte(true)}
            className="inline-flex items-center gap-2 rounded-full border border-error/30 px-5 py-2.5 text-sm font-semibold text-error hover:bg-error/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">task_alt</span>
            Clôturer le dossier
          </button>
        )}
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CarteRaccourci
          icone="folder_shared"
          titre="Dossier administratif"
          sousTitre="Identité et informations de l'enfant"
          couleurIcone="bg-secondary-container text-on-secondary-container"
          couleurBadge=""
          onClick={() => navigate(`/enfants/${dossier.enfant?.id ?? dossier.enfantId}`)}
        />
        <CarteRaccourci
          icone="medical_services"
          titre="Visites CPS"
          sousTitre={`${nbVisites} visite(s) enregistrée(s)`}
          badge={nbVisites > 0 ? nbVisites : null}
          couleurIcone="bg-primary/10 text-primary"
          couleurBadge="bg-primary text-on-primary"
          onClick={() => navigate(`/cps-enfant/${dossierId}/visites`)}
        />
        <CarteRaccourci
          icone="biotech"
          titre="Examens"
          sousTitre="Biologiques et échographies"
          couleurIcone="bg-tertiary-container text-on-tertiary-container"
          couleurBadge=""
          onClick={() => navigate(`/cps-enfant/${dossierId}/examens`)}
        />
        <CarteRaccourci
          icone="vaccines"
          titre="Vaccination"
          sousTitre="Carnet vaccinal de l'enfant"
          couleurIcone="bg-secondary-container text-on-secondary-container"
          couleurBadge=""
          onClick={() => navigate(`/dossier-enfant/${dossier.enfant?.id ?? dossier.enfantId}/vaccinations`)}
        />
      </div>

      {/* Modale clôture */}
      {modaleClotureOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="mb-2 font-semibold text-on-surface">Clôturer le dossier</h3>
            <p className="mb-4 text-sm text-on-surface-variant">Cette action marquera le suivi CPS de cet enfant comme terminé.</p>
            <textarea value={notesCloture} onChange={(e) => setNotesCloture(e.target.value)} rows={3}
              placeholder="Motif ou notes de clôture (optionnel)..."
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50 resize-none" />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setModaleClotureOuverte(false)}
                className="rounded-full border border-outline px-4 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container">
                Annuler
              </button>
              <button onClick={cloturerDossier} disabled={clotureEnCours}
                className="flex items-center gap-1.5 rounded-full bg-error px-4 py-1.5 text-sm font-semibold text-on-error hover:opacity-90 disabled:opacity-60">
                {clotureEnCours && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                Confirmer la clôture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageDetailDossierCpsEnfant
