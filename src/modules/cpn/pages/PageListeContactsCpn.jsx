// Page affichant l'historique de tous les contacts CPN d'un dossier en pleine page.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'
import SectionContacts from '../composants/SectionContacts'

function PageListeContactsCpn() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [chargement, setChargement] = useState(true)
  const [dossier, setDossier] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    serviceCpn.obtenirDossier(dossierId)
      .then((data) => { if (actif) { setDossier(data); setChargement(false) } })
      .catch((ex) => { if (actif) { setErreur(ex.message); setChargement(false) } })
    return () => { actif = false }
  }, [dossierId])

  if (chargement) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement des contacts…</p>
        </div>
      </div>
    )
  }

  if (erreur || !dossier) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <p>{erreur || 'Dossier introuvable.'}</p>
        </div>
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-6 py-3 text-sm font-bold text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier CPN
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16">

      {/* En-tête */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => navigate(-1)}
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Historique des contacts CPN</h2>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg text-primary">person</span>
              <span className="font-semibold">{dossier.nomPatiente ?? '—'}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-outline-variant"></div>
            <div className="rounded-md bg-surface-container-high px-3 py-0.5">
              <span className="font-mono text-sm font-bold text-primary">{dossier.numeroDossierCpn ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des contacts */}
      <SectionContacts
        dossierId={dossierId}
        contacts={dossier.contacts}
        statut={dossier.statut}
        fromHistorique={!!location.state?.fromHistorique}
      />
    </div>
  )
}

export default PageListeContactsCpn
