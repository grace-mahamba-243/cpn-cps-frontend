// Page dédiée à la liste complète des examens d'un dossier enfant avec actions selon le type.
// Les échographies restent en attente jusqu'à ce que l'enfant revienne avec ses images.
// Seuls les examens biologiques sont transmis au laboratoire automatiquement.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

function formaterDateCourte(d) {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
  } catch {
    return d
  }
}

// ── Badge statut ──────────────────────────────────────────────────────────
function BadgeStatut({ statut, typeExamen }) {
  if (statut === 'RESULTAT_RECU' || statut === 'RESULTAT_ENVOYE') {
    return (
      <span className="rounded-full bg-tertiary-container px-2.5 py-0.5 text-[11px] font-semibold text-on-tertiary-container">
        {typeExamen === 'ECHOGRAPHIE' ? 'Interprété' : 'Résultat reçu'}
      </span>
    )
  }
  if (statut === 'EN_COURS') {
    return (
      <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[11px] font-semibold text-on-secondary-container">
        En cours au labo
      </span>
    )
  }
  return (
    <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
      En attente
    </span>
  )
}

// ── Icône selon type ──────────────────────────────────────────────────────
function iconeExamen(typeExamen, statut) {
  const recu = statut === 'RESULTAT_RECU' || statut === 'RESULTAT_ENVOYE'
  if (recu) return 'task_alt'
  if (typeExamen === 'ECHOGRAPHIE') return 'ecg'
  if (typeExamen === 'BIOLOGIQUE') return 'biotech'
  return 'hourglass_top'
}

