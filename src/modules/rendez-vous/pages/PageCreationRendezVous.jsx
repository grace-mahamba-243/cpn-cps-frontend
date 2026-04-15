// Ce composant permet a la receptionniste de creer un nouveau rendez-vous.
// Un selecteur de type (Planifie / Surprise) adapte le formulaire automatiquement.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/api/serviceRendezVous'
import serviceDossiersMeres from '../../../services/api/serviceDossiersMeres'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

// Configuration des services avec leurs capacites journalieres
const SERVICES = [
  { valeur: 'Maternite (CPN)', label: 'CPN (Consultation Prenatale)', capacite: 20, groupe: 'cpn' },
  { valeur: 'CPS Femme', label: 'CPS Femme (Consultation Postnatale)', capacite: 20, groupe: 'cps_suivi' },
  { valeur: 'Suivi enfant', label: 'Suivi enfant', capacite: 20, groupe: 'cps_suivi' },
  { valeur: 'Vaccination', label: 'Vaccination', capacite: null, groupe: 'vaccination' },
  { valeur: 'Laboratoire', label: 'Laboratoire', capacite: 15, groupe: 'laboratoire' },
  { valeur: 'Pharmacie', label: 'Pharmacie', capacite: null, groupe: 'pharmacie' },
]

function obtenirDateAujourdhui() {
  return new Date().toISOString().split('T')[0]
}

function obtenirHeureMaintenant() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const CHAMPS_VIDES = {
  typeRendezVous: 'Planifie',
  typePatient: 'Mere',
  dossierSelectionne: null,
  service: '',
  date: '',
  heure: '',
  motif: '',
  observations: '',
}

