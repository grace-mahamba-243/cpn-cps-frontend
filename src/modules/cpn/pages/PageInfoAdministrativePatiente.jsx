// Page affichant les informations administratives de la patiente, avec le même
// style que PageDetailDossierMere (sections bg-white, cartes LigneInfo).
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

const STYLES_IMPRESSION = `
@media print {
  .barre-laterale, header, nav, .en-tete-application, [data-print-hide], button { display: none !important; }
  body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  #racine-application, main, .contenu-principal, .layout-prive { background: #fff !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
  @page { margin: 15mm 12mm; size: A4 portrait; }
  #contenu-page-admin { display: none !important; }
  #zone-impression-admin { display: none !important; }
  body.print-admin #zone-impression-admin { display: block !important; }
}
@media screen {
  #zone-impression-admin { display: none; }
}
`

function formaterDate(dateIso) {
  if (!dateIso) return 'Non renseigné'
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateIso))
  } catch { return dateIso }
}

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

function PageInfoAdministrativePatiente() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const [chargement, setChargement] = useState(true)
  const [dossier, setDossier] = useState(null)

  useEffect(() => {
    const id = 'styles-impression-admin'
    if (!document.getElementById(id)) {
      const tag = document.createElement('style')
      tag.id = id
      tag.textContent = STYLES_IMPRESSION
      document.head.appendChild(tag)
    }
  }, [])

  useEffect(() => {
    let actif = true
    serviceCpn.obtenirDossier(dossierId).then((data) => {
      if (actif) { setDossier(data); setChargement(false) }
    }).catch(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [dossierId])

  if (chargement) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement du dossier administratif...</p>
        </div>
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-10 text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <p>Dossier introuvable.</p>
        </div>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-6 py-3 text-sm font-bold text-on-surface">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour au dossier CPN
        </button>
      </div>
    )
  }

  const p = dossier.patiente
  const nomComplet = dossier.nomPatiente
    ?? (p ? [p.nom, p.postnom, p.prenom].filter(Boolean).join(' ') : null)
    ?? '—'

  const imprimerAdmin = () => {
    document.body.classList.add('print-admin')
    window.print()
    document.body.classList.remove('print-admin')
  }

  return (
    <>
    <div id="contenu-page-admin" className="mx-auto max-w-7xl space-y-8 px-8 pb-16 pt-8">

      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour au dossier CPN
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Dossier administratif mère</h1>
          <p className="mt-2 text-on-surface-variant">{nomComplet}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/patients/${p?.id}/modifier`)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Modifier
          </button>
          <button
            type="button"
            onClick={imprimerAdmin}
            className="flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Imprimer
          </button>
          <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-lg shadow-primary/20">
            <p className="text-xs uppercase tracking-[0.16em] text-on-primary/80">Numéro dossier</p>
            <p className="mt-1 text-lg font-black">{p?.numeroDossier ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Identité */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">person</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Identité</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom" valeur={p?.nom} />
          <ChampLecture label="Postnom" valeur={p?.postnom} />
          <ChampLecture label="Prénom" valeur={p?.prenom} />
          <ChampLecture label="Date de naissance" valeur={formaterDate(p?.dateNaissance)} />
          <ChampLecture label="Âge" valeur={p?.age ? `${p.age} ans` : ''} />
          <ChampLecture label="État matrimonial" valeur={p?.etatMatrimonial} />
        </div>
      </section>

      {/* Coordonnées */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">location_on</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Coordonnées</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ChampLecture label="Téléphone" valeur={p?.telephone} />
          <ChampLecture label="Date d'enregistrement" valeur={formaterDate(p?.dateEnregistrement)} />
        </div>
        <hr className="my-6 border-surface-container-high" />
        <ChampLecture label="Adresse complète" valeur={p?.adresse} />
      </section>

      {/* Partenaire */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">group</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Partenaire</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <ChampLecture label="Nom du partenaire" valeur={p?.nomPartenaire} />
          <ChampLecture label="Occupation femme" valeur={p?.occupationFemme} />
          <ChampLecture label="Occupation homme" valeur={p?.occupationHomme} />
        </div>
      </section>

      {/* Contact d'urgence */}
      <section className="rounded-xl border-l-4 border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">emergency</span>
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Contact d'urgence</h4>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ChampLecture label="Personne à contacter" valeur={p?.personneUrgence} />
          <ChampLecture label="Téléphone du contact" valeur={p?.telephoneUrgence} />
        </div>
        <hr className="my-6 border-surface-container-high" />
        <ChampLecture label="Adresse du contact" valeur={p?.adresseUrgence} />
      </section>

    </div>

    <ZoneImpressionAdmin p={p} nomComplet={nomComplet} />
    </>
  )
}

/* ─── Zone imprimable — style institutionnel (même que PageDetailContactCpn) ─── */
function ZoneImpressionAdmin({ p, nomComplet }) {
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  function ligne(label, valeur) {
    if (!valeur && valeur !== 0) return null
    return (
      <tr key={label} style={{ borderBottom: '1px solid #e5e7eb' }}>
        <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151', fontSize: 11, whiteSpace: 'nowrap', width: '38%' }}>{label}</td>
        <td style={{ padding: '5px 8px', color: '#111827', fontSize: 11 }}>{valeur}</td>
      </tr>
    )
  }

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

  function formaterDateImpression(dateIso) {
    if (!dateIso) return null
    try { return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateIso)) }
    catch { return dateIso }
  }

  return (
    <div id="zone-impression-admin" style={{ fontFamily: 'Inter, sans-serif', color: '#191c1d', background: '#fff', padding: 0 }}>

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
          <span style={{ display: 'inline-block', padding: '2px 8px', background: '#d5e4f7', color: '#526070', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '99px', marginBottom: '4px' }}>Dossier Administratif Mère</span>
          <p style={{ color: '#424752', fontSize: '10px', margin: '2px 0' }}>N° dossier : {p?.numeroDossier ?? '—'}</p>
          <p style={{ color: '#424752', fontSize: '10px', margin: '2px 0' }}>Imprimé le {dateNow}</p>
        </div>
      </div>
      <div style={{ height: '3px', background: 'linear-gradient(to right, #00478d, #005eb8, #526070)', marginBottom: '16px', borderRadius: '2px' }} />

      {/* Bloc identité patiente */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 32 }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Patiente</span>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a5f' }}>{nomComplet}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Date de naissance</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{formaterDateImpression(p?.dateNaissance) ?? '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Âge</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{p?.age ? `${p.age} ans` : '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>État matrimonial</span>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e3a5f' }}>{p?.etatMatrimonial ?? '—'}</div>
        </div>
      </div>

      {section('Identité', [
        ligne('Nom', p?.nom),
        ligne('Postnom', p?.postnom),
        ligne('Prénom', p?.prenom),
        ligne('Date de naissance', formaterDateImpression(p?.dateNaissance)),
        ligne('Âge', p?.age ? `${p.age} ans` : null),
        ligne('État matrimonial', p?.etatMatrimonial),
      ])}

      {section('Coordonnées', [
        ligne('Téléphone', p?.telephone),
        ligne('Adresse complète', p?.adresse),
        ligne('Date d\'enregistrement', formaterDateImpression(p?.dateEnregistrement)),
      ])}

      {section('Partenaire', [
        ligne('Nom du partenaire', p?.nomPartenaire),
        ligne('Occupation de la femme', p?.occupationFemme),
        ligne('Occupation de l\'homme', p?.occupationHomme),
      ])}

      {section('Contact d\'urgence', [
        ligne('Personne à contacter', p?.personneUrgence),
        ligne('Téléphone urgence', p?.telephoneUrgence),
        ligne('Adresse du contact', p?.adresseUrgence),
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

export default PageInfoAdministrativePatiente