// ── Panneau interprétation échographie ────────────────────────────────────
function PanneauInterpretation({ examen, enfantId, onTermine, onAnnuler }) {
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const soumettre = async () => {
    if (!texte.trim()) { setErreur("L'interprétation est obligatoire."); return }
    setEnvoi(true)
    setErreur('')
    try {
      // PATCH sur l'examen directement via le service enfants
      await fetch(`${(import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')}/enfants/${enfantId}/examens/${examen.id}`, {
        method: 'PATCH',
        headers: (() => {
          try {
            const session = JSON.parse(sessionStorage.getItem('session') ?? '{}')
            const token = session?.token ?? null
            const h = { 'Content-Type': 'application/json' }
            if (token) h['Authorization'] = `Bearer ${token}`
            return h
          } catch { return { 'Content-Type': 'application/json' } }
        })(),
        body: JSON.stringify({ resultat: texte.trim(), statut: 'RESULTAT_RECU' }),
      })
      onTermine()
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-outline-variant/50 bg-secondary-container/10 p-4 space-y-3">
      <p className="text-[12px] font-bold text-on-surface">
        Interprétation — {examen.libelle}
      </p>
      <textarea
        rows={5}
        autoFocus
        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        placeholder="Saisissez l'interprétation de l'échographie (images apportées par le parent)…"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
      />
      {erreur && <p className="text-xs text-error">{erreur}</p>}
      <div className="flex gap-2">
        <button
          onClick={soumettre}
          disabled={envoi}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">save</span>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={onAnnuler}
          className="rounded-full bg-surface-container px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Carte examen ──────────────────────────────────────────────────────────
function CarteExamen({ examen, enfantId, onRecharger }) {
  const [panneauOuvert, setPanneauOuvert] = useState(false)

  const estEcho = examen.typeExamen === 'ECHOGRAPHIE'
  const estBio = examen.typeExamen === 'BIOLOGIQUE'
  const enAttente = examen.statut === 'DEMANDE' || examen.statut === 'EN_COURS'
  const recu = examen.statut === 'RESULTAT_RECU' || examen.statut === 'RESULTAT_ENVOYE'

  const couleurBordure = estEcho ? 'border-outline-variant/50' : recu ? 'border-outline-variant/50' : 'border-outline-variant/40'
  const couleurFond = estEcho ? 'bg-secondary-container/10' : recu ? 'bg-tertiary-container/5' : 'bg-surface'

  return (
    <div className={`rounded-2xl border ${couleurBordure} ${couleurFond} px-5 py-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${recu ? 'bg-tertiary-container/40 text-tertiary' : estEcho ? 'bg-secondary-container/50 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-xl">{iconeExamen(examen.typeExamen, examen.statut)}</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-on-surface">{examen.libelle}</p>
              {estEcho && (
                <span className="rounded-full bg-secondary-container/60 px-2 py-0.5 text-[10px] font-bold text-secondary">Échographie</span>
              )}
              {estBio && (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">Biologique</span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant">
              {examen.source}
              {examen.dateExamen ? ` · ${formaterDateCourte(examen.dateExamen)}` : ''}
              {examen.creeLe ? ` · Demandé le ${formaterDateCourte(examen.creeLe)}` : ''}
            </p>
            {estEcho && enAttente && (
              <p className="text-[11px] text-secondary/80 italic">En attente des images apportées par le parent</p>
            )}
            {estBio && examen.statut === 'EN_COURS' && (
              <p className="text-[11px] text-on-surface-variant italic">Pris en charge au laboratoire</p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <BadgeStatut statut={examen.statut} typeExamen={examen.typeExamen} />
          {estEcho && enAttente && (
            <button
              onClick={() => setPanneauOuvert((v) => !v)}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              {panneauOuvert ? 'Fermer' : 'Interpréter'}
            </button>
          )}
        </div>
      </div>

      {/* Résultat / interprétation */}
      {recu && examen.resultat && (
        <div className="mt-5 ml-14">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {estEcho ? 'Interprétation' : 'Résultat'}
          </span>
          <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{examen.resultat}</div>
          {examen.dateResultat && (
            <p className="mt-2 text-[11px] text-on-surface-variant">Reçu le {formaterDateCourte(examen.dateResultat)}</p>
          )}
        </div>
      )}

      {/* Notes */}
      {examen.notes && (
        <div className="mt-2 ml-14 text-xs italic text-on-surface-variant">Note : {examen.notes}</div>
      )}

      {/* Panneau interprétation */}
      {panneauOuvert && (
        <div className="ml-14">
          <PanneauInterpretation
            examen={examen}
            enfantId={enfantId}
            onTermine={() => { setPanneauOuvert(false); onRecharger() }}
            onAnnuler={() => setPanneauOuvert(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Formulaire demande examen ─────────────────────────────────────────────
function FormulaireDemandeExamen({ enfantId, onTermine, onAnnuler }) {
  const [form, setForm] = useState({ typeExamen: 'BIOLOGIQUE', libelle: '', source: 'INTERNE', notes: '' })
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const changer = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const soumettre = async (e) => {
    e.preventDefault()
    if (!form.libelle.trim()) { setErreur('Le libellé est obligatoire.'); return }
    setEnvoi(true)
    setErreur('')
    try {
      await serviceDossiersEnfants.demanderExamen(enfantId, {
        typeExamen: form.typeExamen,
        libelle: form.libelle.trim(),
        source: form.source,
        notes: form.notes.trim() || null,
      })
      onTermine()
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
      <p className="font-bold text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">add_circle</span>
        Demander un examen
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Type d'examen</label>
          <select
            name="typeExamen"
            value={form.typeExamen}
            onChange={changer}
            className="rounded-xl border border-outline/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="BIOLOGIQUE">Biologique (→ Laboratoire)</option>
            <option value="ECHOGRAPHIE">Échographie</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Source</label>
          <select
            name="source"
            value={form.source}
            onChange={changer}
            className="rounded-xl border border-outline/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="INTERNE">Interne</option>
            <option value="EXTERNE">Externe</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Libellé</label>
          <input
            type="text"
            name="libelle"
            value={form.libelle}
            onChange={changer}
            placeholder="Ex : Numération formule sanguine, Échographie abdominale…"
            className="rounded-xl border border-outline/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Notes (optionnel)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={changer}
            rows={2}
            placeholder="Instructions particulières…"
            className="rounded-xl border border-outline/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      {form.typeExamen === 'BIOLOGIQUE' && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
          Cet examen biologique sera automatiquement visible au laboratoire.
        </div>
      )}

      {erreur && <p className="text-xs text-error">{erreur}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={envoi}
          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          {envoi ? 'Envoi…' : 'Demander'}
        </button>
        <button
          type="button"
          onClick={onAnnuler}
          className="rounded-full bg-surface-container px-5 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── Page principale ───────────────────────────────────────────────────────
function PageExamensEnfant() {
  const { enfantId } = useParams()
  const navigate = useNavigate()
  const [enfant, setEnfant] = useState(null)
  const [examens, setExamens] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState('TOUS')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  const charger = async () => {
    setChargement(true)
    setErreur('')
    try {
      const [inf, liste] = await Promise.all([
        serviceDossiersEnfants.recupererParId(enfantId),
        serviceDossiersEnfants.listerExamens(enfantId),
      ])
      setEnfant(inf)
      setExamens(liste)
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [enfantId])

  const examensFiltres = examens.filter((ex) => {
    if (filtre === 'BIOLOGIQUE') return ex.typeExamen === 'BIOLOGIQUE'
    if (filtre === 'ECHOGRAPHIE') return ex.typeExamen === 'ECHOGRAPHIE'
    if (filtre === 'EN_ATTENTE') return ex.statut === 'DEMANDE' || ex.statut === 'EN_COURS'
    if (filtre === 'RECU') return ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE'
    return true
  })

  const nbEchoEnAttente = examens.filter((e) => e.typeExamen === 'ECHOGRAPHIE' && (e.statut === 'DEMANDE' || e.statut === 'EN_COURS')).length
  const nbBioEnAttente = examens.filter((e) => e.typeExamen === 'BIOLOGIQUE' && (e.statut === 'DEMANDE' || e.statut === 'EN_COURS')).length
  const nbRecus = examens.filter((e) => e.statut === 'RESULTAT_RECU' || e.statut === 'RESULTAT_ENVOYE').length

  const FILTRES = [
    { code: 'TOUS', label: 'Tous', count: examens.length },
    { code: 'BIOLOGIQUE', label: 'Biologiques', count: examens.filter((e) => e.typeExamen === 'BIOLOGIQUE').length },
    { code: 'ECHOGRAPHIE', label: 'Échographies', count: examens.filter((e) => e.typeExamen === 'ECHOGRAPHIE').length },
    { code: 'EN_ATTENTE', label: 'En attente', count: examens.filter((e) => e.statut === 'DEMANDE' || e.statut === 'EN_COURS').length },
    { code: 'RECU', label: 'Résultats reçus', count: nbRecus },
  ]

  if (chargement) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined animate-spin">hourglass_top</span>
          <p>Chargement des examens…</p>
        </div>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-error-container px-6 py-4 text-on-error-container text-sm">
          <span className="material-symbols-outlined">error</span>
          {erreur}
        </div>
        <button onClick={charger} className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-base">refresh</span>
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">

      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour au dossier
      </button>

      {/* Bouton demander + formulaire */}
      {!formulaireOuvert ? (
        <button
          onClick={() => setFormulaireOuvert(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Demander un examen
        </button>
      ) : (
        <FormulaireDemandeExamen
          enfantId={enfantId}
          onTermine={() => { setFormulaireOuvert(false); charger() }}
          onAnnuler={() => setFormulaireOuvert(false)}
        />
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.code}
            onClick={() => setFiltre(f.code)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${filtre === f.code ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filtre === f.code ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {examensFiltres.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container-lowest py-16 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-4xl">biotech</span>
          <p className="text-sm">Aucun examen pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {examensFiltres.map((ex) => (
            <CarteExamen
              key={ex.id}
              examen={ex}
              enfantId={enfantId}
              onRecharger={charger}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PageExamensEnfant
