// Ce composant affiche le formulaire de saisie d'une visite CPS Enfant (anthropométrie, signes vitaux, examen NN, vaccins, décision).
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

// Calendrier vaccinal recommandé par type de visite
const VACCINS_PAR_VISITE = {
  SIX_HEURES: ['BCG', 'VPO'],
  SIX_JOURS: [],
  SIX_SEMAINES: ['Pneumo', 'VPO', 'Pentavalent', 'Rotasiil'],
  M2: ['Pneumo', 'VPO', 'Pentavalent', 'Rotasiil'],
  M3: ['Pneumo', 'VPO', 'VPI', 'Pentavalent', 'Rotasiil'],
  M6: ['VAP1'],
  M9: ['VPI', 'VAR/RR', 'VAA'],
  M12: ['VAR/RR', 'VAP4'],
  SURPRISE: [],
}

const TOUS_VACCINS = [
  'BCG', 'VPO', 'VPI', 'Pentavalent', 'Pneumo', 'Rotasiil',
  'VAP1', 'VAP2', 'VAP3', 'VAP4', 'VAR/RR', 'VAA', 'Autre',
]

const STATUTS_VACCIN = [
  { value: 'ADMINISTREE', label: 'Administrée' },
  { value: 'DIFFEREE', label: 'Différée' },
  { value: 'REFUSEE', label: 'Refusée' },
]

const TYPES_VISITE = [
  { valeur: 'SIX_HEURES', label: 'À la naissance (6 heures)' },
  { valeur: 'SIX_JOURS', label: 'À 6 jours' },
  { valeur: 'SIX_SEMAINES', label: '1 mois et demi (6 semaines)' },
  { valeur: 'M2', label: '2 mois et demi' },
  { valeur: 'M3', label: '3 mois et demi' },
  { valeur: 'M6', label: '6 mois' },
  { valeur: 'M9', label: '9 mois' },
  { valeur: 'M12', label: '15 mois (rappel)' },
  { valeur: 'SURPRISE', label: 'Visite non planifiée' },
]

const ETATS_ALLAITEMENT = ['EXCLUSIF', 'MIXTE', 'ARTIFICIEL', 'ABSENT']
const ETATS_COULEUR_PEAU = ['NORMAL', 'PALE', 'ICTERIQUE', 'CYANIQUE']
const ETATS_CORDON = ['NORMAL', 'INFECTE', 'DETACHE']
const ETATS_DEV_PSYCHOMOTEUR = ['NORMAL', 'RETARDE', 'AVANCE']
const ETAT_GENERAL_OPTIONS = ['BON', 'PASSABLE', 'CRITIQUE']
const DECISION_OPTIONS = ['RAS', 'PRESCRIPTION', 'REFERENCE', 'HOSPITALISATION']

const VIDE = {
  dateVisite: new Date().toISOString().slice(0, 10),
  typeVisite: '',
  etatGeneral: '',
  // Anthropométrie
  poidsKg: '',
  tailleCm: '',
  perimetreCranienCm: '',
  // Signes vitaux
  temperatureCelsius: '',
  frequenceCardiaque: '',
  frequenceRespiratoire: '',
  // Examen NN
  allaitement: '',
  couleurPeau: '',
  oedemes: false,
  ictere: false,
  convulsions: false,
  etatCordon: '',
  developpementPsychomoteur: '',
  // Décision
  conduiteATenir: '',
  traitementPrescrit: '',
  prochainRdvDate: '',
  observations: '',
}

const VIDE_VACCIN = {
  vaccin: '',
  numeroDose: '',
  numeroLot: '',
  dateAdministration: new Date().toISOString().slice(0, 10),
  ageMois: '',
  statut: 'ADMINISTREE',
}

function SectionTitre({ icone, titre }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{icone}</span>
      <h3 className="font-semibold text-on-surface">{titre}</h3>
    </div>
  )
}

