// Ce composant affiche le formulaire permettant d'enregistrer une nouvelle visite postnatale CPS (6h, 6j, 6s ou surprise).
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'

const TYPES_VISITE = [
  { valeur: 'SIX_HEURES', label: 'Visite 6 heures' },
  { valeur: 'SIX_JOURS', label: 'Visite 6 jours' },
  { valeur: 'SIX_SEMAINES', label: 'Visite 6 semaines' },
  { valeur: 'SURPRISE', label: 'Visite surprise' },
]

const ETATS_INVOLUTION = ['BONNE', 'INCOMPLETE', 'ABSENTE']
const ETATS_SEINS = ['NORMAL', 'ENGORGEMENT', 'CREVASSES', 'MASTITE']
const ETATS_ALLAITEMENT = ['EXCLUSIF', 'MIXTE', 'ARTIFICIEL', 'ABSENT']
const ETATS_PLAIE = ['BONNE_CICATRISATION', 'INFECTION', 'DEHISCENCE', 'NON_APPLICABLE']
const ETATS_PSYCHO = ['NORMAL', 'BABY_BLUES', 'DEPRESSION_SUSPECTEE']

const VIDE = {
  dateVisite: new Date().toISOString().slice(0, 10),
  typeVisite: '',
  etatGeneral: '',
  poidsMatenel: '',
  tensionArterielleSystemique: '',
  tensionArterielleDiastolique: '',
  temperatureCelsius: '',
  frequenceCardiaque: '',
  involutionUterine: '',
  etatSeins: '',
  allaitement: '',
  etatPlaie: '',
  saignements: '',
  lochies: '',
  etatPsychologique: '',
  oedemes: false,
  paleur: false,
  perimetreBrachial: '',
  contraceptionDiscutee: false,
  methodeContraceptive: '',
  conduiteATenir: '',
  traitementPrescrit: '',
  prochainRdvDate: '',
  observations: '',
}

function SectionTitre({ icone, titre }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary pt-2">
      <span className="material-symbols-outlined text-base">{icone}</span>
      {titre}
    </h3>
  )
}

function Champ({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-on-surface-variant">{label}</label>
      {children}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
    />
  )
}

