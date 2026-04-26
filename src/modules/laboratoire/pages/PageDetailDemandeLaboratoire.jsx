// Ce composant affiche le detail d'une demande d'examen et permet au laborantin de la prendre en charge, saisir le resultat et l'envoyer vers le module clinique.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceLaboratoire from '../../../services/api/serviceLaboratoire'
import InfoEnregistrement from '../../../composants/partages/InfoEnregistrement'

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

function fmtHeure(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
  const peutPrendreEnCharge = demande.statut === 'DEMANDE'
  const peutSaisirResultat = ['DEMANDE', 'EN_COURS'].includes(demande.statut)

  return (
    <div className="min-h-screen bg-surface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 border-b border-surface-container bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/laboratoire')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container transition-colors hover:bg-primary-fixed"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-bold text-on-background md:text-xl">Détails de la Prescription #{demande.id?.slice(0, 8) ?? 'N/A'}</h1>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${infoStatut.couleur}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                  {infoStatut.libelle}
                </span>
                <span className="text-on-surface-variant">• Reçu il y a {Math.floor((Date.now() - new Date(demande.creeLe)) / 60000)} minute{Math.floor((Date.now() - new Date(demande.creeLe)) / 60000) > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 rounded-xl bg-surface-container-low px-3 py-2 md:flex">
             
            </div>
            <div className="flex gap-1 rounded-full bg-surface-container-low p-1">
              
            
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Details & Tests (50%) */}
          <div className="space-y-8">
          <section className="rounded-xl border-l-4 border-primary bg-primary-container/20 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-lg">clinical_notes</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-on-surface mb-2">Note du Clinicien</h3>
                <p className="text-sm leading-relaxed text-on-surface">{demande.notes || 'Aucune note clinique transmise.'}</p>
              </div>
            </div>
          </section>

          {/* Tests Section */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h3 className="text-lg font-bold text-on-background">Analyse Demandée</h3>
              <span className="text-xs font-medium text-on-surface-variant">1 Test identifié</span>
            </div>

            {/* Test Item */}
            <div className="space-y-3 rounded-xl bg-surface-container-lowest p-5 border-l-4 border-tertiary-container shadow-sm hover:bg-surface-bright transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tertiary-container/10 text-tertiary">
                    <span className="material-symbols-outlined">biotech</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{demande.libelle}</h4>
                    <p className="text-xs text-on-surface-variant">{demande.typeExamen || 'Laboratoire'} • Examen</p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="rounded bg-surface-container-high px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Standard</span>
                </div>
              </div>
              <div className="border-t border-surface-container-high pt-3 text-xs text-on-surface-variant">
                <p>Demandé le <span className="font-medium text-on-surface">{fmtDate(demande.creeLe)}</span></p>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4 border-t border-surface-container pt-4">
            {!modeFormulaire && (
              <button
                type="button"
                onClick={() => setModeFormulaire(true)}
                disabled={!peutSaisirResultat}
                className="group flex w-full items-center justify-between rounded-full bg-on-background p-4 font-bold text-surface shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-1/2"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">play_arrow</span>
                  <span>Lancer l'analyse</span>
                </span>
                <span className="material-symbols-outlined opacity-0 transition-opacity group-hover:opacity-100">arrow_forward</span>
              </button>
            )}
            {erreurPec && (
              <div className="flex items-center gap-2 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                <span className="material-symbols-outlined text-base">error</span>
                {erreurPec}
              </div>
            )}
          </div>

          {modeFormulaire && peutSaisirResultat && (
            <form onSubmit={handleEnvoyerResultat} className="space-y-4 rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <span className="material-symbols-outlined text-lg text-primary">lab_research</span>
                Saisie du résultat
              </h2>

              {erreurFormulaire && (
                <div className="flex items-center gap-2 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                  <span className="material-symbols-outlined text-base">error</span>
                  {erreurFormulaire}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Résultat</label>
                <textarea
                  value={resultat}
                  onChange={(e) => setResultat(e.target.value)}
                  rows={4}
                  required
                  placeholder="Saisir le résultat de l'examen..."
                  className="w-full resize-none rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date de l'examen</label>
                  <input
                    type="date"
                    value={dateExamen}
                    onChange={(e) => setDateExamen(e.target.value)}
                    className="w-full rounded-2xl bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date du résultat</label>
                  <input
                    type="date"
                    value={dateResultat}
                    onChange={(e) => setDateResultat(e.target.value)}
                    className="w-full rounded-2xl bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Notes complémentaires</label>
                <textarea
                  value={notesResultat}
                  onChange={(e) => setNotesResultat(e.target.value)}
                  rows={2}
                  placeholder="Remarques, observations..."
                  className="w-full resize-none rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-wrap gap-3 border-t border-surface-container-high pt-4">
                <button
                  type="submit"
                  disabled={envoi}
                  className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">{envoi ? 'progress_activity' : 'send'}</span>
                  {envoi ? 'Envoi...' : 'Envoyer le résultat'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModeFormulaire(false)
                    setErreurFormulaire(null)
                  }}
                  disabled={envoi}
                  className="flex items-center gap-2 rounded-2xl bg-surface-container px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {demande.resultat && !modeFormulaire && (
            <section className="space-y-3 rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="material-symbols-outlined text-base">lab_research</span>
                Résultat
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Tuile label="Date examen" valeur={fmtDate(demande.dateExamen)} icone="event" />
                <Tuile label="Date résultat" valeur={fmtDate(demande.dateResultat)} icone="task_alt" />
              </div>
              <div className="whitespace-pre-wrap rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface">{demande.resultat}</div>
            </section>
          )}
        </div>

        {/* Right Column: Contextual Info (50%) */}
        <aside className="space-y-6">
          {/* Patient Info Card */}
          <div className="rounded-2xl bg-surface-container-low p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container ring-4 ring-surface-container-lowest">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <div>
                <h4 className="text-lg font-extrabold leading-tight text-on-surface">{demande.patiente?.nom || 'Patiente'}</h4>
                <p className="text-xs text-on-surface-variant">ID: #{demande.numeroDossierCpn || '—'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-surface-container-high py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Sexe</span>
                <span className="text-sm font-bold text-on-surface">Féminin</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-container-high py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Age</span>
                <span className="text-sm font-bold text-on-surface">— ans</span>
              </div>
              {demande.numeroContact && (
                <div className="rounded-xl bg-white/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">Contact</p>
                  <p className="mt-1 text-xs font-medium text-on-surface">
                    Contact {demande.numeroContact} - {fmtDate(demande.dateContact)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prescriber Card */}
        
          

          {/* Timeline / Activity Log */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
           
            <div className="relative space-y-6 before:absolute before:left-2.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-surface-container-highest">
              
              {demande.prisEnChargeLe && (
                <div className="flex gap-4 relative">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border-4 border-surface-bright bg-tertiary z-10 shadow-sm"></div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Échantillon reçu</p>
                    <p className="text-[10px] text-on-surface-variant">{fmtDatetime(demande.prisEnChargeLe)}</p>
                  </div>
                </div>
              )}
              {demande.envoyeLe && (
                <div className="flex gap-4 relative">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border-4 border-surface-bright bg-secondary z-10 shadow-sm"></div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Résultat envoyé</p>
                    <p className="text-[10px] text-on-surface-variant">{fmtDatetime(demande.envoyeLe)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <InfoEnregistrement enregistrePar={demande.enregistrePar} modifiePar={demande.modifiePar} />
    </div>
    </div>
  )
}

export default PageDetailDemandeLaboratoire
