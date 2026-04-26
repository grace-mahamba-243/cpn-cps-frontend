import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/api/serviceRendezVous'

// Formate une date ISO en date longue lisible en francais (ex: "Vendredi, 24 mai 2024")
function formaterDate(dateIso) {
  if (!dateIso) return 'Non renseigne'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

// Formate une date ISO en date et heure lisibles (ex: "24 mai 2024, 08:30")
function formaterDateHeure(dateIso) {
  if (!dateIso) return null
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

// Retourne les classes Tailwind pour le badge de statut selon la valeur
function obtenirClassesStatut(statut) {
  const base = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm'
  switch ((statut ?? '').toLowerCase()) {
    case 'prevu':
      return `${base} bg-primary-container text-on-primary-container`
    case 'arrive':
      return `${base} bg-tertiary-container text-on-tertiary-container`
    case 'termine':
      return `${base} bg-surface-container-highest text-on-surface`
    case 'annule':
      return `${base} bg-error-container text-on-error-container`
    case 'reprogramme':
      return `${base} bg-secondary-container text-on-secondary-container`
    default:
      return `${base} bg-surface-container text-on-surface-variant`
  }
}

// Retourne l icone materiel selon le statut
function obtenirIconeStatut(statut) {
  switch ((statut ?? '').toLowerCase()) {
    case 'prevu': return 'schedule'
    case 'arrive': return 'how_to_reg'
    case 'termine': return 'task_alt'
    case 'annule': return 'cancel'
    case 'reprogramme': return 'event_repeat'
    default: return 'help_outline'
  }
}

/* -- Champ lecture seule (même style que PageDossierOuvertureCpn) -- */
function ChampLecture({ label, valeur, principal, couleur }) {
  const cls = couleur ?? (principal ? 'text-primary' : 'text-on-surface')
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className={`w-[90%] rounded-lg px-3 py-3 text-sm font-semibold bg-surface-container ${cls}`}>
        {(valeur !== null && valeur !== undefined && valeur !== '')
          ? valeur
          : <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

/* -- Section détail (style border-l-4) -- */
function SectionDetail({ icone, couleurIcone = 'text-primary', titre, children }) {
  return (
    <div className="w-[70%] mx-auto rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <span className={`material-symbols-outlined ${couleurIcone}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icone}</span>
        <h4 className="text-lg font-bold tracking-tight text-on-surface">{titre}</h4>
      </div>
      {children}
    </div>
  )
}

// Ce composant affiche le detail complet d un rendez-vous avec le nouveau design :
// barre d actions en haut, apercu patient, et grille d informations detaillees.
function PageDetailRendezVous() {
  const navigate = useNavigate()
  const { rendezVousId } = useParams()

  const [etat, setEtat] = useState({ chargement: true, rendezVous: null, erreur: null })
  const [actionEnCours, setActionEnCours] = useState(null)
  const [erreurAction, setErreurAction] = useState(null)
  const [afficherFormReprogrammer, setAfficherFormReprogrammer] = useState(false)
  const [formReprogrammer, setFormReprogrammer] = useState({ date: '', heure: '' })
  const [confirmerAnnulation, setConfirmerAnnulation] = useState(false)

  useEffect(() => {
    let estActif = true
    const charger = async () => {
      try {
        const rdv = await serviceRendezVous.recupererParId(rendezVousId)
        if (estActif) setEtat({ chargement: false, rendezVous: rdv, erreur: null })
      } catch (err) {
        if (estActif) setEtat({ chargement: false, rendezVous: null, erreur: err.message })
      }
    }
    void charger()
    return () => { estActif = false }
  }, [rendezVousId])

  const annulerRendezVous = async () => {
    setActionEnCours('annulation')
    setErreurAction(null)
    try {
      const rdvMaj = await serviceRendezVous.mettreAJourStatut(rendezVousId, 'Annule')
      setEtat((prev) => ({ ...prev, rendezVous: rdvMaj }))
      setConfirmerAnnulation(false)
    } catch (err) {
      setErreurAction(err.message)
    } finally {
      setActionEnCours(null)
    }
  }

  const soumettreReprogrammation = async (e) => {
    e.preventDefault()
    setActionEnCours('reprogrammer')
    setErreurAction(null)
    try {
      const rdvMaj = await serviceRendezVous.reprogrammer(rendezVousId, formReprogrammer.date, formReprogrammer.heure)
      setEtat((prev) => ({ ...prev, rendezVous: rdvMaj }))
      setFormReprogrammer({ date: '', heure: '' })
      setAfficherFormReprogrammer(false)
    } catch (err) {
      setErreurAction(err.message)
    } finally {
      setActionEnCours(null)
    }
  }

  // Etat chargement
  if (etat.chargement) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
        <span className="material-symbols-outlined animate-spin">hourglass_top</span>
        <p>Chargement du rendez-vous...</p>
      </div>
    )
  }

  // Etat erreur ou introuvable
  if (etat.erreur || !etat.rendezVous) {
    return (
      <div className="space-y-6">
        <Alerte type="erreur" titre="Rendez-vous introuvable">
          {etat.erreur ?? "Le rendez-vous demande est introuvable ou n est plus disponible."}
        </Alerte>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors"
          onClick={() => navigate('/rendez-vous')}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour a la liste
        </button>
      </div>
    )
  }

  const rdv = etat.rendezVous
  const estPrevu = (rdv.statut ?? '').toLowerCase() === 'prevu'
  const estArrive = (rdv.statut ?? '').toLowerCase() === 'arrive'
  const estTermine = (rdv.statut ?? '').toLowerCase() === 'termine'
  const estAnnule = (rdv.statut ?? '').toLowerCase() === 'annule'

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-2">

      {/* En-tête + actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
            onClick={() => navigate('/rendez-vous')}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour à la liste
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Détail du rendez-vous</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={obtenirClassesStatut(rdv.statut)}>
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{obtenirIconeStatut(rdv.statut)}</span>
            {rdv.statut}
          </span>
          {rdv.numeroDossier && (
            <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
              <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">N° dossier</p>
              <p className="mt-1 text-lg font-black">{rdv.numeroDossier}</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerte erreur action */}
      {erreurAction && (
        <Alerte type="erreur" titre="Erreur">
          {erreurAction}
        </Alerte>
      )}

      {/* Aperçu patient + Actions — sur la même ligne */}
      {(!estAnnule && !estTermine) ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Patient */}
          <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tertiary-container">
                <span className="text-base font-extrabold tracking-tight text-on-tertiary-container">
                  {rdv.initialesPatient || '—'}
                </span>
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {rdv.typePatient === 'Enfant' ? 'Enfant' : 'Patiente'}
                </span>
                <p className="text-sm font-bold text-on-surface">{rdv.nomPatient}</p>
              </div>
            </div>
          </section>

              {/* Actions — visible uniquement s'il reste des actions possibles */}
          {!estArrive && <section className="rounded-xl border-l-4 border-primary/40 bg-surface-container-lowest p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {!estArrive && (
                <>
                  <button
                    type="button"
                    disabled={!!actionEnCours}
                    className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-60"
                    onClick={() => {
                      setAfficherFormReprogrammer((v) => !v)
                      setFormReprogrammer({ date: rdv.date ?? '', heure: rdv.heure ?? '' })
                    }}
                  >
                    <span className="material-symbols-outlined text-base">event_repeat</span>
                    Reprogrammer
                  </button>
                  {!confirmerAnnulation ? (
                    <button
                      type="button"
                      disabled={!!actionEnCours}
                      className="inline-flex items-center gap-2 rounded-full border border-error/30 px-5 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/5 disabled:opacity-60"
                      onClick={() => setConfirmerAnnulation(true)}
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      Annuler
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full border border-error/30 bg-error-container/10 px-4 py-2">
                      <span className="text-sm font-semibold text-error">Confirmer ?</span>
                      <button
                        type="button"
                        disabled={actionEnCours === 'annulation'}
                        className="rounded-full bg-error px-4 py-1.5 text-sm font-bold text-on-error transition-colors hover:opacity-90 disabled:opacity-60"
                        onClick={annulerRendezVous}
                      >
                        {actionEnCours === 'annulation' ? '...' : 'Oui'}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-outline-variant/40 px-4 py-1.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container"
                        onClick={() => setConfirmerAnnulation(false)}
                      >
                        Non
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {afficherFormReprogrammer && (
              <form
                onSubmit={soumettreReprogrammation}
                className="mt-6 flex flex-wrap items-end gap-4 border-t border-outline-variant/20 pt-6"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nouvelle date</p>
                  <input
                    type="date"
                    required
                    value={formReprogrammer.date}
                    onChange={(e) => setFormReprogrammer((p) => ({ ...p, date: e.target.value }))}
                    className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nouvelle heure</p>
                  <input
                    type="time"
                    required
                    value={formReprogrammer.heure}
                    onChange={(e) => setFormReprogrammer((p) => ({ ...p, heure: e.target.value }))}
                    className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionEnCours === 'reprogrammer'}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {actionEnCours === 'reprogrammer' ? 'En cours...' : 'Confirmer'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-outline-variant/40 bg-white px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                  onClick={() => setAfficherFormReprogrammer(false)}
                >
                  Annuler
                </button>
              </form>
            )}
          </section>}
        </div>
      ) : (
        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tertiary-container">
              <span className="text-base font-extrabold tracking-tight text-on-tertiary-container">
                {rdv.initialesPatient || '—'}
              </span>
            </div>
            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {rdv.typePatient === 'Enfant' ? 'Enfant' : 'Patiente'}
              </span>
              <p className="text-sm font-bold text-on-surface">{rdv.nomPatient}</p>
            </div>
          </div>
        </section>
      )}

      {/* Informations détaillées */}
      <section className="w-[70%] mx-auto rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Informations détaillées</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Date" valeur={formaterDate(rdv.date)} principal />
          <ChampLecture label="Heure" valeur={rdv.heure} principal />
          <ChampLecture label="Service m—dical" valeur={rdv.service} />
        </div>
        <hr className="my-6 border-surface-container-high" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ChampLecture label="Motif" valeur={rdv.motif} />
          <ChampLecture label="Type de visite" valeur="Consultation" />
          {rdv.creePar && <ChampLecture label="Enregistr— par" valeur={rdv.creePar} />}
        </div>
        {rdv.observations && (
          <>
            <hr className="my-6 border-surface-container-high" />
            <div className="flex flex-col">
              <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Observations</span>
              <div className="rounded-lg bg-surface-container px-3 py-3 text-sm leading-relaxed text-on-surface">{rdv.observations}</div>
            </div>
          </>
        )}
        {rdv.misAJourLe && rdv.creeLe !== rdv.misAJourLe && (
          <>
            <hr className="my-6 border-surface-container-high" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {rdv.creeLe && <ChampLecture label="Cr—— le" valeur={formaterDateHeure(rdv.creeLe)} />}
              <ChampLecture label="Derni—re mise — jour" valeur={formaterDateHeure(rdv.misAJourLe)} />
            </div>
          </>
        )}
      </section>

    </div>
  )
}

export default PageDetailRendezVous
