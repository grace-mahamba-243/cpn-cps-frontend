import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersEnfants from '../../services/api/serviceDossiersEnfants'

const TAILLE_PAGE = 8

function normaliserTexte(valeur = '') {
  return valeur
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function construireNomEnfant(enfant) {
  return [enfant.nom, enfant.postnom, enfant.prenom].filter(Boolean).join(' ')
}

function formaterDate(dateIso) {
  if (!dateIso) {
    return 'Non renseignée'
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

function classeSexe(sexe) {
  if (sexe === 'F') {
    return 'bg-pink-100 text-pink-700'
  }

  if (sexe === 'M') {
    return 'bg-blue-100 text-blue-700'
  }

  return 'bg-surface-container text-on-surface-variant'
}

// Ce composant affiche la liste administrative des enfants pour la réception.
// Il sert à la recherche anti-doublons sans exposer les données cliniques.
function EnfantsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rechercheNavbar = normaliserTexte((searchParams.get('q') ?? '').trim())
  const messageSucces = location.state?.messageSucces ?? ''

  const [etat, setEtat] = useState({
    chargement: true,
    enfants: [],
  })

  const [filtres, setFiltres] = useState({
    rechercheRapide: '',
    numeroFiche: '',
    nomEnfant: '',
    nomMere: '',
    nomPere: '',
    telephone: '',
  })

  const [pageCourante, setPageCourante] = useState(1)

  useEffect(() => {
    let estActif = true

    const chargerDossiers = async () => {
      setEtat((courant) => ({ ...courant, chargement: true }))
      const dossiers = await serviceDossiersEnfants.lister()

      if (!estActif) {
        return
      }

      setEtat({
        chargement: false,
        enfants: dossiers,
      })
    }

    void chargerDossiers()

    return () => {
      estActif = false
    }
  }, [])

  useEffect(() => {
    setPageCourante(1)
  }, [filtres, rechercheNavbar])

  const enfantsFiltres = useMemo(() => {
    const rechercheGlobale = normaliserTexte([rechercheNavbar, filtres.rechercheRapide].filter(Boolean).join(' '))

    return etat.enfants.filter((enfant) => {
      const nomComplet = construireNomEnfant(enfant)
      const matchGlobal =
        !rechercheGlobale ||
        [enfant.numeroFiche, nomComplet, enfant.nomMere, enfant.nomPere, enfant.telephone]
          .filter(Boolean)
          .some((valeur) => normaliserTexte(valeur).includes(rechercheGlobale))

      const matchNumero = !filtres.numeroFiche || normaliserTexte(enfant.numeroFiche).includes(normaliserTexte(filtres.numeroFiche))
      const matchNomEnfant = !filtres.nomEnfant || normaliserTexte(nomComplet).includes(normaliserTexte(filtres.nomEnfant))
      const matchNomMere = !filtres.nomMere || normaliserTexte(enfant.nomMere).includes(normaliserTexte(filtres.nomMere))
      const matchNomPere = !filtres.nomPere || normaliserTexte(enfant.nomPere).includes(normaliserTexte(filtres.nomPere))
      const matchTelephone = !filtres.telephone || normaliserTexte(enfant.telephone).includes(normaliserTexte(filtres.telephone))

      return matchGlobal && matchNumero && matchNomEnfant && matchNomMere && matchNomPere && matchTelephone
    })
  }, [etat.enfants, filtres, rechercheNavbar])

  const totalPages = Math.max(1, Math.ceil(enfantsFiltres.length / TAILLE_PAGE))
  const pageActive = Math.min(pageCourante, totalPages)
  const debut = (pageActive - 1) * TAILLE_PAGE
  const enfantsPage = enfantsFiltres.slice(debut, debut + TAILLE_PAGE)

  const majFiltre = (champ, valeur) => {
    setFiltres((courant) => ({ ...courant, [champ]: valeur }))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-24">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-cyan-800">Dossiers des Enfants</h1>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm transition-all hover:shadow-md active:opacity-80"
          onClick={() => navigate('/enfants/nouveau')}
        >
          <span className="material-symbols-outlined">add</span>
          Nouvel enfant
        </button>
      </div>

      {messageSucces ? (
        <Alerte type="succes" titre="Dossier enregistré">
          {messageSucces}
        </Alerte>
      ) : null}

      <div className="rounded-3xl border border-tertiary/15 bg-tertiary/5 px-5 py-4 text-sm text-on-surface-variant">
        <p className="flex items-start gap-3">
          <span className="material-symbols-outlined text-base text-tertiary">shield_locked</span>
          Cette page reste strictement administrative. Aucun accès aux données cliniques de suivi enfant, nutrition ou vaccination n est proposé ici.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 flex items-center justify-between rounded-xl bg-primary-container/30 p-5">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-on-primary-fixed-variant">Total Enfants</p>
            <p className="text-3xl font-black text-on-primary-fixed-variant">{etat.enfants.length}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-fixed-variant">
            <span className="material-symbols-outlined text-3xl">groups</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        {etat.chargement ? (
          <div className="flex items-center gap-3 px-6 py-10 text-on-surface-variant">
            <span className="material-symbols-outlined">hourglass_top</span>
            <p>Chargement de la liste des enfants...</p>
          </div>
        ) : enfantsPage.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline-variant">search_off</span>
            <div className="space-y-1">
              <p className="text-lg font-bold text-on-surface">Aucun résultat</p>
              <p className="text-sm">Aucun enfant ne correspond à votre recherche. Vérifiez le numéro de fiche, le nom ou le téléphone avant de créer un nouveau dossier.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">N° fiche enfant</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nom enfant</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sexe</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date de naissance</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nom de la mère</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Téléphone</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {enfantsPage.map((enfant, index) => (
                    <tr
                      key={enfant.id}
                      className={
                        index % 2 === 1
                          ? 'group bg-surface-container-low/30 transition-colors hover:bg-surface-container'
                          : 'group transition-colors hover:bg-surface-container'
                      }
                    >
                      <td className="px-6 py-5 font-mono text-xs font-bold text-primary">{enfant.numeroFiche}</td>
                      <td className="px-6 py-5 font-semibold text-on-surface">{construireNomEnfant(enfant)}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${classeSexe(enfant.sexe)}`}>
                          {enfant.sexe}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{formaterDate(enfant.dateNaissance)}</td>
                      <td className="px-6 py-5 text-sm font-medium text-on-surface">{enfant.nomMere}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{enfant.telephone}</td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                          onClick={() => navigate(`/enfants/${enfant.id}`)}
                        >
                          Voir dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-surface-container-low/50 px-6 py-4">
              <p className="text-sm text-on-surface-variant">
                Affichage de {enfantsFiltres.length === 0 ? 0 : debut + 1} à {Math.min(debut + TAILLE_PAGE, enfantsFiltres.length)} sur {enfantsFiltres.length} dossiers
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-40"
                  onClick={() => setPageCourante((page) => Math.max(1, page - 1))}
                  disabled={pageActive === 1}
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === pageActive
                        ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-on-primary'
                        : 'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium hover:bg-white'
                    }
                    onClick={() => setPageCourante(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-40"
                  onClick={() => setPageCourante((page) => Math.min(totalPages, page + 1))}
                  disabled={pageActive === totalPages}
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EnfantsPage