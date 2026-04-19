// Ce composant gere l enregistrement d une arrivee a la reception.
// Si le patient a un rendez-vous aujourd hui, on confirme son arrivee.
// Sinon, on cree directement un enregistrement avec le statut Arrive.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/api/serviceRendezVous'
import serviceDossiersMeres from '../../../services/api/serviceDossiersMeres'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

const SERVICES_MERE = [
  { valeur: 'Maternite (CPN)', label: 'CPN (Consultation Prenatale)' },
  { valeur: 'CPS Femme', label: 'CPS Femme (Consultation Postnatale)' },
]

const SERVICES_ENFANT = [
  { valeur: 'Suivi enfant', label: 'Suivi enfant' },
]

function obtenirDateAujourdhui() {
  return new Date().toISOString().split('T')[0]
}

function obtenirHeureMaintenant() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function normaliserTexte(valeur = '') {
  return valeur.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function obtenirNomComplet(dossier) {
  return [dossier.nom, dossier.postnom, dossier.prenom].filter(Boolean).join(' ')
}

function classesBadgeStatut(statut) {
  if (!statut) return 'bg-surface-container text-on-surface-variant'
  const s = normaliserTexte(statut)
  if (s === 'arrive') return 'bg-tertiary-container text-on-tertiary-container'
  if (s === 'prevu') return 'bg-primary-container/50 text-on-primary-container'
  if (s === 'termine') return 'bg-surface-container-highest text-on-surface'
  if (s === 'annule') return 'bg-outline-variant/20 text-outline'
  if (s === 'reprogramme') return 'bg-secondary-container text-on-secondary-container'
  return 'bg-surface-container text-on-surface-variant'
}

// Etape 1 : recherche du patient
function EtapeRecherche({ typePatient, setTypePatient, dossiersFiltres, selectionner, recherche, setRecherche, rechercheRef, menuOuvert, setMenuOuvert, enChargement, onCreerDossier }) {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {[
          { valeur: 'Mere', label: 'Mere', icone: 'pregnant_woman' },
          { valeur: 'Enfant', label: 'Enfant', icone: 'child_care' },
        ].map(({ valeur, label, icone }) => (
          <button
            key={valeur}
            type="button"
            onClick={() => { setTypePatient(valeur); setRecherche(''); setMenuOuvert(false) }}
            className={[
              'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-95',
              typePatient === valeur
                ? 'border-outline-variant/50 bg-primary/5 text-primary'
                : 'border-outline-variant/40 text-on-surface-variant hover:border-outline-variant/50',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-2xl">{icone}</span>
            <span className="text-sm font-bold">{label}</span>
          </button>
        ))}
      </div>

      <div className="relative" ref={rechercheRef}>
        <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
          Nom ou numero de dossier
        </label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
            {enChargement ? 'hourglass_top' : 'search'}
          </span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setMenuOuvert(true) }}
            onFocus={() => setMenuOuvert(true)}
            placeholder={`Entrez le nom ou le numero de dossier ${typePatient === 'Enfant' ? 'enfant' : 'mere'}...`}
            className="w-full rounded-lg border-none bg-surface-container-lowest py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
        </div>

        {menuOuvert && dossiersFiltres.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            {dossiersFiltres.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors"
                  onClick={() => selectionner(d)}
                >
                  <p className="text-sm font-bold text-on-surface">{d.nomAffichage}</p>
                  <p className="text-xs font-mono text-primary mt-0.5">{d.reference}</p>
                  {d.detail ? <p className="text-xs text-on-surface-variant mt-0.5">{d.detail}</p> : null}
                </button>
              </li>
            ))}
          </ul>
        )}

        {menuOuvert && recherche.trim().length >= 2 && dossiersFiltres.length === 0 && !enChargement && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 shadow-xl">
            <p className="text-sm text-on-surface-variant mb-3">Aucun dossier trouvé pour cette recherche.</p>
            {typePatient === 'Mere' && (
            <button
              type="button"
              onClick={() => onCreerDossier(typePatient)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Creer un nouveau dossier mere
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Etape 2A : le patient a un RDV aujourd hui
function EtapeRdvTrouve({ dossierSelectionne, rdvDuJour, onConfirmer, onCreerQuandMeme, enChargement }) {
  const rdvsActifs = rdvDuJour.filter((rdv) => normaliserTexte(rdv.statut) !== 'annule' && normaliserTexte(rdv.statut) !== 'termine')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl bg-primary-container/20 border border-outline-variant/50 px-4 py-3">
        <span className="material-symbols-outlined text-primary">person</span>
        <div>
          <p className="text-sm font-bold text-on-surface">{dossierSelectionne.nomAffichage}</p>
          <p className="text-xs font-mono text-primary">{dossierSelectionne.reference}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-on-surface-variant">
          {rdvsActifs.length === 1 ? 'Rendez-vous trouve pour aujourd\'hui :' : `${rdvsActifs.length} rendez-vous trouves pour aujourd\'hui :`}
        </p>
        {rdvsActifs.map((rdv) => {
          const dejaArrive = normaliserTexte(rdv.statut) === 'arrive'
          return (
            <div key={rdv.id} className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-4 border border-outline-variant/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">schedule</span>
                  <span className="text-sm font-bold text-on-surface">{rdv.heure || '—'}</span>
                  {rdv.service && (
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">{rdv.service}</span>
                  )}
                </div>
                {rdv.motif && <p className="text-xs text-on-surface-variant ml-6">{rdv.motif}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${classesBadgeStatut(rdv.statut)}`}>
                  {rdv.statut}
                </span>
                {!dejaArrive && (
                  <button
                    type="button"
                    disabled={enChargement}
                    onClick={() => onConfirmer(rdv.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-base">how_to_reg</span>
                    {enChargement ? 'En cours...' : "Confirmer l'arrivee"}
                  </button>
                )}
                {dejaArrive && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-tertiary-container px-4 py-2 text-sm font-bold text-on-tertiary-container">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Arrivee enregistree
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-outline-variant/20 pt-4">
        <p className="text-xs text-on-surface-variant mb-2">Ce n'est pas le bon rendez-vous ?</p>
        <button
          type="button"
          onClick={onCreerQuandMeme}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Creer un nouvel enregistrement d'arrivee
        </button>
      </div>
    </div>
  )
}

// Etape 2C : le patient a un RDV programme dans le futur (pas aujourd hui)
// Le workflow : annuler ce RDV et creer une arrivee pour aujourd hui
function EtapeRdvFutur({ dossierSelectionne, rdvFutur, onRemplacer, onIgnorer, enChargement }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl bg-primary-container/20 border border-outline-variant/50 px-4 py-3">
        <span className="material-symbols-outlined text-primary">person</span>
        <div>
          <p className="text-sm font-bold text-on-surface">{dossierSelectionne.nomAffichage}</p>
          <p className="text-xs font-mono text-primary">{dossierSelectionne.reference}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-tertiary-container/30 border border-outline-variant/50 px-4 py-4">
        <span className="material-symbols-outlined text-tertiary mt-0.5">event_upcoming</span>
        <div>
          <p className="text-sm font-semibold text-on-tertiary-container">
            Ce patient n'a pas de rendez-vous aujourd'hui mais a un rendez-vous programme.
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            En confirmant, le rendez-vous programme sera annule et une arrivee pour aujourd'hui sera enregistree.
            L'historique du rendez-vous annule sera conserve.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-on-surface-variant">Rendez-vous programme a annuler :</p>
        {rdvFutur.map((rdv) => (
          <div key={rdv.id} className="rounded-xl bg-surface-container-lowest border border-outline-variant/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-base">calendar_today</span>
                <span className="text-sm font-bold text-on-surface">
                  {rdv.date ? new Intl.DateTimeFormat('fr-FR').format(new Date(rdv.date + 'T00:00:00')) : '—'}
                </span>
                <span className="text-sm text-on-surface-variant">a {rdv.heure || '—'}</span>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${classesBadgeStatut(rdv.statut)}`}>
                {rdv.statut}
              </span>
            </div>
            {rdv.service && <p className="text-xs text-on-surface-variant ml-6">{rdv.service}</p>}
            {rdv.motif && <p className="text-xs text-on-surface-variant ml-6 italic">{rdv.motif}</p>}
            <button
              type="button"
              disabled={enChargement}
              onClick={() => onRemplacer(rdv.id)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-4 py-2.5 text-sm font-bold text-on-tertiary hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">how_to_reg</span>
              {enChargement ? 'En cours...' : "Annuler ce RDV et enregistrer l'arrivee"}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-outline-variant/20 pt-4">
        <p className="text-xs text-on-surface-variant mb-2">Vous souhaitez garder le RDV programme ?</p>
        <button
          type="button"
          onClick={onIgnorer}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Ignorer et creer un enregistrement d'arrivee sans annulation
        </button>
      </div>
    </div>
  )
}

// Etape 2B : pas de RDV, creer directement avec statut ARRIVE
function EtapeAucunRdv({ dossierSelectionne, onSoumettre, enChargement }) {
  const servicesFiltres = dossierSelectionne?.typePatient === 'Enfant' ? SERVICES_ENFANT : SERVICES_MERE
  const [service, setService] = useState(servicesFiltres.length === 1 ? servicesFiltres[0].valeur : '')
  const [motif, setMotif] = useState('')
  const [erreurs, setErreurs] = useState({})

  function valider() {
    const errs = {}
    if (!service) errs.service = 'Veuillez choisir un service.'
    if (!motif.trim()) errs.motif = 'Le motif est obligatoire.'
    setErreurs(errs)
    return Object.keys(errs).length === 0
  }

  function soumettre(e) {
    e.preventDefault()
    if (valider()) onSoumettre({ service, motif: motif.trim() })
  }

  return (
    <form onSubmit={soumettre} className="space-y-6" noValidate>
      <div className="flex items-center gap-3 rounded-xl bg-primary-container/20 border border-outline-variant/50 px-4 py-3">
        <span className="material-symbols-outlined text-primary">person</span>
        <div>
          <p className="text-sm font-bold text-on-surface">{dossierSelectionne.nomAffichage}</p>
          <p className="text-xs font-mono text-primary">{dossierSelectionne.reference}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-secondary-container/30 border border-outline-variant/50 px-4 py-3 text-sm text-on-secondary-container">
        <span className="material-symbols-outlined text-base">info</span>
        Aucun rendez-vous trouve pour ce patient aujourd'hui. L'arrivee sera enregistree directement.
      </div>

      <div className="space-y-4">
        {/* Service */}
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
            Service de destination
          </label>
          <select
            value={service}
            onChange={(e) => { setService(e.target.value); setErreurs((p) => ({ ...p, service: undefined })) }}
            className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Choisir un service --</option>
            {servicesFiltres.map((s) => (
              <option key={s.valeur} value={s.valeur}>{s.label}</option>
            ))}
          </select>
          {erreurs.service && <p className="ml-1 mt-1 text-xs text-error">{erreurs.service}</p>}
        </div>

        {/* Motif */}
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
            Motif de la visite
          </label>
          <input
            type="text"
            value={motif}
            maxLength={100}
            onChange={(e) => { setMotif(e.target.value); setErreurs((p) => ({ ...p, motif: undefined })) }}
            placeholder="Ex: Consultation CPN, Suivi vaccinal..."
            className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {erreurs.motif && <p className="ml-1 mt-1 text-xs text-error">{erreurs.motif}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={enChargement}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        <span className="material-symbols-outlined">how_to_reg</span>
        {enChargement ? 'Enregistrement...' : "Enregistrer l'arrivee"}
      </button>
    </form>
  )
}

// Composant principal
function PageEnregistrementArrivee() {
  const navigate = useNavigate()
  const rechercheRef = useRef(null)

  const [typePatient, setTypePatient] = useState('Mere')
  const [recherche, setRecherche] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [dossierSelectionne, setDossierSelectionne] = useState(null)

  const [rdvDuJour, setRdvDuJour] = useState([])
  const [rdvFutur, setRdvFutur] = useState([])
  const [etape, setEtape] = useState('recherche') // 'recherche' | 'rdv-trouve' | 'rdv-futur' | 'aucun-rdv' | 'termine'
  const [enChargementDossiers, setEnChargementDossiers] = useState(false)
  const [enChargementAction, setEnChargementAction] = useState(false)

  const [tousLesDossiersMeres, setTousLesDossiersMeres] = useState([])
  const [tousLesDossiersEnfants, setTousLesDossiersEnfants] = useState([])

  const [messageSucces, setMessageSucces] = useState('')
  const [messageErreur, setMessageErreur] = useState('')

  // Charger les dossiers au montage
  useEffect(() => {
    setEnChargementDossiers(true)
    Promise.all([
      serviceDossiersMeres.lister().catch(() => []),
      serviceDossiersEnfants.lister().catch(() => []),
    ]).then(([meres, enfants]) => {
      setTousLesDossiersMeres(meres)
      setTousLesDossiersEnfants(enfants)
    }).finally(() => setEnChargementDossiers(false))
  }, [])

  // Fermer menu si clic en dehors
  useEffect(() => {
    function gererClic(e) {
      if (rechercheRef.current && !rechercheRef.current.contains(e.target)) {
        setMenuOuvert(false)
      }
    }
    document.addEventListener('mousedown', gererClic)
    return () => document.removeEventListener('mousedown', gererClic)
  }, [])

  // Reinitialiser les dossiers filtres quand le type de patient change
  const dossiersFiltres = useMemo(() => {
    const terme = normaliserTexte(recherche.trim())
    if (!terme || terme.length < 2) return []

    const source = typePatient === 'Mere' ? tousLesDossiersMeres : tousLesDossiersEnfants
    return source
      .filter((d) => {
        const nom = normaliserTexte(obtenirNomComplet(d))
        const ref = normaliserTexte(d.numeroDossier ?? d.numeroFiche ?? '')
        return nom.includes(terme) || ref.includes(terme)
      })
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        nomAffichage: obtenirNomComplet(d),
        reference: d.numeroDossier ?? d.numeroFiche,
        detail: typePatient === 'Enfant' && d.nomMere ? `Mere : ${d.nomMere}` : (d.dateNaissance ? `Nee le ${d.dateNaissance}` : ''),
        typePatient,
      }))
  }, [recherche, typePatient, tousLesDossiersMeres, tousLesDossiersEnfants])

  async function selectionner(dossier) {
    setDossierSelectionne(dossier)
    setRecherche('')
    setMenuOuvert(false)
    setMessageErreur('')
    setRdvFutur([])

    try {
      const rdvs = await serviceRendezVous.chercherRdvDuJourParDossier(dossier.reference)
      const rdvsActifs = rdvs.filter((r) => normaliserTexte(r.statut) !== 'annule' && normaliserTexte(r.statut) !== 'termine')

      setRdvDuJour(rdvs)
      if (rdvsActifs.length > 0) {
        setEtape('rdv-trouve')
      } else {
        // Pas de RDV aujourd'hui : verifier si un RDV est programme dans le futur
        const futurs = await serviceRendezVous.chercherRdvFuturActifParDossier(dossier.reference)
        if (futurs.length > 0) {
          setRdvFutur(futurs)
          setEtape('rdv-futur')
        } else {
          setEtape('aucun-rdv')
        }
      }
    } catch {
      setEtape('aucun-rdv')
      setRdvDuJour([])
    }
  }

  async function confirmerArrivee(rdvId) {
    setEnChargementAction(true)
    setMessageErreur('')
    try {
      const rdvMaj = await serviceRendezVous.enregistrerArrivee(rdvId)
      setRdvDuJour((prev) => prev.map((r) => (r.id === rdvId ? rdvMaj : r)))
      setMessageSucces(`Arrivee confirmee pour ${dossierSelectionne.nomAffichage}.`)
    } catch (err) {
      setMessageErreur(err.message ?? "L'enregistrement a echoue.")
    } finally {
      setEnChargementAction(false)
    }
  }

  async function creerArriveeDirecte({ service, motif }) {
    if (!dossierSelectionne) return
    setEnChargementAction(true)
    setMessageErreur('')
    try {
      await serviceRendezVous.creer({
        date: obtenirDateAujourdhui(),
        heure: obtenirHeureMaintenant(),
        typePatient: dossierSelectionne.typePatient,
        nomPatient: dossierSelectionne.nomAffichage,
        numeroDossier: dossierSelectionne.reference,
        service,
        statut: 'Arrive',
        motif,
      })
      setMessageSucces(`Arrivee enregistree avec succes pour ${dossierSelectionne.nomAffichage}.`)
      setEtape('termine')
    } catch (err) {
      setMessageErreur(err.message ?? "L'enregistrement a echoue.")
    } finally {
      setEnChargementAction(false)
    }
  }

  async function remplacerArriveeRdvFutur(rdvId) {
    setEnChargementAction(true)
    setMessageErreur('')
    try {
      await serviceRendezVous.remplacerParArrivee(rdvId)
      setMessageSucces(
        `Arrivee enregistree pour ${dossierSelectionne.nomAffichage}. Le rendez-vous programme a ete annule et conserve dans l'historique.`
      )
      setEtape('termine')
    } catch (err) {
      setMessageErreur(err.message ?? "L'operation a echoue.")
    } finally {
      setEnChargementAction(false)
    }
  }

  function recommencer() {
    setDossierSelectionne(null)
    setRdvDuJour([])
    setRdvFutur([])
    setEtape('recherche')
    setMessageSucces('')
    setMessageErreur('')
    setRecherche('')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 pb-16 pt-24">
      {/* En-tete */}
      <div>
        <button
          type="button"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80"
          onClick={() => navigate('/reception')}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour a la reception
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Enregistrer une arrivee</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Recherchez le dossier du patient. Si un rendez-vous existe aujourd'hui, confirmez son arrivee. Sinon, creez l'enregistrement directement.
        </p>
      </div>

      {messageSucces && (
        <div className="space-y-4">
          <Alerte type="succes" titre="Arrivee enregistree">{messageSucces}</Alerte>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={recommencer}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nouveau patient
            </button>
            <button
              type="button"
              onClick={() => navigate('/reception')}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container"
            >
              Retour a la reception
            </button>
          </div>
        </div>
      )}

      {!messageSucces && (
        <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200/50 space-y-6">
          {/* Indicateur d etape */}
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${etape === 'recherche' ? 'bg-primary text-on-primary' : 'bg-tertiary-container text-on-tertiary-container'}`}>
              {etape === 'recherche' ? '1' : <span className="material-symbols-outlined text-sm">check</span>}
            </span>
            <span className={`text-sm font-semibold ${etape === 'recherche' ? 'text-on-surface' : 'text-on-surface-variant'}`}>Identification du patient</span>
            <span className="mx-1 h-px flex-1 bg-outline-variant/30" />
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${etape !== 'recherche' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>2</span>
            <span className={`text-sm font-semibold ${etape !== 'recherche' ? 'text-on-surface' : 'text-on-surface-variant'}`}>Enregistrement</span>
          </div>

          {messageErreur && (
            <Alerte type="erreur" titre="Erreur">{messageErreur}</Alerte>
          )}

          {etape === 'recherche' && (
            <EtapeRecherche
              typePatient={typePatient}
              setTypePatient={setTypePatient}
              dossiersFiltres={dossiersFiltres}
              selectionner={selectionner}
              recherche={recherche}
              setRecherche={setRecherche}
              rechercheRef={rechercheRef}
              menuOuvert={menuOuvert}
              setMenuOuvert={setMenuOuvert}
              enChargement={enChargementDossiers}
              onCreerDossier={(type) => type === 'Mere' ? navigate('/patients/nouveau') : undefined}
            />
          )}

          {etape === 'rdv-trouve' && dossierSelectionne && (
            <div className="space-y-4">
              <EtapeRdvTrouve
                dossierSelectionne={dossierSelectionne}
                rdvDuJour={rdvDuJour}
                onConfirmer={confirmerArrivee}
                onCreerQuandMeme={() => setEtape('aucun-rdv')}
                enChargement={enChargementAction}
              />
              <button type="button" onClick={recommencer} className="text-sm text-on-surface-variant hover:text-on-surface">
                ← Rechercher un autre patient
              </button>
            </div>
          )}

          {etape === 'rdv-futur' && dossierSelectionne && (
            <div className="space-y-4">
              <EtapeRdvFutur
                dossierSelectionne={dossierSelectionne}
                rdvFutur={rdvFutur}
                onRemplacer={remplacerArriveeRdvFutur}
                onIgnorer={() => setEtape('aucun-rdv')}
                enChargement={enChargementAction}
              />
              <button type="button" onClick={recommencer} className="text-sm text-on-surface-variant hover:text-on-surface">
                ← Rechercher un autre patient
              </button>
            </div>
          )}

          {etape === 'aucun-rdv' && dossierSelectionne && (
            <div className="space-y-4">
              <EtapeAucunRdv
                dossierSelectionne={dossierSelectionne}
                onSoumettre={creerArriveeDirecte}
                enChargement={enChargementAction}
              />
              <button type="button" onClick={recommencer} className="text-sm text-on-surface-variant hover:text-on-surface">
                ← Rechercher un autre patient
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PageEnregistrementArrivee
