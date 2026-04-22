import Alerte from '../../composants/interface/Alerte'
import AvatarInitiales from '../../composants/interface/AvatarInitiales'
import BadgeEtat from '../../composants/interface/BadgeEtat'
import Bouton from '../../composants/interface/Bouton'
import Carte from '../../composants/interface/Carte'
import CarteIndicateur from '../../composants/interface/CarteIndicateur'
import TableauDonnees from '../../composants/interface/TableauDonnees'
import BlocTitrePage from '../../composants/partages/BlocTitrePage'
import EtatChargement from '../../composants/partages/EtatChargement'
import EtatVide from '../../composants/partages/EtatVide'

const consultationsRecentes = [
  {
    id: 1,
    initiales: 'MB',
    patient: 'Mireille Baguma',
    numero: '#4421-23',
    date: '24 oct 2023',
    statut: 'Termine',
    varianteStatut: 'tertiaire',
    service: 'Sante maternelle',
    action: 'Voir details',
  },
  {
    id: 2,
    initiales: 'JK',
    patient: 'Jean Kabila',
    numero: '#8832-11',
    date: '24 oct 2023',
    statut: 'En cours',
    varianteStatut: 'primaire',
    service: 'Pediatrie',
    action: 'Reprendre',
  },
  {
    id: 3,
    initiales: 'LC',
    patient: 'Lucie Chabu',
    numero: '#1209-56',
    date: '23 oct 2023',
    statut: 'Urgent',
    varianteStatut: 'danger',
    service: 'Urgences',
    action: 'Intervenir',
  },
]

const colonnes = [
  {
    key: 'patient',
    label: 'Patient',
    render: (ligne) => (
      <div className="patient-cellule">
        <AvatarInitiales initiales={ligne.initiales} variant="primaire" />
        <div className="patient-cellule__texte">
          <strong>{ligne.patient}</strong>
          <span className="patient-cellule__ligne">ID: {ligne.numero}</span>
        </div>
      </div>
    ),
  },
  { key: 'date', label: 'Date' },
  {
    key: 'statut',
    label: 'Statut',
    render: (ligne) => <BadgeEtat variant={ligne.varianteStatut}>{ligne.statut}</BadgeEtat>,
  },
  { key: 'service', label: 'Departement' },
  {
    key: 'action',
    label: 'Actions',
    align: 'droite',
    render: (ligne) => (
      <Bouton variant={ligne.varianteStatut === 'danger' ? 'danger' : 'fantome'} taille="petit">
        {ligne.action}
      </Bouton>
    ),
  },
]

