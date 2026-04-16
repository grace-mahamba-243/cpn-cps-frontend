// Ce composant orchestre la vue détaillée d'un dossier CPN avec raccourcis et modales.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'
import serviceRendezVous from '../../../services/api/serviceRendezVous'
import SqueletteChargement from '../composants/SqueletteChargement'
import EcranErreur from '../composants/EcranErreur'
import BandeauPatiente from '../composants/BandeauPatiente'
import Modale from '../composants/Modale'
import { formaterDateCourte } from '../composants/utilitairesCpn'

/* ─── Carte Raccourci ─── */
function CarteRaccourci({ icone, titre, sousTitre, badge, couleurIcone, couleurBadge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${couleurIcone}`}>
        <span className="material-symbols-outlined text-2xl">{icone}</span>
      </div>
      <div className="pr-6">
        <p className="text-sm font-bold text-on-surface">{titre}</p>
        {sousTitre && <p className="mt-0.5 text-[12px] leading-snug text-on-surface-variant">{sousTitre}</p>}
      </div>
      {badge !== null && badge !== undefined && (
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${couleurBadge}`}>{badge}</span>
      )}
      <span className="material-symbols-outlined absolute bottom-4 right-4 text-[16px] text-on-surface-variant/25 transition-colors group-hover:text-on-surface-variant/60">
        arrow_forward
      </span>
    </button>
  )
}

/* ─── Composant Principal ─── */
function PageDetailDossierCpn() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [modaleOuverte, setModaleOuverte] = useState(null)
  const [rdvDuJour, setRdvDuJour] = useState(null) // null = pas encore charge, [] = aucun, [{...}] = trouve
  const [finEnCours, setFinEnCours] = useState(false)

  const chargerDossier = async () => {
    setChargement(true)
    setErreur('')
    try {
      const data = await serviceCpn.obtenirDossier(dossierId)
      setDossier(data)
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  const chargerRdvDuJour = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const liste = await serviceRendezVous.lister({
        date: today,
        statut: 'Arrive',
        serviceDestination: 'Maternite (CPN)',
      })
      // filtrer par numero de dossier (refDossier non supporte cote backend, on filtre ici)
      setRdvDuJour(liste)
    } catch { setRdvDuJour([]) }
  }

  const finirConsultation = async () => {
    if (!rdvDuJour?.length) return
    if (!confirm('Marquer la consultation comme terminée ?')) return
    setFinEnCours(true)
    try {
      // on prend le premier RDV du jour correspondant au numero de dossier
      const rdv = rdvDuJour.find(
        (r) => r.refDossier === dossier?.numeroDossierCpn || r.patienteNom?.toLowerCase().includes(dossier?.patiente?.nom?.toLowerCase() ?? '')
      ) ?? rdvDuJour[0]
      await serviceRendezVous.mettreAJourStatut(rdv.id, 'Termine')
      setRdvDuJour([])
      setMessageSucces('Consultation terminée — patient retiré de la file d\'attente.')
    } catch (ex) { alert(ex.message) } finally { setFinEnCours(false) }
  }

  useEffect(() => { chargerDossier(); window.history.replaceState({}, '') }, [dossierId])
  useEffect(() => { chargerRdvDuJour() }, [dossierId])
  useEffect(() => {
    if (!messageSucces) return
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  if (chargement) return <SqueletteChargement />
  if (erreur) return <EcranErreur message={erreur} onReessayer={chargerDossier} />
  if (!dossier) return null

  const fermerModale = () => setModaleOuverte(null)
  const ageGest = dossier.dernierAgeGestationnel ?? dossier.ageGestionnelOuverture
  const dernierContact = dossier.contacts?.[0] ?? null
  const examensRecus = dossier.examens?.filter((e) => e.statut === 'RESULTAT_RECU').length ?? 0

  const changerStatut = async () => {
    const prochain = dossier.statut === 'OUVERT' ? 'CLOS' : 'OUVERT'
    if (!confirm(`${prochain === 'CLOS' ? 'Clore' : 'Réouvrir'} ce dossier CPN ?`)) return
    try {
      await serviceCpn.modifierDossier(dossierId, { statut: prochain })
      chargerDossier()
    } catch (ex) { alert(ex.message) }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">

      {/* Bouton retour */}
      <button onClick={() => navigate('/cpn')} className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Dossiers CPN
      </button>

      {/* Toast succès */}
      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/60 px-5 py-3.5 text-sm font-medium text-on-tertiary-container backdrop-blur">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {messageSucces}
        </div>
      )}

      {/* Bandeau Patiente */}
      <BandeauPatiente dossier={dossier} />

      {/* ── Raccourcis ── */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Aperçu du dossier</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <CarteRaccourci
            icone="person_book"
            titre="Infos Administratives"

            badge={null}
            couleurIcone="bg-secondary-container text-on-secondary-container"
            couleurBadge={null}
            onClick={() => navigate(`/cpn/${dossierId}/info-administrative`)}
          />
          <CarteRaccourci
            icone="folder_open"
            titre="Dossier d'ouverture"

            badge={null}
            couleurIcone="bg-primary-container/30 text-primary"
            couleurBadge={null}
            onClick={() => navigate(`/cpn/${dossierId}/dossier-ouverture`)}
          />
          <CarteRaccourci
            icone="calendar_month"
            titre="Contacts CPN"
            sousTitre={dernierContact ? `Dernier : ${formaterDateCourte(dernierContact.dateContact)}` : 'Aucun contact'}
            badge={dossier.nombreContacts ?? 0}
            couleurIcone="bg-tertiary-container/30 text-tertiary"
            couleurBadge="bg-tertiary-container text-on-tertiary-container"
            onClick={() => navigate(`/cpn/${dossierId}/contacts`)}
          />
          <CarteRaccourci
            icone="biotech"
            titre="Examens"
            sousTitre={`${examensRecus} résultat${examensRecus !== 1 ? 's' : ''} reçu${examensRecus !== 1 ? 's' : ''}`}
            badge={dossier.examens?.length ?? 0}
            couleurIcone="bg-surface-container-high text-on-surface-variant"
            couleurBadge="bg-surface-variant text-on-surface-variant"
            onClick={() => navigate(`/cpn/${dossierId}/examens`)}
          />
        </div>
      </section>

      {/* ── Actions ── */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {dossier.statut === 'OUVERT' && (
            <button onClick={() => navigate(`/cpn/${dossierId}/contacts/nouveau`)} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-base">add_circle</span>
              Nouveau Contact
            </button>
          )}
          {rdvDuJour?.length > 0 && dossier.statut === 'OUVERT' && (
            <button
              onClick={finirConsultation}
              disabled={finEnCours}
              className="flex items-center gap-2 rounded-full bg-tertiary px-5 py-2.5 text-sm font-semibold text-on-tertiary shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              {finEnCours ? 'En cours...' : 'Finir la consultation'}
            </button>
          )}
          <button onClick={changerStatut} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity ${dossier.statut === 'OUVERT' ? 'bg-error-container/20 text-error' : 'bg-tertiary-container text-on-tertiary-container'}`}>
            <span className="material-symbols-outlined text-base">{dossier.statut === 'OUVERT' ? 'lock' : 'lock_open'}</span>
            {dossier.statut === 'OUVERT' ? 'Clore le dossier' : 'Réouvrir le dossier'}
          </button>
        </div>
      </section>

      {/* ══ Modales ══ */}
    </div>
  )
}

export default PageDetailDossierCpn
