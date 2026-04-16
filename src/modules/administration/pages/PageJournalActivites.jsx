// Ce composant affiche le journal des activités de tous les utilisateurs, visible uniquement par les administrateurs.
import { useEffect, useState } from 'react'
import serviceJournal from '../../../services/api/serviceJournal'

const TYPE_ACTIONS = [
  { valeur: '', label: 'Toutes les actions' },
  { valeur: 'CREATION', label: 'Créations' },
  { valeur: 'MODIFICATION', label: 'Modifications' },
  { valeur: 'SUPPRESSION', label: 'Suppressions' },
  { valeur: 'CONSULTATION', label: 'Consultations' },
]

const COULEURS_ACTION = {
  CREATION: 'bg-tertiary-container text-on-tertiary-container',
  MODIFICATION: 'bg-secondary-container text-on-secondary-container',
  SUPPRESSION: 'bg-error-container/60 text-error',
  CONSULTATION: 'bg-surface-container-high text-on-surface-variant',
}

const ICONES_ACTION = {
  CREATION: 'add_circle',
  MODIFICATION: 'edit',
  SUPPRESSION: 'delete',
  CONSULTATION: 'visibility',
}

function BadgeAction({ typeAction }) {
  const cls = COULEURS_ACTION[typeAction] ?? 'bg-surface-container text-on-surface-variant'
  const icone = ICONES_ACTION[typeAction] ?? 'info'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      <span className="material-symbols-outlined text-xs">{icone}</span>
      {typeAction}
    </span>
  )
}

function PageJournalActivites() {
  const [journal, setJournal] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
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

  useEffect(() => { charger() }, [])

  const majFiltres = (champ, valeur) => {
    const f = { ...filtres, [champ]: valeur, page: 1 }
    setFiltres(f)
    charger(f)
  }

  const changerPage = (p) => {
    const f = { ...filtres, page: p }
    setFiltres(f)
    charger(f)
  }

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6">

      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Journal des activités
        </h2>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          Historique de toutes les actions effectuées dans le système
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtres.typeAction}
          onChange={(e) => majFiltres('typeAction', e.target.value)}
          className="rounded-xl border-none bg-surface-container px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary"
        >
          {TYPE_ACTIONS.map((t) => (
            <option key={t.valeur} value={t.valeur}>{t.label}</option>
          ))}
        </select>

        <select
          value={filtres.module}
          onChange={(e) => majFiltres('module', e.target.value)}
          className="rounded-xl border-none bg-surface-container px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary"
        >
          <option value="">Tous les modules</option>
          <option value="CPN">CPN</option>
          <option value="RENDEZ_VOUS">Rendez-vous</option>
          <option value="PATIENTES">Patientes</option>
          <option value="UTILISATEURS">Utilisateurs</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filtres.dateDebut}
            onChange={(e) => majFiltres('dateDebut', e.target.value)}
            className="rounded-xl border-none bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary"
            placeholder="Du"
          />
          <span className="text-on-surface-variant text-sm">→</span>
          <input
            type="date"
            value={filtres.dateFin}
            onChange={(e) => majFiltres('dateFin', e.target.value)}
            className="rounded-xl border-none bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary"
            placeholder="Au"
          />
        </div>
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="rounded-xl bg-error-container/30 px-4 py-3 text-sm text-error">{erreur}</div>
      )}

      {/* Chargement */}
      {chargement && (
        <div className="flex items-center gap-3 py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">autorenew</span>
          <span className="text-sm">Chargement du journal...</span>
        </div>
      )}

      {/* Résultats */}
      {!chargement && journal && (
        <>
          <p className="text-sm text-on-surface-variant">{journal.total} entrée{journal.total !== 1 ? 's' : ''} trouvée{journal.total !== 1 ? 's' : ''}</p>

          {journal.items.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-lowest p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl block mb-3">history</span>
              <p className="text-sm">Aucune activité enregistrée pour ces critères.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {journal.items.map((entree) => (
                <div key={entree.id} className="rounded-2xl bg-surface-container-lowest px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3 shadow-sm">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">
                      {ICONES_ACTION[entree.typeAction] ?? 'info'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <BadgeAction typeAction={entree.typeAction} />
                      <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
                        {entree.module}{entree.section ? ` · ${entree.section}` : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-on-surface">{entree.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {entree.utilisateurNom}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {new Date(entree.creeLe).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {journal.total > journal.limite && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => changerPage(filtres.page - 1)}
                disabled={filtres.page <= 1}
                className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors"
              >
                Précédent
              </button>
              <span className="text-sm text-on-surface-variant">
                Page {filtres.page} / {Math.ceil(journal.total / journal.limite)}
              </span>
              <button
                onClick={() => changerPage(filtres.page + 1)}
                disabled={filtres.page >= Math.ceil(journal.total / journal.limite)}
                className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface disabled:opacity-40 hover:bg-surface-container-high transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

    </div>
  )
}

export default PageJournalActivites
