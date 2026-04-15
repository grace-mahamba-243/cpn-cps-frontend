// Ce composant affiche la liste des dossiers CPN avec recherche par patiente.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceCpn from '../../../services/api/serviceCpn'

function formaterDate(dateIso) {
  if (!dateIso) return '-'
  try {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(dateIso))
  } catch {
    return dateIso
  }
}

function badgeStatut(statut) {
  if (statut === 'OUVERT') return 'bg-primary-container text-on-primary-container'
  return 'bg-surface-variant text-on-surface-variant'
}

function PageListeDossiersCpn() {
  const navigate = useNavigate()
  const [dossiers, setDossiers] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const timerRef = useRef(null)

  const charger = async (terme) => {
    setChargement(true)
    setErreur(null)
    try {
      const liste = await serviceCpn.listerDossiers(terme)
      setDossiers(liste)
    } catch (e) {
      setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    charger('')
  }, [])

  const gererRecherche = (valeur) => {
    setRecherche(valeur)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => charger(valeur), 400)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Dossiers CPN</h2>
          <p className="text-sm text-on-surface-variant">Consultations Prénatales</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90"
          onClick={() => navigate('/cpn/nouveau')}
        >
          <span className="material-symbols-outlined text-base">add</span>
          Ouvrir une CPN
        </button>
      </header>

      <div className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
        <span className="material-symbols-outlined text-on-surface-variant">search</span>
        <input
          type="text"
          placeholder="Rechercher par nom, numéro de dossier, téléphone…"
          value={recherche}
          onChange={(e) => gererRecherche(e.target.value)}
          className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
        />
        {recherche && (
          <button onClick={() => { setRecherche(''); charger('') }} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {erreur && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{erreur}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">N° CPN</th>
              <th className="px-4 py-3 text-left font-semibold">Patiente</th>
              <th className="px-4 py-3 text-left font-semibold">N° Dossier</th>
              <th className="px-4 py-3 text-left font-semibold">Ouverture</th>
              <th className="px-4 py-3 text-left font-semibold">DPA</th>
              <th className="px-4 py-3 text-left font-semibold">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {chargement ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-on-surface-variant">Chargement…</td>
              </tr>
            ) : dossiers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-on-surface-variant">
                  {recherche ? 'Aucun dossier CPN trouvé.' : 'Aucun dossier CPN enregistré.'}
                </td>
              </tr>
            ) : dossiers.map((d) => (
              <tr
                key={d.id}
                className="cursor-pointer border-t border-outline-variant hover:bg-surface-container-low"
                onClick={() => navigate(`/cpn/${d.id}`)}
              >
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{d.numeroDossierCpn}</td>
                <td className="px-4 py-3 font-medium text-on-surface">{d.nomPatiente}</td>
                <td className="px-4 py-3 text-on-surface-variant">{d.numeroDossierPatiente}</td>
                <td className="px-4 py-3 text-on-surface-variant">{formaterDate(d.dateOuverture)}</td>
                <td className="px-4 py-3 text-on-surface-variant">{formaterDate(d.dateProbableAccouchement)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStatut(d.statut)}`}>
                    {d.statut === 'OUVERT' ? 'Ouvert' : 'Clos'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PageListeDossiersCpn
