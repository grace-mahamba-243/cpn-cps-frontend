import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersMeres from '../../services/api/serviceDossiersMeres'
import serviceRendezVous from '../../services/api/serviceRendezVous'
import serviceCpn from '../../services/api/serviceCpn'

function formaterDate(dateIso) {
  if (!dateIso) {
    return 'Non renseigné'
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

function ChampLecture({ label, valeur, principal }) {
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className={`rounded-lg px-3 py-3 text-sm font-semibold bg-surface-container ${principal ? 'text-primary' : 'text-on-surface'}`}>
        {valeur || <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

// Ce composant affiche uniquement le dossier administratif d'une mère pour la réception.
// Aucune donnée clinique d'autres services n'est montrée dans cette page.
function PageDetailDossierMere() {
  const navigate = useNavigate()
  const { mereId } = useParams()
  const [etat, setEtat] = useState({
    chargement: true,
    dossier: null,
  })
  const [historiqueRdv, setHistoriqueRdv] = useState([])
  const [dossierCpnActif, setDossierCpnActif] = useState(undefined) // undefined = chargement, null = aucun
  const [historiqueGrossesses, setHistoriqueGrossesses] = useState([])

  useEffect(() => {
    let estActif = true

    const chargerDossier = async () => {
      const dossier = await serviceDossiersMeres.recupererParId(mereId)

      if (!estActif) {
        return
      }

      setEtat({
        chargement: false,
        dossier,
      })

      if (dossier?.numeroDossier) {
        serviceRendezVous.recupererHistoriqueParDossier(dossier.numeroDossier)
          .then(setHistoriqueRdv)
          .catch(() => {})
      }

      // Charger les dossiers CPN liés à cette patiente
      serviceCpn.listerDossiersParPatiente(mereId).then((dossiers) => {
        const actif = dossiers.find((d) => d.statut === 'OUVERT') ?? null
        const clos = dossiers.filter((d) => d.statut === 'CLOS').sort((a, b) => new Date(b.dateCloture) - new Date(a.dateCloture))
        setDossierCpnActif(actif)
        setHistoriqueGrossesses(clos)
      }).catch(() => {
        setDossierCpnActif(null)
      })
    }

    void chargerDossier()

    return () => {
      estActif = false
    }
  }, [mereId])

  if (etat.chargement) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier administratif...</p>
        </div>
      </div>
    )
  }

  if (!etat.dossier) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-8 pb-16 pt-24">
        <Alerte type="erreur" titre="Dossier introuvable">
          Le dossier demandé est introuvable ou n est plus disponible.
        </Alerte>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-bold text-on-surface"
          onClick={() => navigate('/patients')}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour à la liste
        </button>
      </div>
    )
  }

  const dossier = etat.dossier
  const nomComplet = [dossier.nom, dossier.postnom, dossier.prenom].filter(Boolean).join(' ')

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface"
            onClick={() => navigate('/patients')}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour à la liste
          </button>

          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Dossier administratif mère</h1>
          <p className="mt-2 text-on-surface-variant">{nomComplet}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-outline-variant/40 bg-white px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
            onClick={() => navigate(`/patients/${dossier.id}/modifier`)}
          >
            Modifier
          </button>

          <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
            <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">Numéro dossier</p>
            <p className="mt-1 text-lg font-black">{dossier.numeroDossier}</p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">person</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Identité</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom" valeur={dossier.nom} />
          <ChampLecture label="Postnom" valeur={dossier.postnom} />
          <ChampLecture label="Prénom" valeur={dossier.prenom} />
          <ChampLecture label="Date de naissance" valeur={formaterDate(dossier.dateNaissance)} />
          <ChampLecture label="Âge" valeur={dossier.age ? `${dossier.age} ans` : ''} />
          <ChampLecture label="État matrimonial" valeur={dossier.etatMatrimonial} />
        </div>
      </section>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">location_on</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Coordonnées</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ChampLecture label="Téléphone" valeur={dossier.telephone} />
          <ChampLecture label="Date d'enregistrement" valeur={formaterDate(dossier.dateEnregistrement)} />
        </div>
        <hr className="my-6 border-surface-container-high" />
        <ChampLecture label="Adresse complète" valeur={dossier.adresse} />
      </section>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">group</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Partenaire</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom du partenaire" valeur={dossier.nomPartenaire} />
          <ChampLecture label="Occupation femme" valeur={dossier.occupationFemme} />
          <ChampLecture label="Occupation homme" valeur={dossier.occupationHomme} />
        </div>
      </section>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">emergency</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Contact d'urgence</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ChampLecture label="Personne à contacter" valeur={dossier.personneUrgence} />
          <ChampLecture label="Téléphone du contact" valeur={dossier.telephoneUrgence} />
        </div>
        <hr className="my-6 border-surface-container-high" />
        <ChampLecture label="Adresse du contact" valeur={dossier.adresseUrgence} />
      </section>

      {/* ── Section CPN ── */}
      <section className="rounded-xl border-l-4 border-primary/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">pregnant_woman</span>
            <h4 className="text-lg font-bold tracking-tight text-on-surface">Consultation Prénatale (CPN)</h4>
          </div>
          {dossierCpnActif && (
            <span className="rounded-full bg-tertiary-container px-3 py-1 text-xs font-bold text-on-tertiary-container">
              En cours · {dossierCpnActif.numeroDossierCpn}
            </span>
          )}
        </div>

        {dossierCpnActif === undefined ? (
          <p className="text-sm text-on-surface-variant italic">Chargement...</p>

        ) : dossierCpnActif ? (
          /* ── Dossier actif : 3 cartes raccourcis ── */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Dossier d'ouverture */}
            <button
              onClick={() => navigate(`/cpn/${dossierCpnActif.id}/dossier-ouverture`)}
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface px-5 py-4 text-left transition-colors hover:bg-primary/5 hover:border-primary/30"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-container/30 text-primary">
                <span className="material-symbols-outlined text-xl">folder_open</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-on-surface text-sm">Dossier d'ouverture</p>
                <p className="text-xs text-on-surface-variant">Informations initiales</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-on-surface-variant/40 text-lg">chevron_right</span>
            </button>

            {/* Contacts CPN */}
            <button
              onClick={() => navigate(`/cpn/${dossierCpnActif.id}/contacts`)}
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface px-5 py-4 text-left transition-colors hover:bg-tertiary/5 hover:border-tertiary/30"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-tertiary-container/30 text-tertiary">
                <span className="material-symbols-outlined text-xl">calendar_month</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-on-surface text-sm">Contacts CPN</p>
                <p className="text-xs text-on-surface-variant">
                  {dossierCpnActif.nombreContacts
                    ? `${dossierCpnActif.nombreContacts} contact${dossierCpnActif.nombreContacts > 1 ? 's' : ''}`
                    : 'Aucun contact'}
                </p>
              </div>
              <span className="material-symbols-outlined ml-auto text-on-surface-variant/40 text-lg">chevron_right</span>
            </button>

            {/* Examens */}
            <button
              onClick={() => navigate(`/cpn/${dossierCpnActif.id}/examens`)}
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface px-5 py-4 text-left transition-colors hover:bg-surface-container hover:border-outline-variant/60"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined text-xl">biotech</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-on-surface text-sm">Examens</p>
                <p className="text-xs text-on-surface-variant">Biologiques & Échographies</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-on-surface-variant/40 text-lg">chevron_right</span>
            </button>
          </div>

        ) : (
          /* ── Aucun dossier actif : historique + nouveau ── */
          <div className="space-y-4">
            {/* Bouton nouveau dossier : uniquement si aucun dossier OUVERT n'existe */}
            <button
              onClick={() => navigate('/cpn/nouveau', { state: { patientePreselectionnee: { id: dossier.id, nomComplet: nomComplet, numeroDossier: dossier.numeroDossier } } })}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Nouveau dossier CPN
            </button>

            {/* Historique grossesses */}
            {historiqueGrossesses.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 pb-2">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">history</span>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Historique des grossesses ({historiqueGrossesses.length})
                  </p>
                </div>
                {historiqueGrossesses.map((dos, index) => (
                  <button
                    key={dos.id}
                    onClick={() => navigate(`/cpn/${dos.id}`, { state: { fromHistorique: true } })}
                    className="flex w-full items-center gap-4 rounded-xl bg-surface-container/50 px-5 py-3.5 text-left transition-colors hover:bg-surface-container"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-outline-variant/20 text-xs font-black text-on-surface-variant">
                      G{historiqueGrossesses.length - index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{dos.numeroDossierCpn}</p>
                      <p className="text-xs text-on-surface-variant">
                        Ouvert le {formaterDate(dos.creeLe ?? dos.dateOuverture)}
                        {dos.dateCloture ? ` · Clos le ${formaterDate(dos.dateCloture)}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">Clos</span>
                    <span className="material-symbols-outlined text-on-surface-variant/50 text-lg">chevron_right</span>
                  </button>
                ))}
              </div>
            )}

            {historiqueGrossesses.length === 0 && (
              <p className="text-sm text-on-surface-variant">Aucun dossier CPN pour cette patiente.</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">calendar_month</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Historique des rendez-vous</h4>
        </div>
        {historiqueRdv.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Aucun rendez-vous enregistré pour ce dossier.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 text-left">
                  <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                  <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Heure</th>
                  <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Service</th>
                  <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Statut</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {historiqueRdv.map((rdv) => (
                  <tr
                    key={rdv.id}
                    className="cursor-pointer transition-colors hover:bg-surface-container-low/30"
                    onClick={() => navigate(`/rendez-vous/${rdv.id}`)}
                  >
                    <td className="py-3 pr-6 text-on-surface-variant">{rdv.date ? new Intl.DateTimeFormat('fr-FR').format(new Date(rdv.date)) : '—'}</td>
                    <td className="py-3 pr-6 font-bold text-primary">{rdv.heure ?? '—'}</td>
                    <td className="py-3 pr-6 text-on-surface-variant">{rdv.service ?? '—'}</td>
                    <td className="py-3 pr-6">
                      <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface">{rdv.statut ?? '—'}</span>
                    </td>
                    <td className="py-3 text-on-surface-variant">{rdv.motif ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default PageDetailDossierMere