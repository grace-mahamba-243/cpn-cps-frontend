import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/donnees-simulees/serviceRendezVous'

const TAILLE_PAGE = 8
const FILTRES_RAPIDES = {
  JOUR: 'jour',
  DEMAIN: 'demain',
  SEMAINE: 'semaine',
}

function normaliserTexte(valeur = '') {
  return valeur
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function dateIsoLocale(date) {
  const annee = date.getFullYear()
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const jour = String(date.getDate()).padStart(2, '0')
  return `${annee}-${mois}-${jour}`
}

function formaterDate(dateIso) {
  if (!dateIso) {
    return '-'
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

function classesBadgeStatut(statut) {
  const statutNormalise = normaliserTexte(statut)

  if (statutNormalise === 'arrive') {
    return 'bg-tertiary-container/30 text-tertiary-dim'
  }

  if (statutNormalise === 'surprise') {
    return 'bg-error-container text-on-error-container'
  }

  if (statutNormalise === 'annule') {
    return 'bg-outline-variant/20 text-outline'
  }

  if (statutNormalise === 'reprogramme') {
    return 'bg-primary-container/30 text-on-primary-fixed-variant'
  }

  return 'bg-surface-container text-on-surface-variant'
}

function classesBadgeTypePatient(typePatient) {
  if (normaliserTexte(typePatient) === 'enfant') {
    return 'bg-secondary-fixed text-on-secondary-fixed-variant'
  }

  return 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
}

function peutEnregistrerArrivee(statut) {
  const statutNormalise = normaliserTexte(statut)
  return statutNormalise !== 'arrive' && statutNormalise !== 'annule' && statutNormalise !== 'termine'
}

function creerDateFiltreRapide(filtreRapide) {
  const aujourdHui = new Date()
  aujourdHui.setHours(0, 0, 0, 0)

  if (filtreRapide === FILTRES_RAPIDES.JOUR) {
    return {
      debut: aujourdHui,
      fin: aujourdHui,
    }
  }

  if (filtreRapide === FILTRES_RAPIDES.DEMAIN) {
    const demain = new Date(aujourdHui)
    demain.setDate(demain.getDate() + 1)

    return {
      debut: demain,
      fin: demain,
    }
  }

  const finSemaine = new Date(aujourdHui)
  finSemaine.setDate(finSemaine.getDate() + 6)

  return {
    debut: aujourdHui,
    fin: finSemaine,
  }
}

async function creerRendezVousDepuisAction({ estSurprise }) {
  const maintenant = new Date()
  const date = dateIsoLocale(maintenant)
  const heure = `${String(maintenant.getHours()).padStart(2, '0')}:${String(maintenant.getMinutes()).padStart(2, '0')}`

  return serviceRendezVous.creer({
    date,
    heure,
    typePatient: estSurprise ? 'Mere' : 'Enfant',
    nomPatient: estSurprise ? 'Patiente sans rendez-vous' : 'Patient a confirmer',
    numeroDossier: estSurprise ? '#CPN-EN-ATTENTE' : '#DOSSIER-A-CONFIRMER',
    service: estSurprise ? 'Gynecologie' : 'Pediatrie (CPS)',
    typeRendezVous: estSurprise ? 'Urgence / Surprise' : 'Consultation',
    statut: estSurprise ? 'Surprise' : 'Prevu',
    motif: estSurprise ? 'Accueil non planifie' : 'Nouveau rendez-vous reception',
  })
}

// Ce composant affiche la liste administrative des rendez-vous pour la reception avec recherche, filtres et actions rapides.
function PageListeRendezVous() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rechercheNavbar = normaliserTexte((searchParams.get('q') ?? '').trim())

  const [etat, setEtat] = useState({
    chargement: true,
    rendezVous: [],
  })
  const [messageSucces, setMessageSucces] = useState('')
  const [messageErreur, setMessageErreur] = useState('')
  const [pageCourante, setPageCourante] = useState(1)
  const [filtres, setFiltres] = useState({
    recherche: '',
    date: '',
    service: '',
    statut: '',
    typeRendezVous: '',
    filtreRapide: FILTRES_RAPIDES.JOUR,
  })

  useEffect(() => {
    let estActif = true

    const chargerListe = async () => {
      setEtat((courant) => ({ ...courant, chargement: true }))

      try {
        const lignes = await serviceRendezVous.lister()

        if (!estActif) {
          return
        }

        setEtat({
          chargement: false,
          rendezVous: lignes,
        })
      } catch {
        if (!estActif) {
          return
        }

        setEtat({
          chargement: false,
          rendezVous: [],
        })
        setMessageErreur('Le chargement des rendez-vous a échoué. Veuillez réessayer.')
      }
    }

    void chargerListe()

    return () => {
      estActif = false
    }
  }, [])

  useEffect(() => {
    setPageCourante(1)
  }, [filtres, rechercheNavbar])

  const rendezVousFiltres = useMemo(() => {
    const rechercheGlobale = normaliserTexte([rechercheNavbar, filtres.recherche].filter(Boolean).join(' '))

    return etat.rendezVous.filter((ligne) => {
      const dateRendezVous = new Date(ligne.date)
      dateRendezVous.setHours(0, 0, 0, 0)

      const matchRecherche =
        !rechercheGlobale ||
        [ligne.nomPatient, ligne.numeroDossier, ligne.service]
          .filter(Boolean)
          .some((valeur) => normaliserTexte(valeur).includes(rechercheGlobale))

      const matchService = !filtres.service || normaliserTexte(ligne.service) === normaliserTexte(filtres.service)
      const matchStatut = !filtres.statut || normaliserTexte(ligne.statut) === normaliserTexte(filtres.statut)
      const matchType =
        !filtres.typeRendezVous ||
        normaliserTexte(ligne.typeRendezVous) === normaliserTexte(filtres.typeRendezVous)

      const matchDate = !filtres.date || ligne.date === filtres.date

      if (matchDate) {
        return matchRecherche && matchService && matchStatut && matchType
      }

      const plageRapide = creerDateFiltreRapide(filtres.filtreRapide)
      const matchFiltreRapide = dateRendezVous >= plageRapide.debut && dateRendezVous <= plageRapide.fin

      return matchRecherche && matchService && matchStatut && matchType && matchFiltreRapide
    })
  }, [etat.rendezVous, filtres, rechercheNavbar])

  const statistiques = useMemo(() => {
    return rendezVousFiltres.reduce(
      (accumulateur, ligne) => {
        accumulateur.total += 1

        if (normaliserTexte(ligne.statut) === 'surprise') {
          accumulateur.surprises += 1
        }

        if (normaliserTexte(ligne.statut) === 'arrive') {
          accumulateur.arrivees += 1
        }

        return accumulateur
      },
      {
        total: 0,
        surprises: 0,
        arrivees: 0,
      },
    )
  }, [rendezVousFiltres])

  const servicesDisponibles = useMemo(() => {
    return Array.from(new Set(etat.rendezVous.map((ligne) => ligne.service))).sort((a, b) => a.localeCompare(b))
  }, [etat.rendezVous])

  const statutsDisponibles = useMemo(() => {
    return Array.from(new Set(etat.rendezVous.map((ligne) => ligne.statut))).sort((a, b) => a.localeCompare(b))
  }, [etat.rendezVous])

  const typesDisponibles = useMemo(() => {
    return Array.from(new Set(etat.rendezVous.map((ligne) => ligne.typeRendezVous))).sort((a, b) => a.localeCompare(b))
  }, [etat.rendezVous])

  const totalPages = Math.max(1, Math.ceil(rendezVousFiltres.length / TAILLE_PAGE))
  const pageActive = Math.min(pageCourante, totalPages)
  const debut = (pageActive - 1) * TAILLE_PAGE
  const rendezVousPage = rendezVousFiltres.slice(debut, debut + TAILLE_PAGE)

  const definirFiltre = (champ, valeur) => {
    setFiltres((courant) => ({
      ...courant,
      [champ]: valeur,
    }))
  }

  const gererCreation = async ({ estSurprise }) => {
    try {
      const cree = await creerRendezVousDepuisAction({ estSurprise })

      setEtat((courant) => ({
        ...courant,
        rendezVous: [cree, ...courant.rendezVous],
      }))

      setMessageErreur('')
      setMessageSucces(
        estSurprise
          ? 'Rendez-vous surprise ajouté avec succès.'
          : 'Nouveau rendez-vous ajouté avec succès.',
      )
    } catch {
      setMessageErreur('La création du rendez-vous a échoué. Veuillez réessayer.')
      setMessageSucces('')
    }
  }

  const gererEnregistrerArrivee = async (rendezVousId) => {
    try {
      const misAJour = await serviceRendezVous.enregistrerArrivee(rendezVousId)

      if (!misAJour) {
        setMessageErreur('Ce rendez-vous est introuvable.')
        setMessageSucces('')
        return
      }

      setEtat((courant) => ({
        ...courant,
        rendezVous: courant.rendezVous.map((ligne) => (ligne.id === rendezVousId ? misAJour : ligne)),
      }))
      setMessageErreur('')
      setMessageSucces(`Arrivee enregistrée pour ${misAJour.nomPatient}.`)
    } catch {
      setMessageErreur('Impossible d enregistrer l arrivée pour le moment.')
      setMessageSucces('')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-24">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Liste des rendez-vous</h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">
            Consultez et organisez les rendez-vous administratifs sans exposition des informations cliniques.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-6 py-3 text-sm font-semibold text-on-secondary-container transition-opacity hover:opacity-90"
            onClick={() => gererCreation({ estSurprise: true })}
          >
            <span className="material-symbols-outlined text-base">add_alert</span>
            Rendez-vous surprise
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            onClick={() => gererCreation({ estSurprise: false })}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      {messageSucces ? <Alerte type="succes" titre="Operation réussie">{messageSucces}</Alerte> : null}
      {messageErreur ? <Alerte type="erreur" titre="Attention">{messageErreur}</Alerte> : null}

      <div className="rounded-3xl border border-tertiary/15 bg-tertiary/5 px-5 py-4 text-sm text-on-surface-variant">
        <p className="flex items-start gap-3">
          <span className="material-symbols-outlined text-base text-tertiary">shield_locked</span>
          Seules les donnees administratives sont visibles. Les informations cliniques du service de rendez-vous ne sont pas affichées.
        </p>
      </div>

      <section className="rounded-3xl bg-surface-container-low p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-outline-variant/20 pb-6">
          <button
            type="button"
            className={[
              'rounded-full px-6 py-2 text-sm transition-colors',
              filtres.filtreRapide === FILTRES_RAPIDES.JOUR
                ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                : 'font-medium text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
            onClick={() => definirFiltre('filtreRapide', FILTRES_RAPIDES.JOUR)}
          >
            Rendez-vous du jour
          </button>
          <button
            type="button"
            className={[
              'rounded-full px-6 py-2 text-sm transition-colors',
              filtres.filtreRapide === FILTRES_RAPIDES.DEMAIN
                ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                : 'font-medium text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
            onClick={() => definirFiltre('filtreRapide', FILTRES_RAPIDES.DEMAIN)}
          >
            Demain
          </button>
          <button
            type="button"
            className={[
              'rounded-full px-6 py-2 text-sm transition-colors',
              filtres.filtreRapide === FILTRES_RAPIDES.SEMAINE
                ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                : 'font-medium text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
            onClick={() => definirFiltre('filtreRapide', FILTRES_RAPIDES.SEMAINE)}
          >
            Cette semaine
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Recherche</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                value={filtres.recherche}
                onChange={(event) => definirFiltre('recherche', event.target.value)}
                placeholder="Nom, numero dossier, service..."
                className="w-full rounded-xl border-none bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Date</label>
            <input
              type="date"
              value={filtres.date}
              onChange={(event) => definirFiltre('date', event.target.value)}
              className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Service</label>
            <select
              value={filtres.service}
              onChange={(event) => definirFiltre('service', event.target.value)}
              className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tous les services</option>
              {servicesDisponibles.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Statut</label>
            <select
              value={filtres.statut}
              onChange={(event) => definirFiltre('statut', event.target.value)}
              className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tous les statuts</option>
              {statutsDisponibles.map((statut) => (
                <option key={statut} value={statut}>{statut}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Type de rendez-vous</label>
            <select
              value={filtres.typeRendezVous}
              onChange={(event) => definirFiltre('typeRendezVous', event.target.value)}
              className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tous les types</option>
              {typesDisponibles.map((typeRendezVous) => (
                <option key={typeRendezVous} value={typeRendezVous}>{typeRendezVous}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-surface-container-lowest shadow-sm">
        {etat.chargement ? (
          <div className="flex items-center gap-3 px-6 py-10 text-on-surface-variant">
            <span className="material-symbols-outlined">hourglass_top</span>
            <p>Chargement des rendez-vous...</p>
          </div>
        ) : rendezVousPage.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline-variant">event_busy</span>
            <div className="space-y-1">
              <p className="text-lg font-bold text-on-surface">Aucun resultat</p>
              <p className="text-sm">Aucun rendez-vous ne correspond aux criteres appliques.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Date</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Heure</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Type patient</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Nom patient</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Service</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Type RDV</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Statut</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Motif</th>
                    <th className="px-6 py-4 text-right text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/10">
                  {rendezVousPage.map((ligne) => (
                    <tr key={ligne.id} className="transition-colors hover:bg-surface-container-low/30">
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{formaterDate(ligne.date)}</td>
                      <td className="px-6 py-5"><span className="text-sm font-bold text-primary">{ligne.heure}</span></td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${classesBadgeTypePatient(ligne.typePatient)}`}>
                          {ligne.typePatient}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{ligne.nomPatient}</p>
                          <p className="font-mono text-xs text-primary">{ligne.numeroDossier}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-on-surface-variant">{ligne.service}</td>
                      <td className="px-6 py-5 text-sm text-on-surface">{ligne.typeRendezVous}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${classesBadgeStatut(ligne.statut)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {ligne.statut}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm italic text-on-surface-variant">{ligne.motif}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                            onClick={() => navigate(`/rendez-vous/${ligne.id}`)}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Voir detail
                          </button>

                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => gererEnregistrerArrivee(ligne.id)}
                            disabled={!peutEnregistrerArrivee(ligne.statut)}
                          >
                            <span className="material-symbols-outlined text-sm">login</span>
                            Arrivee
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-surface-container-low px-6 py-4">
              <p className="text-xs font-medium text-on-surface-variant">
                Affichage de <span className="font-bold">{rendezVousFiltres.length === 0 ? 0 : debut + 1}</span> a{' '}
                <span className="font-bold">{Math.min(debut + TAILLE_PAGE, rendezVousFiltres.length)}</span> sur{' '}
                <span className="font-bold">{rendezVousFiltres.length}</span> rendez-vous
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-highest disabled:opacity-30"
                  onClick={() => setPageCourante((courant) => Math.max(1, courant - 1))}
                  disabled={pageActive === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                <span className="px-3 text-xs font-bold text-primary">{pageActive}</span>

                <button
                  type="button"
                  className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-highest disabled:opacity-30"
                  onClick={() => setPageCourante((courant) => Math.min(totalPages, courant + 1))}
                  disabled={pageActive === totalPages}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border-l-4 border-primary bg-primary-container/30 p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed-variant">Total filtres</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-extrabold text-on-primary-container">{statistiques.total}</span>
            <span className="text-xs font-medium text-primary">rendez-vous</span>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-tertiary bg-tertiary-container/20 p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-tertiary-container">Arrivees enregistrees</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-extrabold text-tertiary-dim">{statistiques.arrivees}</span>
            <span className="text-xs font-medium text-tertiary">patients</span>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-error bg-error-container/10 p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-error-container">Surprises</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-extrabold text-error">{statistiques.surprises}</span>
            <span className="text-xs font-medium text-error-dim">urgences</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PageListeRendezVous
