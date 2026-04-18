// Page affichant les informations d'accouchement et du nouveau-né d'un dossier CPS en lecture seule.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'

function formaterDate(dateIso) {
  if (!dateIso) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateIso))
  } catch { return dateIso }
}

const LABELS_MODE = {
  NATUREL: 'Naturel',
  CESARIENNE: 'Césarienne',
  INSTRUMENTAL: 'Instrumental',
  SIEGE: 'Siège',
  AUTRE: 'Autre',
}

const LABELS_ETAT_NN = {
  VIVANT: 'Vivant',
  MORT_NE: 'Mort-né',
  DECES_PRECOCE: 'Décès précoce',
}

/* ── Champ lecture seule ── */
function Champ({ label, valeur }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className="rounded-lg bg-surface-container px-3 py-3 text-sm font-semibold text-on-surface">
        {valeur || <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

function PageInfoAccouchementCps() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromHistorique = location.state?.fromHistorique ?? false

  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    serviceCpsFemme.obtenirDossier(dossierId)
      .then((d) => { if (actif) { setDossier(d); setChargement(false) } })
      .catch((ex) => { if (actif) { setErreur(ex.message); setChargement(false) } })
    return () => { actif = false }
  }, [dossierId])

  if (chargement) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">refresh</span>
        Chargement…
      </div>
    )
  }

  if (erreur || !dossier) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-error-container px-5 py-4 text-sm text-on-error-container">{erreur || 'Dossier introuvable.'}</div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span> Retour
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8 pb-16">

      {/* En-tête */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => navigate(-1)}
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Informations accouchement</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {dossier.numeroDossierCps} · {dossier.patiente?.nom ?? '—'}
            {fromHistorique && (
              <span className="ml-2 rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">Lecture seule</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Type & dates ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>child_friendly</span>
          Contexte de l'accouchement
        </h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Champ label="Type" valeur={dossier.typeAccouchementEntree === 'INTERNE' ? 'Interne (dans la structure)' : 'Externe (ailleurs)'} />
          <Champ label="Mode" valeur={LABELS_MODE[dossier.modeAccouchement] ?? dossier.modeAccouchement} />
          <Champ label="Date accouchement" valeur={formaterDate(dossier.dateAccouchement)} />
          <Champ label="Ouverture CPS" valeur={formaterDate(dossier.dateOuverture)} />
          <Champ label="État mère à l'entrée" valeur={dossier.etatMereEntree === 'STABLE' ? 'Stable' : dossier.etatMereEntree === 'COMPLICATION' ? 'Complication' : dossier.etatMereEntree} />
        </div>

        {dossier.complicationsAccouchement && (
          <div className="rounded-xl bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
            <span className="font-semibold">Complications : </span>{dossier.complicationsAccouchement}
          </div>
        )}
      </div>

      {/* ── Nouveau-né ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>baby_changing_station</span>
          Nouveau-né
        </h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Champ label="État" valeur={LABELS_ETAT_NN[dossier.etatNouveauNe] ?? dossier.etatNouveauNe} />
          <Champ label="Nombre" valeur={dossier.nombreNouveauxNes?.toString()} />
          <Champ label="Sexe" valeur={
            dossier.sexeNouveauNe === 'MASCULIN' ? 'Masculin'
            : dossier.sexeNouveauNe === 'FEMININ' ? 'Féminin'
            : dossier.sexeNouveauNe === 'INDETERMINE' ? 'Indéterminé'
            : null
          } />
          <Champ label="Poids naissance" valeur={dossier.poidsNaissanceG ? `${dossier.poidsNaissanceG} g` : null} />
          <Champ label="Apgar 1 min" valeur={dossier.scoreApgar1min?.toString()} />
          <Champ label="Apgar 5 min" valeur={dossier.scoreApgar5min?.toString()} />
        </div>
      </div>

      {/* ── Données maternelles ── */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          Données maternelles
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Champ label="Gestité" valeur={dossier.gestite?.toString()} />
          <Champ label="Parité" valeur={dossier.parite?.toString()} />
          <Champ label="Groupe sanguin" valeur={dossier.groupeSanguin ? `${dossier.groupeSanguin} ${dossier.rhesus ?? ''}`.trim() : null} />
          <Champ label="Statut VIH" valeur={dossier.vihStatut} />
        </div>
        {dossier.notes && (
          <div className="rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface">
            <span className="font-semibold text-on-surface-variant">Notes : </span>{dossier.notes}
          </div>
        )}
      </div>

      {/* ── Dossier CPN associé ── */}
      {dossier.dossierCpnAssocie && (
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>pregnant_woman</span>
              Dossier CPN associé
            </h3>
            <button
              onClick={() => navigate(`/cpn/${dossier.dossierCpnAssocie.id}`, { state: { fromHistorique: true } })}
              className="flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
            >
              Voir le dossier CPN
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Champ label="N° CPN" valeur={dossier.dossierCpnAssocie.numeroDossierCpn} />
            <Champ label="DPA" valeur={formaterDate(dossier.dossierCpnAssocie.dateProbableAccouchement)} />
            <Champ label="Gestité / Parité" valeur={`G${dossier.dossierCpnAssocie.gestite ?? '?'} / P${dossier.dossierCpnAssocie.parite ?? '?'}`} />
            <Champ label="Contacts CPN" valeur={`${dossier.dossierCpnAssocie.contacts?.length ?? 0} contact(s)`} />
          </div>
        </div>
      )}

      {/* Action modification (si pas historique et dossier ouvert) */}
      {!fromHistorique && dossier.statut === 'OUVERT' && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/cps-femme/${dossierId}/modifier`)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Modifier le dossier
          </button>
        </div>
      )}
    </div>
  )
}

export default PageInfoAccouchementCps
