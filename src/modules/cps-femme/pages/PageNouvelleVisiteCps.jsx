// Ce composant affiche le formulaire CPS-style pour enregistrer une visite postnatale, avec analyse IA.
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

const COULEURS_NIVEAU = {
  CRITIQUE: { bg: 'bg-red-50', border: 'border-red-400', texte: 'text-red-700', badge: 'bg-red-600 text-white', icone: 'dangerous' },
  URGENT:   { bg: 'bg-orange-50', border: 'border-orange-400', texte: 'text-orange-700', badge: 'bg-orange-500 text-white', icone: 'priority_high' },
  ATTENTION:{ bg: 'bg-amber-50', border: 'border-amber-400', texte: 'text-amber-700', badge: 'bg-amber-500 text-white', icone: 'warning' },
  NORMAL:   { bg: 'bg-green-50', border: 'border-green-400', texte: 'text-green-700', badge: 'bg-green-600 text-white', icone: 'check_circle' },
}
const STATUT_ICONE = { OK: 'check_circle', ATTENTION: 'warning', URGENT: 'priority_high', CRITIQUE: 'dangerous' }
const STATUT_COULEUR = { OK: 'text-green-600', ATTENTION: 'text-amber-500', URGENT: 'text-orange-500', CRITIQUE: 'text-red-600' }

function AffichageAnalyse({ analyse, avisAccepte, setAvisAccepte, maj }) {
  const c = COULEURS_NIVEAU[analyse.niveau] ?? COULEURS_NIVEAU.NORMAL
  return (
    <div className={`rounded-xl border-2 ${c.border} ${c.bg} space-y-6 p-6`}>
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-2xl ${c.texte}`}>{c.icone}</span>
        <span className={`text-xs font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${c.badge}`}>{analyse.niveau}</span>
        <p className={`text-sm font-bold ${c.texte}`}>{analyse.conclusion}</p>
      </div>
      {analyse.tableau && analyse.tableau.length > 1 && (
        <div className="overflow-x-auto">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Comparaison des visites</p>
          <table className="w-full text-xs border-separate border-spacing-0 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant">
                {['Visite', 'Date', 'Poids', 'Tension', 'Temp.', 'Involution'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyse.tableau.map((ligne, i) => (
                <tr key={i} className={ligne.estActuel ? 'bg-primary/10 font-bold' : 'bg-surface-container-lowest'}>
                  <td className="px-3 py-2">{ligne.estActuel ? '★ ' : ''}{ligne.visite}</td>
                  <td className="px-3 py-2">{ligne.date}</td>
                  <td className="px-3 py-2">{ligne.poids}</td>
                  <td className="px-3 py-2">{ligne.tension}</td>
                  <td className="px-3 py-2">{ligne.temperature}</td>
                  <td className="px-3 py-2">{ligne.involution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {analyse.pointsAnalyse?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Points évalués</p>
          {analyse.pointsAnalyse.map((point) => (
            <div key={point.code} className="flex items-start gap-3 bg-white/60 rounded-xl px-4 py-3">
              <span className={`material-symbols-outlined text-xl mt-0.5 flex-shrink-0 ${STATUT_COULEUR[point.statut]}`}>{STATUT_ICONE[point.statut]}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface">{point.label} <span className="font-normal text-on-surface-variant">— {point.valeurActuelle}</span></p>
                <p className="text-xs text-on-surface-variant mt-0.5">{point.interpretation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {avisAccepte === null && (
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button"
            onClick={() => { setAvisAccepte(true); maj('conduiteATenir', analyse.suggestionTraitement) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-full shadow hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-base">thumb_up</span>
            Prendre en compte cet avis
          </button>
          <button type="button" onClick={() => setAvisAccepte(false)}
            className="flex items-center gap-2 px-5 py-2.5 border border-outline text-on-surface font-semibold rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-base">thumb_down</span>
            Je ne suis pas d&apos;accord
          </button>
        </div>
      )}
      {avisAccepte === true && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 rounded-xl px-4 py-3">
          <span className="material-symbols-outlined text-base">check_circle</span>
          L&apos;avis a été repris dans la section conduite à tenir. Vous pouvez le modifier.
        </div>
      )}
      {avisAccepte === false && (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container rounded-xl px-4 py-3">
          <span className="material-symbols-outlined text-base">info</span>
          Avis non retenu. Rédigez librement la conduite à tenir dans la section 5.
        </div>
      )}
    </div>
  )
}

function NumOuNull(v) {
  return v !== '' && v !== null && v !== undefined ? Number(v) : null
}

function PageNouvelleVisiteCps() {
  const { dossierId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...VIDE, typeVisite: searchParams.get('type') ?? '' })
  const [dossier, setDossier] = useState(null)
  const [envoi, setEnvoi] = useState({ chargement: false, erreur: null })
  const [analyse, setAnalyse] = useState(null)
  const [analyseEnCours, setAnalyseEnCours] = useState(false)
  const [avisAccepte, setAvisAccepte] = useState(null)
  const [erreurAnalyse, setErreurAnalyse] = useState('')
  const [medicaments, setMedicaments] = useState([])
  const [nouveauMed, setNouveauMed] = useState({ id: Date.now(), nom: '', dose: '', duree: '' })
  const [examensADemander, setExamensADemander] = useState([])
  const [nouvelExamen, setNouvelExamen] = useState({ libelle: '', type: 'BIOLOGIQUE' })

  useEffect(() => {
    serviceCpsFemme.obtenirDossier(dossierId)
      .then((d) => {
        setDossier(d)
        if (d?.statut === 'CLOS') navigate(`/cps-femme/${dossierId}`, { replace: true })
      })
      .catch(() => {})
  }, [dossierId])

  const maj = (cle, val) => setForm((f) => ({ ...f, [cle]: val }))

  const ajouterMedicament = () => {
    if (!nouveauMed.nom.trim()) return
    setMedicaments((prev) => [...prev, { ...nouveauMed, id: Date.now() }])
    setNouveauMed({ id: Date.now(), nom: '', dose: '', duree: '' })
  }

  const supprimerMedicament = (id) => setMedicaments((prev) => prev.filter((m) => m.id !== id))

  const ajouterExamen = () => {
    const libelle = nouvelExamen.libelle.trim()
    if (!libelle) return
    if (examensADemander.some((e) => e.libelle.trim().toLowerCase() === libelle.toLowerCase())) return
    setExamensADemander((prev) => [...prev, { ...nouvelExamen, libelle, id: Date.now() }])
    setNouvelExamen({ libelle: '', type: 'BIOLOGIQUE' })
  }

  const supprimerExamen = (id) => setExamensADemander((prev) => prev.filter((e) => e.id !== id))

  const construireTraitement = () => {
    const lignes = []
    if (medicaments.length > 0) {
      lignes.push('=== MÉDICAMENTS ===')
      medicaments.forEach((m) => {
        if (m.nom.trim()) lignes.push(`• ${m.nom}${m.dose ? ' — ' + m.dose : ''}${m.duree ? ' — ' + m.duree : ''}`)
      })
    }
    if (form.conduiteATenir.trim()) {
      if (lignes.length > 0) lignes.push('')
      lignes.push('=== CONDUITE À TENIR ===')
      lignes.push(form.conduiteATenir.trim())
    }
    return lignes.length > 0 ? lignes.join('\n') : null
  }

  const lancerAnalyse = async () => {
    setAnalyseEnCours(true)
    setErreurAnalyse('')
    setAnalyse(null)
    setAvisAccepte(null)
    try {
      const resultat = await serviceCpsFemme.analyserVisite(dossierId, {
        typeVisite: form.typeVisite || undefined,
        etatGeneral: form.etatGeneral || undefined,
        poids: NumOuNull(form.poidsMatenel),
        tensionSystolique: NumOuNull(form.tensionArterielleSystemique),
        tensionDiastolique: NumOuNull(form.tensionArterielleDiastolique),
        temperature: NumOuNull(form.temperatureCelsius),
        frequenceCardiaque: NumOuNull(form.frequenceCardiaque) !== null ? Math.round(NumOuNull(form.frequenceCardiaque)) : null,
        perimetreBrachial: NumOuNull(form.perimetreBrachial),
        involutionUterine: form.involutionUterine || undefined,
        etatSeins: form.etatSeins || undefined,
        allaitement: form.allaitement || undefined,
        etatPlaie: form.etatPlaie || undefined,
        saignements: form.saignements || undefined,
        lochies: form.lochies || undefined,
        etatPsychologique: form.etatPsychologique || undefined,
        oedemes: form.oedemes,
        paleur: form.paleur,
      })
      setAnalyse(resultat)
      if (resultat.suggestionTraitement) maj('conduiteATenir', resultat.suggestionTraitement)
    } catch (ex) {
      setErreurAnalyse(ex.message)
    } finally {
      setAnalyseEnCours(false)
    }
  }

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoi({ chargement: true, erreur: null })
    try {
      const charge = Object.fromEntries(
        Object.entries({
          ...form,
          traitementPrescrit: construireTraitement() || form.traitementPrescrit || undefined,
        }).filter(([, v]) => v !== '' && v !== null && v !== undefined),
      )
      await serviceCpsFemme.ajouterVisite(dossierId, charge)
      // Envoyer les examens demandés
      for (const ex of examensADemander) {
        try {
          await serviceCpsFemme.demanderExamen(dossierId, { libelle: ex.libelle, typeExamen: ex.type })
        } catch { /* ignorer les erreurs individuelles d'examens */ }
      }
      navigate(`/cps-femme/${dossierId}`, { state: { messageSucces: 'Visite enregistrée avec succès.' } })
    } catch (e) {
      setEnvoi({ chargement: false, erreur: e.message })
    }
  }

  const nomPatiente = dossier ? [dossier.patiente?.nom, dossier.patiente?.postnom, dossier.patiente?.prenom].filter(Boolean).join(' ') : ''

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      {/* En-tête hero */}
      <section className="space-y-2 pt-2">
        <button onClick={() => navigate(`/cps-femme/${dossierId}`)}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-4">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier
        </button>
        <span className="text-primary font-semibold tracking-widest text-xs uppercase">Formulaire de visite postnatale</span>
        <h2 className="text-4xl font-extrabold text-on-background tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Enregistrement d&apos;une visite CPS
        </h2>
        {dossier && (
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            {nomPatiente}
          </p>
        )}
      </section>

      {envoi.erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{envoi.erreur}</div>
      )}

      <form className="space-y-8" onSubmit={soumettre}>

        {/* Section 1 : Identification */}
        <div className="bg-surface-container-lowest rounded-xl p-8 space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-outline-variant/40 pl-4">
            <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
            <h3 className="text-xl font-bold text-on-surface">1. Identification de la visite</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Date de la visite</label>
              <div className="bg-surface-container rounded-lg px-4 py-3 flex items-center focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-outlined text-outline mr-3">calendar_today</span>
                <input type="date" required className="bg-transparent border-none w-full text-on-surface p-0"
                  value={form.dateVisite} onChange={(e) => maj('dateVisite', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Type de visite *</label>
              <div className="bg-surface-container rounded-lg px-4 py-3 flex items-center focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-outlined text-outline mr-3">schedule</span>
                <select required className="bg-transparent border-none w-full text-on-surface p-0"
                  value={form.typeVisite} onChange={(e) => maj('typeVisite', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {TYPES_VISITE.map((t) => <option key={t.valeur} value={t.valeur}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">État général</label>
              <div className="bg-surface-container rounded-lg px-4 py-3 flex items-center focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-outlined text-outline mr-3">health_and_safety</span>
                <select className="bg-transparent border-none w-full text-on-surface p-0"
                  value={form.etatGeneral} onChange={(e) => maj('etatGeneral', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  <option value="BON">Bon</option>
                  <option value="PASSABLE">Passable</option>
                  <option value="MAUVAIS">Mauvais</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Plaintes / Observations</label>
              <div className="bg-surface-container rounded-lg px-4 py-3 flex items-start focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-outlined text-outline mr-3 mt-1">chat_bubble</span>
                <textarea rows={3} className="bg-transparent border-none w-full text-on-surface p-0 resize-none placeholder-on-surface-variant/50"
                  placeholder="Plaintes ou observations rapportées…"
                  value={form.observations} onChange={(e) => maj('observations', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 : Constantes vitales */}
        <div className="bg-surface-container-low rounded-xl p-8 space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-outline-variant/40 pl-4">
            <span className="material-symbols-outlined text-tertiary text-3xl">monitoring</span>
            <h3 className="text-xl font-bold text-on-surface">2. Constantes vitales</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Poids maternel (kg)', cle: 'poidsMatenel', placeholder: '62.5', step: '0.1' },
              { label: 'Périmètre brachial (cm)', cle: 'perimetreBrachial', placeholder: '24.0', step: '0.1' },
              { label: 'Température (°C)', cle: 'temperatureCelsius', placeholder: '37.0', step: '0.1' },
              { label: 'Fréq. cardiaque (bpm)', cle: 'frequenceCardiaque', placeholder: '75' },
            ].map(({ label, cle, placeholder, step }) => (
              <div key={cle} className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{label}</label>
                <input type="number" step={step ?? '1'} min="0"
                  className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                  placeholder={placeholder} value={form[cle]} onChange={(e) => maj(cle, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tension sys. (mmHg)</label>
              <input type="number" min="0" className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                placeholder="120" value={form.tensionArterielleSystemique} onChange={(e) => maj('tensionArterielleSystemique', e.target.value)} />
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tension dia. (mmHg)</label>
              <input type="number" min="0" className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                placeholder="80" value={form.tensionArterielleDiastolique} onChange={(e) => maj('tensionArterielleDiastolique', e.target.value)} />
            </div>
            <div className="lg:col-span-2 bg-surface-container-lowest p-4 rounded-xl flex items-center justify-around">
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => maj('paleur', !form.paleur)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.paleur ? 'bg-primary border-outline-variant/50' : 'border-outline-variant'}`}>
                  {form.paleur && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
                </div>
                <span className="font-semibold text-on-surface">Pâleur</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => maj('oedemes', !form.oedemes)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.oedemes ? 'bg-primary border-outline-variant/50' : 'border-outline-variant'}`}>
                  {form.oedemes && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
                </div>
                <span className="font-semibold text-on-surface">Œdèmes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3 : Examen postnatal */}
        <div className="bg-surface-container-lowest rounded-xl p-8 space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-outline-variant/40 pl-4">
            <span className="material-symbols-outlined text-primary text-3xl">pregnant_woman</span>
            <h3 className="text-xl font-bold text-on-surface">3. Examen postnatal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: 'Involution utérine', cle: 'involutionUterine', options: ETATS_INVOLUTION },
              { label: 'État des seins', cle: 'etatSeins', options: ETATS_SEINS },
              { label: 'Allaitement', cle: 'allaitement', options: ETATS_ALLAITEMENT },
              { label: 'État de la plaie', cle: 'etatPlaie', options: ETATS_PLAIE },
              { label: 'État psychologique', cle: 'etatPsychologique', options: ETATS_PSYCHO },
            ].map(({ label, cle, options }) => (
              <div key={cle} className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide ml-1">{label}</label>
                <select className="w-full bg-surface-container-low rounded-lg border-none px-4 py-3 text-on-surface font-semibold"
                  value={form[cle]} onChange={(e) => maj(cle, e.target.value)}>
                  <option value="">— Non renseigné —</option>
                  {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide ml-1">Saignements</label>
              <select className="w-full bg-surface-container-low rounded-lg border-none px-4 py-3 text-on-surface font-semibold"
                value={form.saignements} onChange={(e) => maj('saignements', e.target.value)}>
                <option value="">— Non renseigné —</option>
                <option value="ABSENTS">Absents</option>
                <option value="NORMAUX">Normaux</option>
                <option value="ABONDANTS">Abondants</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide ml-1">Lochies</label>
              <select className="w-full bg-surface-container-low rounded-lg border-none px-4 py-3 text-on-surface font-semibold"
                value={form.lochies} onChange={(e) => maj('lochies', e.target.value)}>
                <option value="">— Non renseigné —</option>
                <option value="NORMALES">Normales</option>
                <option value="ABONDANTES">Abondantes</option>
                <option value="MALODORANTES">Malodorantes</option>
                <option value="ABSENTES">Absentes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4 : Contraception */}
        <div className="bg-surface-container-low rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-4 border-l-4 border-outline-variant/40 pl-4">
            <span className="material-symbols-outlined text-secondary text-3xl">vaccines</span>
            <h3 className="text-xl font-bold text-on-surface">4. Contraception</h3>
          </div>
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => maj('contraceptionDiscutee', !form.contraceptionDiscutee)}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.contraceptionDiscutee ? 'bg-primary border-outline-variant/50' : 'border-outline-variant'}`}>
              {form.contraceptionDiscutee && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
            </div>
            <span className="font-semibold text-on-surface">Contraception discutée avec la patiente</span>
          </label>
          {form.contraceptionDiscutee && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide ml-1">Méthode choisie</label>
              <input type="text" placeholder="ex: Pilule, DIU, Préservatif…"
                className="w-full bg-surface-container-lowest rounded-lg border-none px-4 py-3 text-on-surface"
                value={form.methodeContraceptive} onChange={(e) => maj('methodeContraceptive', e.target.value)} />
            </div>
          )}
        </div>

        {/* ── Bloc Analyse Clinique Assistée IA ── */}
        <div className="rounded-2xl border-2 border-dashed border-outline-variant p-6 space-y-5 bg-surface-container-lowest">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
              <div>
                <p className="font-bold text-on-surface">Analyse clinique assistée par IA</p>
                <p className="text-xs text-on-surface-variant">Vérifie les constantes + l'examen postnatal avant de rédiger la conduite à tenir.</p>
              </div>
            </div>
            <button type="button" onClick={lancerAnalyse} disabled={analyseEnCours}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary font-semibold rounded-full shadow hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
              <span className="material-symbols-outlined text-lg">{analyseEnCours ? 'hourglass_top' : 'search_insights'}</span>
              {analyseEnCours ? 'Analyse en cours…' : 'Analyser cette visite'}
            </button>
          </div>

          {erreurAnalyse && (
            <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreurAnalyse}</div>
          )}

          {analyse && (
            <AffichageAnalyse
              analyse={analyse}
              avisAccepte={avisAccepte}
              setAvisAccepte={setAvisAccepte}
              maj={maj}
            />
          )}
        </div>

        {/* Section 5 : Conduite à tenir */}
        <div className="bg-primary-container/10 border-2 border-outline-variant/50 rounded-2xl p-8 space-y-8">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">medical_information</span>
            <h3 className="text-xl font-bold text-primary">5. Conduite à tenir &amp; Suite</h3>
          </div>

          {/* 5a — Médicaments prescrits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">medication</span>
              <h4 className="font-bold text-on-surface">Médicaments prescrits</h4>
            </div>
            {medicaments.length > 0 && (
              <div className="space-y-2">
                {medicaments.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{m.nom}</p>
                      {(m.dose || m.duree) && <p className="text-xs text-on-surface-variant">{[m.dose, m.duree].filter(Boolean).join(' — ')}</p>}
                    </div>
                    <button type="button" onClick={() => supprimerMedicament(m.id)}
                      className="text-error hover:bg-error-container rounded-full p-1 transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" placeholder="Nom du médicament *"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouveauMed.nom} onChange={(e) => setNouveauMed((m) => ({ ...m, nom: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMedicament())} />
                <input type="text" placeholder="Dose (ex: 500mg 2×/j)"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouveauMed.dose} onChange={(e) => setNouveauMed((m) => ({ ...m, dose: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMedicament())} />
                <input type="text" placeholder="Durée (ex: 7 jours)"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouveauMed.duree} onChange={(e) => setNouveauMed((m) => ({ ...m, duree: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMedicament())} />
              </div>
              <button type="button" onClick={ajouterMedicament} disabled={!nouveauMed.nom.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-full disabled:opacity-40 hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-base">add</span>
                Ajouter ce médicament
              </button>
            </div>
          </div>

          <div className="border-t border-outline-variant/30" />

          {/* 5b — Examens à demander */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">biotech</span>
              <h4 className="font-bold text-on-surface">Examens à demander</h4>
            </div>
            {examensADemander.length > 0 && (
              <div className="space-y-2">
                {examensADemander.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-secondary text-base">science</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{ex.libelle}</p>
                      <p className="text-xs text-on-surface-variant capitalize">{ex.type.toLowerCase()}</p>
                    </div>
                    <button type="button" onClick={() => supprimerExamen(ex.id)}
                      className="text-error hover:bg-error-container rounded-full p-1 transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" placeholder="Libellé de l'examen"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface sm:col-span-2"
                  value={nouvelExamen.libelle}
                  onChange={(e) => setNouvelExamen((ex) => ({ ...ex, libelle: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterExamen())} />
                <select className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouvelExamen.type}
                  onChange={(e) => setNouvelExamen((ex) => ({ ...ex, type: e.target.value }))}>
                  <option value="BIOLOGIQUE">Biologique</option>
                  <option value="ECHOGRAPHIE">Échographie</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <button type="button" onClick={ajouterExamen}
                disabled={!nouvelExamen.libelle.trim() || examensADemander.some((e) => e.libelle.trim().toLowerCase() === nouvelExamen.libelle.trim().toLowerCase())}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary text-sm font-semibold rounded-full disabled:opacity-40 hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-base">add</span>
                {examensADemander.some((e) => e.libelle.trim().toLowerCase() === nouvelExamen.libelle.trim().toLowerCase())
                  ? 'Cet examen existe déjà'
                  : 'Ajouter cet examen'}
              </button>
            </div>
            {examensADemander.length > 0 && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                {examensADemander.length} examen{examensADemander.length > 1 ? 's' : ''} sera enregistré{examensADemander.length > 1 ? 's' : ''} lors de l&apos;enregistrement.
              </p>
            )}
          </div>

          <div className="border-t border-outline-variant/30" />

          {/* 5c — Décision finale + RDV */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">gavel</span>
              <h4 className="font-bold text-on-surface">Conduite à tenir / Décision finale</h4>
            </div>
            <textarea rows={4}
              className="w-full bg-surface-container-lowest rounded-xl border-none p-4 text-on-surface shadow-sm resize-none"
              placeholder="Observations finales, conseils, instructions particulières…"
              value={form.conduiteATenir} onChange={(e) => maj('conduiteATenir', e.target.value)} />

            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Prochain Rendez-vous</label>
                <div className="bg-surface-container-lowest rounded-lg px-4 py-3 flex items-center shadow-sm">
                  <span className="material-symbols-outlined text-primary mr-3">event_repeat</span>
                  <input type="date" className="bg-transparent border-none w-full text-on-surface p-0 font-bold"
                    value={form.prochainRdvDate} min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => maj('prochainRdvDate', e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate(`/cps-femme/${dossierId}`)}
                  className="rounded-full border border-outline px-8 py-4 font-semibold text-on-surface hover:bg-surface-container transition-all">
                  Annuler
                </button>
                <button type="submit" disabled={envoi.chargement || !form.typeVisite}
                  className="flex items-center gap-3 px-12 py-4 bg-primary text-on-primary font-bold rounded-full shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-60">
                  <span className="material-symbols-outlined">save</span>
                  {envoi.chargement ? 'Enregistrement…' : 'Enregistrer la visite'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}

export default PageNouvelleVisiteCps
