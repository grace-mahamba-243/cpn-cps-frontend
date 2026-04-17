// Ce composant affiche le detail et le resume d un accouchement avec les liens vers CPS femme et dossier enfant.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import serviceAccouchement from '../../../services/api/serviceAccouchement'

const LABELS_TYPE = { INTERNE: 'Interne', EXTERNE: 'Externe' }
const LABELS_ETAT_MERE = { STABLE: 'Stable', COMPLICATION: 'Complication', DECES: 'Décès' }
const LABELS_ETAT_NN = { VIVANT: 'Vivant', MORT_NE: 'Mort-né', DECES_PRECOCE: 'Décès précoce' }
const LABELS_MODE = {
  NATUREL: 'Naturel',
  CESARIENNE: 'Césarienne',
  INSTRUMENTAL: 'Instrumental',
  SIEGE: 'Siège',
  AUTRE: 'Autre',
}

function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function LigneInfo({ label, valeur }) {
  return (
    <div>
      <div className="text-xs text-on-surface-variant">{label}</div>
      <div className="text-sm text-on-surface mt-0.5">{valeur || '—'}</div>
    </div>
  )
}

export default function PageDetailAccouchement() {
  const { accouchementId } = useParams()
  const navigate = useNavigate()
  const [accouchement, setAccouchement] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    charger()
  }, [accouchementId])

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const detail = await serviceAccouchement.obtenirAccouchement(accouchementId)
      setAccouchement(detail)
    } catch (e) {
      setErreur(e.message || 'Impossible de charger cet accouchement.')
    } finally {
      setChargement(false)
    }
  }

  if (chargement) {
    return <div className="p-6 text-center text-on-surface-variant">Chargement…</div>
  }

  if (erreur || !accouchement) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/accouchements')}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-4 transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour à la liste
        </button>
        <div className="bg-error-container text-on-error-container rounded-xl p-4">
          {erreur || 'Accouchement introuvable.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <button
        onClick={() => navigate('/accouchements')}
        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Retour à la liste
      </button>

      {/* Titre */}
      <div className="bg-surface-container rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">
              Événement {accouchement.numeroAccouchement}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {accouchement.patiente?.nom} · {accouchement.patiente?.numeroDossier}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            accouchement.typeAccouchement === 'INTERNE'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-surface-container-highest text-on-surface'
          }`}>
            {LABELS_TYPE[accouchement.typeAccouchement] ?? accouchement.typeAccouchement}
          </span>
        </div>
      </div>

      {/* Resume de l evenement */}
      <section className="bg-surface-container rounded-2xl p-5">
        <h2 className="text-base font-semibold text-on-surface mb-4">Résumé de l'événement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LigneInfo label="Date et heure" valeur={formatDate(accouchement.dateAccouchement)} />
          <LigneInfo label="Mode d'accouchement" valeur={LABELS_MODE[accouchement.modeAccouchement] ?? accouchement.modeAccouchement} />
          <LigneInfo label="Âge gestationnel" valeur={accouchement.ageGestationnel ? `${accouchement.ageGestationnel} SA` : '—'} />
          <LigneInfo label="État de la mère" valeur={LABELS_ETAT_MERE[accouchement.etatMere] ?? accouchement.etatMere} />
          <LigneInfo label="État du nouveau-né" valeur={LABELS_ETAT_NN[accouchement.etatNouveauNe] ?? accouchement.etatNouveauNe} />
          <LigneInfo label="Nombre de nouveau-nés" valeur={String(accouchement.nombreNouveauxNes || '1')} />
          <LigneInfo label="Sexe" valeur={accouchement.sexeNouveauNe || '—'} />
          <LigneInfo label="Poids naissance" valeur={accouchement.poidsNaissanceG ? `${accouchement.poidsNaissanceG} g` : '—'} />
          <LigneInfo label="APGAR 1 min" valeur={accouchement.scoreApgar1min?.toString()} />
          <LigneInfo label="APGAR 5 min" valeur={accouchement.scoreApgar5min?.toString()} />
          <LigneInfo label="Dossier CPN lié" valeur={accouchement.dossierCpnId || 'Aucun'} />
          <LigneInfo label="Statut" valeur={accouchement.statut || 'EN_COURS'} />
        </div>
      </section>

      {/* Notes cliniques */}
      <section className="bg-surface-container rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <LigneInfo label="Complications mère" valeur={accouchement.complicationsMere || 'Aucune complication renseignée'} />
        <LigneInfo label="Anomalies congénitales" valeur={accouchement.anomaliesCongenitales || 'Aucune anomalie renseignée'} />
        <div className="md:col-span-2">
          <LigneInfo label="Notes" valeur={accouchement.notes || 'Aucune note complémentaire'} />
        </div>
      </section>

      {/* Continuité du parcours */}
      <section className="bg-primary-container text-on-primary-container rounded-2xl p-5">
        <h2 className="text-base font-semibold mb-3">Continuité du parcours</h2>
        <p className="text-sm opacity-90 mb-4">
          Préparer les étapes suivantes pour la mère et le nouveau-né.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:opacity-90 transition text-sm"
            onClick={() => navigate(`/cps-femme/nouveau?patienteId=${accouchement.patiente?.id}&accouchementId=${accouchement.id}`)}
          >
            Ouvrir la CPS femme
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-secondary-container text-on-secondary-container hover:opacity-90 transition text-sm"
            onClick={() => navigate(`/enfants/nouveau?mereId=${accouchement.patiente?.id}&accouchementId=${accouchement.id}`)}
          >
            Créer le dossier enfant
          </button>
        </div>
      </section>
    </div>
  )
}
