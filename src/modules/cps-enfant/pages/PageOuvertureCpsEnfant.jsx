// Ce composant permet d'ouvrir un dossier CPS Enfant : recherche de l'enfant, saisie des informations néonatales.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'

const aujourd_hui = new Date().toISOString().split('T')[0]

const VIDE = {
  dateOuverture: aujourd_hui,
  mereNom: '',
  mereTelephone: '',
  dateNaissance: aujourd_hui,
  typeAccouchement: 'INTERNE',
  poidsNaissanceG: '',
  scoreApgar1min: '',
  scoreApgar5min: '',
  groupeSanguin: '',
  rhesus: '',
  vihStatut: 'INCONNU',
  notes: '',
}

function PageOuvertureCpsEnfant() {
  const navigate = useNavigate()
  const [etape, setEtape] = useState(1)
  const [termeRecherche, setTermeRecherche] = useState('')
  const [resultats, setResultats] = useState([])
  const [chargementRecherche, setChargementRecherche] = useState(false)
  const [enfantSelectionne, setEnfantSelectionne] = useState(null)
  const timerRef = useRef(null)
  const [formulaire, setFormulaire] = useState(VIDE)
  const [envoi, setEnvoi] = useState({ chargement: false, erreur: null })

  const gererRecherche = (valeur) => {
    setTermeRecherche(valeur)
    if (valeur.trim().length < 2) { setResultats([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setChargementRecherche(true)
      try { setResultats(await serviceCpsEnfant.rechercherEnfants(valeur)) }
      catch { setResultats([]) }
      finally { setChargementRecherche(false) }
    }, 350)
  }

  const selectionnerEnfant = async (enfant) => {
    // Vérifier si l'enfant a déjà plus de 59 mois (non éligible au suivi CPS)
    if (enfant.dateNaissance) {
      const naissance = new Date(enfant.dateNaissance)
      const limite59Mois = new Date(naissance)
      limite59Mois.setMonth(limite59Mois.getMonth() + 59)
      if (new Date() > limite59Mois) {
        setEnvoi({ chargement: false, erreur: `Cet enfant a dépassé 59 mois d'âge. L'ouverture d'un dossier CPS n'est plus possible.` })
        return
      }
    }
    // Vérifier si un dossier CPS est déjà ouvert pour cet enfant
    try {
      const existant = await serviceCpsEnfant.dossierParEnfantId(enfant.id)
      if (existant) {
        navigate(`/cps-enfant/${existant.id}`, { replace: true })
        return
      }
    } catch { /* continuer */ }
    setEnfantSelectionne(enfant)
    // Pré-remplir la date de naissance si disponible
    if (enfant.dateNaissance) {
      setFormulaire((f) => ({ ...f, dateNaissance: enfant.dateNaissance.split('T')[0] }))
    }
    setTermeRecherche('')
    setResultats([])
    setEtape(2)
  }

  const maj = (champ, val) => setFormulaire((f) => ({ ...f, [champ]: val }))

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoi({ chargement: true, erreur: null })
    try {
      const numeroDossierCps = `CPS-ENF-${Date.now().toString(36).toUpperCase().slice(-6)}`
      const donnees = {
        enfantId: enfantSelectionne.id,
        numeroDossierCps,
        dateOuverture: formulaire.dateOuverture,
        mereNom: formulaire.mereNom || null,
        mereTelephone: formulaire.mereTelephone || null,
        dateNaissance: formulaire.dateNaissance || null,
        typeAccouchement: formulaire.typeAccouchement || null,
        poidsNaissanceG: formulaire.poidsNaissanceG ? Number(formulaire.poidsNaissanceG) : null,
        scoreApgar1min: formulaire.scoreApgar1min ? Number(formulaire.scoreApgar1min) : null,
        scoreApgar5min: formulaire.scoreApgar5min ? Number(formulaire.scoreApgar5min) : null,
        groupeSanguin: formulaire.groupeSanguin || null,
        rhesus: formulaire.rhesus || null,
        vihStatut: formulaire.vihStatut || 'INCONNU',
        notes: formulaire.notes || null,
      }
      const dossier = await serviceCpsEnfant.ouvrirDossier(donnees)
      navigate(`/cps-enfant/${dossier.id}`, { state: { messageSucces: 'Dossier CPS Enfant ouvert avec succès.' } })
    } catch (ex) {
      setEnvoi({ chargement: false, erreur: ex.message })
    }
  }

  const nomEnfant = enfantSelectionne
    ? [enfantSelectionne.nom, enfantSelectionne.postnom, enfantSelectionne.prenom].filter(Boolean).join(' ')
    : ''

  return (
    <div style={{ maxWidth: '680px' }}>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/cps-enfant')} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour
        </button>
        <h1 className="font-headline text-xl font-bold text-on-surface">Ouvrir un dossier CPS Enfant</h1>
      </div>

      {/* Étape 1 : Recherche enfant */}
      {etape === 1 && (
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
            Rechercher l&apos;enfant
          </h2>
          <p className="text-sm text-on-surface-variant">Saisissez le nom de l&apos;enfant pour le sélectionner.</p>
          {envoi.erreur && (
            <div className="flex items-start gap-2 rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
              <span className="material-symbols-outlined text-base text-error mt-0.5">error</span>
              <span>{envoi.erreur}</span>
            </div>
          )}
          <input
            type="text"
            placeholder="Nom, postnom, prénom de l'enfant..."
            value={termeRecherche}
            onChange={(e) => gererRecherche(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors"
          />
          {chargementRecherche && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-base">refresh</span>
              Recherche...
            </div>
          )}
          {resultats.length > 0 && (
            <ul className="divide-y divide-outline-variant/20 rounded-xl border border-outline-variant/40 overflow-hidden">
              {resultats.map((e) => {
                const nom = [e.nom, e.postnom, e.prenom].filter(Boolean).join(' ')
                return (
                  <li key={e.id}>
                    <button type="button" onClick={() => selectionnerEnfant(e)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-on-surface-variant">child_care</span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{nom}</p>
                        {e.dateNaissance && (
                          <p className="text-xs text-on-surface-variant">Naissance : {new Date(e.dateNaissance).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {termeRecherche.trim().length >= 2 && !chargementRecherche && resultats.length === 0 && (
            <p className="text-sm text-on-surface-variant">Aucun enfant trouvé pour « {termeRecherche} ».</p>
          )}
        </div>
      )}

      {/* Étape 2 : Formulaire */}
      {etape === 2 && enfantSelectionne && (
        <form onSubmit={soumettre} className="space-y-6">
          {/* Bandeau enfant */}
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
            <div>
              <p className="font-semibold text-on-surface">{nomEnfant}</p>
              {enfantSelectionne.dateNaissance && (
                <p className="text-xs text-on-surface-variant">Naissance : {new Date(enfantSelectionne.dateNaissance).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
            <button type="button" onClick={() => { setEnfantSelectionne(null); setEtape(1) }}
              className="ml-auto text-xs text-on-surface-variant hover:text-primary transition-colors">Changer</button>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-on-surface">Informations du dossier</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Date d&apos;ouverture</label>
                <input type="date" value={formulaire.dateOuverture} onChange={(e) => maj('dateOuverture', e.target.value)} required
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Date de naissance</label>
                <input type="date" value={formulaire.dateNaissance} onChange={(e) => maj('dateNaissance', e.target.value)}
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Nom de la mère</label>
                <input type="text" value={formulaire.mereNom} onChange={(e) => maj('mereNom', e.target.value)} placeholder="Nom complet de la mère"
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Téléphone mère</label>
                <input type="tel" value={formulaire.mereTelephone} onChange={(e) => maj('mereTelephone', e.target.value)} placeholder="+243..."
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-on-surface">Données néonatales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Type accouchement</label>
                <select value={formulaire.typeAccouchement} onChange={(e) => maj('typeAccouchement', e.target.value)}
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50">
                  <option value="INTERNE">Interne (maternité)</option>
                  <option value="EXTERNE">Externe (hors maternité)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Poids naissance (g)</label>
                <input type="number" value={formulaire.poidsNaissanceG} onChange={(e) => maj('poidsNaissanceG', e.target.value)} placeholder="ex: 3200"
                  min="300" max="6000"
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Score Apgar 1 min</label>
                <input type="number" value={formulaire.scoreApgar1min} onChange={(e) => maj('scoreApgar1min', e.target.value)} placeholder="0–10"
                  min="0" max="10"
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Score Apgar 5 min</label>
                <input type="number" value={formulaire.scoreApgar5min} onChange={(e) => maj('scoreApgar5min', e.target.value)} placeholder="0–10"
                  min="0" max="10"
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Groupe sanguin</label>
                <select value={formulaire.groupeSanguin} onChange={(e) => maj('groupeSanguin', e.target.value)}
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50">
                  <option value="">— Non renseigné —</option>
                  {['A', 'B', 'AB', 'O'].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Rhésus</label>
                <select value={formulaire.rhesus} onChange={(e) => maj('rhesus', e.target.value)}
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50">
                  <option value="">— Non renseigné —</option>
                  <option value="+">Positif (+)</option>
                  <option value="-">Négatif (−)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Statut VIH mère</label>
                <select value={formulaire.vihStatut} onChange={(e) => maj('vihStatut', e.target.value)}
                  className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50">
                  <option value="INCONNU">Inconnu</option>
                  <option value="NEGATIF">Négatif</option>
                  <option value="POSITIF">Positif</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Notes</label>
              <textarea value={formulaire.notes} onChange={(e) => maj('notes', e.target.value)} rows={3}
                placeholder="Observations particulières..."
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50 resize-none" />
            </div>
          </div>

          {envoi.erreur && (
            <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{envoi.erreur}</div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/cps-enfant')}
              className="rounded-full border border-outline px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={envoi.chargement}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-60">
              {envoi.chargement && <span className="material-symbols-outlined animate-spin text-base">refresh</span>}
              Ouvrir le dossier
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PageOuvertureCpsEnfant
