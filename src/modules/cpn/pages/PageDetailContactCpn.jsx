// Ce composant affiche le détail d'un contact CPN dans un design identique au formulaire de création, avec la possibilité de modifier le contact le jour même et de l'imprimer.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'
import InfoEnregistrement from '../../../composants/partages/InfoEnregistrement'

/* ─── Styles d'impression injectés globalement ─── */
const STYLES_IMPRESSION = `
@media print {
  .barre-laterale, header, nav, .en-tete-application, [data-print-hide], button { display: none !important; }
  body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  #racine-application, main, .contenu-principal, .layout-prive { background: #fff !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
  @page { margin: 15mm 12mm; size: A4 portrait; }

  /* Masquer tout le contenu de la page par défaut */
  #contenu-page-contact { display: none !important; }

  /* Par défaut zones d'impression masquées */
  #zone-impression-contact,
  #zone-impression-examens,
  #zone-impression-medicaments,
  #zone-impression-dossier { display: none !important; }

  /* Activation sélective via classe body */
  body.print-contact #zone-impression-contact { display: block !important; }
  body.print-examens #zone-impression-examens { display: block !important; }
  body.print-medicaments #zone-impression-medicaments { display: block !important; }
  body.print-dossier #zone-impression-dossier { display: block !important; }
}
@media screen {
  #zone-impression-contact,
  #zone-impression-examens,
  #zone-impression-medicaments,
  #zone-impression-dossier { display: none; }
}
`

function BoolLabel(val) {
  if (val === true) return 'Oui'
  if (val === false) return 'Non'
  return ''
}

