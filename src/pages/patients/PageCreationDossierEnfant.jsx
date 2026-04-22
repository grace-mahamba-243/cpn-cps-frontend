import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersEnfants from '../../services/api/serviceDossiersEnfants'
import serviceCpsEnfant from '../../services/api/serviceCpsEnfant'
import serviceAccouchement from '../../services/api/serviceAccouchement'

function genererNumeroFiche() {
  const suffixe = String(Date.now()).slice(-4)
  return `EF-${new Date().getFullYear()}-${suffixe}`
}

function dateDuJourIso() {
  return new Date().toISOString().slice(0, 10)
}

const ETAT_INITIAL = {
  numeroFiche: genererNumeroFiche(),
  nom: '',
  postnom: '',
  prenom: '',
  sexe: '',
  dateNaissance: '',
  nomMere: '',
  nomPere: '',
  telephone: '',
  adresse: '',
  dateEnregistrement: dateDuJourIso(),
}

function Champ({ label, obligatoire = false, erreur, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}{obligatoire ? <span className="text-error"> *</span> : null}
      </span>
      {children}
      {erreur ? <span className="text-xs font-semibold text-error">{erreur}</span> : null}
    </label>
  )
}

const REGEX_NOM = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s\-'.]+$/
const REGEX_TELEPHONE = /^[+0-9]{9,15}$/
const AGE_ENFANT_MAX_MOIS = 59

function valider(formulaire, options = {}) {
  const erreurs = {}
  const aujourdHui = new Date()
  aujourdHui.setHours(0, 0, 0, 0)

  // --- Nom, postnom ---
  if (!formulaire.nom.trim()) {
    erreurs.nom = 'Le nom de l enfant est obligatoire.'
  } else if (formulaire.nom.trim().length < 2) {
    erreurs.nom = 'Le nom doit contenir au moins 2 caractères.'
  }

  if (!formulaire.postnom.trim()) {
    erreurs.postnom = 'Le postnom de l enfant est obligatoire.'
  } else if (formulaire.postnom.trim().length < 2) {
    erreurs.postnom = 'Le postnom doit contenir au moins 2 caractères.'
  }

  if (!formulaire.sexe) {
    erreurs.sexe = 'Le sexe est obligatoire.'
  }

  // --- Date de naissance ---
  if (!formulaire.dateNaissance) {
    erreurs.dateNaissance = 'La date de naissance est obligatoire.'
  } else {
    const naissance = new Date(formulaire.dateNaissance)
    naissance.setHours(0, 0, 0, 0)

    if (naissance > aujourdHui) {
      erreurs.dateNaissance = 'La date de naissance ne peut pas être dans le futur.'
    } else {
      const ageMois =
        (aujourdHui.getFullYear() - naissance.getFullYear()) * 12 +
        (aujourdHui.getMonth() - naissance.getMonth()) -
        (aujourdHui.getDate() < naissance.getDate() ? 1 : 0)
      if (ageMois > AGE_ENFANT_MAX_MOIS) {
        erreurs.dateNaissance = `L'âge maximum pour un dossier enfant est de ${AGE_ENFANT_MAX_MOIS} mois.`
      }

      if (formulaire.dateEnregistrement) {
        const dateEnreg = new Date(formulaire.dateEnregistrement)
        dateEnreg.setHours(0, 0, 0, 0)
        if (naissance > dateEnreg) {
          erreurs.dateNaissance = 'La date de naissance doit être antérieure à la date d enregistrement.'
        }
      }
    }
  }

  // --- Responsable (seulement si pas depuis un accouchement) ---
  if (!options?.depuisAccouchement) {
    if (!formulaire.nomMere.trim()) {
      erreurs.nomMere = 'Le nom de la mère est obligatoire.'
    } else if (formulaire.nomMere.trim().length < 2) {
      erreurs.nomMere = 'Le nom de la mère doit contenir au moins 2 caractères.'
    }
    if (!formulaire.telephone.trim()) {
      erreurs.telephone = 'Le téléphone est obligatoire.'
    } else if (!REGEX_TELEPHONE.test(formulaire.telephone.trim().replace(/\s+/g, ''))) {
      erreurs.telephone = 'Numéro invalide — min. 9 chiffres, chiffres et + uniquement.'
    }
  }

  return erreurs
}