function normaliserTexte(valeur = '') {
  return valeur
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function obtenirNomCompletMere(dossier) {
  return [dossier.nom, dossier.postnom, dossier.prenom].filter(Boolean).join(' ')
}

function obtenirNomCompletEnfant(dossier) {
  return [dossier.nom, dossier.postnom, dossier.prenom].filter(Boolean).join(' ')
}

function CouleurJauge({ pourcentage }) {
  if (pourcentage >= 100) return 'bg-error'
  if (pourcentage >= 80) return 'bg-tertiary'
  return 'bg-primary'
}

function PageCreationRendezVous() {
  const navigate = useNavigate()
  const rechercheRef = useRef(null)

  const [formulaire, setFormulaire] = useState({ ...CHAMPS_VIDES })
  const [erreurs, setErreurs] = useState({})
  const [messageSucces, setMessageSucces] = useState('')
  const [messageErreur, setMessageErreur] = useState('')
  const [enChargement, setEnChargement] = useState(false)

  // Etat dossiers
  const [tousLesDossiersMeres, setTousLesDossiersMeres] = useState([])
  const [tousLesDossiersEnfants, setTousLesDossiersEnfants] = useState([])
  const [recherchedossier, setRechercheDossier] = useState('')
  const [menuRechercheOuvert, setMenuRechercheOuvert] = useState(false)

  // Capacite journaliere
  const [capaciteInfo, setCapaciteInfo] = useState(null)
  const [chargementCapacite, setChargementCapacite] = useState(false)

  const estSurprise = formulaire.typeRendezVous === 'Surprise'

  // Charger les dossiers au montage
  useEffect(() => {
    serviceDossiersMeres.lister().then(setTousLesDossiersMeres).catch(() => {})
    serviceDossiersEnfants.lister().then(setTousLesDossiersEnfants).catch(() => {})
  }, [])

  // Fermer le menu de recherche si clic en dehors
  useEffect(() => {
    function gererClicExterieur(e) {
      if (rechercheRef.current && !rechercheRef.current.contains(e.target)) {
        setMenuRechercheOuvert(false)
      }
    }
    document.addEventListener('mousedown', gererClicExterieur)
    return () => document.removeEventListener('mousedown', gererClicExterieur)
  }, [])

  // Verifier la capacite journaliere quand le service ou la date change (seulement pour planifie)
  useEffect(() => {
    if (estSurprise || !formulaire.service || !formulaire.date) {
      setCapaciteInfo(null)
      return
    }

    const service = SERVICES.find((s) => s.valeur === formulaire.service)
    if (!service || service.capacite === null) {
      setCapaciteInfo(null)
      return
    }

    let actif = true
    setChargementCapacite(true)

    serviceRendezVous
      .compterParServiceEtDate(formulaire.service, formulaire.date)
      .then((compte) => {
        if (!actif) return
        setCapaciteInfo({ utilises: compte, maximum: service.capacite, service: service.label })
      })
      .catch(() => { if (actif) setCapaciteInfo(null) })
      .finally(() => { if (actif) setChargementCapacite(false) })

    return () => { actif = false }
  }, [formulaire.service, formulaire.date, estSurprise])

  // Dossiers filtres selon la recherche et le type de patient
  const dossiersFiltres = useMemo(() => {
    const terme = normaliserTexte(recherchedossier.trim())
    if (!terme || terme.length < 2) return []

    if (formulaire.typePatient === 'Mere') {
      return tousLesDossiersMeres
        .filter((d) => {
          const nom = normaliserTexte(obtenirNomCompletMere(d))
          const ref = normaliserTexte(d.numeroDossier ?? '')
          return nom.includes(terme) || ref.includes(terme)
        })
        .slice(0, 5)
        .map((d) => ({
          id: d.id,
          nomAffichage: obtenirNomCompletMere(d),
          reference: d.numeroDossier,
          detail: d.dateNaissance ? `Nee le ${d.dateNaissance}` : '',
          typePatient: 'Mere',
        }))
    }

    return tousLesDossiersEnfants
      .filter((d) => {
        const nom = normaliserTexte(obtenirNomCompletEnfant(d))
        const ref = normaliserTexte(d.numeroFiche ?? '')
        return nom.includes(terme) || ref.includes(terme)
      })
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        nomAffichage: obtenirNomCompletEnfant(d),
        reference: d.numeroFiche,
        detail: d.nomMere ? `Mere : ${d.nomMere}` : '',
        typePatient: 'Enfant',
      }))
  }, [recherchedossier, formulaire.typePatient, tousLesDossiersMeres, tousLesDossiersEnfants])

  const estSature = !estSurprise && capaciteInfo !== null && capaciteInfo.utilises >= capaciteInfo.maximum
  const pourcentageCapacite = capaciteInfo ? Math.min(100, Math.round((capaciteInfo.utilises / capaciteInfo.maximum) * 100)) : 0

  function definirChamp(champ, valeur) {
    setFormulaire((courant) => ({ ...courant, [champ]: valeur }))
    setErreurs((courant) => ({ ...courant, [champ]: undefined }))
  }

  function changerTypeRendezVous(type) {
    setFormulaire({
      ...CHAMPS_VIDES,
      typeRendezVous: type,
      date: type === 'Surprise' ? obtenirDateAujourdhui() : '',
      heure: type === 'Surprise' ? obtenirHeureMaintenant() : '',
    })
    setRechercheDossier('')
    setErreurs({})
    setCapaciteInfo(null)
  }

  function changerTypePatient(type) {
    setFormulaire((courant) => ({
      ...courant,
      typePatient: type,
      dossierSelectionne: null,
    }))
    setRechercheDossier('')
    setErreurs((courant) => ({ ...courant, dossier: undefined }))
  }

  function selectionnerDossier(dossier) {
    setFormulaire((courant) => ({ ...courant, dossierSelectionne: dossier }))
    setRechercheDossier('')
    setMenuRechercheOuvert(false)
  }

  function validerFormulaire() {
    const nouvellesErreurs = {}

    if (!formulaire.dossierSelectionne) {
      nouvellesErreurs.dossier = 'Veuillez selectionner un dossier patient.'
    }
    if (!formulaire.service) {
      nouvellesErreurs.service = 'Veuillez choisir un service.'
    }
    if (!formulaire.date) {
      nouvellesErreurs.date = 'La date est obligatoire.'
    }
    if (!formulaire.heure) {
      nouvellesErreurs.heure = "L'heure est obligatoire."
    }
    if (!formulaire.motif.trim()) {
      nouvellesErreurs.motif = 'Le motif est obligatoire.'
    }

    setErreurs(nouvellesErreurs)
    return Object.keys(nouvellesErreurs).length === 0
  }

  async function gererSoumission(event) {
    event.preventDefault()

    if (!validerFormulaire()) return
    if (estSature) return

    setEnChargement(true)
    setMessageErreur('')
    setMessageSucces('')

    try {
      await serviceRendezVous.creer({
        date: formulaire.date,
        heure: formulaire.heure,
        typePatient: formulaire.typePatient,
        nomPatient: formulaire.dossierSelectionne.nomAffichage,
        numeroDossier: formulaire.dossierSelectionne.reference,
        service: formulaire.service,
        typeRendezVous: estSurprise ? 'Surprise' : 'Consultation',
        statut: estSurprise ? 'Arrive' : 'Prevu',
        motif: formulaire.motif.trim(),
        observations: formulaire.observations.trim() || undefined,
      })

      setMessageSucces(
        estSurprise
          ? "L'arrivee a ete enregistree avec succes."
          : 'Rendez-vous planifie avec succes.'
      )
      setTimeout(() => navigate('/rendez-vous'), 1200)
    } catch {
      setMessageErreur("L'enregistrement a echoue. Veuillez reessayer.")
    } finally {
      setEnChargement(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 pb-16 pt-24">
      {/* En-tete */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
          onClick={() => navigate('/rendez-vous')}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour a la liste
        </button>
        <div className="h-5 w-px bg-outline-variant/40" />
        <h1 className="text-xl font-bold text-on-surface">
          {estSurprise ? 'Enregistrer une arrivee surprise' : 'Planifier un rendez-vous'}
        </h1>
      </div>

      {messageSucces ? (
        <Alerte type="succes" titre="Enregistrement reussi">{messageSucces}</Alerte>
      ) : null}
      {messageErreur ? (
        <Alerte type="erreur" titre="Erreur">{messageErreur}</Alerte>
      ) : null}

      <form onSubmit={gererSoumission} noValidate>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* Colonne gauche : formulaire */}
          <div className="space-y-6 lg:col-span-8">

            {/* Section 0 : Type de rendez-vous */}
            <section className="rounded-xl bg-surface-container-low p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">category</span>
                <h2 className="text-base font-bold text-on-surface">Type de rendez-vous</h2>
              </div>

              <div className="flex gap-4">
                {[
                  { valeur: 'Planifie', label: 'Planifie', icone: 'event', description: "Rendez-vous prevu a l'avance" },
                  { valeur: 'Surprise', label: 'Surprise', icone: 'bolt', description: 'Arrivee non planifiee' },
                ].map(({ valeur, label, icone, description }) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => changerTypeRendezVous(valeur)}
                    className={[
                      'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all active:scale-95',
                      formulaire.typeRendezVous === valeur
                        ? valeur === 'Surprise'
                          ? 'border-secondary bg-secondary-container/30 text-on-secondary-container'
                          : 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/30',
                    ].join(' ')}
                  >
                    <span className="material-symbols-outlined text-3xl">{icone}</span>
                    <span className="text-sm font-bold">{label}</span>
                    <span className="text-xs text-center opacity-70">{description}</span>
                  </button>
                ))}
              </div>

              {estSurprise && (
                <div className="flex items-center gap-2 rounded-lg bg-secondary-container/30 px-4 py-2.5 text-sm text-on-secondary-container">
                  <span className="material-symbols-outlined text-base">info</span>
                  La date et l'heure sont pre-remplies avec le moment actuel. Le statut sera automatiquement marque comme &laquo;&nbsp;Arrive&nbsp;&raquo;.
                </div>
              )}
            </section>

            {/* Section 1 : Informations du patient */}
            <section className="rounded-xl bg-surface-container-low p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                <h2 className="text-base font-bold text-on-surface">Informations du patient</h2>
              </div>

              {/* Type de patient */}
              <div className="flex gap-4">
                {[
                  { valeur: 'Mere', label: 'Mere', icone: 'pregnant_woman' },
                  { valeur: 'Enfant', label: 'Enfant', icone: 'child_care' },
                ].map(({ valeur, label, icone }) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => changerTypePatient(valeur)}
                    className={[
                      'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-95',
                      formulaire.typePatient === valeur
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/30',
                    ].join(' ')}
                  >
                    <span className="material-symbols-outlined text-2xl">{icone}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Recherche de dossier */}
              <div className="relative">
                <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
                  Dossier concerne <span className="text-error">*</span>
                </label>

                {formulaire.dossierSelectionne ? (
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3 border border-primary/20">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{formulaire.dossierSelectionne.nomAffichage}</p>
                      <p className="font-mono text-xs text-primary">{formulaire.dossierSelectionne.reference}</p>
                      {formulaire.dossierSelectionne.detail ? (
                        <p className="text-xs text-on-surface-variant">{formulaire.dossierSelectionne.detail}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-outline hover:bg-outline-variant/20 transition-colors"
                      onClick={() => setFormulaire((c) => ({ ...c, dossierSelectionne: null }))}
                      title="Changer de dossier"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative group" ref={rechercheRef}>
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
                    <input
                      type="text"
                      value={recherchedossier}
                      onChange={(e) => { setRechercheDossier(e.target.value); setMenuRechercheOuvert(true) }}
                      onFocus={() => setMenuRechercheOuvert(true)}
                      placeholder="Entrez le nom ou le numero de dossier..."
                      className="w-full rounded-lg border-none bg-surface-container-lowest py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    {menuRechercheOuvert && dossiersFiltres.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-1 shadow-xl">
                        {dossiersFiltres.map((dossier) => (
                          <li key={dossier.id}>
                            <button
                              type="button"
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                              onClick={() => selectionnerDossier(dossier)}
                            >
                              <span className="material-symbols-outlined mt-0.5 text-base text-primary">
                                {dossier.typePatient === 'Mere' ? 'pregnant_woman' : 'child_care'}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-on-surface">{dossier.nomAffichage}</p>
                                <p className="font-mono text-xs text-primary">{dossier.reference}</p>
                                {dossier.detail ? <p className="text-xs text-on-surface-variant">{dossier.detail}</p> : null}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {menuRechercheOuvert && recherchedossier.trim().length >= 2 && dossiersFiltres.length === 0 && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-4 shadow-xl text-center">
                        <p className="text-sm text-on-surface-variant">Aucun dossier trouve pour cette recherche.</p>
                      </div>
                    )}
                  </div>
                )}

                {erreurs.dossier ? (
                  <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.dossier}</p>
                ) : null}
              </div>
            </section>

            {/* Section 2 : Informations du rendez-vous */}
            <section className="rounded-xl bg-surface-container-low p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_note</span>
                <h2 className="text-base font-bold text-on-surface">Informations du rendez-vous</h2>
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
                  Service concerne <span className="text-error">*</span>
                </label>
                <select
                  value={formulaire.service}
                  onChange={(e) => definirChamp('service', e.target.value)}
                  className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selectionnez un service...</option>
                  {SERVICES.map((s) => (
                    <option key={s.valeur} value={s.valeur}>{s.label}</option>
                  ))}
                </select>
                {erreurs.service ? (
                  <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.service}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
                    {estSurprise ? "Date d'arrivee" : 'Date'} <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={formulaire.date}
                    onChange={(e) => definirChamp('date', e.target.value)}
                    min={estSurprise ? undefined : new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {erreurs.date ? (
                    <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.date}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
                    {estSurprise ? "Heure d'arrivee" : 'Heure'} <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    value={formulaire.heure}
                    onChange={(e) => definirChamp('heure', e.target.value)}
                    className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {erreurs.heure ? (
                    <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.heure}</p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Section 3 : Informations complementaires */}
            <section className="rounded-xl bg-surface-container-low p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                <h2 className="text-base font-bold text-on-surface">Informations complementaires</h2>
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
                  Motif du rendez-vous <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formulaire.motif}
                  onChange={(e) => definirChamp('motif', e.target.value)}
                  placeholder={estSurprise ? 'Ex : Douleurs abdominales, Fievre...' : 'Ex : Consultation de routine, Premier trimestre...'}
                  className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                {erreurs.motif ? (
                  <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.motif}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">Observations</label>
                <textarea
                  value={formulaire.observations}
                  onChange={(e) => definirChamp('observations', e.target.value)}
                  rows={4}
                  placeholder="Notes importantes pour le personnel medical..."
                  className="w-full resize-none rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                className="rounded-full px-8 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-container/10"
                onClick={() => navigate('/rendez-vous')}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={enChargement || estSature}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {enChargement ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
                    Enregistrement...
                  </>
                ) : estSurprise ? (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    {"Enregistrer l'arrivee"}
                  </>
                ) : (
                  'Enregistrer le rendez-vous'
                )}
              </button>
            </div>
          </div>

          {/* Colonne droite : capacite */}
          <aside className="sticky top-24 space-y-6 lg:col-span-4">
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-on-surface">Capacite de la journee</h3>
                {chargementCapacite && (
                  <span className="material-symbols-outlined animate-spin text-sm text-primary">autorenew</span>
                )}
              </div>

              {estSurprise ? (
                <div className="rounded-lg bg-secondary-container/20 px-4 py-3">
                  <p className="text-sm font-medium text-on-surface-variant">
                    <span className="material-symbols-outlined mr-1 text-base text-secondary align-middle">info</span>
                    {"La verification de capacite n'est pas bloquante pour un rendez-vous surprise."}
                  </p>
                </div>
              ) : !formulaire.service && !formulaire.date ? (
                <p className="text-sm text-on-surface-variant italic">
                  Choisissez un service et une date pour voir la disponibilite.
                </p>
              ) : !formulaire.service ? (
                <p className="text-sm text-on-surface-variant italic">Choisissez un service.</p>
              ) : !formulaire.date ? (
                <p className="text-sm text-on-surface-variant italic">Choisissez une date.</p>
              ) : capaciteInfo === null && !chargementCapacite ? (
                <div className="rounded-lg bg-surface-container-low px-4 py-3">
                  <p className="text-sm font-medium text-on-surface-variant">
                    <span className="material-symbols-outlined mr-1 text-base text-tertiary align-middle">all_inclusive</span>
                    {"Ce service n'a pas de limite journaliere."}
                  </p>
                </div>
              ) : capaciteInfo ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-on-surface-variant">{capaciteInfo.service}</span>
                    <span className={`font-bold ${capaciteInfo.utilises >= capaciteInfo.maximum ? 'text-error' : 'text-on-surface'}`}>
                      {capaciteInfo.utilises} / {capaciteInfo.maximum}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${CouleurJauge({ pourcentage: pourcentageCapacite })}`}
                      style={{ width: `${pourcentageCapacite}%` }}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {capaciteInfo.maximum - capaciteInfo.utilises > 0
                      ? `${capaciteInfo.maximum - capaciteInfo.utilises} place(s) disponible(s)`
                      : 'Aucune place disponible'}
                  </p>

                  {estSature && (
                    <div className="mt-4 flex gap-3 rounded-xl border border-error/20 bg-error-container/20 p-4">
                      <span className="material-symbols-outlined text-error">warning</span>
                      <p className="text-sm font-medium text-on-error-container">
                        Capacite maximale atteinte pour ce service a cette date. Enregistrement bloque.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Note de confidentialite */}
            <div className="rounded-xl border border-tertiary/15 bg-tertiary/5 px-4 py-3">
              <p className="flex items-start gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-tertiary">shield_locked</span>
                {"Seules les informations administratives sont enregistrees. Aucune donnee clinique n'est saisie ici."}
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}

export default PageCreationRendezVous
