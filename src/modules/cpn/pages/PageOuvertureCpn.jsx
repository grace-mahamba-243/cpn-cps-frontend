// Ce composant guide l'utilisateur en deux etapes pour ouvrir un dossier CPN :
// 1) recherche et selection d'une femme deja enregistree,
// 2) saisie des donnees obstetricals initiales.
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'
import useAuthentification from '../../authentification/hooks/useAuthentification'

const URL_API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

const FACTEURS_RISQUE_OPTIONS = [
  { id: 'grande_multipare',      label: 'Grande multipare (≥ 5 accouchements)' },
  { id: 'antecedent_cesarienne', label: 'Antécédent de césarienne' },
  { id: 'grossesse_multiple',    label: 'Grossesse multiple' },
  { id: 'diabete',               label: 'Diabète' },
  { id: 'hypertension',          label: 'Hypertension artérielle' },
]

const ETAT_INITIAL_FORM = {
  dateOuverture: new Date().toISOString().slice(0, 10),
  gestite: 0,
  parite: 0,
  nombreAvortements: 0,
  derniersRegles: '',
  dateProbableAccouchement: '',
  ageGestionnelOuverture: '',
  groupeSanguin: '',
  rhesus: '',
  vihStatut: 'INCONNU',
  antecedentsMedicaux: [],
  antecedentsChirurgicaux: [],
  antecedentsGynecologiques: [],
  antecedentsObstetricaux: [],
  allergies: '',
  notes: '',
  facteursRisque: [],
  taille: '',
}

function calculerDPA(dateDerniersRegles) {
  if (!dateDerniersRegles) return ''
  const d = new Date(dateDerniersRegles)
  d.setDate(d.getDate() + 280)
  return d.toISOString().slice(0, 10)
}

function formaterNomPatiente(p) {
  return [p.nom, p.postnom, p.prenom].filter(Boolean).join(' ')
}

