// Ce composant affiche le tableau de bord unifié de la file d'attente pour CPN, CPS Femme et CPS Enfant.
// Il charge en temps réel les patients arrivés du jour pour chaque service et permet d'accéder directement au dossier.
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthentification from '../../authentification/hooks/useAuthentification'
import serviceRendezVous from '../../../services/api/serviceRendezVous'
import serviceCpn from '../../../services/api/serviceCpn'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'

const SERVICES = [
  {
    cle: 'cpn',
    label: 'CPN',
    serviceDestination: 'Maternite (CPN)',
    icone: 'pregnant_woman',
    couleur: 'primary',
    baseUrl: '/cpn',
    nouveauUrl: '/cpn/nouveau',
  },
  {
    cle: 'cps-femme',
    label: 'CPS Femme',
    serviceDestination: 'Maternite (CPS)',
    icone: 'support_agent',
    couleur: 'secondary',
    baseUrl: '/cps-femme',
    nouveauUrl: '/cps-femme/nouveau',
  },
  {
    cle: 'cps-enfant',
    label: 'CPS Enfant',
    serviceDestination: 'Maternite (CPS Enfant)',
    icone: 'child_care',
    couleur: 'tertiary',
    baseUrl: '/cps-enfant',
    nouveauUrl: '/cps-enfant/nouveau',
  },
]

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

function initialesDepuisNom(nom = '') {
  const mots = nom.trim().split(/\s+/)
  if (mots.length >= 2) return (mots[0][0] + mots[1][0]).toUpperCase()
  return mots[0].slice(0, 2).toUpperCase()
}

function dateDuJourIso() {
  return new Date().toISOString().slice(0, 10)
}

function badgeStatut(statut) {
  if (statut === 'Arrive') return { label: 'En salle', cls: 'bg-tertiary-container text-on-tertiary-container' }
  if (statut === 'Prevu') return { label: 'En attente', cls: 'bg-secondary-container text-on-secondary-container' }
  if (statut === 'Termine') return { label: 'Terminé', cls: 'bg-surface-container-highest text-on-surface-variant' }
  return { label: statut, cls: 'bg-surface-variant text-on-surface-variant' }
}

function couleurService(couleur) {
  const map = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', badge: 'bg-primary text-on-primary' },
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20', badge: 'bg-secondary text-on-secondary' },
    tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', border: 'border-tertiary/20', badge: 'bg-tertiary text-on-tertiary' },
  }
  return map[couleur] ?? map.primary
}

async function rechercherDossierParRdv(rdv, cle) {
  try {
    if (cle === 'cpn') {
      let liste = rdv.numeroDossier ? await serviceCpn.listerDossiers(rdv.numeroDossier) : []
      let dossier = liste.find((d) => d.numeroDossierCpn === rdv.numeroDossier || d.numeroDossier === rdv.numeroDossier) ?? (liste.length === 1 ? liste[0] : null)
      if (!dossier && rdv.nomPatient) {
        liste = await serviceCpn.listerDossiers(rdv.nomPatient)
        dossier = liste.length === 1 ? liste[0] : null
      }
      return dossier
    }
    if (cle === 'cps-femme') {
      let liste = rdv.numeroDossier ? await serviceCpsFemme.listerDossiers(rdv.numeroDossier) : []
      let dossier = liste.find((d) => d.numeroDossier === rdv.numeroDossier) ?? (liste.length === 1 ? liste[0] : null)
      if (!dossier && rdv.nomPatient) {
        liste = await serviceCpsFemme.listerDossiers(rdv.nomPatient)
        dossier = liste.length === 1 ? liste[0] : null
      }
      return dossier
    }
    if (cle === 'cps-enfant') {
      let liste = rdv.numeroDossier ? await serviceCpsEnfant.listerDossiers(rdv.numeroDossier) : []
      let dossier = liste.find((d) => d.numeroDossier === rdv.numeroDossier) ?? (liste.length === 1 ? liste[0] : null)
      if (!dossier && rdv.nomPatient) {
        liste = await serviceCpsEnfant.listerDossiers(rdv.nomPatient)
        dossier = liste.length === 1 ? liste[0] : null
      }
      return dossier
    }
  } catch {
    return null
  }
  return null
}

