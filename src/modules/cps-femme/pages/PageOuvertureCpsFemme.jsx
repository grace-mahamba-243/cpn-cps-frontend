// Ce composant permet d'ouvrir un dossier CPS Femme : recherche de la mere puis saisie de l'accouchement et du dossier postnatal.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'

const aujourd_hui = new Date().toISOString().split('T')[0]

function PageOuvertureCpsFemme() {
  const navigate = useNavigate()
  const [etape, setEtape] = useState(1) // 1 = recherche mere | 2 = formulaire
  const [termeRecherche, setTermeRecherche] = useState('')
  const [resultats, setResultats] = useState([])
  const [chargementRecherche, setChargementRecherche] = useState(false)
  const [patienteSelectionnee, setPatienteSelectionnee] = useState(null)
  const timerRef = useRef(null)

  const [formulaire, setFormulaire] = useState({
    typeAccouchementEntree: 'INTERNE',
    dateOuverture: aujourd_hui,
    dateAccouchement: aujourd_hui,
    modeAccouchement: 'NATUREL',
    etatMereEntree: 'STABLE',
    complicationsAccouchement: '',
    nombreNouveauxNes: 1,
    etatNouveauNe: 'VIVANT',
    sexeNouveauNe: '',
    poidsNaissanceG: '',
    scoreApgar1min: '',
    scoreApgar5min: '',
    gestite: '',
    parite: '',
    groupeSanguin: '',
    rhesus: '',
    vihStatut: 'INCONNU',
    notes: '',
  })

  const [envoi, setEnvoi] = useState({ chargement: false, erreur: null })

  const gererRecherche = (valeur) => {
    setTermeRecherche(valeur)
    if (valeur.trim().length < 2) { setResultats([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setChargementRecherche(true)
      try {
        const liste = await serviceCpsFemme.rechercherPatientes(valeur)
        setResultats(liste)
      } catch {
        setResultats([])
      } finally {
        setChargementRecherche(false)
      }
    }, 350)
  }

  const selectionnerPatiente = async (p) => {
    setChargement(true)
    try {
      // Vérifier si un dossier CPS ouvert existe déjà pour cette patiente
      const existant = await serviceCpsFemme.dossierParPatienteId(p.id)
      if (existant && existant.statut === 'OUVERT') {
        navigate(`/cps-femme/${existant.id}`, { replace: true })
        return
      }
    } catch {
      // Si l'appel échoue, on continue l'ouverture normalement
    } finally {
      setChargement(false)
    }
    setPatienteSelectionnee(p)
    setTermeRecherche('')
    setResultats([])
    setEtape(2)
  }

  const maj = (champ, val) => setFormulaire((f) => ({ ...f, [champ]: val }))

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoi({ chargement: true, erreur: null })
    try {
      const donnees = {
        patienteId: patienteSelectionnee.id,
        typeAccouchementEntree: formulaire.typeAccouchementEntree,
        dateOuverture: formulaire.dateOuverture,
        dateAccouchement: formulaire.dateAccouchement,
        modeAccouchement: formulaire.modeAccouchement,
        etatMereEntree: formulaire.etatMereEntree,
        complicationsAccouchement: formulaire.complicationsAccouchement || null,
        nombreNouveauxNes: Number(formulaire.nombreNouveauxNes) || 1,
        etatNouveauNe: formulaire.etatNouveauNe,
        sexeNouveauNe: formulaire.sexeNouveauNe || null,
        poidsNaissanceG: formulaire.poidsNaissanceG ? Number(formulaire.poidsNaissanceG) : null,
        scoreApgar1min: formulaire.scoreApgar1min ? Number(formulaire.scoreApgar1min) : null,
        scoreApgar5min: formulaire.scoreApgar5min ? Number(formulaire.scoreApgar5min) : null,
        gestite: formulaire.gestite ? Number(formulaire.gestite) : 0,
        parite: formulaire.parite ? Number(formulaire.parite) : 0,
        groupeSanguin: formulaire.groupeSanguin || null,
        rhesus: formulaire.rhesus || null,
        vihStatut: formulaire.vihStatut || 'INCONNU',
        notes: formulaire.notes || null,
      }
      const dossier = await serviceCpsFemme.ouvrirDossier(donnees)
      navigate(`/cps-femme/${dossier.id}`)
    } catch (e) {
      setEnvoi({ chargement: false, erreur: e.message })
    }
  }

  // ── Étape 1 : Recherche de la mère ──
  if (etape === 1) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/cps-femme')}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface w-fit"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour
        </button>

        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Nouveau dossier CPS Femme
          </h2>
          <p className="text-on-surface-variant">Recherchez la mère pour commencer l'enregistrement postnatal.</p>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              autoFocus
              placeholder="Nom, numéro de dossier, téléphone…"
              value={termeRecherche}
              onChange={(e) => gererRecherche(e.target.value)}
              className="w-full rounded-full border-none bg-surface-container py-3 pl-12 pr-5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {chargementRecherche && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant px-1">
              <span className="material-symbols-outlined animate-spin text-base">refresh</span>
              Recherche…
            </div>
          )}

          {resultats.length > 0 && (
            <ul className="divide-y divide-surface-container rounded-xl overflow-hidden border border-outline-variant/20">
              {resultats.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => selectionnerPatiente(p)}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-surface-container-low text-left transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {(p.nom ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-on-surface">{p.nom}</p>
                      <p className="text-xs text-on-surface-variant font-mono">{p.numeroDossier}</p>
                    </div>
                    <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_right</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {termeRecherche.length >= 2 && !chargementRecherche && resultats.length === 0 && (
            <p className="text-sm text-on-surface-variant px-1">Aucune mère trouvée pour « {termeRecherche} ».</p>
          )}
        </div>
      </div>
    )
  }

  // ── Étape 2 : Formulaire d'ouverture ──
  return (
    <form onSubmit={soumettre} className="flex flex-col gap-6 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => { setEtape(1); setPatienteSelectionnee(null) }}
        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface w-fit"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Changer de patiente
      </button>

      {/* En-tête patiente */}
      <div className="flex items-center gap-4 rounded-2xl bg-primary/5 px-5 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {(patienteSelectionnee?.nom ?? '?').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-on-surface">{patienteSelectionnee?.nom}</p>
          <p className="text-xs font-mono text-primary">{patienteSelectionnee?.numeroDossier}</p>
        </div>
      </div>

      {/* ── Section accouchement ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Accouchement</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Type</label>
            <select value={formulaire.typeAccouchementEntree} onChange={(e) => maj('typeAccouchementEntree', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="INTERNE">Interne (dans la structure)</option>
              <option value="EXTERNE">Externe (accouchement ailleurs)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Mode</label>
            <select value={formulaire.modeAccouchement} onChange={(e) => maj('modeAccouchement', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="NATUREL">Naturel</option>
              <option value="CESARIENNE">Césarienne</option>
              <option value="INSTRUMENTAL">Instrumental</option>
              <option value="SIEGE">Siège</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Date de l'accouchement *</label>
            <input type="date" required value={formulaire.dateAccouchement} onChange={(e) => maj('dateAccouchement', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Date d'ouverture CPS *</label>
            <input type="date" required value={formulaire.dateOuverture} onChange={(e) => maj('dateOuverture', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">État de la mère à l'entrée</label>
            <select value={formulaire.etatMereEntree} onChange={(e) => maj('etatMereEntree', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="STABLE">Stable</option>
              <option value="COMPLICATION">Complication</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">Complications de l'accouchement</label>
          <textarea rows={2} value={formulaire.complicationsAccouchement} onChange={(e) => maj('complicationsAccouchement', e.target.value)}
            placeholder="Décrire si applicable…"
            className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none resize-none placeholder:text-on-surface-variant" />
        </div>
      </div>

      {/* ── Section nouveau-né ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Nouveau-né</h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">État du nouveau-né *</label>
            <select required value={formulaire.etatNouveauNe} onChange={(e) => maj('etatNouveauNe', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="VIVANT">Vivant</option>
              <option value="MORT_NE">Mort-né</option>
              <option value="DECES_PRECOCE">Décès précoce</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Sexe</label>
            <select value={formulaire.sexeNouveauNe} onChange={(e) => maj('sexeNouveauNe', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="">—</option>
              <option value="MASCULIN">Masculin</option>
              <option value="FEMININ">Féminin</option>
              <option value="INDETERMINE">Indéterminé</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Poids naissance (g)</label>
            <input type="number" min="0" value={formulaire.poidsNaissanceG} onChange={(e) => maj('poidsNaissanceG', e.target.value)}
              placeholder="ex: 3200"
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Score Apgar 1'</label>
            <input type="number" min="0" max="10" value={formulaire.scoreApgar1min} onChange={(e) => maj('scoreApgar1min', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Score Apgar 5'</label>
            <input type="number" min="0" max="10" value={formulaire.scoreApgar5min} onChange={(e) => maj('scoreApgar5min', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Nombre de nouveau(x)-né(s)</label>
            <input type="number" min="1" value={formulaire.nombreNouveauxNes} onChange={(e) => maj('nombreNouveauxNes', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none" />
          </div>
        </div>
      </div>

      {/* ── Section données maternelles ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Données maternelles</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Gestité</label>
            <input type="number" min="0" value={formulaire.gestite} onChange={(e) => maj('gestite', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Parité</label>
            <input type="number" min="0" value={formulaire.parite} onChange={(e) => maj('parite', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Groupe sanguin</label>
            <select value={formulaire.groupeSanguin} onChange={(e) => maj('groupeSanguin', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="">—</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Rhésus</label>
            <select value={formulaire.rhesus} onChange={(e) => maj('rhesus', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="">—</option>
              <option value="+">Positif (+)</option>
              <option value="-">Négatif (−)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Statut VIH</label>
            <select value={formulaire.vihStatut} onChange={(e) => maj('vihStatut', e.target.value)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
              <option value="INCONNU">Inconnu</option>
              <option value="NEGATIF">Négatif</option>
              <option value="POSITIF">Positif</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">Notes</label>
          <textarea rows={2} value={formulaire.notes} onChange={(e) => maj('notes', e.target.value)}
            placeholder="Observations générales…"
            className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none resize-none placeholder:text-on-surface-variant" />
        </div>
      </div>

      {/* ── Erreur + Bouton ── */}
      {envoi.erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          {envoi.erreur}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => navigate('/cps-femme')}
          className="rounded-full border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
          Annuler
        </button>
        <button type="button" onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-base">print</span>
          Imprimer
        </button>
        <button type="submit" disabled={envoi.chargement}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60">
          {envoi.chargement && <span className="material-symbols-outlined animate-spin text-base">refresh</span>}
          Ouvrir le dossier CPS
        </button>
      </div>
    </form>
  )
}

export default PageOuvertureCpsFemme
