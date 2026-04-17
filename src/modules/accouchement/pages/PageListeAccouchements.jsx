// Ce composant affiche la liste de tous les accouchements enregistres avec une recherche.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceAccouchement from '../../../services/api/serviceAccouchement'

const LABELS_TYPE = { INTERNE: 'Interne', EXTERNE: 'Externe' }
const LABELS_ETAT_MERE = { STABLE: 'Stable', COMPLICATION: 'Complication', DECES: 'Décès' }
const LABELS_ETAT_NN = { VIVANT: 'Vivant', MORT_NE: 'Mort-né', DECES_PRECOCE: 'Décès précoce' }
const LABELS_MODE = {
  NATUREL: 'Naturel',
  CESARIENNE: 'Césarienne',
  INSTRUMENTAL: 'Instrumental',
  SIEGE: 'Siège',
  AUTRE: 'Autre',
}
const COULEUR_ETAT_MERE = {
  STABLE: 'bg-tertiary-container text-on-tertiary-container',
  COMPLICATION: 'bg-error-container text-on-error-container',
  DECES: 'bg-error text-on-error',
}
const COULEUR_ETAT_NN = {
  VIVANT: 'bg-tertiary-container text-on-tertiary-container',
  MORT_NE: 'bg-error-container text-on-error-container',
  DECES_PRECOCE: 'bg-error text-on-error',
}

function formaterDate(valeur) {
  if (!valeur) return '—'
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PageListeAccouchements() {
  const navigate = useNavigate()
  const [accouchements, setAccouchements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [termeActif, setTermeActif] = useState('')

  useEffect(() => {
    charger(termeActif)
  }, [termeActif])

  async function charger(terme) {
    setChargement(true)
    setErreur(null)
    try {
      const liste = await serviceAccouchement.listerAccouchements(terme)
      setAccouchements(liste)
    } catch (e) {
      setErreur(e.message || 'Impossible de charger les accouchements.')
    } finally {
      setChargement(false)
    }
  }

  function soumettreRecherche(e) {
    e.preventDefault()
    setTermeActif(recherche.trim())
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Accouchements</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Gestion des accouchements internes et externes
          </p>
        </div>
        <button
          onClick={() => navigate('/accouchements/nouveau')}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-medium hover:opacity-90 transition"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Enregistrer un accouchement
        </button>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={soumettreRecherche} className="flex gap-2 mb-6">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, dossier…"
          className="flex-1 px-4 py-2 rounded-xl border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-xl font-medium hover:opacity-90 transition"
        >
          Rechercher
        </button>
        {termeActif && (
          <button
            type="button"
            onClick={() => { setRecherche(''); setTermeActif('') }}
            className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </form>

      {/* Contenu */}
      {chargement ? (
        <div className="text-center py-16 text-on-surface-variant">Chargement…</div>
      ) : erreur ? (
        <div className="bg-error-container text-on-error-container rounded-xl p-4">{erreur}</div>
      ) : accouchements.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block">child_friendly</span>
          {termeActif ? 'Aucun résultat pour cette recherche.' : 'Aucun accouchement enregistré.'}
        </div>
      ) : (
        <div className="space-y-3">
          {accouchements.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate(`/accouchements/${a.id}`)}
              className="bg-surface-container rounded-2xl p-4 cursor-pointer hover:bg-surface-container-high transition flex flex-wrap gap-4 items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-on-surface truncate">
                    {a.patiente?.nom ?? '—'}
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono">
                    {a.patiente?.numeroDossier}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.typeAccouchement === 'INTERNE'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface'
                  }`}>
                    {LABELS_TYPE[a.typeAccouchement] ?? a.typeAccouchement}
                  </span>
                </div>
                <div className="text-sm text-on-surface-variant mt-1">
                  {formaterDate(a.dateAccouchement)} · {LABELS_MODE[a.modeAccouchement] ?? a.modeAccouchement}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${COULEUR_ETAT_MERE[a.etatMere] ?? 'bg-surface-container-highest text-on-surface'}`}>
                  Mère : {LABELS_ETAT_MERE[a.etatMere] ?? a.etatMere}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${COULEUR_ETAT_NN[a.etatNouveauNe] ?? 'bg-surface-container-highest text-on-surface'}`}>
                  Bébé : {LABELS_ETAT_NN[a.etatNouveauNe] ?? a.etatNouveauNe}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
