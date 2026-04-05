import Carte from '../../composants/interface/Carte'
import EtatVide from '../../composants/partages/EtatVide'

function TableauDeBordPage() {
  return (
    <section className="tableau-de-bord">
      <Carte
        titre="Vue d'ensemble"
        description="Cet espace accueille les premiers modules metier lorsqu'ils seront implementes."
      >
        <EtatVide
          titre="Modules non initialises"
          description="La structure des dossiers est prete. Vous pouvez maintenant brancher les fonctionnalites metier module par module."
        />
      </Carte>
    </section>
  )
}

export default TableauDeBordPage