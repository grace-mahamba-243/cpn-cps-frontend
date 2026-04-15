// Ce composant affiche le dossier CPN complet (antecedents, contacts, examens) et offre les actions de suivi.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

function badgeStatut(statut) {
  return statut === 'OUVERT'
    ? 'bg-primary-container text-on-primary-container'
    : 'bg-surface-variant text-on-surface-variant'
}

function badgeVih(statut) {
  if (statut === 'POSITIF') return 'bg-error-container text-on-error-container'
  if (statut === 'NEGATIF') return 'bg-tertiary-container text-on-tertiary-container'
  return 'bg-surface-variant text-on-surface-variant'
}

function ExamenItem({ examen, dossierId, onResultatEnregistre }) {
  const [ouvert, setOuvert] = useState(false)
  const [resultat, setResultat] = useState(examen.resultat ?? '')
  const [dateResultat, setDateResultat] = useState(examen.dateResultat ?? new Date().toISOString().slice(0, 10))
  const [enregistrement, setEnregistrement] = useState(false)

  const enregistrer = async () => {
    setEnregistrement(true)
    try {
      await serviceCpn.enregistrerResultatExamen(dossierId, examen.id, { resultat, dateResultat })
      onResultatEnregistre()
      setOuvert(false)
    } catch (ex) {
      alert(ex.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-on-surface">{examen.libelle}</p>
          <p className="text-xs text-on-surface-variant">{examen.typeExamen} · {examen.source}</p>
          {examen.dateExamen && <p className="text-xs text-on-surface-variant">Demandé le {examen.dateExamen}</p>}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${examen.statut === 'RESULTAT_RECU' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
          {examen.statut === 'RESULTAT_RECU' ? 'Résultat reçu' : 'En attente'}
        </span>
      </div>

      {examen.statut === 'RESULTAT_RECU' && examen.resultat && (
        <div className="mt-3 rounded-lg bg-surface-container px-3 py-2">
          <p className="text-xs text-on-surface-variant">Résultat :</p>
          <p className="mt-0.5 text-sm text-on-surface">{examen.resultat}</p>
        </div>
      )}

      {examen.statut !== 'RESULTAT_RECU' && (
        <div className="mt-3">
          {!ouvert ? (
            <button onClick={() => setOuvert(true)} className="text-xs font-medium text-primary hover:underline">
              Saisir le résultat
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea rows={2} value={resultat} onChange={(e) => setResultat(e.target.value)} placeholder="Résultat…" className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container p-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              <input type="date" value={dateResultat} onChange={(e) => setDateResultat(e.target.value)} className="rounded-lg border border-outline-variant bg-surface-container p-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex gap-2">
                <button onClick={enregistrer} disabled={enregistrement} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary disabled:opacity-60">
                  {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button onClick={() => setOuvert(false)} className="rounded-lg border border-outline px-3 py-1.5 text-xs text-on-surface">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PageDetailDossierCpn() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [afficherFormExamen, setAfficherFormExamen] = useState(false)
  const [nouvelExamen, setNouvelExamen] = useState({ typeExamen: 'BIOLOGIQUE', libelle: '', source: 'INTERNE', dateExamen: '', notes: '' })
  const [envoiExamen, setEnvoiExamen] = useState(false)

  const chargerDossier = async () => {
    setChargement(true)
    setErreur('')
    try {
      const data = await serviceCpn.obtenirDossier(dossierId)
      setDossier(data)
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerDossier()
    window.history.replaceState({}, '')
  }, [dossierId])

  useEffect(() => {
    if (!messageSucces) return
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  const changerStatut = async () => {
    const prochainStatut = dossier.statut === 'OUVERT' ? 'CLOS' : 'OUVERT'
    const libelle = prochainStatut === 'CLOS' ? 'Clore' : 'Réouvrir'
    if (!confirm(`${libelle} ce dossier CPN ?`)) return
    try {
      await serviceCpn.modifierDossier(dossierId, { statut: prochainStatut })
      chargerDossier()
    } catch (ex) {
      alert(ex.message)
    }
  }

  const demanderExamen = async (e) => {
    e.preventDefault()
    setEnvoiExamen(true)
    try {
      await serviceCpn.demanderExamen(dossierId, {
        ...nouvelExamen,
        dateExamen: nouvelExamen.dateExamen || null,
        notes: nouvelExamen.notes || null,
      })
      setAfficherFormExamen(false)
      setNouvelExamen({ typeExamen: 'BIOLOGIQUE', libelle: '', source: 'INTERNE', dateExamen: '', notes: '' })
      chargerDossier()
    } catch (ex) {
      alert(ex.message)
    } finally {
      setEnvoiExamen(false)
    }
  }

  if (chargement) return (
    <div className="flex items-center justify-center py-20 text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin">refresh</span>
      <span className="ml-2 text-sm">Chargement du dossier…</span>
    </div>
  )

  if (erreur) return (
    <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
  )

  if (!dossier) return null

  const dernierContact = dossier.contacts?.[0] ?? null

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cpn')} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-on-surface">{dossier.numeroDossierCpn}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStatut(dossier.statut)}`}>{dossier.statut}</span>
            </div>
            <p className="text-sm text-on-surface-variant">{dossier.patiente?.nomComplet}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {dossier.statut === 'OUVERT' && (
            <button onClick={() => navigate(`/cpn/${dossierId}/contacts/nouveau`)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90">
              <span className="material-symbols-outlined text-base">add_circle</span>
              Nouveau contact
            </button>
          )}
          <button onClick={() => setAfficherFormExamen(!afficherFormExamen)} className="flex items-center gap-2 rounded-xl border border-outline px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container">
            <span className="material-symbols-outlined text-base">biotech</span>
            Demander un examen
          </button>
          <button onClick={changerStatut} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-surface-container ${dossier.statut === 'OUVERT' ? 'border-error text-error' : 'border-outline text-on-surface'}`}>
            <span className="material-symbols-outlined text-base">{dossier.statut === 'OUVERT' ? 'lock' : 'lock_open'}</span>
            {dossier.statut === 'OUVERT' ? 'Clore le dossier' : 'Réouvrir'}
          </button>
        </div>
      </header>

      {messageSucces && (
        <div className="rounded-xl bg-tertiary-container px-4 py-3 text-sm text-on-tertiary-container">{messageSucces}</div>
      )}

      {/* Panneau demande examen */}
      {afficherFormExamen && (
        <form onSubmit={demanderExamen} className="rounded-2xl border border-secondary/40 bg-secondary-container/30 p-5">
          <h3 className="mb-4 text-base font-semibold text-on-surface">Nouvelle demande d'examen</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <label className="cpn-champ">
              <span>Type</span>
              <select value={nouvelExamen.typeExamen} onChange={(e) => setNouvelExamen(x => ({ ...x, typeExamen: e.target.value }))}>
                <option value="BIOLOGIQUE">Biologique</option>
                <option value="ECHOGRAPHIE">Échographie</option>
                <option value="AUTRE">Autre</option>
              </select>
            </label>
            <label className="cpn-champ md:col-span-1">
              <span>Libellé *</span>
              <input required value={nouvelExamen.libelle} onChange={(e) => setNouvelExamen(x => ({ ...x, libelle: e.target.value }))} placeholder="ex: NFS, Glycémie…" />
            </label>
            <label className="cpn-champ">
              <span>Source</span>
              <select value={nouvelExamen.source} onChange={(e) => setNouvelExamen(x => ({ ...x, source: e.target.value }))}>
                <option value="INTERNE">Interne</option>
                <option value="EXTERNE">Externe</option>
              </select>
            </label>
            <label className="cpn-champ">
              <span>Date demande</span>
              <input type="date" value={nouvelExamen.dateExamen} onChange={(e) => setNouvelExamen(x => ({ ...x, dateExamen: e.target.value }))} />
            </label>
            <label className="cpn-champ md:col-span-2">
              <span>Notes</span>
              <input value={nouvelExamen.notes} onChange={(e) => setNouvelExamen(x => ({ ...x, notes: e.target.value }))} placeholder="Précisions…" />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={envoiExamen} className="rounded-xl bg-secondary px-5 py-2 text-sm font-semibold text-on-secondary disabled:opacity-60">
              {envoiExamen ? 'Envoi…' : 'Demander'}
            </button>
            <button type="button" onClick={() => setAfficherFormExamen(false)} className="rounded-xl border border-outline px-5 py-2 text-sm text-on-surface">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne gauche : info dossier */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Infos patiente */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Patiente</h3>
            <div className="flex flex-col gap-1 text-sm text-on-surface">
              <p className="font-semibold">{dossier.patiente?.nomComplet}</p>
              {dossier.patiente?.dateNaissance && <p className="text-on-surface-variant">Né·e le {dossier.patiente.dateNaissance}</p>}
              {dossier.patiente?.telephone && <p>{dossier.patiente.telephone}</p>}
              {dossier.patiente?.numeroDossier && <p className="text-on-surface-variant">Dossier : {dossier.patiente.numeroDossier}</p>}
            </div>
          </div>

          {/* Données initiales */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Données obstétricales</h3>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {[
                ['Ouverture', dossier.dateOuverture],
                ['Gestité', dossier.gestite],
                ['Parité', dossier.parite],
                ['Avortements', dossier.nombreAvortements],
                ['DDR', dossier.derniersRegles ?? '—'],
                ['DPA', dossier.dateProbableAccouchement ?? '—'],
                ['Âge gest.', dossier.ageGestionnelOuverture ? `${dossier.ageGestionnelOuverture} SA` : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-on-surface-variant">{k}</dt>
                  <dd className="font-medium text-on-surface">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Bilan bio */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Bilan initial</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Groupe / Rhésus</span>
                <span className="font-medium">{dossier.groupeSanguin ? `${dossier.groupeSanguin} ${dossier.rhesus}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">VIH</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeVih(dossier.vihStatut)}`}>{dossier.vihStatut}</span>
              </div>
              {dossier.allergies && (
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Allergies</span>
                  <span className="font-medium">{dossier.allergies}</span>
                </div>
              )}
            </div>
          </div>

          {/* Antécédents */}
          {[
            ['Médicaux', dossier.antecedentsMedicaux],
            ['Chirurgicaux', dossier.antecedentsChirurgicaux],
            ['Gynécologiques', dossier.antecedentsGynecologiques],
            ['Obstétricaux', dossier.antecedentsObstetricaux],
          ].some(([, v]) => v) && (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Antécédents</h3>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  ['Médicaux', dossier.antecedentsMedicaux],
                  ['Chirurgicaux', dossier.antecedentsChirurgicaux],
                  ['Gynécologiques', dossier.antecedentsGynecologiques],
                  ['Obstétricaux', dossier.antecedentsObstetricaux],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs font-semibold text-on-surface-variant">{k}</p>
                    <p className="mt-0.5 text-on-surface">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prochain RDV */}
          {dernierContact?.prochainRdvDate && (
            <div className="rounded-2xl border border-primary/30 bg-primary-container/30 p-5">
              <h3 className="mb-2 text-sm font-semibold text-on-surface">Prochain rendez-vous</h3>
              <p className="text-base font-bold text-primary">{dernierContact.prochainRdvDate}</p>
              {dernierContact.prochainRdvNotes && <p className="mt-1 text-sm text-on-surface-variant">{dernierContact.prochainRdvNotes}</p>}
            </div>
          )}
        </div>

        {/* Colonne droite : contacts + examens */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Contacts */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">
                Contacts ({dossier.contacts?.length ?? 0})
              </h3>
              {dossier.statut === 'OUVERT' && (
                <button onClick={() => navigate(`/cpn/${dossierId}/contacts/nouveau`)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  <span className="material-symbols-outlined text-base">add</span>
                  Nouveau
                </button>
              )}
            </div>

            {(!dossier.contacts || dossier.contacts.length === 0) ? (
              <p className="text-sm text-on-surface-variant">Aucun contact enregistré.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {dossier.contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/cpn/${dossierId}/contacts/${c.id}`)}
                    className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface p-4 text-left hover:bg-surface-container"
                  >
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Contact {c.numeroContact} — {c.dateContact}</p>
                      <p className="text-xs text-on-surface-variant">
                        {c.ageGestationnel ? `${c.ageGestationnel} SA · ` : ''}
                        {c.poids ? `${c.poids} kg · ` : ''}
                        {c.tensionSystolique ? `TA: ${c.tensionSystolique}/${c.tensionDiastolique} mmHg` : ''}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Examens */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">
                Examens ({dossier.examens?.length ?? 0})
              </h3>
              <button onClick={() => setAfficherFormExamen(true)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <span className="material-symbols-outlined text-base">add</span>
                Demander
              </button>
            </div>

            {(!dossier.examens || dossier.examens.length === 0) ? (
              <p className="text-sm text-on-surface-variant">Aucun examen demandé.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {dossier.examens.map((ex) => (
                  <ExamenItem key={ex.id} examen={ex} dossierId={dossierId} onResultatEnregistre={chargerDossier} />
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {dossier.notes && (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Notes</h3>
              <p className="text-sm text-on-surface">{dossier.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageDetailDossierCpn
