import { Link } from 'react-router-dom'
import sessionBg from '../../../assets/session-bg.png'
import sessionIllustration from '../../../assets/session-expiree-illustration.png'

// Ce composant affiche la page transactionnelle de session expiree et guide l'utilisateur
// vers une nouvelle connexion apres interruption automatique de sa session.
function PageSessionExpiree() {
    return (
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(16,24,40,0.12)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-5 md:px-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/15">
                        <span className="material-symbols-outlined">medical_services</span>
                    </div>
                    <div>
                        <p className="font-headline text-lg font-extrabold text-on-surface">
                            Centre de Sante Afia Himbi
                        </p>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-on-surface-variant">
                            Portail clinique securise
                        </p>
                    </div>
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <span className="material-symbols-outlined rounded-full bg-surface-container p-2 text-on-surface-variant transition-colors hover:text-primary">
                        language
                    </span>
                    <span className="material-symbols-outlined rounded-full bg-surface-container p-2 text-on-surface-variant transition-colors hover:text-primary">
                        help_outline
                    </span>
                </div>
            </div>

            <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-2">
                <aside className="relative hidden overflow-hidden bg-primary md:block">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dim opacity-90" />
                    <img
                        alt="Couloir hospitalier moderne"
                        className="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
                        src={sessionBg}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-end p-10 text-on-primary">
                        <h2 className="font-headline text-3xl font-extrabold leading-tight">
                            Portail Clinique
                        </h2>
                        <p className="mt-4 max-w-sm font-body leading-relaxed text-primary-container opacity-90">
                            La protection de vos donnees medicales et de la sante maternelle est notre priorite absolue.
                        </p>

                        <div className="mt-8 flex items-center gap-3">
                            <div className="h-1 w-12 rounded-full bg-primary-fixed" />
                            <span className="font-label text-xs font-bold uppercase tracking-widest">
                                Securite Himbi
                            </span>
                        </div>
                    </div>
                </aside>

                <div className="flex flex-col justify-center px-8 py-10 text-center md:px-12">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-8 flex justify-center">
                            <div className="h-32 w-32 overflow-hidden">
                                <img
                                    alt="Illustration session expiree"
                                    className="h-full w-full object-contain"
                                    src={sessionIllustration}
                                />
                            </div>
                        </div>

                        <h1 className="font-headline text-2xl font-extrabold text-on-surface md:text-3xl">
                            Session expiree
                        </h1>

                        <p className="mx-auto mt-4 max-w-xs font-body leading-relaxed text-on-surface-variant">
                            Pour votre securite, votre session a ete automatiquement interrompue suite a une periode d'inactivite prolongee.
                        </p>

                        <div className="mt-8 flex w-full items-start gap-4 rounded-xl bg-surface-container-low p-4 text-left">
                            <span className="material-symbols-outlined mt-0.5 text-tertiary">security</span>
                            <p className="text-sm font-body text-on-surface-variant">
                                Vos modifications non enregistrees ont ete protegees. Veuillez vous reconnecter pour acceder au dossier patient.
                            </p>
                        </div>

                        <Link
                            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 font-bold text-on-primary transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                            to="/"
                        >
                            <span className="material-symbols-outlined">login</span>
                            Retour a la connexion
                        </Link>

                        <div className="mt-12 flex flex-col items-center gap-2">
                            <p className="font-label text-xs text-on-surface-variant">Besoin d'aide ?</p>
                            <Link className="text-sm font-bold text-primary hover:underline" to="/">
                                Contacter l'assistance technique
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PageSessionExpiree
