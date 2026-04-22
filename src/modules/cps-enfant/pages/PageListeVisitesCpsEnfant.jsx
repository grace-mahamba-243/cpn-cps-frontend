// Ce composant affiche la liste paginée des visites CPS d'un enfant avec navigation vers chaque visite.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'

const LABELS_VISITE = {
  SIX_HEURES: 'Visite 6 heures', SIX_JOURS: 'Visite 6 jours', SIX_SEMAINES: 'Visite 6 semaines',
  M2: 'Visite 2 mois', M3: 'Visite 3 mois', M6: 'Visite 6 mois',
  M9: 'Visite 9 mois', M12: 'Visite 12 mois', SURPRISE: 'Visite surprise',
}

function PageListeVisitesCpsEnfant() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const [visites, setVisites] = useState([])
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let actif = true
    setChargement(true)
    Promise.all([
      serviceCpsEnfant.listerVisites(dossierId),
      serviceCpsEnfant.obtenirDossier(dossierId),
    ])
      .then(([v, d]) => { if (actif) { setVisites(v); setDossier(d) } })
      .catch((e) => { if (actif) setErreur(e.message) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [dossierId])

  const nomEnfant = dossier?.enfant
    ? [dossier.enfant.nom, dossier.enfant.postnom, dossier.enfant.prenom].filter(Boolean).join(' ')
    : dossier?.mereNom ? `Enfant de ${dossier.mereNom}` : '—'

  if (chargement) {
    return (
      <div className="flex items-center gap-2 py-10 text-on-surface-variant text-sm">
        <span className="material-symbols-outlined animate-spin">refresh</span> Chargement...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/cps-enfant/${dossierId}`)}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span> Retour
        </button>
        <div>
          <h1 className="font-headline text-lg font-bold text-on-surface">Visites CPS Enfant</h1>
          {dossier && <p className="text-xs text-on-surface-variant">{nomEnfant} · {dossier.numeroDossierCps}</p>}
        </div>
        <button onClick={() => navigate(`/cps-enfant/${dossierId}/visites/nouvelle`)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90">
          <span className="material-symbols-outlined text-sm">add</span> Nouvelle visite
        </button>
      </div>

      {erreur && (
        <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{erreur}</div>
      )}

      {visites.length === 0 ? (
        <div className="py-12 text-center text-sm text-on-surface-variant">
          <span className="material-symbols-outlined mb-2 block text-3xl opacity-30">medical_services</span>
          Aucune visite enregistrée pour ce dossier.
        </div>
      ) : (
        <div className="space-y-2">
          {visites.map((v) => (
            <button key={v.id}
              onClick={() => navigate(`/cps-enfant/${dossierId}/visites/${v.id}`)}
              className="group flex w-full items-center gap-4 rounded-2xl bg-surface-container-lowest p-4 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-on-surface">{LABELS_VISITE[v.typeVisite] ?? v.typeVisite}</p>
                <p className="text-xs text-on-surface-variant">
                  {v.dateVisite ? new Date(v.dateVisite).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-on-surface-variant">
                {v.poidsKg && <span>{v.poidsKg} kg</span>}
                {v.tailleCm && <span>{v.tailleCm} cm</span>}
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-on-surface-variant/60 transition-colors">arrow_forward</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PageListeVisitesCpsEnfant
