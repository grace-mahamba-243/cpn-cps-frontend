// Ce composant affiche le résumé des examens physiques effectués lors de chaque visite postnatale CPS.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceCpsFemme from '../../../services/api/serviceCpsFemme'

const LABEL_VISITE = {
  SIX_HEURES: 'Visite 6 heures',
  SIX_JOURS: 'Visite 6 jours',
  SIX_SEMAINES: 'Visite 6 semaines',
  SURPRISE: 'Visite surprise',
}

function formaterDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Chip({ label, valeur, couleur }) {
  if (!valeur && valeur !== false) return null
  const val = typeof valeur === 'boolean' ? (valeur ? 'Oui' : 'Non') : String(valeur).replace(/_/g, ' ')
  return (
    <div className={`rounded-lg px-3 py-2 ${couleur}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{val}</p>
    </div>
  )
}

const COULEUR_EXAM = {
  BONNE: 'bg-green-50 text-green-800',
  NORMAL: 'bg-green-50 text-green-800',
  BONNE_CICATRISATION: 'bg-green-50 text-green-800',
  BON: 'bg-green-50 text-green-800',
  INCOMPLETE: 'bg-amber-50 text-amber-800',
  ENGORGEMENT: 'bg-amber-50 text-amber-800',
  CREVASSES: 'bg-amber-50 text-amber-800',
  BABY_BLUES: 'bg-amber-50 text-amber-800',
  ABSENTE: 'bg-red-50 text-red-800',
  MASTITE: 'bg-red-50 text-red-800',
  INFECTION: 'bg-red-50 text-red-800',
  DEHISCENCE: 'bg-red-50 text-red-800',
  DEPRESSION_SUSPECTEE: 'bg-red-50 text-red-800',
  PASSABLE: 'bg-amber-50 text-amber-800',
  MAUVAIS: 'bg-red-50 text-red-800',
}

function couleurPour(valeur) {
  return COULEUR_EXAM[valeur] ?? 'bg-surface-container-low text-on-surface'
}

function PageExamensCpsFemme() {
  const { dossierId } = useParams()
  const navigate = useNavigate()
  const [examens, setExamens] = useState([])
  const [dossier, setDossier] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const charger = async () => {
      setChargement(true)
      setErreur('')
      try {
        const [d, liste] = await Promise.all([
          serviceCpsFemme.obtenirDossier(dossierId),
          serviceCpsFemme.listerExamens(dossierId),
        ])
        setDossier(d)
        setExamens(Array.isArray(liste) ? liste : [])
      } catch (ex) {
        setErreur(ex.message)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [dossierId])

  const nomPatiente = dossier
    ? [dossier.patiente?.nom, dossier.patiente?.postnom, dossier.patiente?.prenom].filter(Boolean).join(' ')
    : ''

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6">
      <button onClick={() => navigate(`/cps-femme/${dossierId}`)}
        className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Retour au dossier
      </button>

      <div>
        <h1 className="text-xl font-bold text-on-surface">Examens postnatals</h1>
        {nomPatiente && <p className="mt-0.5 text-sm text-on-surface-variant">{nomPatiente}</p>}
        <p className="mt-1 text-xs text-on-surface-variant">Résultats des examens physiques réalisés lors des visites CPS</p>
      </div>

      {chargement && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {erreur && (
        <div className="rounded-2xl bg-error-container/30 px-5 py-4 text-sm text-on-error-container">{erreur}</div>
      )}

      {!chargement && !erreur && examens.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container px-6 py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">biotech</span>
          <p className="text-sm text-on-surface-variant">Aucune visite enregistrée. Les examens apparaîtront ici après chaque visite.</p>
        </div>
      )}

      {!chargement && !erreur && examens.length > 0 && (
        <div className="flex flex-col gap-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
            {examens.length} visite{examens.length > 1 ? 's' : ''} · examens enregistrés
          </p>
          {examens.map((v) => (
            <div key={v.id} className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm space-y-4">
              {/* En-tête visite */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container/30 text-secondary">
                    <span className="material-symbols-outlined text-xl">pregnant_woman</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{LABEL_VISITE[v.typeVisite] ?? v.typeVisite}</p>
                    <p className="text-xs text-on-surface-variant">{formaterDate(v.dateVisite)}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/cps-femme/${dossierId}/visites/${v.id}`)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Voir la visite
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {/* Constantes */}
              {(v.poids || v.temperature || v.tensionSystolique || v.paleur || v.oedemes) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Constantes vitales</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {v.poids && <Chip label="Poids" valeur={`${v.poids} kg`} couleur="bg-surface-container-low text-on-surface" />}
                    {v.temperature && <Chip label="Température" valeur={`${v.temperature} °C`} couleur="bg-surface-container-low text-on-surface" />}
                    {v.tensionSystolique && <Chip label="Tension" valeur={`${v.tensionSystolique}/${v.tensionDiastolique}`} couleur="bg-surface-container-low text-on-surface" />}
                    {v.paleur != null && <Chip label="Pâleur" valeur={v.paleur} couleur={v.paleur ? 'bg-amber-50 text-amber-800' : 'bg-surface-container-low text-on-surface'} />}
                    {v.oedemes != null && <Chip label="Œdèmes" valeur={v.oedemes} couleur={v.oedemes ? 'bg-amber-50 text-amber-800' : 'bg-surface-container-low text-on-surface'} />}
                  </div>
                </div>
              )}

              {/* Examen postnatal */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Examen postnatal</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <Chip label="État général" valeur={v.etatGeneral} couleur={couleurPour(v.etatGeneral)} />
                  <Chip label="Involution utérine" valeur={v.involutionUterine} couleur={couleurPour(v.involutionUterine)} />
                  <Chip label="État des seins" valeur={v.etatSeins} couleur={couleurPour(v.etatSeins)} />
                  <Chip label="Allaitement" valeur={v.allaitement} couleur="bg-surface-container-low text-on-surface" />
                  <Chip label="État de la plaie" valeur={v.etatPlaie} couleur={couleurPour(v.etatPlaie)} />
                  <Chip label="Saignements" valeur={v.saignements} couleur="bg-surface-container-low text-on-surface" />
                  <Chip label="Lochies" valeur={v.lochies} couleur="bg-surface-container-low text-on-surface" />
                  <Chip label="État psychologique" valeur={v.etatPsychologique} couleur={couleurPour(v.etatPsychologique)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PageExamensCpsFemme
