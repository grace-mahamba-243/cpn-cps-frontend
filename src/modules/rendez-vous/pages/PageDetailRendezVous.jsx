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

/* ── Champ lecture seule (même style que PageDossierOuvertureCpn) ── */
function ChampLecture({ label, valeur, principal, couleur }) {
  const cls = couleur ?? (principal ? 'text-primary' : 'text-on-surface')
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className={`rounded-lg px-3 py-3 text-sm font-semibold bg-surface-container ${cls}`}>
        {(valeur !== null && valeur !== undefined && valeur !== '')
          ? valeur
          : <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

/* ── Section détail (style border-l-4) ── */
function SectionDetail({ icone, couleurIcone = 'text-primary', titre, children }) {
  return (
    <div className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
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

  const enregistrerArrivee = async () => {
    setActionEnCours('arrivee')
    setErreurAction(null)
    try {
      const rdvMaj = await serviceRendezVous.enregistrerArrivee(rendezVousId)
      setEtat((prev) => ({ ...prev, rendezVous: rdvMaj }))
    } catch (err) {
      setErreurAction(err.message)
    } finally {
      setActionEnCours(null)
    }
  }

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
    <div className="space-y-6">

      {/* En-tete */}
      <header className="mb-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dim transition-all mb-4 group text-sm font-semibold"
          onClick={() => navigate('/rendez-vous')}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Retour a la liste
        </button>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Detail du rendez-vous</h1>
            <p className="text-on-surface-variant mt-1">Consultez et gerez les details de la visite de la patiente.</p>
          </div>
        </div>
      </header>

      {/* Alerte erreur action */}
      {erreurAction && (
        <Alerte type="erreur" titre="Erreur">
          {erreurAction}
        </Alerte>
      )}

      {/* Barre d actions (visible si non annule et non termine) */}
      {!estAnnule && !estTermine && (
        <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Bouton enregistrer arrivee */}
            <div className="flex items-center gap-4 flex-grow lg:flex-grow-0">
              {estPrevu && (
                <button
                  type="button"
                  disabled={!!actionEnCours}
                  className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dim transition-colors shadow-md whitespace-nowrap disabled:opacity-60"
                  onClick={enregistrerArrivee}
                >
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  {actionEnCours === 'arrivee' ? 'Enregistrement...' : "Enregistrer l arrivee"}
                </button>
              )}
              {estArrive && (
                <span className="inline-flex items-center gap-2 bg-tertiary-container text-on-tertiary-container px-6 py-3 rounded-xl font-bold shadow-sm">
                  <span className="material-symbols-outlined text-xl">how_to_reg</span>
                  Arrivee enregistree
                </span>
              )}
            </div>

            {/* Actions secondaires (masquees si le patient est arrive) */}
            {!estArrive && <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                disabled={!!actionEnCours}
                className="bg-secondary-container text-on-secondary-container px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary-fixed-dim transition-all group disabled:opacity-60"
                onClick={() => {
                  setAfficherFormReprogrammer((v) => !v)
                  setFormReprogrammer({ date: rdv.date ?? '', heure: rdv.heure ?? '' })
                }}
              >
                <span className="material-symbols-outlined group-hover:rotate-45 transition-transform">event_repeat</span>
                Reprogrammer
              </button>

              {!confirmerAnnulation ? (
                <button
                  type="button"
                  disabled={!!actionEnCours}
                  className="border border-error/30 text-error px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-error/5 transition-all disabled:opacity-60"
                  onClick={() => setConfirmerAnnulation(true)}
                >
                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                  Annuler le rendez-vous
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-error-container/20 border border-error/30 px-4 py-2.5 rounded-xl">
                  <span className="text-sm font-semibold text-error mr-2">Confirmer l annulation ?</span>
                  <button
                    type="button"
                    disabled={actionEnCours === 'annulation'}
                    className="bg-error text-on-error px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-colors"
                    onClick={annulerRendezVous}
                  >
                    {actionEnCours === 'annulation' ? 'En cours...' : 'Oui'}
                  </button>
                  <button
                    type="button"
                    className="border border-outline-variant/40 text-on-surface-variant px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-container transition-colors"
                    onClick={() => setConfirmerAnnulation(false)}
                  >
                    Non
                  </button>
                </div>
              )}
            </div>}
          </div>

          {/* Formulaire reprogrammation inline */}
          {afficherFormReprogrammer && (
            <form
              onSubmit={soumettreReprogrammation}
              className="mt-6 pt-6 border-t border-outline-variant/20 flex flex-wrap items-end gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nouvelle date</p>
                <input
                  type="date"
                  required
                  value={formReprogrammer.date}
                  onChange={(e) => setFormReprogrammer((p) => ({ ...p, date: e.target.value }))}
                  className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nouvelle heure</p>
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
                className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dim transition-colors disabled:opacity-60"
              >
                {actionEnCours === 'reprogrammer' ? 'En cours...' : 'Confirmer la reprogrammation'}
              </button>
              <button
                type="button"
                className="border border-outline-variant/40 text-on-surface-variant px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors"
                onClick={() => setAfficherFormReprogrammer(false)}
              >
                Annuler
              </button>
            </form>
          )}
        </section>
      )}

      {/* Grille principale */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-6">

          {/* Apercu patient */}
          <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar initiales */}
              <div className="w-14 h-14 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-extrabold text-on-tertiary-container tracking-tight">
                  {rdv.initialesPatient || ''}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
                  {rdv.typePatient === 'Enfant' ? 'Enfant' : 'Patiente'}
                </span>
                <h2 className="text-xl font-bold text-on-surface">
                  {rdv.nomPatient}
                  {rdv.numeroDossier && (
                    <span className="text-on-surface-variant font-normal text-sm ml-3">{rdv.numeroDossier}</span>
                  )}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={obtenirClassesStatut(rdv.statut)}>
                <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                {rdv.statut}
              </span>
            </div>
          </section>

          {/* Informations detaillees */}
          <SectionDetail icone="event_note" couleurIcone="text-primary" titre="Informations détaillées">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                <ChampLecture label="Service médical" valeur={rdv.service} />
                <ChampLecture label="Date" valeur={formaterDate(rdv.date)} principal />
                <ChampLecture label="Heure" valeur={rdv.heure} principal />
              </div>
              <hr className="border-surface-container-high" />
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                <ChampLecture label="Motif" valeur={rdv.motif} />
                <ChampLecture label="Type de visite" valeur="Visite planifiée" />
                {rdv.creePar && <ChampLecture label="Enregistré par" valeur={rdv.creePar} />}
              </div>
              {rdv.observations && (
                <>
                  <hr className="border-surface-container-high" />
                  <div className="flex flex-col">
                    <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Observations</span>
                    <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed">{rdv.observations}</div>
                  </div>
                </>
              )}
              {rdv.misAJourLe && rdv.creeLe !== rdv.misAJourLe && (
                <>
                  <hr className="border-surface-container-high" />
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    {rdv.creeLe && <ChampLecture label="Créé le" valeur={formaterDateHeure(rdv.creeLe)} />}
                    <ChampLecture label="Dernière mise à jour" valeur={formaterDateHeure(rdv.misAJourLe)} />
                  </div>
                </>
              )}
            </div>
          </SectionDetail>

        </div>
      </div>
    </div>
  )
}

export default PageDetailRendezVous
