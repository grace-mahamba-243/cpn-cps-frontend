
##  Présentation du Projet

### Contexteg

Dans les centres de santé de Goma (RDC), le suivi médical des grossesses et des naissances est encore largement géré sur papier, avec les risques de perte de données, d'erreurs et d'absence de traçabilité que cela implique.

**Afia Himbi** numérise et centralise l'intégralité du parcours de soins :

| Étape | Description |
|-------|-------------|
| ① | Enregistrement de la patiente (mère) |
| ② | Ouverture du dossier CPN (consultation prénatale) |
| ③ | Suivi des contacts CPN avec analyse IA des constantes |
| ④ | Enregistrement de l'accouchement |
| ⑤ | Ouverture du dossier CPS Femme (suivi postnatal mère) |
| ⑥ | Enregistrement du nouveau-né (dossier enfant) |
| ⑦ | Ouverture du dossier CPS Enfant (suivi postnatal 0–59 mois) |
| ⑧ | Vaccination de l'enfant selon le calendrier vaccinal |
| ⑨ | Gestion des examens biologiques au laboratoire |
| ⑩ | Gestion des rendez-vous et de la file d'attente |

### Utilisateurs Cibles

| Rôle | Responsabilités |
|------|----------------|
| **Réceptionniste** | Enregistrement patientes, rendez-vous, accueil, file d'attente |
| **Infirmier / Sage-femme** | Suivi CPN, contacts, examens, accouchements |
| **Médecin** | CPS Femme, CPS Enfant, suivi enfant, laboratoire |
| **Administrateur** | Gestion utilisateurs, rôles, journal d'activités |

---
##.
<img width="1919" height="947" alt="image" src="https://github.com/user-attachments/assets/5849868f-5209-43f9-95bc-bac760a110c1" />

## État de sortie de la patiente
<img width="1916" height="957" alt="image" src="https://github.com/user-attachments/assets/d611ad54-ef52-474f-907a-186e56c8b6eb" />
## dossier d'une patiente 
<img width="1919" height="942" alt="image" src="https://github.com/user-attachments/assets/9331f133-a163-4907-b930-5a0386809d40" />

##Voici l’analyse de l’IA basée sur les données de la patiente.
<img width="1919" height="948" alt="image" src="https://github.com/user-attachments/assets/72ab6595-5f81-44fe-9292-1406258ceac0" />






##  Architecture Technique

```
┌─────────────────────────────────────────────────────┐
│              NAVIGATEUR WEB (Client)                │
│         React 19 + Vite  ── port 5173               │
│   Pages ─ Composants ─ Services API (fetch)        │
└───────────────────┬─────────────────────────────────┘
                    │  HTTP REST  (JSON)
                    ▼
┌─────────────────────────────────────────────────────┐
│           SERVEUR APPLICATION (Backend)             │
│         NestJS 11 / TypeScript ── port 3000         │
│   Controllers ─ Services ─ DTOs ─ Entités TypeORM  │
│                     │                               │
│            OpenAI GPT API (HTTPS)                   │
│       Analyse clinique CPN / CPS Femme              │
└───────────────────┬─────────────────────────────────┘
                    │  SQL / TypeORM
                    ▼
┌─────────────────────────────────────────────────────┐
│          BASE DE DONNÉES MySQL 8                    │
│       cpn_cps_himbi  ── port 3306                   │
│   26 fichiers de migration ─ 20+ tables             │
└─────────────────────────────────────────────────────┘
```

---

## Stack Technologique

| Couche | Technologie |
|--------|------------|
| Frontend | React | 
| Bundler | Vite |
| CSS | Tailwind CSS | 
| Routage frontend | React Router DOM | 
| Backend | NestJS | 
| Langage backend | TypeScript | 
| ORM | TypeORM | 
| Base de données | MySQL 
| IA | OpenAI SDK | 

---

##  Structure des Répertoires

```
projet/
├── cpn-cps-frontend/               ← Application React (Vite)
│   ├── src/
│   │   ├── application/
│   │   │   ├── layouts/            ← LayoutPublic, LayoutPrive
│   │   │   └── routes/             ← Registre des routes, protection par rôle
│   │   ├── composants/
│   │   │   ├── interface/          ← Bouton, Carte, Tableau, Badge, Alerte...
│   │   │   ├── navigation/         ← BarreLaterale, Entete
│   │   │   └── partages/           ← BlocTitrePage, Chargement, EtatVide...
│   │   ├── modules/
│   │   │   ├── authentification/   ← Page de connexion, contexte auth
│   │   │   ├── reception/          ← File d'attente, rendez-vous
│   │   │   ├── cpn/                ← Dossiers CPN, contacts, examens
│   │   │   ├── accouchement/       ← Liste et enregistrement accouchements
│   │   │   ├── cps-femme/          ← Dossiers CPS mère, visites, examens
│   │   │   ├── cps-enfant/         ← Dossiers CPS enfant, visites, examens
│   │   │   ├── dossier-enfant/     ← Suivi croissance, vaccinations, examens
│   │   │   ├── laboratoire/        ← Demandes labo, résultats
│   │   │   ├── tableau-bord-clinique/ ← File d'attente générale
│   │   │   ├── gestion-acces/      ← Contrôle d'accès, rôles, permissions
│   │   │   └── administration/     ← Gestion utilisateurs et rôles
│   │   └── services/api/           ← Couche d'appel HTTP vers le backend
│   └── public/
│
└── cpn-cps-nestjs/                 ← API NestJS (TypeScript)
    ├── src/
    │   ├── main.ts                 ← Bootstrap : CORS, ValidationPipe, port
    │   ├── app.module.ts           ← Module racine
    │   ├── config/                 ← app.config.ts, database.config.ts
    │   ├── database/
    │   │   ├── migrations/         ← 26 fichiers de migration TypeORM
    │   │   └── seeds/              ← Données initiales (rôles)
    │   └── modules/
    │       ├── auth/               ← Connexion, déconnexion, sessions
    │       ├── users/              ← CRUD utilisateurs
    │       ├── roles/              ← CRUD rôles
    │       ├── patientes/          ← Dossiers mères
    │       ├── enfants/            ← Dossiers enfants
    │       ├── cpn/                ← Module CPN complet
    │       ├── accouchements/      ← Accouchements
    │       ├── cps-femme/          ← CPS mère
    │       ├── cps-enfant/         ← CPS enfant
    │       ├── suivi-enfant/       ← Suivi croissance
    │       ├── vaccination/        ← Doses vaccinales
    │       ├── laboratoire/        ← Examens biologiques
    │       ├── rendez-vous/        ← Agenda et planification
    │       ├── dashboard/          ← Statistiques et indicateurs
    │       └── journal/            ← Audit des activités
    └── scripts/                    ← Scripts utilitaires Node.js
```

---

##  Prérequis

Avant de démarrer le projet, assurez-vous d'avoir installé :

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Node.js | 18.x | `node -v` |
| npm | 9.x | `npm -v` |
| MySQL Server | 8.x | `mysql --version` |
| Git | 2.x | `git --version` |
| Python | 3.10+ | `python --version` (pour génération UML) |

---

## Installation et Lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/<votre-compte>/cpn-cps-himbi.git
cd cpn-cps-himbi
```

### 2. Créer la base de données MySQL

```sql
-- Dans MySQL Workbench ou ligne de commande
CREATE DATABASE cpn_cps_himbi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurer le backend

```bash
cd cpn-cps-nestjs

# Copier le fichier d'environnement
cp .env.example .env
# Éditer .env avec vos identifiants MySQL et clé OpenAI
```

```bash
# Installer les dépendances
npm install
```

```bash
# Lancer en mode développement (rechargement automatique)
npm run start:dev
```

**Output attendu :**

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [InstanceLoader] AuthModule dependencies initialized
[Nest] LOG [InstanceLoader] CpnModule dependencies initialized
...
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [Bootstrap] Backend CPN/CPS Himbi demarre sur http://localhost:3000/api
```

**État de sortie :** `0` (succès) — le serveur écoute sur le port **3000**

### 4. Configurer le frontend

```bash
cd cpn-cps-frontend

# Installer les dépendances
npm install
```

```bash
# Lancer en mode développement
npm run dev
```

**Output attendu :**

```
  VITE v8.0.x  ready in 312 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**État de sortie :** `0` (succès) — l'application est accessible sur **http://localhost:5173**

