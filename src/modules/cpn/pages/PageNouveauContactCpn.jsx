// Ce composant affiche le formulaire pour enregistrer ou modifier un contact CPN (constantes, dépistage, suivi obstétrical).
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'
import useAuthentification from '../../authentification/hooks/useAuthentification'

const ETAT_INITIAL = {
  dateContact: new Date().toISOString().slice(0, 10),
  etatGeneral: '',
  observations: '',
  ageGestationnel: '',
  poids: '',
  perimetreBrachial: '',
  temperature: '',
  tensionArterielle: '',
  frequenceCardiaqueMore: '',
  proteInurie: '',
  paleur: false,
  oedemes: false,
  mouvementsActifs: '',
  bfc: '',
  hauteurUterine: 28,
  presentationFoetale: '',
  ecoulementVaginal: false,
  ulcerationsGenitales: false,
  etatDuCol: '',
  decisionFinale: '',
  prochainRdvDate: '',
}

const MEDICAMENT_VIDE = () => ({ id: Date.now(), nom: '', dose: '', duree: '' })
const EXAMEN_VIDE = () => ({ id: Date.now(), libelle: '', type: 'BIOLOGIQUE' })

function NumeriqueOuNull(valeur) {
  return valeur !== '' && valeur !== null && valeur !== undefined ? Number(valeur) : null
}

function BooleanOuNull(valeur) {
  if (valeur === 'true') return true
  if (valeur === 'false') return false
  return null
}

