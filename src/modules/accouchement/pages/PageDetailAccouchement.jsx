// Ce composant affiche le detail et le resume d un accouchement avec les liens vers CPS femme et dossier enfant.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceAccouchement from '../../../services/api/serviceAccouchement'
import InfoEnregistrement from '../../../composants/partages/InfoEnregistrement'
import useAuthentification from '../../authentification/hooks/useAuthentification'
import { ConteneurImpression, EnTeteImpression, BandeauPatientImpression, PiedDePageImpression } from '../../../composants/partages/EnTeteImpression'

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

// Reconstruit la liste complète des nouveau-nés depuis les données de l'accouchement
function extraireNouveauxNes(acc) {
  const liste = [
    {
      sexeNouveauNe: acc.sexeNouveauNe,
      poidsNaissanceG: acc.poidsNaissanceG,
      scoreApgar1min: acc.scoreApgar1min,
      scoreApgar5min: acc.scoreApgar5min,
      etatNouveauNe: acc.etatNouveauNe,
      anomaliesCongenitales: acc.anomaliesCongenitales,
    },
  ]
  if (!acc.notes) return liste
  const marqueur = '=== DETAILS NOUVEAUX-NES ==='
  const idx = acc.notes.indexOf(marqueur)
  if (idx === -1) return liste
  const bloc = acc.notes.slice(idx + marqueur.length).trim()
  const blocs = bloc.split(/\n\n+/)
  for (const b of blocs) {
    const lignes = b.split('\n')
    const titre = lignes[0]?.trim()
    if (!titre?.startsWith('Nouveau-ne')) continue
    // Nouveau-ne 1 est déjà dans les champs d'entité — on le saute pour éviter le doublon
    if (titre === 'Nouveau-ne 1') continue
    const extraire = (prefixe) => {
      const l = lignes.find((x) => x.startsWith(prefixe))
      return l ? l.slice(prefixe.length).trim() : ''
    }
    liste.push({
      sexeNouveauNe: extraire('- Sexe: '),
      poidsNaissanceG: extraire('- Poids(g): '),
      scoreApgar1min: extraire('- APGAR 1 min: '),
      scoreApgar5min: extraire('- APGAR 5 min: '),
      etatNouveauNe: extraire('- Etat: '),
      anomaliesCongenitales: extraire('- Anomalies: '),
    })
  }
  return liste
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

function LigneInfo({ label, valeur, principal }) {
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className={`w-full rounded-lg px-3 py-3 text-sm font-semibold bg-surface-container ${principal ? 'text-primary' : 'text-on-surface'}`}>
        {valeur || <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

function ModalAccesRefuse({ onFermer, action }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onFermer}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-surface p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-on-error-container">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </span>
          <div>
            <h3 className="text-lg font-bold text-on-surface">Accès refusé</h3>
            <p className="text-sm text-on-surface-variant">Vous n&apos;avez pas la permission requise</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-on-surface-variant">
          Votre rôle ne permet pas d&apos;effectuer cette action :
          <span className="ml-1 font-semibold text-on-surface">{action}</span>.
          Contactez un administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </p>
        <button
          type="button"
          onClick={onFermer}
          className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:opacity-90"
        >
          Retour
        </button>
      </div>
    </div>
  )
}

export default function PageDetailAccouchement() {
  const { accouchementId } = useParams()
  const navigate = useNavigate()
  const { possedePermission } = useAuthentification()
  const [modalAccesRefuse, setModalAccesRefuse] = useState(null)
  const [accouchement, setAccouchement] = useState(null)
  const [statutCps, setStatutCps] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    charger()
  }, [accouchementId])

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const [detail, statut] = await Promise.all([
        serviceAccouchement.obtenirAccouchement(accouchementId),
        serviceAccouchement.obtenirStatutCps(accouchementId).catch(() => null),
      ])
      setAccouchement(detail)
      setStatutCps(statut)
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
      {/* Styles d'impression */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="screen-only mx-auto max-w-5xl space-y-6 px-8 py-8">

        {/* En-tête */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end no-print">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
              
            </nav>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">
              {patiente.nom || 'Patiente inconnue'}
            </h2>
            <p className="mt-1 text-on-surface-variant">
             
              Accouchement <span className="font-mono">{accouchement.numeroAccouchement}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 self-start">
            {possedePermission('accouchement.gerer') && (
              <button
                type="button"
                onClick={() => navigate(`/accouchements/${accouchementId}/modifier`)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Modifier
              </button>
            )}
            <button
              type="button"
              onClick={imprimer}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 px-5 py-2 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Imprimer
            </button>
           
          </div>
        </div>

        {/* Zone imprimable */}
        <div id="zone-impression" className="space-y-6">

          {/* En-tête impression — supprimé, remplacé par section print-only en bas */}

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
                valeur={accouchement.numeroDossierCpn ?? (accouchement.dossierCpnId ? 'Lié' : 'Aucun')}
              />
           
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
              <h3 className="text-lg font-bold tracking-tight text-on-surface">
                État du nouveau-né
                <span className="ml-2 rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                  {accouchement.nombreNouveauxNes || 1} enfant{(accouchement.nombreNouveauxNes || 1) > 1 ? 's' : ''}
                </span>
              </h3>
            </div>
            <div className="space-y-4">
              {extraireNouveauxNes(accouchement).map((nn, index) => (
                <div key={`nn-ecran-${index}`} className="rounded-lg border border-outline-variant/40 bg-surface p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nouveau-né {index + 1}</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <LigneInfo label="État" valeur={LABELS_ETAT_NN[nn.etatNouveauNe] ?? nn.etatNouveauNe} />
                    <LigneInfo label="Sexe" valeur={nn.sexeNouveauNe || null} />
                    <LigneInfo label="Poids de naissance" valeur={nn.poidsNaissanceG ? `${nn.poidsNaissanceG} g` : null} />
                    <LigneInfo label="APGAR à 1 min" valeur={nn.scoreApgar1min != null && nn.scoreApgar1min !== '' ? String(nn.scoreApgar1min) : null} />
                    <LigneInfo label="APGAR à 5 min" valeur={nn.scoreApgar5min != null && nn.scoreApgar5min !== '' ? String(nn.scoreApgar5min) : null} />
                    <div className="sm:col-span-2 lg:col-span-1">
                      <LigneInfo label="Anomalies congénitales" valeur={nn.anomaliesCongenitales && nn.anomaliesCongenitales !== 'Aucune' ? nn.anomaliesCongenitales : 'Aucune anomalie renseignée'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes complémentaires — le bloc DETAILS NOUVEAUX-NES est exclu (déjà affiché ci-dessus) */}
          {(() => {
            const notesPures = accouchement.notes
              ? accouchement.notes.replace(/\n*=== DETAILS NOUVEAUX-NES ===[\s\S]*$/m, '').trim()
              : ''
            return notesPures ? (
              <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary no-print">notes</span>
                  <h3 className="text-lg font-bold tracking-tight text-on-surface">Notes complémentaires</h3>
                </div>
                <p className="whitespace-pre-line text-sm text-on-surface">{notesPures}</p>
              </section>
            ) : null
          })()}

          {/* Signature — supprimée, remplacée par la section print-only */}

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
                {/* CPS Femme : disabled si déjà ouverte pour cet accouchement */}
                {statutCps?.cpsFemmeOuvert ? (
                  <div className="flex items-center gap-2 rounded-full bg-surface-container px-6 py-2.5 text-sm font-semibold text-on-surface-variant cursor-not-allowed opacity-60">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    CPS femme ouverte ({statutCps.cpsFemmeNumero})
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    onClick={() => {
                      if (!possedePermission('cps_femme.gerer')) {
                        setModalAccesRefuse('Ouvrir la CPS femme')
                        return
                      }
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
                    }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    Ouvrir la CPS femme
                  </button>
                )}

                {/* CPS Enfant : disabled si nombre de CPS enfant >= nombre de nouveau-nés */}
                {statutCps?.cpsEnfantComplet ? (
                  <div className="flex items-center gap-2 rounded-full border border-outline-variant/50 px-6 py-2.5 text-sm font-semibold text-on-surface-variant cursor-not-allowed opacity-60">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Dossiers enfants complets ({statutCps.nombreCpsEnfantOuverts}/{statutCps.nombreNouveauxNes})
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
                    onClick={async () => {
                      if (!possedePermission('cps_enfant.gerer')) {
                        setModalAccesRefuse('Ouvrir CPS enfant')
                        return
                      }
                      let statutCpsActualise = statutCps
                      try {
                        statutCpsActualise = await serviceAccouchement.obtenirStatutCps(accouchement.id)
                        setStatutCps(statutCpsActualise)
                      } catch {
                        // Conserver le statut déjà chargé si le rafraîchissement échoue.
                      }
                      navigate('/enfants/nouveau', {
                        state: {
                          mereId: patiente.id,
                          mereNom: patiente.nom,
                          mereTelephone: patiente.telephone,
                          mereAdresse: patiente.adresse,
                          accouchementId: accouchement.id,
                          nombreCpsEnfantOuverts: statutCpsActualise?.nombreCpsEnfantOuverts ?? 0,
                          nouveauxNesVivants: extraireNouveauxNes(accouchement).filter((nn) => nn.etatNouveauNe === 'VIVANT'),
                        },
                      })
                    }}
                  >
                    <span className="material-symbols-outlined text-base">child_care</span>
                    Ouvrir CPS enfant
                    {statutCps && !statutCps.cpsEnfantComplet && statutCps.nombreCpsEnfantOuverts > 0
                      ? ` (${statutCps.nombreCpsEnfantOuverts}/${statutCps.nombreNouveauxNes})`
                      : null}
                  </button>
                )}
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

      <InfoEnregistrement enregistrePar={accouchement.enregistrePar} modifiePar={accouchement.modifiePar} />

      </div>

      {modalAccesRefuse && (
        <ModalAccesRefuse
          action={modalAccesRefuse}
          onFermer={() => setModalAccesRefuse(null)}
        />
      )}

      {/* ── Section impression ── */}
      <ConteneurImpression>
        <EnTeteImpression
          badge="Fiche d'Accouchement Officielle"
          reference={accouchement.numeroAccouchement}
          date={new Date().toLocaleDateString('fr-FR')}
        />
        <BandeauPatientImpression
          nom={patiente.nom}
          infos={[
            { label: 'N° Dossier', valeur: patiente.numeroDossier },
            { label: 'Date naissance', valeur: patiente.dateNaissance ? new Date(patiente.dateNaissance).toLocaleDateString('fr-FR') : '—' },
            { label: 'Téléphone', valeur: patiente.telephone },
            { label: 'Date accouchement', valeur: formatDate(accouchement.dateAccouchement) },
          ]}
        />

        {/* Résumé accouchement */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>Résumé de l&apos;accouchement</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Mode', valeur: LABELS_MODE[accouchement.modeAccouchement] ?? accouchement.modeAccouchement },
              { label: 'Type', valeur: LABELS_TYPE[accouchement.typeAccouchement] ?? accouchement.typeAccouchement },
              { label: 'Âge gestationnel', valeur: accouchement.ageGestationnel ? `${accouchement.ageGestationnel} SA` : '—' },
              { label: 'Dossier CPN lié', valeur: accouchement.numeroDossierCpn ?? (accouchement.dossierCpnId ? 'Lié' : 'Aucun') },
            ].map(c => (
              <div key={c.label}>
                <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>{c.label}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{c.valeur || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* État mère */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>État de la mère</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>État général</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{LABELS_ETAT_MERE[accouchement.etatMere] ?? accouchement.etatMere ?? '—'}</p>
            </div>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Perte sanguine</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{accouchement.perteSanguineMl ? `${accouchement.perteSanguineMl} ml` : '—'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Complications</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{accouchement.complicationsMere || 'Aucune'}</p>
            </div>
          </div>
        </div>

        {/* État nouveau-né — détail par enfant */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>
            État du nouveau-né ({accouchement.nombreNouveauxNes || 1} enfant{(accouchement.nombreNouveauxNes || 1) > 1 ? 's' : ''})
          </h3>
          {extraireNouveauxNes(accouchement).map((nn, index) => (
            <div key={`print-nn-${index}`} style={{ marginBottom: index < extraireNouveauxNes(accouchement).length - 1 ? '16px' : 0, padding: '10px', backgroundColor: '#f4f6f8', borderRadius: '6px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', margin: '0 0 8px 0' }}>
                Nouveau-né {index + 1}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'État', valeur: LABELS_ETAT_NN[nn.etatNouveauNe] ?? nn.etatNouveauNe },
                  { label: 'Sexe', valeur: nn.sexeNouveauNe },
                  { label: 'Poids naissance', valeur: nn.poidsNaissanceG ? `${nn.poidsNaissanceG} g` : '—' },
                  { label: 'APGAR 1 min', valeur: nn.scoreApgar1min != null && nn.scoreApgar1min !== '' ? String(nn.scoreApgar1min) : '—' },
                  { label: 'APGAR 5 min', valeur: nn.scoreApgar5min != null && nn.scoreApgar5min !== '' ? String(nn.scoreApgar5min) : '—' },
                  { label: 'Anomalies', valeur: nn.anomaliesCongenitales && nn.anomaliesCongenitales !== 'Aucune' ? nn.anomaliesCongenitales : 'Aucune' },
                ].map((c) => (
                  <div key={c.label}>
                    <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>{c.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{c.valeur || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <PiedDePageImpression service="Service Maternité — Accouchements" />
      </ConteneurImpression>
    </>
  )
}
