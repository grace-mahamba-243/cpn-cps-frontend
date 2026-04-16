// Section listant tous les contacts (visites) CPN du dossier sous forme de tableau.
import { useNavigate } from 'react-router-dom'
import { formaterDateCourte } from './utilitairesCpn'

function SectionContacts({ dossierId, contacts, statut }) {
  const navigate = useNavigate()
  const liste = [...(contacts ?? [])].sort((a, b) => b.numeroContact - a.numeroContact)

  return (
    <section className="flex flex-col gap-4">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-headline text-[15px] font-bold text-on-surface">
          <span className="material-symbols-outlined text-lg text-secondary">calendar_month</span>
          Contacts CPN
          <span className="ml-1 rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-semibold text-on-secondary-container">{liste.length}</span>
        </h3>
        {statut === 'OUVERT' && (
          <button
            onClick={() => navigate(`/cpn/${dossierId}/contacts/nouveau`)}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nouveau contact CPN
          </button>
        )}
      </div>

      {liste.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-3xl">event_busy</span>
          <p className="text-sm">Aucun contact enregistré</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface-container-low p-1">
          <div className="overflow-x-auto rounded-lg bg-surface-container-lowest">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">N° Contact</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Observations</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Âge gestationnel</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Prochain RDV</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {liste.map((c) => {
                  const estInitial = c.numeroContact === 1
                  return (
                    <tr
                      key={c.id}
                      className={`group transition-colors hover:bg-primary-container/10 ${estInitial ? 'border-l-4 border-outline-variant/40' : ''}`}
                    >
                      {/* N° Contact */}
                      <td className="px-5 py-4">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${estInitial ? 'bg-primary-container text-primary' : 'bg-surface-container-high text-on-surface'}`}>
                          {String(c.numeroContact).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-on-surface">{formaterDateCourte(c.dateContact)}</p>
                        {estInitial && <p className="text-xs italic font-medium text-on-surface-variant">Contact Initial</p>}
                      </td>

                      {/* Observations */}
                      <td className="px-5 py-4">
                        {c.observations ? (
                          <span className="inline-flex items-center rounded-full bg-tertiary-container/30 px-2.5 py-0.5 text-xs font-medium text-on-tertiary-container">
                            {c.observations.length > 40 ? c.observations.slice(0, 40) + '…' : c.observations}
                          </span>
                        ) : (
                          <span className="text-sm text-on-surface-variant">Aucune observation</span>
                        )}
                      </td>

                      {/* Âge gestationnel */}
                      <td className="px-5 py-4 text-sm font-semibold text-primary">
                        {c.ageGestationnel ? `${c.ageGestationnel} SA` : '—'}
                      </td>

                      {/* Prochain RDV */}
                      <td className="px-5 py-4 text-sm font-medium text-on-surface">
                        {formaterDateCourte(c.prochainRdvDate) ?? '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => navigate(`/cpn/${dossierId}/contacts/${c.id}`)}
                          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                        >
                          Voir dossier
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex items-center justify-between bg-surface-container-low px-5 py-3">
              <p className="text-xs italic font-medium text-on-surface-variant">
                Affichage de {liste.length} contact{liste.length > 1 ? 's' : ''} sur {liste.length} identifié{liste.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default SectionContacts
