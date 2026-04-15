// Ce composant permet a la receptionniste d'enregistrer rapidement une venue non planifiee.
// Le type rendez-vous est automatiquement marque comme "Surprise" et la capacite n'est pas bloquante.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/api/serviceRendezVous'
import serviceDossiersMeres from '../../../services/api/serviceDossiersMeres'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

// Liste des services disponibles avec capacite journaliere (informative uniquement pour les surprises)
const SERVICES = [
  { valeur: 'Maternite (CPN)', label: 'CPN', labelComplet: 'CPN (Consultation Prénatale)' },
  { valeur: 'CPS Femme', label: 'CPS Femme', labelComplet: 'CPS Femme (Consultation Postnatale)' },
  { valeur: 'Suivi enfant', label: 'Suivi enfant', labelComplet: 'Suivi enfant' },
  { valeur: 'Vaccination', label: 'Vaccination', labelComplet: 'Vaccination' },
  { valeur: 'Laboratoire', label: 'Laboratoire', labelComplet: 'Laboratoire' },
  { valeur: 'Pharmacie', label: 'Pharmacie', labelComplet: 'Pharmacie' },
]

// Valeur par defaut : date du jour, heure courante
function obtenirDateAujourdhui() {
  return new Date().toISOString().split('T')[0]
}

