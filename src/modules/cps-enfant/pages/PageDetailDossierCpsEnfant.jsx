// Ce composant orchestre la vue détaillée d'un dossier CPS Enfant avec bandeau, raccourcis et modale clôture.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'
import serviceRendezVous from '../../../services/api/serviceRendezVous'
import InfoEnregistrement from '../../../composants/partages/InfoEnregistrement'

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
  const derniereVisite = (dossier.visites ?? []).at(-1)
  const prochainRdv = derniereVisite?.prochainRdvDate
  const prochaineVisite = prochainRdv
    ? `Prochain RDV : ${new Date(prochainRdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`
    : ORDRE_PROTOCOLE.every((t) => faits.has(t)) ? 'Protocole complet' : 'Aucun RDV planifié'
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
          <p className="font-headline text-xl font-bold">{(dossier.visites ?? []).length} visite(s)</p>
          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Prochain RDV</p>
            <p className="mt-0.5 text-xs font-semibold">{prochainRdv ? new Date(prochainRdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Aucun planifié'}</p>
          </div>
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
  const [rdvDuJour, setRdvDuJour] = useState(null)
  const [finEnCours, setFinEnCours] = useState(false)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  const chargerRdvDuJour = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const liste = await serviceRendezVous.lister({ date: today, statut: 'Arrive', serviceDestination: 'Maternite (CPS Enfant)' })
      setRdvDuJour(liste)
    } catch { setRdvDuJour([]) }
  }

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
  useEffect(() => { chargerRdvDuJour() }, [dossierId])

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

  const supprimerDossier = async () => {
    setSuppressionEnCours(true)
    try {
      await serviceCpsEnfant.supprimerDossier(dossierId)
      navigate('/cps-enfant', { replace: true, state: { messageSucces: 'Dossier CPS Enfant supprimé avec succès.' } })
    } catch (ex) {
      alert(ex.message)
      setModaleSuppressionOuverte(false)
    } finally { setSuppressionEnCours(false) }
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
    <div className="mx-auto flex max-w-4xl flex-col gap-8">

      {/* Bouton retour */}
      <button onClick={() => navigate(-1)} className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour
      </button>

      {/* Toast succès */}
      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/60 px-5 py-3.5 text-sm font-medium text-on-tertiary-container backdrop-blur">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
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

      {/* Raccourcis */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Aperçu du dossier</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <CarteRaccourci
            icone="folder_shared"
            titre="Dossier administratif"
            badge={null}
            couleurIcone="bg-secondary-container text-on-secondary-container"
            couleurBadge={null}
            onClick={() => navigate(`/enfants/${dossier.enfant?.id ?? dossier.enfantId}`)}
          />
          <CarteRaccourci
            icone="medical_services"
            titre="Visites CPS"
            badge={nbVisites > 0 ? nbVisites : null}
            couleurIcone="bg-primary/10 text-primary"
            couleurBadge="bg-primary/10 text-primary"
            onClick={() => navigate(`/cps-enfant/${dossierId}/visites`)}
          />
          <CarteRaccourci
            icone="biotech"
            titre="Examens"
            badge={null}
            couleurIcone="bg-tertiary-container/30 text-tertiary"
            couleurBadge={null}
            onClick={() => navigate(`/cps-enfant/${dossierId}/examens`)}
          />
          <CarteRaccourci
            icone="vaccines"
            titre="Vaccination"
            badge={null}
            couleurIcone="bg-surface-container-high text-on-surface-variant"
            couleurBadge={null}
            onClick={() => navigate(`/dossier-enfant/${dossier.enfant?.id ?? dossier.enfantId}/vaccinations`)}
          />
        </div>
      </section>

      {/* Actions */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {dossierActif && (
            <button
              onClick={() => navigate(`/cps-enfant/${dossierId}/visites/nouvelle`)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Nouvelle visite
              {prochain && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{LABELS_VISITE[prochain]}</span>}
            </button>
          )}
          {dossierActif && (
            <button
              onClick={() => setModaleClotureOuverte(true)}
              className="flex items-center gap-2 rounded-full bg-error-container/20 px-5 py-2.5 text-sm font-semibold text-error shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              Clore le dossier
            </button>
          )}

          {/* Supprimer : uniquement si aucune visite ni examen */}
          {nbVisites === 0 && (
            <button
              onClick={() => setModaleSuppressionOuverte(true)}
              className="flex items-center gap-2 rounded-full bg-error-container px-5 py-2.5 text-sm font-semibold text-on-error-container shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Supprimer le dossier
            </button>
          )}
        </div>
      </section>

      <InfoEnregistrement enregistrePar={dossier.enregistrePar} modifiePar={dossier.modifiePar} />

      {/* Modale confirmation suppression */}
      {modaleSuppressionOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-container">
              <span className="material-symbols-outlined text-2xl text-on-error-container">delete_forever</span>
            </div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Supprimer ce dossier CPS Enfant ?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">Cette action est irréversible. Le dossier sera définitivement supprimé.</p>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setModaleSuppressionOuverte(false)} className="rounded-full bg-surface-container px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:opacity-80">Annuler</button>
              <button
                onClick={supprimerDossier}
                disabled={suppressionEnCours}
                className="flex items-center gap-2 rounded-full bg-error px-5 py-2.5 text-sm font-semibold text-on-error hover:opacity-90 disabled:opacity-50"
              >
                {suppressionEnCours && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale clôture */}
      {modaleClotureOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-container/30">
                <span className="material-symbols-outlined text-xl text-error">lock</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Clôture du dossier CPS</h2>
                <p className="text-xs text-on-surface-variant">Dossier {dossier.numeroDossierCps}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">Libellé de clôture</label>
                <textarea
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Motif ou remarques de clôture"
                  value={notesCloture}
                  onChange={(e) => setNotesCloture(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setModaleClotureOuverte(false); setNotesCloture('') }}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                Annuler
              </button>
              <button onClick={cloturerDossier} disabled={clotureEnCours}
                className="flex items-center gap-2 rounded-full bg-error px-5 py-2.5 text-sm font-semibold text-on-error shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                <span className="material-symbols-outlined text-base">lock</span>
                {clotureEnCours ? 'Clôture en cours…' : 'Confirmer la clôture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageDetailDossierCpsEnfant
