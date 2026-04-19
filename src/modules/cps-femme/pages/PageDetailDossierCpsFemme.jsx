// Ce composant orchestre la vue détaillée d'un dossier CPS Femme avec raccourcis, modale clôture et ajout d'enfant.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'
import useAuthentification from '../../authentification/hooks/useAuthentification'

/*  Bandeau héro CPS  */
function BandeauCps({ dossier }) {
  const p = dossier.patiente
  const groupeRhesus = dossier.groupeSanguin ? `${dossier.groupeSanguin}${dossier.rhesus ?? ''}` : null
  const visitesProtocole = ['SIX_HEURES', 'SIX_JOURS', 'SIX_SEMAINES']
  const faits = new Set((dossier.visites ?? []).map((v) => v.typeVisite))
  const labels = { SIX_HEURES: '6 heures', SIX_JOURS: '6 jours', SIX_SEMAINES: '6 semaines' }
  const prochain = visitesProtocole.find((t) => !faits.has(t))
  const prochaineVisite = prochain ? `Prochaine : visite ${labels[prochain]}` : 'Protocole complet'

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dim p-8 text-on-primary shadow-md">
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-md">
            <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>
          </div>
          <div>
            <h2 className="font-headline text-2xl font-extrabold leading-tight md:text-3xl">{p?.nom ?? ''}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold tracking-wide">{dossier.numeroDossierCps}</span>
              {groupeRhesus && (
                <span className="rounded-full border border-white/15 bg-tertiary-container/20 px-3 py-0.5 text-[11px] font-bold text-tertiary-container">{groupeRhesus}</span>
              )}
              <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${dossier.statut === 'OUVERT' ? 'bg-white/20' : 'bg-error-container/40 text-on-error'}`}>
                {dossier.statut}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold">
                {dossier.typeAccouchementEntree === 'INTERNE' ? 'Accouchement interne' : 'Accouchement externe'}
              </span>
            </div>
          </div>
        </div>
        <div className="min-w-[190px] rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-70">Visites postnatales</p>
          <p className="font-headline text-xl font-bold">{(dossier.visites ?? []).length} visite(s)</p>
          <p className="mt-0.5 text-xs opacity-80">{prochaineVisite}</p>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
    </section>
  )
}

/*  Carte Raccourci  */
function CarteRaccourci({ icone, titre, sousTitre, badge, couleurIcone, couleurBadge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${couleurIcone}`}>
        <span className="material-symbols-outlined text-2xl">{icone}</span>
      </div>
      <p className="text-sm font-bold text-on-surface">{titre}</p>
      {badge !== null && badge !== undefined && (
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${couleurBadge}`}>{badge}</span>
      )}

    </button>
  )
}

/*  Composant Principal  */
function PageDetailDossierCpsFemme() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { utilisateurConnecte } = useAuthentification()
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [modaleClotureOuverte, setModaleClotureOuverte] = useState(false)
  const [notesCloture, setNotesCloture] = useState('')
  const [clotureEnCours, setClotureEnCours] = useState(false)
  const [modaleEnfantOuverte, setModaleEnfantOuverte] = useState(false)
  const [formEnfant, setFormEnfant] = useState({ nom: '', postnom: '', prenom: '', sexe: '', dateNaissance: '' })
  const [envoiEnfant, setEnvoiEnfant] = useState({ chargement: false, erreur: null, succes: false })

  const chargerDossier = async () => {
    setChargement(true)
    setErreur('')
    try {
      const data = await serviceCpsFemme.obtenirDossier(dossierId)
      setDossier(data)
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerDossier()
    if (location.state?.messageSucces) {
      window.history.replaceState({ ...location.state, messageSucces: undefined }, '')
    }
  }, [dossierId])

  useEffect(() => {
    if (!messageSucces) return
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  if (chargement) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">refresh</span>
        Chargement du dossier CPS
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-error-container px-5 py-4 text-sm text-on-error-container">{erreur}</div>
        <button onClick={chargerDossier} className="flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-base">refresh</span> Réessayer
        </button>
      </div>
    )
  }

  if (!dossier) return null

  const fromHistorique = location.state?.fromHistorique ?? false
  const estClos = dossier.statut === 'CLOS'
  const nbVisites = (dossier.visites ?? []).length
  const visitesProtocole = ['SIX_HEURES', 'SIX_JOURS', 'SIX_SEMAINES']
  const visitesRealisees = visitesProtocole.filter((t) => (dossier.visites ?? []).some((v) => v.typeVisite === t)).length

  const nomUtilisateur = utilisateurConnecte
    ? `${utilisateurConnecte.prenom ?? ''} ${utilisateurConnecte.nom ?? utilisateurConnecte.username ?? ''}`.trim()
    : ''

  const confirmerCloture = async () => {
    if (!notesCloture.trim()) return
    setClotureEnCours(true)
    try {
      await serviceCpsFemme.cloturerDossier(dossierId, { closPar: nomUtilisateur, notesCloture: notesCloture.trim() })
      setModaleClotureOuverte(false)
      setNotesCloture('')
      setMessageSucces('Dossier CPS clôturé avec succès.')
      chargerDossier()
    } catch (ex) { alert(ex.message) } finally { setClotureEnCours(false) }
  }

  const soumettreEnfant = async () => {
    if (!formEnfant.nom.trim() || !formEnfant.sexe || !formEnfant.dateNaissance) return
    setEnvoiEnfant({ chargement: true, erreur: null, succes: false })
    try {
      await serviceCpsFemme.ajouterEnfant(dossierId, formEnfant)
      setEnvoiEnfant({ chargement: false, erreur: null, succes: true })
      setFormEnfant({ nom: '', postnom: '', prenom: '', sexe: '', dateNaissance: '' })
      setTimeout(() => {
        setModaleEnfantOuverte(false)
        setEnvoiEnfant({ chargement: false, erreur: null, succes: false })
        setMessageSucces('Dossier enfant créé avec succès.')
      }, 1500)
    } catch (ex) {
      setEnvoiEnfant({ chargement: false, erreur: ex.message, succes: false })
    }
  }

  const stateHistorique = fromHistorique ? { fromHistorique: true } : undefined

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

      {/* Bandeau héro : masqué depuis l'historique */}
      {!fromHistorique && <BandeauCps dossier={dossier} />}

      {/* Bannière dossier clos (depuis historique) */}
      {estClos && fromHistorique && (
        <div className="flex items-center gap-4 rounded-2xl bg-surface-container-high px-5 py-4">
          <span className="material-symbols-outlined text-xl text-on-surface-variant mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface">Dossier CPS clôturé</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {dossier.dateCloture ? `Le ${new Date(dossier.dateCloture).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
              {dossier.closPar ? ` par ${dossier.closPar}` : ''}
              {dossier.notesCloture ? `  ${dossier.notesCloture}` : ''}
            </p>
          </div>
        </div>
      )}

      {/*  Raccourcis  */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Aperçu du dossier</h3>
        {estClos && !fromHistorique ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <CarteRaccourci
              icone="history"
              titre="Historique CPS"
              badge={null}
              couleurIcone="bg-primary/10 text-primary"
              couleurBadge={null}
              onClick={() => navigate(`/cps-femme/historique/${dossier.patiente?.id ?? dossier.patienteId}`)}
            />
            <CarteRaccourci
              icone="child_friendly"
              titre="Infos accouchement"
              badge={null}
              couleurIcone="bg-secondary-container text-on-secondary-container"
              couleurBadge={null}
              onClick={() => navigate(`/cps-femme/${dossierId}/accouchement`)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <CarteRaccourci
              icone="history"
              titre="Historique CPS"
              badge={null}
              couleurIcone="bg-primary/10 text-primary"
              couleurBadge={null}
              onClick={() => navigate(`/cps-femme/historique/${dossier.patiente?.id ?? dossier.patienteId}`)}
            />
            <CarteRaccourci
              icone="child_friendly"
              titre="Infos accouchement"
              badge={null}
              couleurIcone="bg-secondary-container text-on-secondary-container"
              couleurBadge={null}
              onClick={() => navigate(`/cps-femme/${dossierId}/accouchement`, { state: stateHistorique })}
            />
            <CarteRaccourci
              icone="calendar_month"
              titre="Visites CPS"
              badge={nbVisites}
              couleurIcone="bg-tertiary-container/30 text-tertiary"
              couleurBadge="bg-tertiary-container text-on-tertiary-container"
              onClick={() => navigate(`/cps-femme/${dossierId}/visites`, { state: stateHistorique })}
            />
            <CarteRaccourci
              icone="biotech"
              titre="Examens"
              badge={dossier.visites?.length ?? null}
              couleurIcone="bg-surface-container-high text-on-surface-variant"
              couleurBadge="bg-surface-variant text-on-surface-variant"
              onClick={() => navigate(`/cps-femme/${dossierId}/examens`, { state: stateHistorique })}
            />

          </div>
        )}
      </section>

      {/* ── Actions ── */}
      <section>
        <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {estClos && (
            <button
              onClick={() => navigate('/cps-femme/nouveau', { state: { patientePreselectionnee: dossier.patiente } })}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Nouveau dossier CPS
            </button>
          )}
          {!estClos && !fromHistorique && (
            <button
              onClick={() => navigate(`/cps-femme/${dossierId}/visites/nouvelle`)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Nouvelle visite
            </button>
          )}
          {!estClos && !fromHistorique && (
            <button
              onClick={() => setModaleClotureOuverte(true)}
              className="flex items-center gap-2 rounded-full bg-error-container/20 px-5 py-2.5 text-sm font-semibold text-error shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              Clore le dossier
            </button>
          )}
        </div>
      </section>

      {/*  Modale clôture  */}
      {modaleClotureOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-container/30">
                <span className="material-symbols-outlined text-xl text-error">lock</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Clôture du dossier CPS</h2>
                <p className="text-xs text-on-surface-variant">Dossier {dossier.numeroDossierCps}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                  Libellé de clôture
                </label>
                <textarea
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Motif ou remarques de clôture"
                  value={notesCloture}
                  onChange={(e) => setNotesCloture(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Clôturé par</p>
                <p className="mt-0.5 text-sm font-semibold text-on-surface">{nomUtilisateur || ''}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setModaleClotureOuverte(false); setNotesCloture('') }}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                Annuler
              </button>
              <button onClick={confirmerCloture} disabled={!notesCloture.trim() || clotureEnCours}
                className="flex items-center gap-2 rounded-full bg-error px-5 py-2.5 text-sm font-semibold text-on-error shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                <span className="material-symbols-outlined text-base">lock</span>
                {clotureEnCours ? 'Clôture en cours' : 'Confirmer la clôture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Modale ajout enfant  */}
      {modaleEnfantOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary-container/30">
                <span className="material-symbols-outlined text-xl text-tertiary">child_care</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Enregistrer un enfant</h2>
                <p className="text-xs text-on-surface-variant">Créer un dossier enfant lié à ce suivi CPS</p>
              </div>
            </div>
            {envoiEnfant.succes ? (
              <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/40 px-5 py-4 text-sm font-medium text-on-tertiary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Dossier enfant créé avec succès !
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Nom *</label>
                    <input type="text" value={formEnfant.nom} onChange={(e) => setFormEnfant((f) => ({ ...f, nom: e.target.value }))}
                      className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Postnom</label>
                    <input type="text" value={formEnfant.postnom} onChange={(e) => setFormEnfant((f) => ({ ...f, postnom: e.target.value }))}
                      className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Prénom</label>
                    <input type="text" value={formEnfant.prenom} onChange={(e) => setFormEnfant((f) => ({ ...f, prenom: e.target.value }))}
                      className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Sexe *</label>
                    <select value={formEnfant.sexe} onChange={(e) => setFormEnfant((f) => ({ ...f, sexe: e.target.value }))}
                      className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value=""></option>
                      <option value="MASCULIN">Masculin</option>
                      <option value="FEMININ">Féminin</option>
                      <option value="INDETERMINE">Indéterminé</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Date de naissance *</label>
                    <input type="date" value={formEnfant.dateNaissance} onChange={(e) => setFormEnfant((f) => ({ ...f, dateNaissance: e.target.value }))}
                      className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                {envoiEnfant.erreur && (
                  <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{envoiEnfant.erreur}</div>
                )}
              </div>
            )}
            {!envoiEnfant.succes && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => { setModaleEnfantOuverte(false); setFormEnfant({ nom: '', postnom: '', prenom: '', sexe: '', dateNaissance: '' }); setEnvoiEnfant({ chargement: false, erreur: null, succes: false }) }}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Annuler
                </button>
                <button onClick={soumettreEnfant}
                  disabled={!formEnfant.nom.trim() || !formEnfant.sexe || !formEnfant.dateNaissance || envoiEnfant.chargement}
                  className="flex items-center gap-2 rounded-full bg-tertiary px-5 py-2.5 text-sm font-semibold text-on-tertiary shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                  {envoiEnfant.chargement && <span className="material-symbols-outlined animate-spin text-base">refresh</span>}
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PageDetailDossierCpsFemme
