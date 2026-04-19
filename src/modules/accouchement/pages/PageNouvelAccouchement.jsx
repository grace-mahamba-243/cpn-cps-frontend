// Ce composant guide l utilisateur en deux etapes : 1) recherche d une femme, 2) saisie du formulaire d accouchement.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceAccouchement from '../../../services/api/serviceAccouchement'

const ETAT_INITIAL = {
  patienteId: '',
  dossierCpnId: '',
  typeAccouchement: 'INTERNE',
  dateAccouchement: new Date().toISOString().slice(0, 16),
  ageGestationnel: '',
  modeAccouchement: 'NATUREL',
  etatMere: 'STABLE',
  complicationsMere: '',
  perteSanguineMl: '',
  nombreNouveauxNes: '1',
  etatNouveauNe: 'VIVANT',
  sexeNouveauNe: '',
  poidsNaissanceG: '',
  scoreApgar1min: '',
  scoreApgar5min: '',
  anomaliesCongenitales: '',
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
    setForm((prev) => ({ ...prev, patienteId: p.id, dossierCpnId: '' }))
    setResultatsRecherche([])
    setEtape(2)
    serviceAccouchement.listerDossiersCpnPatiente(p.id)
      .then((liste) => setDossiersCpn(liste))
      .catch(() => setDossiersCpn([]))
  }

  function surChangement(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validerForm() {
    if (!form.patienteId) return 'Veuillez sélectionner une patiente.'
    if (!form.dateAccouchement) return "La date et l'heure d'accouchement sont obligatoires."
    if (!form.typeAccouchement) return "Le type d'accouchement est obligatoire."
    if (!form.modeAccouchement) return "Le mode d'accouchement est obligatoire."
    if (!form.etatMere) return "L'état de la mère est obligatoire."
    if (!form.etatNouveauNe) return "L'état du nouveau-né est obligatoire."
    return null
  }

  async function soumettre(e) {
    e.preventDefault()
    setErreur(null)
    const msg = validerForm()
    if (msg) { setErreur(msg); return }
    setEnvoi(true)
    try {
      const donnees = {
        patienteId: form.patienteId,
        dossierCpnId: form.dossierCpnId || undefined,
        typeAccouchement: form.typeAccouchement,
        dateAccouchement: form.dateAccouchement,
        ageGestationnel: form.ageGestationnel ? parseInt(form.ageGestationnel) : undefined,
        modeAccouchement: form.modeAccouchement,
        etatMere: form.etatMere,
        complicationsMere: form.complicationsMere || undefined,
        perteSanguineMl: form.perteSanguineMl ? parseInt(form.perteSanguineMl) : undefined,
        nombreNouveauxNes: form.nombreNouveauxNes ? parseInt(form.nombreNouveauxNes) : 1,
        etatNouveauNe: form.etatNouveauNe,
        sexeNouveauNe: form.sexeNouveauNe || undefined,
        poidsNaissanceG: form.poidsNaissanceG ? parseInt(form.poidsNaissanceG) : undefined,
        scoreApgar1min: form.scoreApgar1min !== '' ? parseInt(form.scoreApgar1min) : undefined,
        scoreApgar5min: form.scoreApgar5min !== '' ? parseInt(form.scoreApgar5min) : undefined,
        anomaliesCongenitales: form.anomaliesCongenitales || undefined,
        notes: form.notes || undefined,
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
            <span>Accouchements</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-medium text-primary">Nouvel enregistrement</span>
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
            <span>Accouchements</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-medium text-primary">Nouvel enregistrement</span>
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
                <option value="INTERNE">Interne (dans la structure)</option>
                <option value="EXTERNE">Externe (ailleurs)</option>
              </select>
            </Champ>

            <Champ label="Date et heure" obligatoire>
              <input type="datetime-local" name="dateAccouchement" value={form.dateAccouchement} onChange={surChangement} className={CLS_INPUT} />
            </Champ>

            <Champ label="Mode d'accouchement" obligatoire>
              <select name="modeAccouchement" value={form.modeAccouchement} onChange={surChangement} className={CLS_SELECT}>
                <option value="NATUREL">Naturel (voie basse)</option>
                <option value="CESARIENNE">Césarienne</option>
                <option value="INSTRUMENTAL">Instrumental</option>
                <option value="SIEGE">Siège</option>
                <option value="AUTRE">Autre</option>
              </select>
            </Champ>

            <Champ label="Âge gestationnel (semaines)">
              <input type="number" name="ageGestationnel" value={form.ageGestationnel} onChange={surChangement} min={20} max={45} placeholder="Ex : 38" className={CLS_INPUT} />
            </Champ>

            <Champ label="Dossier CPN lié (grossesse)">
              {dossiersCpn.length > 0 ? (
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
              ) : (
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
                <option value="STABLE">Stable</option>
                <option value="COMPLICATION">Complication</option>
                <option value="DECES">Décès</option>
              </select>
            </Champ>

            <Champ label="Perte sanguine estimée (ml)">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Champ label="État du nouveau-né" obligatoire>
              <select name="etatNouveauNe" value={form.etatNouveauNe} onChange={surChangement} className={CLS_SELECT}>
                <option value="VIVANT">Vivant</option>
                <option value="MORT_NE">Mort-né</option>
                <option value="DECES_PRECOCE">Décès précoce</option>
              </select>
            </Champ>

            <Champ label="Nombre de nouveau(x)-né(s)">
              <input type="number" name="nombreNouveauxNes" value={form.nombreNouveauxNes} onChange={surChangement} min={1} max={4} className={CLS_INPUT} />
            </Champ>

            <Champ label="Sexe">
              <select name="sexeNouveauNe" value={form.sexeNouveauNe} onChange={surChangement} className={CLS_SELECT}>
                <option value="">— Non précisé —</option>
                <option value="MASCULIN">Masculin</option>
                <option value="FEMININ">Féminin</option>
                <option value="INCONNU">Inconnu</option>
              </select>
            </Champ>

            <Champ label="Poids de naissance (grammes)">
              <input type="number" name="poidsNaissanceG" value={form.poidsNaissanceG} onChange={surChangement} min={200} max={6000} placeholder="Ex : 3200" className={CLS_INPUT} />
            </Champ>

            <Champ label="Score APGAR à 1 min (0–10)">
              <input type="number" name="scoreApgar1min" value={form.scoreApgar1min} onChange={surChangement} min={0} max={10} placeholder="Ex : 8" className={CLS_INPUT} />
            </Champ>

            <Champ label="Score APGAR à 5 min (0–10)">
              <input type="number" name="scoreApgar5min" value={form.scoreApgar5min} onChange={surChangement} min={0} max={10} placeholder="Ex : 9" className={CLS_INPUT} />
            </Champ>

            <div className="md:col-span-2 lg:col-span-3">
              <Champ label="Anomalies congénitales">
                <textarea name="anomaliesCongenitales" value={form.anomaliesCongenitales} onChange={surChangement} rows={2} placeholder="Décrire les anomalies congénitales éventuelles…" className={CLS_INPUT} />
              </Champ>
            </div>
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
