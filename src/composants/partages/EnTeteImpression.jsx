// Composant partagé qui affiche l'en-tête et le pied de page pour toutes les impressions de l'application.

const STYLE_LABEL = { color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }
const STYLE_VALEUR = { fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }

export function ChampImpression({ label, valeur }) {
  return (
    <div>
      <p style={STYLE_LABEL}>{label}</p>
      <p style={STYLE_VALEUR}>{valeur || '—'}</p>
    </div>
  )
}

export function SectionImpression({ titre, children, colonnes = '1fr 1fr' }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#191c1d', fontSize: '13px', borderBottom: '1px solid #e1e3e4', paddingBottom: '6px', marginBottom: '12px' }}>{titre}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: colonnes, gap: '12px' }}>
        {children}
      </div>
    </div>
  )
}

/**
 * EnTeteImpression — Bandeau supérieur du document imprimé
 * @param {string} titre    — Titre du document (ex: "Carnet de Maternité")
 * @param {string} badge    — Étiquette badge (ex: "Dossier Administratif Officiel")
 * @param {string} reference — Numéro de référence du document
 * @param {string} date     — Date d'impression
 */
export function EnTeteImpression({ titre = 'Document Médical', badge = 'Document Officiel', reference, date }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '56px', height: '56px', background: '#005eb8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0 }}>
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
        <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d5e4f7', color: '#526070', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '99px', marginBottom: '6px' }}>{badge}</span>
        {reference && <p style={{ color: '#424752', fontSize: '11px', margin: '2px 0' }}>Réf : <strong style={{ color: '#191c1d' }}>{reference}</strong></p>}
        {date && <p style={{ color: '#424752', fontSize: '11px', margin: '2px 0' }}>Date : <strong style={{ color: '#191c1d' }}>{date}</strong></p>}
      </div>
    </div>
  )
}

/**
 * BandeauPatientImpression — Bloc d'identification du patient
 */
export function BandeauPatientImpression({ nom, infos = [] }) {
  return (
    <div style={{ background: '#f3f4f5', borderRadius: '8px', padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
      <div>
        <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, margin: '0 0 4px 0' }}>Patient(e)</p>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#00478d', margin: 0, fontFamily: 'Manrope, sans-serif' }}>{nom || 'Non renseigné'}</h2>
      </div>
      {infos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${infos.length}, 1fr)`, gap: '24px', borderLeft: '1px solid #c2c6d4', paddingLeft: '24px' }}>
          {infos.map((info) => (
            <div key={info.label}>
              <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 3px 0' }}>{info.label}</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#191c1d', margin: 0 }}>{info.valeur || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * PiedDePageImpression — Bas de page du document imprimé
 */
export function PiedDePageImpression({ service = 'Service Maternité' }) {
  return (
    <div style={{ borderTop: '1px solid #e1e3e4', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <p style={{ color: '#424752', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: '0 0 8px 0' }}>Signature autorisée</p>
        <div style={{ height: '48px', width: '200px', background: '#f3f4f5', borderRadius: '4px', borderBottom: '2px solid rgba(0,71,141,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', color: 'rgba(0,71,141,0.6)', fontSize: '18px', fontStyle: 'italic' }}>Centre Afia Himbi</span>
        </div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#191c1d', margin: '0' }}>Centre de Santé Afia Himbi</p>
        <p style={{ fontSize: '10px', color: '#424752', margin: '0' }}>{service} — Goma, RDC</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00478d', display: 'inline-block' }}></span>
          <p style={{ fontSize: '9px', color: '#424752', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, margin: 0 }}>Document officiel vérifié</p>
        </div>
        <p style={{ fontSize: '10px', color: '#424752', margin: '0' }}>Page 1 sur 1</p>
      </div>
    </div>
  )
}

/**
 * ConteneurImpression — Enveloppe complète du document imprimé (visible uniquement à l'impression)
 */
export function ConteneurImpression({ children }) {
  return (
    <div className="print-only" style={{ fontFamily: 'Inter, sans-serif', background: 'white', color: '#191c1d', padding: '0', position: 'relative', overflow: 'hidden' }}>
      {children}
      {/* Bande décorative en bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #00478d, #005eb8, #526070)' }} />
    </div>
  )
}
