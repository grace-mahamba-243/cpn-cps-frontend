// Page principale du dossier clinique d'un enfant : identité, suivis, nutrition et vaccination.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'
import InfoEnregistrement from '../../../composants/partages/InfoEnregistrement'

function formaterDate(dateIso) {
  if (!dateIso) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

function Champ({ label, valeur }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className="rounded-lg bg-surface-container px-3 py-2 text-sm font-medium text-on-surface">
        {valeur || <span className="italic text-on-surface-variant/50">—</span>}
      </span>
    </div>
  )
}

function BadgeStatut({ statut }) {
  const styles = {
    OUVERT: 'bg-primary/10 text-primary',
    CLOS: 'bg-error/10 text-error',
  }
  return (
    <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${styles[statut] ?? 'bg-surface-container text-on-surface-variant'}`}>
      {statut}
    </span>
  )
}

function SectionTitre({ icone, titre, action, onAction }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icone}</span>
        <h3 className="font-headline text-base font-bold text-on-surface">{titre}</h3>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-[12px] font-semibold text-on-primary transition-colors hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          {action}
        </button>
      )}
    </div>
  )
}

function LigneTableau({ colonnes, className }) {
  return (
    <tr className={className}>
      {colonnes.map((c, i) => (
        <td key={i} className="px-4 py-3 text-sm text-on-surface">
          {c}
        </td>
      ))}
    </tr>
  )
}

function TableauVide({ message }) {
  return (
    <p className="rounded-xl bg-surface-container px-4 py-6 text-center text-sm italic text-on-surface-variant">
      {message}
    </p>
  )
}

export default function PageDossierEnfantDetail() {
  const { enfantId } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    setChargement(true)
    serviceDossiersEnfants
      .recupererResume(enfantId)
      .then((data) => { if (actif) setResume(data) })
      .catch((ex) => { if (actif) setErreur(ex.message) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [enfantId])

  if (chargement) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Chargement du dossier…
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="rounded-2xl bg-error-container p-6 text-on-error-container">
        <p className="font-semibold">Erreur : {erreur}</p>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="rounded-2xl bg-surface-container p-6 text-on-surface-variant">
        Dossier introuvable.
      </div>
    )
  }

  const statusVaccin = { ADMINISTREE: 'text-primary', DIFFEREE: 'text-tertiary', REFUSEE: 'text-error' }
  const nomComplet = [resume.nom, resume.postnom, resume.prenom].filter(Boolean).join(' ')
  const dateAujourdhui = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return (
    <>
    <div className="screen-only space-y-8">
      {/* Bouton Imprimer */}
      <div className="no-print flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          onClick={() => window.print()}
        >
          <span className="material-symbols-outlined text-base">print</span>
          Imprimer
        </button>
      </div>
      {/* Bandeau identité */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dim p-8 text-on-primary shadow-md">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-md">
              <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {resume.sexe === 'F' ? 'face_3' : 'face'}
              </span>
            </div>
            <div>
              <h2 className="font-headline text-2xl font-extrabold leading-tight">
                {[resume.nom, resume.postnom, resume.prenom].filter(Boolean).join(' ')}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold tracking-wide">
                  {resume.numeroDossier || resume.numeroFiche}
                </span>
                <BadgeStatut statut={resume.statut} />
                {resume.sexe && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold">
                    {resume.sexe === 'M' ? 'Masculin' : 'Féminin'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="min-w-[190px] rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-70">Né(e) le</p>
            <p className="font-headline text-lg font-bold">{formaterDate(resume.dateNaissance)}</p>
            {resume.lieuNaissance && <p className="mt-0.5 text-xs opacity-80">{resume.lieuNaissance}</p>}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
      </section>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icone: 'monitor_heart', titre: 'Suivis', badge: (resume.suivis ?? []).length, couleur: 'bg-primary/10 text-primary', lien: 'suivis/nouveau' },
          { icone: 'vaccines', titre: 'Vaccination', badge: (resume.vaccinations ?? []).length, couleur: 'bg-secondary/10 text-secondary', lien: 'vaccinations/nouvelle' },
          { icone: 'biotech', titre: 'Examens', badge: null, couleur: 'bg-on-surface/10 text-on-surface-variant', lien: 'examens' },
        ].map(({ icone, titre, badge, couleur, lien }) => (
          <button
            key={titre}
            onClick={() => navigate(lien)}
            className="group relative flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${couleur}`}>
              <span className="material-symbols-outlined text-2xl">{icone}</span>
            </div>
            <p className="text-sm font-bold text-on-surface">{titre}</p>
            <span className="absolute right-3 top-3 rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-bold text-on-surface-variant">
              {badge}
            </span>

          </button>
        ))}
      </div>

      {/* Données naissance */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre icone="info" titre="Données à la naissance" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Champ label="Poids (g)" valeur={resume.poidsNaissanceG} />
          <Champ label="Score Apgar 1 min" valeur={resume.scoreApgar1min} />
          <Champ label="Score Apgar 5 min" valeur={resume.scoreApgar5min} />
          <Champ label="État naissance" valeur={resume.etatNaissance} />
          <Champ label="Âge gestationnel (sem.)" valeur={resume.ageGestationnelSemaines} />
          <Champ label="Lieu de naissance" valeur={resume.lieuNaissance} />
        </div>
      </section>

      {/* Suivis cliniques */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre
          icone="monitor_heart"
          titre="Suivis cliniques"
          action="Nouveau suivi"
          onAction={() => navigate('suivis/nouveau')}
        />
        {(resume.suivis ?? []).length === 0 ? (
          <TableauVide message="Aucun suivi clinique enregistré." />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 pb-3">Date</th>
                <th className="px-4 pb-3">Poids (kg)</th>
                <th className="px-4 pb-3">Taille (cm)</th>
                <th className="px-4 pb-3">Diagnostics</th>
                <th className="px-4 pb-3">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {resume.suivis.map((s, i) => (
                <LigneTableau
                  key={s.id ?? i}
                  className={i % 2 === 0 ? '' : 'bg-surface-container/30'}
                  colonnes={[
                    formaterDate(s.dateVisite),
                    s.poidsKg ?? '—',
                    s.tailleCm ?? '—',
                    s.diagnostics || '—',
                    s.agentSante || '—',
                  ]}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Vaccination */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre
          icone="vaccines"
          titre="Calendrier vaccinal"
          action="Enregistrer une dose"
          onAction={() => navigate('vaccinations/nouvelle')}
        />
        {(resume.vaccinations ?? []).length === 0 ? (
          <TableauVide message="Aucune dose vaccinale enregistrée." />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 pb-3">Vaccin</th>
                <th className="px-4 pb-3">Dose</th>
                <th className="px-4 pb-3">Date</th>
                <th className="px-4 pb-3">Âge (mois)</th>
                <th className="px-4 pb-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {resume.vaccinations.map((v, i) => (
                <tr key={v.id ?? i} className={i % 2 === 0 ? '' : 'bg-surface-container/30'}>
                  <td className="px-4 py-3 text-sm font-medium">{v.vaccin}</td>
                  <td className="px-4 py-3 text-sm">{v.numeroDose}</td>
                  <td className="px-4 py-3 text-sm">{formaterDate(v.dateAdministration)}</td>
                  <td className="px-4 py-3 text-sm">{v.ageMois ?? '—'}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${statusVaccin[v.statut] ?? ''}`}>{v.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <InfoEnregistrement enregistrePar={resume?.enregistrePar} modifiePar={resume?.modifiePar} />
    </div>

    {/* ============================================================
        RAPPORT D'IMPRESSION — masqué à l'écran, visible uniquement à l'impression
        ============================================================ */}
    <div className="print-only" style={{ fontFamily: 'Inter, sans-serif', background: 'white', color: '#191c1d', padding: '0', position: 'relative', overflow: 'hidden' }}>

      {/* En-tête du document */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', background: '#005eb8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '32px' }}>child_care</span>
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#00478d', margin: 0, letterSpacing: '-0.5px' }}>Centre de Santé Afia Himbi</h1>
            <p style={{ color: '#424752', fontWeight: 600, fontSize: '12px', margin: '2px 0' }}>Unité de Soins Pédiatriques et Postnatals</p>
            <p style={{ color: '#424752', fontSize: '11px', margin: '4px 0 0 0', lineHeight: '1.5' }}>
              Goma, Nord-Kivu, République Démocratique du Congo<br />
              +243 000 000 000
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d5e4f7', color: '#526070', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '99px', marginBottom: '6px' }}>Dossier Enfant Officiel</span>
          <p style={{ color: '#424752', fontSize: '11px', margin: '2px 0' }}>N° Dossier : <strong style={{ color: '#191c1d' }}>{resume.numeroDossier || resume.numeroFiche}</strong></p>
          <p style={{ color: '#424752', fontSize: '11px', margin: '2px 0' }}>Date : <strong style={{ color: '#191c1d' }}>{dateAujourdhui}</strong></p>
        </div>
      </div>

      {/* Identification de l'enfant */}
      <div style={{ background: '#f3f4f5', borderRadius: '8px', padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, margin: '0 0 4px 0' }}>Nom de l'enfant</p>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#00478d', margin: 0, fontFamily: 'Manrope, sans-serif' }}>{nomComplet || 'Non renseigné'}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', borderLeft: '1px solid #c2c6d4', paddingLeft: '24px' }}>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Date de naissance</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{formaterDate(resume.dateNaissance)}</p>
          </div>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Sexe</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{resume.sexe === 'M' ? 'Masculin' : resume.sexe === 'F' ? 'Féminin' : '—'}</p>
          </div>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Lieu de naissance</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{resume.lieuNaissance || '—'}</p>
          </div>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Statut</p>
            <p style={{ fontSize: '11px', fontWeight: 700, color: resume.statut === 'OUVERT' ? '#00478d' : '#b3261e', margin: 0 }}>{resume.statut || '—'}</p>
          </div>
        </div>
      </div>

      {/* Données à la naissance */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>Données à la naissance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Poids (g)</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{resume.poidsNaissanceG || '—'}</p>
          </div>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Score Apgar 1 min</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{resume.scoreApgar1min ?? '—'}</p>
          </div>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Score Apgar 5 min</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{resume.scoreApgar5min ?? '—'}</p>
          </div>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>État à la naissance</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{resume.etatNaissance || '—'}</p>
          </div>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Âge gestationnel (sem.)</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{resume.ageGestationnelSemaines ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Suivis cliniques */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>Suivis cliniques</h3>
        {(resume.suivis ?? []).length === 0 ? (
          <p style={{ color: '#424752', fontSize: '12px', fontStyle: 'italic' }}>Aucun suivi clinique enregistré.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f3f4f5' }}>
                {['Date', 'Poids (kg)', 'Taille (cm)', 'Diagnostics', 'Agent'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', borderBottom: '2px solid #e1e3e4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resume.suivis.map((s, i) => (
                <tr key={s.id ?? i} style={{ background: i % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}>
                  <td style={{ padding: '6px 10px', color: '#424752' }}>{formaterDate(s.dateVisite)}</td>
                  <td style={{ padding: '6px 10px', color: '#191c1d', fontWeight: 600 }}>{s.poidsKg ?? '—'}</td>
                  <td style={{ padding: '6px 10px', color: '#191c1d' }}>{s.tailleCm ?? '—'}</td>
                  <td style={{ padding: '6px 10px', color: '#424752' }}>{s.diagnostics || '—'}</td>
                  <td style={{ padding: '6px 10px', color: '#424752' }}>{s.agentSante || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Calendrier vaccinal */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>Calendrier vaccinal</h3>
        {(resume.vaccinations ?? []).length === 0 ? (
          <p style={{ color: '#424752', fontSize: '12px', fontStyle: 'italic' }}>Aucune dose vaccinale enregistrée.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f3f4f5' }}>
                {['Vaccin', 'Dose', 'Date', 'Âge (mois)', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', borderBottom: '2px solid #e1e3e4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resume.vaccinations.map((v, i) => (
                <tr key={v.id ?? i} style={{ background: i % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600, color: '#191c1d' }}>{v.vaccin}</td>
                  <td style={{ padding: '6px 10px', color: '#424752' }}>{v.numeroDose}</td>
                  <td style={{ padding: '6px 10px', color: '#424752' }}>{formaterDate(v.dateAdministration)}</td>
                  <td style={{ padding: '6px 10px', color: '#424752' }}>{v.ageMois ?? '—'}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: v.statut === 'ADMINISTREE' ? '#00478d' : v.statut === 'REFUSEE' ? '#b3261e' : '#6e5e0e' }}>{v.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pied de page */}
      <div style={{ borderTop: '1px solid #e1e3e4', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 8px 0' }}>Signature autorisée</p>
          <div style={{ height: '48px', width: '200px', background: '#f3f4f5', borderRadius: '4px', borderBottom: '2px solid rgba(0,71,141,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', color: 'rgba(0,71,141,0.6)', fontSize: '18px', fontStyle: 'italic' }}>Centre Afia Himbi</span>
          </div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#191c1d', margin: '0' }}>Centre de Santé Afia Himbi</p>
          <p style={{ fontSize: '10px', color: '#424752', margin: '0' }}>Service Pédiatrie — Goma, RDC</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00478d', display: 'inline-block' }}></span>
            <p style={{ fontSize: '9px', color: '#424752', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: 0 }}>Document officiel vérifié</p>
          </div>
          <p style={{ fontSize: '10px', color: '#424752', margin: '0' }}>Page 1 sur 1</p>
        </div>
      </div>

      {/* Bande décorative en bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #00478d, #005eb8, #526070)' }} />
    </div>
    </>
  )
}
