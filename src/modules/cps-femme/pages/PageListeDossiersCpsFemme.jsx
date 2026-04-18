// Ce composant affiche la liste des dossiers CPS Femme avec une navbar pill pour basculer entre file d'attente et dossiers.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'
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

function PageListeDossiersCpsFemme() {
  const navigate = useNavigate()
  const [onglet, setOnglet] = useState('attente')
  const [tous, setTous] = useState([])
  const [recherche, setRecherche] = useState('')
  const [resultatsRecherche, setResultatsRecherche] = useState([])
  const [chargementRecherche, setChargementRecherche] = useState(false)
  const [afficherResultats, setAfficherResultats] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)
  const timerRef = useRef(null)
  const rechercheRef = useRef(null)
  const [stats, setStats] = useState({ totalDossiers: null })
  const [arrivees, setArrivees] = useState([])
  const [chargementArrivees, setChargementArrivees] = useState(true)
  const [pronantId, setPronantId] = useState(null)

  // Charger le total des dossiers
  useEffect(() => {
    let actif = true
    serviceCpsFemme.listerDossiers('').then((d) => {
      if (actif) setStats({ totalDossiers: d.length })
    }).catch(() => {})
    return () => { actif = false }
  }, [])

  // Charger la file d'attente CPS du jour
  useEffect(() => {
    let actif = true
    const aujourd_hui = new Date().toISOString().split('T')[0]
    serviceRendezVous
      .lister({ statut: 'Arrive', date: aujourd_hui, serviceDestination: 'Maternite (CPS)' })
      .then((liste) => { if (actif) setArrivees(liste) })
      .catch(() => { if (actif) setArrivees([]) })
      .finally(() => { if (actif) setChargementArrivees(false) })
    return () => { actif = false }
  }, [])

  // Charger tous les dossiers quand on ouvre l'onglet Dossiers
  useEffect(() => {
    if (onglet !== 'dossiers') return
    let actif = true
    setChargement(true); setErreur(null)
    serviceCpsFemme.listerDossiers('').then((liste) => { if (actif) setTous(liste) })
      .catch((e) => { if (actif) setErreur(e.message) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [onglet])

  // Recherche indépendante (dropdown flottant)
  const gererRecherche = (valeur) => {
    setRecherche(valeur)
    if (!valeur.trim()) {
      setResultatsRecherche([])
      setAfficherResultats(false)
      return
    }
    setAfficherResultats(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setChargementRecherche(true)
      try { setResultatsRecherche(await serviceCpsFemme.listerDossiers(valeur)) }
      catch { setResultatsRecherche([]) }
      finally { setChargementRecherche(false) }
    }, 350)
  }

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (rechercheRef.current && !rechercheRef.current.contains(e.target)) {
        setAfficherResultats(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Vérifier si un dossier CPS est dans la file d'attente
  const rdvDuDossier = (d) =>
    arrivees.find(
      (a) =>
        a.numeroDossier === d.numeroDossierCps ||
        (a.nomPatient && d.patiente?.nom && a.nomPatient.toLowerCase().includes(d.patiente.nom.toLowerCase().split(' ')[0]))
    ) ?? null

  async function prendrePatiente(rdv) {
    if (pronantId) return
    setPronantId(rdv.id)
    try {
      let dossier = null
      if (rdv.numeroDossier) {
        const r = await serviceCpsFemme.listerDossiers(rdv.numeroDossier)
        dossier = r.find((d) => d.numeroDossierCps === rdv.numeroDossier) ?? (r.length === 1 ? r[0] : null)
      }
      if (!dossier && rdv.nomPatient) {
        const r = await serviceCpsFemme.listerDossiers(rdv.nomPatient)
        dossier = r.length === 1 ? r[0] : null
      }
      // Retirer ce rdv de la file d'attente (décrémente le compteur)
      setArrivees((prev) => prev.filter((a) => a.id !== rdv.id))
      if (dossier) { navigate('/cps-femme/' + dossier.id) }
      else {
        const p = new URLSearchParams()
        if (rdv.numeroDossier) p.set('refDossier', rdv.numeroDossier)
        if (rdv.nomPatient) p.set('nom', rdv.nomPatient)
        navigate('/cps-femme/nouveau?' + p.toString())
      }
    } catch { navigate('/cps-femme/nouveau') }
    finally { setPronantId(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Ligne supérieure : compteur à gauche | recherche au centre | bouton à droite */}
      <div className="flex items-center">
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
          <span className="text-sm text-on-surface-variant">Rendez-vous en attente aujourd&apos;hui :</span>
          <span className="text-2xl font-bold text-primary leading-none">
            {chargementArrivees ? '…' : arrivees.length}
          </span>
        </div>

        {/* Barre de recherche centrée — 30% large, légèrement à gauche */}
        <div className="relative mx-auto shrink-0" style={{ width: '30%' }} ref={rechercheRef}>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-outline">search</span>
          <input
            type="text"
            placeholder="Nom, numéro de dossier, téléphone..."
            value={recherche}
            onChange={(e) => gererRecherche(e.target.value)}
            onFocus={() => { if (recherche && resultatsRecherche.length > 0) setAfficherResultats(true) }}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface py-2 pl-10 pr-9 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors placeholder:text-on-surface-variant"
          />
          {recherche && (
            <button onClick={() => { setRecherche(''); setResultatsRecherche([]); setAfficherResultats(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}

          {/* Dropdown résultats */}
          {afficherResultats && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-outline-variant/40 bg-surface shadow-lg overflow-hidden">
              {chargementRecherche ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                  Recherche...
                </div>
              ) : resultatsRecherche.length === 0 ? (
                <p className="px-4 py-3 text-sm text-on-surface-variant">Aucun dossier trouvé pour « {recherche} »</p>
              ) : (
                <ul className="divide-y divide-outline-variant/20 max-h-72 overflow-y-auto">
                  {resultatsRecherche.slice(0, 8).map((d) => {
                    const rdv = rdvDuDossier(d)
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setAfficherResultats(false)
                            setRecherche('')
                            if (rdv) prendrePatiente(rdv)
                            else navigate('/cps-femme/' + d.id)
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-container transition-colors"
                        >
                          <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' + couleurAvatar(d.patiente?.nom)}>
                            {initialesPatiente(d.patiente?.nom)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-on-surface">{d.patiente?.nom ?? ''}</p>
                            <p className="text-xs font-mono text-on-surface-variant">{d.numeroDossierCps}</p>
                          </div>
                          {rdv ? (
                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
                              Prendre
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">Ouvrir</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                  {resultatsRecherche.length > 8 && (
                    <li className="px-4 py-2 text-xs text-on-surface-variant">+{resultatsRecherche.length - 8} autre(s) — affinez la recherche</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Bouton Nouveau dossier */}
        <button
          onClick={() => navigate('/cps-femme/nouveau')}
          className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 transition-opacity"
          style={{ marginLeft: 'auto', marginRight: '25%' }}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nouveau dossier
        </button>
      </div>

      {/* Navbar pill */}
      <div className="flex justify-center">
        <div className="flex rounded-full bg-surface-container-high p-1.5 gap-1.5" style={{ width: '50%' }}>
          <button
            onClick={() => setOnglet('attente')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              onglet === 'attente'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: onglet === 'attente' ? "'FILL' 1" : "'FILL' 0" }}>pending_actions</span>
            File d&apos;attente
            {!chargementArrivees && arrivees.length > 0 && (
              <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${onglet === 'attente' ? 'bg-white/25 text-white' : 'bg-surface-container-highest text-on-surface'}`}>
                {arrivees.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setOnglet('dossiers')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              onglet === 'dossiers'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: onglet === 'dossiers' ? "'FILL' 1" : "'FILL' 0" }}>folder_shared</span>
            Dossiers
          </button>
        </div>
      </div>

      {/* ── File d'attente ── */}
      {onglet === 'attente' && (
        <div>
          {chargementArrivees ? (
            <div className="flex items-center gap-2 py-6 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-base">refresh</span>
              Chargement...
            </div>
          ) : arrivees.length === 0 ? (
            <div className="py-12 text-center text-sm text-on-surface-variant">
              <span className="material-symbols-outlined mb-2 block text-3xl opacity-30">inbox</span>
              Aucune patiente en attente pour l&apos;instant.
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/20 overflow-hidden rounded-xl border border-outline-variant/30">
              {arrivees.map((rdv) => (
                <li key={rdv.id} className="flex items-center gap-3 bg-surface px-4 py-3">
                  <div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' + couleurAvatar(rdv.nomPatient)}>
                    {initialesPatiente(rdv.nomPatient)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-on-surface">{rdv.nomPatient ?? ''}</p>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-on-surface-variant">
                      {rdv.numeroDossier && <span className="font-mono">{rdv.numeroDossier}</span>}
                      {rdv.heure && <span>{rdv.heure}</span>}
                      {rdv.motif && <span className="italic">{rdv.motif}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={pronantId === rdv.id}
                    onClick={() => prendrePatiente(rdv)}
                    className="shrink-0 rounded-lg border border-outline-variant/50 bg-surface px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors"
                  >
                    {pronantId === rdv.id ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : 'Prendre'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Dossiers ── */}
      {onglet === 'dossiers' && (
        <div className="flex flex-col gap-3">
          <div style={{ width: '50%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Compteur */}
            {stats.totalDossiers !== null && (
              <p className="flex items-center gap-2 text-sm font-semibold text-on-surface border border-outline-variant/50 rounded-lg px-3 py-1.5 bg-surface-container/50 w-fit">
                Tous les dossiers
                <span className="text-lg font-bold text-primary">{stats.totalDossiers}</span>
              </p>
            )}

            {/* Liste */}
            {chargement ? (
              <div className="flex items-center gap-2 py-4 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                Chargement...
              </div>
            ) : erreur ? (
              <div className="px-4 py-3 text-sm text-error">{erreur}</div>
            ) : tous.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Aucun dossier disponible.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/20 overflow-hidden rounded-xl border border-outline-variant/30">
                {tous.slice(0, 15).map((d) => {
                  const rdv = rdvDuDossier(d)
                  return (
                    <li key={d.id}>
                      <button type="button" onClick={() => rdv ? prendrePatiente(rdv) : navigate('/cps-femme/' + d.id)} className="flex w-full items-center gap-3 bg-surface px-4 py-3 text-left hover:bg-surface-container transition-colors">
                        <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' + couleurAvatar(d.patiente?.nom)}>
                          {initialesPatiente(d.patiente?.nom)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-on-surface">{d.patiente?.nom ?? ''}</p>
                          <p className="text-xs font-mono text-on-surface-variant">{d.numeroDossierCps}</p>
                        </div>
                        {rdv ? (
                          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
                            Prendre
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">Ouvrir</span>
                        )}
                      </button>
                    </li>
                  )
                })}
                {tous.length > 15 && <li className="px-4 py-2 text-xs text-on-surface-variant">+{tous.length - 15} autre(s) — utilisez la recherche</li>}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default PageListeDossiersCpsFemme
