// Page affichant le dossier d'ouverture CPN en lecture seule, avec la même
// mise en page que le formulaire d'ouverture initial.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

const FACTEURS_RISQUE_OPTIONS = [
  { id: 'grande_multipare',      label: 'Grande multipare (≥ 5 accouchements)' },
  { id: 'antecedent_cesarienne', label: 'Antécédent de césarienne' },
  { id: 'grossesse_multiple',    label: 'Grossesse multiple' },
  { id: 'diabete',               label: 'Diabète' },
  { id: 'hypertension',          label: 'Hypertension artérielle' },
]

function calculerAgeAns(dateNaissance) {
  if (!dateNaissance) return null
  return Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function statutAgeMaternel(dateNaissance) {
  const age = calculerAgeAns(dateNaissance)
  if (age === null) return { id: 'inconnu', label: 'Âge non renseigné', couleur: 'bg-surface-container-high text-on-surface-variant', icone: 'help' }
  if (age < 18)    return { id: 'primipare_jeune', label: `Primipare jeune (${age} ans)`, couleur: 'bg-surface-container-highest text-on-surface', icone: 'warning' }
  if (age > 35)    return { id: 'age_maternel_risque', label: `Âge maternel à risque (${age} ans)`, couleur: 'bg-surface-container-highest text-on-surface', icone: 'warning' }
  return { id: 'normal', label: `Âge normal (${age} ans)`, couleur: 'bg-surface-container-high text-on-surface', icone: 'check_circle' }
}

function formaterDate(dateIso) {
  if (!dateIso) return '—'
  try { return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateIso)) }
  catch { return dateIso }
}

/* ── Champ lecture seule ── */
function ChampLecture({ label, valeur, principal }) {
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className={`rounded-lg px-3 py-3 text-sm font-semibold ${principal ? 'bg-surface-container text-primary' : 'bg-surface-container text-on-surface'}`}>
        {valeur || <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

/* ── Compteur G/P/A ── */
function CompteurGPA({ lettre, valeur, sousTitre }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-4">
      <span className="font-headline text-2xl font-black text-on-surface">{lettre}{valeur ?? 0}</span>
      <span className="mt-0.5 text-[10px] text-on-surface-variant">{sousTitre}</span>
    </div>
  )
}

/* ── Liste d'antécédents ── */
function BlockAntecedents({ label, icone, items }) {
  const liste = typeof items === 'string'
    ? items.split(',').map((s) => s.trim()).filter(Boolean)
    : (Array.isArray(items) ? items : [])

  return (
    <div className="rounded-xl bg-surface-container-low p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-primary">
          <span className="material-symbols-outlined text-lg">{icone}</span>
        </div>
        <h4 className="font-bold text-on-surface">{label}</h4>
        {liste.length > 0 && (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{liste.length}</span>
        )}
      </div>
      {liste.length === 0 ? (
        <p className="py-2 text-xs italic text-on-surface-variant">Aucun antécédent</p>
      ) : (
        <ul className="space-y-1.5">
          {liste.map((item, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-on-surface">
              <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[16px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Page principale ── */
function PageDossierOuvertureCpn() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [chargement, setChargement] = useState(true)
  const [dossier, setDossier] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    serviceCpn.obtenirDossier(dossierId)
      .then((data) => { if (actif) { setDossier(data); setChargement(false) } })
      .catch((ex) => { if (actif) { setErreur(ex.message); setChargement(false) } })
    return () => { actif = false }
  }, [dossierId])

  if (chargement) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier d'ouverture…</p>
        </div>
      </div>
    )
  }

  if (erreur || !dossier) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <p>{erreur || 'Dossier introuvable.'}</p>
        </div>
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-6 py-3 text-sm font-bold text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier CPN
        </button>
      </div>
    )
  }

  const facteursRisque = dossier.facteursRisque ?? []
  const ageGest = dossier.dernierAgeGestationnel ?? dossier.ageGestionnelOuverture

  const badgeVih = {
    POSITIF: 'bg-error-container/15 text-error',
    NEGATIF: 'bg-tertiary-container text-on-tertiary-container',
    INCONNU: 'bg-surface-variant text-on-surface-variant',
  }[dossier.vihStatut] ?? 'bg-surface-variant text-on-surface-variant'

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => navigate(-1)}
            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Dossier d'ouverture CPN</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              Fiche initiale · N° {dossier.numeroDossierCpn ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Imprimer
          </button>
          {!location.state?.fromHistorique && (
          <button
            type="button"
            onClick={() => navigate(`/cpn/nouveau`, { state: { modeEdition: true, dossierExistant: dossier } })}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Modifier
          </button>
          )}
        </div>
      </div>

      {/* ── Section 1 : Informations de base (8/12 + 4/12) ── */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-12">

        {/* Colonne gauche — données cliniques */}
        <div className="md:col-span-8 rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">pregnant_woman</span>
            <h4 className="text-lg font-bold tracking-tight text-on-surface">Informations de base</h4>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ChampLecture label="Date d'ouverture" valeur={formaterDate(dossier.dateOuverture)} />
            <ChampLecture label="DDR (Dernières règles)" valeur={formaterDate(dossier.derniersRegles)} />
            <ChampLecture label="DPA (Date prévue)" valeur={formaterDate(dossier.dateProbableAccouchement)} principal />
          </div>

          <hr className="my-6 border-surface-container-high" />

          {/* Mesures */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ChampLecture label="Taille (cm)" valeur={dossier.taille ? `${dossier.taille} cm` : null} />
            <ChampLecture label="Âge gestationnel (SA)" valeur={ageGest ? `${ageGest} SA` : null} />
            <ChampLecture label="Allergies connues" valeur={dossier.allergies} />
          </div>

          <hr className="my-6 border-surface-container-high" />

          {/* Bilan sanguin */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ChampLecture label="Groupe sanguin" valeur={dossier.groupeSanguin} />
            <ChampLecture label="Rhésus (Rh)" valeur={dossier.rhesus === '+' ? 'Positif (+)' : dossier.rhesus === '-' ? 'Négatif (−)' : null} />
            <div className="flex flex-col">
              <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Statut VIH</span>
              <div className="rounded-lg bg-surface-container px-3 py-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeVih}`}>{dossier.vihStatut ?? 'INCONNU'}</span>
              </div>
            </div>
          </div>

          <hr className="my-6 border-surface-container-high" />

          {/* G / P / A */}
          <div className="grid grid-cols-3 gap-3">
            <CompteurGPA lettre="G" valeur={dossier.gestite}           sousTitre="Gestité" />
            <CompteurGPA lettre="P" valeur={dossier.parite}            sousTitre="Parité" />
            <CompteurGPA lettre="A" valeur={dossier.nombreAvortements} sousTitre="Avortements" />
          </div>
        </div>

        {/* Colonne droite 4/12 — Facteurs de risque */}
        <div className="md:col-span-4 flex flex-col">
          <div className="bg-surface-container-low p-6 rounded-xl flex-1 border border-outline-variant/50">
            <h4 className="text-sm font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">priority_high</span>
              Facteurs de Risque
            </h4>

            {/* Badge âge maternel */}
            {(() => {
              const statut = statutAgeMaternel(dossier.patiente?.dateNaissance)
              return (
                <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 mb-5 ${statut.couleur}`}>
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>{statut.icone}</span>
                  <span className="text-xs font-semibold leading-tight">{statut.label}</span>
                  {statut.id !== 'inconnu' && statut.id !== 'normal' && (
                    <span className="material-symbols-outlined ml-auto flex-shrink-0" style={{ fontSize: '16px' }}>check</span>
                  )}
                </div>
              )
            })()}

            {/* Séparateur */}
            <hr className="border-outline-variant/40 mb-4" />

            <div className="space-y-4">
              {FACTEURS_RISQUE_OPTIONS.map(({ id, label }) => {
                const coche = facteursRisque.includes(id)
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                        coche
                          ? 'bg-primary border-outline-variant/50'
                          : 'bg-white border-outline-variant'
                      }`}
                    >
                      {coche && (
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>
                      )}
                    </div>
                    <span className="text-[13px] text-on-surface leading-snug">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2 : Antécédents ── */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <BlockAntecedents label="Antécédents médicaux"      icone="medical_information" items={dossier.antecedentsMedicaux} />
        <BlockAntecedents label="Antécédents gynécologiques" icone="female"              items={dossier.antecedentsGynecologiques} />
        <BlockAntecedents label="Antécédents chirurgicaux"  icone="rebase_edit"          items={dossier.antecedentsChirurgicaux} />
        <BlockAntecedents label="Antécédents obstétricaux"  icone="child_care"           items={dossier.antecedentsObstetricaux} />
      </section>

      {/* ── Section 3 : Notes ── */}
      {dossier.notes && (
        <section>
          <div className="rounded-2xl bg-surface-container-lowest p-10 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-black text-on-surface">
              <span className="material-symbols-outlined text-primary">stethoscope</span>
              Notes complémentaires
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{dossier.notes}</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default PageDossierOuvertureCpn
