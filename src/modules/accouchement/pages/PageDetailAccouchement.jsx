// Ce composant affiche le detail et le resume d un accouchement avec les liens vers CPS femme et dossier enfant.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceAccouchement from '../../../services/api/serviceAccouchement'

const LABELS_TYPE = { INTERNE: 'Interne', EXTERNE: 'Externe' }
const LABELS_ETAT_MERE = { STABLE: 'Stable', COMPLICATION: 'Complication', DECES: 'Décès' }
const LABELS_ETAT_NN = { VIVANT: 'Vivant', MORT_NE: 'Mort-né', DECES_PRECOCE: 'Décès précoce' }
const LABELS_MODE = {
  NATUREL: 'Naturel',
  CESARIENNE: 'Césarienne',
  INSTRUMENTAL: 'Instrumental',
  SIEGE: 'Siège',
  AUTRE: 'Autre',
}

function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function LigneInfo({ label, valeur }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div className="mt-1 text-sm font-medium text-on-surface">{valeur || '—'}</div>
    </div>
  )
}

export default function PageDetailAccouchement() {
  const { accouchementId } = useParams()
  const navigate = useNavigate()
  const [accouchement, setAccouchement] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    charger()
  }, [accouchementId])

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const detail = await serviceAccouchement.obtenirAccouchement(accouchementId)
      setAccouchement(detail)
    } catch (e) {
      setErreur(e.message || 'Impossible de charger cet accouchement.')
    } finally {
      setChargement(false)
    }
  }

  function imprimer() {
    window.print()
  }

  if (chargement) {
    return (
      <div className="flex h-48 items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
        Chargement…
      </div>
    )
  }

  if (erreur || !accouchement) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-8">
        <button
          onClick={() => navigate('/accouchements')}
          className="mb-4 flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour à la liste
        </button>
        <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
          <span className="material-symbols-outlined">error</span>
          {erreur || 'Accouchement introuvable.'}
        </div>
      </div>
    )
  }

  const patiente = accouchement.patiente ?? {}

  return (
    <>
      {/* Styles d impression */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #zone-impression, #zone-impression * { visibility: visible !important; }
          #zone-impression { position: fixed; inset: 0; padding: 24px; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">

        {/* En-tête */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end no-print">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
              <button onClick={() => navigate('/accouchements')} className="hover:text-primary transition-colors">
                Accouchements
              </button>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="font-medium text-primary font-mono">{accouchement.numeroAccouchement}</span>
            </nav>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">
              {patiente.nom || 'Patiente inconnue'}
            </h2>
            <p className="mt-1 text-on-surface-variant">
              {patiente.numeroDossier ? <span className="font-mono">{patiente.numeroDossier}</span> : null}
              {patiente.numeroDossier && accouchement.numeroAccouchement ? ' · ' : null}
              Accouchement <span className="font-mono">{accouchement.numeroAccouchement}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 self-start">
            <button
              type="button"
              onClick={imprimer}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 px-5 py-2 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Imprimer
            </button>
            <span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
              accouchement.typeAccouchement === 'INTERNE'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-highest text-on-surface'
            }`}>
              {LABELS_TYPE[accouchement.typeAccouchement] ?? accouchement.typeAccouchement}
            </span>
          </div>
        </div>

        {/* Zone imprimable */}
        <div id="zone-impression" className="space-y-6">

          {/* En-tête impression uniquement */}
          <div className="hidden print:block border-b border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold">Centre de Santé Afia Himbi</h1>
            <p className="text-sm text-gray-500">
              Fiche d&apos;accouchement — Imprimée le {new Date().toLocaleDateString('fr-FR')}
            </p>
            <div className="mt-2 flex gap-6 flex-wrap">
              <div><span className="font-semibold">Patiente :</span> {patiente.nom}</div>
              {patiente.numeroDossier && (
                <div>
                  <span className="font-semibold">Dossier :</span>{' '}
                  <span className="font-mono">{patiente.numeroDossier}</span>
                </div>
              )}
              <div>
                <span className="font-semibold">N° accouchement :</span>{' '}
                <span className="font-mono">{accouchement.numeroAccouchement}</span>
              </div>
            </div>
          </div>

          {/* Résumé de l'événement */}
          <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary no-print">summarize</span>
              <h3 className="text-lg font-bold tracking-tight text-on-surface">Résumé de l&apos;événement</h3>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <LigneInfo label="Date et heure" valeur={formatDate(accouchement.dateAccouchement)} />
              <LigneInfo
                label="Mode d'accouchement"
                valeur={LABELS_MODE[accouchement.modeAccouchement] ?? accouchement.modeAccouchement}
              />
              <LigneInfo
                label="Âge gestationnel"
                valeur={accouchement.ageGestationnel ? `${accouchement.ageGestationnel} semaines` : null}
              />
              <LigneInfo
                label="Type"
                valeur={LABELS_TYPE[accouchement.typeAccouchement] ?? accouchement.typeAccouchement}
              />
              <LigneInfo
                label="Dossier CPN lié"
                valeur={accouchement.dossierCpnId ? accouchement.dossierCpnId : 'Aucun'}
              />
              <LigneInfo label="Statut" valeur={accouchement.statut ?? 'En cours'} />
            </div>
          </section>

          {/* État de la mère */}
          <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary no-print">favorite</span>
              <h3 className="text-lg font-bold tracking-tight text-on-surface">État de la mère</h3>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <LigneInfo
                label="État général"
                valeur={LABELS_ETAT_MERE[accouchement.etatMere] ?? accouchement.etatMere}
              />
              <LigneInfo
                label="Perte sanguine"
                valeur={accouchement.perteSanguineMl ? `${accouchement.perteSanguineMl} ml` : null}
              />
              <div className="sm:col-span-2">
                <LigneInfo
                  label="Complications"
                  valeur={accouchement.complicationsMere || 'Aucune complication renseignée'}
                />
              </div>
            </div>
          </section>

          {/* État du nouveau-né */}
          <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary no-print">child_care</span>
              <h3 className="text-lg font-bold tracking-tight text-on-surface">État du nouveau-né</h3>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <LigneInfo
                label="État"
                valeur={LABELS_ETAT_NN[accouchement.etatNouveauNe] ?? accouchement.etatNouveauNe}
              />
              <LigneInfo
                label="Nombre de nouveau-nés"
                valeur={String(accouchement.nombreNouveauxNes || '1')}
              />
              <LigneInfo label="Sexe" valeur={accouchement.sexeNouveauNe || null} />
              <LigneInfo
                label="Poids de naissance"
                valeur={accouchement.poidsNaissanceG ? `${accouchement.poidsNaissanceG} g` : null}
              />
              <LigneInfo
                label="APGAR à 1 min"
                valeur={accouchement.scoreApgar1min != null ? String(accouchement.scoreApgar1min) : null}
              />
              <LigneInfo
                label="APGAR à 5 min"
                valeur={accouchement.scoreApgar5min != null ? String(accouchement.scoreApgar5min) : null}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <LigneInfo
                  label="Anomalies congénitales"
                  valeur={accouchement.anomaliesCongenitales || 'Aucune anomalie renseignée'}
                />
              </div>
            </div>
          </section>

          {/* Notes complémentaires */}
          {accouchement.notes && (
            <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary no-print">notes</span>
                <h3 className="text-lg font-bold tracking-tight text-on-surface">Notes complémentaires</h3>
              </div>
              <p className="whitespace-pre-line text-sm text-on-surface">{accouchement.notes}</p>
            </section>
          )}

          {/* Signature — impression uniquement */}
          <div className="hidden print:grid grid-cols-2 gap-16 mt-10 pt-6 border-t border-gray-300">
            <div>
              <p className="text-sm font-semibold">Signature de l&apos;accoucheur(se)</p>
              <div className="mt-10 border-b border-gray-400 w-48" />
            </div>
            <div>
              <p className="text-sm font-semibold">Cachet du service</p>
              <div className="mt-10 border-b border-gray-400 w-48" />
            </div>
          </div>

        </div>

        {/* Continuité du parcours — hors impression */}
        <section className="rounded-xl border-l-4 border-primary/40 bg-primary-container/30 p-8 shadow-sm no-print">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">route</span>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Continuité du parcours</h3>
          </div>

          {accouchement.typeAccouchement === 'INTERNE' ? (
            <>
              <p className="mb-5 text-sm text-on-surface-variant">
                Cet accouchement a eu lieu ici. Ouvrez la CPS femme et créez le dossier du nouveau-né directement.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  onClick={() =>
                    navigate('/cps-femme/nouveau', {
                      state: {
                        patientePreselectionnee: {
                          id: patiente.id,
                          nom: patiente.nom,
                          numeroDossier: patiente.numeroDossier,
                          dateNaissance: patiente.dateNaissance,
                          telephone: patiente.telephone,
                        },
                        accouchementId: accouchement.id,
                      },
                    })
                  }
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  Ouvrir la CPS femme
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
                  onClick={() =>
                    navigate('/enfants/nouveau', {
                      state: {
                        mereId: patiente.id,
                        mereNom: patiente.nom,
                        accouchementId: accouchement.id,
                      },
                    })
                  }
                >
                  <span className="material-symbols-outlined text-base">child_care</span>
                  Créer le dossier enfant
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-5 text-sm text-on-surface-variant">
                Cet accouchement a eu lieu à l'extérieur. La CPS femme et la CPS enfant seront créées manuellement lors de la consultation.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 px-6 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface"
                  onClick={() => navigate('/cps-femme')}
                >
                  <span className="material-symbols-outlined text-base">list_alt</span>
                  Aller à la CPS femme
                </button>
              </div>
            </>
          )}
        </section>

      </div>
    </>
  )
}
