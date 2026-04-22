// Ce composant affiche le détail d'une visite CPS Enfant en lecture seule avec toutes les données cliniques.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'
import InfoEnregistrement from '../../../composants/partages/InfoEnregistrement'

/* ─── Styles d'impression ─── */
const STYLES_IMPRESSION = `
@media print {
  .barre-laterale, header, nav, .en-tete-application, [data-print-hide], button { display: none !important; }
  body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  #racine-application, main, .contenu-principal, .layout-prive { background: #fff !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
  @page { margin: 15mm 12mm; size: A4 portrait; }
  #contenu-page-visite-enfant { display: none !important; }
  #zone-impression-visite-enfant { display: none !important; }
  body.print-visite-cps-enfant #zone-impression-visite-enfant { display: block !important; }
}
@media screen {
  #zone-impression-visite-enfant { display: none; }
}
`

const LABELS_VISITE = {
  SIX_HEURES: 'Visite 6 heures', SIX_JOURS: 'Visite 6 jours', SIX_SEMAINES: 'Visite 6 semaines',
  M2: 'Visite 2 mois', M3: 'Visite 3 mois', M6: 'Visite 6 mois',
  M9: 'Visite 9 mois', M12: 'Visite 12 mois', SURPRISE: 'Visite surprise',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

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

function PageDetailVisiteCpsEnfant() {
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
    const id = 'styles-impression-visite-cps-enfant'
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
      serviceCpsEnfant.obtenirVisite(dossierId, visiteId),
      serviceCpsEnfant.obtenirDossier(dossierId),
    ])
      .then(([v, d]) => { if (actif) { setVisite(v); setDossier(d) } })
      .catch((e) => { if (actif) setErreur(e.message) })
      .finally(() => { if (actif) setChargement(false) })
    if (location.state?.messageSucces) {
      window.history.replaceState({ ...location.state, messageSucces: undefined }, '')
    }
    return () => { actif = false }
  }, [dossierId, visiteId])

  useEffect(() => {
    if (!messageSucces) return
    const t = setTimeout(() => setMessageSucces(''), 4000)
    return () => clearTimeout(t)
  }, [messageSucces])

  const nomEnfant = dossier?.enfant
    ? [dossier.enfant.nom, dossier.enfant.postnom, dossier.enfant.prenom].filter(Boolean).join(' ')
    : dossier?.mereNom ? `Enfant de ${dossier.mereNom}` : '—'

  if (chargement) {
    return (
      <div className="flex items-center gap-2 py-10 text-on-surface-variant text-sm">
        <span className="material-symbols-outlined animate-spin">refresh</span> Chargement...
      </div>
    )
  }
  if (erreur || !visite) {
    return (
      <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
        {erreur || 'Visite introuvable.'}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div id="contenu-page-visite-enfant">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour au dossier
      </button>

      {messageSucces && (
        <div className="flex items-center gap-3 rounded-2xl bg-tertiary-container/60 px-5 py-3.5 text-sm font-medium text-on-tertiary-container backdrop-blur">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {messageSucces}
        </div>
      )}

      {/* En-tête gradient */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary-container/20 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">CPS Enfant · {fmtDate(visite.dateVisite)}</p>
          <h2 className="text-3xl font-extrabold text-on-background tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {LABELS_VISITE[visite.typeVisite] ?? visite.typeVisite}
          </h2>
          {dossier && (
            <p className="text-sm text-on-surface-variant">{dossier.numeroDossierCps} · {nomEnfant}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest py-2 shadow-lg">
                <button
                  onClick={() => { setMenuImpressionOuvert(false); document.body.classList.add('print-visite-cps-enfant'); window.print(); document.body.classList.remove('print-visite-cps-enfant') }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-base text-primary">description</span>
                  Visite complète
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Anthropométrie */}
      <SectionDetail icone="monitor_weight" couleurIcone="text-tertiary" titre="1. Anthropométrie"
        enfants={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ChampLecture label="Poids" valeur={visite.poidsKg ? `${visite.poidsKg} kg` : null} />
            <ChampLecture label="Taille" valeur={visite.tailleCm ? `${visite.tailleCm} cm` : null} />
            <ChampLecture label="Périmètre crânien" valeur={visite.perimetreCranienCm ? `${visite.perimetreCranienCm} cm` : null} />
          </div>
        }
      />

      {/* 2. Signes vitaux */}
      <SectionDetail icone="favorite" couleurIcone="text-secondary" titre="2. Signes vitaux"
        enfants={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ChampLecture label="Température" valeur={visite.temperatureCelsius ? `${visite.temperatureCelsius} °C` : null} />
            <ChampLecture label="Fréquence cardiaque" valeur={visite.frequenceCardiaque ? `${visite.frequenceCardiaque} bpm` : null} />
            <ChampLecture label="Fréquence respiratoire" valeur={visite.frequenceRespiratoire ? `${visite.frequenceRespiratoire} /min` : null} />
          </div>
        }
      />

      {/* 3. Examen néonatal */}
      <SectionDetail icone="stethoscope" couleurIcone="text-primary" titre="3. Examen néonatal"
        enfants={
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <ChampLecture label="État général" valeur={visite.etatGeneral} />
              <ChampLecture label="Allaitement" valeur={visite.allaitement} />
              <ChampLecture label="Couleur peau" valeur={visite.couleurPeau} />
              <ChampLecture label="État cordon" valeur={visite.etatCordon} />
              <ChampLecture label="Dév. psychomoteur" valeur={visite.developpementPsychomoteur} />
            </div>
            <hr className="border-surface-container-high" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              <TuileBool label="Œdèmes" valeur={visite.oedemes} />
              <TuileBool label="Ictère" valeur={visite.ictere} />
              <TuileBool label="Convulsions" valeur={visite.convulsions} couleurVrai="text-error" />
            </div>
          </div>
        }
      />

      {/* 4. Vaccinations */}
      <SectionDetail icone="vaccines" couleurIcone="text-primary" titre="4. Vaccinations administrées"
        enfants={
          visite.vaccinsAdministres ? (
            <div className="flex flex-wrap gap-2">
              {visite.vaccinsAdministres.split(',').map((v) => v.trim()).filter(Boolean).map((label) => (
                <span key={label} className="rounded-xl bg-tertiary-container px-4 py-2 text-sm font-medium text-on-tertiary-container">{label}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-on-surface-variant/60">Aucun vaccin enregistré</p>
          )
        }
      />

      {/* 5. Conduite à tenir */}
      {(visite.conduiteATenir || visite.traitementPrescrit) && (
        <SectionDetail icone="medical_services" couleurIcone="text-primary" titre="5. Conduite à tenir"
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

      {/* 6. Suivi */}
      {(visite.prochainRdvDate || visite.observations) && (
        <SectionDetail icone="event_upcoming" couleurIcone="text-secondary" titre="6. Suivi"
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
      </div>{/* fin contenu-page-visite-enfant */}

      {/* Zone imprimable */}
      <ZoneImpressionVisiteEnfant visite={visite} dossier={dossier} nomEnfant={nomEnfant} />
    </div>
  )
}

export default PageDetailVisiteCpsEnfant

/* ─── Zone imprimable : visite complète ─── */
function ZoneImpressionVisiteEnfant({ visite, dossier, nomEnfant }) {
  if (!visite) return null
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateVisite = fmtDate(visite.dateVisite)

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
    <div id="zone-impression-visite-enfant" style={{ fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: 0 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: 10, background: '#005eb8', padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>&#10010;</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Centre de Santé Afia Himbi</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Consultation Postnatale — CPS Enfant</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>FICHE DE VISITE CPS ENFANT</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{({ SIX_HEURES: 'Visite 6 heures', SIX_JOURS: 'Visite 6 jours', SIX_SEMAINES: 'Visite 6 semaines', M2: 'Visite 2 mois', M3: 'Visite 3 mois', M6: 'Visite 6 mois', M9: 'Visite 9 mois', M12: 'Visite 12 mois', SURPRISE: 'Visite surprise' })[visite.typeVisite] ?? visite.typeVisite} — {dateVisite}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Imprimé le {dateNow}</div>
        </div>
      </div>
      {/* Identité */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Enfant</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{nomEnfant}</div>
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
      {section('1. Anthropométrie', [
        ligne('Poids', visite.poidsKg != null ? `${visite.poidsKg} kg` : null),
        ligne('Taille', visite.tailleCm != null ? `${visite.tailleCm} cm` : null),
        ligne('Périmètre crânien', visite.perimetreCranienCm != null ? `${visite.perimetreCranienCm} cm` : null),
      ])}
      {section('2. Signes vitaux', [
        ligne('Température', visite.temperatureCelsius != null ? `${visite.temperatureCelsius} °C` : null),
        ligne('Fréquence cardiaque', visite.frequenceCardiaque != null ? `${visite.frequenceCardiaque} bpm` : null),
        ligne('Fréquence respiratoire', visite.frequenceRespiratoire != null ? `${visite.frequenceRespiratoire} /min` : null),
      ])}
      {section('3. Examen néonatal', [
        ligne('État général', visite.etatGeneral),
        ligne('Allaitement', visite.allaitement),
        ligne('Couleur peau', visite.couleurPeau),
        ligne('État cordon', visite.etatCordon),
        ligne('Dév. psychomoteur', visite.developpementPsychomoteur),
        visite.oedemes != null ? ligne('Œdèmes', bool(visite.oedemes)) : null,
        visite.ictere != null ? ligne('Ictère', bool(visite.ictere)) : null,
        visite.convulsions != null ? ligne('Convulsions', bool(visite.convulsions)) : null,
      ])}
      {visite.vaccinsAdministres && section('4. Vaccinations administrées', [
        <tr key="vacc" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <td colSpan={2} style={{ padding: '5px 8px', fontSize: 11 }}>{visite.vaccinsAdministres}</td>
        </tr>
      ])}
      {(visite.conduiteATenir || visite.traitementPrescrit) && section('5. Conduite à tenir / Traitement', [
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
      {(visite.prochainRdvDate || visite.observations) && section('6. Suivi', [
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
