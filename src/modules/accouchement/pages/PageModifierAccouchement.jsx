// Ce composant permet de modifier les données d'un accouchement existant.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceAccouchement from '../../../services/api/serviceAccouchement'
import useAuthentification from '../../authentification/hooks/useAuthentification'

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

const CLS_INPUT =
  'w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60 transition-colors'
const CLS_SELECT =
  'w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60 transition-colors'

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

export default function PageModifierAccouchement() {
  const { accouchementId } = useParams()
  const navigate = useNavigate()
  const { utilisateur } = useAuthentification()
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [form, setForm] = useState(null)
  const [nouveauNeCourant, setNouveauNeCourant] = useState(creerTodoNouveauNe())
  const [erreurAjout, setErreurAjout] = useState(null)

  useEffect(() => {
    charger()
  }, [accouchementId])

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const detail = await serviceAccouchement.obtenirAccouchement(accouchementId)
      if (!detail) throw new Error('Accouchement introuvable.')

      const nombreNouveauxNes = normaliserNombreNouveauxNes(detail.nombreNouveauxNes ?? 1)
      const premierTodo = {
        sexeNouveauNe: detail.sexeNouveauNe ?? '',
        poidsNaissanceG: detail.poidsNaissanceG ?? '',
        scoreApgar1min: detail.scoreApgar1min ?? '',
        scoreApgar5min: detail.scoreApgar5min ?? '',
        anomaliesCongenitales: detail.anomaliesCongenitales ?? '',
        etatNouveauNe: detail.etatNouveauNe ?? 'VIVANT',
      }
      const nouveauxNes = ajusterTodosNouveauxNes([premierTodo], nombreNouveauxNes)

      setForm({
        typeAccouchement: detail.typeAccouchement ?? 'INTERNE',
        dateAccouchement: detail.dateAccouchement
          ? detail.dateAccouchement.slice(0, 16)
          : '',
        ageGestationnel: detail.ageGestationnel ?? '',
        modeAccouchement: detail.modeAccouchement ?? 'NATUREL',
        etatMere: detail.etatMere ?? 'STABLE',
        complicationsMere: detail.complicationsMere ?? '',
        perteSanguineMl: detail.perteSanguineMl ?? '',
        nombreNouveauxNes,
        nouveauxNes,
        notes: nettoyerNotesAvecDetails(detail.notes ?? ''),
      })
    } catch (e) {
      setErreur(e.message || 'Impossible de charger cet accouchement.')
    } finally {
      setChargement(false)
    }
  }

  function surChangement(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
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
    setForm((f) => ({ ...f, nouveauxNes: [...f.nouveauxNes, { ...nouveauNeCourant }] }))
    setNouveauNeCourant(creerTodoNouveauNe())
  }

  function supprimerNouveauNe(index) {
    setForm((f) => ({ ...f, nouveauxNes: f.nouveauxNes.filter((_, i) => i !== index) }))
  }

  async function soumettre(e) {
    e.preventDefault()
    setErreur(null)

    const nombreAttendu = normaliserNombreNouveauxNes(form.nombreNouveauxNes)

    if (form.nouveauxNes.length === 0) {
      setErreur('Veuillez ajouter au moins un nouveau-né.')
      return
    }

    if (form.nouveauxNes.length !== nombreAttendu) {
      setErreur(`Vous avez indiqué ${nombreAttendu} nouveau(x)-né(s), mais seulement ${form.nouveauxNes.length} ont été ajouté(s). Veuillez compléter la liste.`)
      return
    }

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
        utilisateurId: utilisateur?.id,
        utilisateurNom: utilisateur?.nom,
      }
      await serviceAccouchement.modifierAccouchement(accouchementId, donnees)
      navigate(`/accouchements/${accouchementId}`)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue lors de la modification.')
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex h-48 items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
        Chargement…
      </div>
    )
  }

  if (erreur && !form) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-8">
        <button
          onClick={() => navigate(`/accouchements/${accouchementId}`)}
          className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au détail
        </button>
        <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
          <span className="material-symbols-outlined">error</span>
          {erreur}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">

      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
            <button
              type="button"
              onClick={() => navigate('/accouchements')}
              className="hover:text-on-surface transition"
            >
              Accouchements
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <button
              type="button"
              onClick={() => navigate(`/accouchements/${accouchementId}`)}
              className="hover:text-on-surface transition"
            >
              Détail
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-medium text-primary">Modification</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">Modifier l&apos;accouchement</h2>
          <p className="mt-1 text-on-surface-variant">Corrigez ou complétez les données enregistrées.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/accouchements/${accouchementId}`)}
          className="self-start inline-flex items-center gap-2 rounded-full border border-outline-variant/50 px-5 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-base">close</span>
          Annuler
        </button>
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
                    <option value="">— Non précisé —</option>
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
                  <div key={`nn-liste-modif-${index}`} className="flex items-start justify-between rounded-lg border border-outline-variant/60 bg-surface p-3">
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
            onClick={() => navigate(`/accouchements/${accouchementId}`)}
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
            {envoi ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>

      </form>
    </div>
  )
}