### 5. Build de production

```bash
# Backend
cd cpn-cps-nestjs
npm run build
# Output : dossier dist/ créé
node dist/main.js

# Frontend
cd cpn-cps-frontend
npm run build
# Output : dossier dist/ créé avec les fichiers statiques
```

---

## Variables d'Environnement

Créer un fichier `.env` dans `cpn-cps-nestjs/` :

```env
# Application
APP_PORT=3000
API_PREFIX=api

# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=cpn_cps_himbi

# TypeORM
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false

# OpenAI (requis pour l'analyse clinique IA)
OPENAI_API_KEY=sk-...votre_cle_openai...
```



---

##  Base de Données

### Tables Principales

| Table | Description | Clés principales |
|-------|-------------|-----------------|
| `roles` | Rôles utilisateurs | `id`, `code`, `libelle` |
| `utilisateurs` | Comptes utilisateurs | `id`, `identifiant`, `role_id` |
| `sessions_authentification` | Sessions actives | `id`, `jeton_session`, `expire_le` |
| `patientes` | Dossiers des mères | `id`, `numero_dossier`, `nom` |
| `dossiers_cpn` | Dossiers prénataux | `id`, `patiente_id`, `statut` |
| `contacts_cpn` | Consultations CPN | `id`, `dossier_cpn_id`, `numero_contact` |
| `examens_cpn` | Examens biologiques CPN | `id`, `dossier_cpn_id`, `type_examen` |
| `accouchements` | Enregistrements accouchements | `id`, `patiente_id`, `date_accouchement` |
| `dossiers_cps_femme` | Suivi postnatal mère | `id`, `patiente_id`, `accouchement_id` |
| `visites_cps_femme` | Visites postnatales mère | `id`, `dossier_cps_id`, `type_visite` |
| `enfants` | Dossiers enfants | `id`, `numero_dossier`, `patiente_id` |
| `dossiers_cps_enfant` | Suivi postnatal enfant | `id`, `enfant_id` |
| `visites_cps_enfant` | Visites postnatales enfant | `id`, `dossier_cps_enfant_id` |
| `suivis_enfants` | Suivi croissance | `id`, `enfant_id`, `age_mois` |
| `vaccinations_doses` | Doses vaccinales | `id`, `enfant_id`, `vaccin` |
| `rendez_vous` | Agenda | `id`, `date_rdv`, `statut` |
| `journal_activites` | Journal d'audit | `id`, `type_action`, `module` |






### Patientes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/patientes` | Lister les patientes (avec filtre recherche) |
| `POST` | `/api/patientes` | Créer une patiente |
| `GET` | `/api/patientes/:id` | Détail d'une patiente |
| `PATCH` | `/api/patientes/:id` | Modifier une patiente |

### CPN (Consultations Prénatales)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/cpn` | Lister les dossiers CPN |
| `POST` | `/api/cpn` | Ouvrir un dossier CPN |
| `GET` | `/api/cpn/:dossierId` | Détail d'un dossier CPN |
| `PATCH` | `/api/cpn/:dossierId` | Modifier un dossier CPN |
| `POST` | `/api/cpn/:dossierId/contacts` | Ajouter un contact CPN |
| `POST` | `/api/cpn/:dossierId/contacts/analyser` | Analyser un contact CPN (IA) |
| `GET` | `/api/cpn/:dossierId/contacts/:contactId` | Détail d'un contact |
| `PATCH` | `/api/cpn/:dossierId/contacts/:contactId` | Modifier un contact |
| `POST` | `/api/cpn/:dossierId/examens` | Créer un examen CPN |
| `PATCH` | `/api/cpn/:dossierId/examens/:examenId` | Modifier un examen |

### Accouchements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/accouchements` | Lister les accouchements |
| `POST` | `/api/accouchements` | Enregistrer un accouchement |
| `GET` | `/api/accouchements/:id` | Détail d'un accouchement |
| `PATCH` | `/api/accouchements/:id` | Modifier un accouchement |

### CPS Femme, CPS Enfant, Enfants, Vaccination

