// Section listant tous les examens demandés ou reçus pour le dossier CPN.
// Les échographies restent en attente jusqu'à ce que la patiente revienne avec ses images.
// Seuls les examens biologiques sont envoyés au laboratoire.
import { useState } from 'react'
import serviceCpn from '../../../services/api/serviceCpn'
import { formaterDateCourte } from './utilitairesCpn'

function SectionExamens({ examens, dossierId, contacts, navigate, onRecharger }) {
  const liste = examens ?? []
  // État local pour la modale d'interprétation d'une échographie
  const [echoEnCours, setEchoEnCours] = useState(null) // { id, libelle }
  const [interpretation, setInterpretation] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreurEcho, setErreurEcho] = useState('')

  const ouvrirInterpretation = (examen) => {
    if (!dossierId || !navigate) return
    // Vérifier si un contact a été créé aujourd'hui
    const today = new Date().toISOString().split('T')[0]
    const aContactAujourdhui = (contacts ?? []).some(
      (c) => c.dateContact?.slice(0, 10) === today
    )
    if (!aContactAujourdhui) {
      // Pas de contact aujourd'hui → rediriger vers la création d'un contact
      navigate(`/cpn/${dossierId}/contacts/nouveau`, {
        state: { messageInfo: "Créez d'abord un contact CPN pour pouvoir enregistrer l'interprétation de l'échographie." },
      })
      return
    }
    setEchoEnCours({ id: examen.id, libelle: examen.libelle })
    setInterpretation('')
    setErreurEcho('')
  }

  const soumettreInterpretation = async () => {
    if (!interpretation.trim()) { setErreurEcho("L'interprétation est obligatoire."); return }
    setEnregistrement(true)
    setErreurEcho('')
    try {
      await serviceCpn.entrerInterpretationEchographie(dossierId, echoEnCours.id, { interpretation })
      setEchoEnCours(null)
      setInterpretation('')
      if (onRecharger) onRecharger()
    } catch (ex) {
      setErreurEcho(ex.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <section id="section-examens" className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-headline text-[15px] font-bold text-on-surface">
          <span className="material-symbols-outlined text-lg text-tertiary">biotech</span>
          Examens
          <span className="ml-1 rounded-full bg-tertiary-container/40 px-2 py-0.5 text-[11px] font-semibold text-tertiary">{liste.length}</span>
        </h3>
      </div>

      {liste.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-3xl">science</span>
          <p className="text-sm">Aucun examen demandé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {liste.map((ex) => {
            const estEcho = ex.typeExamen === 'ECHOGRAPHIE'
            const enAttente = ex.statut === 'DEMANDE' || ex.statut === 'EN_COURS'
            const recu = ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE'
            // Modale d'interprétation inline pour cette échographie
            const modaleOuverte = echoEnCours?.id === ex.id

            return (
              <div key={ex.id} className={`rounded-xl border px-4 py-3 ${estEcho ? 'border-outline-variant/50 bg-secondary-container/10' : 'border-outline-variant/40 bg-surface'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${recu ? 'bg-tertiary-container/40 text-tertiary' : estEcho ? 'bg-secondary-container/50 text-secondary' : 'bg-secondary-container/50 text-on-secondary-container'}`}>
                      <span className="material-symbols-outlined text-lg">
                        {recu ? 'task_alt' : estEcho ? 'ultrasound' : 'hourglass_top'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-on-surface">{ex.libelle}</p>
                        {estEcho && (
                          <span className="rounded-full bg-secondary-container/60 px-2 py-0.5 text-[10px] font-bold text-secondary">Échographie</span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant">
                        {ex.typeExamen} · {ex.source}{ex.dateExamen ? ` · ${formaterDateCourte(ex.dateExamen)}` : ''}
                      </p>
                      {estEcho && enAttente && (
                        <p className="mt-0.5 text-[11px] text-secondary/80 italic">En attente des images apportées par la patiente</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${recu ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {recu ? 'Reçu' : 'En attente'}
                    </span>
                    {estEcho && enAttente && dossierId && navigate && (
                      <button
                        onClick={() => ouvrirInterpretation(ex)}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        Interpréter
                      </button>
                    )}
                  </div>
                </div>

                {/* Résultat affiché si reçu */}
                {recu && ex.resultat && (
                  <div className="mt-2.5 ml-12 rounded-lg bg-surface-container-low px-3 py-2">
                    <p className="text-[11px] font-semibold text-on-surface-variant">{estEcho ? 'Interprétation' : 'Résultat'}</p>
                    <p className="text-sm text-on-surface">{ex.resultat}</p>
                  </div>
                )}

                {/* Modale inline pour saisir l'interprétation */}
                {modaleOuverte && (
                  <div className="mt-3 ml-12 rounded-xl border border-outline-variant/50 bg-secondary-container/10 p-4 space-y-3">
                    <p className="text-[12px] font-bold text-on-surface">Interprétation — {echoEnCours.libelle}</p>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      placeholder="Saisissez l'interprétation de l'échographie…"
                      value={interpretation}
                      onChange={(e) => setInterpretation(e.target.value)}
                    />
                    {erreurEcho && (
                      <p className="text-xs text-error">{erreurEcho}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={soumettreInterpretation}
                        disabled={enregistrement}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
                      >
                        {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={() => setEchoEnCours(null)}
                        className="rounded-full bg-surface-container px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default SectionExamens
