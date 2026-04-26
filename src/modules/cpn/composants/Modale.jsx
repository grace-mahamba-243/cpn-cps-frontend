// Composant modale réutilisable : fermeture par overlay, touche Échap, et bouton croix.
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function Modale({ titre, ouvert, onFermer, children, tailleMax = 'max-w-2xl' }) {
  useEffect(() => {
    if (!ouvert) return
    const handler = (e) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onFermer} />

      {/* Fenêtre modale */}
      <div className={`relative z-10 w-full ${tailleMax} rounded-3xl bg-surface shadow-2xl`}>
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4">
          <h2 className="font-headline text-lg font-bold text-on-surface">{titre}</h2>
          <button
            onClick={onFermer}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="max-h-[75vh] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Modale