function calculerAgeAns(dateNaissance) {
  if (!dateNaissance) return null
  return Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function formaterAge(dateNaissance) {
  const ans = calculerAgeAns(dateNaissance)
  return ans !== null ? `${ans} ans` : null
}

// Détermine le statut d'âge maternel
function statutAgeMaternel(dateNaissance) {
  const age = calculerAgeAns(dateNaissance)
  if (age === null) return { id: 'inconnu', label: 'Âge non renseigné', couleur: 'bg-surface-container-high text-on-surface-variant', icone: 'help' }
  if (age < 18)    return { id: 'primipare_jeune', label: `Primipare jeune (${age} ans)`, couleur: 'bg-surface-container-highest text-on-surface', icone: 'warning' }
  if (age > 35)    return { id: 'age_maternel_risque', label: `Âge maternel à risque (${age} ans)`, couleur: 'bg-surface-container-highest text-on-surface', icone: 'warning' }
  return { id: 'normal', label: `Âge normal (${age} ans)`, couleur: 'bg-surface-container-high text-on-surface', icone: 'check_circle' }
}

const FACTEURS_AUTO_AGE = ['primipare_jeune', 'age_maternel_risque']

function initialesAvatar(nom) {
  if (!nom) return '?'
  const m = nom.trim().split(/\s+/)
  return m.length >= 2 ? (m[0][0] + m[1][0]).toUpperCase() : m[0].slice(0, 2).toUpperCase()
}

// ─── Composant todo-list pour les antécédents ─────────────────────────────────

function ListeAntecedents({ label, icone, placeholder, items, onChangeItems }) {
  const [saisie, setSaisie] = useState('')

  const ajouter = () => {
    const texte = saisie.trim()
    if (!texte) return
    onChangeItems([...items, texte])
    setSaisie('')
  }

  const supprimer = (index) => {
    onChangeItems(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); ajouter() }
  }

  return (
    <div className="bg-surface-container-low p-8 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
          <span className="material-symbols-outlined text-lg">{icone}</span>
        </div>
        <h4 className="font-bold text-on-surface">{label}</h4>
        {items.length > 0 && (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
            {items.length}
          </span>
        )}
      </div>

      {/* Champ de saisie + bouton ajouter */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-white border-none rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={!saisie.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-on-primary shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        </button>
      </div>

      {/* Liste des items ajoutés */}
      {items.length === 0 ? (
        <p className="text-xs text-on-surface-variant italic py-2">Aucun antécédent ajouté</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 group">
              <span className="material-symbols-outlined text-tertiary flex-shrink-0" style={{ fontSize: '18px' }}>check_circle</span>
              <span className="flex-1 text-sm text-on-surface">{item}</span>
              <button
                type="button"
                onClick={() => supprimer(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error flex-shrink-0"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Étape 1 : Sélection de la femme ─────────────────────────────────────────

function EtapeSelection({ onSelectionner }) {
  const navigate = useNavigate()
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState([])
  const [chargement, setChargement] = useState(false)
  const [aucunResultat, setAucunResultat] = useState(false)
  const timerRef = useRef(null)

  const chercher = async (terme) => {
    if (!terme.trim()) { setResultats([]); setAucunResultat(false); return }
    setChargement(true)
    setAucunResultat(false)
    try {
      const r = await fetch(`${URL_API}/patientes?recherche=${encodeURIComponent(terme)}`)
      const corps = await r.json()
      const liste = Array.isArray(corps) ? corps : []
      setResultats(liste)
      setAucunResultat(liste.length === 0)
    } catch {
      setResultats([])
    } finally {
      setChargement(false)
    }
  }

  const handleChange = (v) => {
    setRecherche(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => chercher(v), 400)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Barre de recherche */}
      <div>
        <p className="mb-2 text-sm font-semibold text-on-surface">Rechercher une femme enregistrée</p>
        <div className="flex items-center gap-3 rounded-full border border-outline-variant bg-surface px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            autoFocus
            type="text"
            value={recherche}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Nom, prénom, numéro de dossier, téléphone…"
            className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
          />
          {chargement && <span className="material-symbols-outlined animate-spin text-sm text-on-surface-variant">refresh</span>}
          {recherche && !chargement && (
            <button type="button" onClick={() => { setRecherche(''); setResultats([]); setAucunResultat(false) }}>
              <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Résultats */}
      {resultats.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {resultats.length} résultat{resultats.length > 1 ? 's' : ''} — cliquez pour sélectionner
          </div>
          {resultats.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectionner(p)}
              className="flex w-full items-center gap-4 border-b border-outline-variant/50 px-4 py-4 text-left last:border-0 hover:bg-surface-container-low"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
                {initialesAvatar(formaterNomPatiente(p))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface">{formaterNomPatiente(p)}</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Dossier : {p.numeroDossier}
                  {p.telephone ? ` · ${p.telephone}` : ''}
                  {p.dateNaissance ? ` · ${formaterAge(p.dateNaissance)}` : ''}
                </p>
              </div>
              <span className="material-symbols-outlined flex-shrink-0 text-primary">arrow_forward</span>
            </button>
          ))}
        </div>
      )}

      {aucunResultat && (
        <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
          <span className="material-symbols-outlined mt-0.5 text-on-surface-variant">search_off</span>
          <div className="flex-1">
            <p className="font-semibold text-on-surface">Aucune patiente trouvée</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Vérifiez l'orthographe du nom ou le numéro de dossier.
              Si la femme n'est pas encore enregistrée, créez-la d'abord.
            </p>
            <button
              type="button"
              onClick={() => navigate('/patients/nouveau', { state: { redirectApresCrea: '/cpn/nouveau' } })}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Créer une nouvelle mère
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Étape 2 : Formulaire CPN ─────────────────────────────────────────────────

function EtapeFormulaire({ patiente, formulaire, onChange, onRetourSelection, erreur, enregistrement }) {
  const nom = formaterNomPatiente(patiente)

  // Classe utilitaire locale pour les champs du bento
  const cls = {
    label: 'text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider',
    input: 'bg-surface-container border-none rounded-lg p-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all outline-none w-full',
    inputPrimary: 'bg-surface-container border-none rounded-lg p-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all outline-none w-full text-primary font-bold',
    select: 'bg-surface-container border-none rounded-lg p-3 outline-none focus:bg-surface-container-lowest w-full',
    inputSidebar: 'bg-white/80 border-none rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full',
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Fiche résumé patiente ── */}
      <div className="relative overflow-hidden rounded-2xl border border-outline-variant/50 bg-gradient-to-r from-primary-container/40 to-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
              {initialesAvatar(nom)}
            </div>
            <div>
              <p className="font-extrabold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>{nom}</p>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-on-surface-variant">
                {patiente.numeroDossier && <span>Dossier : <strong className="text-on-surface">{patiente.numeroDossier}</strong></span>}
                {patiente.telephone && <span>Tél : <strong className="text-on-surface">{patiente.telephone}</strong></span>}
                {patiente.dateNaissance && <span>Âge : <strong className="text-on-surface">{formaterAge(patiente.dateNaissance)}</strong></span>}
                {patiente.adresse && <span className="hidden md:inline">Adresse : <strong className="text-on-surface">{patiente.adresse}</strong></span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {erreur && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          <span className="material-symbols-outlined text-base">error</span>
          {erreur}
        </div>
      )}

      {/* ── Section 1 : Informations de base (Bento 8/12 + 4/12) ── */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Colonne gauche 8/12 — données cliniques */}
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border-l-4 border-outline-variant/40">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-tertiary">pregnant_woman</span>
            <h4 className="text-lg font-bold text-on-surface tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Informations de base
            </h4>
          </div>

          {/* Ligne 1 : Date d'ouverture — DDR — DPA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
            <div className="flex flex-col">
              <label className={cls.label}>Date d'ouverture</label>
              <input disabled type="date" value={formulaire.dateOuverture}
                className={`${cls.input} opacity-60 cursor-not-allowed`} />
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>DDR (Dernières règles)</label>
              <input
                type="date"
                value={formulaire.derniersRegles}
                onChange={(e) => onChange('derniersRegles', e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                min={(() => { const d = new Date(); d.setMonth(d.getMonth() - 10); return d.toISOString().slice(0, 10) })()}
                className={cls.input}
              />
              {formulaire.derniersRegles && (() => {
                const ddr = new Date(formulaire.derniersRegles)
                const auj = new Date(); auj.setHours(0, 0, 0, 0)
                const ddrMin = new Date(auj); ddrMin.setMonth(ddrMin.getMonth() - 10)
                if (ddr > auj) return <p className="mt-1 text-xs font-medium text-error flex items-center gap-1"><span className="material-symbols-outlined text-sm">warning</span>La DDR ne peut pas être dans le futur.</p>
                if (ddr < ddrMin) return <p className="mt-1 text-xs font-medium text-error flex items-center gap-1"><span className="material-symbols-outlined text-sm">warning</span>Date trop ancienne (max 10 mois en arrière).</p>
                return null
              })()}
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>DPA (Date prévue)</label>
              <input type="date" value={formulaire.dateProbableAccouchement}
                onChange={(e) => onChange('dateProbableAccouchement', e.target.value)} className={cls.inputPrimary} />
            </div>
          </div>

          {/* Séparateur léger */}
          <hr className="my-6 border-surface-container-high" />

          {/* Ligne 2 : Taille — Âge gestationnel — Hb électrophorèse */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
            <div className="flex flex-col">
              <label className={cls.label}>Taille (cm)</label>
              <input type="number" min="100" max="220" placeholder="ex : 165"
                value={formulaire.taille ?? ''}
                onChange={(e) => onChange('taille', e.target.value)} className={cls.input} />
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>Âge gestationnel (SA)</label>
              <input type="number" min="0" max="45" placeholder="ex : 14"
                value={formulaire.ageGestionnelOuverture}
                onChange={(e) => onChange('ageGestionnelOuverture', e.target.value)} className={cls.input} />
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>Allergies connues</label>
              <input type="text" placeholder="ex : Pénicilline"
                value={formulaire.allergies} onChange={(e) => onChange('allergies', e.target.value)} className={cls.input} />
            </div>
          </div>

          {/* Séparateur léger */}
          <hr className="my-6 border-surface-container-high" />

          {/* Ligne 3 : Groupe sanguin — Rhésus — VIH */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
            <div className="flex flex-col">
              <label className={cls.label}>Groupe sanguin</label>
              <select value={formulaire.groupeSanguin} onChange={(e) => onChange('groupeSanguin', e.target.value)} className={cls.select}>
                <option value="">Non renseigné</option>
                <option>A</option><option>B</option><option>AB</option><option>O</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>Rhésus (Rh)</label>
              <select value={formulaire.rhesus} onChange={(e) => onChange('rhesus', e.target.value)} className={cls.select}>
                <option value="">Non renseigné</option>
                <option value="+">Positif (+)</option>
                <option value="-">Négatif (−)</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>Statut VIH</label>
              <select value={formulaire.vihStatut} onChange={(e) => onChange('vihStatut', e.target.value)} className={cls.select}>
                <option value="INCONNU">Inconnu</option>
                <option value="NEGATIF">Négatif</option>
                <option value="POSITIF">Positif</option>
              </select>
            </div>
          </div>

          {/* Séparateur léger */}
          <hr className="my-6 border-surface-container-high" />

          {/* Ligne 4 : Gestité — Parité — Avortements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
            <div className="flex flex-col">
              <label className={cls.label}>Gestité (grossesses)</label>
              <input type="number" min="0" value={formulaire.gestite}
                onChange={(e) => onChange('gestite', e.target.value)} className={cls.input} />
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>Parité (nés vivants)</label>
              <input type="number" min="0" value={formulaire.parite}
                onChange={(e) => onChange('parite', e.target.value)} className={cls.input} />
            </div>
            <div className="flex flex-col">
              <label className={cls.label}>Avortements</label>
              <input type="number" min="0" value={formulaire.nombreAvortements}
                onChange={(e) => onChange('nombreAvortements', e.target.value)} className={cls.input} />
            </div>
          </div>
        </div>

        {/* Colonne droite 4/12 — Facteurs de risque */}
        <div className="md:col-span-4 flex flex-col">
          <div className="bg-surface-container-low p-6 rounded-xl flex-1 border border-outline-variant/50">
            <h4 className="text-sm font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">priority_high</span>
              Facteurs de Risque
            </h4>

            {/* Badge âge maternel auto-détecté */}
            {(() => {
              const statut = statutAgeMaternel(patiente.dateNaissance)
              return (
                <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 mb-5 ${statut.couleur}`}>
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>{statut.icone}</span>
                  <span className="text-xs font-semibold leading-tight">{statut.label}</span>
                  {statut.id !== 'inconnu' && statut.id !== 'normal' && (
                    <span className="material-symbols-outlined ml-auto flex-shrink-0" style={{ fontSize: '16px' }}>check</span>
                  )}
                </div>
              )
            })()}

            {/* Séparateur */}
            <hr className="border-outline-variant/40 mb-4" />

            <div className="space-y-4">
              {FACTEURS_RISQUE_OPTIONS.map(({ id, label }) => {
                const coche = formulaire.facteursRisque.includes(id)
                const basculer = () => {
                  const liste = coche
                    ? formulaire.facteursRisque.filter((x) => x !== id)
                    : [...formulaire.facteursRisque, id]
                  onChange('facteursRisque', liste)
                }
                return (
                  <div key={id} className="flex items-center gap-3 cursor-pointer group"
                    onClick={basculer}>
                    <div
                      className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                        coche
                          ? 'bg-primary border-outline-variant/50'
                          : 'bg-white border-outline-variant group-hover:border-outline-variant/50'
                      }`}
                    >
                      {coche && (
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>
                      )}
                    </div>
                    <span className="text-[13px] text-on-surface leading-snug">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2 : Antécédents (grille 2×2 — todo-list) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { champ: 'antecedentsMedicaux',      label: 'Antécédents médicaux',      icone: 'medical_information', placeholder: 'Ex : Diabète, HTA, Asthme…' },
          { champ: 'antecedentsGynecologiques', label: 'Antécédents gynécologiques', icone: 'female',              placeholder: 'Ex : Dysménorrhée, IST…' },
          { champ: 'antecedentsChirurgicaux',   label: 'Antécédents chirurgicaux',  icone: 'rebase_edit',          placeholder: 'Ex : Césarienne, Appendicectomie…' },
          { champ: 'antecedentsObstetricaux',   label: 'Antécédents obstétricaux',  icone: 'child_care',           placeholder: 'Ex : Pré-éclampsie, Hémorragie…' },
        ].map(({ champ, label, icone, placeholder }) => (
          <ListeAntecedents
            key={champ}
            label={label}
            icone={icone}
            placeholder={placeholder}
            items={formulaire[champ]}
            onChangeItems={(items) => onChange(champ, items)}
          />
        ))}
      </section>

      {/* ── Section 3 : Notes ── */}
      <section>
        <div className="bg-surface-container-lowest p-10 rounded-2xl shadow-sm">
          <h4 className="text-lg font-black text-on-surface mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <span className="material-symbols-outlined text-primary">stethoscope</span>
            Notes complémentaires
          </h4>
          <textarea rows="5" placeholder="Observations générales, conduite à tenir, prescriptions initiales…"
            className="w-full bg-surface-container-low border-none rounded-xl p-5 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
            value={formulaire.notes} onChange={(e) => onChange('notes', e.target.value)} />
        </div>
      </section>

      {/* ── Footer Actions ── */}
      <div className="pt-8 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-end gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3 text-on-surface-variant font-bold hover:text-error transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={enregistrement}
            className="w-full sm:w-auto bg-primary text-on-primary px-10 py-4 rounded-full font-black shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <span className="material-symbols-outlined">save</span>
            {enregistrement ? 'Ouverture en cours…' : 'Enregistrer la Fiche'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

function PageOuvertureCpn() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { utilisateurConnecte } = useAuthentification()
  const modeEdition = location.state?.modeEdition === true
  const dossierExistant = location.state?.dossierExistant ?? null
  const patientePreselectionnee = location.state?.patientePreselectionnee ?? null

  // En mode edition ou pré-sélection : on saute directement a l etape 2
  const [etape, setEtape] = useState(modeEdition || patientePreselectionnee ? 2 : 1)
  const [patiente, setPatiente] = useState(() => {
    if (modeEdition && dossierExistant?.patiente) return dossierExistant.patiente
    if (patientePreselectionnee) return patientePreselectionnee
    return null
  })
  const [formulaire, setFormulaire] = useState(() => {
    if (modeEdition && dossierExistant) {
      return {
        dateOuverture: dossierExistant.dateOuverture ?? ETAT_INITIAL_FORM.dateOuverture,
        gestite: dossierExistant.gestite ?? 0,
        parite: dossierExistant.parite ?? 0,
        nombreAvortements: dossierExistant.nombreAvortements ?? 0,
        derniersRegles: dossierExistant.derniersRegles ?? '',
        dateProbableAccouchement: dossierExistant.dateProbableAccouchement ?? '',
        ageGestionnelOuverture: dossierExistant.ageGestionnelOuverture ?? '',
        groupeSanguin: dossierExistant.groupeSanguin ?? '',
        rhesus: dossierExistant.rhesus ?? '',
        vihStatut: dossierExistant.vihStatut ?? 'INCONNU',
        antecedentsMedicaux: typeof dossierExistant.antecedentsMedicaux === 'string'
          ? dossierExistant.antecedentsMedicaux.split(',').map(s => s.trim()).filter(Boolean)
          : (dossierExistant.antecedentsMedicaux ?? []),
        antecedentsChirurgicaux: typeof dossierExistant.antecedentsChirurgicaux === 'string'
          ? dossierExistant.antecedentsChirurgicaux.split(',').map(s => s.trim()).filter(Boolean)
          : (dossierExistant.antecedentsChirurgicaux ?? []),
        antecedentsGynecologiques: typeof dossierExistant.antecedentsGynecologiques === 'string'
          ? dossierExistant.antecedentsGynecologiques.split(',').map(s => s.trim()).filter(Boolean)
          : (dossierExistant.antecedentsGynecologiques ?? []),
        antecedentsObstetricaux: typeof dossierExistant.antecedentsObstetricaux === 'string'
          ? dossierExistant.antecedentsObstetricaux.split(',').map(s => s.trim()).filter(Boolean)
          : (dossierExistant.antecedentsObstetricaux ?? []),
        allergies: dossierExistant.allergies ?? '',
        notes: dossierExistant.notes ?? '',
        facteursRisque: dossierExistant.facteursRisque ?? [],
        taille: dossierExistant.taille ?? '',
      }
    }
    return ETAT_INITIAL_FORM
  })
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [chargementAuto, setChargementAuto] = useState(false)
  const [dossierDejaExistant, setDossierDejaExistant] = useState(null)

  // Vérifier si la patiente pré-sélectionnée a déjà un dossier → rediriger vers son profil
  useEffect(() => {
    if (!patientePreselectionnee) return
    serviceCpn.dossierParPatienteId(patientePreselectionnee.id)
      .then((existant) => {
        if (existant && existant.statut === 'OUVERT') navigate(`/cpn/${existant.id}`, { replace: true })
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pré-sélection automatique depuis les params URL (?refDossier= ou ?nom=)
  useEffect(() => {
    const refDossier = searchParams.get('refDossier')
    const nom = searchParams.get('nom')
    const terme = refDossier || nom
    if (!terme) return

    setChargementAuto(true)
    const url = `${URL_API}/patientes?recherche=${encodeURIComponent(terme)}`
    fetch(url)
      .then((r) => r.json())
      .then((liste) => {
        const patientes = Array.isArray(liste) ? liste : []
        // Chercher la correspondance exacte par numeroDossier d'abord
        let trouvee = patientes.find((p) => p.numeroDossier === refDossier)
        if (!trouvee && patientes.length === 1) trouvee = patientes[0]
        if (trouvee) {
          selectionnerPatiente(trouvee)
        }
      })
      .catch(() => {})
      .finally(() => setChargementAuto(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectionnerPatiente = async (p) => {
    setPatiente(p)
    setErreur('')
    setDossierDejaExistant(null)
    // Vérifier si la patiente a déjà un dossier CPN (peu importe le statut) — si oui, rediriger vers son profil
    try {
      const existant = await serviceCpn.dossierParPatienteId(p.id)
      if (existant && existant.statut === 'OUVERT') {
        navigate(`/cpn/${existant.id}`, { replace: true })
        return
      }
    } catch { /* ignorer les erreurs de vérification */ }
    setEtape(2)
    // Pré-cocher automatiquement les facteurs de risque liés à l'âge
    const statut = statutAgeMaternel(p.dateNaissance)
    if (statut.id === 'primipare_jeune' || statut.id === 'age_maternel_risque') {
      setFormulaire((f) => ({ ...f, facteursRisque: [...new Set([...f.facteursRisque, statut.id])] }))
    }
  }

  const retourSelection = () => {
    setPatiente(null)
    setEtape(1)
    setFormulaire(ETAT_INITIAL_FORM)
    setErreur('')
    setDossierDejaExistant(null)
  }

  const majChamp = (champ, valeur) => {
    setFormulaire((f) => {
      const n = { ...f, [champ]: valeur }
      if (champ === 'derniersRegles' && valeur) n.dateProbableAccouchement = calculerDPA(valeur)
      return n
    })
  }

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')

    // Validation DDR : entre aujourd'hui et 10 mois en arrière max
    if (formulaire.derniersRegles) {
      const ddr = new Date(formulaire.derniersRegles)
      const aujourd = new Date(); aujourd.setHours(0, 0, 0, 0)
      const ddrMin = new Date(aujourd); ddrMin.setMonth(ddrMin.getMonth() - 10)
      if (ddr > aujourd) {
        setErreur('La DDR ne peut pas être dans le futur.')
        return
      }
      if (ddr < ddrMin) {
        setErreur(`La DDR (${ddr.toLocaleDateString('fr-FR')}) est trop ancienne. Une grossesse dure au maximum ~10 mois. Veuillez vérifier la date.`)
        return
      }
    }

    setEnregistrement(true)
    try {
      const donnees = {
        patienteId: patiente.id, // conservé pour compatibilité interne
        numeroDossierMere: patiente.numeroDossier,
        ...formulaire,
        gestite: Number(formulaire.gestite),
        parite: Number(formulaire.parite),
        nombreAvortements: Number(formulaire.nombreAvortements),
        ageGestionnelOuverture: formulaire.ageGestionnelOuverture ? Number(formulaire.ageGestionnelOuverture) : null,
        derniersRegles: formulaire.derniersRegles || null,
        dateProbableAccouchement: formulaire.dateProbableAccouchement || null,
        groupeSanguin: formulaire.groupeSanguin || null,
        rhesus: formulaire.rhesus || null,
        antecedentsMedicaux: formulaire.antecedentsMedicaux.length ? formulaire.antecedentsMedicaux.join(', ') : null,
        antecedentsChirurgicaux: formulaire.antecedentsChirurgicaux.length ? formulaire.antecedentsChirurgicaux.join(', ') : null,
        antecedentsGynecologiques: formulaire.antecedentsGynecologiques.length ? formulaire.antecedentsGynecologiques.join(', ') : null,
        antecedentsObstetricaux: formulaire.antecedentsObstetricaux.length ? formulaire.antecedentsObstetricaux.join(', ') : null,
        allergies: formulaire.allergies || null,
        notes: formulaire.notes || null,
        facteursRisque: formulaire.facteursRisque.length ? formulaire.facteursRisque : null,
        taille: formulaire.taille ? Number(formulaire.taille) : null,
        utilisateurId: utilisateurConnecte?.id,
        utilisateurNom: utilisateurConnecte?.nomAffichage,
      }
      if (modeEdition && dossierExistant) {
        await serviceCpn.modifierDossier(dossierExistant.id, donnees)
        navigate(`/cpn/${dossierExistant.id}`, { replace: true, state: { messageSucces: 'Dossier CPN mis à jour avec succès.' } })
      } else {
        const rep = await serviceCpn.ouvrirDossier(donnees)
        navigate(`/cpn/${rep.id}`, { replace: true, state: { messageSucces: 'Dossier CPN ouvert avec succès.' } })
      }
    } catch (ex) {
      // Dossier actif déjà existant → rediriger vers le profil de la patiente
      if (ex.statut === 409 && ex.corps?.dossierId) {
        navigate(`/cpn/${ex.corps.dossierId}`, { replace: true })
        return
      }
      setErreur(ex.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* En-tête page */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => modeEdition && dossierExistant ? navigate(`/cpn/${dossierExistant.id}`) : navigate('/cpn')}
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {modeEdition ? 'Modifier la fiche CPN' : 'Ouvrir une CPN'}
          </h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {modeEdition ? "Consultation Prénatale — Modification de la fiche d'ouverture" : "Consultation Prénatale — Fiche d'ouverture"}
          </p>
        </div>
      </div>

      {/* Corps selon l'étape */}
      {chargementAuto ? (
        <div className="flex items-center gap-3 py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">autorenew</span>
          <span className="text-sm">Chargement du dossier patient...</span>
        </div>
      ) : etape === 1 ? (
        <EtapeSelection onSelectionner={selectionnerPatiente} />
      ) : (
        <form onSubmit={soumettre}>
          <EtapeFormulaire
            patiente={patiente}
            formulaire={formulaire}
            onChange={majChamp}
            onSoumettre={soumettre}
            onRetourSelection={retourSelection}
            erreur={erreur}
            enregistrement={enregistrement}
          />
        </form>
      )}
    </div>
  )
}


export default PageOuvertureCpn