function BibliothequeComposantsPage() {
  return (
    <div className="page-bibliotheque">
      <BlocTitrePage
        surtitre="Design system"
        titre="Bibliotheque de composants"
        description="Inventaire centralise des briques visuelles et fonctionnelles reutilisables pour l ecosysteme numerique de Himbi."
      />

      <div className="grille-bibliotheque">
        <Carte className="page-bibliotheque__intro">
          <div className="bibliotheque__actions">
            <h3>Composants d action</h3>
            <BadgeEtat variant="primaire">Interactif</BadgeEtat>
          </div>

          <div className="bibliotheque__rangée-boutons">
            <Bouton variant="primaire">Action principale</Bouton>
            <Bouton variant="secondaire">Secondaire</Bouton>
            <Bouton variant="danger">Danger</Bouton>
            <Bouton variant="fantome">Bouton discret</Bouton>
            <div className="bibliotheque__pagination">
              <Bouton variant="clair" taille="petit">Prec.</Bouton>
              <span>Pagination</span>
              <Bouton variant="clair" taille="petit">Suiv.</Bouton>
            </div>
          </div>
        </Carte>

        <div>
          <CarteIndicateur
            titre="Consultations actives"
            valeur="124"
            description="en cours aujourd hui"
            variation="+12% par rapport a hier"
            variant="primaire"
          />
          <div className="bibliotheque__petite-carte">
            <CarteIndicateur
              titre="Niveau de stock"
              valeur="98%"
              description="inventaire stable"
              variation="couverture satisfaisante"
              variant="tertiaire"
            />
          </div>
        </div>
      </div>

      <Carte
        titre="Saisie clinique"
        description="Exemples de champs optimises pour la lisibilite et la rapidite de saisie."
      >
        <div className="bibliotheque__champ-grid">
          <div className="bibliotheque__champ-cases">
            <label>Nom complet<br /><input type="text" defaultValue="Amani Bisimwa" className="w-full rounded-lg border border-[#dfeaee] p-2" /></label>
            <label>Adresse email<br /><input type="text" placeholder="amani@example.com" className="w-full rounded-lg border border-[#dfeaee] p-2" /></label>
            <label>Mot de passe<br /><input type="password" defaultValue="********" className="w-full rounded-lg border border-[#dfeaee] p-2" /></label>
          </div>

          <div className="bibliotheque__champ-cases">
            <label>Type de consultation<br />
              <select defaultValue="pediatrie" className="w-full rounded-lg border border-[#dfeaee] p-2">
                <option value="pediatrie">Consultation pediatrique</option>
                <option value="maternite">Consultation maternelle</option>
                <option value="urgence">Triage d urgence</option>
              </select>
            </label>

            <div className="bibliotheque__choix">
              <strong>Statut d urgence</strong>
              <div className="bibliotheque__choix-ligne">
                <label className="bibliotheque__choix-element">
                  <input type="radio" name="urgence" defaultChecked />
                  <span>Normal</span>
                </label>
                <label className="bibliotheque__choix-element">
                  <input type="radio" name="urgence" />
                  <span>Critique</span>
                </label>
              </div>
            </div>

            <label className="bibliotheque__choix-element">
              <input type="checkbox" defaultChecked />
              <span>Consentement numerique signe</span>
            </label>
          </div>

          <label>Observations cliniques<br />
            <textarea placeholder="Saisissez ici les notes medicales detaillees..." className="w-full rounded-lg border border-[#dfeaee] p-2" rows={3} />
          </label>
        </div>
      </Carte>

      <section className="bibliotheque__table">
        <div className="bibliotheque__table-entete">
          <h3>Consultations recentes</h3>
          <div className="bibliotheque__retour-actions">
            <Bouton variant="clair" taille="petit">Filtrer</Bouton>
            <Bouton variant="clair" taille="petit">Exporter</Bouton>
          </div>
        </div>
        <TableauDonnees colonnes={colonnes} lignes={consultationsRecentes} />
      </section>

      <div className="grille-bas">
        <Carte titre="Messages de retour" description="Differents niveaux de feedback utilisables dans les modules.">
          <div className="panneau-interactif">
            <Alerte type="succes">Dossier patient mis a jour avec succes.</Alerte>
            <Alerte type="erreur">Resultat de laboratoire invalide. Verification requise.</Alerte>
            <Alerte type="info">Mise a jour systeme programmee a 02:00.</Alerte>
          </div>
        </Carte>

        <Carte titre="Etats interactifs" description="Exemples de chargement, vide et confirmation.">
          <div className="panneau-interactif">
            <EtatChargement message="Traitement du dossier en cours..." />
            <EtatVide
              titre="Aucune donnee sur cette plage"
              description="Le rapport apparaitra ici une fois les filtres appliques."
            />
            <div className="demonstration-dialogue">
              <h4>Supprimer ce dossier ?</h4>
              <p className="etat-information">
                Cette action est irreversible. Verifiez avant de confirmer.
              </p>
              <div className="demonstration-dialogue__actions">
                <Bouton variant="danger" taille="petit">Supprimer</Bouton>
                <Bouton variant="clair" taille="petit">Annuler</Bouton>
              </div>
            </div>
          </div>
        </Carte>
      </div>
    </div>
  )
}

export default BibliothequeComposantsPage