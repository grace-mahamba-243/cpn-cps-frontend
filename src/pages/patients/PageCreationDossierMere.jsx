import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersMeres from '../../services/api/serviceDossiersMeres'

function genererNumeroDossier() {
  const suffixe = String(Date.now()).slice(-4)
  return `#CPN-${new Date().getFullYear()}-${suffixe}`
}

function dateDuJourIso() {
  return new Date().toISOString().slice(0, 10)
}

function calculerAge(dateNaissance) {
  if (!dateNaissance) {
    return ''
  }

  const aujourdHui = new Date()
  const naissance = new Date(dateNaissance)

  if (Number.isNaN(naissance.getTime())) {
    return ''
  }

  let age = aujourdHui.getFullYear() - naissance.getFullYear()
  const mois = aujourdHui.getMonth() - naissance.getMonth()

  if (mois < 0 || (mois === 0 && aujourdHui.getDate() < naissance.getDate())) {
    age -= 1
  }

  return age >= 0 ? String(age) : ''
}

function formaterDateAffichage(dateIso) {
  if (!dateIso) {
    return ''
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

const ETAT_INITIAL_FORMULAIRE = {
  numeroDossier: genererNumeroDossier(),
  dateEnregistrement: dateDuJourIso(),
  nom: '',
  postnom: '',
  prenom: '',
  dateNaissance: '',
  age: '',
  adresse: '',
  telephone: '',
  etatMatrimonial: '',
  nomPartenaire: '',
  occupationFemme: '',
  occupationHomme: '',
  personneUrgence: '',
  telephoneUrgence: '',
  adresseUrgence: '',
}

const REGEX_NOM = /^[a-zA-ZÀ-ÿ\s\-']+$/
const REGEX_TELEPHONE = /^[+0-9]{9,15}$/
const AGE_MERE_MIN = 10
const AGE_MERE_MAX = 60

function validerFormulaire(formulaire) {
  const erreurs = {}
  const aujourdHui = new Date()
  aujourdHui.setHours(0, 0, 0, 0)

  if (!formulaire.numeroDossier.trim()) {
    erreurs.numeroDossier = 'Le numéro dossier est obligatoire.'
  }

  if (!formulaire.dateEnregistrement) {
    erreurs.dateEnregistrement = 'La date d enregistrement est obligatoire.'
  }

  // --- Nom, postnom, prénom ---
  if (!formulaire.nom.trim()) {
    erreurs.nom = 'Le nom est obligatoire.'
  } else if (formulaire.nom.trim().length < 2) {
    erreurs.nom = 'Le nom doit contenir au moins 2 caractères.'
  } else if (!REGEX_NOM.test(formulaire.nom.trim())) {
    erreurs.nom = 'Le nom ne doit contenir que des lettres, espaces ou tirets.'
  }

  if (!formulaire.postnom.trim()) {
    erreurs.postnom = 'Le postnom est obligatoire.'
  } else if (formulaire.postnom.trim().length < 2) {
    erreurs.postnom = 'Le postnom doit contenir au moins 2 caractères.'
  } else if (!REGEX_NOM.test(formulaire.postnom.trim())) {
    erreurs.postnom = 'Le postnom ne doit contenir que des lettres, espaces ou tirets.'
  }

  if (!formulaire.prenom.trim()) {
    erreurs.prenom = 'Le prénom est obligatoire.'
  } else if (formulaire.prenom.trim().length < 2) {
    erreurs.prenom = 'Le prénom doit contenir au moins 2 caractères.'
  } else if (!REGEX_NOM.test(formulaire.prenom.trim())) {
    erreurs.prenom = 'Le prénom ne doit contenir que des lettres, espaces ou tirets.'
  }

  // --- Date de naissance et âge ---
  if (!formulaire.dateNaissance) {
    erreurs.dateNaissance = 'La date de naissance est obligatoire.'
  } else {
    const naissance = new Date(formulaire.dateNaissance)
    naissance.setHours(0, 0, 0, 0)

    if (naissance > aujourdHui) {
      erreurs.dateNaissance = 'La date de naissance ne peut pas être dans le futur.'
    } else {
      const age = Number(formulaire.age)
      if (age < AGE_MERE_MIN) {
        erreurs.dateNaissance = `L'âge minimum pour un enregistrement est de ${AGE_MERE_MIN} ans.`
      } else if (age > AGE_MERE_MAX) {
        erreurs.dateNaissance = `L'âge maximum autorisé est de ${AGE_MERE_MAX} ans.`
      }

      if (formulaire.dateEnregistrement) {
        const dateEnreg = new Date(formulaire.dateEnregistrement)
        dateEnreg.setHours(0, 0, 0, 0)
        if (naissance >= dateEnreg) {
          erreurs.dateNaissance = 'La date de naissance doit être antérieure à la date d enregistrement.'
        }
      }
    }
  }

  // --- Coordonnées ---
  if (!formulaire.adresse.trim()) {
    erreurs.adresse = 'L adresse est obligatoire.'
  } else if (formulaire.adresse.trim().length < 5) {
    erreurs.adresse = 'L adresse doit contenir au moins 5 caractères.'
  }

  if (!formulaire.telephone.trim()) {
    erreurs.telephone = 'Le téléphone est obligatoire.'
  } else if (!REGEX_TELEPHONE.test(formulaire.telephone.trim())) {
    erreurs.telephone = 'Numéro invalide — min. 9 chiffres, chiffres et + uniquement.'
  }

  if (!formulaire.etatMatrimonial.trim()) {
    erreurs.etatMatrimonial = 'L état matrimonial est obligatoire.'
  }

  // --- Contact d urgence ---
  if (!formulaire.personneUrgence.trim()) {
    erreurs.personneUrgence = 'La personne à contacter est obligatoire.'
  } else if (formulaire.personneUrgence.trim().length < 2) {
    erreurs.personneUrgence = 'Le nom du contact doit contenir au moins 2 caractères.'
  }

  if (!formulaire.telephoneUrgence.trim()) {
    erreurs.telephoneUrgence = 'Le téléphone du contact d urgence est obligatoire.'
  } else if (!REGEX_TELEPHONE.test(formulaire.telephoneUrgence.trim())) {
    erreurs.telephoneUrgence = 'Numéro invalide — min. 9 chiffres, chiffres et + uniquement.'
  }

  if (!formulaire.adresseUrgence.trim()) {
    erreurs.adresseUrgence = 'L adresse du contact d urgence est obligatoire.'
  } else if (formulaire.adresseUrgence.trim().length < 5) {
    erreurs.adresseUrgence = 'L adresse doit contenir au moins 5 caractères.'
  }

  return erreurs
}

function ChampFormulaire({
  champ,
  label,
  obligatoire = false,
  erreur,
  className = '',
  aide,
  children,
}) {
  return (
    <label className={[ 'flex flex-col gap-2', className ].filter(Boolean).join(' ')}>
      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
        {obligatoire ? <span className="ml-1 text-error">*</span> : null}
      </span>
      {children}
      {erreur ? <span className="text-xs font-semibold text-error">{erreur}</span> : null}
      {!erreur && aide ? <span className="text-xs text-on-surface-variant">{aide}</span> : null}
      <input type="hidden" name={champ} />
    </label>
  )
}

// Ce composant permet a la receptionniste de creer un dossier administratif mere.
// Il regroupe uniquement les informations non cliniques, avec validation visuelle et etat de chargement.
function PageCreationDossierMere() {
  const navigate = useNavigate()
  const { mereId } = useParams()
  const estModeEdition = Boolean(mereId)
  const [formulaire, setFormulaire] = useState(ETAT_INITIAL_FORMULAIRE)
  const [erreurs, setErreurs] = useState({})
  const [messageErreur, setMessageErreur] = useState('')
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  const [estChargementInitial, setEstChargementInitial] = useState(estModeEdition)

  useEffect(() => {
    let estActif = true

    if (!estModeEdition) {
      setEstChargementInitial(false)
      return () => {
        estActif = false
      }
    }

    const chargerDossierPourEdition = async () => {
      const dossier = await serviceDossiersMeres.recupererParId(mereId)

      if (!estActif) {
        return
      }

      if (!dossier) {
        setMessageErreur('Le dossier à modifier est introuvable.')
        setEstChargementInitial(false)
        return
      }

      setFormulaire({
        numeroDossier: dossier.numeroDossier ?? '',
        dateEnregistrement: dossier.dateEnregistrement ?? dateDuJourIso(),
        nom: dossier.nom ?? '',
        postnom: dossier.postnom ?? '',
        prenom: dossier.prenom ?? '',
        dateNaissance: dossier.dateNaissance ?? '',
        age: dossier.age ? String(dossier.age) : calculerAge(dossier.dateNaissance),
        adresse: dossier.adresse ?? '',
        telephone: dossier.telephone ?? '',
        etatMatrimonial: dossier.etatMatrimonial ?? '',
        nomPartenaire: dossier.nomPartenaire ?? '',
        occupationFemme: dossier.occupationFemme ?? '',
        occupationHomme: dossier.occupationHomme ?? '',
        personneUrgence: dossier.personneUrgence ?? '',
        telephoneUrgence: dossier.telephoneUrgence ?? '',
        adresseUrgence: dossier.adresseUrgence ?? '',
      })
      setEstChargementInitial(false)
    }

    void chargerDossierPourEdition()

    return () => {
      estActif = false
    }
  }, [estModeEdition, mereId])

  useEffect(() => {
    setFormulaire((courant) => ({
      ...courant,
      age: calculerAge(courant.dateNaissance),
    }))
  }, [formulaire.dateNaissance])

  const resumeEnregistrement = useMemo(() => {
    return [formulaire.nom, formulaire.postnom, formulaire.prenom].filter(Boolean).join(' ')
  }, [formulaire.nom, formulaire.postnom, formulaire.prenom])

  const mettreAJourChamp = (champ, valeur) => {
    setFormulaire((courant) => ({
      ...courant,
      [champ]: valeur,
    }))

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

  const annulerSaisie = () => {
    navigate('/patients')
  }

  const revenirAListe = () => {
    navigate('/patients')
  }

  const enregistrerDossier = async (event) => {
    event.preventDefault()

    const erreursTrouvees = validerFormulaire(formulaire)
    setErreurs(erreursTrouvees)

    if (Object.keys(erreursTrouvees).length > 0) {
      setMessageErreur('Veuillez corriger les champs obligatoires avant de continuer.')
      return
    }

    setEstEnregistrement(true)

    try {
      const chargeUtile = {
        numeroDossier: formulaire.numeroDossier,
        dateEnregistrement: formulaire.dateEnregistrement,
        nom: formulaire.nom,
        postnom: formulaire.postnom,
        prenom: formulaire.prenom,
        dateNaissance: formulaire.dateNaissance,
        age: Number(formulaire.age) || 0,
        adresse: formulaire.adresse,
        telephone: formulaire.telephone,
        etatMatrimonial: formulaire.etatMatrimonial,
        nomPartenaire: formulaire.nomPartenaire,
        occupationFemme: formulaire.occupationFemme,
        occupationHomme: formulaire.occupationHomme,
        personneUrgence: formulaire.personneUrgence,
        telephoneUrgence: formulaire.telephoneUrgence,
        adresseUrgence: formulaire.adresseUrgence,
      }

      if (estModeEdition) {
        const dossierMisAJour = await serviceDossiersMeres.modifier(mereId, chargeUtile)

        if (!dossierMisAJour) {
          throw new Error('DOSSIER_INTROUVABLE')
        }
      } else {
        await serviceDossiersMeres.creer(chargeUtile)
      }

      navigate('/patients', {
        replace: true,
        state: {
          messageSucces: estModeEdition
            ? `Le dossier administratif de ${resumeEnregistrement} a été modifié avec succès.`
            : `Le dossier administratif de ${resumeEnregistrement} a été créé avec succès.`,
          numeroDossier: formulaire.numeroDossier,
        },
      })
    } catch (erreur) {
      const messageServeur = erreur?.message ?? ''
      if (messageServeur.toLowerCase().includes('existe deja') || messageServeur.toLowerCase().includes('deja utilise')) {
        setMessageErreur(messageServeur)
      } else {
        setMessageErreur('L enregistrement a échoué. Veuillez réessayer.')
      }
      setEstEnregistrement(false)
      return
    }

    setEstEnregistrement(false)
  }

  if (estChargementInitial) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-20">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier pour modification...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-8 py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Mères</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-medium text-primary">{estModeEdition ? 'Modification Dossier Administratif' : 'Nouveau Dossier Administratif'}</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">Centre de Santé Afia Himbi</h2>
          <p className="mt-1 text-on-surface-variant">
            {estModeEdition
              ? 'Mise à jour du profil administratif de la patiente.'
              : 'Enregistrement d un nouveau profil administratif pour patiente.'}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
          onClick={revenirAListe}
        >
          Retour à la liste
        </button>
      </div>

      {messageErreur ? (
        <Alerte type="erreur" titre="Vérification nécessaire">
          {messageErreur}
        </Alerte>
      ) : null}

      <form className="space-y-6" onSubmit={enregistrerDossier}>
        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">fingerprint</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">1. Identité</h3>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-4 lg:grid-cols-6">
            <ChampFormulaire champ="numeroDossier" label="Numéro de dossier" obligatoire erreur={erreurs.numeroDossier} aide="Généré automatiquement par le système." className="md:col-span-2">
              {/* Harmonisation police avec fiche enfant */}
              <input
                type="text"
                value={formulaire.numeroDossier}
                readOnly
                disabled
                className={[
                  'w-full rounded-lg border-none bg-surface-container-lowest py-5 px-6 font-mono text-xs font-bold text-primary outline-none disabled:cursor-not-allowed disabled:opacity-80',
                  erreurs.numeroDossier ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>

            <ChampFormulaire champ="dateEnregistrement" label="Date d enregistrement" obligatoire erreur={erreurs.dateEnregistrement} className="md:col-span-2">
              {/* Champ désactivé pour empêcher la modification de la date du jour */}
              <input
                type="date"
                value={formulaire.dateEnregistrement}
                disabled
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none disabled:cursor-not-allowed disabled:opacity-80',
                  erreurs.dateEnregistrement ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>

            <ChampFormulaire champ="dateNaissance" label="Né le" obligatoire erreur={erreurs.dateNaissance} className="md:col-span-2">
              <input
                type="date"
                value={formulaire.dateNaissance}
                onChange={(event) => mettreAJourChamp('dateNaissance', event.target.value)}
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                  erreurs.dateNaissance ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>

            <ChampFormulaire champ="nom" label="Nom" obligatoire erreur={erreurs.nom} className="md:col-span-2 lg:col-span-2">
              <input
                type="text"
                value={formulaire.nom}
                onChange={(event) => mettreAJourChamp('nom', event.target.value)}
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                  erreurs.nom ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>

            <ChampFormulaire champ="postnom" label="Postnom" obligatoire erreur={erreurs.postnom} className="md:col-span-2 lg:col-span-2">
              <input
                type="text"
                value={formulaire.postnom}
                onChange={(event) => mettreAJourChamp('postnom', event.target.value)}
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                  erreurs.postnom ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>

            <ChampFormulaire champ="prenom" label="Prénom" obligatoire erreur={erreurs.prenom} className="md:col-span-2 lg:col-span-2">
              <input
                type="text"
                value={formulaire.prenom}
                onChange={(event) => mettreAJourChamp('prenom', event.target.value)}
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                  erreurs.prenom ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h3 className="text-lg font-bold tracking-tight text-on-surface">2. Coordonnées</h3>
            </div>

            <div className="space-y-4">
              <ChampFormulaire champ="adresse" label="Adresse de résidence" obligatoire erreur={erreurs.adresse}>
                <textarea
                  rows={2}
                  value={formulaire.adresse}
                  onChange={(event) => mettreAJourChamp('adresse', event.target.value)}
                  className={[
                    'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                    erreurs.adresse ? 'ring-2 ring-error/20' : '',
                  ].join(' ')}
                />
              </ChampFormulaire>

              <div className="grid grid-cols-2 gap-4">
                <ChampFormulaire champ="telephone" label="Téléphone" obligatoire erreur={erreurs.telephone}>
                  <input
                    type="tel"
                    value={formulaire.telephone}
                    onChange={(event) => mettreAJourChamp('telephone', event.target.value)}
                    className={[
                      'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                      erreurs.telephone ? 'ring-2 ring-error/20' : '',
                    ].join(' ')}
                  />
                </ChampFormulaire>

                <ChampFormulaire champ="etatMatrimonial" label="État matrimonial" obligatoire erreur={erreurs.etatMatrimonial}>
                  <select
                    value={formulaire.etatMatrimonial}
                    onChange={(event) => mettreAJourChamp('etatMatrimonial', event.target.value)}
                    className={[
                      'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                      erreurs.etatMatrimonial ? 'ring-2 ring-error/20' : '',
                    ].join(' ')}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Celibataire">Célibataire</option>
                    <option value="Mariee">Mariée</option>
                    <option value="Union libre">Union libre</option>
                    <option value="Veuve">Veuve</option>
                    <option value="Separee">Séparée</option>
                  </select>
                </ChampFormulaire>
              </div>
            </div>
          </section>

          <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">group</span>
              <h3 className="text-lg font-bold tracking-tight text-on-surface">3. Partenaire &amp; Occupations</h3>
            </div>

            <div className="space-y-4">
              <ChampFormulaire champ="nomPartenaire" label="Nom du partenaire">
                <input
                  type="text"
                  value={formulaire.nomPartenaire}
                  onChange={(event) => mettreAJourChamp('nomPartenaire', event.target.value)}
                  className="w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                />
              </ChampFormulaire>

              <div className="grid grid-cols-2 gap-4">
                <ChampFormulaire champ="occupationFemme" label="Occupation femme">
                  <input
                    type="text"
                    value={formulaire.occupationFemme}
                    onChange={(event) => mettreAJourChamp('occupationFemme', event.target.value)}
                    className="w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </ChampFormulaire>

                <ChampFormulaire champ="occupationHomme" label="Occupation homme">
                  <input
                    type="text"
                    value={formulaire.occupationHomme}
                    onChange={(event) => mettreAJourChamp('occupationHomme', event.target.value)}
                    className="w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </ChampFormulaire>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">emergency</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">4. Contact d'urgence</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            <ChampFormulaire champ="personneUrgence" label="Nom du contact" obligatoire erreur={erreurs.personneUrgence} className="md:col-span-1">
              <input
                type="text"
                value={formulaire.personneUrgence}
                onChange={(event) => mettreAJourChamp('personneUrgence', event.target.value)}
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                  erreurs.personneUrgence ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>

            <ChampFormulaire champ="telephoneUrgence" label="Téléphone d urgence" obligatoire erreur={erreurs.telephoneUrgence} className="md:col-span-1">
              <input
                type="tel"
                value={formulaire.telephoneUrgence}
                onChange={(event) => mettreAJourChamp('telephoneUrgence', event.target.value)}
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                  erreurs.telephoneUrgence ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>

            <ChampFormulaire champ="adresseUrgence" label="Adresse du contact" obligatoire erreur={erreurs.adresseUrgence} className="md:col-span-1 lg:col-span-2">
              <input
                type="text"
                value={formulaire.adresseUrgence}
                onChange={(event) => mettreAJourChamp('adresseUrgence', event.target.value)}
                className={[
                  'w-full rounded-lg border-none bg-surface-container p-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20',
                  erreurs.adresseUrgence ? 'ring-2 ring-error/20' : '',
                ].join(' ')}
              />
            </ChampFormulaire>
          </div>
        </section>

        <div className="flex flex-col items-center justify-end gap-4 border-t border-surface-container-high pt-4 md:flex-row">
          <button
            type="button"
            className="w-full rounded-full px-8 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest md:w-auto"
            onClick={annulerSaisie}
            disabled={estEnregistrement}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
            disabled={estEnregistrement}
          >
            <span className="material-symbols-outlined">save</span>
            {estEnregistrement
              ? 'Enregistrement en cours...'
              : estModeEdition
                ? 'Enregistrer les modifications'
                : 'Enregistrer le dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PageCreationDossierMere