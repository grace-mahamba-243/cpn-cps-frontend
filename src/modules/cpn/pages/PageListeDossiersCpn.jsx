// Ce composant affiche la liste des dossiers CPN avec une navbar pill pour basculer entre file d'attente et dossiers.
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
  const [resultatsRecherche, setResultatsRecherche] = useState([])
  const [chargementRecherche, setChargementRecherche] = useState(false)
  const [afficherResultats, setAfficherResultats] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)
  const timerRef = useRef(null)
  const rechercheRef = useRef(null)
  const [stats, setStats] = useState({ totalDossiers: null, totalRdvAujourdhui: null })
  const [arrivees, setArrivees] = useState([])
  const [chargementArrivees, setChargementArrivees] = useState(true)
  const [pronantId, setPronantId] = useState(null)

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

  // Charger tous les dossiers au montage
  useEffect(() => {
    let actif = true
    setChargement(true); setErreur(null)
    serviceCpn.listerDossiers('').then((liste) => { if (actif) setTous(liste) })
      .catch((e) => { if (actif) setErreur(e.message) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [])

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
      try { setResultatsRecherche(await serviceCpn.listerDossiers(valeur)) }
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

  // Vérifier si un dossier CPN est dans la file d'attente
  const rdvDuDossier = (d) =>
    arrivees.find(
      (a) =>
        a.numeroDossier === d.numeroDossierCpn ||
        (a.nomPatient && d.nomPatiente && a.nomPatient.toLowerCase().includes(d.nomPatiente.toLowerCase().split(' ')[0]))
    ) ?? null

  async function prendrePatiente(rdv) {
    if (pronantId) return
    setPronantId(rdv.id)
    try {
      let dossier = null
      if (rdv.numeroDossier) {
        const r = await serviceCpn.listerDossiers(rdv.numeroDossier)
        dossier = r.find((d) => d.numeroDossierCpn === rdv.numeroDossier || d.numeroDossier === rdv.numeroDossier) ?? (r.length === 1 ? r[0] : null)
      }
      if (!dossier && rdv.nomPatient) {
        const r = await serviceCpn.listerDossiers(rdv.nomPatient)
        dossier = r.length === 1 ? r[0] : null
      }
      // Retirer ce rdv de la file d'attente (décrémente le compteur)
      setArrivees((prev) => prev.filter((a) => a.id !== rdv.id))
      if (dossier) { navigate('/cpn/' + dossier.id) }
      else {
        const p = new URLSearchParams()
        if (rdv.numeroDossier) p.set('refDossier', rdv.numeroDossier)
        if (rdv.nomPatient) p.set('nom', rdv.nomPatient)
        navigate('/cpn/nouveau?' + p.toString())
      }
    } catch { navigate('/cpn/nouveau') }
    finally { setPronantId(null) }
  }

  const btnPill = (actif) => ({
    background: actif ? '#fff' : 'transparent',
    color: actif ? '#0f0f0f' : 'rgba(255,255,255,0.5)',
  })

  const badgeStyle = (actif) => ({
    background: actif ? '#0f0f0f' : 'rgba(255,255,255,0.15)',
    color: '#fff',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Ligne supérieure : compteur à gauche | recherche au centre | bouton à droite */}
      <div className="flex items-center">
        {/* Barre de recherche centrée — 30% large, légèrement à gauche */}
        <div className="relative mx-auto shrink-0" style={{ width: '30%' }} ref={rechercheRef}>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-outline">search</span>
          <input
            type="text"
            placeholder="Nom, numéro de dossier, téléphone..."
            value={recherche}
            onChange={(e) => gererRecherche(e.target.value)}
            onFocus={() => { if (recherche && resultatsRecherche.length > 0) setAfficherResultats(true) }}
            className="w-full rounded-xl border-2 border-primary/40 bg-white py-2 pl-10 pr-9 text-sm text-on-surface outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant"
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
                <div className="px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-on-surface-variant">Aucun dossier trouvé pour « {recherche} »</p>
                  <button
                    type="button"
                    onClick={() => navigate('/patients/nouveau')}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity w-fit"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    Créer une nouvelle mère
                  </button>
                </div>
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
                            else navigate('/cpn/' + d.id)
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-container transition-colors"
                        >
                          <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' + couleurAvatar(d.nomPatiente)}>
                            {initialesPatiente(d.nomPatiente)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-on-surface">{d.nomPatiente ?? ''}</p>
                            <p className="text-xs font-mono text-on-surface-variant">{d.numeroDossierCpn}</p>
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
          onClick={() => navigate('/cpn/nouveau')}
          className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 transition-opacity"
          style={{ marginLeft: 'auto', marginRight: '25%' }}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nouveau dossier
        </button>
      </div>

      {/* Dossiers */}
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
          ) : (() => {
            // Grouper les dossiers par patiente (une patiente peut avoir plusieurs grossesses)
            const groupes = Object.values(
              tous.reduce((acc, d) => {
                const cle = d.patienteId ?? d.nomPatiente ?? d.id
                if (!acc[cle]) acc[cle] = { patienteId: d.patienteId, nomPatiente: d.nomPatiente, dossiers: [] }
                acc[cle].dossiers.push(d)
                return acc
              }, {})
            )
            const STATUT_COULEUR = { OUVERT: 'bg-primary/10 text-primary', CLOS: 'bg-surface-container-highest text-on-surface-variant' }
            return (
              <ul className="flex flex-col gap-2">
                {groupes.map((g) => {
                  const dernier = g.dossiers[0] // trié DESC — le plus récent en premier
                  const rdv = rdvDuDossier(dernier)
                  const nbGrossesses = g.dossiers.length
                  return (
                    <li key={g.patienteId ?? g.nomPatiente}>
                      <button
                        type="button"
                        onClick={() => navigate('/cpn/' + dernier.id)}
                        className="flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left hover:opacity-90 transition-opacity"
                        style={{ background: '#dfeaee' }}
                      >
                        <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' + couleurAvatar(g.nomPatiente)}>
                          {initialesPatiente(g.nomPatiente)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="truncate text-sm font-semibold text-on-surface">{g.nomPatiente ?? ''}</p>
                            {nbGrossesses > 1 && (
                              <span className="text-[10px] bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 font-semibold">
                                {nbGrossesses} grossesses
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-on-surface-variant">{dernier.numeroDossierCpn}</p>
                          {dernier.dateProbableAccouchement && (
                            <p className="text-xs text-on-surface-variant">DPA {new Date(dernier.dateProbableAccouchement).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_COULEUR[dernier.statut] ?? 'bg-surface-container-highest text-on-surface-variant'}`}>
                          {dernier.statut === 'OUVERT' ? 'En cours' : 'Clôturé'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )
          })()}
          </div>
        </div>

    </div>
  )
}

export default PageListeDossiersCpn
