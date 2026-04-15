// Ce composant affiche le tableau de bord de la reception avec les donnees reelles du jour.
// Il charge les rendez-vous du jour depuis le backend et met a jour les compteurs dynamiquement.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import serviceRendezVousApi from '../../../services/api/serviceRendezVous'

function classesStatut(statut) {
  if (statut === 'Arrive') return 'bg-tertiary-container text-on-tertiary-container'
  if (statut === 'Prevu') return 'bg-error-container text-on-error-container'
  return 'bg-surface-variant text-on-surface-variant'
}

function libelleStatut(statut) {
  if (statut === 'Arrive') return 'Arrivé'
  if (statut === 'Prevu') return 'En attente'
  if (statut === 'Termine') return 'Terminé'
  return statut
}

function dateDuJourIso() {
  return new Date().toISOString().slice(0, 10)
}

function normaliserTexte(valeur = '') {
  return valeur.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function initialesDepuisNom(nom = '') {
  return nom.trim().split(/\s+/).slice(0, 2).map((m) => m.charAt(0).toUpperCase()).join('')
}

function PageTableauDeBordReception() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const recherche = normaliserTexte((searchParams.get('q') ?? '').trim())
  const [rendezVousDuJour, setRendezVousDuJour] = useState([])
  const [estChargement, setEstChargement] = useState(true)

  useEffect(() => {
    let estActif = true

    const charger = async () => {
      try {
        const liste = await serviceRendezVousApi.lister({ date: dateDuJourIso() })
        if (estActif) setRendezVousDuJour(liste)
      } catch {
        // Echec silencieux : on affiche la liste vide
      } finally {
        if (estActif) setEstChargement(false)
      }
    }

    void charger()
    return () => { estActif = false }
  }, [])

  const totalDuJour = rendezVousDuJour.length
  const totalArrives = useMemo(
    () => rendezVousDuJour.filter((rdv) => rdv.statut === 'Arrive').length,
    [rendezVousDuJour],
  )

  const arriveesFiltrees = useMemo(() => {
    if (!recherche) return rendezVousDuJour
    return rendezVousDuJour.filter((rdv) => {
      const valeurs = [rdv.nomPatient, rdv.numeroDossier, rdv.motif, rdv.heure, rdv.service]
      return valeurs.some((v) => normaliserTexte(v ?? '').includes(recherche))
    })
  }, [rendezVousDuJour, recherche])

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="px-1">
        <h2 className="font-headline text-2xl font-bold text-slate-900">Réception</h2>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Rendez-vous du jour</p>
            <h3 className="text-4xl font-black text-primary">{estChargement ? '—' : totalDuJour}</h3>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl">event_note</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Arrivées enregistrées</p>
            <h3 className="text-4xl font-black text-tertiary">{estChargement ? '—' : String(totalArrives).padStart(2, '0')}</h3>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary">
            <span className="material-symbols-outlined text-3xl">how_to_reg</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/50 transition-all duration-200 hover:bg-primary hover:text-white"
          onClick={() => navigate('/patients/nouveau')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-primary transition-colors group-hover:bg-white/20 group-hover:text-white">
            <span className="material-symbols-outlined text-2xl">person_add</span>
          </div>
          <span className="text-left text-sm font-bold">Nouvelle mere</span>
        </button>

        <button
          type="button"
          className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/50 transition-all duration-200 hover:bg-tertiary hover:text-white"
          onClick={() => navigate('/enfants/nouveau')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary-container text-tertiary transition-colors group-hover:bg-white/20 group-hover:text-white">
            <span className="material-symbols-outlined text-2xl">child_care</span>
          </div>
          <span className="text-left text-sm font-bold">Nouvel enfant</span>
        </button>

        <button
          type="button"
          className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/50 transition-all duration-200 hover:bg-primary-dim hover:text-white"
          onClick={() => navigate('/rendez-vous/nouveau')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-secondary-dim transition-colors group-hover:bg-white/20 group-hover:text-white">
            <span className="material-symbols-outlined text-2xl">event</span>
          </div>
          <span className="text-left text-sm font-bold">Nouveau rendez-vous</span>
        </button>


      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-50 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-50 px-6 py-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface">
            <span className="material-symbols-outlined text-primary">groups</span>
            Arrivées du jour
          </h3>
          <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => navigate('/rendez-vous')}>Voir tout</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest">Patiente / Enfant</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest">Heure</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest">Motif</th>
                <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {arriveesFiltrees.map((rdv) => (
                <tr key={rdv.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary">
                        {initialesDepuisNom(rdv.nomPatient)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{rdv.nomPatient}</p>
                        <p className="text-[10px] text-on-surface-variant">{rdv.numeroDossier || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{rdv.heure}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold text-on-surface-variant">
                      {rdv.motif}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${classesStatut(rdv.statut)}`}>
                      {libelleStatut(rdv.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/rendez-vous/${rdv.id}`)}
                      className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!estChargement && arriveesFiltrees.length === 0 ? (
            <div className="px-6 py-10 text-sm text-on-surface-variant">
              {recherche ? 'Aucun rendez-vous trouvé pour cette recherche.' : 'Aucun rendez-vous enregistré pour aujourd\'hui.'}
            </div>
          ) : null}

          {estChargement ? (
            <div className="px-6 py-10 text-sm text-on-surface-variant">Chargement en cours...</div>
          ) : null}
        </div>
      </section>


    </div>
  )
}

export default PageTableauDeBordReception
