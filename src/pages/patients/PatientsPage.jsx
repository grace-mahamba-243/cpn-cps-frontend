import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersMeres from '../../services/api/serviceDossiersMeres'

const TAILLE_PAGE = 8

function construireNomComplet(mere) {
  return [mere.nom, mere.postnom, mere.prenom].filter(Boolean).join(' ')
}

function normaliserTexte(valeur = '') {
  return valeur
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Ce composant affiche la liste administrative des meres pour la reception.
// Il permet la recherche anti-doublons sans exposer de donnees cliniques.
function PatientsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rechercheNavbar = normaliserTexte((searchParams.get('q') ?? '').trim())
  const messageSucces = location.state?.messageSucces ?? ''

  const [etat, setEtat] = useState({
    chargement: true,
    meres: [],
  })

  const [filtres, setFiltres] = useState({
    rechercheRapide: '',
    numeroDossier: '',
    nom: '',
    postnom: '',
    prenom: '',
    telephone: '',
  })

  const [pageCourante, setPageCourante] = useState(1)

  useEffect(() => {
    let estActif = true

    const chargerDossiers = async () => {
      setEtat((courant) => ({ ...courant, chargement: true }))
      const dossiers = await serviceDossiersMeres.lister()

      if (!estActif) {
        return
      }

      setEtat({
        chargement: false,
        meres: dossiers,
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

  const meresFiltrees = useMemo(() => {
    const rechercheGlobale = normaliserTexte([rechercheNavbar, filtres.rechercheRapide].filter(Boolean).join(' '))

    return etat.meres.filter((mere) => {
      const nomComplet = construireNomComplet(mere)
      const matchGlobal =
        !rechercheGlobale ||
        [mere.numeroDossier, nomComplet, mere.nom, mere.postnom, mere.prenom, mere.telephone, mere.adresse]
          .filter(Boolean)
          .some((valeur) => normaliserTexte(valeur).includes(rechercheGlobale))

      const matchNumero = !filtres.numeroDossier || normaliserTexte(mere.numeroDossier).includes(normaliserTexte(filtres.numeroDossier))
      const matchNom = !filtres.nom || normaliserTexte(mere.nom).includes(normaliserTexte(filtres.nom))
      const matchPostnom = !filtres.postnom || normaliserTexte(mere.postnom).includes(normaliserTexte(filtres.postnom))
      const matchPrenom = !filtres.prenom || normaliserTexte(mere.prenom).includes(normaliserTexte(filtres.prenom))
      const matchTelephone = !filtres.telephone || normaliserTexte(mere.telephone).includes(normaliserTexte(filtres.telephone))

      return matchGlobal && matchNumero && matchNom && matchPostnom && matchPrenom && matchTelephone
    })
  }, [etat.meres, filtres, rechercheNavbar])

  const totalPages = Math.max(1, Math.ceil(meresFiltrees.length / TAILLE_PAGE))
  const pageActive = Math.min(pageCourante, totalPages)
  const debut = (pageActive - 1) * TAILLE_PAGE
  const meresPage = meresFiltrees.slice(debut, debut + TAILLE_PAGE)

  const majFiltre = (champ, valeur) => {
    setFiltres((courant) => ({ ...courant, [champ]: valeur }))
  }

  const totalDossiers = etat.meres.length
  const nouveauxDossiers = etat.meres.length

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-8 pb-16 pt-24">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-on-surface">Dossiers des Mères</h1>
          <p className="max-w-2xl text-lg text-on-surface-variant">
            Consultez, gérez et créez les dossiers d enregistrement pour les patientes du centre de santé.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          onClick={() => navigate('/patients/nouveau')}
        >
          <span className="material-symbols-outlined">add</span>
          <span>Nouvelle mère</span>
        </button>
      </div>

      {messageSucces ? (
        <Alerte type="succes" titre="Dossier enregistré">
          {messageSucces}
        </Alerte>
      ) : null}

      {/* Champ de recherche rapide supprimé à la demande */}

      <div className="rounded-xl bg-surface-container-lowest shadow-sm">
        {etat.chargement ? (
          <div className="flex items-center gap-3 px-6 py-10 text-on-surface-variant">
            <span className="material-symbols-outlined">hourglass_top</span>
            <p>Chargement de la liste des mères...</p>
          </div>
        ) : meresPage.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline-variant">search_off</span>
            <div className="space-y-1">
              <p className="text-lg font-bold text-on-surface">Aucun résultat</p>
              <p className="text-sm">Aucune mère ne correspond à votre recherche. Vérifiez le numéro de dossier, le nom ou le téléphone pour éviter les doublons.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Numéro dossier</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nom complet</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Âge</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Téléphone</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Enregistrement</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {meresPage.map((mere, index) => (
                    <tr
                      key={mere.id}
                      className={
                        index % 2 === 1
                          ? 'group bg-surface-container-low/30 transition-colors hover:bg-surface-container'
                          : 'group transition-colors hover:bg-surface-container'
                      }
                    >
                      <td className="px-6 py-6 font-mono font-bold text-cyan-700">{mere.numeroDossier}</td>
                      <td className="px-6 py-6 font-bold text-on-surface">{construireNomComplet(mere)}</td>
                      <td className="px-6 py-6 text-on-surface-variant">{mere.age} ans</td>
                      <td className="px-6 py-6 text-on-surface-variant">{mere.telephone}</td>
                      <td className="px-6 py-6 text-on-surface-variant">{mere.dateEnregistrement}</td>
                      <td className="px-6 py-6">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                          onClick={() => navigate(`/patients/${mere.id}`)}
                        >
                          Voir dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-surface-container-low px-6 py-6">
              <span className="text-sm text-on-surface-variant">
                Affichage de {meresFiltrees.length === 0 ? 0 : debut + 1} à {Math.min(debut + TAILLE_PAGE, meresFiltrees.length)} sur {meresFiltrees.length} dossiers
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-all hover:bg-surface hover:text-primary disabled:opacity-40"
                  onClick={() => setPageCourante((page) => Math.max(1, page - 1))}
                  disabled={pageActive === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === pageActive
                        ? 'flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-on-primary'
                        : 'flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container'
                    }
                    onClick={() => setPageCourante(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-all hover:bg-surface hover:text-primary disabled:opacity-40"
                  onClick={() => setPageCourante((page) => Math.min(totalPages, page + 1))}
                  disabled={pageActive === totalPages}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-primary p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dim opacity-100" />
          <div className="relative z-10">
            <span className="material-symbols-outlined mb-4 block text-primary-container">group_add</span>
            <div className="text-3xl font-extrabold text-on-primary">{nouveauxDossiers}</div>
            <div className="text-sm uppercase tracking-widest text-on-primary/80">Nouveaux dossiers</div>
          </div>
        </div>

        <div className="rounded-xl bg-secondary-container p-6">
          <span className="material-symbols-outlined mb-4 block text-secondary">event_note</span>
          <div className="text-3xl font-extrabold text-on-secondary-container">{totalDossiers}</div>
          <div className="text-sm uppercase tracking-widest text-on-secondary-container/80">Total dossiers actifs</div>
        </div>
      </div>
    </div>
  )
}

export default PatientsPage