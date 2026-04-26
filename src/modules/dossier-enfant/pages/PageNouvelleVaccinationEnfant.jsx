// Formulaire d'enregistrement d'une dose vaccinale pour un enfant.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

function ChampSaisie({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-xl border border-outline/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

function SelectSaisie({ label, name, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-xl border border-outline/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="">— Sélectionner —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ZoneTexte({ label, name, value, onChange, rows = 2, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="rounded-xl border border-outline/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
      />
    </div>
  )
}

const VACCINS = [
  { value: 'BCG', label: 'BCG (Tuberculose)' },
  { value: 'POLIO_ORAL', label: 'Polio oral (VPO)' },
  { value: 'POLIO_INJECTABLE', label: 'Polio injectable (VPI)' },
  { value: 'PENTAVALENT', label: 'Pentavalent (DTC-HepB-Hib)' },
  { value: 'PNEUMOCOQUE', label: 'Pneumocoque (PCV)' },
  { value: 'ROTAVIRUS', label: 'Rotavirus' },
  { value: 'ROUGEOLE', label: 'Rougeole' },
  { value: 'ROUGEOLE_RUBEOLE', label: 'Rougeole-Rubéole' },
  { value: 'MENINGITE', label: 'Méningite A (MenAfriVac)' },
  { value: 'FIEVRE_JAUNE', label: 'Fièvre jaune' },
  { value: 'HEPATITE_B', label: 'Hépatite B (naissance)' },
  { value: 'COVID19', label: 'COVID-19' },
  { value: 'AUTRE', label: 'Autre vaccin' },
]

const STATUTS_DOSE = [
  { value: 'ADMINISTREE', label: 'Administrée' },
  { value: 'DIFFEREE', label: 'Différée' },
  { value: 'REFUSEE', label: 'Refusée' },
]

export default function PageNouvelleVaccinationEnfant() {
  const { enfantId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    vaccin: '',
    vaccinAutre: '',
    numeroDose: '',
    dateAdministration: new Date().toISOString().slice(0, 10),
    ageMois: '',
    numeroLot: '',
    statut: 'ADMINISTREE',
    motifReport: '',
    prochaineDoseDate: '',
  })
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  const maj = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const soumettre = async (e) => {
    e.preventDefault()
    if (!form.vaccin) { setErreur('Veuillez sélectionner un vaccin.'); return }
    if (!form.numeroDose) { setErreur('Le numéro de dose est obligatoire.'); return }
    if (!form.statut) { setErreur('Le statut est obligatoire.'); return }
    setEnCours(true)
    setErreur('')
    try {
      const corps = {
        ...form,
        vaccin: form.vaccin === 'AUTRE' ? form.vaccinAutre : form.vaccin,
        ageMois: form.ageMois ? parseInt(form.ageMois) : undefined,
      }
      delete corps.vaccinAutre
      await serviceDossiersEnfants.enregistrerVaccination(enfantId, corps)
      navigate(`/dossier-enfant/${enfantId}`, { state: { messageSucces: 'Dose vaccinale enregistrée.' } })
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Enregistrer une dose vaccinale</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Renseignez les informations relatives à la dose administrée.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl border border-outline/30 px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour
        </button>
      </div>

      {erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">{erreur}</div>
      )}

      {/* 1 — Vaccin */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">1 — Vaccin</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectSaisie label="Vaccin" name="vaccin" value={form.vaccin} onChange={maj} options={VACCINS} />
          {form.vaccin === 'AUTRE' && (
            <ChampSaisie label="Préciser le vaccin" name="vaccinAutre" value={form.vaccinAutre} onChange={maj} placeholder="Nom du vaccin" />
          )}
          <ChampSaisie label="Numéro de dose" name="numeroDose" value={form.numeroDose} onChange={maj} placeholder="ex: 1ère dose, Rappel 1, etc." />
          <ChampSaisie label="Numéro de lot" name="numeroLot" value={form.numeroLot} onChange={maj} placeholder="ex: AB12345" />
        </div>
      </section>

      {/* 2 — Administration */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">2 — Administration</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ChampSaisie label="Date d'administration" name="dateAdministration" type="date" value={form.dateAdministration} onChange={maj} />
          <ChampSaisie label="Âge de l'enfant (mois)" name="ageMois" type="number" value={form.ageMois} onChange={maj} placeholder="ex: 2" />
          <SelectSaisie label="Statut" name="statut" value={form.statut} onChange={maj} options={STATUTS_DOSE} />
        </div>
        {(form.statut === 'DIFFEREE' || form.statut === 'REFUSEE') && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ZoneTexte label="Motif du report / refus" name="motifReport" value={form.motifReport} onChange={maj} placeholder="Expliquez la raison…" />
            {form.statut === 'DIFFEREE' && (
              <ChampSaisie label="Prochaine date prévue" name="prochaineDoseDate" type="date" value={form.prochaineDoseDate} onChange={maj} />
            )}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-outline/30 px-6 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={enCours}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:opacity-60"
        >
          {enCours && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
          Enregistrer la dose
        </button>
      </div>
    </form>
  )
}
