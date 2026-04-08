export default function ChampSaisieIcone({ 
    id, 
    label, 
    type = 'text', 
    placeholder, 
    icone, 
    actionIcone, 
    ...props 
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
                <label htmlFor={id} className="block text-xs font-semibold text-on-surface-variant">
                    {label}
                </label>
                {props.lienMotDePasseOublie && (
                    <a className="text-xs font-bold text-primary hover:underline transition-all" href={props.lienMotDePasseOublie}>
                        Oublié?
                    </a>
                )}
            </div>
            <div className="relative group">
                <span 
                    className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors cursor-default text-lg" 
                    data-icon={icone}
                >
                    {icone}
                </span>
                
                <input 
                    id={id}
                    type={type}
                    className="w-full pl-10 pr-10 py-3 text-sm bg-surface-container border-none rounded-xl focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-outline-variant/60" 
                    placeholder={placeholder} 
                    {...props}
                />
                
                {actionIcone && (
                    <button 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface" 
                        type="button"
                        onClick={actionIcone.onClick}
                    >
                        <span className="material-symbols-outlined text-lg" data-icon={actionIcone.icone}>
                            {actionIcone.icone}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