function Select({ options, valeurVide = '—', ...props }) {
  return (
    <select
      {...props}
      className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none"
    >
      <option value="">{valeurVide}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function PageNouvelleVisiteCps() {
  const { dossierId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...VIDE, typeVisite: searchParams.get('type') ?? '' })
  const [envoi, setEnvoi] = useState({ chargement: false, erreur: null })

  const maj = (cle, val) => setForm((f) => ({ ...f, [cle]: val }))

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoi({ chargement: true, erreur: null })
    try {
      const charge = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const visite = await serviceCpsFemme.ajouterVisite(dossierId, charge)
      navigate(`/cps-femme/${dossierId}/visites/${visite.id}`)
    } catch (e) {
      setEnvoi({ chargement: false, erreur: e.message })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate(`/cps-femme/${dossierId}`)}
        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface w-fit"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Retour au dossier
      </button>

      <div>
        <h2 className="text-2xl font-extrabold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Nouvelle visite CPS
        </h2>
        <p className="text-sm text-on-surface-variant">Enregistrement d'une visite postnatale</p>
      </div>

      <form onSubmit={soumettre} className="flex flex-col gap-6">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <SectionTitre icone="event" titre="Identification de la visite" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Date de la visite *">
              <Input type="date" required value={form.dateVisite} onChange={(e) => maj('dateVisite', e.target.value)} />
            </Champ>
            <Champ label="Type de visite *">
              <select required value={form.typeVisite} onChange={(e) => maj('typeVisite', e.target.value)}
                className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none">
                <option value="">— Choisir —</option>
                {TYPES_VISITE.map((t) => (
                  <option key={t.valeur} value={t.valeur}>{t.label}</option>
                ))}
              </select>
            </Champ>
            <Champ label="État général">
              <Select options={['BON', 'PASSABLE', 'MAUVAIS']} value={form.etatGeneral} onChange={(e) => maj('etatGeneral', e.target.value)} />
            </Champ>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <SectionTitre icone="monitor_heart" titre="Constantes vitales" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Champ label="Poids maternel (kg)">
              <Input type="number" step="0.1" placeholder="ex: 62.5" value={form.poidsMatenel} onChange={(e) => maj('poidsMatenel', e.target.value)} />
            </Champ>
            <Champ label="Tension sys. (mmHg)">
              <Input type="number" placeholder="ex: 120" value={form.tensionArterielleSystemique} onChange={(e) => maj('tensionArterielleSystemique', e.target.value)} />
            </Champ>
            <Champ label="Tension dia. (mmHg)">
              <Input type="number" placeholder="ex: 80" value={form.tensionArterielleDiastolique} onChange={(e) => maj('tensionArterielleDiastolique', e.target.value)} />
            </Champ>
            <Champ label="Température (°C)">
              <Input type="number" step="0.1" placeholder="ex: 37.0" value={form.temperatureCelsius} onChange={(e) => maj('temperatureCelsius', e.target.value)} />
            </Champ>
            <Champ label="Fréq. cardiaque (bpm)">
              <Input type="number" placeholder="ex: 75" value={form.frequenceCardiaque} onChange={(e) => maj('frequenceCardiaque', e.target.value)} />
            </Champ>
            <Champ label="Périmètre brachial (cm)">
              <Input type="number" step="0.1" placeholder="ex: 24.0" value={form.perimetreBrachial} onChange={(e) => maj('perimetreBrachial', e.target.value)} />
            </Champ>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <SectionTitre icone="pregnant_woman" titre="Examen postnatal" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Involution utérine">
              <Select options={ETATS_INVOLUTION} value={form.involutionUterine} onChange={(e) => maj('involutionUterine', e.target.value)} />
            </Champ>
            <Champ label="État des seins">
              <Select options={ETATS_SEINS} value={form.etatSeins} onChange={(e) => maj('etatSeins', e.target.value)} />
            </Champ>
            <Champ label="Allaitement">
              <Select options={ETATS_ALLAITEMENT} value={form.allaitement} onChange={(e) => maj('allaitement', e.target.value)} />
            </Champ>
            <Champ label="État de la plaie">
              <Select options={ETATS_PLAIE} value={form.etatPlaie} onChange={(e) => maj('etatPlaie', e.target.value)} />
            </Champ>
            <Champ label="Saignements">
              <Input type="text" placeholder="Description…" value={form.saignements} onChange={(e) => maj('saignements', e.target.value)} />
            </Champ>
            <Champ label="Lochies">
              <Input type="text" placeholder="Description…" value={form.lochies} onChange={(e) => maj('lochies', e.target.value)} />
            </Champ>
            <Champ label="État psychologique">
              <Select options={ETATS_PSYCHO} value={form.etatPsychologique} onChange={(e) => maj('etatPsychologique', e.target.value)} />
            </Champ>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={form.oedemes} onChange={(e) => maj('oedemes', e.target.checked)} className="h-4 w-4 rounded text-primary" />
              Œdèmes
            </label>
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={form.paleur} onChange={(e) => maj('paleur', e.target.checked)} className="h-4 w-4 rounded text-primary" />
              Pâleur
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <SectionTitre icone="family_planning" titre="Contraception" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer sm:col-span-2">
              <input type="checkbox" checked={form.contraceptionDiscutee} onChange={(e) => maj('contraceptionDiscutee', e.target.checked)} className="h-4 w-4 rounded text-primary" />
              Contraception discutée avec la patiente
            </label>
            {form.contraceptionDiscutee && (
              <Champ label="Méthode contraceptive">
                <Input type="text" placeholder="ex: Pilule, DIU, Préservatif…" value={form.methodeContraceptive} onChange={(e) => maj('methodeContraceptive', e.target.value)} />
              </Champ>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <SectionTitre icone="medical_services" titre="Conduite à tenir" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Conduite à tenir">
              <Input type="text" placeholder="Recommandations…" value={form.conduiteATenir} onChange={(e) => maj('conduiteATenir', e.target.value)} />
            </Champ>
            <Champ label="Traitement prescrit">
              <Input type="text" placeholder="Médicaments…" value={form.traitementPrescrit} onChange={(e) => maj('traitementPrescrit', e.target.value)} />
            </Champ>
            <Champ label="Prochain rendez-vous">
              <Input type="date" value={form.prochainRdvDate} onChange={(e) => maj('prochainRdvDate', e.target.value)} />
            </Champ>
          </div>
          <Champ label="Observations">
            <textarea rows={3} value={form.observations} onChange={(e) => maj('observations', e.target.value)}
              placeholder="Observations complémentaires…"
              className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none resize-none placeholder:text-on-surface-variant" />
          </Champ>
        </div>

        {envoi.erreur && (
          <div className="rounded-xl bg-error-container px-5 py-3 text-sm text-on-error-container">{envoi.erreur}</div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(`/cps-femme/${dossierId}`)}
            className="rounded-full border border-outline-variant px-6 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
            Annuler
          </button>
          <button type="submit" disabled={envoi.chargement || !form.typeVisite}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-on-primary disabled:opacity-60">
            {envoi.chargement && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
            Enregistrer la visite
          </button>
        </div>
      </form>
    </div>
  )
}

export default PageNouvelleVisiteCps
