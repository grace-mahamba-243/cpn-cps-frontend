// Ce composant affiche les patientes ayant des accouchements. On clique sur une patiente pour voir l historique de ses accouchements.
import { useEffect, useRef, useState } from 'react'
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

const COULEURS_AVATAR = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-error-container text-on-error-container',
  'bg-surface-container-highest text-on-surface-variant',
]

function couleurAvatar(nom) {
  if (!nom) return COULEURS_AVATAR[0]
  let h = 0
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) & 0xffffffff
  return COULEURS_AVATAR[Math.abs(h) % COULEURS_AVATAR.length]
}

function initialesNom(nom) {
  if (!nom) return '?'
  const mots = nom.trim().split(/\s+/)
  if (mots.length >= 2) return (mots[0][0] + mots[1][0]).toUpperCase()
  return mots[0].slice(0, 2).toUpperCase()
}

function formaterDate(valeur) {
  if (!valeur) return '—'
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Regroupe une liste d accouchements par patiente
function grouperParPatiente(liste) {
  const map = {}
  for (const a of liste) {
    const cle = a.patiente?.id ?? a.id
    if (!map[cle]) {
      map[cle] = {
        patienteId: a.patiente?.id,
        nom: a.patiente?.nom ?? '—',
        numeroDossier: a.patiente?.numeroDossier ?? '',
        accouchements: [],
      }
    }
    map[cle].accouchements.push(a)
  }
  return Object.values(map)
}

export default function PageListeAccouchements() {
  const navigate = useNavigate()
  const [accouchements, setAccouchements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [termeActif, setTermeActif] = useState('')
  // patienteOuverte : id de la patiente dont l accordeon est ouvert
  const [patienteOuverte, setPatienteOuverte] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    charger(termeActif)
  }, [termeActif])

  async function charger(terme) {
    setChargement(true)
    setErreur(null)
    try {
      const liste = await serviceAccouchement.listerAccouchements(terme)
      setAccouchements(liste)
      // Si recherche active et un seul groupe, l ouvrir automatiquement
      if (terme) {
        const groupes = grouperParPatiente(liste)
        if (groupes.length === 1) setPatienteOuverte(groupes[0].patienteId)
      }
    } catch (e) {
      setErreur(e.message || 'Impossible de charger les accouchements.')
    } finally {
      setChargement(false)
    }
  }

  // Recherche en temps réel avec debounce
  function surChangementRecherche(e) {
    const v = e.target.value
    setRecherche(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setTermeActif(v.trim()), 350)
  }

  function effacerRecherche() {
    setRecherche('')
    setTermeActif('')
    setPatienteOuverte(null)
  }

  function basculerPatiente(id) {
    setPatienteOuverte((prev) => (prev === id ? null : id))
  }

  const groupes = grouperParPatiente(accouchements)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Ligne supérieure : compteur | recherche | bouton */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>baby_changing_station</span>
          <span className="text-sm text-on-surface-variant">
            {groupes.length > 0
              ? `${groupes.length} patiente(s) · ${accouchements.length} accouchement(s)`
              : 'Aucun accouchement enregistré'}
          </span>
        </div>

        {/* Barre de recherche centrée */}
        <div className="relative mx-auto shrink-0" style={{ width: '30%' }}>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-outline">search</span>
          <input
            type="text"
            value={recherche}
            onChange={surChangementRecherche}
            placeholder="Nom, numéro de dossier…"
            className="w-full rounded-xl border border-outline-variant/50 bg-surface py-2 pl-10 pr-9 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors placeholder:text-on-surface-variant"
          />
          {recherche && (
            <button
              type="button"
              onClick={effacerRecherche}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Bouton Enregistrer un accouchement */}
        <button
          onClick={() => navigate('/accouchements/nouveau')}
          className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 transition-opacity"
          style={{ marginLeft: 'auto', marginRight: '0' }}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Enregistrer un accouchement
        </button>
      </div>

      {/* Contenu */}
      {chargement ? (
        <div className="flex items-center gap-2 py-16 justify-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">refresh</span>
          Chargement…
        </div>
      ) : erreur ? (
        <div className="bg-error-container text-on-error-container rounded-xl p-4">{erreur}</div>
      ) : groupes.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">child_friendly</span>
          {termeActif ? `Aucune patiente trouvée pour « ${termeActif} ».` : 'Aucun accouchement enregistré.'}
        </div>
      ) : (
        <div className="space-y-2">
          {groupes.map((g) => {
            const ouvert = patienteOuverte === g.patienteId
            const nbAcc = g.accouchements.length
            return (
              <div key={g.patienteId} className="rounded-2xl border border-outline-variant/40 overflow-hidden">
                {/* Ligne patiente — cliquable */}
                <button
                  type="button"
                  onClick={() => basculerPatiente(g.patienteId)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-container transition-colors text-left"
                >
                  <div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' + couleurAvatar(g.nom)}>
                    {initialesNom(g.nom)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface truncate">{g.nom}</p>
                    <p className="text-xs text-on-surface-variant font-mono">{g.numeroDossier}</p>
                  </div>
                  <span className="text-xs bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-semibold shrink-0">
                    {nbAcc} accouchement{nbAcc > 1 ? 's' : ''}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-base transition-transform shrink-0" style={{ transform: ouvert ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </button>

                {/* Accordéon — historique des accouchements */}
                {ouvert && (
                  <div className="divide-y divide-outline-variant/20 bg-surface-container/40">
                    {g.accouchements.map((a, idx) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => navigate(`/accouchements/${a.id}`)}
                        className="w-full flex items-start gap-4 px-5 py-3 hover:bg-surface-container transition-colors text-left"
                      >
                        {/* Numéro de l accouchement dans l ordre inverse */}
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <span className="text-xs font-bold text-on-surface-variant w-5 h-5 flex items-center justify-center rounded-full bg-outline/20">
                            {nbAcc - idx}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-on-surface">{a.numeroAccouchement}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              a.typeAccouchement === 'INTERNE'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-surface-container-highest text-on-surface'
                            }`}>
                              {LABELS_TYPE[a.typeAccouchement] ?? a.typeAccouchement}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {formaterDate(a.dateAccouchement)}
                            {a.modeAccouchement ? ` · ${LABELS_MODE[a.modeAccouchement] ?? a.modeAccouchement}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${COULEUR_ETAT_MERE[a.etatMere] ?? 'bg-surface-container-highest text-on-surface'}`}>
                            Mère : {LABELS_ETAT_MERE[a.etatMere] ?? a.etatMere}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${COULEUR_ETAT_NN[a.etatNouveauNe] ?? 'bg-surface-container-highest text-on-surface'}`}>
                            Bébé : {LABELS_ETAT_NN[a.etatNouveauNe] ?? a.etatNouveauNe}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-base shrink-0 mt-0.5">chevron_right</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
