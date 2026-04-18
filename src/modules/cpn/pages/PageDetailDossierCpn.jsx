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
import useAuthentification from '../../authentification/hooks/useAuthentification'

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
  const { utilisateurConnecte } = useAuthentification()
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [modaleOuverte, setModaleOuverte] = useState(null)
  const [rdvDuJour, setRdvDuJour] = useState(null)
  const [finEnCours, setFinEnCours] = useState(false)
  // Modale clôture
  const [modaleClotureOuverte, setModaleClotureOuverte] = useState(false)
  const [notesCloture, setNotesCloture] = useState('')
  const [clotureEnCours, setClotureEnCours] = useState(false)
  // Vérifier si un dossier ouvert existe déjà pour cette patiente (pour bloquer la réouverture)
  const [dossierOuvertExistant, setDossierOuvertExistant] = useState(false)

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

  const verifierDossierOuvert = async (patienteId) => {
    try {
      const liste = await serviceCpn.listerDossiersParPatiente(patienteId)
      const ouvert = liste.find((d) => d.statut === 'OUVERT' && d.id !== dossierId)
      setDossierOuvertExistant(!!ouvert)
    } catch { /* ignorer */ }
  }

  useEffect(() => {
    chargerDossier()
    // Effacer seulement messageSucces du state sans toucher aux autres flags (fromHistorique, etc.)
    if (location.state?.messageSucces) {
      window.history.replaceState({ ...location.state, messageSucces: undefined }, '')
    }
  }, [dossierId])
  useEffect(() => { chargerRdvDuJour() }, [dossierId])
  useEffect(() => {
    if (!messageSucces) return
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  // Après chargement, vérifier dossier ouvert existant si le dossier est clos
  useEffect(() => {
    if (dossier?.statut === 'CLOS' && dossier?.patienteId) {
      verifierDossierOuvert(dossier.patienteId)
    }
  }, [dossier?.id, dossier?.statut])

  if (chargement) return <SqueletteChargement />
  if (erreur) return <EcranErreur message={erreur} onReessayer={chargerDossier} />
  if (!dossier) return null

  const fermerModale = () => setModaleOuverte(null)
  const ageGest = dossier.dernierAgeGestationnel ?? dossier.ageGestionnelOuverture
  const dernierContact = dossier.contacts?.[0] ?? null
  const examensRecus = dossier.examens?.filter((e) => e.statut === 'RESULTAT_RECU').length ?? 0

  const nomUtilisateur = utilisateurConnecte
    ? `${utilisateurConnecte.prenom ?? ''} ${utilisateurConnecte.nom ?? utilisateurConnecte.username ?? utilisateurConnecte.identifiant ?? ''}`.trim()
    : ''

  const confirmerCloture = async () => {
    if (!notesCloture.trim()) return
    setClotureEnCours(true)
    try {
      await serviceCpn.modifierDossier(dossierId, {
        statut: 'CLOS',
        notesCloture: notesCloture.trim(),
        closPar: nomUtilisateur,
        utilisateurNom: nomUtilisateur,
      })
      setModaleClotureOuverte(false)
      setNotesCloture('')
      setMessageSucces('Dossier CPN clôturé avec succès.')
      chargerDossier()
    } catch (ex) { alert(ex.message) } finally { setClotureEnCours(false) }
  }

  const reouvrir = async () => {
    if (!confirm('Réouvrir ce dossier CPN ?')) return
    try {
      await serviceCpn.modifierDossier(dossierId, { statut: 'OUVERT' })
      chargerDossier()
    } catch (ex) { alert(ex.message) }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">

      {/* Bouton retour */}
      <button onClick={() => navigate(-1)} className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour
      </button>

      {/* Toast succès */}
      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/60 px-5 py-3.5 text-sm font-medium text-on-tertiary-container backdrop-blur">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {messageSucces}
        </div>
      )}

      {/* Bandeau Patiente : masqué pour les dossiers consultés depuis l'historique */}
      {!location.state?.fromHistorique && <BandeauPatiente dossier={dossier} />}

      {/* ── Bannière dossier clos ── */}
      {dossier.statut === 'CLOS' && location.state?.fromHistorique && (
        <div className="flex items-center gap-4 rounded-2xl bg-surface-container-high px-5 py-4">
          <span className="material-symbols-outlined text-xl text-on-surface-variant mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface">Dossier clôturé</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {dossier.dateCloture ? `Le ${new Date(dossier.dateCloture).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
              {dossier.closPar ? ` par ${dossier.closPar}` : ''}
              {dossier.notesCloture ? ` — ${dossier.notesCloture}` : ''}
            </p>
          </div>
          {/* Bouton Réouvrir : visible uniquement si aucun autre dossier ouvert */}
          {!dossierOuvertExistant ? (
            <button
              onClick={reouvrir}
              className="flex flex-shrink-0 items-center gap-2 rounded-full bg-tertiary-container px-4 py-2 text-sm font-semibold text-on-tertiary-container hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">lock_open</span>
              Réouvrir
            </button>
          ) : (
            <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-4 py-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-base">info</span>
              Nouveau dossier déjà ouvert
            </div>
          )}
        </div>
      )}

      {/* ── Raccourcis ── */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Aperçu du dossier</h3>
        {dossier.statut === 'CLOS' && !location.state?.fromHistorique ? (
          /* Dossier clos accédé hors historique : seulement infos administratives */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <CarteRaccourci
              icone="person_book"
              titre="Infos Administratives"
              badge={null}
              couleurIcone="bg-secondary-container text-on-secondary-container"
              couleurBadge={null}
              onClick={() => navigate(`/cpn/${dossierId}/info-administrative`)}
            />
          </div>
        ) : (
          /* Dossier ouvert OU dossier clos depuis l'historique : toutes les cartes */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <CarteRaccourci
              icone="person_book"
              titre="Infos Administratives"
              badge={null}
              couleurIcone="bg-secondary-container text-on-secondary-container"
              couleurBadge={null}
              onClick={() => navigate(`/cpn/${dossierId}/info-administrative`, { state: location.state?.fromHistorique ? { fromHistorique: true } : undefined })}
            />
            <CarteRaccourci
              icone="folder_open"
              titre="Dossier d'ouverture"
              badge={null}
              couleurIcone="bg-primary-container/30 text-primary"
              couleurBadge={null}
              onClick={() => navigate(`/cpn/${dossierId}/dossier-ouverture`, { state: location.state?.fromHistorique ? { fromHistorique: true } : undefined })}
            />
            <CarteRaccourci
              icone="calendar_month"
              titre="Contacts CPN"
              sousTitre={dernierContact ? `Dernier : ${formaterDateCourte(dernierContact.dateContact)}` : 'Aucun contact'}
              badge={dossier.nombreContacts ?? 0}
              couleurIcone="bg-tertiary-container/30 text-tertiary"
              couleurBadge="bg-tertiary-container text-on-tertiary-container"
              onClick={() => navigate(`/cpn/${dossierId}/contacts`, { state: location.state?.fromHistorique ? { fromHistorique: true } : undefined })}
            />
            <CarteRaccourci
              icone="biotech"
              titre="Examens"
              sousTitre={`${examensRecus} résultat${examensRecus !== 1 ? 's' : ''} reçu${examensRecus !== 1 ? 's' : ''}`}
              badge={dossier.examens?.length ?? 0}
              couleurIcone="bg-surface-container-high text-on-surface-variant"
              couleurBadge="bg-surface-variant text-on-surface-variant"
              onClick={() => navigate(`/cpn/${dossierId}/examens`, { state: location.state?.fromHistorique ? { fromHistorique: true } : undefined })}
            />
          </div>
        )}
      </section>

      {/* ── Actions ── */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {dossier.statut === 'CLOS' && (
            <button
              onClick={() => navigate('/cpn/nouveau', { state: { patientePreselectionnee: dossier.patiente } })}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Nouveau dossier CPN
            </button>
          )}
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
          {dossier.statut === 'OUVERT' && (
            <button onClick={() => setModaleClotureOuverte(true)} className="flex items-center gap-2 rounded-full bg-error-container/20 px-5 py-2.5 text-sm font-semibold text-error shadow-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-base">lock</span>
              Clore le dossier
            </button>
          )}
          <button
            onClick={() => navigate(`/cpn/historique/${dossier.patienteId}`)}
            className="flex items-center gap-2 rounded-full bg-surface-container px-5 py-2.5 text-sm font-semibold text-on-surface-variant shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">history</span>
            Historique grossesses
          </button>
        </div>
      </section>

      {/* ══ Modales ══ */}

      {/* Modale clôture */}
      {modaleClotureOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-container/30">
                <span className="material-symbols-outlined text-xl text-error">lock</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Clôture du dossier CPN</h2>
                <p className="text-xs text-on-surface-variant">Dossier {dossier.numeroDossierCpn}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Libellé / motif */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Libellé de clôture <span className="text-error">*</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Motif ou remarques de clôture…"
                  value={notesCloture}
                  onChange={(e) => setNotesCloture(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Nom utilisateur affiché */}
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Clôturé par</p>
                <p className="mt-0.5 text-sm font-semibold text-on-surface">{nomUtilisateur || '—'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setModaleClotureOuverte(false); setNotesCloture('') }}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmerCloture}
                disabled={!notesCloture.trim() || clotureEnCours}
                className="flex items-center gap-2 rounded-full bg-error px-5 py-2.5 text-sm font-semibold text-on-error shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">lock</span>
                {clotureEnCours ? 'Clôture en cours…' : 'Confirmer la clôture du dossier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageDetailDossierCpn
