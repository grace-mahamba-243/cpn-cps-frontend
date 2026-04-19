// Page principale du dossier clinique d'un enfant : identité, suivis, nutrition et vaccination.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceDossiersEnfants from '../../../services/api/serviceDossiersEnfants'

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

  return (
    <div className="space-y-8">
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
          { icone: 'nutrition', titre: 'Nutrition', badge: (resume.nutritions ?? []).length, couleur: 'bg-tertiary/10 text-tertiary', lien: 'nutritions/nouvelle' },
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

      {/* Nutrition */}
      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <SectionTitre
          icone="nutrition"
          titre="Évaluations nutritionnelles"
          action="Nouvelle évaluation"
          onAction={() => navigate('nutritions/nouvelle')}
        />
        {(resume.nutritions ?? []).length === 0 ? (
          <TableauVide message="Aucune évaluation nutritionnelle enregistrée." />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 pb-3">Date</th>
                <th className="px-4 pb-3">Poids (kg)</th>
                <th className="px-4 pb-3">Z-score P/A</th>
                <th className="px-4 pb-3">Statut nutritionnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {resume.nutritions.map((n, i) => (
                <LigneTableau
                  key={n.id ?? i}
                  className={i % 2 === 0 ? '' : 'bg-surface-container/30'}
                  colonnes={[
                    formaterDate(n.dateEvaluation),
                    n.poidsKg ?? '—',
                    n.zScorePourAge != null ? n.zScorePourAge : '—',
                    n.statutNutritionnel || '—',
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
    </div>
  )
}