// Ce composant permet à la réception de créer un dossier administratif enfant.
// Quand on vient d'un accouchement, la section Responsables est masquée et pré-remplie depuis la mère.
function PageCreationDossierEnfant() {
  const navigate = useNavigate()
  const { state: locationState } = useLocation()

  // Contexte accouchement — héritage automatique de la mère
  const depuisAccouchement = !!(locationState?.accouchementId)
  const mereNomHerite = locationState?.mereNom ?? ''
  const mereIdHerite = locationState?.mereId ?? null
  const mereTelephoneHerite = locationState?.mereTelephone ?? ''
  const mereAdresseHeritee = locationState?.mereAdresse ?? ''
  const accouchementId = locationState?.accouchementId ?? null
  const [nombreCpsEnfantOuvertsCourant, setNombreCpsEnfantOuvertsCourant] = useState(Number(locationState?.nombreCpsEnfantOuverts ?? 0))
  const nouveauxNesVivants = locationState?.nouveauxNesVivants ?? []

  const [nouveauNeChoisi, setNouveauNeChoisi] = useState(null)

  const [formulaire, setFormulaire] = useState(() => ({
    ...ETAT_INITIAL,
    nomMere: mereNomHerite,
    telephone: mereTelephoneHerite,
    adresse: mereAdresseHeritee,
    dateNaissance: depuisAccouchement ? dateDuJourIso() : '',
  }))
  const [erreurSelection, setErreurSelection] = useState('')
  const [erreurs, setErreurs] = useState({})
  const [messageErreur, setMessageErreur] = useState('')
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  const [etatChoixNouveauxNes, setEtatChoixNouveauxNes] = useState({})
  const [verificationChoixEnCours, setVerificationChoixEnCours] = useState(false)

  useEffect(() => {
    if (!depuisAccouchement || !accouchementId) return
    serviceAccouchement
      .obtenirStatutCps(accouchementId)
      .then((statut) => {
        setNombreCpsEnfantOuvertsCourant(Number(statut?.nombreCpsEnfantOuverts ?? 0))
      })
      .catch(() => {
        // En cas d'erreur réseau, conserver la valeur transmise depuis la navigation.
      })
  }, [depuisAccouchement, accouchementId])

  useEffect(() => {
    let annule = false

    async function verifierChoixNouveauxNes() {
      if (!depuisAccouchement || !accouchementId || nouveauxNesVivants.length === 0) {
        setEtatChoixNouveauxNes({})
        return
      }

      setVerificationChoixEnCours(true)
      try {
        const resultat = await Promise.all(nouveauxNesVivants.map(async (_nn, index) => {
          try {
            const enfantLie = await serviceDossiersEnfants.recupererParAccouchementEtIndex(accouchementId, index)
            if (!enfantLie?.id) {
              return [index, { desactive: false, cpsExistantId: null }]
            }
            const cpsExistant = await serviceCpsEnfant.dossierParEnfantId(enfantLie.id).catch(() => null)
            if (cpsExistant?.id) {
              return [index, { desactive: true, cpsExistantId: cpsExistant.id }]
            }
            return [index, { desactive: false, cpsExistantId: null }]
          } catch {
            return [index, { desactive: false, cpsExistantId: null }]
          }
        }))

        if (!annule) {
          const map = Object.fromEntries(resultat)
          // Fallback robuste: si des CPS sont déjà ouverts pour cet accouchement,
          // on bloque au minimum les premiers choix correspondants.
          for (let index = 0; index < nouveauxNesVivants.length; index += 1) {
            if (index < nombreCpsEnfantOuvertsCourant) {
              map[index] = { desactive: true, cpsExistantId: map[index]?.cpsExistantId ?? null }
            }
          }
          setEtatChoixNouveauxNes(map)
          if (nouveauNeChoisi !== null && map[nouveauNeChoisi]?.desactive) {
            setNouveauNeChoisi(null)
          }
        }
      } finally {
        if (!annule) setVerificationChoixEnCours(false)
      }
    }

    void verifierChoixNouveauxNes()
    return () => {
      annule = true
    }
  }, [depuisAccouchement, accouchementId, nouveauxNesVivants, nouveauNeChoisi, nombreCpsEnfantOuvertsCourant])

  const nomComplet = useMemo(() => {
    return [formulaire.nom, formulaire.postnom, formulaire.prenom].filter(Boolean).join(' ')
  }, [formulaire.nom, formulaire.postnom, formulaire.prenom])

  const mettreAJourChamp = (champ, valeur) => {
    setFormulaire((courant) => ({ ...courant, [champ]: valeur }))
    setErreurs((courant) => {
      if (!courant[champ]) {
        return courant
      }

      const prochainesErreurs = { ...courant }
      delete prochainesErreurs[champ]
      return prochainesErreurs
    })

    if (messageErreur) {
      setMessageErreur('')
    }
  }

  const choisirNouveauNe = (index) => {
    const estDesactive = etatChoixNouveauxNes[index]?.desactive || index < nombreCpsEnfantOuvertsCourant
    if (estDesactive) {
      setErreurSelection('Ce nouveau-né a déjà un dossier CPS enfant ouvert. Son choix est désactivé.')
      return
    }
    const nn = nouveauxNesVivants[index]
    setNouveauNeChoisi(index)
    setErreurSelection('')
    // Pré-remplir sexe depuis les données du nouveau-né
    const sexeMap = { MASCULIN: 'M', FEMININ: 'F' }
    setFormulaire((courant) => ({
      ...courant,
      sexe: sexeMap[nn?.sexeNouveauNe] ?? courant.sexe,
    }))
  }

  const enregistrer = async (event) => {
    event.preventDefault()

    // Bloquer si on vient d'un accouchement et qu'aucun nouveau-né vivant n'est sélectionné
    if (depuisAccouchement && nouveauxNesVivants.length > 0 && nouveauNeChoisi === null) {
      setErreurSelection('Veuillez sélectionner un des nouveau-nés vivants pour ce dossier.')
      return
    }

    // Si ce nouveau-né a déjà un dossier enfant/CPS, redirection directe vers le dossier CPS existant.
    if (depuisAccouchement && accouchementId && nouveauNeChoisi !== null) {
      try {
        const enfantLie = await serviceDossiersEnfants.recupererParAccouchementEtIndex(accouchementId, nouveauNeChoisi)
        if (enfantLie?.id) {
          const cpsExistant = await serviceCpsEnfant.dossierParEnfantId(enfantLie.id).catch(() => null)
          if (cpsExistant?.id) {
            navigate(`/cps-enfant/${cpsExistant.id}`, {
              replace: true,
              state: { messageSucces: 'Ce nouveau-né possède déjà un dossier CPS enfant. Redirection automatique.' },
            })
            return
          }

          navigate('/cps-enfant/nouveau', {
            replace: true,
            state: {
              messageSucces: 'Ce nouveau-né a déjà un dossier enfant. Ouverture du CPS enfant lié.',
              autoOuvrirCps: true,
              enfantPreselectionne: {
                id: enfantLie.id,
                nom: enfantLie.nom,
                postnom: enfantLie.postnom,
                prenom: enfantLie.prenom,
                dateNaissance: enfantLie.dateNaissance,
              },
              prefillCps: {
                mereNom: mereNomHerite || formulaire.nomMere?.trim() || '',
                mereTelephone: mereTelephoneHerite || formulaire.telephone?.trim().replace(/\s+/g, '') || '',
                dateNaissance: enfantLie.dateNaissance || formulaire.dateNaissance,
                typeAccouchement: 'INTERNE',
                poidsNaissanceG: nouveauxNesVivants[nouveauNeChoisi]?.poidsNaissanceG || '',
                scoreApgar1min: nouveauxNesVivants[nouveauNeChoisi]?.scoreApgar1min || '',
                scoreApgar5min: nouveauxNesVivants[nouveauNeChoisi]?.scoreApgar5min || '',
              },
            },
          })
          return
        }
      } catch {
        // Si la vérification échoue, on continue le flux normal de création.
      }
    }

    const erreursTrouvees = valider(formulaire, { depuisAccouchement })
    setErreurs(erreursTrouvees)

    if (Object.keys(erreursTrouvees).length > 0) {
      const details = Object.entries(erreursTrouvees).map(([k, v]) => `${k}: ${v}`).join(' | ')
      setMessageErreur(`Veuillez corriger les champs obligatoires avant de continuer. (${details})`)
      return
    }

    setEstEnregistrement(true)

    try {
      const { numeroFiche, ...reste } = formulaire
      const prenomNettoye = reste.prenom?.trim() || undefined
      const nomMereNettoye = reste.nomMere?.trim() || undefined
      const nomPereNettoye = reste.nomPere?.trim() || undefined
      const telephoneNettoye = reste.telephone?.trim().replace(/\s+/g, '') || undefined
      const adresseNettoyee = reste.adresse?.trim() || undefined
      const payload = {
        ...reste,
        numeroDossier: numeroFiche,
        prenom: prenomNettoye,
        nomMere: nomMereNettoye,
        nomPere: nomPereNettoye,
        telephone: telephoneNettoye,
        adresse: adresseNettoyee,
      }
      if (mereIdHerite) payload.mereId = mereIdHerite
      if (accouchementId) payload.accouchementId = accouchementId
      if (depuisAccouchement && nouveauNeChoisi !== null) payload.indexNouveauNe = nouveauNeChoisi
      let enfantCree
      try {
        enfantCree = await serviceDossiersEnfants.creer(payload)
      } catch (erreurCreation) {
        const msg = (erreurCreation?.message ?? '').toLowerCase()
        if (msg.includes('indexnouveaune should not exist') || msg.includes('property indexnouveaune should not exist')) {
          const payloadCompat = { ...payload }
          delete payloadCompat.indexNouveauNe
          enfantCree = await serviceDossiersEnfants.creer(payloadCompat)
        } else {
          throw erreurCreation
        }
      }

      if (accouchementId) {
        const nnSelectionne = nouveauxNesVivants.length > 0
          ? nouveauxNesVivants[nouveauNeChoisi ?? 0]
          : null
        navigate('/cps-enfant/nouveau', {
          replace: true,
          state: {
            messageSucces: `Dossier enfant créé. Ouverture du CPS enfant pour ${nomComplet}.`,
            autoOuvrirCps: true,
            enfantPreselectionne: {
              id: enfantCree?.id,
              nom: enfantCree?.nom,
              postnom: enfantCree?.postnom,
              prenom: enfantCree?.prenom,
              dateNaissance: enfantCree?.dateNaissance,
            },
            prefillCps: {
              mereNom: mereNomHerite || nomMereNettoye || '',
              mereTelephone: mereTelephoneHerite || telephoneNettoye || '',
              dateNaissance: enfantCree?.dateNaissance || formulaire.dateNaissance,
              typeAccouchement: 'INTERNE',
              poidsNaissanceG: nnSelectionne?.poidsNaissanceG || '',
              scoreApgar1min: nnSelectionne?.scoreApgar1min || '',
              scoreApgar5min: nnSelectionne?.scoreApgar5min || '',
            },
          },
        })
      } else {
        navigate('/enfants', {
          replace: true,
          state: {
            messageSucces: `Le dossier administratif de ${nomComplet} a été créé avec succès.`,
          },
        })
      }
      return
    } catch (erreur) {
      const messageServeur = erreur?.message ?? ''
      if (messageServeur.toLowerCase().includes('existe deja') || messageServeur.toLowerCase().includes('deja utilise')) {
        try {
          const recherche = `${formulaire.nom} ${formulaire.postnom}`.trim()
          const candidats = await serviceDossiersEnfants.lister(recherche)
          const cible = candidats.find((enfant) => {
            const memeNom = (enfant.nom ?? '').trim().toLowerCase() === formulaire.nom.trim().toLowerCase()
            const memePostnom = (enfant.postnom ?? '').trim().toLowerCase() === formulaire.postnom.trim().toLowerCase()
            const memeDate = (enfant.dateNaissance ?? '').slice(0, 10) === formulaire.dateNaissance
            return memeNom && memePostnom && memeDate
          })

          if (cible?.id) {
            const cpsExistant = await serviceCpsEnfant.dossierParEnfantId(cible.id).catch(() => null)
            if (cpsExistant?.id) {
              navigate(`/cps-enfant/${cpsExistant.id}`, {
                replace: true,
                state: { messageSucces: 'Le dossier enfant existe déjà. Redirection vers son dossier CPS enfant.' },
              })
              return
            }

            navigate('/cps-enfant/nouveau', {
              replace: true,
              state: {
                messageSucces: 'Le dossier enfant existe déjà. Ouverture du CPS enfant pour cet enfant.',
                autoOuvrirCps: true,
                enfantPreselectionne: {
                  id: cible.id,
                  nom: cible.nom,
                  postnom: cible.postnom,
                  prenom: cible.prenom,
                  dateNaissance: cible.dateNaissance,
                },
                prefillCps: {
                  mereNom: mereNomHerite || formulaire.nomMere?.trim() || '',
                  mereTelephone: mereTelephoneHerite || formulaire.telephone?.trim().replace(/\s+/g, '') || '',
                  dateNaissance: cible.dateNaissance || formulaire.dateNaissance,
                  typeAccouchement: 'INTERNE',
                  poidsNaissanceG: nouveauxNesVivants[nouveauNeChoisi ?? 0]?.poidsNaissanceG || '',
                  scoreApgar1min: nouveauxNesVivants[nouveauNeChoisi ?? 0]?.scoreApgar1min || '',
                  scoreApgar5min: nouveauxNesVivants[nouveauNeChoisi ?? 0]?.scoreApgar5min || '',
                },
              },
            })
            return
          }
        } catch {
          // En cas d'échec de recherche, on garde le message serveur d'origine.
        }
        setMessageErreur(messageServeur)
      } else if (messageServeur.trim()) {
        setMessageErreur(messageServeur)
      } else {
        setMessageErreur('L enregistrement a échoué. Veuillez réessayer.')
      }
      setEstEnregistrement(false)
      return
    }

    setEstEnregistrement(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Enfants</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-medium text-primary">Nouveau Dossier Administratif</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">Centre de Santé Afia Himbi</h2>
          <p className="mt-1 text-on-surface-variant">Enregistrement d un nouveau profil administratif pour enfant.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
          onClick={() => navigate('/enfants')}
        >
          Retour à la liste
        </button>
      </div>

      {messageErreur ? (
        <Alerte type="erreur" titre="Vérification nécessaire">
          {messageErreur}
        </Alerte>
      ) : null}

      <form className="space-y-6" onSubmit={enregistrer}>

        {/* Sélection du nouveau-né — visible quand on vient d'un accouchement avec au moins un vivant */}
        {depuisAccouchement && nouveauxNesVivants.length > 0 && (
          <section className="rounded-xl border-l-4 border-tertiary/50 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">child_care</span>
              <h3 className="text-lg font-bold tracking-tight text-on-surface">Sélectionner le nouveau-né</h3>
            </div>
            <p className="mb-4 text-sm text-on-surface-variant">
              Choisissez le nouveau-né vivant pour lequel vous créez ce dossier. Le sexe sera pré-rempli automatiquement.
            </p>
            {erreurSelection && (
              <p className="mb-4 flex items-center gap-1 text-sm text-error">
                <span className="material-symbols-outlined text-base">error</span>
                {erreurSelection}
              </p>
            )}
            <div className="space-y-2">
              {verificationChoixEnCours && (
                <p className="text-xs text-on-surface-variant">Vérification des dossiers CPS existants…</p>
              )}
              {nouveauxNesVivants.map((nn, index) => {
                const choisi = nouveauNeChoisi === index
                const desactive = !!etatChoixNouveauxNes[index]?.desactive || index < nombreCpsEnfantOuvertsCourant
                const sexeLabel = nn.sexeNouveauNe === 'MASCULIN' ? 'Masculin' : nn.sexeNouveauNe === 'FEMININ' ? 'Féminin' : 'Inconnu'
                return (
                  <button
                    key={`nn-choix-${index}`}
                    type="button"
                    onClick={() => choisirNouveauNe(index)}
                    disabled={desactive}
                    className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${desactive ? 'cursor-not-allowed opacity-60 border-outline-variant/40 bg-surface-container-low' : choisi ? 'border-primary bg-primary/5' : 'border-outline-variant/60 bg-surface hover:bg-surface-container-low'}`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${choisi ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-base" style={choisi ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        {choisi ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        Nouveau-né {index + 1} — Vivant
                        {desactive ? <span className="ml-2 text-xs font-semibold text-error">(CPS déjà ouvert)</span> : null}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Sexe : {sexeLabel}
                        {nn.poidsNaissanceG ? ` · ${nn.poidsNaissanceG} g` : ''}
                        {nn.scoreApgar1min !== '' && nn.scoreApgar1min != null ? ` · APGAR 1 min : ${nn.scoreApgar1min}` : ''}
                        {nn.scoreApgar5min !== '' && nn.scoreApgar5min != null ? ` · APGAR 5 min : ${nn.scoreApgar5min}` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}
        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">badge</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Identité de l'enfant</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Champ label="Numéro fiche">
              <input
                type="text"
                value={formulaire.numeroFiche}
                readOnly
                disabled
                className="w-full rounded-lg border-none bg-surface-container p-3 text-sm font-semibold outline-none disabled:cursor-not-allowed"
              />
            </Champ>

            <Champ label="Date d enregistrement">
              <input
                type="date"
                value={formulaire.dateEnregistrement}
                readOnly
                disabled
                className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none disabled:cursor-not-allowed"
              />
            </Champ>

            <div className="hidden lg:block" />

            <Champ label="Nom" obligatoire erreur={erreurs.nom}>
              <input type="text" value={formulaire.nom} onChange={(event) => mettreAJourChamp('nom', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </Champ>

            <Champ label="Postnom" obligatoire erreur={erreurs.postnom}>
              <input type="text" value={formulaire.postnom} onChange={(event) => mettreAJourChamp('postnom', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </Champ>

            <Champ label="Prénom">
              <input type="text" value={formulaire.prenom} onChange={(event) => mettreAJourChamp('prenom', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </Champ>

            <Champ label="Sexe" obligatoire erreur={erreurs.sexe}>
              <select value={formulaire.sexe} onChange={(event) => mettreAJourChamp('sexe', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Sélectionner</option>
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </Champ>

            <Champ label="Date de naissance" obligatoire erreur={erreurs.dateNaissance}>
              <input type="date" value={formulaire.dateNaissance} onChange={(event) => mettreAJourChamp('dateNaissance', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </Champ>
          </div>
        </section>

        {/* Section Responsables — masquée si on vient d'un accouchement (héritage auto depuis la mère) */}
        {depuisAccouchement ? (
          <section className="rounded-xl border-l-4 border-primary/30 bg-primary/5 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>family_restroom</span>
              <p className="text-sm font-semibold text-primary">Responsables hérités de l'accouchement</p>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">Mère : <span className="font-semibold text-on-surface">{mereNomHerite || '—'}</span> — Les informations de contact seront complétées depuis le dossier de la mère.</p>
          </section>
        ) : (
          <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">family_restroom</span>
              <h3 className="text-lg font-bold tracking-tight text-on-surface">Responsables</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Champ label="Nom de la mère" obligatoire erreur={erreurs.nomMere}>
                <input type="text" value={formulaire.nomMere} onChange={(event) => mettreAJourChamp('nomMere', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </Champ>

              <Champ label="Nom du père">
                <input type="text" value={formulaire.nomPere} onChange={(event) => mettreAJourChamp('nomPere', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </Champ>

              <Champ label="Téléphone" obligatoire erreur={erreurs.telephone}>
                <input type="tel" value={formulaire.telephone} onChange={(event) => mettreAJourChamp('telephone', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </Champ>

              <Champ label="Adresse">
                <input type="text" value={formulaire.adresse} onChange={(event) => mettreAJourChamp('adresse', event.target.value)} className="w-full rounded-lg border-none bg-surface-container p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </Champ>
            </div>
          </section>
        )}

        <div className="flex justify-end gap-4 border-t border-surface-container-high pt-4">
          <button type="button" className="rounded-full px-8 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest" onClick={() => navigate('/enfants')} disabled={estEnregistrement}>
            Annuler
          </button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70" disabled={estEnregistrement}>
            <span className="material-symbols-outlined">save</span>
            {estEnregistrement ? 'Enregistrement en cours...' : 'Enregistrer le dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PageCreationDossierEnfant