// Ce composant permet de rechercher une femme enregistree et d'ouvrir un dossier CPN.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

const URL_API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

const ETAT_INITIAL = {
  patienteId: '',
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
  antecedentsMedicaux: '',
  antecedentsChirurgicaux: '',
  antecedentsGynecologiques: '',
  antecedentsObstetricaux: '',
  allergies: '',
  notes: '',
}

function calculerDPA(dateDerniersRegles) {
  if (!dateDerniersRegles) return ''
  const ddr = new Date(dateDerniersRegles)
  ddr.setDate(ddr.getDate() + 280)
  return ddr.toISOString().slice(0, 10)
}

function formaterNomPatiente(p) {
  return `${p.nom} ${p.postnom}${p.prenom ? ' ' + p.prenom : ''}`
}

function PageOuvertureCpn() {
  const navigate = useNavigate()
  const [formulaire, setFormulaire] = useState(ETAT_INITIAL)
  const [patienteTrouvee, setPatienteTrouvee] = useState(null)
  const [recherchePatiente, setRecherchePatiente] = useState('')
  const [resultatsRecherche, setResultatsRecherche] = useState([])
  const [chargementRecherche, setChargementRecherche] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const timerRef = useRef(null)

  const chercherPatiente = async (terme) => {
    if (!terme.trim()) { setResultatsRecherche([]); return }
    setChargementRecherche(true)
    try {
      const r = await fetch(`${URL_API}/patientes?recherche=${encodeURIComponent(terme)}`)
      const corps = await r.json()
      setResultatsRecherche(Array.isArray(corps) ? corps : [])
    } catch {
      setResultatsRecherche([])
    } finally {
      setChargementRecherche(false)
    }
  }

  const gererRecherchePatiente = (valeur) => {
    setRecherchePatiente(valeur)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => chercherPatiente(valeur), 400)
  }

  const selectionnerPatiente = (patiente) => {
    setPatienteTrouvee(patiente)
    setFormulaire((f) => ({ ...f, patienteId: patiente.id }))
    setResultatsRecherche([])
    setRecherchePatiente('')
  }

  const majChamp = (champ, valeur) => {
    setFormulaire((f) => {
      const nouveau = { ...f, [champ]: valeur }
      if (champ === 'derniersRegles' && valeur) {
        nouveau.dateProbableAccouchement = calculerDPA(valeur)
      }
      return nouveau
    })
  }

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')

    if (!formulaire.patienteId) {
      setErreur('Veuillez sélectionner une patiente.')
      return
    }

    setEnregistrement(true)
    try {
      const dossier = await serviceCpn.ouvrirDossier({
        ...formulaire,
        gestite: Number(formulaire.gestite),
        parite: Number(formulaire.parite),
        nombreAvortements: Number(formulaire.nombreAvortements),
        ageGestionnelOuverture: formulaire.ageGestionnelOuverture ? Number(formulaire.ageGestionnelOuverture) : null,
        derniersRegles: formulaire.derniersRegles || null,
        dateProbableAccouchement: formulaire.dateProbableAccouchement || null,
        groupeSanguin: formulaire.groupeSanguin || null,
        rhesus: formulaire.rhesus || null,
        antecedentsMedicaux: formulaire.antecedentsMedicaux || null,
        antecedentsChirurgicaux: formulaire.antecedentsChirurgicaux || null,
        antecedentsGynecologiques: formulaire.antecedentsGynecologiques || null,
        antecedentsObstetricaux: formulaire.antecedentsObstetricaux || null,
        allergies: formulaire.allergies || null,
        notes: formulaire.notes || null,
      })
      navigate(`/cpn/${dossier.id}`, { replace: true, state: { messageSucces: 'Dossier CPN ouvert avec succès.' } })
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate('/cpn')} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour
        </button>
        <div>
          <h2 className="text-xl font-bold text-on-surface">Ouvrir un dossier CPN</h2>
          <p className="text-sm text-on-surface-variant">Fiche initiale — Consultation Prénatale</p>
        </div>
      </header>

      {erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
      )}

      <form className="flex flex-col gap-6" onSubmit={soumettre}>
        {/* Recherche patiente */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">person_search</span>
            Sélectionner la patiente
          </h3>

          {patienteTrouvee ? (
            <div className="flex items-center justify-between rounded-xl bg-primary-container px-4 py-3">
              <div>
                <p className="font-semibold text-on-primary-container">{formaterNomPatiente(patienteTrouvee)}</p>
                <p className="text-xs text-on-primary-container/70">{patienteTrouvee.numeroDossier} · {patienteTrouvee.telephone}</p>
              </div>
              <button type="button" onClick={() => setPatienteTrouvee(null)} className="text-on-primary-container/60 hover:text-on-primary-container">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface px-4 py-3">
                <span className="material-symbols-outlined text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, numéro de dossier…"
                  value={recherchePatiente}
                  onChange={(e) => gererRecherchePatiente(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                />
                {chargementRecherche && <span className="material-symbols-outlined animate-spin text-on-surface-variant">refresh</span>}
              </div>

              {resultatsRecherche.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg">
                  {resultatsRecherche.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-low"
                      onClick={() => selectionnerPatiente(p)}
                    >
                      <span className="material-symbols-outlined text-primary">pregnant_woman</span>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{formaterNomPatiente(p)}</p>
                        <p className="text-xs text-on-surface-variant">{p.numeroDossier} · {p.telephone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {recherchePatiente.length > 2 && resultatsRecherche.length === 0 && !chargementRecherche && (
                <p className="mt-2 text-xs text-on-surface-variant">Aucune patiente trouvée. Vérifiez l'orthographe ou enregistrez-la d'abord à la réception.</p>
              )}
            </div>
          )}
        </section>

        {/* Données obstétricales */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">pregnant_woman</span>
            Données obstétricales
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <label className="cpn-champ">
              <span>Date d'ouverture</span>
              <input type="date" value={formulaire.dateOuverture} onChange={(e) => majChamp('dateOuverture', e.target.value)} required />
            </label>
            <label className="cpn-champ">
              <span>Gestité (nombre de grossesses)</span>
              <input type="number" min="0" value={formulaire.gestite} onChange={(e) => majChamp('gestite', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Parité (accouchements)</span>
              <input type="number" min="0" value={formulaire.parite} onChange={(e) => majChamp('parite', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Avortements</span>
              <input type="number" min="0" value={formulaire.nombreAvortements} onChange={(e) => majChamp('nombreAvortements', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Date des dernières règles</span>
              <input type="date" value={formulaire.derniersRegles} onChange={(e) => majChamp('derniersRegles', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Date probable d'accouchement (DPA)</span>
              <input type="date" value={formulaire.dateProbableAccouchement} onChange={(e) => majChamp('dateProbableAccouchement', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Âge gestationnel à l'ouverture (SA)</span>
              <input type="number" min="0" placeholder="ex: 14" value={formulaire.ageGestionnelOuverture} onChange={(e) => majChamp('ageGestionnelOuverture', e.target.value)} />
            </label>
          </div>
        </section>

        {/* Bilan biologique initial */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-secondary">biotech</span>
            Bilan biologique initial
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <label className="cpn-champ">
              <span>Groupe sanguin</span>
              <select value={formulaire.groupeSanguin} onChange={(e) => majChamp('groupeSanguin', e.target.value)}>
                <option value="">Non renseigné</option>
                <option>A</option><option>B</option><option>AB</option><option>O</option>
              </select>
            </label>
            <label className="cpn-champ">
              <span>Rhésus</span>
              <select value={formulaire.rhesus} onChange={(e) => majChamp('rhesus', e.target.value)}>
                <option value="">Non renseigné</option>
                <option value="+">Positif (+)</option>
                <option value="-">Négatif (−)</option>
              </select>
            </label>
            <label className="cpn-champ">
              <span>Statut VIH</span>
              <select value={formulaire.vihStatut} onChange={(e) => majChamp('vihStatut', e.target.value)}>
                <option value="INCONNU">Inconnu</option>
                <option value="NEGATIF">Négatif</option>
                <option value="POSITIF">Positif</option>
              </select>
            </label>
            <label className="cpn-champ md:col-span-1">
              <span>Allergies connues</span>
              <input type="text" placeholder="ex: Pénicilline" value={formulaire.allergies} onChange={(e) => majChamp('allergies', e.target.value)} />
            </label>
          </div>
        </section>

        {/* Antécédents */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-tertiary">history_edu</span>
            Antécédents
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { champ: 'antecedentsMedicaux', label: 'Médicaux' },
              { champ: 'antecedentsChirurgicaux', label: 'Chirurgicaux' },
              { champ: 'antecedentsGynecologiques', label: 'Gynécologiques' },
              { champ: 'antecedentsObstetricaux', label: 'Obstétricaux' },
            ].map(({ champ, label }) => (
              <label key={champ} className="cpn-champ">
                <span>{label}</span>
                <textarea rows={3} placeholder={`Antécédents ${label.toLowerCase()}…`} value={formulaire[champ]} onChange={(e) => majChamp(champ, e.target.value)} className="resize-none" />
              </label>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <label className="cpn-champ">
            <span className="flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="material-symbols-outlined text-on-surface-variant">notes</span>
              Notes complémentaires
            </span>
            <textarea rows={3} placeholder="Observations générales…" value={formulaire.notes} onChange={(e) => majChamp('notes', e.target.value)} className="resize-none" />
          </label>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/cpn')} className="rounded-xl border border-outline px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container">
            Annuler
          </button>
          <button type="submit" disabled={enregistrement} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-60">
            <span className="material-symbols-outlined text-base">save</span>
            {enregistrement ? 'Enregistrement…' : 'Ouvrir le dossier CPN'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PageOuvertureCpn
