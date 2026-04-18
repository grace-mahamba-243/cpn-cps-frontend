// Ce composant affiche le detail d'un dossier CPS Femme avec la liste des visites, toast succès, section CPN associé et ajout d'enfant.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'

const LABELS_TYPE_VISITE = {
  SIX_HEURES: { label: 'Visite 6 heures', icone: 'schedule', couleur: 'text-primary bg-primary/10' },
  SIX_JOURS: { label: 'Visite 6 jours', icone: 'calendar_today', couleur: 'text-tertiary bg-tertiary/10' },
  SIX_SEMAINES: { label: 'Visite 6 semaines', icone: 'event_available', couleur: 'text-secondary bg-secondary/10' },
  SURPRISE: { label: 'Visite surprenante', icone: 'add_circle', couleur: 'text-on-surface-variant bg-surface-container-highest' },
}

const VISITES_PROTOCOLE = ['SIX_HEURES', 'SIX_JOURS', 'SIX_SEMAINES']

function PageDetailDossierCpsFemme() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [dossier, setDossier] = useState(null)
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [modeCloture, setModeCloture] = useState(false)
  const [formCloture, setFormCloture] = useState({ closPar: '', notesCloture: '' })
  const [envoiCloture, setEnvoiCloture] = useState({ chargement: false, erreur: null })
  const [modaleEnfant, setModaleEnfant] = useState(false)
  const [formEnfant, setFormEnfant] = useState({ nom: '', postnom: '', prenom: '', sexe: '', dateNaissance: '' })
  const [envoiEnfant, setEnvoiEnfant] = useState({ chargement: false, erreur: null, succes: false })

  useEffect(() => {
    if (!messageSucces) return
    window.history.replaceState({}, '')
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  useEffect(() => {
    let actif = true
    serviceCpsFemme.obtenirDossier(dossierId)
      .then((d) => { if (actif) setDossier(d) })
      .catch((e) => { if (actif) setErreur(e.message) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [dossierId])

  const cloturerDossier = async () => {
    if (!formCloture.closPar.trim()) return
    setEnvoiCloture({ chargement: true, erreur: null })
    try {
      await serviceCpsFemme.cloturerDossier(dossierId, formCloture)
      const maj = await serviceCpsFemme.obtenirDossier(dossierId)
      setDossier(maj)
      setModeCloture(false)
    } catch (e) {
      setEnvoiCloture({ chargement: false, erreur: e.message })
    }
  }

  const soumettreEnfant = async () => {
    if (!formEnfant.nom.trim() || !formEnfant.sexe || !formEnfant.dateNaissance) return
    setEnvoiEnfant({ chargement: true, erreur: null, succes: false })
    try {
      await serviceCpsFemme.ajouterEnfant(dossierId, formEnfant)
      setEnvoiEnfant({ chargement: false, erreur: null, succes: true })
      setFormEnfant({ nom: '', postnom: '', prenom: '', sexe: '', dateNaissance: '' })
      setTimeout(() => { setModaleEnfant(false); setEnvoiEnfant({ chargement: false, erreur: null, succes: false }) }, 1500)
    } catch (e) {
      setEnvoiEnfant({ chargement: false, erreur: e.message, succes: false })
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center gap-2 py-10 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">refresh</span>
        Chargement du dossier CPS…
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="rounded-xl bg-error-container px-5 py-4 text-sm text-on-error-container">{erreur}</div>
    )
  }

  if (!dossier) return null

  const visitesExistantes = new Set((dossier.visites ?? []).map((v) => v.typeVisite))
  const estClos = dossier.statut === 'CLOS'

  return (
    <div className="flex flex-col gap-6">

      {/* ── Navigation ── */}
      <button
        onClick={() => navigate('/cps-femme')}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Dossiers CPS
      </button>

      {/* Toast succès */}
      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/60 px-5 py-3.5 text-sm font-medium text-on-tertiary-container">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {messageSucces}
        </div>
      )}

      {/* ── En-tête dossier gradient ── */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary-container/20 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-lg font-bold text-primary">
              {(dossier.patiente?.nom ?? '?').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">CPS Femme</p>
              <h2 className="text-2xl font-extrabold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {dossier.patiente?.nom ?? '—'}
              </h2>
              <p className="text-sm font-mono text-primary">{dossier.numeroDossierCps}</p>
              <p className="text-xs text-on-surface-variant">{dossier.patiente?.telephone ?? ''}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estClos ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary/10 text-primary'}`}>
            {estClos ? 'Clôturé' : 'En cours'}
          </span>
        </div>

        {/* Bouton Ajouter un enfant */}
        <div className="flex justify-end">
          <button
            onClick={() => setModaleEnfant(true)}
            className="flex items-center gap-2 rounded-full bg-primary/90 px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
            Enregistrer un enfant
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-on-surface-variant">Type accouchement</p>
            <p className="font-medium text-on-surface">
              {dossier.typeAccouchementEntree === 'INTERNE' ? 'Interne' : 'Externe'}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Date accouchement</p>
            <p className="font-medium text-on-surface">{dossier.dateAccouchement ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Mode</p>
            <p className="font-medium text-on-surface">{dossier.modeAccouchement ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">État mère</p>
            <p className="font-medium text-on-surface">{dossier.etatMereEntree ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">État nouveau-né</p>
            <p className="font-medium text-on-surface">{dossier.etatNouveauNe ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Poids naissance</p>
            <p className="font-medium text-on-surface">
              {dossier.poidsNaissanceG ? `${dossier.poidsNaissanceG} g` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Apgar 1'/5'</p>
            <p className="font-medium text-on-surface">
              {dossier.scoreApgar1min ?? '—'} / {dossier.scoreApgar5min ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Ouverture CPS</p>
            <p className="font-medium text-on-surface">{dossier.dateOuverture ?? '—'}</p>
          </div>
        </div>

        {dossier.complicationsAccouchement && (
          <div className="rounded-xl bg-error-container/40 px-4 py-2 text-sm text-on-error-container">
            <span className="font-semibold">Complications : </span>{dossier.complicationsAccouchement}
          </div>
        )}
      </div>

      {/* ── Protocole de visites 6h / 6j / 6s ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Visites postnatales</h3>
          {!estClos && (
            <button
              onClick={() => navigate(`/cps-femme/${dossierId}/visites/nouvelle`)}
              className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nouvelle visite
            </button>
          )}
        </div>

        {/* Indicateurs protocole */}
        <div className="grid grid-cols-3 gap-3">
          {VISITES_PROTOCOLE.map((type) => {
            const config = LABELS_TYPE_VISITE[type]
            const faite = visitesExistantes.has(type)
            const visite = (dossier.visites ?? []).find((v) => v.typeVisite === type)
            return (
              <button
                key={type}
                onClick={() => visite ? navigate(`/cps-femme/${dossierId}/visites/${visite.id}`) : navigate(`/cps-femme/${dossierId}/visites/nouvelle?type=${type}`)}
                className={`flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all hover:opacity-80 ${faite ? 'bg-primary/5 border border-primary/20' : 'bg-surface-container border border-outline-variant/30'}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.couleur}`}>
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: faite ? "'FILL' 1" : "'FILL' 0" }}>
                    {faite ? 'check_circle' : config.icone}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">{config.label}</p>
                  <p className="text-xs text-on-surface-variant">
                    {faite ? visite.dateVisite : 'Non effectuée'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Liste complète des visites */}
        {dossier.visites && dossier.visites.length > 0 && (
          <ul className="space-y-2 pt-2">
            {dossier.visites.map((v) => {
              const config = LABELS_TYPE_VISITE[v.typeVisite] ?? LABELS_TYPE_VISITE.SURPRISE
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/cps-femme/${dossierId}/visites/${v.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl bg-surface-container px-4 py-3 text-left hover:bg-surface-container-low transition-colors"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.couleur}`}>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {config.icone}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface">{config.label}</p>
                      <p className="text-xs text-on-surface-variant">{v.dateVisite}</p>
                    </div>
                    {v.etatGeneral && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.etatGeneral === 'BON' ? 'bg-primary/10 text-primary' : v.etatGeneral === 'PASSABLE' ? 'bg-tertiary/10 text-tertiary' : 'bg-error-container text-on-error-container'}`}>
                        {v.etatGeneral}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_right</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {(!dossier.visites || dossier.visites.length === 0) && (
          <p className="text-sm text-on-surface-variant">Aucune visite postnatale enregistrée.</p>
        )}
      </div>

      {/* ── Dossier CPN associé (grossesse précédente, lecture seule) ── */}
      {dossier.dossierCpnAssocie && (
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>pregnant_woman</span>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Dossier CPN associé</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dossier.dossierCpnAssocie.statut === 'CLOS' ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-secondary/10 text-secondary'}`}>
                {dossier.dossierCpnAssocie.statut}
              </span>
            </div>
            <button
              onClick={() => navigate(`/cpn/${dossier.dossierCpnAssocie.id}`)}
              className="flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              Voir le dossier CPN
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>

          {/* Infos grossesse */}
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-on-surface-variant">N° dossier CPN</p>
              <p className="font-mono font-medium text-on-surface">{dossier.dossierCpnAssocie.numeroDossierCpn ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Ouverture CPN</p>
              <p className="font-medium text-on-surface">{dossier.dossierCpnAssocie.dateOuverture ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Gestité / Parité</p>
              <p className="font-medium text-on-surface">G{dossier.dossierCpnAssocie.gestite ?? '?'} P{dossier.dossierCpnAssocie.parite ?? '?'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">DPA</p>
              <p className="font-medium text-on-surface">{dossier.dossierCpnAssocie.dateProbableAccouchement ?? '—'}</p>
            </div>
            {dossier.dossierCpnAssocie.groupeSanguin && (
              <div>
                <p className="text-xs text-on-surface-variant">Groupe / Rhésus</p>
                <p className="font-medium text-on-surface">{dossier.dossierCpnAssocie.groupeSanguin} {dossier.dossierCpnAssocie.rhesus}</p>
              </div>
            )}
            {dossier.dossierCpnAssocie.vihStatut && (
              <div>
                <p className="text-xs text-on-surface-variant">VIH</p>
                <p className="font-medium text-on-surface">{dossier.dossierCpnAssocie.vihStatut}</p>
              </div>
            )}
          </div>

          {/* Contacts CPN */}
          {dossier.dossierCpnAssocie.contacts?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Contacts CPN ({dossier.dossierCpnAssocie.contacts.length})</p>
              <ul className="space-y-1.5">
                {dossier.dossierCpnAssocie.contacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-container px-4 py-2.5 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary text-xs font-bold">
                      {c.numeroContact}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface">Contact #{c.numeroContact} — {c.dateContact}</p>
                      {c.etatGeneral && <p className="text-xs text-on-surface-variant">État : {c.etatGeneral}</p>}
                    </div>
                    {c.ageGestationnel && (
                      <span className="text-xs text-on-surface-variant">{c.ageGestationnel} SA</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examens CPN */}
          {dossier.dossierCpnAssocie.examens?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Examens CPN ({dossier.dossierCpnAssocie.examens.length})</p>
              <ul className="space-y-1.5">
                {dossier.dossierCpnAssocie.examens.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 rounded-xl bg-surface-container px-4 py-2.5 text-sm">
                    <span className="material-symbols-outlined text-base text-secondary">lab_research</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface">{e.libelle ?? e.typeExamen}</p>
                      {e.resultat && <p className="text-xs text-on-surface-variant">{e.resultat}</p>}
                    </div>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${e.statut === 'RESULTAT_DISPONIBLE' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      {e.statut === 'RESULTAT_DISPONIBLE' ? 'Résultat' : e.statut === 'EN_ATTENTE' ? 'En attente' : e.statut}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Historique des grossesses (dossiers CPN/CPS antérieurs) ── */}
      {(dossier.historiqueCpn?.length > 1 || dossier.historiqueCps?.length > 1) && (
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">history</span>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">Historique obstétrical</h3>
          </div>
          {dossier.historiqueCpn?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Grossesses (CPN)</p>
              <ul className="space-y-1.5">
                {dossier.historiqueCpn.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/cpn/${c.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl bg-surface-container px-4 py-2.5 text-sm hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">pregnant_woman</span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-on-surface">{c.numeroDossierCpn}</p>
                        <p className="text-xs text-on-surface-variant">G{c.gestite ?? '?'} P{c.parite ?? '?'} — Ouvert le {c.dateOuverture}</p>
                      </div>
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${c.statut === 'CLOS' ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-secondary/10 text-secondary'}`}>
                        {c.statut}
                      </span>
                      <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_right</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dossier.historiqueCps?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Suivi postnatal (CPS)</p>
              <ul className="space-y-1.5">
                {dossier.historiqueCps.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/cps-femme/${c.id}`)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm hover:opacity-80 transition-colors ${c.id === dossierId ? 'bg-primary/10 border border-primary/20' : 'bg-surface-container'}`}
                    >
                      <span className="material-symbols-outlined text-base text-primary">stethoscope</span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-on-surface">{c.numeroDossierCps} {c.id === dossierId && '(actuel)'}</p>
                        <p className="text-xs text-on-surface-variant">{c.nombreVisites} visite(s) — {c.dateOuverture}</p>
                      </div>
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${c.statut === 'CLOS' ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary/10 text-primary'}`}>
                        {c.statut}
                      </span>
                      <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_right</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Clôture ── */}
      {!estClos && (
        <div className="rounded-2xl border border-outline-variant/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">lock</span>
            <h3 className="text-sm font-bold text-on-surface">Clôturer le dossier CPS</h3>
          </div>
          {!modeCloture ? (
            <button
              onClick={() => setModeCloture(true)}
              className="rounded-full border border-outline-variant px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              Clôturer ce dossier
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant">Clôturé par *</label>
                <input type="text" required value={formCloture.closPar}
                  onChange={(e) => setFormCloture((f) => ({ ...f, closPar: e.target.value }))}
                  placeholder="Nom du médecin / sage-femme"
                  className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant">Notes de clôture</label>
                <textarea rows={2} value={formCloture.notesCloture}
                  onChange={(e) => setFormCloture((f) => ({ ...f, notesCloture: e.target.value }))}
                  placeholder="Observations finales…"
                  className="rounded-xl bg-surface-container px-3 py-2 text-sm text-on-surface outline-none resize-none placeholder:text-on-surface-variant" />
              </div>
              {envoiCloture.erreur && (
                <p className="text-sm text-error">{envoiCloture.erreur}</p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModeCloture(false)}
                  className="rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
                  Annuler
                </button>
                <button type="button" onClick={cloturerDossier} disabled={!formCloture.closPar.trim() || envoiCloture.chargement}
                  className="flex items-center gap-2 rounded-full bg-error px-4 py-2 text-sm font-semibold text-on-error disabled:opacity-60">
                  {envoiCloture.chargement && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                  Confirmer la clôture
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {estClos && (
        <div className="rounded-2xl bg-surface-container px-6 py-4 text-sm text-on-surface-variant space-y-1">
          <p><span className="font-semibold">Dossier clôturé le</span> {dossier.dateCloture}</p>
          {dossier.closPar && <p><span className="font-semibold">Par</span> {dossier.closPar}</p>}
          {dossier.notesCloture && <p>{dossier.notesCloture}</p>}
        </div>
      )}

      {/* ── Modale enregistrement d'un enfant ── */}
      {modaleEnfant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                <h3 className="text-base font-bold text-on-surface">Enregistrer un enfant</h3>
              </div>
              <button onClick={() => setModaleEnfant(false)} className="rounded-full p-1 hover:bg-surface-container">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Infos mère (pré-rempli) */}
            <div className="rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
              <p className="text-xs font-semibold text-on-surface mb-1">Mère</p>
              <p>{dossier.patiente?.nom} · {dossier.patiente?.telephone}</p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant">Nom *</label>
                <input type="text" value={formEnfant.nom}
                  onChange={(e) => setFormEnfant((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Nom de famille"
                  className="rounded-xl bg-surface-container px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-on-surface-variant">Post-nom</label>
                  <input type="text" value={formEnfant.postnom}
                    onChange={(e) => setFormEnfant((f) => ({ ...f, postnom: e.target.value }))}
                    className="rounded-xl bg-surface-container px-3 py-2 text-sm outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-on-surface-variant">Prénom</label>
                  <input type="text" value={formEnfant.prenom}
                    onChange={(e) => setFormEnfant((f) => ({ ...f, prenom: e.target.value }))}
                    className="rounded-xl bg-surface-container px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-on-surface-variant">Sexe *</label>
                  <select value={formEnfant.sexe}
                    onChange={(e) => setFormEnfant((f) => ({ ...f, sexe: e.target.value }))}
                    className="rounded-xl bg-surface-container px-3 py-2 text-sm outline-none">
                    <option value="">— Choisir —</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-on-surface-variant">Date de naissance *</label>
                  <input type="date" value={formEnfant.dateNaissance}
                    onChange={(e) => setFormEnfant((f) => ({ ...f, dateNaissance: e.target.value }))}
                    className="rounded-xl bg-surface-container px-3 py-2 text-sm outline-none" />
                </div>
              </div>
            </div>

            {envoiEnfant.erreur && (
              <p className="text-sm text-error">{envoiEnfant.erreur}</p>
            )}
            {envoiEnfant.succes && (
              <p className="text-sm text-primary font-medium">Enfant enregistré avec succès !</p>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModaleEnfant(false)}
                className="rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
                Annuler
              </button>
              <button type="button" onClick={soumettreEnfant}
                disabled={!formEnfant.nom.trim() || !formEnfant.sexe || !formEnfant.dateNaissance || envoiEnfant.chargement}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60">
                {envoiEnfant.chargement && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageDetailDossierCpsFemme
