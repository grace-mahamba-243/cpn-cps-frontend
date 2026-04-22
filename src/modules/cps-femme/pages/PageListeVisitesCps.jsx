// Page affichant l'historique complet des visites CPS d'un dossier en pleine page.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'

const LABELS_TYPE_VISITE = {
  SIX_HEURES: { label: 'Visite 6 heures', icone: 'schedule', couleur: 'text-primary bg-primary/10' },
  SIX_JOURS: { label: 'Visite 6 jours', icone: 'calendar_today', couleur: 'text-tertiary bg-tertiary/10' },
  SIX_SEMAINES: { label: 'Visite 6 semaines', icone: 'event_available', couleur: 'text-secondary bg-secondary/10' },
  SURPRISE: { label: 'Visite surprise', icone: 'add_circle', couleur: 'text-on-surface-variant bg-surface-container-highest' },
}

const VISITES_PROTOCOLE = ['SIX_HEURES', 'SIX_JOURS', 'SIX_SEMAINES']

function PageListeVisitesCps() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromHistorique = location.state?.fromHistorique ?? false

  const [chargement, setChargement] = useState(true)
  const [dossier, setDossier] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    serviceCpsFemme.obtenirDossier(dossierId)
      .then((data) => { if (actif) { setDossier(data); setChargement(false) } })
      .catch((ex) => { if (actif) { setErreur(ex.message); setChargement(false) } })
    return () => { actif = false }
  }, [dossierId])

  if (chargement) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">refresh</span>
        Chargement des visites…
      </div>
    )
  }

  if (erreur || !dossier) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-error-container px-5 py-4 text-sm text-on-error-container">{erreur || 'Dossier introuvable.'}</div>
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier CPS
        </button>
      </div>
    )
  }

  const visites = dossier.visites ?? []
  const visitesExistantes = new Set(visites.map((v) => v.typeVisite))
  const estClos = dossier.statut === 'CLOS'

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => navigate(-1)}
            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Visites postnatales CPS</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {dossier.numeroDossierCps} · {dossier.patiente?.nom ?? '—'}
              {fromHistorique && (
                <span className="ml-2 rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                  Lecture seule
                </span>
              )}
            </p>
          </div>
        </div>
        {!estClos && !fromHistorique && (
          <button
            onClick={() => navigate(`/cps-femme/${dossierId}/visites/nouvelle`)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nouvelle visite
          </button>
        )}
      </div>

      {/* ── Liste complète des visites ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">
          Toutes les visites
          <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{visites.length}</span>
        </h3>

        {visites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant/30 py-10 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">calendar_today</span>
            <p className="text-sm text-on-surface-variant">Aucune visite enregistrée</p>
            {!estClos && !fromHistorique && (
              <button
                onClick={() => navigate(`/cps-femme/${dossierId}/visites/nouvelle`)}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Enregistrer la première visite
              </button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {visites.map((v) => {
              const config = LABELS_TYPE_VISITE[v.typeVisite] ?? LABELS_TYPE_VISITE.SURPRISE
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/cps-femme/${dossierId}/visites/${v.id}`, { state: fromHistorique ? { fromHistorique: true } : undefined })}
                    className="flex w-full items-center gap-3 rounded-xl bg-surface-container px-4 py-3 text-left hover:bg-surface-container-low transition-colors"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.couleur}`}>
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {config.icone}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface">{config.label}</p>
                      <p className="text-xs text-on-surface-variant">{v.dateVisite}</p>
                    </div>
                    {v.etatGeneral && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.etatGeneral === 'BON' ? 'bg-primary/10 text-primary'
                        : v.etatGeneral === 'PASSABLE' ? 'bg-tertiary/10 text-tertiary'
                        : 'bg-error-container text-on-error-container'
                      }`}>
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
      </div>
    </div>
  )
}

export default PageListeVisitesCps