function obtenirHeureMaintenant() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const CHAMPS_VIDES = {
  typePatient: 'Mere',
  dossierSelectionne: null,
  service: '',
  date: obtenirDateAujourdhui(),
  heure: obtenirHeureMaintenant(),
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

function PageCreationRendezVousSurprise() {
  const navigate = useNavigate()
  const rechercheRef = useRef(null)

  const [formulaire, setFormulaire] = useState({ ...CHAMPS_VIDES })
  const [erreurs, setErreurs] = useState({})
  const [messageSucces, setMessageSucces] = useState('')
  const [messageErreur, setMessageErreur] = useState('')
  const [enChargement, setEnChargement] = useState(false)

  // Dossiers
  const [tousLesDossiersMeres, setTousLesDossiersMeres] = useState([])
  const [tousLesDossiersEnfants, setTousLesDossiersEnfants] = useState([])
  const [rechercheDossier, setRechercheDossier] = useState('')
  const [menuRechercheOuvert, setMenuRechercheOuvert] = useState(false)

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

  // Dossiers filtres selon la recherche et le type de patient
  const dossiersFiltres = useMemo(() => {
    const terme = normaliserTexte(rechercheDossier.trim())
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
          detail: d.dateNaissance ? `Née le ${d.dateNaissance}` : '',
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
        detail: d.nomMere ? `Mère : ${d.nomMere}` : '',
        typePatient: 'Enfant',
      }))
  }, [rechercheDossier, formulaire.typePatient, tousLesDossiersMeres, tousLesDossiersEnfants])

  function definirChamp(champ, valeur) {
    setFormulaire((courant) => ({ ...courant, [champ]: valeur }))
    setErreurs((courant) => ({ ...courant, [champ]: undefined }))
  }

  function changerTypePatient(type) {
    setFormulaire({ ...CHAMPS_VIDES, typePatient: type })
    setRechercheDossier('')
    setErreurs({})
  }

  function selectionnerDossier(dossier) {
    setFormulaire((courant) => ({ ...courant, dossierSelectionne: dossier }))
    setRechercheDossier('')
    setMenuRechercheOuvert(false)
  }

  function validerFormulaire() {
    const nouvellesErreurs = {}

    if (!formulaire.dossierSelectionne) {
      nouvellesErreurs.dossier = 'Veuillez sélectionner un dossier patient.'
    }
    if (!formulaire.service) {
      nouvellesErreurs.service = 'Veuillez choisir un service.'
    }
    if (!formulaire.date) {
      nouvellesErreurs.date = "La date d'arrivée est obligatoire."
    }
    if (!formulaire.heure) {
      nouvellesErreurs.heure = "L'heure d'arrivée est obligatoire."
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

    setEnChargement(true)
    setMessageErreur('')
    setMessageSucces('')

    try {
      // Le type est automatiquement "Surprise" et le statut "Arrive" (venue immediate)
      await serviceRendezVous.creer({
        date: formulaire.date,
        heure: formulaire.heure,
        typePatient: formulaire.typePatient,
        nomPatient: formulaire.dossierSelectionne.nomAffichage,
        numeroDossier: formulaire.dossierSelectionne.reference,
        service: formulaire.service,
        typeRendezVous: 'Surprise',
        statut: 'Arrive',
        motif: formulaire.motif.trim(),
        observations: formulaire.observations.trim() || undefined,
      })

      setMessageSucces("L'arrivée a été enregistrée avec succès.")
      setTimeout(() => navigate('/rendez-vous'), 1200)
    } catch {
      setMessageErreur("L'enregistrement a échoué. Veuillez réessayer.")
    } finally {
      setEnChargement(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 pb-16 pt-24">

      {/* En-tête */}
      <div className="flex items-center gap-4 mb-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
          onClick={() => navigate('/rendez-vous')}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour à la liste
        </button>
      </div>

      {/* Titre + badge non planifie */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">
            Enregistrer un rendez-vous surprise
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md">
            Admission rapide pour les patients se présentant sans planification préalable.
          </p>
        </div>
        {/* Badge visuel identifiant le caractere non planifie */}
        <div className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-secondary-container px-5 py-3 text-on-secondary-container shadow-sm">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <span className="text-sm font-bold tracking-wide">RENDEZ-VOUS NON PLANIFIÉ</span>
        </div>
      </header>

      {/* Alertes */}
      {messageSucces ? (
        <Alerte type="succes" titre="Enregistrement réussi">{messageSucces}</Alerte>
      ) : null}
      {messageErreur ? (
        <Alerte type="erreur" titre="Erreur">{messageErreur}</Alerte>
      ) : null}

      <form onSubmit={gererSoumission} noValidate className="space-y-6">

        {/* Section 1 : Informations du patient */}
        <section className="rounded-xl bg-surface-container-lowest p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_search</span>
            <h2 className="text-lg font-bold text-on-surface">Informations du patient</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Type de patient - boutons visuels */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-on-surface-variant">
                Type de patient
              </label>
              <div className="flex gap-4">
                {[
                  { valeur: 'Mere', label: 'Mère', icone: 'pregnant_woman' },
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
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
                    ].join(' ')}
                  >
                    <span className="material-symbols-outlined text-3xl">{icone}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recherche de dossier */}
            <div className="flex flex-col justify-end">
              <label className="mb-2 block text-sm font-semibold text-on-surface-variant">
                Rechercher un dossier <span className="text-error">*</span>
              </label>

              {formulaire.dossierSelectionne ? (
                <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3 border border-primary/20">
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {formulaire.dossierSelectionne.nomAffichage}
                    </p>
                    <p className="font-mono text-xs text-primary">
                      {formulaire.dossierSelectionne.reference}
                    </p>
                    {formulaire.dossierSelectionne.detail ? (
                      <p className="text-xs text-on-surface-variant">
                        {formulaire.dossierSelectionne.detail}
                      </p>
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
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    search
                  </span>
                  <input
                    type="text"
                    value={rechercheDossier}
                    onChange={(e) => {
                      setRechercheDossier(e.target.value)
                      setMenuRechercheOuvert(true)
                    }}
                    onFocus={() => setMenuRechercheOuvert(true)}
                    placeholder="Nom, ID ou Numéro de téléphone..."
                    className="w-full rounded-xl border-none bg-surface-container py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant transition-all"
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
                              {dossier.detail ? (
                                <p className="text-xs text-on-surface-variant">{dossier.detail}</p>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {menuRechercheOuvert && rechercheDossier.trim().length >= 2 && dossiersFiltres.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-4 shadow-xl text-center">
                      <p className="text-sm text-on-surface-variant">
                        Aucun dossier trouvé pour cette recherche.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {erreurs.dossier ? (
                <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.dossier}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Section 2 : Informations du rendez-vous */}
        <section className="rounded-xl bg-surface-container-lowest p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">medical_services</span>
            <h2 className="text-lg font-bold text-on-surface">Informations du rendez-vous</h2>
          </div>

          {/* Service concerne - radio buttons visuels */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-on-surface-variant">
              Service concerné <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SERVICES.map((svc) => (
                <label key={svc.valeur} className="cursor-pointer group">
                  <input
                    type="radio"
                    name="service"
                    value={svc.valeur}
                    checked={formulaire.service === svc.valeur}
                    onChange={() => definirChamp('service', svc.valeur)}
                    className="peer hidden"
                  />
                  <div className="rounded-xl border border-outline-variant px-4 py-3 text-center text-sm transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary group-hover:bg-surface-container">
                    {svc.label}
                  </div>
                </label>
              ))}
            </div>
            {erreurs.service ? (
              <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.service}</p>
            ) : null}
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface-variant">
                Date d'arrivée <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={formulaire.date}
                onChange={(e) => definirChamp('date', e.target.value)}
                className="w-full rounded-xl border-none bg-surface-container px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {erreurs.date ? (
                <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.date}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface-variant">
                Heure d'arrivée <span className="text-error">*</span>
              </label>
              <input
                type="time"
                value={formulaire.heure}
                onChange={(e) => definirChamp('heure', e.target.value)}
                className="w-full rounded-xl border-none bg-surface-container px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {erreurs.heure ? (
                <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.heure}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Section 3 : Informations complementaires */}
        <section className="rounded-xl bg-surface-container-lowest p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            <h2 className="text-lg font-bold text-on-surface">Informations complémentaires</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-on-surface-variant">
              Motif du rendez-vous <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formulaire.motif}
              onChange={(e) => definirChamp('motif', e.target.value)}
              placeholder="Ex : Douleurs abdominales, Fièvre..."
              className="w-full rounded-xl border-none bg-surface-container px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant transition-all"
            />
            {erreurs.motif ? (
              <p className="mt-1.5 ml-1 text-xs font-medium text-error">{erreurs.motif}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-on-surface-variant">
              Observations
            </label>
            <textarea
              value={formulaire.observations}
              onChange={(e) => definirChamp('observations', e.target.value)}
              rows={4}
              placeholder="Notes additionnelles ou précisions..."
              className="w-full resize-none rounded-xl border-none bg-surface-container px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant transition-all"
            />
          </div>

          {/* Note de confidentialite */}
          <div className="rounded-xl border border-tertiary/15 bg-tertiary/5 px-4 py-3">
            <p className="flex items-start gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-tertiary">shield_locked</span>
              Seules les informations administratives sont enregistrées. Aucune donnée clinique n'est saisie ici.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col items-center justify-end gap-4 pb-8 sm:flex-row">
          <button
            type="button"
            className="w-full rounded-full px-8 py-4 text-sm font-bold text-primary transition-colors hover:bg-primary/10 active:scale-95 sm:w-auto"
            onClick={() => navigate('/rendez-vous')}
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={enChargement}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-10 py-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-dim active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {enChargement ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
                Enregistrement...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">login</span>
                Enregistrer l'arrivée
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PageCreationRendezVousSurprise