Même structure REST (GET liste, POST create, GET :id, PATCH :id) pour :
- `/api/cps-femme` + `/api/cps-femme/:id/visites` + `/api/cps-femme/:id/examens`
- `/api/cps-enfant` + `/api/cps-enfant/:id/visites` + `/api/cps-enfant/:id/examens`
- `/api/enfants` + `/api/enfants/:id/examens`
- `/api/suivi-enfant`
- `/api/vaccination`

### Autres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/rendez-vous` | Tableau des rendez-vous |
| `POST` | `/api/rendez-vous` | Créer un rendez-vous |
| `PATCH` | `/api/rendez-vous/:id` | Mettre à jour statut |
| `GET` | `/api/laboratoire` | Liste des examens labo |
| `PATCH` | `/api/laboratoire/:id/prise-en-charge` | Prendre en charge un examen |
| `PATCH` | `/api/laboratoire/:id/resultat` | Saisir un résultat |
| `GET` | `/api/dashboard` | Indicateurs du tableau de bord |
| `GET` | `/api/journal` | Journal d'activités (filtrable) |
| `GET` | `/api/users` | Liste des utilisateurs |
| `POST` | `/api/users` | Créer un utilisateur |
| `PATCH` | `/api/users/:id` | Modifier un utilisateur |
| `GET` | `/api/roles` | Liste des rôles |

# Prévisualiser le build de production
npm run preview
```

##  Modules Fonctionnels

### Module CPN — Consultation Prénatale

- Ouverture d'un dossier CPN avec historique obstétrical (gestité, parité, avortements, VIH, groupe sanguin)
- Enregistrement de contacts numérotés (poids, tension artérielle, âge gestationnel, hauteur utérine, BCF, présentation fœtale, œdèmes, etc.)
- **Analyse IA** des constantes à chaque contact
- Demande et réception de résultats d'examens biologiques et d'échographies
- Clôture du dossier à l'accouchement

### Module Accouchement

- Enregistrement de l'accouchement (mode, issue, état mère/nouveau-né, score Apgar, poids naissance)
- Lien automatique avec le dossier CPN existant
- Déclenchement des ouvertures CPS Femme et CPS Enfant

### Module CPS Femme — Suivi Postnatal Mère

- Visites programmées : **6 heures**, **6 jours**, **6 semaines** + visites surprises
- Évaluation : involution utérine, état des seins, allaitement, état psychologique, saignements, lochies
- **Analyse IA** de chaque visite

### Module CPS Enfant — Suivi Postnatal Enfant

- Suivi du nouveau-né de 0 à 59 mois
- Évaluation : poids, taille, périmètre crânien, état général, allaitement, ictère, convulsions, cordon ombilical
- Vaccins administrés, diagnostics, conduites à tenir

### Module Dossier Enfant

- Suivi de croissance (poids, taille, périmètre crânien, périmètre brachial par âge en mois)
- Calendrier vaccinal (BCG, Polio, Pentavalent, Rougeole, VAR...)
- Examens biologiques pédiatriques

### Module Laboratoire

- Réception des demandes d'examens depuis CPN, CPS Femme, CPS Enfant
- Prise en charge par le laborantin
- Saisie et retour des résultats

### Module Rendez-vous / Réception

- Création de rendez-vous programmés et de passages surprises
- Tableau de bord de la file d'attente avec statuts : `PROGRAMME`, `ARRIVE`, `EN_ATTENTE`, `TERMINE`, `ANNULE`
- Enregistrement de l'arrivée du patient

### Module Administration

- Création et modification des comptes utilisateurs
- Attribution des rôles
- Consultation du journal d'audit avec filtres (par utilisateur, module, type d'action, plage de dates)

---

##  Système de Rôles et Permissions

### Rôles Disponibles

| Code | Libellé | Accès principal |
|------|---------|----------------|
| `SUPER_ADMIN` | Super Administrateur | Accès total |
| `ADMIN` | Administrateur | Utilisateurs, rôles, journal |
| `MEDECIN` | Médecin | Tous les modules cliniques |
| `INFIRMIERE` | Infirmière | CPN, accouchements, soins |
| `SAGE_FEMME` | Sage-femme | CPN, accouchements, soins |
| `AGENT_RECEPTION` | Réceptionniste | Patientes, rendez-vous, file |
| `AGENT_LABORATOIRE` | Laborantin | Examens biologiques |

### Permissions Clés

```
reception.tableau_bord.consulter   → Accès au tableau de bord réception
patients.consulter                 → Voir la liste des patientes
cpn.consulter / cpn.gerer          → Lecture / écriture CPN
accouchement.gerer                 → Enregistrer les accouchements
cps_femme.gerer                    → Gérer CPS Femme
cps_enfant.gerer                   → Gérer CPS Enfant
laboratoire.gerer                  → Gérer les examens labo
administration.utilisateurs.gerer  → Gérer les utilisateurs
```

L'application intègre un assistant clinique basé sur l'API **OpenAI** dans deux modules :

##  Intégration IA (OpenAI)

L'application intègre **OpenAI GPT** pour une assistance clinique en temps réel.

### Analyse Contact CPN

À chaque enregistrement d'un contact CPN, l'API envoie les constantes cliniques à OpenAI :

```
Endpoint : POST /api/cpn/:dossierId/contacts/analyser
```

**Données envoyées :**
- Âge gestationnel, poids, tension artérielle
- BCF, hauteur utérine, présentation fœtale
- Œdèmes, pâleur, écoulements
- Antécédents obstétricaux, statut VIH


### Analyse Visite CPS Femme

Même principe pour les visites postnatales :
```
Endpoint : POST /api/cps-femme/:id/visites/analyser
```

---

## Outputs et États de Sortie

### Démarrage Backend — Succès

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] LOG [InstanceLoader] AuthModule dependencies initialized
...
[Nest] LOG [RouterExplorer] Mapped {/api/auth/connexion, POST}
[Nest] LOG [RouterExplorer] Mapped {/api/cpn, GET}
[Nest] LOG [RouterExplorer] Mapped {/api/cpn, POST}
...
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [Bootstrap] Backend CPN/CPS Himbi demarre sur http://localhost:3000/api
```


