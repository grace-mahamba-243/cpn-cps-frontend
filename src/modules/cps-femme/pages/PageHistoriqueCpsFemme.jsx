// Ce composant affiche l'historique des suivis CPS (dossiers clos) d'une patiente.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'

function formaterDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DossierCps({ dossier, numero, onOuvrir }) {
  const periode = `${formaterDate(dossier.dateOuverture)} - ${formaterDate(dossier.dateCloture)}`

  return (
    <button
      onClick={() => onOuvrir(dossier.id)}
      className="group flex w-full items-start gap-4 rounded-2xl bg-surface-container-lowest p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md border border-outline-variant/60"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container/30 text-secondary shrink-0">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
      </div>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-on-surface">Suivi postnatal {numero}</p>
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
            {dossier.numeroDossierCps}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            Clos
          </span>
        </div>

        <p className="text-xs text-on-surface-variant">{periode}</p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-on-surface-variant">
          {dossier.modeAccouchement && (
            <span><span className="font-medium text-on-surface">Accouchement :</span> {dossier.modeAccouchement.toLowerCase()}</span>
          )}
          <span><span className="font-medium text-on-surface">Visites :</span> {dossier.visites?.length ?? 0}</span>
          {dossier.typeAccouchementEntree && (
            <span><span className="font-medium text-on-surface">Entrée :</span> {dossier.typeAccouchementEntree === 'INTERNE' ? 'Interne' : 'Externe'}</span>
          )}
        </div>

        {dossier.notesCloture && (
          <p className="mt-1.5 text-[12px] text-on-surface-variant italic line-clamp-1">
            {dossier.notesCloture}
          </p>
        )}
      </div>

      <span className="material-symbols-outlined text-lg text-on-surface-variant/30 transition-colors group-hover:text-on-surface-variant/70 self-center">
        arrow_forward
      </span>
    </button>
  )
}

function PageHistoriqueCpsFemme() {
  const { patienteId } = useParams()
  const navigate = useNavigate()
  const [dossiers, setDossiers] = useState([])
  const [nomPatiente, setNomPatiente] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const charger = async () => {
      setChargement(true)
      setErreur('')
      try {
        const liste = await serviceCpsFemme.listerDossiersParPatiente(patienteId)
        const clos = liste
          .filter((d) => d.statut === 'CLOS')
          .sort((a, b) => new Date(b.dateOuverture) - new Date(a.dateOuverture))
        setDossiers(clos)
        if (liste.length > 0) setNomPatiente(liste[0].patiente?.nom ?? '')
      } catch (ex) {
        setErreur(ex.message)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [patienteId])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour
      </button>

      <div>
        <h1 className="text-xl font-bold text-on-surface">Historique des suivis postnatals</h1>
        {nomPatiente && <p className="mt-0.5 text-sm text-on-surface-variant">{nomPatiente}</p>}
      </div>

      {chargement && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      )}

      {erreur && (
        <div className="rounded-2xl bg-error-container/30 px-5 py-4 text-sm text-on-error-container">{erreur}</div>
      )}

      {!chargement && !erreur && dossiers.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container px-6 py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">folder_off</span>
          <p className="text-sm text-on-surface-variant">Aucun suivi postnatal clos dans l&apos;historique.</p>
        </div>
      )}

      {!chargement && !erreur && dossiers.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
            {dossiers.length} suivi{dossiers.length > 1 ? 's' : ''} clos
          </p>
          {dossiers.map((d, i) => (
            <DossierCps
              key={d.id}
              dossier={d}
              numero={dossiers.length - i}
              onOuvrir={(id) => navigate(`/cps-femme/${id}`, { state: { fromHistorique: true } })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PageHistoriqueCpsFemme
