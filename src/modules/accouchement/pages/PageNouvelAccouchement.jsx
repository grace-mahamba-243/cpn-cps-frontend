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

// Champ de formulaire standard
function Champ({ label, children, obligatoire }) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface-variant mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

const CLS_INPUT =
  'w-full px-3 py-2 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary text-sm'

const CLS_SELECT =
  'w-full px-3 py-2 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm'

export default function PageNouvelAccouchement() {
  const navigate = useNavigate()
  const [etape, setEtape] = useState(1) // 1 = recherche patiente, 2 = formulaire
  const [patienteTrouvee, setPatienteTrouvee] = useState(null)
  const [rechercheTerme, setRechercheTerme] = useState('')
  const [resultatsRecherche, setResultatsRecherche] = useState([])
  const [rechercheEnCours, setRechercheEnCours] = useState(false)
  const [form, setForm] = useState(ETAT_INITIAL)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const timerRecherche = useRef(null)

  // --- Recherche patiente ---

  function surChangementRecherche(e) {
    const v = e.target.value
    setRechercheTerme(v)
    clearTimeout(timerRecherche.current)
    if (v.trim().length < 2) {
      setResultatsRecherche([])
      return
    }
    timerRecherche.current = setTimeout(() => lancerRecherche(v), 350)
  }

  async function lancerRecherche(terme) {
    setRechercheEnCours(true)
    try {
      const liste = await serviceAccouchement.rechercherPatientes(terme)
      setResultatsRecherche(liste)
    } catch {
      setResultatsRecherche([])
    } finally {
      setRechercheEnCours(false)
    }
  }

  function selectionnerPatiente(p) {
    setPatienteTrouvee(p)
    setForm((prev) => ({ ...prev, patienteId: p.id }))
    setResultatsRecherche([])
    setEtape(2)
  }

  // --- Formulaire ---

  function surChangement(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validerForm() {
    if (!form.patienteId) return 'Veuillez sélectionner une patiente.'
    if (!form.dateAccouchement) return 'La date et l\'heure d\'accouchement sont obligatoires.'
    if (!form.typeAccouchement) return 'Le type d\'accouchement est obligatoire.'
    if (!form.modeAccouchement) return 'Le mode d\'accouchement est obligatoire.'
    if (!form.etatMere) return 'L\'état de la mère est obligatoire.'
    if (!form.etatNouveauNe) return 'L\'état du nouveau-né est obligatoire.'
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
    } catch (e) {
      setErreur(e.message || 'Une erreur est survenue lors de l\'enregistrement.')
    } finally {
      setEnvoi(false)
    }
  }

  // --- ETAPE 1 : Recherche ---
  if (etape === 1) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/accouchements')}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-4 transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour à la liste
        </button>

        <h1 className="text-2xl font-semibold text-on-surface mb-1">
          Enregistrer un accouchement
        </h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Étape 1 / 2 — Recherchez et sélectionnez la mère
        </p>

        <div className="bg-surface-container rounded-2xl p-5">
          <label className="block text-sm font-medium text-on-surface-variant mb-2">
            Recherche par nom, numéro de dossier ou téléphone
          </label>
          <input
            type="text"
            autoFocus
            value={rechercheTerme}
            onChange={surChangementRecherche}
            placeholder="Ex : Mukeba, DOS-2024-0012…"
            className={CLS_INPUT}
          />

          {rechercheEnCours && (
            <p className="text-sm text-on-surface-variant mt-3">Recherche en cours…</p>
          )}

          {resultatsRecherche.length > 0 && (
            <ul className="mt-3 space-y-2">
              {resultatsRecherche.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => selectionnerPatiente(p)}
                    className="w-full text-left px-4 py-3 bg-surface rounded-xl hover:bg-surface-container-high transition"
                  >
                    <span className="font-medium text-on-surface">{formaterNomPatiente(p)}</span>
                    <span className="ml-2 text-xs text-on-surface-variant font-mono">{p.numeroDossier}</span>
                    {p.dateNaissance && (
                      <span className="ml-2 text-xs text-on-surface-variant">
                        · {calculerAge(p.dateNaissance)} ans
                      </span>
                    )}
                    {p.telephone && (
                      <span className="ml-2 text-xs text-on-surface-variant">· {p.telephone}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {rechercheTerme.length >= 2 && !rechercheEnCours && resultatsRecherche.length === 0 && (
            <p className="text-sm text-on-surface-variant mt-3">Aucune patiente trouvée.</p>
          )}
        </div>
      </div>
    )
  }

  // --- ETAPE 2 : Formulaire ---
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => setEtape(1)}
        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-4 transition"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Changer de patiente
      </button>

      <h1 className="text-2xl font-semibold text-on-surface mb-1">
        Enregistrer un accouchement
      </h1>
      <p className="text-sm text-on-surface-variant mb-4">
        Étape 2 / 2 — Saisie de l'accouchement
      </p>

      {/* Fiche patiente sélectionnée */}
      <div className="bg-secondary-container text-on-secondary-container rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined">person</span>
        <div>
          <div className="font-semibold">{patienteTrouvee?.nom}</div>
          <div className="text-xs opacity-80">
            {patienteTrouvee?.numeroDossier}
            {patienteTrouvee?.dateNaissance && ` · ${calculerAge(patienteTrouvee.dateNaissance)} ans`}
          </div>
        </div>
      </div>

      {erreur && (
        <div className="bg-error-container text-on-error-container rounded-xl p-3 mb-4 text-sm">
          {erreur}
        </div>
      )}

      <form onSubmit={soumettre} className="space-y-6">

        {/* --- Informations générales --- */}
        <section>
          <h2 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            Informations générales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <Champ label="Identifiant dossier CPN lié">
              <input type="text" name="dossierCpnId" value={form.dossierCpnId} onChange={surChangement} placeholder="UUID du dossier CPN (optionnel)" className={CLS_INPUT} />
            </Champ>
          </div>
        </section>

        {/* --- État de la mère --- */}
        <section>
          <h2 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">favorite</span>
            État de la mère
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="sm:col-span-2">
              <Champ label="Complications / observations">
                <textarea name="complicationsMere" value={form.complicationsMere} onChange={surChangement} rows={3} placeholder="Décrire les complications éventuelles…" className={CLS_INPUT} />
              </Champ>
            </div>
          </div>
        </section>

        {/* --- État du nouveau-né --- */}
        <section>
          <h2 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">child_care</span>
            État du nouveau-né
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="sm:col-span-2">
              <Champ label="Anomalies congénitales">
                <textarea name="anomaliesCongenitales" value={form.anomaliesCongenitales} onChange={surChangement} rows={2} placeholder="Décrire les anomalies congénitales éventuelles…" className={CLS_INPUT} />
              </Champ>
            </div>
          </div>
        </section>

        {/* --- Notes --- */}
        <section>
          <h2 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">notes</span>
            Notes complémentaires
          </h2>
          <textarea name="notes" value={form.notes} onChange={surChangement} rows={3} placeholder="Toute remarque clinique ou administrative…" className={CLS_INPUT} />
        </section>

        {/* --- Continuité du parcours --- */}
        <div className="bg-primary-container text-on-primary-container rounded-2xl p-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5">info</span>
            <div>
              <span className="font-semibold">Prochaines étapes :</span> après l'enregistrement,
              vous pourrez ouvrir la <strong>CPS femme</strong> et créer le <strong>dossier de l'enfant</strong>
              depuis la fiche de l'accouchement.
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate('/accouchements')}
            className="px-5 py-2 rounded-xl border border-outline text-on-surface hover:bg-surface-container transition text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={envoi}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary font-medium hover:opacity-90 transition text-sm disabled:opacity-60"
          >
            {envoi ? 'Enregistrement…' : 'Enregistrer l\'accouchement'}
          </button>
        </div>
      </form>
    </div>
  )
}
