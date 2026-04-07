import { useContext } from 'react'
import { ContexteAuthentification } from '../contexte/ContexteAuthentification'

// Ce hook permet d'acceder simplement a l'etat et aux actions du contexte d'authentification.
function useAuthentification() {
  const contexte = useContext(ContexteAuthentification)

  if (!contexte) {
    throw new Error('useAuthentification doit etre utilise dans un FournisseurAuthentification.')
  }

  return contexte
}

export default useAuthentification