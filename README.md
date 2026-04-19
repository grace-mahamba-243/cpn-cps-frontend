# CPN-CPS Frontend — Centre de Santé Afia Himbi

Interface web du système de gestion des consultations prénatales (CPN) et des consultations post-natales (CPS) du Centre de Santé Afia Himbi.

---

## Contexte du projet

Ce projet est issu d'une **descente terrain** au Centre de Santé Afia Himbi. L'application accompagne le parcours complet de la mère et de l'enfant, depuis l'accueil jusqu'au suivi postnatal.

### Logique métier du parcours clinique

**Femme → Grossesse → CPN → Accouchement → CPS femme + Dossier enfant → Suivi enfant + Vaccination**

### Règles métier validées sur le terrain

- La **CPN** est réalisée par l'infirmier ou la sage-femme
- La **CPS femme** est réalisée par le médecin selon le rythme **6h · 6 jours · 6 semaines**
- La **vaccination enfant** est réalisée par le médecin
- Le **suivi de l'enfant** continue jusqu'à **59 mois**
- La **réceptionniste** gère l'accueil, la recherche de dossier, l'enregistrement, les rendez-vous et l'orientation
- Une femme peut venir en CPS même si elle n'a **pas fait sa CPN** au centre ou **n'a pas accouché** au centre
- Les rendez-vous **planifiés, surprise et annulés** sont gérés ; les annulés sont conservés dans l'historique
- Il n'y a **pas d'échographie sur place**
- Il existe un **laboratoire** et une **pharmacie**

### Organisation fonctionnelle

| Niveau | Modules |
|---|---|
| **Socle** | Authentification · Gestion des accès · Réception · Rendez-vous |
| **Cœur mère** | CPN · Accouchement · CPS femme |
| **Cœur enfant** | CPS enfant · Dossier enfant |
| **Support** | Laboratoire · Administration |

---

## Technologies

| Outil | Version |
|---|---|
| React | 19 |
| React Router DOM | 7 |
| Vite | 8 |
| Tailwind CSS | 4 |

---

## Prérequis

- Node.js >= 18
- Le backend (`cpn-cps-nestjs`) doit être en cours d'exécution sur le port `3000`

---

## Installation et démarrage

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

L'application sera accessible sur `http://localhost:5173`.

---

## Structure du projet

```
src/
 application/
    layouts/               # Gabarits des pages (public / privé)
    routes/                # Configuration du routage et protection des routes
 composants/
    interface/             # Composants UI réutilisables (Bouton, Carte, Tableau, Alerte...)
    navigation/            # Barre latérale et entête de l'application
    partages/              # Composants partagés (Chargement, EtatVide, BlocTitrePage...)
 modules/
    accouchement/          # Enregistrement et suivi des accouchements
    administration/        # Journal des activités cliniques
    authentification/      # Connexion, déconnexion, gestion de session
    cpn/                   # Consultations prénatales (dossier, contacts, examens)
    cps-enfant/            # Consultations post-natales enfant (dossier, visites, examens)
    cps-femme/             # Consultations post-natales femme (dossier, visites, examens)
    dossier-enfant/        # Dossier médical de l'enfant (suivis, nutrition, vaccinations)
    gestion-acces/         # Gestion des utilisateurs et des rôles
    laboratoire/           # Demandes et résultats de laboratoire
    reception/             # Tableau de bord réception et enregistrement des arrivées
    rendez-vous/           # Création, liste et suivi des rendez-vous
    tableau-bord-clinique/ # File d'attente générale
 pages/
    bibliotheque-composants/ # Démonstration des composants UI
    erreurs/               # Pages 403, 404
    patients/              # Enregistrement et fiches des patients
 services/
    api/                   # Appels vers l'API backend (un fichier par module)
 styles/                    # Styles globaux
```

---

## Modules fonctionnels

| Module | Rôle |
|---|---|
| **Authentification** | Connexion / déconnexion, gestion du token JWT |
| **Réception** | Tableau de bord réception et enregistrement des arrivées |
| **Rendez-vous** | Création, liste et suivi des rendez-vous |
| **Tableau de bord clinique** | File d'attente générale |
| **CPN** | Consultations prénatales (dossier, contacts, examens, historique) |
| **CPS Femme** | Consultations post-natales mère — rythme 6h · 6j · 6sem |
| **CPS Enfant** | Consultations post-natales enfant (dossier, visites, examens) |
| **Accouchement** | Enregistrement et suivi des accouchements |
| **Dossier Enfant** | Dossier médical de l'enfant (suivis, nutrition, vaccinations, examens) |
| **Laboratoire** | Demandes et résultats de laboratoire |
| **Gestion des accès** | Gestion des utilisateurs et des rôles |
| **Administration** | Journal des activités cliniques |

---

## Assistant clinique IA

L'application intègre un assistant clinique basé sur l'API **OpenAI** dans deux modules :

| Module | Usage |
|---|---|
| **CPN** | Analyse automatique des données de la consultation prénatale et suggestions cliniques |
| **CPS Femme** | Analyse des visites post-natales et recommandations de suivi |

L'assistant reçoit les données cliniques saisies dans le formulaire et retourne une analyse structurée affichée directement dans l'interface. Il est adapté au contexte d'une maternité à Goma, RDC.

---

