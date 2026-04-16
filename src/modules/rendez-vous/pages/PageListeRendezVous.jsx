import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import serviceRendezVous from '../../../services/api/serviceRendezVous'

const TAILLE_PAGE = 8
const FILTRES_RAPIDES = {
  JOUR: 'jour',
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

  if (statutNormalise === 'termine') {
    return 'bg-secondary-container/40 text-on-secondary-container'
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

  return {
    debut: aujourdHui,
    fin: aujourdHui,
  }
}

// Ce composant affiche la liste administrative des rendez-vous pour la reception avec recherche, filtres et actions rapides.
function PageListeRendezVous() {
  const navigate = useNavigate()

  const [etat, setEtat] = useState({
    chargement: true,
    rendezVous: [],
  })
  const [messageSucces, setMessageSucces] = useState('')
  const [messageErreur, setMessageErreur] = useState('')
  const [pageCourante, setPageCourante] = useState(1)
  const [menuOuvertId, setMenuOuvertId] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef(null)

  // Fermer le menu trois points si on clique en dehors
  useEffect(() => {
    function gererClicExterieur(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOuvertId(null)
      }
    }
    document.addEventListener('mousedown', gererClicExterieur)
    return () => document.removeEventListener('mousedown', gererClicExterieur)
  }, [])
  const [filtres, setFiltres] = useState({
    date: '',
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
  }, [filtres])

  const rendezVousFiltres = useMemo(() => {
    return etat.rendezVous.filter((ligne) => {
      // Si une date specifique est choisie dans le selecteur, elle prime sur le filtre rapide
      if (filtres.date) {
        return ligne.date === filtres.date
      }

      // Sinon appliquer le filtre rapide du jour
      const dateRendezVous = new Date(ligne.date)
      dateRendezVous.setHours(0, 0, 0, 0)
      const plageRapide = creerDateFiltreRapide(filtres.filtreRapide)
      return dateRendezVous >= plageRapide.debut && dateRendezVous <= plageRapide.fin
    })
  }, [etat.rendezVous, filtres])

  const statistiques = useMemo(() => {
    return rendezVousFiltres.reduce(
      (accumulateur, ligne) => {
        accumulateur.total += 1

        if (normaliserTexte(ligne.statut) === 'arrive') {
          accumulateur.arrivees += 1
        }

        return accumulateur
      },
      {
        total: 0,
        arrivees: 0,
      },
    )
  }, [rendezVousFiltres])

  const totalPages = Math.max(1, Math.ceil(rendezVousFiltres.length / TAILLE_PAGE))
  const pageActive = Math.min(pageCourante, totalPages)
  const debut = (pageActive - 1) * TAILLE_PAGE
  const rendezVousPage = rendezVousFiltres.slice(debut, debut + TAILLE_PAGE)

  const gererClicMenu = (ligneId, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    })
    setMenuOuvertId(menuOuvertId === ligneId ? null : ligneId)
  }

  const definirFiltre = (champ, valeur) => {
    setFiltres((courant) => ({
      ...courant,
      [champ]: valeur,
    }))
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
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Gestion des flux</h1>
          <p className="mt-1 text-on-surface-variant">
            Supervisez et organisez les consultations de la journée.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            onClick={() => navigate('/rendez-vous/nouveau')}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      {messageSucces ? <Alerte type="succes" titre="Operation réussie">{messageSucces}</Alerte> : null}
      {messageErreur ? <Alerte type="erreur" titre="Attention">{messageErreur}</Alerte> : null}



      <section className="rounded-3xl bg-surface-container-low p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            className="rounded-full bg-surface-container-lowest px-6 py-2 text-sm font-bold text-primary shadow-sm"
            onClick={() => definirFiltre('date', '')}
          >
            Rendez-vous du jour
          </button>

          <div className="w-56">
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Date</label>
            <input
              type="date"
              value={filtres.date}
              onChange={(event) => definirFiltre('date', event.target.value)}
              className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
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
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Patient</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Service</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Type de RDV</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Statut</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Motif</th>
                    <th className="px-6 py-4 text-right text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/10">
                  {rendezVousPage.map((ligne) => {
                    const estAnnule = normaliserTexte(ligne.statut) === 'annule'
                    return (
                    <tr
                      key={ligne.id}
                      className={[
                        'transition-colors hover:bg-surface-container-low/30',
                        estAnnule ? 'opacity-60' : '',
                      ].join(' ')}
                    >
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{formaterDate(ligne.date)}</td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-primary">{ligne.heure}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{ligne.nomPatient}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${classesBadgeTypePatient(ligne.typePatient)}`}>
                            {ligne.typePatient}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-on-surface-variant">{ligne.service}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">Consultation</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${classesBadgeStatut(ligne.statut)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {ligne.statut}
                        </span>
                        {ligne.arriveeEnregistreeLe && normaliserTexte(ligne.statut) === 'arrive' && (
                          <p className="mt-1 text-[10px] text-on-surface-variant">
                            {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(ligne.arriveeEnregistreeLe))}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm italic text-on-surface-variant">{ligne.motif}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end">
                          {/* Bouton trois points */}
                          <button
                            type="button"
                            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-outline-variant/20"
                            onClick={(event) => gererClicMenu(ligne.id, event)}
                            aria-label="Actions"
                          >
                            <span className="material-symbols-outlined text-xl">more_vert</span>
                          </button>

                          {/* Menu deroulant via portal pour eviter le clipping du overflow-x-auto */}
                          {menuOuvertId === ligne.id && createPortal(
                            <div
                              ref={menuRef}
                              style={{ position: 'fixed', top: menuPosition.top, right: menuPosition.right, zIndex: 9999 }}
                              className="w-52 rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-1 shadow-lg"
                            >
                              <button
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low"
                                onClick={() => { setMenuOuvertId(null); navigate(`/rendez-vous/${ligne.id}`) }}
                              >
                                <span className="material-symbols-outlined text-base text-primary">visibility</span>
                                Voir les détails
                              </button>

                              <button
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
                                onClick={() => { setMenuOuvertId(null); gererEnregistrerArrivee(ligne.id) }}
                                disabled={!peutEnregistrerArrivee(ligne.statut)}
                              >
                                <span className="material-symbols-outlined text-base text-tertiary">how_to_reg</span>
                                <span className={peutEnregistrerArrivee(ligne.statut) ? 'text-on-surface' : 'text-outline'}>
                                  Confirmer l'arrivée
                                </span>
                              </button>
                            </div>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  )})
                  }
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

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border-l-4 border-outline-variant/40 bg-primary-container/30 p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed-variant">Total attendus</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-extrabold text-on-primary-container">{statistiques.total}</span>
            <span className="text-xs font-medium text-primary">patients</span>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-outline-variant/40 bg-tertiary-container/20 p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-tertiary-container">Arrivées enregistrées</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-extrabold text-tertiary-dim">{statistiques.arrivees}</span>
            <span className="text-xs font-medium text-tertiary">patients</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PageListeRendezVous
