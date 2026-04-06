import { Link } from 'react-router-dom';
import sessionBg from '../../../assets/session-bg.png';
import sessionIllustration from '../../../assets/session-expiree-illustration.png';

/**
 * PageSessionExpiree - Page affichée lorsque la session de l'utilisateur a expiré.
 * Page transactionnelle : la barre de navigation latérale est exclue.
 * Dimensions réduites de ~20% pour respecter la logique de "Zoom 80%".
 */
export default function PageSessionExpiree() {
    return (
        <main className="w-full max-w-[56rem] mx-auto grid md:grid-cols-2 rounded-xl overflow-hidden shadow-2xl shadow-on-surface/5 bg-surface-container-lowest">

            {/* Colonne de gauche : Illustration visuelle / Panneau éditorial */}
            <div className="relative hidden md:block overflow-hidden bg-primary">
                {/* Dégradé de fond */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dim opacity-90"></div>

                {/* Image de fond avec effet de superposition */}
                <img
                    alt="Couloir d'hôpital moderne"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
                    src={sessionBg}
                />

                {/* Contenu texte superposé */}
                <div className="relative z-10 h-full flex flex-col justify-end p-8 text-on-primary">
                    <h2 className="text-2xl font-extrabold font-headline mb-3 leading-tight">
                        Portail Clinique
                    </h2>
                    <p className="text-primary-container font-body leading-relaxed opacity-90 text-sm">
                        La protection de vos données médicales et de la santé maternelle est notre priorité absolue.
                    </p>

                    {/* Badge de sécurité */}
                    <div className="mt-6 flex items-center gap-2.5">
                        <div className="w-10 h-0.5 bg-primary-fixed rounded-full"></div>
                        <span className="text-[0.65rem] uppercase tracking-widest font-bold font-label">
                            Sécurité Himbi
                        </span>
                    </div>
                </div>
            </div>

            {/* Colonne de droite : Contenu principal */}
            <div className="p-6 md:p-10 flex flex-col justify-center items-center text-center">

                {/* Illustration de session expirée */}
                <div className="w-24 h-24 mb-6 overflow-hidden">
                    <img
                        alt="Illustration session expirée"
                        className="w-full h-full object-contain"
                        src={sessionIllustration}
                    />
                </div>

                {/* Titre de la page */}
                <h1 className="text-xl md:text-2xl font-extrabold font-headline text-on-surface mb-3">
                    Session expirée
                </h1>

                {/* Description */}
                <p className="text-on-surface-variant font-body mb-6 leading-relaxed max-w-[17rem] text-sm">
                    Pour votre sécurité, votre session a été automatiquement interrompue suite à une période d'inactivité prolongée.
                </p>

                {/* Encadré d'information — Empilement tonal */}
                <div className="w-full bg-surface-container-low p-3 rounded-xl flex items-start gap-3 mb-6 text-left">
                    <span className="material-symbols-outlined text-tertiary mt-0.5" data-icon="security">
                        security
                    </span>
                    <p className="text-xs font-body text-on-surface-variant leading-relaxed">
                        Vos modifications non enregistrées ont été protégées. Veuillez vous reconnecter pour accéder au dossier patient.
                    </p>
                </div>

                {/* Bouton d'action — Retour à la connexion */}
                <Link
                    to="/"
                    className="w-full bg-primary text-on-primary font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2.5 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 text-sm"
                >
                    <span className="material-symbols-outlined text-xl" data-icon="login">
                        login
                    </span>
                    Retour à la connexion
                </Link>

                {/* Liens d'aide en bas de page */}
                <div className="mt-10 flex flex-col items-center gap-1.5">
                    <p className="text-[0.65rem] font-label text-on-surface-variant">Besoin d'aide ?</p>
                    <a
                        href="#"
                        className="text-primary font-bold text-xs hover:underline"
                    >
                        Contacter l'assistance technique
                    </a>
                </div>
            </div>
        </main>
    );
}
