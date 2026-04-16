export default function BoutonAction({ 
    icone, 
    texte, 
    type = "button", 
    enChargement = false, 
    texteChargement = "Chargement...", 
    ...props 
}) {
    return (
        <div className="pt-3 flex flex-col gap-3">
            <button 
                className={`w-full bg-primary text-on-primary py-3 rounded-full font-bold text-base shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${enChargement ? 'opacity-70 pointer-events-none' : ''}`} 
                type={type}
                disabled={enChargement}
                {...props}
            >
                {icone && !enChargement && (
                    <span className="material-symbols-outlined text-xl" data-icon={icone}>
                        {icone}
                    </span>
                )}
                {texte}
            </button>
            
            {enChargement && (
                <div className="flex items-center justify-center gap-2 text-on-surface-variant text-sm py-2">
                    <div className="w-4 h-4 border-2 border-outline-variant/50 border-t-transparent rounded-full animate-spin"></div>
                    {texteChargement}
                </div>
            )}
        </div>
    );
}
