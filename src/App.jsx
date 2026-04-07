import AppRoutes from './application/routes'
import { FournisseurAuthentification } from './modules/authentification/contexte/ContexteAuthentification'

// Ce composant racine enveloppe toute l'application avec le provider d'authentification.
function App() {
  return (
    <FournisseurAuthentification>
      <AppRoutes />
    </FournisseurAuthentification>
  )
}

export default App