function SectionFileAttente({ service, arrivees, chargement, pronantId, onPrendrePatient }) {
  const navigate = useNavigate()
  const cs = couleurService(service.couleur)

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="material-symbols-outlined animate-spin text-3xl text-slate-300">progress_activity</span>
      </div>
    )
  }

  if (arrivees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${cs.bg}`}>
          <span className={`material-symbols-outlined text-3xl ${cs.text}`}>{service.icone}</span>
        </div>
        <p className="font-medium text-slate-500">Aucun patient en attente</p>
        <p className="text-sm text-slate-400">La file d&apos;attente {service.label} est vide pour aujourd&apos;hui.</p>
        
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {arrivees.map((rdv, idx) => {
        const badge = badgeStatut(rdv.statut)
        const estEnCours = pronantId === rdv.id
        return (
          <div key={rdv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
            {/* Rang */}
            <span className="w-6 text-center text-sm font-bold text-slate-400">{idx + 1}</span>

            {/* Avatar */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${couleurAvatar(rdv.nomPatient)}`}>
              {initialesDepuisNom(rdv.nomPatient)}
            </div>

            {/* Infos */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-800">{rdv.nomPatient ?? '—'}</p>
              <p className="text-xs text-slate-400">
                {rdv.heure ? <span className="mr-2">{rdv.heure}</span> : null}
                {rdv.numeroDossier ? <span className="font-mono">{rdv.numeroDossier}</span> : null}
              </p>
            </div>

        
            {/* Bouton prise en charge */}
            <button
              type="button"
              disabled={!!pronantId}
              onClick={() => onPrendrePatient(rdv, service)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${cs.bg} ${cs.text} hover:opacity-80`}
            >
              {estEnCours
                ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                : <span className="material-symbols-outlined text-base">arrow_forward</span>}
              <span className="hidden sm:inline">Prendre en charge</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

function PageFileAttenteGenerale() {
  const navigate = useNavigate()
  const { utilisateurConnecte } = useAuthentification()
  const rolesCpnSeulement = ['INFIRMIERE', 'SAGE_FEMME']
  const rolesTousServices = ['MEDECIN']
  const masquerTotalRdv = [...rolesCpnSeulement, ...rolesTousServices].includes(utilisateurConnecte?.roleCode)
  const servicesFiltres = useMemo(() => {
    const role = utilisateurConnecte?.roleCode
    if (rolesCpnSeulement.includes(role)) return SERVICES.filter((s) => s.cle === 'cpn')
    if (rolesTousServices.includes(role)) return SERVICES
    return SERVICES
  }, [utilisateurConnecte?.roleCode])
  const [onglet, setOnglet] = useState('cpn')
  const [arrivees, setArrivees] = useState({ cpn: [], 'cps-femme': [], 'cps-enfant': [] })
  const [rdvTotal, setRdvTotal] = useState({ cpn: null, 'cps-femme': null, 'cps-enfant': null })
  const [chargement, setChargement] = useState({ cpn: true, 'cps-femme': true, 'cps-enfant': true })
  const [pronantId, setPronantId] = useState(null)
  const intervalRef = useRef(null)

  const chargerFileAttente = useCallback(async () => {
    const today = dateDuJourIso()
    for (const srv of servicesFiltres) {
      try {
        const [arrives, tous] = await Promise.all([
          serviceRendezVous.lister({ statut: 'Arrive', date: today, serviceDestination: srv.serviceDestination }),
          serviceRendezVous.lister({ date: today, serviceDestination: srv.serviceDestination }),
        ])
        setArrivees((prev) => ({ ...prev, [srv.cle]: arrives }))
        setRdvTotal((prev) => ({ ...prev, [srv.cle]: tous.length }))
      } catch {
        setArrivees((prev) => ({ ...prev, [srv.cle]: [] }))
      } finally {
        setChargement((prev) => ({ ...prev, [srv.cle]: false }))
      }
    }
  }, [servicesFiltres])

  useEffect(() => {
    void chargerFileAttente()
    intervalRef.current = setInterval(() => { void chargerFileAttente() }, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [chargerFileAttente])

  async function prendreEnCharge(rdv, service) {
    if (pronantId) return
    setPronantId(rdv.id)
    // Retrait immédiat optmiste de la liste
    setArrivees((prev) => ({ ...prev, [service.cle]: prev[service.cle].filter((r) => r.id !== rdv.id) }))
    try {
      // Passer le statut à Termine pour qu'il ne réapparaisse pas au prochain rechargement
      await serviceRendezVous.mettreAJourStatut(rdv.id, 'Termine').catch(() => null)
      const dossier = await rechercherDossierParRdv(rdv, service.cle)
      if (dossier) {
        navigate(`${service.baseUrl}/${dossier.id}`)
      } else {
        const p = new URLSearchParams()
        if (rdv.numeroDossier) p.set('refDossier', rdv.numeroDossier)
        if (rdv.nomPatient) p.set('nom', rdv.nomPatient)
        navigate(`${service.nouveauUrl}${p.toString() ? '?' + p.toString() : ''}`)
      }
    } catch {
      navigate(service.nouveauUrl)
    } finally {
      setPronantId(null)
    }
  }

  const serviceActif = servicesFiltres.find((s) => s.cle === onglet) ?? servicesFiltres[0]
  const totalGlobal = servicesFiltres.reduce((acc, s) => acc + (arrivees[s.cle]?.length ?? 0), 0)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      {/* En-tête */}
      <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-bold text-slate-900">File d&apos;attente clinique</h2>
          <p className="mt-0.5 text-sm text-slate-500">{servicesFiltres.map((s) => s.label).join(' · ')} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          type="button"
          onClick={() => void chargerFileAttente()}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Actualiser
        </button>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {servicesFiltres.map((srv) => {
          const cs = couleurService(srv.couleur)
          const nb = arrivees[srv.cle]?.length ?? 0
          const total = rdvTotal[srv.cle]
          return (
            <button
              key={srv.cle}
              type="button"
              onClick={() => setOnglet(srv.cle)}
              className={`flex items-center justify-between rounded-3xl border p-5 shadow-sm text-left transition-all ${onglet === srv.cle ? `${cs.bg} ${cs.border} border-2` : 'border-slate-100 bg-white hover:shadow-md'}`}
            >
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{srv.label}</p>
                <p className={`text-4xl font-black ${cs.text}`}>{nb}</p>
                {total !== null && !masquerTotalRdv && (
                  <p className="mt-1 text-xs text-slate-400">sur {total} rendez-vous</p>
                )}
              </div>

            </button>
          )
        })}
      </div>

      {/* Total global */}
      {totalGlobal > 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <span className="material-symbols-outlined text-base">pending</span>
          <span><strong>{totalGlobal}</strong> patient{totalGlobal > 1 ? 's' : ''} au total en attente de prise en charge</span>
        </div>
      )}

      {/* Conteneur principal */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {/* Contenu de l'onglet actif */}
        {serviceActif && (
          <SectionFileAttente
            service={serviceActif}
            arrivees={arrivees[serviceActif.cle]}
            chargement={chargement[serviceActif.cle]}
            pronantId={pronantId}
            onPrendrePatient={prendreEnCharge}
          />
        )}
      </div>
    </div>
  )
}

export default PageFileAttenteGenerale
