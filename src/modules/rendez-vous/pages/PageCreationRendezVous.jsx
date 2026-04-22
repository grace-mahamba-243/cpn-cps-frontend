// Ce composant permet a la receptionniste de planifier un nouveau rendez-vous pour une patiente.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/api/serviceRendezVous'
import serviceDossiersMeres from '../../../services/api/serviceDossiersMeres'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

// Services disponibles selon le type de patient
const SERVICES_MERE = [
  { valeur: 'Maternite (CPN)', label: 'CPN (Consultation Prenatale)' },
  { valeur: 'CPS Femme', label: 'CPS Femme (Consultation Postnatale)' },
]

const SERVICES_ENFANT = [
  { valeur: 'Suivi enfant', label: 'Suivi enfant' },
]

function obtenirDateAujourdhui() {
  return new Date().toISOString().split('T')[0]
}

function obtenirHeureMaintenant() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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

function PageCreationRendezVous() {
  const navigate = useNavigate()
  const rechercheRef = useRef(null)

  const [formulaire, setFormulaire] = useState(() => ({
    typePatient: 'Mere',
    dossierSelectionne: null,
    service: '',
    date: obtenirDateAujourdhui(),
    heure: obtenirHeureMaintenant(),
    motif: '',
    observations: '',
  }))
  const [erreurs, setErreurs] = useState({})
  const [messageSucces, setMessageSucces] = useState('')
  const [messageErreur, setMessageErreur] = useState('')
  const [enChargement, setEnChargement] = useState(false)

  // Etat dossiers
  const [tousLesDossiersMeres, setTousLesDossiersMeres] = useState([])
  const [tousLesDossiersEnfants, setTousLesDossiersEnfants] = useState([])
  const [recherchedossier, setRechercheDossier] = useState('')
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

  // Services disponibles selon le type de patient
  const servicesFiltres = useMemo(() => {
    return formulaire.typePatient === 'Mere' ? SERVICES_MERE : SERVICES_ENFANT
  }, [formulaire.typePatient])

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

  function definirChamp(champ, valeur) {
    setFormulaire((courant) => ({ ...courant, [champ]: valeur }))
    setErreurs((courant) => ({ ...courant, [champ]: undefined }))
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
      await serviceRendezVous.creer({
        date: formulaire.date,
        heure: formulaire.heure,
        typePatient: formulaire.typePatient,
        nomPatient: formulaire.dossierSelectionne.nomAffichage,
        numeroDossier: formulaire.dossierSelectionne.reference,
        service: formulaire.service,
        typeRendezVous: 'Consultation',
        statut: 'Arrive',
        motif: formulaire.motif.trim(),
        observations: formulaire.observations.trim() || undefined,
      })

      setMessageSucces('Rendez-vous planifie avec succes.')
      setTimeout(() => navigate('/rendez-vous'), 1200)
    } catch {
      setMessageErreur("L'enregistrement a echoue. Veuillez reessayer.")
    } finally {
      setEnChargement(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 pb-16 pt-2">
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
        <h1 className="text-xl font-bold text-on-surface">Planifier un rendez-vous</h1>
      </div>

      {messageSucces ? (
        <Alerte type="succes" titre="Enregistrement reussi">{messageSucces}</Alerte>
      ) : null}
      {messageErreur ? (
        <Alerte type="erreur" titre="Erreur">{messageErreur}</Alerte>
      ) : null}

      <form onSubmit={gererSoumission} noValidate>
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Formulaire */}
          <div className="space-y-6">

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
                        ? 'border-outline-variant/50 bg-primary/5 text-primary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:border-outline-variant/50',
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
                  Dossier concerne
                </label>

                {formulaire.dossierSelectionne ? (
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3 border border-outline-variant/50">
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
                      className="w-full rounded-lg border-2 border-primary/40 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
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
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-4 shadow-xl">
                        <p className="text-sm text-on-surface-variant mb-3">Aucun dossier trouve pour cette recherche.</p>
                        {formulaire.typePatient === 'Mere' && (
                        <button
                          type="button"
                          onClick={() => navigate('/patients/nouveau')}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">person_add</span>
                          Creer un nouveau dossier mere
                        </button>
                        )}
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
                  Service concerne
                </label>
                <select
                  value={formulaire.service}
                  onChange={(e) => definirChamp('service', e.target.value)}
                  className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selectionnez un service...</option>
                  {servicesFiltres.map((s) => (
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
                    Date
                  </label>
                  <input
                    type="date"
                    value={formulaire.date}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border-none bg-surface-container px-4 py-3 text-sm text-on-surface-variant outline-none opacity-70"
                  />
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block text-sm font-semibold text-on-surface-variant">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={formulaire.heure}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border-none bg-surface-container px-4 py-3 text-sm text-on-surface-variant outline-none opacity-70"
                  />
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
                  Motif du rendez-vous
                </label>
                <input
                  type="text"
                  value={formulaire.motif}
                  onChange={(e) => definirChamp('motif', e.target.value)}
                  placeholder="Ex : Consultation de routine, Premier trimestre..."
                  className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
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
                disabled={enChargement}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {enChargement ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
                    Planification...
                  </>
                ) : (
                  'Enregistrer le rendez-vous'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PageCreationRendezVous
