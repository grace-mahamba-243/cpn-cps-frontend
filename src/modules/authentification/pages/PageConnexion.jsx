import { useState } from 'react';
import lbbm from '../../../assets/login-bg.jpg';
import ChampSaisieIcone from '../../../composants/interface/ChampSaisieIcone';
import BoutonAction from '../../../composants/interface/BoutonAction';

export default function PageConnexion() {
    const [motDePasseVisible, setMotDePasseVisible] = useState(false);
    const [enChargement, setEnChargement] = useState(false);

    const gererSoumission = (e) => {
        e.preventDefault();
        setEnChargement(true);
        // Simulation d'une requête de connexion
        setTimeout(() => {
            setEnChargement(false);
        }, 1500);
    };

    return (
        <>
            <main className="relative z-30 w-full max-w-4xl mx-auto grid md:grid-cols-2 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/20 bg-white">
                {/* Colonne de gauche : Marque & Message avec image de fond */}
                <div className="hidden md:flex flex-col justify-between p-10 relative text-on-primary">
                    {/* Couche d'image en arrière-plan */}
                    <div className="absolute inset-0 z-0">
                        <img
                            alt="Medical staff with baby"
                            className="w-full h-full object-cover"
                            src={lbbm}
                        />
                        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl" data-icon="medical_services">medical_services</span>
                            <h1 className="text-xl font-extrabold tracking-tight">Centre de Santé Afia Himbi</h1>
                        </div>
                        <div className="h-1 w-12 bg-tertiary-container rounded-full"></div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="bg-white/20 backdrop-blur-md p-5 rounded-xl border border-white/30 mt-5">
                            <p className="text-lg leading-relaxed font-headline font-semibold italic text-white">
                                "Pour la maman et son enfant, chaque consultation est un geste de vie, d’amour et de protection."
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white font-medium">
                            <span className="flex items-center gap-1 drop-shadow-md">
                                <span className="material-symbols-outlined text-base" data-icon="verified_user">verified_user</span>
                                Portail Sécurisé
                            </span>
                            <span className="flex items-center gap-1 drop-shadow-md">
                                <span className="material-symbols-outlined text-base" data-icon="maternity">pregnancy</span>
                                Santé Maternelle
                            </span>
                        </div>
                    </div>
                </div>

                {/* Colonne de droite : Formulaire de connexion */}
                <div className="p-6 md:p-10 flex flex-col justify-center bg-white">
                    <div className="mb-6 md:hidden text-center">
                        <h1 className="text-xl font-extrabold text-primary">Centre de Santé Afia Himbi</h1>
                    </div>

                    <div className="mb-8 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-on-surface mb-2">Bon retour</h2>
                        <p className="text-sm text-on-surface-variant font-medium">Accédez à votre espace professionnel</p>
                    </div>

                    {/* Conteneur du formulaire */}
                    <form onSubmit={gererSoumission} className="space-y-5">

                        <ChampSaisieIcone
                            id="identifiant"
                            label="Identifiant"
                            placeholder="ex: baraka.believe.baraka@himbi.cd"
                            icone="person"
                        />

                        <ChampSaisieIcone
                            id="motdepasse"
                            label="Mot de passe"
                            type={motDePasseVisible ? "text" : "password"}
                            placeholder="••••••••"
                            icone="lock"
                            lienMotDePasseOublie="#"
                            actionIcone={{
                                icone: motDePasseVisible ? "visibility_off" : "visibility",
                                onClick: () => setMotDePasseVisible(!motDePasseVisible)
                            }}
                        />

                        {/* Bouton de soumission */}
                        <BoutonAction
                            type="submit"
                            texte="Se connecter"
                            icone="login"
                            enChargement={enChargement}
                            texteChargement="Vérification des accès..."
                        />

                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-on-surface-variant text-xs">Besoin d'aide ?
                            <a className="text-primary font-bold hover:underline ml-1" href="#">Contacter l'assistance technique</a>
                        </p>
                    </div>
                </div>
            </main>

            {/* Bouton d'action flottant pour l'assistance */}
            <div className="fixed bottom-6 right-6 z-50">
                <button className="bg-tertiary text-on-tertiary w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group">
                    <span className="material-symbols-outlined" data-icon="support_agent">support_agent</span>
                    <span className="absolute right-full mr-4 bg-on-surface text-surface text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Assistance Directe</span>
                </button>
            </div>
        </>
    );
}