### Démarrage Frontend — Succès

```
  VITE v8.x.x  ready in 312 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
**Exit Code : `0`** 

### Build Backend — Succès

```bash
$ npm run build

> cpn-cps-nestjs@0.0.1 build
> nest build

[08:12:34] Starting compilation in watch mode...
[08:12:37] Found 0 errors. Watching for file changes.
```
**Exit Code : `0`** 

### Erreur — Port déjà occupé

```
Error: listen EADDRINUSE: address already in use :::3000
```
**Exit Code : `1`** 
**Solution :** `npx kill-port 3000` puis relancer

### Erreur — Connexion MySQL échouée

```
Error: connect ECONNREFUSED 127.0.0.1:3306
    at TCPConnectWrap.afterConnect [as oncomplete]
```
**Exit Code : `1`** 
**Solution :** Vérifier que MySQL Server est démarré et que les credentials dans `.env` sont corrects

### Erreur — Variable OpenAI manquante

```
Error: OpenAI API key missing. Set OPENAI_API_KEY in .env
```
**Exit Code : `1`** 
**Solution :** Ajouter `OPENAI_API_KEY=sk-...` dans `.env`



##  Captures d'Écran

### Page de Connexion
> Interface de connexion sécurisée avec identifiant et mot de passe.  
> *(Voir dossier `/docs/screenshots/connexion.png`)*

### Tableau de Bord
> Vue d'ensemble avec indicateurs : patientes enregistrées, dossiers CPN ouverts, accouchements du mois, rendez-vous du jour.

### Liste des Patientes
> Tableau filtrable et paginable avec numéro de dossier, nom, date d'enregistrement et statut.

### Dossier CPN
> Formulaire de saisie d'un contact CPN avec champs cliniques (poids, TA, âge gestationnel, BCF, etc.) et affichage de l'analyse IA en temps réel.

### File d'Attente
> Tableau de bord de la réception avec statuts colorés (vert = arrivé, orange = en attente, bleu = terminé).

### Dossier Enfant — Vaccinations
> Carnet vaccinal numérique avec calendrier OMS et statut de chaque dose (administrée, différée, refusée).

---



**Centre de Santé Afia Himbi — Goma, République Démocratique du Congo**  
**Année académique 2025–2026**


