// Page dédiée aux examens biologiques et échographies d'un dossier CPS Enfant (suivi postnatal enfant).
// Interface identique à la page examens CPN : filtres pills, cards, formulaire de demande.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpsEnfant from '../../../services/api/serviceCpsEnfant'

function formaterDateCourte(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Badge statut ──────────────────────────────────────────────────────────────
function BadgeStatut({ statut, typeExamen }) {
  if (statut === 'RESULTAT_RECU' || statut === 'RESULTAT_ENVOYE') {
    return (
      <span className="rounded-full bg-tertiary-container px-2.5 py-0.5 text-[11px] font-semibold text-on-tertiary-container">
        {typeExamen === 'ECHOGRAPHIE' ? 'Interprété' : 'Résultat reçu'}
      </span>
    )
  }
  if (statut === 'EN_COURS') {
    return (
      <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[11px] font-semibold text-on-secondary-container">
        En cours au labo
      </span>
    )
  }
  return (
    <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
      En attente
    </span>
  )
}

// ── Icône selon type ──────────────────────────────────────────────────────────
function iconeExamen(typeExamen, statut) {
  const recu = statut === 'RESULTAT_RECU' || statut === 'RESULTAT_ENVOYE'
  if (recu) return 'task_alt'
  if (typeExamen === 'ECHOGRAPHIE') return 'ecg'
  if (typeExamen === 'BIOLOGIQUE') return 'biotech'
  return 'hourglass_top'
}

// ── Panneau interprétation échographie ───────────────────────────────────────
function PanneauInterpretation({ examen, dossierId, onTermine, onAnnuler }) {
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const soumettre = async () => {
    if (!texte.trim()) { setErreur("L'interprétation est obligatoire."); return }
    setEnvoi(true)
    setErreur('')
    try {
      await serviceCpsEnfant.entrerInterpretation(dossierId, examen.id, { interpretation: texte })
      onTermine()
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-outline-variant/50 bg-secondary-container/10 p-4 space-y-3">
      <p className="text-[12px] font-bold text-on-surface">
        Interprétation — {examen.libelle}
      </p>
      <textarea
        rows={5}
        autoFocus
        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        placeholder="Saisissez l'interprétation de l'échographie…"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
      />
      {erreur && <p className="text-xs text-error">{erreur}</p>}
      <div className="flex gap-2">
        <button
          onClick={soumettre}
          disabled={envoi}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">save</span>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={onAnnuler}
          className="rounded-full bg-surface-container px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Formulaire demande d'examen ───────────────────────────────────────────────
function FormulaireDemandeExamen({ dossierId, onTermine, onAnnuler }) {
  const [typeExamen, setTypeExamen] = useState('BIOLOGIQUE')
  const [libelle, setLibelle] = useState('')
  const [notes, setNotes] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const soumettre = async (e) => {
    e.preventDefault()
    if (!libelle.trim()) { setErreur('Le libellé est obligatoire.'); return }
    setEnvoi(true)
    setErreur('')
    try {
      await serviceCpsEnfant.demanderExamen(dossierId, { typeExamen, libelle: libelle.trim(), notes: notes.trim() || null })
      onTermine()
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-on-surface">Nouvelle demande d'examen</h3>
      <form onSubmit={soumettre} className="space-y-4">
        <div className="flex gap-3">
          {['BIOLOGIQUE', 'ECHOGRAPHIE'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeExamen(t)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${typeExamen === t ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined text-[16px]">{t === 'BIOLOGIQUE' ? 'biotech' : 'ecg'}</span>
              {t === 'BIOLOGIQUE' ? 'Biologique' : 'Échographie'}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Libellé *</label>
          <input
            type="text"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex : NFS, Glycémie, Écho abdominale…"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Notes (optionnel)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            placeholder="Indication clinique…"
          />
        </div>
        {erreur && <p className="text-xs text-error">{erreur}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={envoi}
            className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            {envoi ? 'Envoi…' : 'Envoyer la demande'}
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-full bg-surface-container px-5 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Carte examen ──────────────────────────────────────────────────────────────
function CarteExamen({ examen, dossierId, onRecharger, dossierStatut }) {
  const [panneauOuvert, setPanneauOuvert] = useState(false)

  const estEcho = examen.typeExamen === 'ECHOGRAPHIE'
  const estBio = examen.typeExamen === 'BIOLOGIQUE'
  const enAttente = examen.statut === 'DEMANDE' || examen.statut === 'EN_COURS'
  const recu = examen.statut === 'RESULTAT_RECU' || examen.statut === 'RESULTAT_ENVOYE'

  const couleurBordure = estEcho ? 'border-outline-variant/50' : recu ? 'border-outline-variant/50' : 'border-outline-variant/40'
  const couleurFond = estEcho ? 'bg-secondary-container/10' : recu ? 'bg-tertiary-container/5' : 'bg-surface'

  return (
    <div className={`rounded-2xl border ${couleurBordure} ${couleurFond} px-5 py-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${recu ? 'bg-tertiary-container/40 text-tertiary' : estEcho ? 'bg-secondary-container/50 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-xl">{iconeExamen(examen.typeExamen, examen.statut)}</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-on-surface">{examen.libelle}</p>
              {estEcho && <span className="rounded-full bg-secondary-container/60 px-2 py-0.5 text-[10px] font-bold text-secondary">Échographie</span>}
              {estBio && <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">Biologique</span>}
            </div>
            <p className="text-xs text-on-surface-variant">
              {examen.source}
              {examen.dateExamen ? ` · ${formaterDateCourte(examen.dateExamen)}` : ''}
              {examen.creeLe ? ` · Demandé le ${formaterDateCourte(examen.creeLe)}` : ''}
            </p>
            {estEcho && enAttente && <p className="text-[11px] text-secondary/80 italic">En attente des images</p>}
            {estBio && examen.statut === 'EN_COURS' && <p className="text-[11px] text-on-surface-variant italic">Pris en charge au laboratoire</p>}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <BadgeStatut statut={examen.statut} typeExamen={examen.typeExamen} />
          {estEcho && enAttente && dossierStatut === 'OUVERT' && (
            <button
              onClick={() => setPanneauOuvert((v) => !v)}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              {panneauOuvert ? 'Fermer' : 'Interpréter'}
            </button>
          )}
        </div>
      </div>

      {recu && examen.resultat && (
        <div className="mt-5 ml-14">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {estEcho ? 'Interprétation' : 'Résultat'}
          </span>
          <div className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{examen.resultat}</div>
          {examen.dateResultat && <p className="mt-2 text-[11px] text-on-surface-variant">Reçu le {formaterDateCourte(examen.dateResultat)}</p>}
        </div>
      )}

      {examen.notes && <div className="mt-2 ml-14 text-xs italic text-on-surface-variant">Note : {examen.notes}</div>}

      {panneauOuvert && (
        <div className="ml-14">
          <PanneauInterpretation
            examen={examen}
            dossierId={dossierId}
            onTermine={() => { setPanneauOuvert(false); onRecharger() }}
            onAnnuler={() => setPanneauOuvert(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
function PageExamensCpsEnfant() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const [dossier, setDossier] = useState(null)
  const [examens, setExamens] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState('TOUS')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  const charger = async () => {
    setChargement(true)
    setErreur('')
    try {
      const [dos, liste] = await Promise.all([
        serviceCpsEnfant.obtenirDossier(dossierId),
        serviceCpsEnfant.listerExamens(dossierId),
      ])
      setDossier(dos)
      setExamens(Array.isArray(liste) ? liste : [])
    } catch (ex) {
      setErreur(ex.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [dossierId])

  const examensFiltres = examens.filter((ex) => {
    if (filtre === 'BIOLOGIQUE') return ex.typeExamen === 'BIOLOGIQUE'
    if (filtre === 'ECHOGRAPHIE') return ex.typeExamen === 'ECHOGRAPHIE'
    if (filtre === 'EN_ATTENTE') return ex.statut === 'DEMANDE' || ex.statut === 'EN_COURS'
    if (filtre === 'RECU') return ex.statut === 'RESULTAT_RECU' || ex.statut === 'RESULTAT_ENVOYE'
    return true
  })

  const nbEchoEnAttente = examens.filter((e) => e.typeExamen === 'ECHOGRAPHIE' && (e.statut === 'DEMANDE' || e.statut === 'EN_COURS')).length
  const nbBioEnAttente = examens.filter((e) => e.typeExamen === 'BIOLOGIQUE' && (e.statut === 'DEMANDE' || e.statut === 'EN_COURS')).length
  const nbRecus = examens.filter((e) => e.statut === 'RESULTAT_RECU' || e.statut === 'RESULTAT_ENVOYE').length

  const FILTRES = [
    { code: 'TOUS', label: 'Tous', count: examens.length },
    { code: 'BIOLOGIQUE', label: 'Biologiques', count: examens.filter((e) => e.typeExamen === 'BIOLOGIQUE').length },
    { code: 'ECHOGRAPHIE', label: 'Échographies', count: examens.filter((e) => e.typeExamen === 'ECHOGRAPHIE').length },
    { code: 'EN_ATTENTE', label: 'En attente', count: examens.filter((e) => e.statut === 'DEMANDE' || e.statut === 'EN_COURS').length },
    { code: 'RECU', label: 'Résultats reçus', count: nbRecus },
  ]

  if (chargement) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined animate-spin">hourglass_top</span>
          <p>Chargement des examens…</p>
        </div>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-16">
        <div className="flex items-center gap-3 rounded-2xl bg-error-container px-6 py-4 text-on-error-container text-sm">
          <span className="material-symbols-outlined">error</span>
          {erreur}
        </div>
        <button onClick={charger} className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-base">refresh</span>
          Réessayer
        </button>
      </div>
    )
  }

  const enfant = dossier?.enfant ?? dossier
  const nomEnfant = enfant ? [enfant.nom, enfant.postnom, enfant.prenom].filter(Boolean).join(' ') : ''
  const numeroDossier = dossier?.numeroDossier ?? dossier?.enfant?.numeroDossier ?? ''

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">

      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour au dossier
      </button>

      {/* Bouton nouvelle demande */}
      {dossier?.statut === 'OUVERT' && !formulaireOuvert && (
        <button
          onClick={() => setFormulaireOuvert(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 shadow-sm"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Nouvelle demande d'examen
        </button>
      )}

      {/* Formulaire */}
      {formulaireOuvert && (
        <FormulaireDemandeExamen
          dossierId={dossierId}
          onTermine={() => { setFormulaireOuvert(false); charger() }}
          onAnnuler={() => setFormulaireOuvert(false)}
        />
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.code}
            onClick={() => setFiltre(f.code)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${filtre === f.code ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filtre === f.code ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {examensFiltres.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container-lowest py-16 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-4xl">biotech</span>
          <p className="text-sm">Aucun examen pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {examensFiltres.map((ex) => (
            <CarteExamen
              key={ex.id}
              examen={ex}
              dossierId={dossierId}
              onRecharger={charger}
              dossierStatut={dossier?.statut}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PageExamensCpsEnfant
