// Ce composant affiche la barre de recherche de dossiers CPN et la file d'attente des arrivées du jour.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'
import serviceRendezVous from '../../../services/api/serviceRendezVous'

function initialesPatiente(nom) {
  if (!nom) return '?'
  const mots = nom.trim().split(/\s+/)
  if (mots.length >= 2) return (mots[0][0] + mots[1][0]).toUpperCase()
  return mots[0].slice(0, 2).toUpperCase()
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

function PageListeDossiersCpn() {
  const navigate = useNavigate()
  const [tous, setTous] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)
  const timerRef = useRef(null)

  // Statistiques globales
  const [stats, setStats] = useState({ totalDossiers: null, totalRdvAujourdhui: null })

  // File d'attente : rendez-vous CPN arrivés aujourd'hui
  const [arrivees, setArrivees] = useState([])
  const [chargementArrivees, setChargementArrivees] = useState(true)
  const [pronantId, setPronantId] = useState(null) // ID du rdv en cours de traitement

  // Charge les stats globales (total dossiers + RDV du jour)
  useEffect(() => {
    let actif = true
    const aujourd_hui = new Date().toISOString().split('T')[0]
    Promise.all([
      serviceCpn.listerDossiers(''),
      serviceRendezVous.lister({ date: aujourd_hui, serviceDestination: 'Maternite (CPN)' }),
    ]).then(([dossiers, rdvJour]) => {
      if (actif) setStats({ totalDossiers: dossiers.length, totalRdvAujourdhui: rdvJour.length })
    }).catch(() => {})
    return () => { actif = false }
  }, [])

  // Charge les rendez-vous CPN arrivés aujourd'hui
  useEffect(() => {
    let actif = true
    const aujourd_hui = new Date().toISOString().split('T')[0]
    serviceRendezVous
      .lister({ statut: 'Arrive', date: aujourd_hui, serviceDestination: 'Maternite (CPN)' })
      .then((liste) => { if (actif) setArrivees(liste) })
      .catch(() => { if (actif) setArrivees([]) })
      .finally(() => { if (actif) setChargementArrivees(false) })
    return () => { actif = false }
  }, [])

  const gererRecherche = (valeur) => {
    setRecherche(valeur)
    if (!valeur) { setTous([]); setErreur(null); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setChargement(true)
      setErreur(null)
      try {
        const liste = await serviceCpn.listerDossiers(valeur)
        setTous(liste)
      } catch (e) {
        setErreur(e.message)
      } finally {
        setChargement(false)
      }
    }, 400)
  }

  async function prendrePatiente(rdv) {
    if (pronantId) return
    setPronantId(rdv.id)
    try {
      // Recherche 1 : par numéro de dossier (refDossier du rendez-vous)
      let dossier = null
      if (rdv.numeroDossier) {
        const parNumero = await serviceCpn.listerDossiers(rdv.numeroDossier)
        dossier = parNumero.find(
          (d) => d.numeroDossierCpn === rdv.numeroDossier || d.numeroDossier === rdv.numeroDossier
        ) ?? (parNumero.length === 1 ? parNumero[0] : null)
      }

      // Recherche 2 (fallback) : par nom de la patiente
      if (!dossier && rdv.nomPatient) {
        const parNom = await serviceCpn.listerDossiers(rdv.nomPatient)
        dossier = parNom.length === 1 ? parNom[0] : null
      }

      if (dossier) {
        // Patiente connue → profil du dossier CPN directement
        navigate(`/cpn/${dossier.id}`)
      } else {
        // Nouvelle patiente → page d'initialisation CPN avec données pré-remplies
        const params = new URLSearchParams()
        if (rdv.numeroDossier) params.set('refDossier', rdv.numeroDossier)
        if (rdv.nomPatient) params.set('nom', rdv.nomPatient)
        navigate(`/cpn/nouveau?${params.toString()}`)
      }
    } catch {
      navigate('/cpn/nouveau')
    } finally {
      setPronantId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Cartes statistiques ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>folder_shared</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-on-surface">
              {stats.totalDossiers === null ? '—' : stats.totalDossiers}
            </p>
            <p className="text-xs font-medium text-on-surface-variant">Dossiers CPN</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tertiary/10">
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-on-surface">
              {stats.totalRdvAujourdhui === null ? '—' : stats.totalRdvAujourdhui}
            </p>
            <p className="text-xs font-medium text-on-surface-variant">RDV aujourd'hui</p>
          </div>
        </div>
      </div>

      {/* En-tête */}
      <div className="space-y-1">
        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Suivi Prénatal (CPN)
        </h2>
        <p className="max-w-xl text-on-surface-variant">
          Gestion centralisée des consultations prénatales pour un suivi rigoureux de la santé maternelle et néonatale.
        </p>
      </div>

      {/* ── Barre de recherche de dossier ── */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          type="text"
          placeholder="Rechercher un dossier CPN par nom, numéro, téléphone…"
          value={recherche}
          onChange={(e) => gererRecherche(e.target.value)}
          className="w-full rounded-full border-none bg-surface-container py-3 pl-12 pr-12 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {recherche && (
          <button
            onClick={() => { setRecherche(''); setTous([]) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}

        {/* Résultats de recherche en dropdown */}
        {recherche && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            {chargement ? (
              <div className="flex items-center gap-2 px-5 py-4 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                Recherche en cours…
              </div>
            ) : erreur ? (
              <div className="px-5 py-4 text-sm text-error">{erreur}</div>
            ) : tous.length === 0 ? (
              <div className="px-5 py-4 text-sm text-on-surface-variant">
                Aucun dossier CPN trouvé pour « {recherche} »
              </div>
            ) : (
              <ul className="max-h-72 divide-y divide-surface-container overflow-y-auto">
                {tous.slice(0, 8).map((d) => {
                  const initiales = initialesPatiente(d.nomPatiente)
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/cpn/${d.id}`)}
                        className="flex w-full items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-low text-left"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${couleurAvatar(d.nomPatiente)}`}>
                          {initiales}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-on-surface">{d.nomPatiente ?? '—'}</p>
                          <p className="text-xs font-mono text-primary">{d.numeroDossierCpn}</p>
                        </div>
                        <span className="material-symbols-outlined shrink-0 text-base text-on-surface-variant">chevron_right</span>
                      </button>
                    </li>
                  )
                })}
                {tous.length > 8 && (
                  <li className="px-5 py-2 text-xs text-on-surface-variant">
                    +{tous.length - 8} autre(s) résultat(s) — affinez la recherche
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── File d'attente – Arrivées CPN aujourd'hui ── */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-primary/5">
        <div className="flex items-center gap-3 border-b border-outline-variant/50 px-6 py-4">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            pending_actions
          </span>
          <div>
            <h3 className="text-sm font-bold text-on-surface">File d'attente – Arrivées CPN</h3>
            <p className="text-xs text-on-surface-variant">Patientes enregistrées à la réception aujourd'hui</p>
          </div>
          <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-on-primary">
            {chargementArrivees ? '…' : arrivees.length}
          </span>
        </div>

        {chargementArrivees ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-base">refresh</span>
            Chargement des arrivées…
          </div>
        ) : arrivees.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
            <span className="material-symbols-outlined mb-2 block text-4xl opacity-40">check_circle</span>
            Aucune patiente en attente pour l'instant.
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {arrivees.map((rdv) => (
              <div key={rdv.id} className="flex items-center gap-4 px-6 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${couleurAvatar(rdv.nomPatient)}`}>
                  {initialesPatiente(rdv.nomPatient)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-on-surface">{rdv.nomPatient ?? '—'}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-on-surface-variant">
                    {rdv.numeroDossier && (
                      <span className="font-mono font-semibold text-primary">{rdv.numeroDossier}</span>
                    )}
                    {rdv.heure && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        Arrivée à {rdv.heure}
                      </span>
                    )}
                    {rdv.motif && <span className="italic">{rdv.motif}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pronantId === rdv.id}
                  onClick={() => prendrePatiente(rdv)}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                >
                  {pronantId === rdv.id ? (
                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  )}
                  Prendre
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default PageListeDossiersCpn
