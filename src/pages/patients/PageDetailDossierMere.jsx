// Page affichant le dossier administratif d'une mère. La vue normale reste inchangée.
// L'impression affiche un rapport médical professionnel (section print-only).
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../composants/interface/Alerte'
import serviceDossiersMeres from '../../services/api/serviceDossiersMeres'
import serviceRendezVous from '../../services/api/serviceRendezVous'

function formaterDate(dateIso) {
  if (!dateIso) return 'Non renseigné'
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateIso))
  } catch { return dateIso }
}

function formaterDateCourte(dateIso) {
  if (!dateIso) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(dateIso))
  } catch { return dateIso }
}

function ChampLecture({ label, valeur, principal }) {
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
        <div className={`w-[90%] rounded-lg px-3 py-3 text-sm font-semibold bg-surface-container ${principal ? 'text-primary' : 'text-on-surface'}`}>
        {valeur || <span className="font-normal italic text-on-surface-variant/60">Non renseigné</span>}
      </div>
    </div>
  )
}

function PageDetailDossierMere() {
  const navigate = useNavigate()
  const { mereId } = useParams()
  const [etat, setEtat] = useState({ chargement: true, dossier: null })
  const [historiqueRdv, setHistoriqueRdv] = useState([])

  useEffect(() => {
    let estActif = true
    const chargerDossier = async () => {
      const dossier = await serviceDossiersMeres.recupererParId(mereId)
      if (!estActif) return
      setEtat({ chargement: false, dossier })
      if (dossier?.numeroDossier) {
        serviceRendezVous.recupererHistoriqueParDossier(dossier.numeroDossier)
          .then(setHistoriqueRdv).catch(() => {})
      }
    }
    void chargerDossier()
    return () => { estActif = false }
  }, [mereId])

  if (etat.chargement) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-2">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier administratif...</p>
        </div>
      </div>
    )
  }

  if (!etat.dossier) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-8 pb-16 pt-2">
        <Alerte type="erreur" titre="Dossier introuvable">
          Le dossier demandé est introuvable ou n'est plus disponible.
        </Alerte>
        <button type="button"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-bold text-on-surface"
          onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour à la liste
        </button>
      </div>
    )
  }

  const dossier = etat.dossier
  const nomComplet = [dossier.nom, dossier.postnom, dossier.prenom].filter(Boolean).join(' ')
  const dateAujourdhui = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return (
    <>
      {/* ============================================================
          VUE ÉCRAN — affichée normalement, masquée à l'impression
          ============================================================ */}
      <div className="screen-only mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <button type="button"
              className="no-print mb-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface"
              onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Retour à la liste
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Dossier administratif mère</h1>
            <p className="mt-2 text-on-surface-variant">{nomComplet}</p>
          </div>
          <div className="no-print flex items-center gap-3">
            <button type="button"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              onClick={() => window.print()}>
              <span className="material-symbols-outlined text-base">print</span>
              Imprimer
            </button>
            <button type="button"
              className="inline-flex items-center rounded-full border border-outline-variant/40 bg-white px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              onClick={() => navigate(`/patients/${dossier.id}/modifier`)}>
              Modifier
            </button>
            <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
              <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">Numéro dossier</p>
              <p className="mt-1 text-lg font-black">{dossier.numeroDossier}</p>
            </div>
          </div>
        </div>

        <section className="w-[70%] mx-auto rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">person</span>
            <h4 className="text-lg font-bold tracking-tight text-on-surface">Identité</h4>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ChampLecture label="Nom" valeur={dossier.nom} />
            <ChampLecture label="Postnom" valeur={dossier.postnom} />
            <ChampLecture label="Prénom" valeur={dossier.prenom} />
            <ChampLecture label="Date de naissance" valeur={formaterDate(dossier.dateNaissance)} />
            <ChampLecture label="Âge" valeur={dossier.age ? `${dossier.age} ans` : ''} />
            <ChampLecture label="État matrimonial" valeur={dossier.etatMatrimonial} />
          </div>
        </section>

        <section className="w-[70%] mx-auto rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">location_on</span>
            <h4 className="text-lg font-bold tracking-tight text-on-surface">Coordonnées</h4>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <ChampLecture label="Téléphone" valeur={dossier.telephone} />
            <ChampLecture label="Date d'enregistrement" valeur={formaterDate(dossier.dateEnregistrement)} />
          </div>
          <hr className="my-6 border-surface-container-high" />
          <ChampLecture label="Adresse complète" valeur={dossier.adresse} />
        </section>

        <section className="w-[70%] mx-auto rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">group</span>
            <h4 className="text-lg font-bold tracking-tight text-on-surface">Partenaire</h4>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ChampLecture label="Nom du partenaire" valeur={dossier.nomPartenaire} />
            <ChampLecture label="Occupation femme" valeur={dossier.occupationFemme} />
            <ChampLecture label="Occupation homme" valeur={dossier.occupationHomme} />
          </div>
        </section>

        <section className="w-[70%] mx-auto rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">emergency</span>
            <h4 className="text-lg font-bold tracking-tight text-on-surface">Contact d'urgence</h4>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <ChampLecture label="Personne à contacter" valeur={dossier.personneUrgence} />
            <ChampLecture label="Téléphone du contact" valeur={dossier.telephoneUrgence} />
          </div>
          <hr className="my-6 border-surface-container-high" />
          <ChampLecture label="Adresse du contact" valeur={dossier.adresseUrgence} />
        </section>

        <section className="w-[70%] mx-auto rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">calendar_month</span>
            <h4 className="text-lg font-bold tracking-tight text-on-surface">Historique des rendez-vous</h4>
          </div>
          {historiqueRdv.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Aucun rendez-vous enregistré pour ce dossier.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-left">
                    <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                    <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Heure</th>
                    <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Service</th>
                  <th className="pb-3 pr-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Statut</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {historiqueRdv.map((rdv) => (
                    <tr key={rdv.id}
                      className="cursor-pointer transition-colors hover:bg-surface-container-low/30"
                      onClick={() => navigate(`/rendez-vous/${rdv.id}`)}>
                      <td className="py-3 pr-6 text-on-surface-variant">{formaterDateCourte(rdv.date)}</td>
                      <td className="py-3 pr-6 font-bold text-primary">{rdv.heure ?? '—'}</td>
                      <td className="py-3 pr-6 text-on-surface-variant">{rdv.service ?? '—'}</td>
                      <td className="py-3 pr-6">
                        <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface">{rdv.statut ?? '—'}</span>
                      </td>
                      <td className="py-3 text-on-surface-variant">{rdv.motif ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ============================================================
          RAPPORT D'IMPRESSION — masqué à l'écran, visible uniquement à l'impression
          ============================================================ */}
      <div className="print-only" style={{ fontFamily: 'Inter, sans-serif', background: 'white', color: '#191c1d', padding: '0', position: 'relative', overflow: 'hidden' }}>

        {/* En-tête du document */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', background: '#005eb8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '32px' }}>medical_services</span>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#00478d', margin: 0, letterSpacing: '-0.5px' }}>Centre de Santé Afia Himbi</h1>
              <p style={{ color: '#424752', fontWeight: 600, fontSize: '12px', margin: '2px 0' }}>Unité de Soins Prénatals et Postnatals</p>
              <p style={{ color: '#424752', fontSize: '11px', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                Goma, Nord-Kivu, République Démocratique du Congo<br />
                +243 000 000 000
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d5e4f7', color: '#526070', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '99px', marginBottom: '6px' }}>Dossier Administratif Officiel</span>
            <p style={{ color: '#424752', fontSize: '11px', margin: '2px 0' }}>N° Dossier : <strong style={{ color: '#191c1d' }}>{dossier.numeroDossier}</strong></p>
            <p style={{ color: '#424752', fontSize: '11px', margin: '2px 0' }}>Date : <strong style={{ color: '#191c1d' }}>{dateAujourdhui}</strong></p>
          </div>
        </div>

        {/* Identification de la patiente */}
        <div style={{ background: '#f3f4f5', borderRadius: '8px', padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, margin: '0 0 4px 0' }}>Nom de la patiente</p>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#00478d', margin: 0, fontFamily: 'Manrope, sans-serif' }}>{nomComplet || 'Non renseigné'}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', borderLeft: '1px solid #c2c6d4', paddingLeft: '24px' }}>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Date de naissance</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{formaterDate(dossier.dateNaissance)}</p>
            </div>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Âge</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.age ? `${dossier.age} ans` : '—'}</p>
            </div>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>État matrimonial</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.etatMatrimonial || '—'}</p>
            </div>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Enregistrement</p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{formaterDate(dossier.dateEnregistrement)}</p>
            </div>
          </div>
        </div>

        {/* Corps principal — 3 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* Coordonnées */}
          <div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>Coordonnées</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Téléphone</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.telephone || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Adresse</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.adresse || '—'}</p>
              </div>
            </div>
          </div>

          {/* Partenaire */}
          <div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>Partenaire</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Nom partenaire</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.nomPartenaire || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Occup. femme</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.occupationFemme || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Occup. homme</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.occupationHomme || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact d'urgence */}
        <div style={{ background: '#fff8f5', borderRadius: '8px', borderTop: '4px solid #793100', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#793100', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>emergency</span>
            Contact d'urgence
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Personne à contacter</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.personneUrgence || '—'}</p>
            </div>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Téléphone urgence</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#793100', margin: 0 }}>{dossier.telephoneUrgence || '—'}</p>
            </div>
            <div>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>Adresse contact</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{dossier.adresseUrgence || '—'}</p>
            </div>
          </div>
        </div>

        {/* Historique des rendez-vous */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>Historique des rendez-vous</h3>
          {historiqueRdv.length === 0 ? (
            <p style={{ color: '#424752', fontSize: '12px', fontStyle: 'italic' }}>Aucun rendez-vous enregistré pour ce dossier.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f3f4f5' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', borderBottom: '2px solid #e1e3e4' }}>Date</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', borderBottom: '2px solid #e1e3e4' }}>Heure</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', borderBottom: '2px solid #e1e3e4' }}>Service</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', borderBottom: '2px solid #e1e3e4' }}>Statut</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#424752', borderBottom: '2px solid #e1e3e4' }}>Motif</th>
                </tr>
              </thead>
              <tbody>
                {historiqueRdv.map((rdv, i) => (
                  <tr key={rdv.id} style={{ background: i % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}>
                    <td style={{ padding: '6px 10px', color: '#424752', fontWeight: 500 }}>{formaterDateCourte(rdv.date)}</td>
                    <td style={{ padding: '6px 10px', color: '#00478d', fontWeight: 700 }}>{rdv.heure ?? '—'}</td>
                    <td style={{ padding: '6px 10px', color: '#424752' }}>{rdv.service ?? '—'}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ padding: '2px 8px', background: '#d5e4f7', color: '#526070', fontSize: '9px', fontWeight: 700, borderRadius: '99px' }}>{rdv.statut ?? '—'}</span>
                    </td>
                    <td style={{ padding: '6px 10px', color: '#424752' }}>{rdv.motif ?? '—'}</td>
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
            <p style={{ fontSize: '10px', color: '#424752', margin: '0' }}>Service Maternité — Goma, RDC</p>
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

export default PageDetailDossierMere
