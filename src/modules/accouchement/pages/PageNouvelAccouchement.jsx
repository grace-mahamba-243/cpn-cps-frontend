// Ce composant guide l utilisateur en deux etapes : 1) recherche d une femme, 2) saisie du formulaire d accouchement.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceAccouchement from '../../../services/api/serviceAccouchement'

const MARQUEUR_DETAILS_NOUVEAUX_NES = '=== DETAILS NOUVEAUX-NES ==='

function creerTodoNouveauNe() {
  return {
    sexeNouveauNe: '',
    poidsNaissanceG: '',
    scoreApgar1min: '',
    scoreApgar5min: '',
    anomaliesCongenitales: '',
    etatNouveauNe: '',
  }
}

function normaliserNombreNouveauxNes(valeur) {
  const nombre = parseInt(valeur, 10)
  if (Number.isNaN(nombre)) return 1
  return Math.max(1, Math.min(4, nombre))
}

function ajusterTodosNouveauxNes(liste, nombre) {
  const cible = normaliserNombreNouveauxNes(nombre)
  const base = Array.isArray(liste) ? [...liste] : []
  while (base.length < cible) {
    base.push(creerTodoNouveauNe())
  }
  return base.slice(0, cible)
}

function nettoyerNotesAvecDetails(notes) {
  if (!notes) return ''
  return notes.replace(/\n*=== DETAILS NOUVEAUX-NES ===[\s\S]*$/m, '').trim()
}

function serialiserDetailsNouveauxNes(nouveauxNes, decalage = 2) {
  return nouveauxNes
    .map((nn, index) => {
      const anomalies = nn.anomaliesCongenitales?.trim() || 'Aucune'
      return [
        `Nouveau-ne ${index + decalage}`,
        `- Sexe: ${nn.sexeNouveauNe}`,
        `- Poids(g): ${nn.poidsNaissanceG}`,
        `- APGAR 1 min: ${nn.scoreApgar1min}`,
        `- APGAR 5 min: ${nn.scoreApgar5min}`,
        `- Etat: ${nn.etatNouveauNe}`,
        `- Anomalies: ${anomalies}`,
      ].join('\n')
    })
    .join('\n\n')
}

const ETAT_INITIAL = {
  numeroDossierMere: '',
  dossierCpnId: '',
  typeAccouchement: '',
  dateAccouchement: new Date().toISOString().slice(0, 16),
  ageGestationnel: '',
  modeAccouchement: '',
  etatMere: '',
  complicationsMere: '',
  perteSanguineMl: '',
  nombreNouveauxNes: '1',
  nouveauxNes: [],
  notes: '',
}

function formaterNomPatiente(p) {
  return [p.nom].filter(Boolean).join(' ')
}

function calculerAge(dateNaissance) {
  if (!dateNaissance) return null
  return Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function initialesAvatar(nom) {
  if (!nom) return '?'
  const m = nom.trim().split(/\s+/)
  return m.length >= 2 ? (m[0][0] + m[1][0]).toUpperCase() : m[0].slice(0, 2).toUpperCase()
}

// Champ de formulaire conforme au design system
function Champ({ label, obligatoire = false, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}{obligatoire ? <span className="text-error ml-1">*</span> : null}
      </span>
      {children}
    </label>
  )
}

const CLS_INPUT =
  'w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20'

const CLS_SELECT =
  'w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20'

