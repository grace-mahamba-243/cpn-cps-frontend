// Ce composant affiche le detail en lecture seule d'un contact CPN (constantes, examen obstetrical, observations).
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

function InfoItem({ label, valeur }) {
  if (valeur === null || valeur === undefined || valeur === '') return null
  return (
    <div>
      <dt className="text-xs text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 font-medium text-on-surface">{valeur}</dd>
    </div>
  )
}

function BoolLabel(val) {
  if (val === true) return 'Oui'
  if (val === false) return 'Non'
  return '—'
}

function badgeStatutExamen(statut) {
  return statut === 'RESULTAT_RECU'
    ? 'bg-tertiary-container text-on-tertiary-container'
    : 'bg-secondary-container text-on-secondary-container'
}

function PageDetailContactCpn() {
  const { dossierId, contactId } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    setChargement(true)
    serviceCpn.obtenirContact(dossierId, contactId)
      .then(setContact)
      .catch((ex) => setErreur(ex.message))
      .finally(() => setChargement(false))
  }, [dossierId, contactId])

  if (chargement) return (
    <div className="flex items-center justify-center py-20 text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin">refresh</span>
      <span className="ml-2 text-sm">Chargement…</span>
    </div>
  )

  if (erreur) return (
    <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
  )

  if (!contact) return null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(`/cpn/${dossierId}`)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier
        </button>
        <div>
          <h2 className="text-xl font-bold text-on-surface">Contact {contact.numeroContact}</h2>
          <p className="text-sm text-on-surface-variant">{contact.dateContact}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Constantes vitales */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-secondary">monitor_heart</span>
            Constantes vitales
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoItem label="Âge gestationnel" valeur={contact.ageGestationnel != null ? `${contact.ageGestationnel} SA` : null} />
            <InfoItem label="Poids" valeur={contact.poids != null ? `${contact.poids} kg` : null} />
            <InfoItem label="TA Systolique" valeur={contact.tensionSystolique != null ? `${contact.tensionSystolique} mmHg` : null} />
            <InfoItem label="TA Diastolique" valeur={contact.tensionDiastolique != null ? `${contact.tensionDiastolique} mmHg` : null} />
            <InfoItem label="Température" valeur={contact.temperature != null ? `${contact.temperature} °C` : null} />
            <InfoItem label="Hauteur utérine" valeur={contact.hauteurUterine != null ? `${contact.hauteurUterine} cm` : null} />
            <InfoItem label="FC mère" valeur={contact.frequenceCardiaqueMore != null ? `${contact.frequenceCardiaqueMore} bpm` : null} />
            <InfoItem label="BFC fœtal" valeur={contact.bfc != null ? `${contact.bfc} bpm` : null} />
          </dl>
        </div>

        {/* Examen obstétrical */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <span className="material-symbols-outlined text-tertiary">pregnant_woman</span>
            Examen obstétrical
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoItem label="Présentation fœtale" valeur={contact.presentationFoetale} />
            <InfoItem label="Mouvements actifs" valeur={contact.mouvementsActifs != null ? BoolLabel(contact.mouvementsActifs) : null} />
            <InfoItem label="Œdèmes" valeur={contact.oedemes != null ? BoolLabel(contact.oedemes) : null} />
            <InfoItem label="Varices" valeur={contact.varices != null ? BoolLabel(contact.varices) : null} />
          </dl>
        </div>

        {/* Observations */}
        {(contact.observations || contact.traitementPrescrit) && (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 md:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="material-symbols-outlined text-on-surface-variant">notes</span>
              Observations & Traitement
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {contact.observations && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-on-surface-variant">Observations</p>
                  <p className="text-sm text-on-surface">{contact.observations}</p>
                </div>
              )}
              {contact.traitementPrescrit && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-on-surface-variant">Traitement prescrit</p>
                  <p className="text-sm text-on-surface">{contact.traitementPrescrit}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prochain RDV */}
        {contact.prochainRdvDate && (
          <div className="rounded-2xl border border-primary/30 bg-primary-container/30 p-5">
            <h3 className="mb-2 text-sm font-semibold text-on-surface">Prochain rendez-vous</h3>
            <p className="text-base font-bold text-primary">{contact.prochainRdvDate}</p>
            {contact.prochainRdvNotes && <p className="mt-1 text-sm text-on-surface-variant">{contact.prochainRdvNotes}</p>}
          </div>
        )}

        {/* Examens liés à ce contact */}
        {contact.examens && contact.examens.length > 0 && (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 md:col-span-2">
            <h3 className="mb-4 text-base font-semibold text-on-surface">Examens demandés lors de ce contact</h3>
            <div className="flex flex-col gap-3">
              {contact.examens.map((ex) => (
                <div key={ex.id} className="rounded-xl border border-outline-variant bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{ex.libelle}</p>
                      <p className="text-xs text-on-surface-variant">{ex.typeExamen} · {ex.source}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStatutExamen(ex.statut)}`}>
                      {ex.statut === 'RESULTAT_RECU' ? 'Résultat reçu' : 'En attente'}
                    </span>
                  </div>
                  {ex.resultat && (
                    <div className="mt-3 rounded-lg bg-surface-container px-3 py-2">
                      <p className="text-xs text-on-surface-variant">Résultat :</p>
                      <p className="mt-0.5 text-sm text-on-surface">{ex.resultat}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageDetailContactCpn
