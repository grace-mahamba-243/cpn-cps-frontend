// Ce composant permet d'ouvrir un dossier CPS Femme : recherche de la mere, détection automatique du dossier CPN associé, puis saisie de l'accouchement.
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BandeauPatientImpression, ConteneurImpression, EnTeteImpression, PiedDePageImpression } from '../../../composants/partages/EnTeteImpression'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'
import serviceCpn from '../../../services/api/serviceCpn'

const aujourd_hui = new Date().toISOString().split('T')[0]

function PageOuvertureCpsFemme() {
  const navigate = useNavigate()
  const location = useLocation()
  const patientePreselectionnee = location.state?.patientePreselectionnee ?? null
  const accouchementIdDepuisAccouchement = location.state?.accouchementId ?? null

  const [etape, setEtape] = useState(patientePreselectionnee ? 2 : 1)
  const [termeRecherche, setTermeRecherche] = useState('')
  const [resultats, setResultats] = useState([])
  const [chargementRecherche, setChargementRecherche] = useState(false)
  const [patienteSelectionnee, setPatienteSelectionnee] = useState(patientePreselectionnee)
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
  const [chargementSelection, setChargementSelection] = useState(false)
  const [dossierCpnDetecte, setDossierCpnDetecte] = useState(null)

  // Si patiente pré-sélectionnée depuis le profil : vérifier si elle a un dossier OUVERT
  // et charger le dernier dossier CPN pour pré-remplir les données maternelles
  useEffect(() => {
    if (!patientePreselectionnee) return

    serviceCpsFemme.dossierParPatienteId(patientePreselectionnee.id)
      .then((existant) => {
        if (existant && existant.statut === 'OUVERT') {
          navigate(`/cps-femme/${existant.id}`, { replace: true })
        }
      })
      .catch(() => {})

    // Charger le dernier dossier CPN (potentiellement clôturé) pour pré-remplir les données maternelles
    serviceCpn.dossierParPatienteId(patientePreselectionnee.id)
      .then((cpn) => {
        if (cpn) {
          setDossierCpnDetecte(cpn)
          setFormulaire((f) => ({
            ...f,
            gestite: cpn.gestite != null ? cpn.gestite : f.gestite,
            parite: cpn.parite != null ? cpn.parite : f.parite,
            groupeSanguin: cpn.groupeSanguin ?? f.groupeSanguin,
            rhesus: cpn.rhesus ?? f.rhesus,
            vihStatut: cpn.vihStatut ?? f.vihStatut,
          }))
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    setChargementSelection(true)
    try {
      // Vérifier si un dossier CPS ouvert existe déjà pour cette patiente
      const existant = await serviceCpsFemme.dossierParPatienteId(p.id)
      if (existant && existant.statut === 'OUVERT') {
        navigate(`/cps-femme/${existant.id}`, { replace: true })
        return
      }
    } catch {
      // Si l'appel échoue, continuer normalement
    }

    // Détecter si la patiente a un dossier CPN associable
    try {
      const cpn = await serviceCpn.dossierParPatienteId(p.id)
      if (cpn) {
        setDossierCpnDetecte(cpn)
        // Pré-remplir les données maternelles depuis le CPN
        setFormulaire((f) => ({
          ...f,
          gestite: cpn.gestite ?? f.gestite,
          parite: cpn.parite ?? f.parite,
          groupeSanguin: cpn.groupeSanguin ?? f.groupeSanguin,
          rhesus: cpn.rhesus ?? f.rhesus,
          vihStatut: cpn.vihStatut ?? f.vihStatut,
        }))
      } else {
        setDossierCpnDetecte(null)
      }
    } catch {
      setDossierCpnDetecte(null)
    } finally {
      setChargementSelection(false)
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
        dossierCpnId: formulaire.typeAccouchementEntree === 'INTERNE' && dossierCpnDetecte ? dossierCpnDetecte.id : undefined,
        accouchementId: accouchementIdDepuisAccouchement || undefined,
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
          onClick={() => navigate(-1)}
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

          {(chargementRecherche || chargementSelection) && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant px-1">
              <span className="material-symbols-outlined animate-spin text-base">refresh</span>
              {chargementSelection ? 'Vérification en cours…' : 'Recherche…'}
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
  <>
    <form onSubmit={soumettre} className="screen-only flex flex-col gap-6 max-w-3xl mx-auto">
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

      {/* ── Résumé CPN (si dossier INTERNE avec CPN détecté) ── */}
      {dossierCpnDetecte && formulaire.typeAccouchementEntree === 'INTERNE' && (
        <div className="rounded-2xl bg-secondary/5 border border-secondary/20 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>pregnant_woman</span>
              <p className="text-sm font-bold text-secondary uppercase tracking-wide">Dossier CPN associé automatiquement</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              dossierCpnDetecte.statut === 'CLOS' ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-secondary/10 text-secondary'
            }`}>{dossierCpnDetecte.statut}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-on-surface-variant">N° CPN</p>
              <p className="font-mono font-medium text-on-surface">{dossierCpnDetecte.numeroDossierCpn ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">DPA</p>
              <p className="font-medium text-on-surface">{dossierCpnDetecte.dateProbableAccouchement ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Gestité / Parité</p>
              <p className="font-medium text-on-surface">G{dossierCpnDetecte.gestite ?? '?'} / P{dossierCpnDetecte.parite ?? '?'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Contacts CPN</p>
              <p className="font-medium text-on-surface">{dossierCpnDetecte.contacts?.length ?? 0} contact(s)</p>
            </div>
            {dossierCpnDetecte.groupeSanguin && (
              <div>
                <p className="text-xs text-on-surface-variant">Groupe / Rhésus</p>
                <p className="font-medium text-on-surface">{dossierCpnDetecte.groupeSanguin} {dossierCpnDetecte.rhesus}</p>
              </div>
            )}
            {dossierCpnDetecte.vihStatut && (
              <div>
                <p className="text-xs text-on-surface-variant">VIH</p>
                <p className="font-medium text-on-surface">{dossierCpnDetecte.vihStatut}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-secondary/70">Les données maternelles ont été pré-remplies depuis ce dossier CPN.</p>
        </div>
      )}

      {/* ── Section accouchement : masquée si déjà enregistré ── */}
      {accouchementIdDepuisAccouchement ? (
        <div className="rounded-2xl border border-secondary/20 bg-secondary/5 px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="text-sm font-bold text-secondary">Accouchement déjà enregistré</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Les informations de l'accouchement ont été enregistrées. Cette CPS est liée à cet accouchement.</p>
          </div>
        </div>
      ) : (
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
      )}

      {/* ── Section nouveau-né : masquée si accouchement déjà enregistré ── */}
      {!accouchementIdDepuisAccouchement && (
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
      )}

      {/* ── Section données maternelles ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Données maternelles</h3>
          {accouchementIdDepuisAccouchement && dossierCpnDetecte && (
            <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-0.5 text-xs font-semibold text-secondary">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              Pré-rempli depuis le CPN
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Gestité</label>
            <input type="number" min="0" value={formulaire.gestite}
              onChange={(e) => maj('gestite', e.target.value)}
              disabled={!!(accouchementIdDepuisAccouchement && dossierCpnDetecte)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Parité</label>
            <input type="number" min="0" value={formulaire.parite}
              onChange={(e) => maj('parite', e.target.value)}
              disabled={!!(accouchementIdDepuisAccouchement && dossierCpnDetecte)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Groupe sanguin</label>
            <select value={formulaire.groupeSanguin}
              onChange={(e) => maj('groupeSanguin', e.target.value)}
              disabled={!!(accouchementIdDepuisAccouchement && dossierCpnDetecte)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none disabled:opacity-60 disabled:cursor-not-allowed">
              <option value="">—</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Rhésus</label>
            <select value={formulaire.rhesus}
              onChange={(e) => maj('rhesus', e.target.value)}
              disabled={!!(accouchementIdDepuisAccouchement && dossierCpnDetecte)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none disabled:opacity-60 disabled:cursor-not-allowed">
              <option value="">—</option>
              <option value="+">Positif (+)</option>
              <option value="-">Négatif (−)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Statut VIH</label>
            <select value={formulaire.vihStatut}
              onChange={(e) => maj('vihStatut', e.target.value)}
              disabled={!!(accouchementIdDepuisAccouchement && dossierCpnDetecte)}
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none disabled:opacity-60 disabled:cursor-not-allowed">
              <option value="INCONNU">Inconnu</option>
              <option value="NEGATIF">Négatif</option>
              <option value="POSITIF">Positif</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">
            Notes <span className="text-primary">*</span>
            {accouchementIdDepuisAccouchement && (
              <span className="ml-2 text-on-surface-variant font-normal normal-case tracking-normal">— à compléter avant ouverture</span>
            )}
          </label>
          <textarea rows={3} value={formulaire.notes} onChange={(e) => maj('notes', e.target.value)}
            placeholder="Observations générales, état général de la mère à l'admission…"
            className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none resize-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {/* ── Erreur + Bouton ── */}
      {envoi.erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          {envoi.erreur}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
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

    {/* ── Zone imprimable : ouverture dossier CPS Femme ── */}
    <ConteneurImpression>
      <EnTeteImpression
        titre="Dossier CPS Femme — Ouverture"
        badge="Consultation Postnatale (CPS Femme)"
        date={new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
      />
      <BandeauPatientImpression
        nom={patienteSelectionnee?.nom ?? '—'}
        infos={[
          { label: 'Mode accouchement', valeur: formulaire.modeAccouchement },
          { label: 'Date accouchement', valeur: formulaire.dateAccouchement ? new Date(formulaire.dateAccouchement).toLocaleDateString('fr-FR') : '—' },
          { label: 'État mère à l\'entrée', valeur: formulaire.etatMereEntree },
        ]}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#f0f7ff', borderRadius: 6, padding: '10px 14px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#526070', textTransform: 'uppercase', marginBottom: 8 }}>Données maternelles</div>
          {[
            ['Gestité', formulaire.gestite || '—'],
            ['Parité', formulaire.parite || '—'],
            ['Groupe sanguin', formulaire.groupeSanguin || '—'],
            ['Rhésus', formulaire.rhesus || '—'],
            ['Statut VIH', formulaire.vihStatut || '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '4px 0', fontSize: 11 }}>
              <span style={{ color: '#526070' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#191c1d' }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#f0f7ff', borderRadius: 6, padding: '10px 14px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#526070', textTransform: 'uppercase', marginBottom: 8 }}>Nouveau-né</div>
          {[
            ['État', formulaire.etatNouveauNe],
            ['Sexe', formulaire.sexeNouveauNe || '—'],
            ['Poids naissance', formulaire.poidsNaissanceG ? `${formulaire.poidsNaissanceG} g` : '—'],
            ['Apgar 1\'', formulaire.scoreApgar1min || '—'],
            ['Apgar 5\'', formulaire.scoreApgar5min || '—'],
            ['Nombre', formulaire.nombreNouveauxNes],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '4px 0', fontSize: 11 }}>
              <span style={{ color: '#526070' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#191c1d' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      {formulaire.notes && (
        <div style={{ marginBottom: 16, background: '#f9fafb', borderRadius: 6, padding: '10px 14px', fontSize: 11, color: '#374151' }}>
          <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#526070', marginBottom: 4 }}>Notes</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{formulaire.notes}</div>
        </div>
      )}
      <PiedDePageImpression service="Service Maternité — CPS Femme" />
    </ConteneurImpression>
  </>
  )
}

export default PageOuvertureCpsFemme
