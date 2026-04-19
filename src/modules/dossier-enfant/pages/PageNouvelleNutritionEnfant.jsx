// Formulaire d'évaluation nutritionnelle d'un enfant (anthropométrie, z-scores, prise en charge).
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

function ZoneTexte({ label, name, value, onChange, rows = 3, placeholder }) {
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

const STATUTS_NUTRITIONNELS = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'MAM', label: 'MAM — Malnutrition aiguë modérée' },
  { value: 'MAS', label: 'MAS — Malnutrition aiguë sévère' },
  { value: 'MALNUTRITION_CHRONIQUE', label: 'Malnutrition chronique' },
  { value: 'SURPOIDS', label: 'Surpoids' },
  { value: 'ANEMIE', label: 'Anémie nutritionnelle' },
]

const TYPES_ALIMENTATION = [
  { value: 'ALLAITEMENT_EXCLUSIF', label: 'Allaitement maternel exclusif' },
  { value: 'ALLAITEMENT_COMPLEMENTAIRE', label: 'Allaitement + alimentation complémentaire' },
  { value: 'ARTIFICIEL', label: 'Alimentation artificielle' },
  { value: 'DIVERSIFIE', label: 'Alimentation diversifiée' },
]

const PRISES_EN_CHARGE = [
  { value: 'AMBULATOIRE', label: 'Prise en charge ambulatoire (URENAM/URENAS)' },
  { value: 'HOSPITALISATION', label: 'Hospitalisation (UNTI)' },
  { value: 'SUIVI_ROUTINE', label: 'Suivi de routine' },
  { value: 'REFERENCE', label: 'Référence vers un autre centre' },
  { value: 'AUCUNE', label: 'Aucune intervention requise' },
]

export default function PageNouvelleNutritionEnfant() {
  const { enfantId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    dateEvaluation: new Date().toISOString().slice(0, 10),
    ageMoisEvaluation: '',
    poidsKg: '',
    tailleCm: '',
    perimBrasCm: '',
    zScorePourAge: '',
    zScoreTailleAge: '',
    zScorePoidsAge: '',
    statutNutritionnel: '',
    typeAlimentation: '',
    priseEnCharge: '',
    supplementation: '',
    agentSante: '',
    observations: '',
  })
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  const maj = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const soumettre = async (e) => {
    e.preventDefault()
    if (!form.dateEvaluation) { setErreur('La date est obligatoire.'); return }
    setEnCours(true)
    setErreur('')
    try {
      const corps = {
        ...form,
        ageMoisEvaluation: form.ageMoisEvaluation ? parseInt(form.ageMoisEvaluation) : undefined,
        poidsKg: form.poidsKg ? parseFloat(form.poidsKg) : undefined,
        tailleCm: form.tailleCm ? parseFloat(form.tailleCm) : undefined,
        perimBrasCm: form.perimBrasCm ? parseFloat(form.perimBrasCm) : undefined,
        zScorePourAge: form.zScorePourAge ? parseFloat(form.zScorePourAge) : undefined,
        zScoreTailleAge: form.zScoreTailleAge ? parseFloat(form.zScoreTailleAge) : undefined,
        zScorePoidsAge: form.zScorePoidsAge ? parseFloat(form.zScorePoidsAge) : undefined,
      }
      await serviceDossiersEnfants.ajouterNutrition(enfantId, corps)
      navigate(`/dossier-enfant/${enfantId}`, { state: { messageSucces: 'Évaluation nutritionnelle enregistrée.' } })
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
          <h1 className="font-headline text-2xl font-bold text-on-surface">Évaluation nutritionnelle</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Saisissez les données anthropométriques et le statut nutritionnel.</p>
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

      {/* 1 — Contexte */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">1 — Contexte</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ChampSaisie label="Date d'évaluation" name="dateEvaluation" type="date" value={form.dateEvaluation} onChange={maj} />
          <ChampSaisie label="Âge (mois)" name="ageMoisEvaluation" type="number" value={form.ageMoisEvaluation} onChange={maj} placeholder="ex: 6" />
          <ChampSaisie label="Agent de santé" name="agentSante" value={form.agentSante} onChange={maj} placeholder="Nom ou code" />
        </div>
      </section>

      {/* 2 — Anthropométrie */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">2 — Anthropométrie</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ChampSaisie label="Poids (kg)" name="poidsKg" type="number" value={form.poidsKg} onChange={maj} placeholder="ex: 6.5" />
          <ChampSaisie label="Taille (cm)" name="tailleCm" type="number" value={form.tailleCm} onChange={maj} placeholder="ex: 68" />
          <ChampSaisie label="PB (cm)" name="perimBrasCm" type="number" value={form.perimBrasCm} onChange={maj} placeholder="ex: 13.5" />
        </div>
      </section>

      {/* 3 — Z-scores */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">3 — Z-scores OMS</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ChampSaisie label="Z-score P/A (Poids / Âge)" name="zScorePoidsAge" type="number" value={form.zScorePoidsAge} onChange={maj} placeholder="ex: -1.5" />
          <ChampSaisie label="Z-score T/A (Taille / Âge)" name="zScoreTailleAge" type="number" value={form.zScoreTailleAge} onChange={maj} placeholder="ex: -0.8" />
          <ChampSaisie label="Z-score P/T (Poids / Taille)" name="zScorePourAge" type="number" value={form.zScorePourAge} onChange={maj} placeholder="ex: -2.3" />
        </div>
      </section>

      {/* 4 — Statut et alimentation */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">4 — Statut et alimentation</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectSaisie label="Statut nutritionnel" name="statutNutritionnel" value={form.statutNutritionnel} onChange={maj} options={STATUTS_NUTRITIONNELS} />
          <SelectSaisie label="Type d'alimentation" name="typeAlimentation" value={form.typeAlimentation} onChange={maj} options={TYPES_ALIMENTATION} />
        </div>
      </section>

      {/* 5 — Prise en charge */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">5 — Prise en charge</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectSaisie label="Prise en charge" name="priseEnCharge" value={form.priseEnCharge} onChange={maj} options={PRISES_EN_CHARGE} />
          <ChampSaisie label="Supplémentation" name="supplementation" value={form.supplementation} onChange={maj} placeholder="Vitamines, RUTF, fer, etc." />
          <div className="sm:col-span-2">
            <ZoneTexte label="Observations" name="observations" value={form.observations} onChange={maj} rows={3} placeholder="Notes complémentaires…" />
          </div>
        </div>
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
          Enregistrer l'évaluation
        </button>
      </div>
    </form>
  )
}
