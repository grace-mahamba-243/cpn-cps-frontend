// Ce composant affiche le journal des activités de tous les utilisateurs, visible uniquement par les administrateurs.
import { useEffect, useMemo, useState } from 'react'
import serviceJournal from '../../../services/api/serviceJournal'

const TYPE_ACTIONS = [
  { valeur: '', label: 'Tous les types' },
  { valeur: 'CONNEXION', label: 'Connexion' },
  { valeur: 'CREATION', label: 'Création' },
  { valeur: 'MODIFICATION', label: 'Modification' },
  { valeur: 'SUPPRESSION', label: 'Suppression' },
  { valeur: 'CONSULTATION', label: 'Consultation' },
]

const MODULES = [
  { valeur: '', label: 'Tous les modules' },
  { valeur: 'RECEPTION', label: 'Réception' },
  { valeur: 'CPN', label: 'CPN' },
  { valeur: 'CPS_FEMME', label: 'CPS Femme' },
  { valeur: 'CPS_ENFANT', label: 'CPS Enfant' },
  { valeur: 'LABORATOIRE', label: 'Laboratoire' },
  { valeur: 'RENDEZ_VOUS', label: 'Rendez-vous' },
  { valeur: 'UTILISATEURS', label: 'Utilisateurs' },
]

const LIBELLES_ACTION = {
  CONNEXION: 'Connexion',
  CREATION: 'Création',
  MODIFICATION: 'Modification',
  SUPPRESSION: 'Suppression',
  CONSULTATION: 'Consultation',
}

const STYLES_ACTION = {
  CONNEXION: 'bg-secondary-container text-on-secondary-container',
  CREATION: 'bg-tertiary-container/20 text-tertiary',
  MODIFICATION: 'bg-primary/10 text-primary',
  SUPPRESSION: 'bg-error-container text-on-error-container',
  CONSULTATION: 'bg-surface-container-high text-on-surface-variant',
}

const POINT_ACTION = {
  CONNEXION: 'bg-on-secondary-container',
  CREATION: 'bg-tertiary',
  MODIFICATION: 'bg-primary',
  SUPPRESSION: 'bg-error',
  CONSULTATION: 'bg-surface-tint',
}

