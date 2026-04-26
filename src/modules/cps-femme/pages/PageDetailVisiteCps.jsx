// Ce composant affiche le detail d'une visite CPS en lecture seule, avec en-tete gradient, sections détaillées et impression.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'
import InfoEnregistrement from '../../../composants/partages/InfoEnregistrement'

/* ─── Styles d'impression injectés globalement ─── */
const STYLES_IMPRESSION = `
@media print {
  .barre-laterale, header, nav, .en-tete-application, [data-print-hide], button { display: none !important; }
  body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  #racine-application, main, .contenu-principal, .layout-prive { background: #fff !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
  @page { margin: 15mm 12mm; size: A4 portrait; }

  #contenu-page-visite { display: none !important; }

  #zone-impression-visite,
  #zone-impression-traitement-cps { display: none !important; }

  body.print-visite-cps #zone-impression-visite { display: block !important; }
  body.print-traitement-cps #zone-impression-traitement-cps { display: block !important; }
}
@media screen {
  #zone-impression-visite,
  #zone-impression-traitement-cps { display: none; }
}
`

const LABELS_TYPE_VISITE = {
  SIX_HEURES: 'Visite 6 heures',
  SIX_JOURS: 'Visite 6 jours',
  SIX_SEMAINES: 'Visite 6 semaines',
  SURPRISE: 'Visite surprise',
}

function fmt(val, suffix = '') {
  if (val === null || val === undefined || val === '') return ''
  return `${val}${suffix}`
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/* ── Champ lecture seule ── */
function ChampLecture({ label, valeur, principal, couleurValeur }) {
  const couleur = couleurValeur ?? (principal ? 'text-primary' : 'text-on-surface')
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className={`rounded-lg px-3 py-3 text-sm font-semibold bg-surface-container ${couleur}`}>
        {(valeur !== null && valeur !== undefined && valeur !== '')
          ? valeur
          : <span className="font-normal italic text-on-surface-variant/60">—</span>}
      </div>
    </div>
  )
}

function TuileBool({ label, valeur, couleurVrai = 'text-error', couleurFaux = 'text-tertiary' }) {
  const texte = valeur === true ? 'Oui' : valeur === false ? 'Non' : ''
  const couleur = valeur === true ? couleurVrai : valeur === false ? couleurFaux : 'text-on-surface'
  return <ChampLecture label={label} valeur={texte} couleurValeur={texte ? couleur : undefined} />
}

/* ── Section de détail (style border-l-4) ── */
function SectionDetail({ icone, couleurIcone, titre, enfants }) {
  return (
    <div className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <span className={`material-symbols-outlined ${couleurIcone}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icone}</span>
        <h4 className="text-lg font-bold tracking-tight text-on-surface">{titre}</h4>
      </div>
      {enfants}
    </div>
  )
}

function PageDetailVisiteCps() {
  const { dossierId, visiteId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [visite, setVisite] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [menuImpressionOuvert, setMenuImpressionOuvert] = useState(false)

  // Injecter les styles d'impression une seule fois
  useEffect(() => {
    const id = 'styles-impression-visite-cps'
    if (!document.getElementById(id)) {
      const tag = document.createElement('style')
      tag.id = id
      tag.textContent = STYLES_IMPRESSION
      document.head.appendChild(tag)
    }
  }, [])

  useEffect(() => {
    let actif = true
    Promise.all([
      serviceCpsFemme.obtenirVisite(dossierId, visiteId),
      serviceCpsFemme.obtenirDossier(dossierId),
    ])
      .then(([v, d]) => { if (actif) { setVisite(v); setDossier(d) } })
      .catch((e) => { if (actif) setErreur(e.message) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [dossierId, visiteId])

  useEffect(() => {
    if (!messageSucces) return
    window.history.replaceState({}, '')
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  if (chargement) return (
    <div className="flex items-center gap-3 py-20 text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin">hourglass_top</span>
      <span className="text-sm">Chargement...</span>
    </div>
  )

  if (erreur) return (
    <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
  )

  if (!visite) return null

  const today = new Date().toISOString().split('T')[0]
  const jourCreation = visite.creeLe ? new Date(visite.creeLe).toISOString().split('T')[0] : null
  const fromHistorique = location.state?.fromHistorique ?? false
  const modificationAutorisee = jourCreation === today && !fromHistorique

  const imprimerSection = (classeBody) => {
    setMenuImpressionOuvert(false)
    document.body.classList.add(classeBody)
    window.print()
    document.body.classList.remove(classeBody)
  }

  const aTraitement = !!(visite.traitementPrescrit || visite.conduiteATenir)

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div id="contenu-page-visite">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Retour au dossier
        </button>

        {messageSucces && (
          <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/60 px-5 py-3.5 text-sm font-medium text-on-tertiary-container">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {messageSucces}
          </div>
        )}

        {/* En-tête gradient */}
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary-container/20 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">CPS Femme · {fmtDate(visite.dateVisite)}</p>
            <h2 className="text-3xl font-extrabold text-on-background tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {LABELS_TYPE_VISITE[visite.typeVisite] ?? visite.typeVisite}
            </h2>
            {dossier && (
              <p className="text-sm text-on-surface-variant">{dossier.numeroDossierCps} · {dossier.patiente?.nom}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {modificationAutorisee ? (
              <button
                onClick={() => navigate(`/cps-femme/${dossierId}/visites/${visiteId}/modifier`)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Modifier
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-4 py-2.5 text-sm font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-base">lock</span>
                Modification non autorisée
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setMenuImpressionOuvert((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Imprimer
                <span className="material-symbols-outlined text-base">{menuImpressionOuvert ? 'expand_less' : 'expand_more'}</span>
              </button>
              {menuImpressionOuvert && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest py-2 shadow-lg">
                  <button
                    onClick={() => imprimerSection('print-visite-cps')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-base text-primary">description</span>
                    Visite complète
                  </button>
                  {aTraitement && (
                    <button
                      onClick={() => imprimerSection('print-traitement-cps')}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-base text-error">medication</span>
                      Traitement
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1. Constantes vitales */}
        <div className="mt-8" />
        <SectionDetail icone="monitor_heart" couleurIcone="text-tertiary" titre="1. Constantes vitales"
          enfants={
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <ChampLecture label="Poids maternel" valeur={fmt(visite.poids, ' kg')} />
              <ChampLecture label="TA systolique" valeur={visite.tensionSystolique ? `${visite.tensionSystolique} / ${visite.tensionDiastolique ?? '—'} mmHg` : ''} />
              <ChampLecture label="Température" valeur={fmt(visite.temperature, ' °C')} />
              <ChampLecture label="Fréquence cardiaque" valeur={fmt(visite.frequenceCardiaque, ' bpm')} />
              <ChampLecture label="Périmètre brachial" valeur={fmt(visite.perimetreBrachial, ' cm')} />
            </div>
          }
        />

        {/* 2. Examen postnatal */}
        <div className="mt-8" />
        <SectionDetail icone="pregnant_woman" couleurIcone="text-secondary" titre="2. Examen postnatal"
          enfants={
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                <ChampLecture label="Involution utérine" valeur={visite.involutionUterine} />
                <ChampLecture label="État des seins" valeur={visite.etatSeins} />
                <ChampLecture label="Allaitement" valeur={visite.allaitement} />
                <ChampLecture label="État de la plaie" valeur={visite.etatPlaie} />
                <ChampLecture label="Saignements" valeur={visite.saignements} />
                <ChampLecture label="Lochies" valeur={visite.lochies} />
                <ChampLecture label="État psychologique" valeur={visite.etatPsychologique} />
              </div>
              <hr className="border-surface-container-high" />
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <TuileBool label="Œdèmes" valeur={visite.oedemes} />
                <TuileBool label="Pâleur" valeur={visite.paleur} />
              </div>
            </div>
          }
        />

        {/* 3. Contraception */}
        <div className="mt-8" />
        {(visite.contraceptionDiscutee !== undefined || visite.methodeContraceptive) && (
          <SectionDetail icone="vaccines" couleurIcone="text-primary" titre="3. Contraception"
            enfants={
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <TuileBool label="Contraception discutée" valeur={visite.contraceptionDiscutee} couleurVrai="text-tertiary" couleurFaux="text-on-surface" />
                <ChampLecture label="Méthode contraceptive" valeur={visite.methodeContraceptive} />
              </div>
            }
          />
        )}

        {/* 4. Conduite à tenir */}
        {aTraitement && (
          <SectionDetail icone="medical_services" couleurIcone="text-primary" titre="4. Conduite à tenir"
            enfants={
              <div className="space-y-5">
                {visite.conduiteATenir && (
                  <div className="flex flex-col">
                    <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Conduite à tenir</span>
                    <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{visite.conduiteATenir}</div>
                  </div>
                )}
                {visite.conduiteATenir && visite.traitementPrescrit && <hr className="border-surface-container-high" />}
                {visite.traitementPrescrit && (
                  <div className="flex flex-col">
                    <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Traitement prescrit</span>
                    <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{visite.traitementPrescrit}</div>
                  </div>
                )}
              </div>
            }
          />
        )}

        {/* 5. Prochain rendez-vous */}
        {(visite.prochainRdvDate || visite.observations) && (
          <SectionDetail icone="event_upcoming" couleurIcone="text-secondary" titre="5. Suivi"
            enfants={
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <ChampLecture label="Prochain rendez-vous" valeur={fmtDate(visite.prochainRdvDate)} principal />
                </div>
                {visite.observations && (
                  <>
                    <hr className="border-surface-container-high" />
                    <div className="flex flex-col">
                      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Observations</span>
                      <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{visite.observations}</div>
                    </div>
                  </>
                )}
              </div>
            }
          />
        )}

      <InfoEnregistrement enregistrePar={visite.enregistrePar} modifiePar={visite.modifiePar} />

      </div>{/* fin contenu-page-visite */}

      {/* Zones imprimables */}
      <ZoneImpressionVisite visite={visite} dossier={dossier} />
      <ZoneImpressionTraitementCps visite={visite} dossier={dossier} />
    </div>
  )
}

/* ─── Zone imprimable : visite complète ─── */
function ZoneImpressionVisite({ visite, dossier }) {
  if (!visite) return null
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateVisite = fmtDate(visite.dateVisite)
  const patiente = dossier?.patiente

  function ligne(label, valeur) {
    if (!valeur && valeur !== 0 && valeur !== false) return null
    return (
      <tr key={label} style={{ borderBottom: '1px solid #e5e7eb' }}>
        <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, whiteSpace: 'nowrap', width: '38%' }}>{label}</td>
        <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11 }}>{String(valeur)}</td>
      </tr>
    )
  }
  function bool(val) { return val === true ? 'Oui' : val === false ? 'Non' : '—' }
  function section(titre, lignes) {
    const filtrees = lignes.filter(Boolean)
    if (!filtrees.length) return null
    return (
      <div style={{ marginBottom: 16, breakInside: 'avoid' }}>
        <div style={{ background: '#1a5276', color: '#fff', padding: '4px 10px', borderRadius: '4px 4px 0 0', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{titre}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', borderTop: 'none' }}>
          <tbody>{filtrees}</tbody>
        </table>
      </div>
    )
  }

  return (
    <div id="zone-impression-visite" style={{ fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: 0 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: 10, background: '#005eb8', padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>&#10010;</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Centre de Santé Afia Himbi</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Consultation Postnatale (CPS Femme)</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>FICHE DE VISITE CPS</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{LABELS_TYPE_VISITE[visite.typeVisite] ?? visite.typeVisite} — {dateVisite}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Imprimé le {dateNow}</div>
        </div>
      </div>
      {/* Identité */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Patiente</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{patiente?.nom ?? '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>N° Dossier CPS</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{dossier?.numeroDossierCps ?? '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Date</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{dateVisite}</div>
        </div>
      </div>
      {section('1. Constantes vitales', [
        ligne('Poids maternel', visite.poids != null ? `${visite.poids} kg` : null),
        ligne('Tension artérielle', visite.tensionSystolique != null ? `${visite.tensionSystolique} / ${visite.tensionDiastolique ?? '—'} mmHg` : null),
        ligne('Température', visite.temperature != null ? `${visite.temperature} °C` : null),
        ligne('Fréquence cardiaque', visite.frequenceCardiaque != null ? `${visite.frequenceCardiaque} bpm` : null),
        ligne('Périmètre brachial', visite.perimetreBrachial != null ? `${visite.perimetreBrachial} cm` : null),
        ligne('État général', visite.etatGeneral),
      ])}
      {section('2. Examen postnatal', [
        ligne('Involution utérine', visite.involutionUterine),
        ligne('État des seins', visite.etatSeins),
        ligne('Allaitement', visite.allaitement),
        ligne('État de la plaie', visite.etatPlaie),
        ligne('Saignements', visite.saignements),
        ligne('Lochies', visite.lochies),
        ligne('État psychologique', visite.etatPsychologique),
        visite.oedemes != null ? ligne('Œdèmes', bool(visite.oedemes)) : null,
        visite.paleur != null ? ligne('Pâleur', bool(visite.paleur)) : null,
      ])}
      {(visite.contraceptionDiscutee !== undefined || visite.methodeContraceptive) && section('3. Contraception', [
        visite.contraceptionDiscutee != null ? ligne('Contraception discutée', bool(visite.contraceptionDiscutee)) : null,
        ligne('Méthode contraceptive', visite.methodeContraceptive),
      ])}
      {(visite.conduiteATenir || visite.traitementPrescrit) && section('4. Conduite à tenir / Traitement', [
        visite.conduiteATenir ? (
          <tr key="cat" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Conduite à tenir</td>
            <td style={{ padding: '5px 8px', fontSize: 11, whiteSpace: 'pre-wrap' }}>{visite.conduiteATenir}</td>
          </tr>
        ) : null,
        visite.traitementPrescrit ? (
          <tr key="trait" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Traitement prescrit</td>
            <td style={{ padding: '5px 8px', fontSize: 11, whiteSpace: 'pre-wrap' }}>{visite.traitementPrescrit}</td>
          </tr>
        ) : null,
      ])}
      {(visite.prochainRdvDate || visite.observations) && section('5. Suivi', [
        ligne('Prochain rendez-vous', fmtDate(visite.prochainRdvDate)),
        visite.observations ? (
          <tr key="obs" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Observations</td>
            <td style={{ padding: '5px 8px', fontSize: 11, whiteSpace: 'pre-wrap' }}>{visite.observations}</td>
          </tr>
        ) : null,
      ])}
      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 6, marginTop: 40, fontSize: 10, color: '#6b7280' }}>Signature du soignant</div>
        </div>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 6, marginTop: 40, fontSize: 10, color: '#6b7280' }}>Cachet / Tampon</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Zone imprimable : traitement uniquement ─── */
function ZoneImpressionTraitementCps({ visite, dossier }) {
  if (!visite) return null
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateVisite = fmtDate(visite.dateVisite)
  const patiente = dossier?.patiente

  return (
    <div id="zone-impression-traitement-cps" style={{ fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderRadius: 10, background: '#005eb8', padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>&#10010;</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Centre de Santé Afia Himbi</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Consultation Postnatale (CPS Femme)</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>ORDONNANCE / TRAITEMENT CPS</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{LABELS_TYPE_VISITE[visite.typeVisite] ?? visite.typeVisite} — {dateVisite}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Imprimé le {dateNow}</div>
        </div>
      </div>
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 16, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Patiente</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{patiente?.nom ?? '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>N° Dossier CPS</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{dossier?.numeroDossierCps ?? '—'}</div>
        </div>
      </div>
      {visite.conduiteATenir && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: '#1a5276', color: '#fff', padding: '4px 10px', borderRadius: '4px 4px 0 0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Conduite à tenir</div>
          <div style={{ border: '1px solid #d1d5db', borderTop: 'none', padding: '8px 12px', fontSize: 11, whiteSpace: 'pre-wrap', color: '#111827' }}>{visite.conduiteATenir}</div>
        </div>
      )}
      {visite.traitementPrescrit && (
        <div>
          <div style={{ background: '#1a5276', color: '#fff', padding: '4px 10px', borderRadius: '4px 4px 0 0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Traitement prescrit</div>
          <div style={{ border: '1px solid #d1d5db', borderTop: 'none', padding: '8px 12px', fontSize: 11, whiteSpace: 'pre-wrap', color: '#111827' }}>{visite.traitementPrescrit}</div>
        </div>
      )}
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 6, marginTop: 40, fontSize: 10, color: '#6b7280' }}>Signature du médecin</div>
        </div>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 6, marginTop: 40, fontSize: 10, color: '#6b7280' }}>Cachet / Tampon</div>
        </div>
      </div>
    </div>
  )
}

export default PageDetailVisiteCps