export default function PageNouvelAccouchement() {
  const navigate = useNavigate()
  const [etape, setEtape] = useState(1)
  const [patienteTrouvee, setPatienteTrouvee] = useState(null)
  const [rechercheTerme, setRechercheTerme] = useState('')
  const [resultatsRecherche, setResultatsRecherche] = useState([])
  const [rechercheEnCours, setRechercheEnCours] = useState(false)
  const [form, setForm] = useState(ETAT_INITIAL)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [nouveauNeCourant, setNouveauNeCourant] = useState(creerTodoNouveauNe())
  const [erreurAjout, setErreurAjout] = useState(null)
  const [dossiersCpn, setDossiersCpn] = useState([])
  const timerRecherche = useRef(null)

  function surChangementRecherche(e) {
    const v = e.target.value
    setRechercheTerme(v)
    clearTimeout(timerRecherche.current)
    if (v.trim().length < 2) { setResultatsRecherche([]); return }
    timerRecherche.current = setTimeout(() => lancerRecherche(v), 350)
  }

  async function lancerRecherche(terme) {
    setRechercheEnCours(true)
    try {
      setResultatsRecherche(await serviceAccouchement.rechercherPatientes(terme))
    } catch {
      setResultatsRecherche([])
    } finally {
      setRechercheEnCours(false)
    }
  }

  function selectionnerPatiente(p) {
    setPatienteTrouvee(p)
    setForm((prev) => ({ ...prev, numeroDossierMere: p.numeroDossier, dossierCpnId: '' }))
    setResultatsRecherche([])
    setEtape(2)
    serviceAccouchement.listerDossiersCpnPatiente(p.id)
      .then((liste) => {
        setDossiersCpn(liste)
        // Sélection automatique du dossier CPN OUVERT s'il existe
        const ouvert = liste.find((d) => d.statut === 'OUVERT')
        if (ouvert) {
          setForm((prev) => ({ ...prev, dossierCpnId: ouvert.id }))
        }
      })
      .catch(() => setDossiersCpn([]))
  }

  function surChangement(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function surChangementNouveauNeCourant(champ, valeur) {
    setNouveauNeCourant((prev) => ({ ...prev, [champ]: valeur }))
  }

  function ajouterNouveauNe() {
    setErreurAjout(null)
    if (!nouveauNeCourant.sexeNouveauNe) { setErreurAjout('Le sexe est obligatoire.'); return }
    if (!nouveauNeCourant.poidsNaissanceG) { setErreurAjout('Le poids de naissance est obligatoire.'); return }
    if (nouveauNeCourant.scoreApgar1min === '') { setErreurAjout('Le score APGAR à 1 min est obligatoire.'); return }
    if (nouveauNeCourant.scoreApgar5min === '') { setErreurAjout('Le score APGAR à 5 min est obligatoire.'); return }
    if (!nouveauNeCourant.etatNouveauNe) { setErreurAjout("L'état du nouveau-né est obligatoire."); return }
    setForm((prev) => ({ ...prev, nouveauxNes: [...prev.nouveauxNes, { ...nouveauNeCourant }] }))
    setNouveauNeCourant(creerTodoNouveauNe())
  }

  function supprimerNouveauNe(index) {
    setForm((prev) => ({ ...prev, nouveauxNes: prev.nouveauxNes.filter((_, i) => i !== index) }))
  }

  function validerForm() {
    const nombreAttendu = normaliserNombreNouveauxNes(form.nombreNouveauxNes)

    if (!form.numeroDossierMere) return 'Veuillez sélectionner une patiente.'
    if (!form.dateAccouchement) return "La date et l'heure d'accouchement sont obligatoires."
    if (!form.typeAccouchement) return "Le type d'accouchement est obligatoire."
    if (!form.modeAccouchement) return "Le mode d'accouchement est obligatoire."
    if (!form.ageGestationnel) return "L'âge gestationnel est obligatoire."
    if (!form.etatMere) return "L'état de la mère est obligatoire."
    if (form.perteSanguineMl === '') return 'La perte sanguine estimée est obligatoire.'

    if (form.nouveauxNes.length === 0) {
      return 'Veuillez ajouter au moins un nouveau-né.'
    }

    if (form.nouveauxNes.length !== nombreAttendu) {
      return `Vous avez indiqué ${nombreAttendu} nouveau(x)-né(s), mais seulement ${form.nouveauxNes.length} ont été ajouté(s). Veuillez compléter la liste.`
    }

    return null
  }

  async function soumettre(e) {
    e.preventDefault()
    setErreur(null)
    const msg = validerForm()
    if (msg) { setErreur(msg); return }
    setEnvoi(true)
    try {
      const nombreNouveauxNes = normaliserNombreNouveauxNes(form.nombreNouveauxNes)
      const nouveauxNes = ajusterTodosNouveauxNes(form.nouveauxNes, form.nombreNouveauxNes)
      const premierNouveauNe = nouveauxNes[0]
      const notesSansDetails = nettoyerNotesAvecDetails(form.notes)
      const blocDetails = serialiserDetailsNouveauxNes(nouveauxNes.slice(1))
      const notesFinales = [
        notesSansDetails,
        nouveauxNes.length > 1 ? `${MARQUEUR_DETAILS_NOUVEAUX_NES}\n${blocDetails}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      const donnees = {
        numeroDossierMere: form.numeroDossierMere,
        dossierCpnId: form.dossierCpnId || undefined,
        typeAccouchement: form.typeAccouchement,
        dateAccouchement: form.dateAccouchement,
        ageGestationnel: form.ageGestationnel ? parseInt(form.ageGestationnel) : undefined,
        modeAccouchement: form.modeAccouchement,
        etatMere: form.etatMere,
        complicationsMere: form.complicationsMere || undefined,
        perteSanguineMl: form.perteSanguineMl ? parseInt(form.perteSanguineMl) : undefined,
        nombreNouveauxNes,
        etatNouveauNe: premierNouveauNe.etatNouveauNe,
        sexeNouveauNe: premierNouveauNe.sexeNouveauNe || undefined,
        poidsNaissanceG: premierNouveauNe.poidsNaissanceG ? parseInt(premierNouveauNe.poidsNaissanceG) : undefined,
        scoreApgar1min: premierNouveauNe.scoreApgar1min !== '' ? parseInt(premierNouveauNe.scoreApgar1min) : undefined,
        scoreApgar5min: premierNouveauNe.scoreApgar5min !== '' ? parseInt(premierNouveauNe.scoreApgar5min) : undefined,
        anomaliesCongenitales: premierNouveauNe.anomaliesCongenitales || undefined,
        notes: notesFinales || undefined,
      }
      const acc = await serviceAccouchement.enregistrerAccouchement(donnees)
      navigate(`/accouchements/${acc.id}`)
    } catch (err) {
      setErreur(err.message || "Une erreur est survenue lors de l'enregistrement.")
    } finally {
      setEnvoi(false)
    }
  }

  // ─── ÉTAPE 1 : Recherche ──────────────────────────────────────────────────

  if (etape === 1) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-8 py-8">
        <div>
          <nav className="mb-3 flex items-center gap-2 text-sm text-on-surface-variant">

          </nav>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">Nouvel accouchement</h2>
              <p className="mt-0.5 text-sm text-on-surface-variant">Étape 1 / 2 — Recherchez et sélectionnez la mère.</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full border border-primary/20 px-5 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
              onClick={() => navigate('/accouchements')}
            >
              Retour à la liste
            </button>
          </div>
        </div>

        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">person_search</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Recherche de la patiente</h3>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-outline">search</span>
            <input
              type="text"
              autoFocus
              value={rechercheTerme}
              onChange={surChangementRecherche}
              placeholder="Nom, prénom, numéro de dossier, téléphone…"
              className="w-full rounded-lg border-none bg-surface-container py-3 pl-10 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            {rechercheEnCours && (
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-sm text-on-surface-variant">refresh</span>
            )}
          </div>

          {resultatsRecherche.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="border-b border-outline-variant bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {resultatsRecherche.length} résultat{resultatsRecherche.length > 1 ? 's' : ''} — cliquez pour sélectionner
              </div>
              {resultatsRecherche.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectionnerPatiente(p)}
                  className="flex w-full items-center gap-4 border-b border-outline-variant/50 px-4 py-4 text-left last:border-0 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
                    {initialesAvatar(formaterNomPatiente(p))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface">{formaterNomPatiente(p)}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      Dossier : <span className="font-mono">{p.numeroDossier}</span>
                      {p.telephone ? ` · ${p.telephone}` : ''}
                      {p.dateNaissance ? ` · ${calculerAge(p.dateNaissance)} ans` : ''}
                    </p>
                  </div>
                  <span className="material-symbols-outlined shrink-0 text-primary">arrow_forward</span>
                </button>
              ))}
            </div>
          )}

          {rechercheTerme.length >= 2 && !rechercheEnCours && resultatsRecherche.length === 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
              <span className="material-symbols-outlined mt-0.5 text-on-surface-variant">search_off</span>
              <p className="text-sm text-on-surface-variant">
                Aucune patiente trouvée. Vérifiez l'orthographe ou le numéro de dossier.
              </p>
            </div>
          )}
        </section>
      </div>
    )
  }

  // ─── ÉTAPE 2 : Formulaire ─────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
           
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">Centre de Santé Afia Himbi</h2>
          <p className="mt-1 text-on-surface-variant">Étape 2 / 2 — Saisie des données de l'accouchement.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
          onClick={() => setEtape(1)}
        >
          Changer de patiente
        </button>
      </div>

      {/* Patiente sélectionnée */}
      <div className="flex items-center gap-4 rounded-xl border border-secondary-container bg-secondary-container/50 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
          {initialesAvatar(patienteTrouvee?.nom ?? '')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface">{patienteTrouvee?.nom}</p>
          <p className="text-xs text-on-surface-variant font-mono">
            {patienteTrouvee?.numeroDossier}
            {patienteTrouvee?.dateNaissance ? ` · ${calculerAge(patienteTrouvee.dateNaissance)} ans` : ''}
          </p>
        </div>
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
      </div>

      {erreur && (
        <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
          <span className="material-symbols-outlined text-base">error</span>
          {erreur}
        </div>
      )}

      <form onSubmit={soumettre} className="space-y-6">

        {/* Informations générales */}
        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">info</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Informations générales</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ label="Type d'accouchement" obligatoire>
              <select name="typeAccouchement" value={form.typeAccouchement} onChange={surChangement} className={CLS_SELECT}>
                <option value="">— Choisir —</option>
                <option value="INTERNE">Interne (dans la structure)</option>
                <option value="EXTERNE">Externe (ailleurs)</option>
              </select>
            </Champ>

            <Champ label="Date et heure" obligatoire>
              <input type="datetime-local" name="dateAccouchement" value={form.dateAccouchement} onChange={surChangement} className={CLS_INPUT} />
            </Champ>

            <Champ label="Mode d'accouchement" obligatoire>
              <select name="modeAccouchement" value={form.modeAccouchement} onChange={surChangement} className={CLS_SELECT}>
                <option value="">— Choisir —</option>
                <option value="NATUREL">Naturel (voie basse)</option>
                <option value="CESARIENNE">Césarienne</option>
                <option value="INSTRUMENTAL">Instrumental</option>
                <option value="SIEGE">Siège</option>
                <option value="AUTRE">Autre</option>
              </select>
            </Champ>

            <Champ label="Âge gestationnel (semaines)" obligatoire>
              <input type="number" name="ageGestationnel" value={form.ageGestationnel} onChange={surChangement} min={20} max={45} placeholder="Ex : 38" className={CLS_INPUT} />
            </Champ>

            <Champ label="Dossier CPN lié (grossesse)">
              {dossiersCpn.length > 0 ? (() => {
                const dossierLie = dossiersCpn.find((d) => d.id === form.dossierCpnId)
                const dossierOuvert = dossiersCpn.find((d) => d.statut === 'OUVERT')
                // Si un seul dossier CPN ouvert existe → sélection automatique, affichage lecture seule
                if (dossierOuvert && form.dossierCpnId === dossierOuvert.id) {
                  return (
                    <div className="flex items-center gap-3 rounded-lg bg-surface-container p-3">
                      <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-on-surface">{dossierOuvert.numeroDossierCpn}</p>
                        <p className="text-xs text-on-surface-variant">
                          En cours
                          {dossierOuvert.dateProbableAccouchement ? ` · DPA ${new Date(dossierOuvert.dateProbableAccouchement).toLocaleDateString('fr-FR')}` : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Lié automatiquement</span>
                    </div>
                  )
                }
                // Sinon → liste déroulante manuelle (plusieurs dossiers ou aucun ouvert)
                return (
                  <select name="dossierCpnId" value={form.dossierCpnId} onChange={surChangement} className={CLS_SELECT}>
                    <option value="">— Aucun dossier CPN lié —</option>
                    {dossiersCpn.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.numeroDossierCpn}
                        {d.dateProbableAccouchement ? ` · DPA ${new Date(d.dateProbableAccouchement).toLocaleDateString('fr-FR')}` : ''}
                        {d.statut === 'OUVERT' ? ' · En cours' : ' · Clôturé'}
                      </option>
                    ))}
                  </select>
                )
              })() : (
                <p className="rounded-lg bg-surface-container p-3 text-sm text-on-surface-variant italic">
                  Aucun dossier CPN trouvé pour cette patiente.
                </p>
              )}
            </Champ>
          </div>
        </section>

        {/* État de la mère */}
        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">favorite</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">État de la mère</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ label="État de la mère" obligatoire>
              <select name="etatMere" value={form.etatMere} onChange={surChangement} className={CLS_SELECT}>
                <option value="">— Choisir —</option>
                <option value="STABLE">Stable</option>
                <option value="COMPLICATION">Complication</option>
                <option value="DECES">Décès</option>
              </select>
            </Champ>

            <Champ label="Perte sanguine estimée (ml)" obligatoire>
              <input type="number" name="perteSanguineMl" value={form.perteSanguineMl} onChange={surChangement} min={0} placeholder="Ex : 300" className={CLS_INPUT} />
            </Champ>

            <div className="md:col-span-2">
              <Champ label="Complications / observations">
                <textarea name="complicationsMere" value={form.complicationsMere} onChange={surChangement} rows={3} placeholder="Décrire les complications éventuelles…" className={CLS_INPUT} />
              </Champ>
            </div>
          </div>
        </section>

        {/* État du nouveau-né */}
        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">child_care</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">État du nouveau-né</h3>
          </div>
          <div className="space-y-4">

            {/* Nombre de nouveau(x)-né(s) + compteur */}
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs">
                <Champ label="Nombre de nouveau(x)-né(s)" obligatoire>
                  <input type="number" name="nombreNouveauxNes" value={form.nombreNouveauxNes} onChange={surChangement} min={1} max={4} className={CLS_INPUT} />
                </Champ>
              </div>
              <span className="mb-1 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {form.nouveauxNes.length} / {normaliserNombreNouveauxNes(form.nombreNouveauxNes)} ajouté(s)
              </span>
            </div>

            {/* Formulaire de saisie d'un nouveau-né */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <p className="mb-3 text-sm font-semibold text-on-surface">Saisir un nouveau-né</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Champ label="Sexe" obligatoire>
                  <select value={nouveauNeCourant.sexeNouveauNe} onChange={(e) => surChangementNouveauNeCourant('sexeNouveauNe', e.target.value)} className={CLS_SELECT}>
                    <option value="">— Choisir —</option>
                    <option value="MASCULIN">Masculin</option>
                    <option value="FEMININ">Féminin</option>
                    <option value="INCONNU">Inconnu</option>
                  </select>
                </Champ>

                <Champ label="Poids de naissance (grammes)" obligatoire>
                  <input type="number" value={nouveauNeCourant.poidsNaissanceG} onChange={(e) => surChangementNouveauNeCourant('poidsNaissanceG', e.target.value)} min={200} max={6000} placeholder="Ex : 3200" className={CLS_INPUT} />
                </Champ>

                <Champ label="Score APGAR à 1 min (0–10)" obligatoire>
                  <input type="number" value={nouveauNeCourant.scoreApgar1min} onChange={(e) => surChangementNouveauNeCourant('scoreApgar1min', e.target.value)} min={0} max={10} placeholder="Ex : 8" className={CLS_INPUT} />
                </Champ>

                <Champ label="Score APGAR à 5 min (0–10)" obligatoire>
                  <input type="number" value={nouveauNeCourant.scoreApgar5min} onChange={(e) => surChangementNouveauNeCourant('scoreApgar5min', e.target.value)} min={0} max={10} placeholder="Ex : 9" className={CLS_INPUT} />
                </Champ>

                <Champ label="État du nouveau-né" obligatoire>
                  <select value={nouveauNeCourant.etatNouveauNe} onChange={(e) => surChangementNouveauNeCourant('etatNouveauNe', e.target.value)} className={CLS_SELECT}>
                    <option value="">— Choisir —</option>
                    <option value="VIVANT">Vivant</option>
                    <option value="MORT_NE">Mort-né</option>
                    <option value="DECES_PRECOCE">Décès précoce</option>
                  </select>
                </Champ>

                <div className="md:col-span-2 lg:col-span-3">
                  <Champ label="Anomalies congénitales">
                    <textarea value={nouveauNeCourant.anomaliesCongenitales} onChange={(e) => surChangementNouveauNeCourant('anomaliesCongenitales', e.target.value)} rows={2} placeholder="Décrire les anomalies congénitales éventuelles…" className={CLS_INPUT} />
                  </Champ>
                </div>
              </div>

              {erreurAjout && (
                <p className="mt-3 flex items-center gap-1 text-sm text-error">
                  <span className="material-symbols-outlined text-base">error</span>
                  {erreurAjout}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={ajouterNouveauNe}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2 text-sm font-semibold text-on-secondary transition hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Ajouter ce nouveau-né
                </button>
              </div>
            </div>

            {/* Liste des nouveau-nés ajoutés */}
            {form.nouveauxNes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {form.nouveauxNes.length} nouveau(x)-né(s) enregistré(s)
                </p>
                {form.nouveauxNes.map((nn, index) => (
                  <div key={`nn-liste-${index}`} className="flex items-start justify-between rounded-lg border border-outline-variant/60 bg-surface p-3">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-base text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Nouveau-né {index + 1}
                        </p>
                        <p className="mt-0.5 text-sm text-on-surface">
                          {nn.sexeNouveauNe === 'MASCULIN' ? 'Masculin' : nn.sexeNouveauNe === 'FEMININ' ? 'Féminin' : 'Inconnu'}
                          {nn.poidsNaissanceG ? ` · ${nn.poidsNaissanceG} g` : ''}
                          {nn.scoreApgar1min !== '' ? ` · APGAR 1 min : ${nn.scoreApgar1min}` : ''}
                          {nn.scoreApgar5min !== '' ? ` · APGAR 5 min : ${nn.scoreApgar5min}` : ''}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          État : {nn.etatNouveauNe === 'VIVANT' ? 'Vivant' : nn.etatNouveauNe === 'MORT_NE' ? 'Mort-né' : 'Décès précoce'}
                          {nn.anomaliesCongenitales ? ` · Anomalies : ${nn.anomaliesCongenitales}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => supprimerNouveauNe(index)}
                      className="ml-3 shrink-0 rounded-full p-1 text-on-surface-variant hover:bg-error-container hover:text-error transition"
                      title="Supprimer ce nouveau-né"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Notes complémentaires */}
        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">notes</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Notes complémentaires</h3>
          </div>
          <textarea name="notes" value={form.notes} onChange={surChangement} rows={3} placeholder="Toute remarque clinique ou administrative…" className={CLS_INPUT} />
        </section>

        {/* Boutons */}
        <div className="flex justify-end gap-4 border-t border-surface-container-high pt-4">
          <button
            type="button"
            className="rounded-full px-8 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest"
            onClick={() => navigate('/accouchements')}
            disabled={envoi}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={envoi}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="material-symbols-outlined">save</span>
            {envoi ? 'Enregistrement en cours…' : "Enregistrer l'accouchement"}
          </button>
        </div>
      </form>
    </div>
  )
}
