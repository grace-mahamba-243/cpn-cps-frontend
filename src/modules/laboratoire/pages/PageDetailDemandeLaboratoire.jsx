// Ce composant affiche le detail d'une demande d'examen et permet au laborantin de la prendre en charge, saisir le resultat et l'envoyer vers le module clinique.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceLaboratoire from '../../../services/api/serviceLaboratoire'

const ETIQUETTES_STATUT = {
  DEMANDE: { libelle: 'En attente', couleur: 'bg-error-container text-on-error-container', icone: 'schedule' },
  EN_COURS: { libelle: 'En cours', couleur: 'bg-tertiary-container text-on-tertiary-container', icone: 'autorenew' },
  RESULTAT_ENVOYE: { libelle: 'Résultat envoyé', couleur: 'bg-secondary-container text-on-secondary-container', icone: 'check_circle' },
  RESULTAT_RECU: { libelle: 'Validé par la clinique', couleur: 'bg-primary-container text-on-primary-container', icone: 'verified' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDatetime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Tuile({ label, valeur, icone }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 space-y-1 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1">
        {icone && <span className="material-symbols-outlined text-on-surface-variant text-base">{icone}</span>}
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-semibold text-on-surface">{valeur ?? '—'}</p>
    </div>
  )
}

function PageDetailDemandeLaboratoire() {
  const { examenId } = useParams()
  const navigate = useNavigate()

  const [demande, setDemande] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  // Formulaire saisie resultat
  const [modeFormulaire, setModeFormulaire] = useState(false)
  const [resultat, setResultat] = useState('')
  const [dateExamen, setDateExamen] = useState('')
  const [dateResultat, setDateResultat] = useState(new Date().toISOString().split('T')[0])
  const [notesResultat, setNotesResultat] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState(null)

  // Prise en charge
  const [prisEnCharge, setPrisEnCharge] = useState(false)
  const [erreurPec, setErreurPec] = useState(null)

  const charger = async () => {
    setChargement(true)
    setErreur(null)
    try {
      const d = await serviceLaboratoire.obtenirDemande(examenId)
      if (!d) throw new Error('Demande introuvable.')
      setDemande(d)
      if (d.dateExamen) setDateExamen(d.dateExamen)
      if (d.notes) setNotesResultat(d.notes)
    } catch (e) {
      setErreur(e.message ?? 'Impossible de charger la demande.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [examenId])

  const handlePrendreEnCharge = async () => {
    if (prisEnCharge) return
    setPrisEnCharge(true)
    setErreurPec(null)
    try {
      const d = await serviceLaboratoire.prendreEnCharge(examenId, {})
      setDemande(d)
    } catch (e) {
      setErreurPec(e.message ?? 'Erreur lors de la prise en charge.')
    } finally {
      setPrisEnCharge(false)
    }
  }

  const handleEnvoyerResultat = async (e) => {
    e.preventDefault()
    if (!resultat.trim()) {
      setErreurFormulaire('Le résultat est obligatoire.')
      return
    }
    setEnvoi(true)
    setErreurFormulaire(null)
    try {
      const d = await serviceLaboratoire.envoyerResultat(examenId, {
        resultat: resultat.trim(),
        dateExamen: dateExamen || undefined,
        dateResultat: dateResultat || undefined,
        notes: notesResultat || undefined,
      })
      setDemande(d)
      setModeFormulaire(false)
    } catch (err) {
      setErreurFormulaire(err.message ?? 'Impossible d\'envoyer le résultat.')
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
        <span className="text-sm">Chargement…</span>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-4 text-sm flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base">error</span>
          {erreur}
        </div>
        <button
          type="button"
          onClick={() => navigate('/laboratoire')}
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour aux demandes
        </button>
      </div>
    )
  }

  const infoStatut = ETIQUETTES_STATUT[demande.statut] ?? { libelle: demande.statut, couleur: 'bg-surface-container text-on-surface', icone: 'help' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation */}
      <button
        type="button"
        onClick={() => navigate('/laboratoire')}
        className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Retour aux demandes
      </button>

      {/* Entete demande */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">biotech</span>
            <div>
              <h1 className="text-lg font-bold text-on-surface">{demande.libelle}</h1>
              <p className="text-xs text-on-surface-variant">{demande.typeExamen}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${infoStatut.couleur}`}>
            <span className="material-symbols-outlined text-xs">{infoStatut.icone}</span>
            {infoStatut.libelle}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Tuile label="Patiente" valeur={demande.patiente?.nom} icone="person" />
          <Tuile label="Dossier CPN" valeur={demande.numeroDossierCpn} icone="folder" />
          {demande.numeroContact && (
            <Tuile label="Contact" valeur={`Contact ${demande.numeroContact} — ${fmtDate(demande.dateContact)}`} icone="calendar_today" />
          )}
          <Tuile label="Demandé le" valeur={fmtDate(demande.creeLe)} icone="schedule" />
        </div>

        {demande.notes && !modeFormulaire && demande.statut === 'EN_COURS' && (
          <div className="bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface-variant">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Notes</p>
            <p>{demande.notes}</p>
          </div>
        )}
      </div>

      {/* Suivi temporel */}
      {(demande.prisEnChargeLe || demande.envoyeLe) && (
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-base">timeline</span>
            Suivi
          </h2>
          <div className="space-y-2">
            {demande.prisEnChargeLe && (
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-tertiary text-base">autorenew</span>
                Pris en charge le <span className="font-medium">{fmtDatetime(demande.prisEnChargeLe)}</span>
              </div>
            )}
            {demande.envoyeLe && (
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-secondary text-base">send</span>
                Résultat envoyé le <span className="font-medium">{fmtDatetime(demande.envoyeLe)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resultat (si disponible et pas en mode formulaire) */}
      {demande.resultat && !modeFormulaire && (
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-base">lab_research</span>
            Résultat
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Tuile label="Date examen" valeur={fmtDate(demande.dateExamen)} icone="event" />
            <Tuile label="Date résultat" valeur={fmtDate(demande.dateResultat)} icone="task_alt" />
          </div>
          <div className="bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface whitespace-pre-wrap">
            {demande.resultat}
          </div>
          {demande.notes && (
            <div className="text-xs text-on-surface-variant italic">{demande.notes}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Erreur PEC */}
        {erreurPec && (
          <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {erreurPec}
          </div>
        )}

        {/* Bouton prendre en charge */}
        {demande.statut === 'DEMANDE' && !modeFormulaire && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrendreEnCharge}
              disabled={prisEnCharge}
              className="flex items-center gap-2 bg-tertiary text-on-tertiary px-5 py-3 rounded-2xl text-sm font-medium disabled:opacity-50 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">
                {prisEnCharge ? 'progress_activity' : 'play_arrow'}
              </span>
              {prisEnCharge ? 'Traitement…' : 'Prendre en charge'}
            </button>
            <button
              type="button"
              onClick={() => setModeFormulaire(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-2xl text-sm font-medium transition-opacity"
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              Saisir le résultat
            </button>
          </div>
        )}

        {demande.statut === 'EN_COURS' && !modeFormulaire && (
          <button
            type="button"
            onClick={() => setModeFormulaire(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-2xl text-sm font-medium"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            Saisir et envoyer le résultat
          </button>
        )}

        {/* Formulaire saisie resultat */}
        {modeFormulaire && ['DEMANDE', 'EN_COURS'].includes(demande.statut) && (
          <form onSubmit={handleEnvoyerResultat} className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">lab_research</span>
              Saisie du résultat
            </h2>

            {erreurFormulaire && (
              <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {erreurFormulaire}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Résultat <span className="text-error">*</span>
              </label>
              <textarea
                value={resultat}
                onChange={(e) => setResultat(e.target.value)}
                rows={4}
                required
                placeholder="Saisir le résultat de l'examen…"
                className="w-full bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Date de l'examen</label>
                <input
                  type="date"
                  value={dateExamen}
                  onChange={(e) => setDateExamen(e.target.value)}
                  className="w-full bg-surface-container rounded-2xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Date du résultat</label>
                <input
                  type="date"
                  value={dateResultat}
                  onChange={(e) => setDateResultat(e.target.value)}
                  className="w-full bg-surface-container rounded-2xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Notes complémentaires</label>
              <textarea
                value={notesResultat}
                onChange={(e) => setNotesResultat(e.target.value)}
                rows={2}
                placeholder="Remarques, observations…"
                className="w-full bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={envoi}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-2xl text-sm font-medium disabled:opacity-50 transition-opacity"
              >
                <span className="material-symbols-outlined text-base">
                  {envoi ? 'progress_activity' : 'send'}
                </span>
                {envoi ? 'Envoi…' : 'Envoyer le résultat'}
              </button>
              <button
                type="button"
                onClick={() => { setModeFormulaire(false); setErreurFormulaire(null) }}
                disabled={envoi}
                className="flex items-center gap-2 bg-surface-container text-on-surface px-5 py-3 rounded-2xl text-sm font-medium disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PageDetailDemandeLaboratoire