function fmt(val, suffix = '') {
  if (val === null || val === undefined || val === '') return ''
  return `${val}${suffix}`
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/* ── Champ lecture seule (même style que PageDossierOuvertureCpn) ── */
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

function PageDetailContactCpn() {
  const { dossierId, contactId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [contact, setContact] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [messageSucces, setMessageSucces] = useState(location.state?.messageSucces ?? '')
  const [menuImpressionOuvert, setMenuImpressionOuvert] = useState(false)

  // Injecter les styles d'impression une seule fois
  useEffect(() => {
    const id = 'styles-impression-contact'
    if (!document.getElementById(id)) {
      const tag = document.createElement('style')
      tag.id = id
      tag.textContent = STYLES_IMPRESSION
      document.head.appendChild(tag)
    }
  }, [])

  useEffect(() => {
    setChargement(true)
    Promise.all([
      serviceCpn.obtenirContact(dossierId, contactId),
      serviceCpn.obtenirDossier(dossierId),
    ])
      .then(([c, d]) => { setContact(c); setDossier(d) })
      .catch((ex) => setErreur(ex.message))
      .finally(() => setChargement(false))
  }, [dossierId, contactId])

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

  if (!contact) return null

  const today = new Date().toISOString().split('T')[0]
  const jourCreation = contact.creeLe ? new Date(contact.creeLe).toISOString().split('T')[0] : null
  const modificationAutorisee = jourCreation === today && dossier?.statut === 'OUVERT' && !location.state?.fromHistorique

  const patienteNomComplet = dossier?.nomPatiente
    ?? (dossier?.patiente ? [dossier.patiente.nom, dossier.patiente.postnom, dossier.patiente.prenom].filter(Boolean).join(' ') : null)
    ?? '—'

  const imprimerSection = (classeBody) => {
    setMenuImpressionOuvert(false)
    document.body.classList.add(classeBody)
    window.print()
    document.body.classList.remove(classeBody)
  }

  let medicamentsAffichage = []
  let decisionAffichage = ''
  if (contact.traitementPrescrit) {
    const lignes = contact.traitementPrescrit.split('\n')
    let section = null
    for (const ligne of lignes) {
      if (ligne.trim() === '=== MEDICAMENTS ===') { section = 'med'; continue }
      if (ligne.trim() === '=== DECISION FINALE ===') { section = 'decision'; continue }
      if (ligne.startsWith('') && section === 'med') medicamentsAffichage.push(ligne.slice(1).trim())
      else if (section === 'decision' && ligne.trim()) decisionAffichage += (decisionAffichage ? '\n' : '') + ligne
    }
    if (!medicamentsAffichage.length && !decisionAffichage) decisionAffichage = contact.traitementPrescrit
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div id="contenu-page-contact">
        <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Historique contacts
      </button>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/60 px-5 py-3.5 text-sm font-medium text-on-tertiary-container">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {messageSucces}
        </div>
      )}

      <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary-container/20 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Contact CPN  {fmtDate(contact.dateContact)}</p>
          <h2 className="text-3xl font-extrabold text-on-background tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Contact n{contact.numeroContact}
          </h2>
          {dossier && (
            <p className="text-sm text-on-surface-variant">{dossier.numeroDossierCpn}  {patienteNomComplet}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {modificationAutorisee ? (
            <button
              onClick={() => navigate(`/cpn/${dossierId}/contacts/${contactId}/modifier`)}
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
                  onClick={() => imprimerSection('print-contact')}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-base text-primary">description</span>
                  Contact complet
                </button>
                {(medicamentsAffichage.length > 0 || decisionAffichage) && (
                  <button
                    onClick={() => imprimerSection('print-medicaments')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-base text-error">medication</span>
                    Médicaments
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SectionDetail icone="assignment" couleurIcone="text-primary" titre="1. Informations générales"
        enfants={
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <ChampLecture label="Date de la visite" valeur={fmtDate(contact.dateContact)} />
              <ChampLecture label="Numéro de contact" valeur={contact.numeroContact != null ? `Contact ${contact.numeroContact}` : null} />
              <ChampLecture label="État général" valeur={contact.etatGeneral} />
            </div>
            {contact.observations && (
              <>
                <hr className="border-surface-container-high" />
                <div className="flex flex-col">
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Observations / Plaintes</span>
                  <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed">{contact.observations}</div>
                </div>
              </>
            )}
          </div>
        }
      />

      <SectionDetail icone="monitoring" couleurIcone="text-tertiary" titre="2. Constantes et dépistage"
        enfants={
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <ChampLecture label="Poids" valeur={fmt(contact.poids, ' kg')} />
              <ChampLecture label="Périmètre brachial" valeur={fmt(contact.perimetreBrachial, ' cm')} />
              <ChampLecture label="Température" valeur={fmt(contact.temperature, ' °C')} />
            </div>
            <hr className="border-surface-container-high" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <ChampLecture label="TA systolique" valeur={fmt(contact.tensionSystolique, ' mmHg')} />
              <ChampLecture label="TA diastolique" valeur={fmt(contact.tensionDiastolique, ' mmHg')} />
              <ChampLecture label="Pouls mère" valeur={fmt(contact.frequenceCardiaqueMore, ' bpm')} />
              <ChampLecture label="BFC fœtal" valeur={fmt(contact.bfc, ' bpm')} />
              <ChampLecture label="Protéinurie" valeur={contact.proteInurie ?? ''} />
            </div>
            <hr className="border-surface-container-high" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <TuileBool label="Pâleur" valeur={contact.paleur} />
              <TuileBool label="Œdèmes" valeur={contact.oedemes} />
            </div>
          </div>
        }
      />

      <SectionDetail icone="pregnant_woman" couleurIcone="text-secondary" titre="3. Examen obstétrical"
        enfants={
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <ChampLecture label="Âge gestationnel" valeur={fmt(contact.ageGestationnel, ' SA')} />
              <ChampLecture label="Hauteur utérine" valeur={fmt(contact.hauteurUterine, ' cm')} />
              <ChampLecture label="Présentation fœtale" valeur={contact.presentationFoetale ?? ''} />
              <ChampLecture label="État du col" valeur={contact.etatDuCol ?? ''} />
            </div>
            <hr className="border-surface-container-high" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <TuileBool label="Mouvements actifs" valeur={contact.mouvementsActifs} couleurVrai="text-tertiary" couleurFaux="text-error" />
              <TuileBool label="Écoulement vaginal" valeur={contact.ecoulementVaginal} />
              <TuileBool label="Ulcérations génitales" valeur={contact.ulcerationsGenitales} />
            </div>
          </div>
        }
      />

      {(medicamentsAffichage.length > 0 || decisionAffichage) && (
        <SectionDetail icone="medication" couleurIcone="text-primary" titre="4. Traitement et décision"
          enfants={
            <div className="space-y-5">
              {medicamentsAffichage.length > 0 && (
                <div className="flex flex-col">
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Médicaments prescrits</span>
                  <div className="flex flex-col gap-2">
                    {medicamentsAffichage.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-surface-container px-3 py-3">
                        <span className="material-symbols-outlined text-primary text-base">vaccines</span>
                        <span className="text-sm font-medium text-on-surface">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {medicamentsAffichage.length > 0 && decisionAffichage && <hr className="border-surface-container-high" />}
              {decisionAffichage && (
                <div className="flex flex-col">
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Décision finale</span>
                  <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{decisionAffichage}</div>
                </div>
              )}
            </div>
          }
        />
      )}

      {contact.examens && contact.examens.length > 0 && (
        <SectionDetail icone="biotech" couleurIcone="text-tertiary" titre="5. Examens demandés"
          enfants={
            <div className="flex flex-col gap-4">
              {contact.examens.map((ex, idx) => (
                <div key={ex.id}>
                  {idx > 0 && <hr className="mb-4 border-surface-container-high" />}
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                    <ChampLecture label="Examen" valeur={ex.libelle} />
                    <ChampLecture label="Type" valeur={ex.typeExamen} />
                    <div className="flex flex-col">
                      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Statut</span>
                      <div className="rounded-lg bg-surface-container px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          (ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE') ? 'bg-tertiary-container text-on-tertiary-container' : ex.statut === 'EN_COURS' ? 'bg-secondary-container/60 text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-sm">{(ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE') ? 'check_circle' : ex.statut === 'EN_COURS' ? 'labs' : 'hourglass_empty'}</span>
                          {(ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE') ? 'Résultat reçu' : ex.statut === 'EN_COURS' ? 'Au laboratoire' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {ex.resultat && (
                    <div className="mt-4 flex flex-col">
                      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Résultat</span>
                      <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed">{ex.resultat}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
        />
      )}

      {contact.prochainRdvDate && (
        <SectionDetail icone="event_upcoming" couleurIcone="text-secondary" titre="Prochain rendez-vous"
          enfants={
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <ChampLecture label="Date prévue" valeur={new Date(contact.prochainRdvDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} principal />
              {contact.prochainRdvNotes && <ChampLecture label="Notes" valeur={contact.prochainRdvNotes} />}
            </div>
          }
        />
      )}

      <InfoEnregistrement enregistrePar={contact.enregistrePar} modifiePar={contact.modifiePar} />

      {/* Zones imprimables — invisibles à l'écran */}
      </div>{/* fin contenu-page-contact */}
      <ZoneImpressionContact
        contact={contact}
        dossier={dossier}
        medicaments={medicamentsAffichage}
        decision={decisionAffichage}
      />
      <ZoneImpressionExamens contact={contact} dossier={dossier} />
      <ZoneImpressionMedicaments contact={contact} dossier={dossier} medicaments={medicamentsAffichage} decision={decisionAffichage} />
      <ZoneImpressionDossierInitial dossier={dossier} />

    </div>
  )
}

/* ─── Zone imprimable invisible à l'écran ─── */
function ZoneImpressionContact({ contact, dossier, medicaments, decision }) {
  function ligne(label, valeur) {
    if (!valeur && valeur !== 0) return null
    return (
      <tr key={label} style={{ borderBottom: '1px solid #e5e7eb' }}>
        <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, whiteSpace: 'nowrap', width: '38%' }}>{label}</td>
        <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11 }}>{valeur}</td>
      </tr>
    )
  }
  function bool(val) { return val === true ? 'Oui' : val === false ? 'Non' : '—' }
  function section(titre, lignes) {
    const lignesRendues = lignes.filter(Boolean)
    if (!lignesRendues.length) return null
    return (
      <div style={{ marginBottom: 16, breakInside: 'avoid' }}>
        <div style={{ background: '#1a5276', color: '#fff', padding: '4px 10px', borderRadius: '4px 4px 0 0', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
          {titre}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
          <tbody>{lignesRendues}</tbody>
        </table>
      </div>
    )
  }

  const patiente = dossier?.patiente
  const nomPatienteImpression = dossier?.nomPatiente
    ?? (patiente ? [patiente.nom, patiente.postnom, patiente.prenom].filter(Boolean).join(' ') : null)
    ?? '—'
  const dateContact = contact.dateContact ? new Date(contact.dateContact).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div id="zone-impression-contact" style={{ fontFamily: 'Inter, sans-serif', color: '#191c1d', background: '#fff', padding: 0, position: 'relative', overflow: 'hidden' }}>

      {/* En-tête institutionnel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#005eb8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '26px' }}>medical_services</span>
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 900, color: '#00478d', margin: 0 }}>Centre de Santé Afia Himbi</h1>
            <p style={{ color: '#424752', fontWeight: 600, fontSize: '11px', margin: '2px 0' }}>Unité de Soins Prénatals et Postnatals</p>
            <p style={{ color: '#424752', fontSize: '10px', margin: '3px 0 0 0' }}>Goma, Nord-Kivu, RDC — +243 000 000 000</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', padding: '2px 8px', background: '#d5e4f7', color: '#526070', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '99px', marginBottom: '4px' }}>Fiche de Contact CPN</span>
          <p style={{ color: '#424752', fontSize: '10px', margin: '2px 0' }}>Contact n°{contact.numeroContact} — {dateContact}</p>
          <p style={{ color: '#424752', fontSize: '10px', margin: '2px 0' }}>Imprimé le {dateNow}</p>
        </div>
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(to right, #00478d, #005eb8, #526070)', marginBottom: '16px', borderRadius: '2px' }} />

      {/* Identité patiente */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Patiente</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{nomPatienteImpression}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>N° Dossier CPN</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{dossier?.numeroDossierCpn ?? '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Date du contact</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{dateContact}</div>
        </div>
      </div>

      {/* Sections */}
      {section('1. Informations générales', [
        ligne('État général', contact.etatGeneral),
        contact.observations ? (
          <tr key="obs" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Observations / Plaintes</td>
            <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11, whiteSpace: 'pre-wrap' }}>{contact.observations}</td>
          </tr>
        ) : null,
      ])}

      {section('2. Constantes et dépistage', [
        ligne('Poids', contact.poids != null ? `${contact.poids} kg` : null),
        ligne('Périmètre brachial', contact.perimetreBrachial != null ? `${contact.perimetreBrachial} cm` : null),
        ligne('Température', contact.temperature != null ? `${contact.temperature} °C` : null),
        ligne('TA systolique', contact.tensionSystolique != null ? `${contact.tensionSystolique} mmHg` : null),
        ligne('TA diastolique', contact.tensionDiastolique != null ? `${contact.tensionDiastolique} mmHg` : null),
        ligne('Pouls mère', contact.frequenceCardiaqueMore != null ? `${contact.frequenceCardiaqueMore} bpm` : null),
        ligne('BFC fœtal', contact.bfc != null ? `${contact.bfc} bpm` : null),
        ligne('Protéinurie', contact.proteInurie ?? null),
        ligne('Pâleur', contact.paleur != null ? bool(contact.paleur) : null),
        ligne('Œdèmes', contact.oedemes != null ? bool(contact.oedemes) : null),
      ])}

      {section('3. Examen obstétrical', [
        ligne('Âge gestationnel', contact.ageGestationnel != null ? `${contact.ageGestationnel} SA` : null),
        ligne('Hauteur utérine', contact.hauteurUterine != null ? `${contact.hauteurUterine} cm` : null),
        ligne('Présentation fœtale', contact.presentationFoetale ?? null),
        ligne('Mouvements actifs du fœtus', contact.mouvementsActifs != null ? bool(contact.mouvementsActifs) : null),
        ligne('Écoulement vaginal', contact.ecoulementVaginal != null ? bool(contact.ecoulementVaginal) : null),
        ligne('Ulcérations génitales', contact.ulcerationsGenitales != null ? bool(contact.ulcerationsGenitales) : null),
        ligne('État du col', contact.etatDuCol ?? null),
      ])}

      {(medicaments.length > 0 || decision) && section('4. Traitement et décision', [
        medicaments.length > 0 ? (
          <tr key="med" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Médicaments prescrits</td>
            <td style={{ padding: '5px 8px', fontSize: 11 }}>
              {medicaments.map((m, i) => <div key={i} style={{ marginBottom: 2 }}>• {m}</div>)}
            </td>
          </tr>
        ) : null,
        decision ? (
          <tr key="dec" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Décision finale</td>
            <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11, whiteSpace: 'pre-wrap' }}>{decision}</td>
          </tr>
        ) : null,
      ])}

      {contact.examens?.length > 0 && section('5. Examens demandés', contact.examens.map((ex) => (
        <tr key={ex.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
          <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11 }}>{ex.libelle}</td>
          <td style={{ padding: '5px 8px', fontSize: 11 }}>
            <span style={{ fontStyle: 'italic', color: '#6b7280' }}>{ex.typeExamen}</span>
            {' — '}
            <span style={{ fontWeight: 600, color: (ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE') ? '#065f46' : ex.statut === 'EN_COURS' ? '#1d4ed8' : '#92400e' }}>
              {(ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE') ? 'Résultat reçu' : ex.statut === 'EN_COURS' ? 'Au laboratoire' : 'En attente'}
            </span>
            {ex.resultat && <div style={{ marginTop: 2, color: '#374151', fontSize: 10 }}>→ {ex.resultat}</div>}
          </td>
        </tr>
      )))}

      {contact.prochainRdvDate && section('Prochain rendez-vous', [
        ligne('Date prévue', new Date(contact.prochainRdvDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })),
        contact.prochainRdvNotes ? ligne('Notes', contact.prochainRdvNotes) : null,
      ])}

      {/* Signatures */}
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

/* ─── Zone impression : examens uniquement ─── */
function ZoneImpressionExamens({ contact, dossier }) {
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateContact = contact.dateContact ? new Date(contact.dateContact).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  const patiente = dossier?.patiente
  const nomPatiente = dossier?.nomPatiente
    ?? (patiente ? [patiente.nom, patiente.postnom, patiente.prenom].filter(Boolean).join(' ') : null)
    ?? '—'

  return (
    <div id="zone-impression-examens" style={{ fontFamily: 'Inter, sans-serif', color: '#191c1d', background: '#fff', padding: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#005eb8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '26px' }}>medical_services</span>
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 900, color: '#00478d', margin: 0 }}>Centre de Santé Afia Himbi</h1>
            <p style={{ color: '#424752', fontWeight: 600, fontSize: '11px', margin: '2px 0' }}>Unité de Soins Prénatals — CPN</p>
            <p style={{ color: '#424752', fontSize: '10px', margin: '3px 0 0 0' }}>Goma, Nord-Kivu, RDC</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', padding: '2px 8px', background: '#d5e4f7', color: '#526070', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '99px', marginBottom: '4px' }}>Examens Demandés</span>
          <p style={{ color: '#424752', fontSize: '10px', margin: '2px 0' }}>Contact n°{contact.numeroContact} — {dateContact}</p>
          <p style={{ color: '#424752', fontSize: '10px', margin: '2px 0' }}>Imprimé le {dateNow}</p>
        </div>
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(to right, #00478d, #005eb8, #526070)', marginBottom: '14px', borderRadius: '2px' }} />
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Patiente</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{nomPatiente}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>N° Dossier CPN</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{dossier?.numeroDossierCpn ?? '—'}</div>
        </div>
      </div>
      {contact.examens?.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', borderRadius: 4 }}>
          <thead>
            <tr style={{ background: '#1a5276', color: '#fff' }}>
              <th style={{ padding: '6px 10px', fontSize: 10, textAlign: 'left', fontWeight: 700 }}>Examen</th>
              <th style={{ padding: '6px 10px', fontSize: 10, textAlign: 'left', fontWeight: 700 }}>Type</th>
              <th style={{ padding: '6px 10px', fontSize: 10, textAlign: 'left', fontWeight: 700 }}>Statut</th>
              <th style={{ padding: '6px 10px', fontSize: 10, textAlign: 'left', fontWeight: 700 }}>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {contact.examens.map((ex, i) => (
              <tr key={ex.id} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 1 ? '#f9fafb' : '#fff' }}>
                <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600 }}>{ex.libelle}</td>
                <td style={{ padding: '6px 10px', fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{ex.typeExamen}</td>
                <td style={{ padding: '6px 10px', fontSize: 11 }}>{(ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE') ? 'Résultat reçu' : ex.statut === 'EN_COURS' ? 'Au laboratoire' : 'En attente'}</td>
                <td style={{ padding: '6px 10px', fontSize: 11 }}>{ex.resultat ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>Aucun examen enregistré pour ce contact.</p>
      )}
    </div>
  )
}

/* ─── Zone impression : médicaments uniquement ─── */
function ZoneImpressionMedicaments({ contact, dossier, medicaments, decision }) {
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateContact = contact.dateContact ? new Date(contact.dateContact).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  const patiente = dossier?.patiente
  const nomPatiente = dossier?.nomPatiente
    ?? (patiente ? [patiente.nom, patiente.postnom, patiente.prenom].filter(Boolean).join(' ') : null)
    ?? '—'

  return (
    <div id="zone-impression-medicaments" style={{ fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2.5px solid #1a5276', paddingBottom: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a5276' }}>CENTRE DE SANTÉ — AFIA HIMBI</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Consultation Prénatale (CPN)</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a5276' }}>ORDONNANCE / TRAITEMENT</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>Contact n°{contact.numeroContact} — {dateContact}</div>
          <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>Imprimé le {dateNow}</div>
        </div>
      </div>
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 16, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Patiente</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{nomPatiente}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>N° Dossier CPN</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{dossier?.numeroDossierCpn ?? '—'}</div>
        </div>
      </div>
      {medicaments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: '#1a5276', color: '#fff', padding: '4px 10px', borderRadius: '4px 4px 0 0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Médicaments prescrits
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', borderTop: 'none' }}>
            <tbody>
              {medicaments.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 1 ? '#f9fafb' : '#fff' }}>
                  <td style={{ padding: '7px 12px', fontSize: 12 }}>• {m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {decision && (
        <div>
          <div style={{ background: '#1a5276', color: '#fff', padding: '4px 10px', borderRadius: '4px 4px 0 0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Décision finale
          </div>
          <div style={{ border: '1px solid #d1d5db', borderTop: 'none', padding: '8px 12px', fontSize: 11, whiteSpace: 'pre-wrap', color: '#111827' }}>{decision}</div>
        </div>
      )}
      {!medicaments.length && !decision && (
        <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>Aucun traitement enregistré pour ce contact.</p>
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

/* ─── Zone impression : fiche initiale CPN ─── */
function ZoneImpressionDossierInitial({ dossier }) {
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  if (!dossier) return null
  const patiente = dossier.patiente ?? {}

  function ligne(label, valeur) {
    if (!valeur && valeur !== 0) return null
    return (
      <tr key={label} style={{ borderBottom: '1px solid #e5e7eb' }}>
        <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, width: '40%' }}>{label}</td>
        <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11 }}>{valeur}</td>
      </tr>
    )
  }
  function section(titre, lignes) {
    const filtrees = lignes.filter(Boolean)
    if (!filtrees.length) return null
    return (
      <div style={{ marginBottom: 14, breakInside: 'avoid' }}>
        <div style={{ background: '#1a5276', color: '#fff', padding: '4px 10px', borderRadius: '4px 4px 0 0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{titre}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', borderTop: 'none' }}>
          <tbody>{filtrees}</tbody>
        </table>
      </div>
    )
  }

  return (
    <div id="zone-impression-dossier" style={{ fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2.5px solid #1a5276', paddingBottom: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a5276' }}>CENTRE DE SANTÉ — AFIA HIMBI</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Consultation Prénatale (CPN)</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a5276' }}>DOSSIER D'OUVERTURE CPN — FICHE INITIALE</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>{dossier.numeroDossierCpn ?? '—'}</div>
          <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>Imprimé le {dateNow}</div>
        </div>
      </div>

      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Patiente</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{patiente.nomComplet ?? ([patiente.nom, patiente.postnom, patiente.prenom].filter(Boolean).join(' ') || '—')}</div>
        </div>
        {patiente.telephone && (
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Téléphone</span>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{patiente.telephone}</div>
          </div>
        )}
        {dossier.dateOuverture && (
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Date d'ouverture</span>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{new Date(dossier.dateOuverture).toLocaleDateString('fr-FR')}</div>
          </div>
        )}
      </div>

      {section('Obstétrique', [
        ligne('Gestité', dossier.gestite),
        ligne('Parité', dossier.parite),
        ligne('Nombre d\'avortements', dossier.nombreAvortements),
        ligne('Date des dernières règles', dossier.derniersRegles),
        ligne('Date probable d\'accouchement', dossier.dateProbableAccouchement),
        ligne('Âge gestationnel à l\'ouverture', dossier.ageGestionnelOuverture != null ? `${dossier.ageGestionnelOuverture} SA` : null),
      ])}

      {section('Antécédents médicaux', [
        dossier.antecedentsMedicaux ? (
          <tr key="med" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Médicaux</td>
            <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11, whiteSpace: 'pre-wrap' }}>{dossier.antecedentsMedicaux}</td>
          </tr>
        ) : null,
        dossier.antecedentsChirurgicaux ? (
          <tr key="chir" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Chirurgicaux</td>
            <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11, whiteSpace: 'pre-wrap' }}>{dossier.antecedentsChirurgicaux}</td>
          </tr>
        ) : null,
        dossier.antecedentsGynecologiques ? (
          <tr key="gyn" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Gynécologiques</td>
            <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11, whiteSpace: 'pre-wrap' }}>{dossier.antecedentsGynecologiques}</td>
          </tr>
        ) : null,
        dossier.antecedentsObstetricaux ? (
          <tr key="obs" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Obstétricaux</td>
            <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11, whiteSpace: 'pre-wrap' }}>{dossier.antecedentsObstetricaux}</td>
          </tr>
        ) : null,
      ])}

      {section('Bilan initial', [
        ligne('Groupe sanguin', dossier.groupeSanguin),
        ligne('Rhésus', dossier.rhesus),
        ligne('Statut VIH', dossier.vihStatut),
        ligne('Allergies', dossier.allergies),
        dossier.notes ? (
          <tr key="notes" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, verticalAlign: 'top' }}>Notes</td>
            <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11, whiteSpace: 'pre-wrap' }}>{dossier.notes}</td>
          </tr>
        ) : null,
      ])}
    </div>
  )
}

export default PageDetailContactCpn
