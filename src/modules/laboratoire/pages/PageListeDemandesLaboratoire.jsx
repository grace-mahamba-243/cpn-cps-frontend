// Ce composant affiche la liste des demandes d'examen regroupees par statut pour le laborantin.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceLaboratoire from '../../../services/api/serviceLaboratoire'

const ETIQUETTES_STATUT = {
  DEMANDE: { libelle: 'En attente', couleur: 'bg-error-container text-on-error-container' },
  EN_COURS: { libelle: 'En cours', couleur: 'bg-tertiary-container text-on-tertiary-container' },
  RESULTAT_ENVOYE: { libelle: 'Résultat envoyé', couleur: 'bg-secondary-container text-on-secondary-container' },
  RESULTAT_RECU: { libelle: 'Validé', couleur: 'bg-primary-container text-on-primary-container' },
}

const ONGLETS = [
  { id: 'attente', label: 'En attente', icone: 'schedule', statut: 'DEMANDE' },
  { id: 'cours', label: 'En cours', icone: 'autorenew', statut: 'EN_COURS' },
  { id: 'historique', label: 'Historique', icone: 'history', statut: null },
]

function normaliserTexte(valeur) {
  return String(valeur ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function correspondRecherche(demande, recherche) {
  const terme = normaliserTexte(recherche)
  if (!terme) return true

  const statut = ETIQUETTES_STATUT[demande.statut]?.libelle ?? demande.statut
  const champs = [
    demande.libelle,
    demande.typeExamen,
    demande.patiente?.nom,
    demande.numeroDossierCpn,
    demande.numeroContact,
    statut,
  ]

  return champs.some((champ) => normaliserTexte(champ).includes(terme))
}

function BadgeStatut({ statut }) {
  const info = ETIQUETTES_STATUT[statut] ?? { libelle: statut, couleur: 'bg-surface-container text-on-surface' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.couleur}`}>
      {info.libelle}
    </span>
  )
}

function CarteDemande({ demande, onClick }) {
  const patienteNom = demande.patiente?.nom ?? '—'
  const numeroDossier = demande.numeroDossierCpn ?? '—'
  const dateCreation = demande.creeLe
    ? new Date(demande.creeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <button
      type="button"
      onClick={() => onClick(demande.id)}
      className="w-full text-left bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:bg-surface-container transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-lg">biotech</span>
            <p className="font-semibold text-on-surface text-sm truncate">{demande.libelle}</p>
          </div>
          <p className="text-xs text-on-surface-variant mb-2">{patienteNom}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">folder</span>
              {numeroDossier}
            </span>
            {demande.numeroContact && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                Contact {demande.numeroContact}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              {dateCreation}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs">
              {demande.typeExamen}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <BadgeStatut statut={demande.statut} />
          <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
        </div>
      </div>
    </button>
  )
}

function PageListeDemandesLaboratoire() {
  const navigate = useNavigate()
  const [ongletActif, setOngletActif] = useState('attente')
  const [demandes, setDemandes] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const charger = async (onglet) => {
    setChargement(true)
    setErreur(null)
    try {
      let liste
      if (onglet === 'attente') liste = await serviceLaboratoire.listerEnAttente()
      else if (onglet === 'cours') liste = await serviceLaboratoire.listerEnCours()
      else liste = await serviceLaboratoire.listerHistorique()
      setDemandes(liste)
    } catch (e) {
      setErreur(e.message ?? 'Impossible de charger les demandes.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    charger(ongletActif)
  }, [ongletActif])

  const changerOnglet = (id) => {
    setOngletActif(id)
    setDemandes([])
  }

  const demandesFiltrees = demandes.filter((demande) => correspondRecherche(demande, recherche))

  return (
    <>
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-6 space-y-6">

      {/* Barre de navigation en haut, pleine largeur */}
      <div className="bg-surface-container rounded-2xl p-1 flex gap-1 w-full">
          {ONGLETS.map((onglet) => (
            <button
              key={onglet.id}
              type="button"
              onClick={() => changerOnglet(onglet.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                ongletActif === onglet.id
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">{onglet.icone}</span>
              <span>{onglet.label}</span>
            </button>
          ))}
        </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
          search
        </span>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un examen (nom, patiente, type, statut...)"
          className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 text-sm text-on-surface outline-none transition-colors focus:border-primary"
        />
        {recherche && (
          <button
            type="button"
            onClick={() => setRecherche('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
            aria-label="Effacer la recherche"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Contenu */}
      {chargement && (
        <div className="flex items-center justify-center py-16 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          <span className="text-sm">Chargement…</span>
        </div>
      )}

      {!chargement && erreur && (
        <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {erreur}
        </div>
      )}

      {!chargement && !erreur && demandesFiltrees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl opacity-30">inbox</span>
          <p className="text-sm">
            {recherche
              ? 'Aucun examen ne correspond à votre recherche.'
              : (
                <>
                  {ongletActif === 'attente' && 'Aucune demande en attente.'}
                  {ongletActif === 'cours' && 'Aucune demande en cours de traitement.'}
                  {ongletActif === 'historique' && 'Aucune demande dans l\'historique.'}
                </>
              )}
          </p>
        </div>
      )}

      {!chargement && !erreur && demandesFiltrees.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-on-surface-variant px-1">
            {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? 's' : ''}
          </p>
          {demandesFiltrees.map((demande) => (
            <CarteDemande
              key={demande.id}
              demande={demande}
              onClick={(id) => navigate(`/laboratoire/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Espace bas */}
      <div className="h-6" />
    </div>
  </>
  )
}

export default PageListeDemandesLaboratoire
