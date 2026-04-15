// Ce composant affiche le formulaire pour enregistrer un nouveau contact CPN (constantes + examen obstetrical).
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

const ETAT_INITIAL = {
  dateContact: new Date().toISOString().slice(0, 10),
  ageGestationnel: '',
  poids: '',
  tensionSystolique: '',
  tensionDiastolique: '',
  temperature: '',
  hauteurUterine: '',
  frequenceCardiaqueMore: '',
  bfc: '',
  presentationFoetale: '',
  mouvementsActifs: '',
  oedemes: '',
  varices: '',
  observations: '',
  traitementPrescrit: '',
  prochainRdvDate: '',
  prochainRdvNotes: '',
}

function NumeriqueOuNull(valeur) {
  return valeur !== '' ? Number(valeur) : null
}

function BooleanOuNull(valeur) {
  if (valeur === 'true') return true
  if (valeur === 'false') return false
  return null
}

function PageNouveauContactCpn() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const [formulaire, setFormulaire] = useState(ETAT_INITIAL)
  const [dossier, setDossier] = useState(null)
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)

  useEffect(() => {
    serviceCpn.obtenirDossier(dossierId).then(setDossier).catch(() => {})
  }, [dossierId])

  const majChamp = (champ, valeur) => setFormulaire((f) => ({ ...f, [champ]: valeur }))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnregistrement(true)

    try {
      await serviceCpn.ajouterContact(dossierId, {
        dateContact: formulaire.dateContact,
        ageGestationnel: NumeriqueOuNull(formulaire.ageGestationnel),
        poids: NumeriqueOuNull(formulaire.poids),
        tensionSystolique: NumeriqueOuNull(formulaire.tensionSystolique),
        tensionDiastolique: NumeriqueOuNull(formulaire.tensionDiastolique),
        temperature: NumeriqueOuNull(formulaire.temperature),
        hauteurUterine: NumeriqueOuNull(formulaire.hauteurUterine),
        frequenceCardiaqueMore: NumeriqueOuNull(formulaire.frequenceCardiaqueMore),
        bfc: NumeriqueOuNull(formulaire.bfc),
        presentationFoetale: formulaire.presentationFoetale || null,
        mouvementsActifs: BooleanOuNull(formulaire.mouvementsActifs),
        oedemes: BooleanOuNull(formulaire.oedemes),
        varices: BooleanOuNull(formulaire.varices),
        observations: formulaire.observations || null,
        traitementPrescrit: formulaire.traitementPrescrit || null,
        prochainRdvDate: formulaire.prochainRdvDate || null,
        prochainRdvNotes: formulaire.prochainRdvNotes || null,
      })
      navigate(`/cpn/${dossierId}`, { state: { messageSucces: 'Contact CPN enregistré avec succès.' } })
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(`/cpn/${dossierId}`)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier
        </button>
        <div>
          <h2 className="text-xl font-bold text-on-surface">Nouveau contact CPN</h2>
          {dossier && <p className="text-sm text-on-surface-variant">{dossier.numeroDossierCpn} · {dossier.patiente?.nomComplet}</p>}
        </div>
      </header>

      {erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
      )}

      <form className="flex flex-col gap-6" onSubmit={soumettre}>
        {/* Informations générales */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">event</span>
            Informations générales
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <label className="cpn-champ">
              <span>Date du contact *</span>
              <input required type="date" value={formulaire.dateContact} onChange={(e) => majChamp('dateContact', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Âge gestationnel (SA)</span>
              <input type="number" min="0" max="45" placeholder="ex: 28" value={formulaire.ageGestationnel} onChange={(e) => majChamp('ageGestationnel', e.target.value)} />
            </label>
          </div>
        </section>

        {/* Constantes vitales */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-secondary">monitor_heart</span>
            Constantes vitales
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <label className="cpn-champ">
              <span>Poids (kg)</span>
              <input type="number" step="0.1" min="0" placeholder="ex: 68.5" value={formulaire.poids} onChange={(e) => majChamp('poids', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>TA Systolique (mmHg)</span>
              <input type="number" min="0" placeholder="ex: 120" value={formulaire.tensionSystolique} onChange={(e) => majChamp('tensionSystolique', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>TA Diastolique (mmHg)</span>
              <input type="number" min="0" placeholder="ex: 80" value={formulaire.tensionDiastolique} onChange={(e) => majChamp('tensionDiastolique', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Température (°C)</span>
              <input type="number" step="0.1" min="30" max="45" placeholder="ex: 37.0" value={formulaire.temperature} onChange={(e) => majChamp('temperature', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Hauteur utérine (cm)</span>
              <input type="number" step="0.5" min="0" placeholder="ex: 26.0" value={formulaire.hauteurUterine} onChange={(e) => majChamp('hauteurUterine', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Fréquence cardiaque mère</span>
              <input type="number" min="0" placeholder="ex: 82" value={formulaire.frequenceCardiaqueMore} onChange={(e) => majChamp('frequenceCardiaqueMore', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Bruits du cœur fœtal (BFC)</span>
              <input type="number" min="0" placeholder="ex: 148" value={formulaire.bfc} onChange={(e) => majChamp('bfc', e.target.value)} />
            </label>
          </div>
        </section>

        {/* Examen obstétrical */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-tertiary">pregnant_woman</span>
            Examen obstétrical
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <label className="cpn-champ">
              <span>Présentation fœtale</span>
              <select value={formulaire.presentationFoetale} onChange={(e) => majChamp('presentationFoetale', e.target.value)}>
                <option value="">Non renseigné</option>
                <option value="CEPHALIQUE">Céphalique</option>
                <option value="PODALIQUE">Podalique</option>
                <option value="TRANSVERSE">Transverse</option>
              </select>
            </label>
            <label className="cpn-champ">
              <span>Mouvements actifs</span>
              <select value={formulaire.mouvementsActifs} onChange={(e) => majChamp('mouvementsActifs', e.target.value)}>
                <option value="">Non renseigné</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </label>
            <label className="cpn-champ">
              <span>Œdèmes</span>
              <select value={formulaire.oedemes} onChange={(e) => majChamp('oedemes', e.target.value)}>
                <option value="">Non renseigné</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </label>
            <label className="cpn-champ">
              <span>Varices</span>
              <select value={formulaire.varices} onChange={(e) => majChamp('varices', e.target.value)}>
                <option value="">Non renseigné</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </label>
          </div>
        </section>

        {/* Observations & Traitement */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-on-surface-variant">notes</span>
            Observations & Traitement
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="cpn-champ">
              <span>Observations cliniques</span>
              <textarea rows={4} className="resize-none" placeholder="Observations du clinicien…" value={formulaire.observations} onChange={(e) => majChamp('observations', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Traitement prescrit</span>
              <textarea rows={4} className="resize-none" placeholder="Médicaments, posologie…" value={formulaire.traitementPrescrit} onChange={(e) => majChamp('traitementPrescrit', e.target.value)} />
            </label>
          </div>
        </section>

        {/* Prochain rendez-vous */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">event_upcoming</span>
            Prochain rendez-vous
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="cpn-champ">
              <span>Date du prochain RDV</span>
              <input type="date" value={formulaire.prochainRdvDate} onChange={(e) => majChamp('prochainRdvDate', e.target.value)} />
            </label>
            <label className="cpn-champ">
              <span>Notes pour le prochain contact</span>
              <textarea rows={2} className="resize-none" placeholder="Recommandations pour le prochain RDV…" value={formulaire.prochainRdvNotes} onChange={(e) => majChamp('prochainRdvNotes', e.target.value)} />
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/cpn/${dossierId}`)} className="rounded-xl border border-outline px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container">
            Annuler
          </button>
          <button type="submit" disabled={enregistrement} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-60">
            <span className="material-symbols-outlined text-base">save</span>
            {enregistrement ? 'Enregistrement…' : 'Enregistrer le contact'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PageNouveauContactCpn
