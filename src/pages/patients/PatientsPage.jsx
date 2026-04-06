import { Link } from 'react-router-dom'
import AvatarInitiales from '../../composants/interface/AvatarInitiales'
import BadgeEtat from '../../composants/interface/BadgeEtat'
import Bouton from '../../composants/interface/Bouton'
import Carte from '../../composants/interface/Carte'
import CarteIndicateur from '../../composants/interface/CarteIndicateur'
import ChampRecherche from '../../composants/interface/ChampRecherche'
import TableauDonnees from '../../composants/interface/TableauDonnees'
import BlocTitrePage from '../../composants/partages/BlocTitrePage'
import GroupeAvatars from '../../composants/partages/GroupeAvatars'

const admissionsRecentes = [
  {
    id: 1,
    initiales: 'BK',
    patient: 'Bahati Kavira',
    reference: '1022-A',
    suivi: 'CPS (Pediatric)',
    statut: 'Stable',
    varianteStatut: 'tertiaire',
    indicateur: 'Croissance optimale',
  },
  {
    id: 2,
    initiales: 'NS',
    patient: 'Neema Sifa',
    reference: '1045-C',
    suivi: 'CPN (Prenatal)',
    statut: 'High Risk',
    varianteStatut: 'danger',
    indicateur: 'Anemie detectee',
  },
]

const colonnesAdmissions = [
  {
    key: 'patient',
    label: 'Patient',
    render: (ligne) => (
      <div className="patient-cellule">
        <AvatarInitiales initiales={ligne.initiales} variant="secondaire" />
        <div className="patient-cellule__texte">
          <strong>{ligne.patient}</strong>
          <span className="patient-cellule__ligne">ID: {ligne.reference}</span>
        </div>
      </div>
    ),
  },
  { key: 'suivi', label: 'Type de suivi' },
  {
    key: 'statut',
    label: 'Statut',
    render: (ligne) => <BadgeEtat variant={ligne.varianteStatut}>{ligne.statut}</BadgeEtat>,
  },
  { key: 'indicateur', label: 'Indicateurs de sante' },
  {
    key: 'actions',
    label: 'Actions',
    align: 'droite',
    render: () => (
      <div className="bibliotheque__retour-actions">
        <Bouton variant="fantome" taille="petit">Voir</Bouton>
        <Bouton variant="clair" taille="petit">Modifier</Bouton>
      </div>
    ),
  },
]

const rappels = [
  { titre: 'Stock de vaccin tetanos', valeur: 'Faible (12 fioles)', icone: 'ST' },
  { titre: 'Sortie communautaire planifiee', valeur: 'Demain, 08:00', icone: 'SC' },
  { titre: 'Reunion des sages-femmes', valeur: 'Vendredi', icone: 'RM' },
]

function PatientsPage() {
  return (
    <div className="page-patients">
      <BlocTitrePage
        surtitre="Suivi clinique"
        titre="Maternal Health Dashboard"
        description="Suivi des parcours prenataux et pediatriques avec une lecture rapide des indicateurs clefs."
        actions={
          <>
            <Bouton variant="secondaire">Exporter le rapport</Bouton>
            <Bouton variant="primaire">Enregistrer un patient</Bouton>
          </>
        }
      />

      <section className="grille-hero-patients">
        <Carte className="page-patients__resume">
          <div className="resume-patient__entete">
            <div className="resume-patient__identite">
              <AvatarInitiales initiales="MK" taille="grand" variant="tertiaire" />
              <div className="resume-patient__meta">
                <h3>Mariam Kabuo</h3>
                <p className="etat-information">Patient ID: #HMB-2024-0892</p>
                <BadgeEtat variant="tertiaire">CPN active - 28 semaines</BadgeEtat>
              </div>
            </div>

            <div className="resume-patient__meta">
              <span className="bloc-titre-page__surtitre">Derniere visite</span>
              <strong>12 oct 2023</strong>
            </div>
          </div>

          <div className="resume-patient__grille">
            <div>
              <span className="etat-information">Tension arterielle</span>
              <strong>120/80 mmHg</strong>
            </div>
            <div>
              <span className="etat-information">Prise de poids</span>
              <strong>+8.2 kg</strong>
            </div>
            <div>
              <span className="etat-information">Rythme cardiaque foetal</span>
              <strong>145 bpm</strong>
            </div>
            <div>
              <span className="etat-information">Evaluation du risque</span>
              <strong>Faible</strong>
            </div>
          </div>
        </Carte>

        <Carte className="action-rapide">
          <span className="action-rapide__icone">NC</span>
          <div>
            <h3>Nouvelle consultation</h3>
            <p className="hero-tableau-de-bord__description">
              Lancez instantanement une nouvelle session CPN ou CPS depuis ce point d entree.
            </p>
          </div>
          <Bouton variant="clair">Demarrer</Bouton>
        </Carte>
      </section>

      <section className="filtres-patients">
        <div className="filtres-patients__recherche">
          <ChampRecherche placeholder="Filtrer par nom, ID ou localite..." />
        </div>

        <div className="filtres-patients__actions">
          <button type="button" className="puce-filtre">Tous les patients</button>
          <button type="button" className="puce-filtre puce-filtre--active">CPN actifs</button>
          <button type="button" className="puce-filtre">CPS actifs</button>
          <button type="button" className="puce-filtre">Risque eleve</button>
        </div>
      </section>

      <section className="bibliotheque__table">
        <div className="bibliotheque__table-entete">
          <h3>Admissions recentes</h3>
          <Link to="/patients" className="formulaire-connexion__lien">
            Voir tout le registre
          </Link>
        </div>
        <TableauDonnees colonnes={colonnesAdmissions} lignes={admissionsRecentes} />
      </section>

      <div className="grille-insights">
        <section className="rappels-critiques">
          <h3>Indicateurs cliniques</h3>
          <div className="grille-insights">
            <CarteIndicateur
              titre="Charge de la structure"
              valeur="84%"
              description="occupation des equipes"
              variation="+12% vs semaine precedente"
              variant="primaire"
            />
            <CarteIndicateur
              titre="Taux de vaccination"
              valeur="92.5%"
              description="couverture actuelle"
              variation="objectif: 95%"
              variant="tertiaire"
            />
          </div>
        </section>

        <section className="rappels-critiques">
          <h3>Rappels critiques</h3>
          <div className="liste-rappels">
            {rappels.map((rappel) => (
              <div key={rappel.titre} className="liste-rappels__item">
                <div className="liste-rappels__groupe">
                  <span className="liste-rappels__icone">{rappel.icone}</span>
                  <span>{rappel.titre}</span>
                </div>
                <strong>{rappel.valeur}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Carte titre="Patients suivis ce mois" description="Exemple de regroupement visuel reutilisable dans les autres modules.">
        <GroupeAvatars
          elements={[
            { initiales: 'AM', variant: 'primaire' },
            { initiales: 'BK', variant: 'tertiaire' },
            { initiales: 'NS', variant: 'danger' },
          ]}
          surplus={39}
        />
      </Carte>
    </div>
  )
}

export default PatientsPage