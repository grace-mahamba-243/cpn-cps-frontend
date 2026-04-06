import Bouton from '../../composants/interface/Bouton'
import Carte from '../../composants/interface/Carte'
import CarteIndicateur from '../../composants/interface/CarteIndicateur'
import BarreProgression from '../../composants/interface/BarreProgression'

const cartesProgramme = [
  {
    titre: 'Sante maternelle',
    valeur: '42',
    description: 'parcours prenataux actifs ce mois-ci',
    variation: 'Suivi continu sur 4 zones',
    variant: 'tertiaire',
  },
  {
    titre: 'Immunisation',
    valeur: '98%',
    description: 'couverture de la derniere campagne polio',
    variation: 'Rapport pret au telechargement',
    variant: 'primaire',
  },
  {
    titre: 'Stock de medicaments',
    valeur: '2 j',
    description: 'reserve restante pour l oxytocine',
    variation: 'Commande urgente recommandee',
    variant: 'danger',
  },
]

function TableauDeBordPage() {
  return (
    <div className="page-tableau-de-bord">
      <section className="grille-hero-tableau-de-bord">
        <Carte className="hero-tableau-de-bord" variant="hero">
          <div className="hero-tableau-de-bord__contenu">
            <div>
              <p className="hero-tableau-de-bord__surtitre">Resume du jour</p>
              <h2 className="hero-tableau-de-bord__titre">Bonjour, Dr Mwamba</h2>
              <p className="hero-tableau-de-bord__description">
                12 consultations sont programmees aujourd hui et 4 dossiers maternels
                prioritaires demandent une revue rapide.
              </p>
            </div>

            <div className="hero-tableau-de-bord__actions">
              <Bouton variant="clair">Voir le planning</Bouton>
              <Bouton variant="secondaire">Resume rapide</Bouton>
            </div>
          </div>
        </Carte>

        <Carte
          titre="Rythme de la clinique"
          description="Capacite et flux des consultations"
          className="panneau-activite"
        >
          <div className="panneau-activite__valeur">84%</div>
          <BarreProgression
            valeur={84}
            annotation="Occupation elevee aujourd hui. Envisager de deleguer les suivis de routine."
            variant="tertiaire"
          />
        </Carte>
      </section>

      <section className="grille-indicateurs">
        {cartesProgramme.map((carte) => (
          <CarteIndicateur key={carte.titre} {...carte} />
        ))}
      </section>

      <Carte
        titre="Vitesse de croissance communautaire"
        description="Progression agregée du poids des nouveau-nes par rapport a la plage saine."
        className="carte-graphique"
      >
        <div className="graphique-evolution">
          <div className="graphique-evolution__zone-saine" />
          <div className="graphique-evolution__grille">
            <span />
            <span />
            <span />
            <span />
          </div>
          <svg viewBox="0 0 100 40" className="graphique-evolution__courbe" preserveAspectRatio="none">
            <path d="M0 30 C 10 28, 18 24, 28 23 S 48 18, 58 17 S 78 11, 88 9 S 96 6, 100 5" />
          </svg>
        </div>

        <div className="graphique-evolution__legende">
          <span>Jan</span>
          <span>Fev</span>
          <span>Mar</span>
          <span>Avr</span>
          <span>Mai</span>
          <span>Juin</span>
          <span>Juil</span>
          <span>Aout</span>
        </div>
      </Carte>
    </div>
  )
}

export default TableauDeBordPage