function ChampNum({ label, champ, valeur, maj, unite, min, max, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <div className="relative">
        <input type="number" value={valeur} onChange={(e) => maj(champ, e.target.value)}
          min={min} max={max} placeholder={placeholder ?? ''}
          className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50 pr-14" />
        {unite && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">{unite}</span>}
      </div>
    </div>
  )
}

function ChampSelect({ label, champ, valeur, maj, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <select value={valeur} onChange={(e) => maj(champ, e.target.value)}
        className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50">
        <option value="">— Sélectionner —</option>
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.valeur} value={typeof o === 'string' ? o : o.valeur}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function TuileToggle({ label, champ, valeur, maj, couleurActif = 'bg-error-container text-on-error-container' }) {
  return (
    <button type="button" onClick={() => maj(champ, !valeur)}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
        valeur ? `${couleurActif} border-transparent` : 'border-outline-variant/50 bg-surface text-on-surface-variant hover:bg-surface-container'
      }`}>
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: `'FILL' ${valeur ? 1 : 0}` }}>
        {valeur ? 'check_box' : 'check_box_outline_blank'}
      </span>
      {label}
    </button>
  )
}

// Modale d'ajout d'un vaccin
function ModaleVaccin({ typeVisite, onAjouter, onFermer }) {
  const [vaccin, setVaccin] = useState({ ...VIDE_VACCIN })
  const [autreNom, setAutreNom] = useState('')
  const [erreur, setErreur] = useState('')
  const suggeres = VACCINS_PAR_VISITE[typeVisite] ?? []

  const confirmer = () => {
    if (!vaccin.vaccin) { setErreur('Veuillez sélectionner un vaccin.'); return }
    if (vaccin.vaccin === 'Autre' && !autreNom.trim()) { setErreur('Veuillez préciser le nom du vaccin.'); return }
    const nomFinal = vaccin.vaccin === 'Autre' ? autreNom.trim() : vaccin.vaccin
    onAjouter({ ...vaccin, vaccin: nomFinal, id: Date.now() })
    onFermer()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>vaccines</span>
            Nouveau vaccin administré
          </h3>
          <button onClick={onFermer} className="rounded-full p-1 hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Suggestions selon le type de visite */}
        {suggeres.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Recommandés pour cette visite
            </p>
            <div className="flex flex-wrap gap-2">
              {suggeres.map((v) => (
                <button key={v} type="button"
                  onClick={() => setVaccin((prev) => ({ ...prev, vaccin: v }))}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                    vaccin.vaccin === v
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-primary/10'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 1 — Vaccin */}
        <div className="space-y-3 rounded-xl bg-surface-container-lowest p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">1 — Vaccin</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface-variant">Vaccin *</label>
            <select value={vaccin.vaccin} onChange={(e) => { setVaccin((p) => ({ ...p, vaccin: e.target.value })); setAutreNom(''); setErreur('') }}
              className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50">
              <option value="">— Sélectionner —</option>
              {TOUS_VACCINS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            {vaccin.vaccin === 'Autre' && (
              <input
                type="text"
                value={autreNom}
                onChange={(e) => { setAutreNom(e.target.value); setErreur('') }}
                placeholder="Préciser le nom du vaccin…"
                autoFocus
                className="mt-1 rounded-lg border border-primary/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary ring-1 ring-primary/20" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Numéro de dose</label>
              <input type="text" value={vaccin.numeroDose}
                onChange={(e) => setVaccin((p) => ({ ...p, numeroDose: e.target.value }))}
                placeholder="ex: 1ère dose, Rappel 1…"
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Numéro de lot</label>
              <input type="text" value={vaccin.numeroLot}
                onChange={(e) => setVaccin((p) => ({ ...p, numeroLot: e.target.value }))}
                placeholder="ex: AB12345"
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
            </div>
          </div>
        </div>

        {/* Section 2 — Administration */}
        <div className="space-y-3 rounded-xl bg-surface-container-lowest p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">2 — Administration</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Date d'administration</label>
              <input type="date" value={vaccin.dateAdministration}
                onChange={(e) => setVaccin((p) => ({ ...p, dateAdministration: e.target.value }))}
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Âge de l'enfant (mois)</label>
              <input type="number" value={vaccin.ageMois} min={0} max={59}
                onChange={(e) => setVaccin((p) => ({ ...p, ageMois: e.target.value }))}
                placeholder="ex: 2"
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant">Statut</label>
              <select value={vaccin.statut} onChange={(e) => setVaccin((p) => ({ ...p, statut: e.target.value }))}
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50">
                {STATUTS_VACCIN.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {erreur && <p className="text-xs text-error">{erreur}</p>}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onFermer}
            className="rounded-full border border-outline px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
            Annuler
          </button>
          <button type="button" onClick={confirmer}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:opacity-90">
            <span className="material-symbols-outlined text-base">add</span>
            Ajouter à la liste
          </button>
        </div>
      </div>
    </div>
  )
}

function PageNouvelleVisiteCpsEnfant() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const [formulaire, setFormulaire] = useState(VIDE)
  const [dossier, setDossier] = useState(null)
  const [envoi, setEnvoi] = useState({ chargement: false, erreur: null })
  const [vaccinsListe, setVaccinsListe] = useState([])
  const [modaleOuverte, setModaleOuverte] = useState(false)

  useEffect(() => {
    serviceCpsEnfant.obtenirDossier(dossierId).then(setDossier).catch(() => {})
  }, [dossierId])

  const maj = (champ, val) => setFormulaire((f) => ({ ...f, [champ]: val }))

  const ajouterVaccin = (vaccinData) => {
    setVaccinsListe((prev) => [...prev, vaccinData])
  }

  const supprimerVaccin = (id) => {
    setVaccinsListe((prev) => prev.filter((v) => v.id !== id))
  }

  const nomEnfant = dossier?.enfant
    ? [dossier.enfant.nom, dossier.enfant.postnom, dossier.enfant.prenom].filter(Boolean).join(' ')
    : dossier?.mereNom ? `Enfant de ${dossier.mereNom}` : '—'

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoi({ chargement: true, erreur: null })
    try {
      const n = (v) => (v !== '' && v !== null && v !== undefined ? Number(v) : null)
      const s = (v) => (v !== '' ? v : null)
      const vaccinsTexte = vaccinsListe.length > 0 ? vaccinsListe.map((v) => v.vaccin).join(', ') : null
      const donnees = {
        dossierCpsEnfantId: dossierId,
        dateVisite: formulaire.dateVisite,
        typeVisite: formulaire.typeVisite,
        etatGeneral: s(formulaire.etatGeneral),
        poidsKg: n(formulaire.poidsKg),
        tailleCm: n(formulaire.tailleCm),
        perimetreCranienCm: n(formulaire.perimetreCranienCm),
        temperatureCelsius: n(formulaire.temperatureCelsius),
        frequenceCardiaque: n(formulaire.frequenceCardiaque),
        frequenceRespiratoire: n(formulaire.frequenceRespiratoire),
        allaitement: s(formulaire.allaitement),
        couleurPeau: s(formulaire.couleurPeau),
        oedemes: formulaire.oedemes,
        ictere: formulaire.ictere,
        convulsions: formulaire.convulsions,
        etatCordon: s(formulaire.etatCordon),
        developpementPsychomoteur: s(formulaire.developpementPsychomoteur),
        vaccinsAdministres: vaccinsTexte,
        conduiteATenir: s(formulaire.conduiteATenir),
        traitementPrescrit: s(formulaire.traitementPrescrit),
        prochainRdvDate: s(formulaire.prochainRdvDate),
        observations: s(formulaire.observations),
      }
      const visite = await serviceCpsEnfant.ajouterVisite(dossierId, donnees)

      // Enregistrer chaque vaccin dans le carnet vaccinal
      const enfantId = dossier?.enfant?.id ?? dossier?.enfantId
      if (enfantId && vaccinsListe.length > 0) {
        await Promise.all(vaccinsListe.map((v) =>
          serviceDossiersEnfants.enregistrerVaccination(enfantId, {
            vaccin: v.vaccin,
            numeroDose: v.numeroDose ? Number(v.numeroDose) || 1 : 1,
            numeroLot: v.numeroLot || null,
            dateAdministration: v.dateAdministration,
            ageMois: v.ageMois !== '' ? Number(v.ageMois) : null,
            statut: v.statut,
          })
        ))
      }

      navigate(`/cps-enfant/${dossierId}/visites/${visite.id}`, { state: { messageSucces: 'Visite enregistrée avec succès.' } })
    } catch (ex) {
      setEnvoi({ chargement: false, erreur: ex.message })
    }
  }

  return (
    <div style={{ maxWidth: '780px' }}>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(`/cps-enfant/${dossierId}`)}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span> Retour
        </button>
        <div>
          <h1 className="font-headline text-xl font-bold text-on-surface">Nouvelle visite CPS Enfant</h1>
          {dossier && <p className="text-xs text-on-surface-variant">{nomEnfant} · {dossier.numeroDossierCps}</p>}
        </div>
      </div>

      {/* Modale vaccination */}
      {modaleOuverte && (
        <ModaleVaccin
          typeVisite={formulaire.typeVisite}
          onAjouter={ajouterVaccin}
          onFermer={() => setModaleOuverte(false)}
        />
      )}

      <form onSubmit={soumettre} className="space-y-6">
        {/* Type & date */}
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <SectionTitre icone="event" titre="Identification de la visite" />
          <div className="grid grid-cols-2 gap-4">
            <ChampSelect label="Type de visite *" champ="typeVisite" valeur={formulaire.typeVisite} maj={maj} options={TYPES_VISITE} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Date de la visite</label>
              <input type="date" value={formulaire.dateVisite} onChange={(e) => maj('dateVisite', e.target.value)} required
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
            </div>
            <ChampSelect label="État général" champ="etatGeneral" valeur={formulaire.etatGeneral} maj={maj} options={ETAT_GENERAL_OPTIONS} />
          </div>
        </div>

        {/* Anthropométrie */}
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <SectionTitre icone="monitor_weight" titre="Anthropométrie" />
          <div className="grid grid-cols-3 gap-4">
            <ChampNum label="Poids" champ="poidsKg" valeur={formulaire.poidsKg} maj={maj} unite="kg" min="0.3" max="30" placeholder="3.2" />
            <ChampNum label="Taille" champ="tailleCm" valeur={formulaire.tailleCm} maj={maj} unite="cm" min="20" max="120" placeholder="50" />
            <ChampNum label="Périmètre crânien" champ="perimetreCranienCm" valeur={formulaire.perimetreCranienCm} maj={maj} unite="cm" min="20" max="60" placeholder="34" />
          </div>
        </div>

        {/* Signes vitaux */}
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <SectionTitre icone="favorite" titre="Signes vitaux" />
          <div className="grid grid-cols-3 gap-4">
            <ChampNum label="Température" champ="temperatureCelsius" valeur={formulaire.temperatureCelsius} maj={maj} unite="°C" min="34" max="42" placeholder="37.0" />
            <ChampNum label="FC" champ="frequenceCardiaque" valeur={formulaire.frequenceCardiaque} maj={maj} unite="bpm" min="60" max="220" placeholder="130" />
            <ChampNum label="FR" champ="frequenceRespiratoire" valeur={formulaire.frequenceRespiratoire} maj={maj} unite="/min" min="10" max="80" placeholder="40" />
          </div>
        </div>

        {/* Examen néonatal */}
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <SectionTitre icone="stethoscope" titre="Examen néonatal" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-4">
            <ChampSelect label="Allaitement" champ="allaitement" valeur={formulaire.allaitement} maj={maj} options={ETATS_ALLAITEMENT} />
            <ChampSelect label="Couleur peau" champ="couleurPeau" valeur={formulaire.couleurPeau} maj={maj} options={ETATS_COULEUR_PEAU} />
            <ChampSelect label="État cordon" champ="etatCordon" valeur={formulaire.etatCordon} maj={maj} options={ETATS_CORDON} />
            <ChampSelect label="Développement psychomoteur" champ="developpementPsychomoteur" valeur={formulaire.developpementPsychomoteur} maj={maj} options={ETATS_DEV_PSYCHOMOTEUR} />
          </div>
          <div className="flex flex-wrap gap-2">
            <TuileToggle label="Œdèmes" champ="oedemes" valeur={formulaire.oedemes} maj={maj} />
            <TuileToggle label="Ictère" champ="ictere" valeur={formulaire.ictere} maj={maj} />
            <TuileToggle label="Convulsions" champ="convulsions" valeur={formulaire.convulsions} couleurActif="bg-error text-on-error" />
          </div>
        </div>

        {/* Vaccinations */}
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <SectionTitre icone="vaccines" titre="Vaccinations administrées lors de cette visite" />
            <button type="button" onClick={() => setModaleOuverte(true)}
              className="flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary hover:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined text-base">add</span>
              Ajouter un vaccin
            </button>
          </div>

          {vaccinsListe.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-surface py-8 text-on-surface-variant/50">
              <span className="material-symbols-outlined text-3xl">vaccines</span>
              <p className="text-sm">Aucun vaccin ajouté — cliquez sur «&nbsp;Ajouter un vaccin&nbsp;»</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vaccinsListe.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface px-4 py-3">
                  <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>vaccines</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm">{v.vaccin}</p>
                    <p className="text-xs text-on-surface-variant">
                      {v.dateAdministration}
                      {v.numeroDose ? ` · ${v.numeroDose}` : ''}
                      {v.numeroLot ? ` · Lot ${v.numeroLot}` : ''}
                      {v.ageMois !== '' ? ` · ${v.ageMois} mois` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    v.statut === 'ADMINISTREE' ? 'bg-tertiary-container text-on-tertiary-container' :
                    v.statut === 'DIFFEREE' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-error-container text-on-error-container'
                  }`}>
                    {STATUTS_VACCIN.find((s) => s.value === v.statut)?.label ?? v.statut}
                  </span>
                  <button type="button" onClick={() => supprimerVaccin(v.id)}
                    className="rounded-full p-1 text-error hover:bg-error-container/20 transition-colors">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Décision */}
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <SectionTitre icone="assignment" titre="Décision et conduite à tenir" />
          <div className="grid grid-cols-2 gap-4">
            <ChampSelect label="Conduite à tenir" champ="conduiteATenir" valeur={formulaire.conduiteATenir} maj={maj} options={DECISION_OPTIONS} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Prochain RDV</label>
              <input type="date" value={formulaire.prochainRdvDate} onChange={(e) => maj('prochainRdvDate', e.target.value)}
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Traitement prescrit</label>
              <input type="text" value={formulaire.traitementPrescrit} onChange={(e) => maj('traitementPrescrit', e.target.value)}
                placeholder="Nom du médicament, posologie..."
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Observations</label>
              <textarea value={formulaire.observations} onChange={(e) => maj('observations', e.target.value)} rows={3}
                placeholder="Remarques libres..."
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50 resize-none" />
            </div>
          </div>
        </div>

        {envoi.erreur && (
          <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{envoi.erreur}</div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/cps-enfant/${dossierId}`)}
            className="rounded-full border border-outline px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
            Annuler
          </button>
          <button type="submit" disabled={envoi.chargement || !formulaire.typeVisite}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-60">
            {envoi.chargement && <span className="material-symbols-outlined animate-spin text-base">refresh</span>}
            Enregistrer la visite
          </button>
        </div>
      </form>
    </div>
  )
}

export default PageNouvelleVisiteCpsEnfant
