// Ce composant reproduit la page Reception selon la maquette fournie.
// Il s appuie sur la barre de recherche du navbar (parametre q) et non sur un champ local.
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const arrivees = [
  {
    id: '89210',
    numeroDossier: '#89210',
    nom: 'Mireille',
    postnom: 'Kavira',
    prenom: '',
    initiales: 'MK',
    telephone: '+243 998 765 432',
    heure: '08:15',
    motif: 'CPN 1',
    statut: 'Confirmé',
    style: 'ok',
  },
  {
    id: '90442',
    numeroDossier: '#90442',
    nom: 'Bébé',
    postnom: 'de Kahindo',
    prenom: '',
    initiales: 'BK',
    telephone: '+243 812 334 556',
    heure: '08:45',
    motif: 'Vaccination',
    statut: 'En attente',
    style: 'wait',
  },
  {
    id: '88712',
    numeroDossier: '#88712',
    nom: 'Maman',
    postnom: 'Masika',
    prenom: 'Alice',
    initiales: 'AM',
    telephone: '+243 970 123 456',
    heure: '09:00',
    motif: 'Suivi CPS',
    statut: 'Terminé',
    style: 'done',
  },
]

const orientations = [
  { id: 'cpn', icone: 'pregnant_woman', titre: 'CPN', description: 'Consultation Prénatale', classe: 'bg-primary/5 border-primary/10 hover:border-primary/30 text-primary' },
  { id: 'cps-femme', icone: 'woman_2', titre: 'CPS Femme', description: 'Suivi Post-Natal', classe: 'bg-tertiary/5 border-tertiary/10 hover:border-tertiary/30 text-tertiary' },
  { id: 'suivi-enfant', icone: 'child_care', titre: 'Suivi Enfant', description: 'Croissance & Santé', classe: 'bg-secondary/5 border-secondary/10 hover:border-secondary/30 text-secondary' },
  { id: 'vaccination', icone: 'vaccines', titre: 'Vaccination', description: 'Calendrier vaccinal', classe: 'bg-error/5 border-error/10 hover:border-error/30 text-error' },
  { id: 'laboratoire', icone: 'biotech', titre: 'Laboratoire', description: 'Analyses & Tests', classe: 'bg-slate-500/5 border-slate-500/10 hover:border-slate-500/30 text-slate-500' },
  { id: 'pharmacie', icone: 'medication', titre: 'Pharmacie', description: 'Délivrance soins', classe: 'bg-amber-600/5 border-amber-600/10 hover:border-amber-600/30 text-amber-600' },
]

function classesStatut(style) {
  if (style === 'ok') {
    return 'bg-tertiary-container text-on-tertiary-container'
  }

  if (style === 'wait') {
    return 'bg-error-container text-on-error-container'
  }

  return 'bg-surface-variant text-on-surface-variant'
}

function normaliserTexte(valeur = '') {
  return valeur
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function nomComplet(ligne) {
  return [ligne.nom, ligne.postnom, ligne.prenom].filter(Boolean).join(' ')
}

function PageTableauDeBordReception() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const recherche = normaliserTexte((searchParams.get('q') ?? '').trim())

  const arriveesFiltrees = useMemo(() => {
    if (!recherche) {
      return arrivees
    }

    return arrivees.filter((ligne) => {
      const valeurs = [
        nomComplet(ligne),
        ligne.nom,
        ligne.postnom,
        ligne.prenom,
        ligne.id,
        ligne.numeroDossier,
        ligne.telephone,
        ligne.motif,
        ligne.heure,
      ]

      return valeurs.some((valeur) => normaliserTexte(valeur).includes(recherche))
    })
  }, [recherche])

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="px-1">
        <h2 className="font-headline text-2xl font-bold text-slate-900">Réception</h2>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Rendez-vous du jour</p>
            <h3 className="text-4xl font-black text-primary">24</h3>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl">event_note</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Arrivées enregistrées</p>
            <h3 className="text-4xl font-black text-tertiary">08</h3>
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

        <button className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/50 transition-all duration-200 hover:bg-primary-dim hover:text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-secondary-dim transition-colors group-hover:bg-white/20 group-hover:text-white">
            <span className="material-symbols-outlined text-2xl">event</span>
          </div>
          <span className="text-left text-sm font-bold">Nouveau rendez-vous</span>
        </button>

        <button className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/50 transition-all duration-200 hover:bg-error-container hover:text-error-dim">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container/40 text-error transition-colors group-hover:bg-white/20">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
          <span className="text-left text-sm font-bold">Rendez-vous surprise</span>
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-50 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-50 px-6 py-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface">
            <span className="material-symbols-outlined text-primary">groups</span>
            Arrivées du jour
          </h3>
          <button className="text-sm font-semibold text-primary hover:underline">Voir tout</button>
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
              {arriveesFiltrees.map((ligne) => (
                <tr key={ligne.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary">
                        {ligne.initiales}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{nomComplet(ligne)}</p>
                        <p className="text-[10px] text-on-surface-variant">ID: {ligne.numeroDossier ?? `#${ligne.id}`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{ligne.heure}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold text-on-surface-variant">
                      {ligne.motif}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${classesStatut(ligne.style)}`}>
                      {ligne.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {arriveesFiltrees.length === 0 ? (
            <div className="px-6 py-10 text-sm text-on-surface-variant">
              Aucune arrivée trouvée pour cette recherche.
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="mb-4 flex items-center gap-2 px-2 text-lg font-bold text-on-surface">
          <span className="material-symbols-outlined text-tertiary">directions</span>
          Orientation Immédiate
        </h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {orientations.map((orientation) => (
            <div
              key={orientation.id}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${orientation.classe}`}
            >
              <span className="material-symbols-outlined mb-3 text-3xl">{orientation.icone}</span>
              <h4 className="mb-1 text-sm font-bold text-on-surface">{orientation.titre}</h4>
              <p className="text-[11px] text-on-surface-variant">{orientation.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default PageTableauDeBordReception