function normaliser(valeur) {
  return String(valeur ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function formaterDate(dateIso) {
  if (!dateIso) return { date: '—', heure: '—' }
  const date = new Date(dateIso)
  return {
    date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    heure: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
}

function libelleAction(typeAction) {
  return LIBELLES_ACTION[typeAction] ?? typeAction ?? 'Action'
}

function extraireNumeroDossierReel(meta) {
  if (!meta || typeof meta !== 'object') return null
  const candidats = [
    meta.numeroDossier,
    meta.numeroDossierCpn,
    meta.numeroDossierMere,
    meta.refDossier,
  ]
  return candidats.find((v) => typeof v === 'string' && v.trim().length > 0) ?? null
}

function nettoyerDescriptionDossier(description, meta) {
  const texte = String(description ?? '')
  const regexUuid = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
  if (!regexUuid.test(texte)) return texte

  const numeroReel = extraireNumeroDossierReel(meta)
  if (numeroReel) {
    return texte.replace(regexUuid, numeroReel)
  }

  return texte.replace(regexUuid, 'N° indisponible')
}

function formaterNomChamp(champ) {
  const base = String(champ ?? '')
    .replace(/^(ancienne|nouvelle|ancien|nouveau)/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

  if (!base) return ''
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase()
}

function extraireColonnesModifiees(meta) {
  if (!meta || typeof meta !== 'object') return []

  const listesConnues = [
    meta.colonnesModifiees,
    meta.colonnes,
    meta.champsModifies,
    meta.champs,
    meta.modifications,
  ]

  for (const liste of listesConnues) {
    if (Array.isArray(liste) && liste.length > 0) {
      return [...new Set(liste.map(formaterNomChamp).filter(Boolean))]
    }
  }

  const keys = Object.keys(meta)
  const trouvees = new Set()

  for (const key of keys) {
    if (/^ancienne/i.test(key)) {
      const suffixe = key.replace(/^ancienne/i, '')
      if (Object.prototype.hasOwnProperty.call(meta, `nouvelle${suffixe}`) || Object.prototype.hasOwnProperty.call(meta, `nouveau${suffixe}`)) {
        trouvees.add(formaterNomChamp(suffixe))
      }
    }

    if (/^ancien/i.test(key)) {
      const suffixe = key.replace(/^ancien/i, '')
      if (Object.prototype.hasOwnProperty.call(meta, `nouveau${suffixe}`) || Object.prototype.hasOwnProperty.call(meta, `nouvelle${suffixe}`)) {
        trouvees.add(formaterNomChamp(suffixe))
      }
    }
  }

  return [...trouvees].filter(Boolean)
}

function PageJournalActivites() {
  const [journal, setJournal] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtres, setFiltres] = useState({
    typeAction: '',
    module: '',
    dateDebut: '',
    dateFin: new Date().toISOString().split('T')[0],
    page: 1,
  })

  const charger = async (f = filtres) => {
    setChargement(true)
    setErreur('')
    try {
      const data = await serviceJournal.lister({
        ...f,
        typeAction: f.typeAction || undefined,
        module: f.module || undefined,
        dateDebut: f.dateDebut || undefined,
        dateFin: f.dateFin || undefined,
        limite: 50,
      })
      setJournal(data)
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const appliquerFiltres = () => {
    const prochainsFiltres = { ...filtres, page: 1 }
    setFiltres(prochainsFiltres)
    charger(prochainsFiltres)
  }

  const changerPage = (p) => {
    const f = { ...filtres, page: p }
    setFiltres(f)
    charger(f)
  }

  const itemsFiltresRecherche = useMemo(() => {
    const items = journal?.items ?? []
    const terme = normaliser(recherche)
    if (!terme) return items

    return items.filter((entree) => {
      const moduleTexte = MODULES.find((m) => m.valeur === entree.module)?.label ?? entree.module
      const actionTexte = libelleAction(entree.typeAction)
      const champs = [
        entree.utilisateurNom,
        entree.description,
        moduleTexte,
        entree.section,
        actionTexte,
      ]
      return champs.some((champ) => normaliser(champ).includes(terme))
    })
  }, [journal?.items, recherche])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-2 sm:px-0">
      <header className="mb-2 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Administration</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-xs font-medium uppercase tracking-wider text-primary">Audit Logs</span>
          </nav>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">Journal des activités</h2>
        </div>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une action, un utilisateur..."
            className="w-full rounded-full border-none bg-surface-container-low py-3 pl-12 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low p-4">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Période</label>
          <input
            type="date"
            value={filtres.dateDebut}
            onChange={(e) => setFiltres((prev) => ({ ...prev, dateDebut: e.target.value }))}
            className="w-full rounded-lg border-none bg-surface-container-lowest p-2 text-sm focus:ring-0"
          />
        </div>

        <div className="rounded-xl bg-surface-container-low p-4">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Type d'action</label>
          <select
            value={filtres.typeAction}
            onChange={(e) => setFiltres((prev) => ({ ...prev, typeAction: e.target.value }))}
            className="w-full rounded-lg border-none bg-surface-container-lowest p-2 text-sm focus:ring-0"
          >
            {TYPE_ACTIONS.map((type) => (
              <option key={type.valeur} value={type.valeur}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl bg-surface-container-low p-4">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Module</label>
          <select
            value={filtres.module}
            onChange={(e) => setFiltres((prev) => ({ ...prev, module: e.target.value }))}
            className="w-full rounded-lg border-none bg-surface-container-lowest p-2 text-sm focus:ring-0"
          >
            {MODULES.map((module) => (
              <option key={module.valeur} value={module.valeur}>{module.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end rounded-xl bg-surface-container-low p-4">
          <button
            type="button"
            onClick={appliquerFiltres}
            className="flex h-[40px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Appliquer
          </button>
        </div>
      </section>

      {erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
      )}

      {chargement && (
        <div className="flex items-center gap-3 py-16 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          <span className="text-sm">Chargement du journal...</span>
        </div>
      )}

      {!chargement && journal && (
        <section className="overflow-hidden rounded-xl bg-surface-container-low">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Date & Heure</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Utilisateur</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Action effectuée</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {itemsFiltresRecherche.map((entree) => {
                  const date = formaterDate(entree.creeLe)
                  const moduleTexte = MODULES.find((m) => m.valeur === entree.module)?.label ?? entree.module
                  const styleBadge = STYLES_ACTION[entree.typeAction] ?? 'bg-surface-container-high text-on-surface-variant'
                  const point = POINT_ACTION[entree.typeAction] ?? 'bg-surface-tint'
                  const colonnesModifiees = entree.typeAction === 'MODIFICATION'
                    ? extraireColonnesModifiees(entree.meta)
                    : []
                  const descriptionLisible = nettoyerDescriptionDossier(entree.description, entree.meta)

                  return (
                    <tr key={entree.id} className="group bg-surface-container-lowest transition-colors hover:bg-surface-bright">
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="text-sm font-semibold text-on-surface">{date.date}</div>
                        <div className="text-[11px] text-on-surface-variant">{date.heure}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
                            {(entree.utilisateurNom ?? '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-sm font-medium">{entree.utilisateurNom ?? 'Utilisateur inconnu'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${point}`}></span>
                          <span className="text-sm text-on-surface">{descriptionLisible}</span>
                        </div>
                        {colonnesModifiees.length > 0 && (
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Colonnes modifiées: <span className="font-semibold text-on-surface">{colonnesModifiees.join(', ')}</span>
                          </p>
                        )}
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${styleBadge}`}>
                          {libelleAction(entree.typeAction)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-on-surface-variant">{moduleTexte}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {itemsFiltresRecherche.length === 0 && (
            <div className="py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined mb-3 block text-4xl">history</span>
              <p className="text-sm">Aucune activité enregistrée pour ces critères.</p>
            </div>
          )}
        </section>
      )}

      {!chargement && journal && !recherche && journal.total > journal.limite && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => changerPage(filtres.page - 1)}
            disabled={filtres.page <= 1}
            className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-sm text-on-surface-variant">Page {filtres.page} / {Math.ceil(journal.total / journal.limite)}</span>
          <button
            onClick={() => changerPage(filtres.page + 1)}
            disabled={filtres.page >= Math.ceil(journal.total / journal.limite)}
            className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

    </div>
  )
}

export default PageJournalActivites
