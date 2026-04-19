// Formulaire d'enregistrement d'un nouveau suivi clinique pour un enfant.
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

const ETAT_GENERAL = [
  { value: 'BON', label: 'Bon état général' },
  { value: 'ALTERE', label: 'État général altéré' },
  { value: 'CRITIQUE', label: 'Critique' },
]

const COULEUR_PEAU = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'PALE', label: 'Pâle' },
  { value: 'ICTERIQUE', label: 'Ictérique' },
  { value: 'CYANIQUE', label: 'Cyanique' },
]

const OEDEMES = [
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEGER', label: 'Léger' },
  { value: 'MODERE', label: 'Modéré' },
  { value: 'SEVERE', label: 'Sévère' },
]

const champ = (val, def = '') => val ?? def

export default function PageNouveauSuiviEnfant() {
  const { enfantId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    dateVisite: new Date().toISOString().slice(0, 10),
    motif: '',
    poidsKg: '',
    tailleCm: '',
    perimCranioCm: '',
    perimBrasCm: '',
    temperatureC: '',
    frequenceCardBpm: '',
    frequenceRespBpm: '',
    etatGeneral: '',
    couleurPeau: '',
    oedemes: '',
    deshydratation: '',
    developpementPsychomoteur: '',
    allaitement: '',
    diagnostics: '',
    conduiteTenir: '',
    traitement: '',
    prochainRdv: '',
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
    if (!form.dateVisite) { setErreur('La date de visite est obligatoire.'); return }
    setEnCours(true)
    setErreur('')
    try {
      const corps = {
        ...form,
        poidsKg: form.poidsKg ? parseFloat(form.poidsKg) : undefined,
        tailleCm: form.tailleCm ? parseFloat(form.tailleCm) : undefined,
        perimCranioCm: form.perimCranioCm ? parseFloat(form.perimCranioCm) : undefined,
        perimBrasCm: form.perimBrasCm ? parseFloat(form.perimBrasCm) : undefined,
        temperatureC: form.temperatureC ? parseFloat(form.temperatureC) : undefined,
        frequenceCardBpm: form.frequenceCardBpm ? parseInt(form.frequenceCardBpm) : undefined,
        frequenceRespBpm: form.frequenceRespBpm ? parseInt(form.frequenceRespBpm) : undefined,
      }
      await serviceDossiersEnfants.ajouterSuivi(enfantId, corps)
      navigate(`/dossier-enfant/${enfantId}`, { state: { messageSucces: 'Suivi clinique enregistré.' } })
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Nouveau suivi clinique</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Enregistrez les données cliniques pour cette visite de suivi.</p>
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

      {/* 1 — Généralités */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">1 — Généralités</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChampSaisie label="Date de visite" name="dateVisite" type="date" value={form.dateVisite} onChange={maj} />
          <ChampSaisie label="Agent de santé" name="agentSante" value={form.agentSante} onChange={maj} placeholder="Nom ou code" />
          <div className="sm:col-span-2">
            <ZoneTexte label="Motif de la visite" name="motif" value={form.motif} onChange={maj} rows={2} placeholder="Décrivez le motif…" />
          </div>
        </div>
      </section>

      {/* 2 — Mesures anthropométriques */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">2 — Mesures anthropométriques</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ChampSaisie label="Poids (kg)" name="poidsKg" type="number" value={form.poidsKg} onChange={maj} placeholder="ex: 3.5" />
          <ChampSaisie label="Taille (cm)" name="tailleCm" type="number" value={form.tailleCm} onChange={maj} placeholder="ex: 52" />
          <ChampSaisie label="Périmètre crânien (cm)" name="perimCranioCm" type="number" value={form.perimCranioCm} onChange={maj} placeholder="ex: 34" />
          <ChampSaisie label="Périmètre brachial (cm)" name="perimBrasCm" type="number" value={form.perimBrasCm} onChange={maj} placeholder="ex: 12" />
        </div>
      </section>

      {/* 3 — Signes vitaux */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">3 — Signes vitaux</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ChampSaisie label="Température (°C)" name="temperatureC" type="number" value={form.temperatureC} onChange={maj} placeholder="ex: 37.2" />
          <ChampSaisie label="Fréquence cardiaque (bpm)" name="frequenceCardBpm" type="number" value={form.frequenceCardBpm} onChange={maj} placeholder="ex: 120" />
          <ChampSaisie label="Fréquence respiratoire (bpm)" name="frequenceRespBpm" type="number" value={form.frequenceRespBpm} onChange={maj} placeholder="ex: 40" />
        </div>
      </section>

      {/* 4 — Examen clinique */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">4 — Examen clinique</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectSaisie label="État général" name="etatGeneral" value={form.etatGeneral} onChange={maj} options={ETAT_GENERAL} />
          <SelectSaisie label="Couleur de peau" name="couleurPeau" value={form.couleurPeau} onChange={maj} options={COULEUR_PEAU} />
          <SelectSaisie label="Œdèmes" name="oedemes" value={form.oedemes} onChange={maj} options={OEDEMES} />
          <ChampSaisie label="Déshydratation" name="deshydratation" value={form.deshydratation} onChange={maj} placeholder="Absent / Présent / Sévère" />
          <ZoneTexte label="Développement psychomoteur" name="developpementPsychomoteur" value={form.developpementPsychomoteur} onChange={maj} rows={2} placeholder="Description…" />
          <ChampSaisie label="Allaitement" name="allaitement" value={form.allaitement} onChange={maj} placeholder="Exclusif / Mixte / Sevré" />
        </div>
      </section>

      {/* 5 — Décision clinique */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-wider text-primary">5 — Décision clinique</h2>
        <div className="grid grid-cols-1 gap-4">
          <ZoneTexte label="Diagnostics" name="diagnostics" value={form.diagnostics} onChange={maj} rows={2} placeholder="Diagnostics retenus…" />
          <ZoneTexte label="Conduite à tenir" name="conduiteTenir" value={form.conduiteTenir} onChange={maj} rows={2} placeholder="CAT…" />
          <ZoneTexte label="Traitement prescrit" name="traitement" value={form.traitement} onChange={maj} rows={2} placeholder="Médicaments et posologies…" />
          <ChampSaisie label="Prochain rendez-vous" name="prochainRdv" type="date" value={form.prochainRdv} onChange={maj} />
          <ZoneTexte label="Observations" name="observations" value={form.observations} onChange={maj} rows={2} placeholder="Notes complémentaires…" />
        </div>
      </section>

      {/* Actions */}
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
          Enregistrer le suivi
        </button>
      </div>
    </form>
  )
}
