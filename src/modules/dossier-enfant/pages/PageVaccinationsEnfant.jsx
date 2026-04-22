// Page d'historique vaccinal d'un enfant. Affiche la liste compacte des doses avec détail au clic.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

function formaterDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function BadgeStatut({ statut }) {
  if (statut === 'ADMINISTREE') {
    return (
      <span className="rounded-full bg-tertiary-container px-2.5 py-0.5 text-[11px] font-semibold text-on-tertiary-container">
        Administrée
      </span>
    )
  }
  if (statut === 'DIFFEREE') {
    return (
      <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[11px] font-semibold text-on-secondary-container">
        Différée
      </span>
    )
  }
  return (
    <span className="rounded-full bg-error-container px-2.5 py-0.5 text-[11px] font-semibold text-on-error-container">
      {statut}
    </span>
  )
}

// Ligne d'une dose — compacte, cliquable pour voir le détail
function LigneDose({ dose }) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <div className="bg-surface overflow-hidden">
      {/* En-tête compacte — toujours visible */}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-3.5 hover:bg-surface-container transition-colors text-left"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary-container/50 text-secondary">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>vaccines</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface text-sm">{dose.vaccin}</p>
          <p className="text-xs text-on-surface-variant">{formaterDate(dose.dateAdministration)}</p>
        </div>
        <BadgeStatut statut={dose.statut} />
        <span className="material-symbols-outlined text-on-surface-variant/50 text-base">
          {ouvert ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Détail — visible si ouvert */}
      {ouvert && (
        <div className="border-t border-outline-variant/30 bg-surface-container-lowest px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {[
              { label: 'Vaccin', valeur: dose.vaccin },
              { label: 'Statut', valeur: dose.statut },
              { label: 'Date d\'administration', valeur: formaterDate(dose.dateAdministration) },
              { label: 'Numéro de dose', valeur: dose.numeroDose ?? '—' },
              { label: 'Numéro de lot', valeur: dose.numeroLot ?? '—' },
              { label: 'Âge (mois)', valeur: dose.ageMois != null ? `${dose.ageMois} mois` : '—' },
              { label: 'Enregistré le', valeur: formaterDate(dose.creeLe) },
            ].map(({ label, valeur }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
                <span className="text-sm font-medium text-on-surface">{valeur}</span>
              </div>
            ))}
          </div>
          {dose.motifReport && (
            <div className="rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">Motif report : </span>{dose.motifReport}
            </div>
          )}
          {dose.observations && (
            <div className="rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">Observations : </span>{dose.observations}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PageVaccinationsEnfant() {
  const { enfantId } = useParams()
  const navigate = useNavigate()
  const [doses, setDoses] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = async () => {
    setChargement(true)
    setErreur('')
    try {
      const data = await serviceDossiersEnfants.listerVaccinations(enfantId)
      setDoses(Array.isArray(data) ? data : [])
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [enfantId])

  if (chargement) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined animate-spin">hourglass_top</span>
          <p>Chargement du carnet vaccinal…</p>
        </div>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-error-container px-6 py-4 text-on-error-container text-sm">
          <span className="material-symbols-outlined">error</span>
          {erreur}
        </div>
        <button onClick={charger} className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-base">refresh</span>
          Réessayer
        </button>
      </div>
    )
  }

  // Groupement par date d'administration (clé = date ISO YYYY-MM-DD)
  const groupesParDate = doses.reduce((acc, d) => {
    const key = d.dateAdministration ? d.dateAdministration.slice(0, 10) : 'inconnue'
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  // Tri des dates du plus récent au plus ancien
  const datesTriees = Object.keys(groupesParDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">

      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour
      </button>

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>vaccines</span>
          Carnet vaccinal
        </h2>
        <span className="rounded-full bg-surface-container-high px-3 py-1 text-sm font-semibold text-on-surface-variant">
          {doses.length} dose{doses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {doses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container-lowest py-16 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-4xl">vaccines</span>
          <p className="text-sm">Aucune vaccination enregistrée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {datesTriees.map((dateKey) => {
            const dosesJour = groupesParDate[dateKey]
            return (
              <div key={dateKey} className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm overflow-hidden">
                {/* En-tête du carnet du jour */}
                <div className="flex items-center gap-3 bg-secondary-container/30 px-5 py-3 border-b border-outline-variant/30">
                  <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                  <span className="font-semibold text-sm text-on-surface">{formaterDate(dateKey)}</span>
                  <span className="ml-auto rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                    {dosesJour.length} vaccin{dosesJour.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Liste des doses du jour */}
                <div className="divide-y divide-outline-variant/20">
                  {dosesJour.map((dose) => (
                    <LigneDose key={dose.id} dose={dose} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
