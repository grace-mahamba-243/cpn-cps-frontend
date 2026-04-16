import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersEnfants from '../../services/api/serviceDossiersEnfants'
import serviceRendezVous from '../../services/api/serviceRendezVous'

function formaterDate(dateIso) {
  if (!dateIso) {
    return 'Non renseignée'
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

// Ce composant affiche uniquement le dossier administratif d'un enfant pour la réception.
// Il exclut volontairement tout contenu clinique lié au suivi, à la nutrition ou à la vaccination.
function PageDetailDossierEnfant() {
  const navigate = useNavigate()
  const { enfantId } = useParams()
  const [etat, setEtat] = useState({
    chargement: true,
    dossier: null,
  })
  const [historiqueRdv, setHistoriqueRdv] = useState([])

  useEffect(() => {
    let estActif = true

    const chargerDossier = async () => {
      const dossier = await serviceDossiersEnfants.recupererParId(enfantId)

      if (!estActif) {
        return
      }

      setEtat({
        chargement: false,
        dossier,
      })

      if (dossier?.numeroFiche) {
        serviceRendezVous.recupererHistoriqueParDossier(dossier.numeroFiche)
          .then(setHistoriqueRdv)
          .catch(() => {})
      }
    }

    void chargerDossier()

    return () => {
      estActif = false
    }
  }, [enfantId])

  if (etat.chargement) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier administratif enfant...</p>
        </div>
      </div>
    )
  }

  if (!etat.dossier) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-8 pb-16 pt-24">
        <Alerte type="erreur" titre="Dossier introuvable">
          Le dossier administratif enfant demandé est introuvable ou n est plus disponible.
        </Alerte>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-bold text-on-surface"
          onClick={() => navigate('/enfants')}
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
            onClick={() => navigate('/enfants')}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour à la liste
          </button>

          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Dossier administratif enfant</h1>
          <p className="mt-2 text-on-surface-variant">{nomComplet}</p>
        </div>

        <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
          <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">Numéro fiche</p>
          <p className="mt-1 text-lg font-black">{dossier.numeroFiche}</p>
        </div>
      </div>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">child_care</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Identité</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom" valeur={dossier.nom} />
          <ChampLecture label="Postnom" valeur={dossier.postnom} />
          <ChampLecture label="Prénom" valeur={dossier.prenom} />
          <ChampLecture label="Sexe" valeur={dossier.sexe} />
          <ChampLecture label="Date de naissance" valeur={formaterDate(dossier.dateNaissance)} />
          <ChampLecture label="Date d'enregistrement" valeur={formaterDate(dossier.dateEnregistrement)} />
        </div>
      </section>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">group</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Responsables</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom de la mère" valeur={dossier.nomMere} />
          <ChampLecture label="Nom du père" valeur={dossier.nomPere} />
          <ChampLecture label="Téléphone" valeur={dossier.telephone} />
        </div>
      </section>

      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">location_on</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Coordonnées</h4>
        </div>
        <ChampLecture label="Adresse" valeur={dossier.adresse} />
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

export default PageDetailDossierEnfant