function PageNouveauContactCpn() {
  const { dossierId, contactId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const modeEdition = !!contactId
  const { utilisateurConnecte } = useAuthentification()
  const messageInfo = location.state?.messageInfo ?? ''
  const [formulaire, setFormulaire] = useState(ETAT_INITIAL)
  const [dossier, setDossier] = useState(null)
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [analyse, setAnalyse] = useState(null)
  const [analyseEnCours, setAnalyseEnCours] = useState(false)
  const [avisAccepte, setAvisAccepte] = useState(null)
  const [erreurAnalyse, setErreurAnalyse] = useState('')
  const [medicaments, setMedicaments] = useState([])
  const [examensADemander, setExamensADemander] = useState([])
  const [examensExistants, setExamensExistants] = useState([]) // examens déjà enregistrés pour ce dossier
  const [nouveauMed, setNouveauMed] = useState(MEDICAMENT_VIDE())
  const [nouvelExamen, setNouvelExamen] = useState(EXAMEN_VIDE())

  useEffect(() => {
    serviceCpn.obtenirDossier(dossierId).then((d) => {
      setDossier(d)
      // Bloquer l'accès si le dossier est clos
      if (d?.statut === 'CLOS') {
        navigate(`/cpn/${dossierId}`, { replace: true })
      }
    }).catch(() => {})
    // En mode edition, charger le contact existant pour pre-remplir le formulaire
    // Charger les examens existants pour détecter les doublons (mode édition et création)
    serviceCpn.listerExamens(dossierId).then((liste) => setExamensExistants(liste)).catch(() => {})

    if (modeEdition && contactId) {
      serviceCpn.obtenirContact(dossierId, contactId).then((c) => {
        if (!c) return
        // Reconstruire la tension arterielle depuis systolique/diastolique
        const ta = (c.tensionSystolique && c.tensionDiastolique)
          ? `${c.tensionSystolique}/${c.tensionDiastolique}`
          : ''
        setFormulaire((f) => ({
          ...f,
          dateContact: c.dateContact ?? f.dateContact,
          etatGeneral: c.etatGeneral ?? '',
          observations: c.observations ?? '',
          ageGestationnel: c.ageGestationnel ?? '',
          poids: c.poids ?? '',
          perimetreBrachial: c.perimetreBrachial ?? '',
          temperature: c.temperature ?? '',
          tensionArterielle: ta,
          frequenceCardiaqueMore: c.frequenceCardiaqueMore ?? '',
          proteInurie: c.proteInurie ?? '',
          paleur: c.paleur ?? false,
          oedemes: c.oedemes ?? false,
          mouvementsActifs: c.mouvementsActifs != null ? String(c.mouvementsActifs) : '',
          bfc: c.bfc ?? '',
          hauteurUterine: c.hauteurUterine ?? 28,
          presentationFoetale: c.presentationFoetale ?? '',
          ecoulementVaginal: c.ecoulementVaginal ?? false,
          ulcerationsGenitales: c.ulcerationsGenitales ?? false,
          etatDuCol: c.etatDuCol ?? '',
          decisionFinale: c.decisionFinale ?? '',
          prochainRdvDate: c.prochainRdvDate ?? '',
        }))
      }).catch(() => {})
    }
  }, [dossierId, contactId])

  const maj = (champ, valeur) => setFormulaire((f) => ({ ...f, [champ]: valeur }))

  const construireTraitement = () => {
    const lignes = []
    if (medicaments.length > 0) {
      lignes.push('=== MÉDICAMENTS ===')
      medicaments.forEach((m) => {
        if (m.nom.trim()) lignes.push(`• ${m.nom}${m.dose ? ' — ' + m.dose : ''}${m.duree ? ' — ' + m.duree : ''}`)
      })
    }
    if (formulaire.decisionFinale.trim()) {
      if (lignes.length > 0) lignes.push('')
      lignes.push('=== DÉCISION FINALE ===')
      lignes.push(formulaire.decisionFinale.trim())
    }
    return lignes.length > 0 ? lignes.join('\n') : null
  }

  const ajouterMedicament = () => {
    if (!nouveauMed.nom.trim()) return
    setMedicaments((prev) => [...prev, { ...nouveauMed, id: Date.now() }])
    setNouveauMed(MEDICAMENT_VIDE())
  }

  const supprimerMedicament = (id) => setMedicaments((prev) => prev.filter((m) => m.id !== id))

  const ajouterExamen = () => {
    const libelle = nouvelExamen.libelle.trim()
    if (!libelle) return
    // Vérifier doublon dans la liste déjà ajoutée localement
    const dejaEnLocal = examensADemander.some(
      (e) => e.libelle.trim().toLowerCase() === libelle.toLowerCase()
    )
    if (dejaEnLocal) return // silencieux, le bouton sera désactivé
    // Vérifier doublon avec les examens déjà enregistrés pour ce dossier
    const dejaEnBase = examensExistants.some(
      (e) => e.libelle.trim().toLowerCase() === libelle.toLowerCase()
    )
    if (dejaEnBase) return // même traitement
    setExamensADemander((prev) => [...prev, { ...nouvelExamen, id: Date.now() }])
    setNouvelExamen(EXAMEN_VIDE())
  }

  const supprimerExamen = (id) => setExamensADemander((prev) => prev.filter((e) => e.id !== id))

  const imprimerOrdo = () => {
    const p = dossier?.patiente
    const patienteNom = p ? [p.nom, p.postnom, p.prenom].filter(Boolean).join(' ') : 'Patiente inconnue'
    const nomPrestataire = utilisateurConnecte?.nomAffichage ?? 'Prestataire'
    const numeroDossier = dossier?.numeroDossierCpn ?? ''
    const date = new Date(formulaire.dateContact).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const lignesMeds = medicaments
      .filter((m) => m.nom.trim())
      .map((m, i) => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${i + 1}. ${m.nom}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#374151;">${m.dose || '—'}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#374151;">${m.duree || '—'}</td>
        </tr>`).join('')
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Ordonnance — ${patienteNom}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #1a56db; margin-bottom: 24px; }
    .hopital { font-size: 13px; color: #6b7280; }
    .hopital strong { font-size: 16px; color: #111827; display: block; margin-bottom: 4px; }
    .badge { background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 8px 16px; text-align: right; }
    .badge .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
    .badge .value { font-size: 14px; font-weight: 700; color: #1a56db; }
    .patiente { background: #f9fafb; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; gap: 40px; }
    .patiente .field .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
    .patiente .field .value { font-size: 15px; font-weight: 600; color: #111827; margin-top: 2px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #1a56db; color: #fff; }
    thead th { padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .decision { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; white-space: pre-wrap; font-size: 13px; color: #374151; line-height: 1.6; margin-bottom: 24px; }
    .footer { border-top: 2px solid #1a56db; margin-top: 32px; padding-top: 16px; display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
    .signature { text-align: right; }
    .signature .ligne { width: 160px; border-top: 1px solid #374151; margin-top: 48px; padding-top: 6px; font-size: 12px; color: #374151; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="hopital">
      <strong>Hôpital de Référence de Himbi</strong>
      Goma, Nord-Kivu — République Démocratique du Congo
    </div>
    <div class="badge">
      <div class="label">Ordonnance CPN</div>
      <div class="value">${numeroDossier}</div>
    </div>
  </div>

  <div class="patiente">
    <div class="field">
      <div class="label">Nom de la patiente</div>
      <div class="value">${patienteNom}</div>
    </div>
    <div class="field">
      <div class="label">Date de la visite</div>
      <div class="value">${date}</div>
    </div>
    <div class="field">
      <div class="label">Contact CPN</div>
      <div class="value">${(dossier?.nombreContacts ?? 0) + 1}</div>
    </div>
  </div>

  <h2>Médicaments prescrits</h2>
  <table>
    <thead><tr><th>Médicament</th><th>Dose / Posologie</th><th>Durée</th></tr></thead>
    <tbody>${lignesMeds}</tbody>
  </table>

  ${formulaire.decisionFinale.trim() ? `<h2>Décision finale</h2><div class="decision">${formulaire.decisionFinale.trim()}</div>` : ''}

  <div class="footer">
    <div>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
    <div class="signature">
      <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:4px;">${nomPrestataire}</div>
      <div class="ligne">Signature &amp; cachet</div>
    </div>
  </div>
</body></html>`
    const fenetre = window.open('', '_blank', 'width=800,height=700')
    fenetre.document.write(html)
    fenetre.document.close()
    fenetre.focus()
    setTimeout(() => fenetre.print(), 400)
  }

  const lancerAnalyse = async () => {
    setAnalyseEnCours(true)
    setErreurAnalyse('')
    setAnalyse(null)
    setAvisAccepte(null)
    let tensionSystolique = null
    let tensionDiastolique = null
    if (formulaire.tensionArterielle) {
      const parties = formulaire.tensionArterielle.split('/')
      tensionSystolique = parties[0] ? Number(parties[0]) : null
      tensionDiastolique = parties[1] ? Number(parties[1]) : null
    }
    try {
      const resultat = await serviceCpn.analyserContact(dossierId, {
        ageGestationnel: NumeriqueOuNull(formulaire.ageGestationnel),
        poids: NumeriqueOuNull(formulaire.poids),
        tensionSystolique,
        tensionDiastolique,
        temperature: NumeriqueOuNull(formulaire.temperature),
        hauteurUterine: NumeriqueOuNull(formulaire.hauteurUterine),
        bfc: NumeriqueOuNull(formulaire.bfc),
        mouvementsActifs: BooleanOuNull(formulaire.mouvementsActifs),
        oedemes: formulaire.oedemes,
        etatGeneral: formulaire.etatGeneral || undefined,
        perimetreBrachial: NumeriqueOuNull(formulaire.perimetreBrachial),
        proteInurie: formulaire.proteInurie || undefined,
        paleur: formulaire.paleur,
        ecoulementVaginal: formulaire.ecoulementVaginal,
        ulcerationsGenitales: formulaire.ulcerationsGenitales,
      })
      setAnalyse(resultat)
      // Pré-remplir les médicaments depuis la suggestion IA si non encore remplis
      if (resultat.suggestionTraitement) {
        maj('decisionFinale', resultat.suggestionTraitement)
      }
    } catch (ex) {
      setErreurAnalyse(ex.message)
    } finally {
      setAnalyseEnCours(false)
    }
  }

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnregistrement(true)

    let tensionSystolique = null
    let tensionDiastolique = null
    if (formulaire.tensionArterielle) {
      const parties = formulaire.tensionArterielle.split('/')
      tensionSystolique = parties[0] ? Number(parties[0]) : null
      tensionDiastolique = parties[1] ? Number(parties[1]) : null
    }

    try {
      const donnees = {
        dateContact: formulaire.dateContact,
        etatGeneral: formulaire.etatGeneral || null,
        observations: formulaire.observations || null,
        ageGestationnel: NumeriqueOuNull(formulaire.ageGestationnel),
        poids: NumeriqueOuNull(formulaire.poids),
        perimetreBrachial: NumeriqueOuNull(formulaire.perimetreBrachial),
        temperature: NumeriqueOuNull(formulaire.temperature),
        tensionSystolique,
        tensionDiastolique,
        frequenceCardiaqueMore: NumeriqueOuNull(formulaire.frequenceCardiaqueMore),
        proteInurie: formulaire.proteInurie || null,
        paleur: formulaire.paleur,
        oedemes: formulaire.oedemes,
        mouvementsActifs: BooleanOuNull(formulaire.mouvementsActifs),
        bfc: NumeriqueOuNull(formulaire.bfc),
        hauteurUterine: NumeriqueOuNull(formulaire.hauteurUterine),
        presentationFoetale: formulaire.presentationFoetale || null,
        ecoulementVaginal: formulaire.ecoulementVaginal,
        ulcerationsGenitales: formulaire.ulcerationsGenitales,
        etatDuCol: formulaire.etatDuCol || null,
        traitementPrescrit: construireTraitement(),
        prochainRdvDate: formulaire.prochainRdvDate || null,
        // Info utilisateur pour le journal d'activité
        utilisateurId: utilisateurConnecte?.id ?? '',
        utilisateurNom: utilisateurConnecte?.nomAffichage ?? '',
      }

      // Filtrer les examens à envoyer : ignorer les doublons avec les examens déjà en base
      const examensAEnvoyer = examensADemander.filter((ex) => {
        const lib = ex.libelle.trim().toLowerCase()
        return (
          lib &&
          !examensExistants.some((e) => e.libelle.trim().toLowerCase() === lib)
        )
      })

      if (modeEdition && contactId) {
        await serviceCpn.modifierContact(dossierId, contactId, donnees)
        // Envoyer les nouveaux examens ajoutés lors de la modification
        for (const ex of examensAEnvoyer) {
          await serviceCpn.demanderExamen(dossierId, {
            typeExamen: ex.type,
            libelle: ex.libelle.trim(),
            source: 'INTERNE',
            contactCpnId: contactId,
          })
        }
        const nbExamens = examensAEnvoyer.length
        const msgExamens = nbExamens > 0 ? ` ${nbExamens} examen${nbExamens > 1 ? 's' : ''} enregistré${nbExamens > 1 ? 's' : ''}.` : ''
        navigate(`/cpn/${dossierId}/contacts/${contactId}`, { state: { messageSucces: `Contact CPN modifié avec succès.${msgExamens}` } })
      } else {
        await serviceCpn.ajouterContact(dossierId, donnees)
        // Envoyer les examens demandés
        for (const ex of examensAEnvoyer) {
          await serviceCpn.demanderExamen(dossierId, {
            typeExamen: ex.type,
            libelle: ex.libelle.trim(),
            source: 'INTERNE',
          })
        }
        navigate(`/cpn/${dossierId}`, { state: { messageSucces: 'Contact CPN enregistré avec succès.' } })
      }
    } catch (ex) {
      // Si un contact existe déjà pour cette date → rediriger directement vers sa modification
      const corps = ex.corps
      if (ex.statut === 409 && corps?.message?.code === 'CONTACT_DOUBLON_DATE' && corps?.message?.contactId) {
        navigate(`/cpn/${dossierId}/contacts/${corps.message.contactId}/modifier`, {
          state: { messageSucces: `Un contact existe déjà pour cette date. Vous êtes redirigé en mode modification.` },
        })
        return
      }
      setErreur(ex.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      {/* En-tête hero */}
      <section className="space-y-2 pt-2">
        <button
          onClick={() => modeEdition ? navigate(`/cpn/${dossierId}/contacts/${contactId}`) : navigate(`/cpn/${dossierId}`)}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-4"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {modeEdition ? 'Retour au contact' : 'Retour au dossier'}
        </button>
        <span className="text-primary font-semibold tracking-widest text-xs uppercase">
          {modeEdition ? 'Modification de consultation' : 'Formulaire de consultation'}
        </span>
        <h2 className="text-4xl font-extrabold text-on-background tracking-tight font-headline">
          {modeEdition ? 'Modifier le contact CPN' : 'Enregistrement Nouveau Contact CPN'}
        </h2>
        {dossier && (
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            {dossier.numeroDossierCpn} · {dossier.patiente?.nomComplet}
          </p>
        )}
      </section>

      {erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
      )}

      {messageInfo && (
        <div className="flex items-center gap-3 rounded-2xl bg-secondary-container/60 px-5 py-3.5 text-sm font-medium text-on-secondary-container">
          <span className="material-symbols-outlined text-lg">info</span>
          {messageInfo}
        </div>
      )}

      <form className="space-y-8" onSubmit={soumettre}>

        {/* Section 1 : Informations Générales */}
        <div className="bg-surface-container-lowest rounded-xl p-8 space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-outline-variant/40 pl-4">
            <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
            <h3 className="text-xl font-bold text-on-surface">1. Informations Générales</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Date de la visite */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Date de la visite</label>
              <div className="bg-surface-container rounded-lg px-4 py-3 flex items-center opacity-70 cursor-not-allowed">
                <span className="material-symbols-outlined text-outline mr-3">calendar_today</span>
                <input
                  type="date"
                  disabled
                  className="bg-transparent border-none w-full text-on-surface p-0 cursor-not-allowed"
                  value={formulaire.dateContact}
                />
              </div>
            </div>

            {/* État général */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">État général</label>
              <div className="bg-surface-container rounded-lg px-4 py-3 flex items-center transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined text-outline mr-3">health_and_safety</span>
                <select
                  className="bg-transparent border-none w-full text-on-surface p-0"
                  value={formulaire.etatGeneral}
                  onChange={(e) => maj('etatGeneral', e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  <option value="BON">Bon</option>
                  <option value="PASSABLE">Passable</option>
                  <option value="CRITIQUE">Critique</option>
                </select>
              </div>
            </div>

            {/* Plaintes */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant ml-1">Plaintes de la patiente</label>
              <div className="bg-surface-container rounded-lg px-4 py-3 flex items-start transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined text-outline mr-3 mt-1">chat_bubble</span>
                <textarea
                  rows={3}
                  className="bg-transparent border-none w-full text-on-surface p-0 resize-none placeholder-on-surface-variant/50"
                  placeholder="Décrivez les symptômes ou préoccupations rapportées…"
                  value={formulaire.observations}
                  onChange={(e) => maj('observations', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 : Constantes et Dépistage */}
        <div className="bg-surface-container-low rounded-xl p-8 space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-outline-variant/40 pl-4">
            <span className="material-symbols-outlined text-tertiary text-3xl">monitoring</span>
            <h3 className="text-xl font-bold text-on-surface">2. Constantes et Dépistage</h3>
          </div>

          {/* Ligne 1 : 4 mesures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Poids (kg)</label>
              <input
                type="number" step="0.1" min="0"
                className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                placeholder="0.0"
                value={formulaire.poids}
                onChange={(e) => maj('poids', e.target.value)}
              />
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Périmètre Brachial</label>
              <input
                type="number" step="0.1" min="0"
                className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                placeholder="cm"
                value={formulaire.perimetreBrachial}
                onChange={(e) => maj('perimetreBrachial', e.target.value)}
              />
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Température (°C)</label>
              <input
                type="number" step="0.1" min="30" max="45"
                className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                placeholder="37.0"
                value={formulaire.temperature}
                onChange={(e) => maj('temperature', e.target.value)}
              />
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tension Artérielle</label>
              <input
                type="text"
                className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                placeholder="120/80"
                value={formulaire.tensionArterielle}
                onChange={(e) => maj('tensionArterielle', e.target.value)}
              />
            </div>
          </div>

          {/* Ligne 2 : pouls, protéinurie, pâleur + oedèmes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Pouls (bpm)</label>
              <input
                type="number" min="0"
                className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-bold text-lg"
                placeholder="72"
                value={formulaire.frequenceCardiaqueMore}
                onChange={(e) => maj('frequenceCardiaqueMore', e.target.value)}
              />
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Protéinurie</label>
              <select
                className="w-full bg-surface-container rounded-lg border-none px-3 py-2 text-on-surface font-semibold"
                value={formulaire.proteInurie}
                onChange={(e) => maj('proteInurie', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                <option value="NEGATIF">Négatif</option>
                <option value="TRACES">Traces</option>
                <option value="1+">1+</option>
                <option value="2+">2+</option>
                <option value="3+">3+</option>
              </select>
            </div>
            <div className="md:col-span-2 bg-surface-container-lowest p-4 rounded-xl flex items-center justify-around">
              <label
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => maj('paleur', !formulaire.paleur)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formulaire.paleur ? 'bg-primary border-outline-variant/50' : 'border-outline-variant'}`}>
                  {formulaire.paleur && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
                </div>
                <span className="font-semibold text-on-surface">Pâleur</span>
              </label>
              <label
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => maj('oedemes', !formulaire.oedemes)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formulaire.oedemes ? 'bg-primary border-outline-variant/50' : 'border-outline-variant'}`}>
                  {formulaire.oedemes && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
                </div>
                <span className="font-semibold text-on-surface">Oedèmes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3 : Suivi de la Grossesse */}
        <div className="bg-surface-container-lowest rounded-xl p-8 space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-outline-variant/40-dim pl-4">
            <span className="material-symbols-outlined text-primary-dim text-3xl">child_care</span>
            <h3 className="text-xl font-bold text-on-surface">3. Suivi de la Grossesse</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Mouvements foetaux */}
            <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Mouvements Foetaux</label>
                <span className="material-symbols-outlined text-primary">vital_signs</span>
              </div>
              <div className="flex gap-4">
                {[{ val: 'true', label: 'Présents' }, { val: 'false', label: 'Absents' }].map(({ val, label }) => (
                  <label key={val} className="flex-1 cursor-pointer" onClick={() => maj('mouvementsActifs', val)}>
                    <div className={`text-center py-2 rounded-lg border font-bold transition-all ${formulaire.mouvementsActifs === val ? 'border-outline-variant/50 text-primary bg-primary-container/20' : 'bg-white border-transparent'}`}>
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* BCF */}
            <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-4">
              <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">BCF (Bruit du coeur foetal)</label>
              <div className="relative">
                <input
                  type="number" min="0"
                  className="w-full bg-white rounded-lg border-none px-4 py-2 font-bold text-lg text-primary"
                  placeholder="140"
                  value={formulaire.bfc}
                  onChange={(e) => maj('bfc', e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-medium">bpm</span>
              </div>
            </div>

            {/* Hauteur uterine slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide ml-1">Hauteur Uterine</label>
                <span className="text-sm font-bold text-primary">{formulaire.hauteurUterine} cm</span>
              </div>
              <input
                type="range" min="10" max="45" step="0.5"
                className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                value={formulaire.hauteurUterine}
                onChange={(e) => maj('hauteurUterine', e.target.value)}
              />
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant px-1">
                <span>10 CM</span><span>25 CM</span><span>45 CM</span>
              </div>
            </div>

            {/* Présentation + age gestationnel */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide ml-1">Présentation du foetus</label>
                <select
                  className="w-full bg-surface-container-low rounded-lg border-none px-4 py-3 text-on-surface font-semibold"
                  value={formulaire.presentationFoetale}
                  onChange={(e) => maj('presentationFoetale', e.target.value)}
                >
                  <option value="">— Non renseigné —</option>
                  <option value="CEPHALIQUE">Céphalique</option>
                  <option value="PODALIQUE">Podalique</option>
                  <option value="TRANSVERSE">Transverse</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wide ml-1">Âge gestationnel (SA)</label>
                <input
                  type="number" min="0" max="45"
                  className="w-full bg-surface-container-low rounded-lg border-none px-4 py-3 text-on-surface font-semibold"
                  placeholder="ex : 28"
                  value={formulaire.ageGestationnel}
                  onChange={(e) => maj('ageGestationnel', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 : Signes d'IST + État du col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-container-low rounded-xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">biotech</span>
              <h3 className="text-lg font-bold text-on-surface">4. Signes d'IST</h3>
            </div>
            <div className="space-y-4">
              {[
                { champ: 'ecoulementVaginal', label: 'Écoulement vaginal' },
                { champ: 'ulcerationsGenitales', label: 'Ulcérations génitales' },
              ].map(({ champ, label }) => (
                <div
                  key={champ}
                  className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg cursor-pointer"
                  onClick={() => maj(champ, !formulaire[champ])}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formulaire[champ] ? 'bg-secondary border-outline-variant/50' : 'border-outline-variant'}`}>
                    {formulaire[champ] && <span className="material-symbols-outlined text-on-secondary text-sm">check</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">clinical_notes</span>
              <h3 className="text-lg font-bold text-on-surface">État du col</h3>
            </div>
            <textarea
              rows={4}
              className="w-full bg-surface-container-lowest rounded-xl border-none p-4 text-sm resize-none"
              placeholder="Observations sur l'effacement, la dilatation, la consistance…"
              value={formulaire.etatDuCol}
              onChange={(e) => maj('etatDuCol', e.target.value)}
            />
          </div>
        </div>

        {/* ── Bloc Analyse Clinique Assistée ── */}
        <div className="rounded-2xl border-2 border-dashed border-outline-variant p-6 space-y-5 bg-surface-container-lowest">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
              <div>
                <p className="font-bold text-on-surface">Analyse clinique assistée</p>
                <p className="text-xs text-on-surface-variant">Vérifiez les constantes saisies avant de rédiger la conduite à tenir.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={lancerAnalyse}
              disabled={analyseEnCours}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary font-semibold rounded-full shadow hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">{analyseEnCours ? 'hourglass_top' : 'search_insights'}</span>
              {analyseEnCours ? 'Analyse en cours…' : 'Analyser ce contact'}
            </button>
          </div>

          {erreurAnalyse && (
            <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreurAnalyse}</div>
          )}

          {analyse && (() => {
            const COULEURS = {
              CRITIQUE: { bg: 'bg-red-50', border: 'border-red-400', texte: 'text-red-700', badge: 'bg-red-600 text-white', icone: 'dangerous' },
              URGENT:   { bg: 'bg-orange-50', border: 'border-orange-400', texte: 'text-orange-700', badge: 'bg-orange-500 text-white', icone: 'priority_high' },
              ATTENTION:{ bg: 'bg-amber-50', border: 'border-amber-400', texte: 'text-amber-700', badge: 'bg-amber-500 text-white', icone: 'warning' },
              NORMAL:   { bg: 'bg-green-50', border: 'border-green-400', texte: 'text-green-700', badge: 'bg-green-600 text-white', icone: 'check_circle' },
            }
            const STATUT_ICONE = { OK: 'check_circle', ATTENTION: 'warning', URGENT: 'priority_high', CRITIQUE: 'dangerous' }
            const STATUT_COULEUR = { OK: 'text-green-600', ATTENTION: 'text-amber-500', URGENT: 'text-orange-500', CRITIQUE: 'text-red-600' }
            const c = COULEURS[analyse.niveau] ?? COULEURS.NORMAL

            return (
              <div className={`rounded-xl border-2 ${c.border} ${c.bg} space-y-6 p-6`}>

                {/* Badge niveau */}
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-2xl ${c.texte}`}>{c.icone}</span>
                  <span className={`text-xs font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${c.badge}`}>{analyse.niveau}</span>
                  <p className={`text-sm font-bold ${c.texte}`}>{analyse.conclusion}</p>
                </div>

                {/* Tableau comparatif */}
                {analyse.tableau && analyse.tableau.length > 1 && (
                  <div className="overflow-x-auto">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Comparaison des contacts</p>
                    <table className="w-full text-xs border-separate border-spacing-0 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-surface-container text-on-surface-variant">
                          {['CPN#', 'Date', 'Poids', 'Tension', 'BCF', 'HU', 'Protéinurie', 'AG'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyse.tableau.map((ligne) => (
                          <tr
                            key={ligne.contact}
                            className={ligne.estActuel ? 'bg-primary/10 font-bold' : 'bg-surface-container-lowest'}
                          >
                            <td className="px-3 py-2">{ligne.estActuel ? '★ ' : ''}{ligne.contact}</td>
                            <td className="px-3 py-2">{ligne.date}</td>
                            <td className="px-3 py-2">{ligne.poids}</td>
                            <td className="px-3 py-2">{ligne.tension}</td>
                            <td className="px-3 py-2">{ligne.bfc}</td>
                            <td className="px-3 py-2">{ligne.hu}</td>
                            <td className="px-3 py-2">{ligne.proteInurie}</td>
                            <td className="px-3 py-2">{ligne.ag}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Points d'analyse */}
                {analyse.pointsAnalyse && analyse.pointsAnalyse.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Points évalués</p>
                    {analyse.pointsAnalyse.map((point) => (
                      <div key={point.code} className="flex items-start gap-3 bg-white/60 rounded-xl px-4 py-3">
                        <span className={`material-symbols-outlined text-xl mt-0.5 flex-shrink-0 ${STATUT_COULEUR[point.statut]}`}>
                          {STATUT_ICONE[point.statut]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface">{point.label} <span className="font-normal text-on-surface-variant">— {point.valeurActuelle}</span></p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{point.interpretation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boutons d'action */}
                {avisAccepte === null && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setAvisAccepte(true); maj('decisionFinale', analyse.suggestionTraitement) }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-full shadow hover:opacity-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">thumb_up</span>
                      Prendre en compte cet avis
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvisAccepte(false)}
                      className="flex items-center gap-2 px-5 py-2.5 border border-outline text-on-surface font-semibold rounded-full hover:bg-surface-container transition-all"
                    >
                      <span className="material-symbols-outlined text-base">thumb_down</span>
                      Je ne suis pas d'accord
                    </button>
                  </div>
                )}

                {avisAccepte === true && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    L'avis a été repris dans la section 5. Vous pouvez le modifier avant d'enregistrer.
                  </div>
                )}

                {avisAccepte === false && (
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-base">info</span>
                    Avis non retenu. Rédigez librement votre conduite à tenir dans la section 5.
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Section 5 : Conduite à tenir & Suite */}
        <div className="bg-primary-container/10 border-2 border-outline-variant/50-container rounded-2xl p-8 space-y-8">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">medical_information</span>
            <h3 className="text-xl font-bold text-primary">5. Conduite à tenir &amp; Suite</h3>
          </div>

          {/* 5a — Médicaments prescrits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">medication</span>
                <h4 className="font-bold text-on-surface">Médicaments prescrits</h4>
              </div>
              {medicaments.length > 0 && (
                <button
                  type="button"
                  onClick={imprimerOrdo}
                  className="flex items-center gap-2 px-4 py-2 border border-outline-variant/50 text-primary text-sm font-semibold rounded-full hover:bg-primary/10 transition-all"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  Imprimer l'ordonnance
                </button>
              )}
            </div>

            {/* Liste des médicaments ajoutés */}
            {medicaments.length > 0 && (
              <div className="space-y-2">
                {medicaments.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{m.nom}</p>
                      {(m.dose || m.duree) && (
                        <p className="text-xs text-on-surface-variant">{[m.dose, m.duree].filter(Boolean).join(' — ')}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => supprimerMedicament(m.id)}
                      className="text-error hover:bg-error-container rounded-full p-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire ajout médicament */}
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nom du médicament *"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouveauMed.nom}
                  onChange={(e) => setNouveauMed((m) => ({ ...m, nom: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMedicament())}
                />
                <input
                  type="text"
                  placeholder="Dose (ex: 500mg 2×/j)"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouveauMed.dose}
                  onChange={(e) => setNouveauMed((m) => ({ ...m, dose: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMedicament())}
                />
                <input
                  type="text"
                  placeholder="Durée (ex: 7 jours)"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouveauMed.duree}
                  onChange={(e) => setNouveauMed((m) => ({ ...m, duree: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMedicament())}
                />
              </div>
              <button
                type="button"
                onClick={ajouterMedicament}
                disabled={!nouveauMed.nom.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-full disabled:opacity-40 hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Ajouter ce médicament
              </button>
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-outline-variant/50-container" />

          {/* 5b — Examens à demander */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">biotech</span>
              <h4 className="font-bold text-on-surface">Examens à demander</h4>
            </div>

            {/* Examens déjà enregistrés pour ce dossier (en mode édition) */}
            {modeEdition && examensExistants.length > 0 && (
              <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Examens déjà enregistrés (non modifiables)</p>
                <div className="space-y-1">
                  {examensExistants.map((ex) => (
                    <div key={ex.id} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">science</span>
                      <span className="text-xs text-on-surface-variant">{ex.libelle}</span>
                      <span className="text-[10px] rounded-full bg-surface-container px-2 py-0.5 text-on-surface-variant">{ex.typeExamen}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {examensADemander.length > 0 && (
              <div className="space-y-2">
                {examensADemander.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-secondary text-base">science</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{ex.libelle}</p>
                      <p className="text-xs text-on-surface-variant capitalize">{ex.type.toLowerCase()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => supprimerExamen(ex.id)}
                      className="text-error hover:bg-error-container rounded-full p-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Libellé de l'examen *"
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface sm:col-span-2"
                  value={nouvelExamen.libelle}
                  onChange={(e) => setNouvelExamen((ex) => ({ ...ex, libelle: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterExamen())}
                />
                <select
                  className="bg-surface-container-lowest rounded-lg border-none px-3 py-2 text-sm text-on-surface"
                  value={nouvelExamen.type}
                  onChange={(e) => setNouvelExamen((ex) => ({ ...ex, type: e.target.value }))}
                >
                  <option value="BIOLOGIQUE">Biologique</option>
                  <option value="ECHOGRAPHIE">Échographie</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <button
                type="button"
                onClick={ajouterExamen}
                disabled={
                  !nouvelExamen.libelle.trim() ||
                  examensADemander.some((e) => e.libelle.trim().toLowerCase() === nouvelExamen.libelle.trim().toLowerCase()) ||
                  examensExistants.some((e) => e.libelle.trim().toLowerCase() === nouvelExamen.libelle.trim().toLowerCase())
                }
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary text-sm font-semibold rounded-full disabled:opacity-40 hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-base">add</span>
                {(examensADemander.some((e) => e.libelle.trim().toLowerCase() === nouvelExamen.libelle.trim().toLowerCase()) ||
                  examensExistants.some((e) => e.libelle.trim().toLowerCase() === nouvelExamen.libelle.trim().toLowerCase()))
                  ? 'Cet examen existe déjà'
                  : 'Ajouter cet examen'
                }
              </button>
            </div>

            {examensADemander.length > 0 && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                {examensADemander.length} nouvel examen{examensADemander.length > 1 ? 's' : ''} sera enregistr\u00e9{examensADemander.length > 1 ? 's' : ''} lors de l'enregistrement. Les \u00e9chographies restent dans le dossier, seuls les examens biologiques sont envoy\u00e9s au laboratoire.
              </p>
            )}
          </div>

          {/* Séparateur */}
          <div className="border-t border-outline-variant/50-container" />

          {/* 5c — Décision finale + RDV */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">gavel</span>
              <h4 className="font-bold text-on-surface">Décision finale</h4>
            </div>
            <div className="space-y-2">
              <textarea
                rows={4}
                className="w-full bg-surface-container-lowest rounded-xl border-none p-4 text-on-surface shadow-sm resize-none"
                placeholder="Observations finales, conseils, instructions particulières…"
                value={formulaire.decisionFinale}
                onChange={(e) => maj('decisionFinale', e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-bold text-on-primary-container uppercase tracking-wide">Prochain Rendez-vous</label>
                <div className="bg-surface-container-lowest rounded-lg px-4 py-3 flex items-center shadow-sm">
                  <span className="material-symbols-outlined text-primary mr-3">event_repeat</span>
                  <input
                    type="date"
                    className="bg-transparent border-none w-full text-on-surface p-0 font-bold"
                    value={formulaire.prochainRdvDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => maj('prochainRdvDate', e.target.value)}
                  />
                </div>
                {/* Avertissement si RDV dépasse DPA + 2 jours */}
                {(() => {
                  if (!formulaire.prochainRdvDate || !dossier?.dateProbableAccouchement) return null
                  const limite = new Date(dossier.dateProbableAccouchement)
                  limite.setDate(limite.getDate() + 2)
                  if (new Date(formulaire.prochainRdvDate) > limite) {
                    return (
                      <div className="mt-2 flex items-start gap-2 rounded-xl bg-error-container/30 px-4 py-3 text-sm text-error">
                        <span className="material-symbols-outlined text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                        <span>Ce rendez-vous dépasse la DPA prévue ({new Date(dossier.dateProbableAccouchement).toLocaleDateString('fr-FR')}). Veuillez vérifier la date.</span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/cpn/${dossierId}`)}
                  className="rounded-full border border-outline px-8 py-4 font-semibold text-on-surface hover:bg-surface-container transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={enregistrement}
                  className="flex items-center gap-3 px-12 py-4 bg-primary text-on-primary font-bold rounded-full shadow-lg hover:bg-primary-dim transition-all active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">save</span>
                  {enregistrement ? 'Enregistrement…' : (modeEdition ? 'Enregistrer les modifications' : 'Enregistrer la consultation')}
                </button>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}

export default PageNouveauContactCpn
