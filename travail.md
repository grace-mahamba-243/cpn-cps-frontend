# Journal de Travail — Projet Afia Himbi (CPN/CPS)

**Centre de Santé Afia Himbi — Goma, RDC**  
**Année académique 2025–2026**

---

## 1. Contexte et Objectif du Projet

### Problème identifié

Au Centre de Santé Afia Himbi de Goma (Nord-Kivu, RDC), l'ensemble du suivi médical des grossesses et des naissances était géré manuellement sur papier. Ce mode de fonctionnement entraînait :

- Des pertes fréquentes de dossiers patients
- Une impossibilité de suivre l'historique clinique d'une patiente d'une visite à l'autre
- Aucune traçabilité des actions réalisées par le personnel soignant
- Une absence totale de statistiques sur l'activité du centre

### Objectif

Développer une application web complète, **Afia Himbi**, permettant de numériser et centraliser :

1. Le suivi des grossesses (CPN — Consultation Pré-Natale)
2. L'enregistrement des accouchements
3. Le suivi postnatal des mères (CPS Femme)
4. Le suivi postnatal des nouveau-nés et nourrissons jusqu'à 59 mois (CPS Enfant)
5. La vaccination des enfants
6. Les examens biologiques au laboratoire
7. La gestion des rendez-vous et de la file d'attente
8. L'administration des utilisateurs et des accès

---

## 2. Analyse des Besoins

### Acteurs identifiés

Lors de l'analyse des besoins avec le centre de santé, sept profils d'utilisateurs ont été définis :

| Acteur | Rôle dans le système |
|--------|---------------------|
| **Réceptionniste** | Enregistre les patientes, gère les rendez-vous et la file d'attente |
| **Infirmière** | Effectue les contacts CPN, surveille les grossesses, enregistre les accouchements |
| **Sage-femme** | Mêmes responsabilités que l'infirmière pour les accouchements et le suivi |
| **Médecin** | Ouvre les dossiers CPS Femme et CPS Enfant, prescrit les examens, supervise |
| **Laborantin** | Prend en charge les demandes d'examens biologiques, saisit les résultats |
| **Administrateur** | Gère les comptes utilisateurs et consulte le journal d'activités |
| **Super Administrateur** | Accès total au système |

### Flux métier principal

Le flux clinique suit un parcours logique :

```
Patiente enregistrée
    ↓
Dossier CPN ouvert (grossesse)
    ↓
Contacts CPN successifs (1 à 4+) avec analyse IA
    ↓
Accouchement enregistré
    ↓
Dossier CPS Femme ouvert (suivi postnatal mère)
    ↓
Dossier Enfant créé (nouveau-né)
    ↓
Dossier CPS Enfant ouvert (suivi 0-59 mois)
    ↓
Vaccination + Suivi de croissance
```

---

## 3. Choix Technologiques

### Backend — NestJS + TypeScript

**Pourquoi NestJS plutôt qu'Express ?**

NestJS a été choisi pour sa structure modulaire imposée par le framework. Cette contrainte architecturale garantit que chaque domaine métier (CPN, accouchement, vaccination...) est encapsulé dans son propre module avec ses contrôleurs, services et entités séparés. Cela simplifie la maintenance et l'évolution du code.

TypeScript a été adopté pour le typage statique, qui prévient les erreurs à la compilation, et pour l'outillage (autocomplétion, refactoring) qui accélère le développement.

### ORM — TypeORM

TypeORM a été sélectionné pour son intégration native dans l'écosystème NestJS et pour son système de migrations, indispensable pour faire évoluer le schéma de base de données de manière contrôlée et réversible. Les entités TypeORM servent à la fois de mapping base de données et de documentation vivante du schéma.

### Base de données — MySQL 8

MySQL a été retenu car c'est le SGBD déjà utilisé dans l'infrastructure du centre de santé. L'encodage `utf8mb4` a été configuré pour supporter les caractères spéciaux présents dans les noms en langues locales.

### Frontend — React 19 + Vite

React a été choisi pour sa flexibilité et l'organisation en composants réutilisables. Vite remplace Create React App pour des temps de démarrage et de rechargement à chaud nettement plus rapides.

L'interface est construite entièrement en **français** pour être accessible au personnel soignant congolais.

### CSS — Tailwind CSS 4

Tailwind CSS a été utilisé pour sa vitesse de prototypage et sa cohérence visuelle. Les classes utilitaires permettent de styler les composants directement dans le JSX sans jongler entre des fichiers CSS séparés.

### Intelligence Artificielle — OpenAI GPT

L'intégration d'OpenAI confère au système une capacité d'analyse clinique assistée. À chaque contact CPN et à chaque visite CPS, les constantes cliniques de la patiente sont envoyées à l'API GPT qui retourne une analyse structurée (observations, alertes, recommandations). Cela aide le personnel soignant — en particulier dans des zones à faibles ressources médicales — à interpréter les signes cliniques.

---

## 4. Architecture Mise en Place

### Organisation du projet

Le dépôt est organisé en deux applications distinctes :

```
projet/
├── cpn-cps-nestjs/     ← API REST (NestJS)
├── cpn-cps-frontend/   ← Interface utilisateur (React)
├── gen_uml.py          ← Script de génération des diagrammes UML
├── README.md           ← Documentation principale
└── TRAVAIL.md          ← Ce fichier
```

### Architecture backend — Modules NestJS

Chaque domaine métier correspond à un module NestJS indépendant :

```
src/modules/
├── auth/           → Authentification par session UUID
├── users/          → Gestion des comptes utilisateurs
├── roles/          → Gestion des rôles
├── patientes/      → Dossiers des mères
├── enfants/        → Dossiers des enfants
├── cpn/            → Module CPN (dossiers + contacts + examens)
├── accouchements/  → Enregistrement des accouchements
├── cps-femme/      → Suivi postnatal mère
├── cps-enfant/     → Suivi postnatal enfant
├── suivi-enfant/   → Suivi de croissance (courbes OMS)
├── vaccination/    → Calendrier vaccinal
├── laboratoire/    → Examens biologiques
├── rendez-vous/    → Agenda et file d'attente
├── dashboard/      → Statistiques et indicateurs
└── journal/        → Audit de toutes les actions
```

### Architecture frontend — Modules React

Le frontend reflète la même organisation modulaire :

```
src/
├── application/
│   ├── layouts/    → LayoutPublic (connexion) et LayoutPrive (app sécurisée)
│   └── routes/     → Registre des routes avec protection par rôle
├── composants/
│   ├── interface/  → Bibliothèque de composants UI réutilisables
│   ├── navigation/ → Barre latérale et en-tête
│   └── partages/   → Composants partagés (chargement, état vide...)
├── modules/        → Pages et logique de chaque module métier
└── services/api/   → Couche d'appel HTTP centralisée
```

### Système d'authentification

Un système d'authentification par **session UUID** a été implémenté (et non JWT), car :

- Il permet une révocation immédiate de session (déconnexion forcée)
- Il évite la problématique d'expiration de token JWT côté client
- La session est stockée dans la table `sessions_authentification` avec une durée de vie de 30 minutes, renouvelable à chaque requête

À chaque requête protégée, le frontend envoie le jeton de session dans l'en-tête HTTP. Le backend vérifie que la session existe et n'a pas expiré.

---

## 5. Développement des Modules

### Module Authentification

**Ce qui a été fait :**
- Endpoint `POST /api/auth/connexion` : vérifie les credentials, crée une session UUID en base, retourne le jeton et les informations de l'utilisateur (identifiant, nom, rôle)
- Endpoint `POST /api/auth/deconnexion` : supprime la session en base
- Endpoint `GET /api/auth/profil/:identifiant` : retourne le profil complet
- Hashage des mots de passe avec **bcrypt**
- Guard NestJS `AuthGuard` vérifiant la session à chaque requête protégée

**Côté frontend :**
- Page de connexion (`/connexion`)
- Contexte React `AuthContexte` stockant l'utilisateur courant et le jeton en mémoire
- `LayoutPrive` interceptant toute navigation vers une route protégée et redirigeant vers la connexion si aucun jeton valide n'est présent
- `RouteProtegee` et `RouteInviteSeulement` pour la protection granulaire des routes

---

### Module Patientes

**Ce qui a été fait :**
- CRUD complet des dossiers de patientes (mères)
- Génération automatique d'un numéro de dossier unique (`PAT-YYYYMMDD-XXXX`)
- Champs : nom, prénom, date de naissance, adresse, téléphone, groupe sanguin, statut VIH, numéro d'identification nationale
- Recherche et filtrage par nom / numéro de dossier
- Page liste avec tableau paginable

---

### Module CPN (Consultation Pré-Natale)

C'est le module central de l'application.

**Ce qui a été fait :**
- Ouverture d'un dossier CPN lié à une patiente, avec l'historique obstétrical complet : gestité, parité, nombre d'avortements, nombre d'enfants vivants, date des dernières règles (DDR), date probable d'accouchement (DPA)
- Enregistrement des **contacts CPN numérotés** (de CPN1 à CPN4+) avec toutes les constantes cliniques :
  - Poids, tension artérielle systolique/diastolique
  - Âge gestationnel (en semaines d'aménorrhée)
  - Hauteur utérine, bruits du cœur fœtal (BCF)
  - Présentation fœtale, mouvements actifs du fœtus
  - Œdèmes, pâleur des conjonctives, écoulements vaginaux
  - Traitements administrés (fer, acide folique, moustiquaire, TPI)
- **Analyse IA** : à chaque contact, les données sont envoyées à l'API OpenAI GPT pour analyse clinique automatisée → le résultat (observations, alertes, recommandations) s'affiche immédiatement dans l'interface
- Gestion des examens CPN : demandes d'examens biologiques (NFS, groupage sanguin, sérologie VIH, TPHA, glycémie, albuminurie) et d'échographies, avec saisie des résultats
- Clôture du dossier à l'accouchement

---

### Module Accouchements

**Ce qui a été fait :**
- Enregistrement de l'accouchement avec : date/heure, mode (voie basse, césarienne, forceps), issue (vivant, mort-né), état de la mère et du nouveau-né, score Apgar (1 min et 5 min), poids de naissance, terme
- Lien automatique avec le dossier CPN de la patiente
- L'enregistrement d'un accouchement **déclenche la possibilité** d'ouvrir les dossiers CPS Femme (pour la mère) et CPS Enfant (pour le nouveau-né)
- Liste des accouchements avec filtres par date et par statut

---

### Module CPS Femme (Consultations Post-Natales Femme)

**Ce qui a été fait :**
- Ouverture du dossier CPS Femme lié à l'accouchement
- Enregistrement des visites postnatales programmées selon le protocole : **6 heures**, **6 jours**, **6 semaines**, puis visites surprises
- Pour chaque visite : involution utérine, état des seins, pratique de l'allaitement, état psychologique, saignements, lochies, cicatrice (épisiotomie/césarienne)
- **Analyse IA** de chaque visite (mêmes paramètres que CPN, adaptés au postnatal)
- Gestion des examens biologiques postnataux

---

### Module CPS Enfant (Consultations Post-Natales Enfant)

**Ce qui a été fait :**
- Dossier CPS lié au dossier enfant et à l'accouchement
- Suivi du nouveau-né de 0 à 59 mois avec visites numérotées
- Pour chaque visite : poids, taille, périmètre crânien, état général, allaitement maternel, ictère, convulsions, état du cordon ombilical, infections
- Enregistrement des vaccins administrés lors de la visite
- Saisie du diagnostic et de la conduite à tenir

---

### Module Dossier Enfant

**Ce qui a été fait :**
- Dossier enfant autonome lié à la mère (patiente)
- **Suivi de croissance** : courbes poids/taille/périmètre crânien/périmètre brachial par âge en mois (référentiel OMS)
- **Carnet vaccinal numérique** : calendrier complet (BCG, Polio 0-1-2-3, Pentavalent 1-2-3, Rougeole, VAR, Méningite...) avec statut de chaque dose (administrée, différée, refusée)
- Examens biologiques pédiatriques

---

### Module Vaccination

**Ce qui a été fait :**
- Table `vaccinations_doses` centralisant toutes les doses administrées
- Lien avec le dossier enfant et la visite CPS enfant
- Historique complet des vaccinations consultable

---

### Module Laboratoire

**Ce qui a été fait :**
- Module transversal recevant les demandes d'examens depuis CPN, CPS Femme et CPS Enfant
- File d'attente des demandes pour le laborantin
- Workflow : demande créée → prise en charge par le laborantin → résultat saisi → résultat consultable depuis le module demandeur
- Endpoint `PATCH /api/laboratoire/:id/prise-en-charge` et `PATCH /api/laboratoire/:id/resultat`

---

### Module Rendez-vous / Réception

**Ce qui a été fait :**
- Création de rendez-vous avec date, heure, motif, et patiente associée
- Passages surprises (sans rendez-vous préalable)
- Tableau de bord de la file d'attente en temps réel
- Cycle de vie d'un rendez-vous : `PROGRAMME` → `ARRIVE` → `EN_ATTENTE` → `TERMINE` (ou `ANNULE`)
- Enregistrement de l'heure d'arrivée effective du patient

---

### Module Dashboard

**Ce qui a été fait :**
- Indicateurs clés agrégés en temps réel :
  - Nombre total de patientes enregistrées
  - Dossiers CPN ouverts / clôturés
  - Accouchements du mois en cours
  - Rendez-vous du jour (nombre et statuts)
  - Visites CPS du mois
- Accessible aux profils administratifs et médicaux

---

### Module Journal d'Activités

**Ce qui a été fait :**
- Enregistrement automatique de toutes les actions significatives dans la table `journal_activites`
- Chaque entrée contient : type d'action (CREATION, MODIFICATION, CONNEXION...), module concerné, utilisateur responsable, date/heure, détails JSON
- Interface de consultation avec filtres combinables : par utilisateur, par module, par type d'action, par plage de dates
- Permet l'audit complet de l'activité du centre de santé

---

### Module Gestion des Accès (Administration)

**Ce qui a été fait :**
- CRUD complet des utilisateurs (identifiant, nom, prénom, rôle)
- Attribution et modification des rôles
- Réinitialisation des mots de passe
- Interface accessible uniquement aux rôles ADMIN et SUPER_ADMIN
- Protection granulaire côté frontend via le système de `politiqueProtection.js`

---

## 6. Base de Données

### Conception

La base de données `cpn_cps_himbi` a été conçue selon le modèle relationnel avec des clés étrangères strictes entre les entités. Les UUID sont utilisés comme clés primaires pour tous les identifiants afin d'éviter les collisions et de faciliter une éventuelle distribution.

### Gestion des migrations

Le schéma de base de données a évolué à travers **26 fichiers de migration TypeORM** numérotés chronologiquement. Chaque migration correspond à une modification précise du schéma (ajout de table, ajout de colonne, création d'index...). Cette approche garantit que la base de données peut être reconstituée dans n'importe quel état par le seul rejeu des migrations.

```bash
# Exécuter toutes les migrations en attente
npm run migration:run

# Créer une nouvelle migration
npm run migration:generate -- src/database/migrations/NomDeLaMigration

# Annuler la dernière migration
npm run migration:revert
```

### Tables principales

| Table | Lignes | Description |
|-------|--------|-------------|
| `roles` | 7 | Rôles système |
| `utilisateurs` | Variable | Comptes du personnel |
| `sessions_authentification` | Variable | Sessions actives (TTL 30 min) |
| `patientes` | Variable | Dossiers des mères |
| `dossiers_cpn` | Variable | Grossesses suivies |
| `contacts_cpn` | Variable | Consultations CPN individuelles |
| `examens_cpn` | Variable | Examens biologiques CPN |
| `accouchements` | Variable | Naissances enregistrées |
| `dossiers_cps_femme` | Variable | Suivi postnatal mère |
| `visites_cps_femme` | Variable | Visites individuelles postnatal mère |
| `enfants` | Variable | Dossiers des enfants |
| `dossiers_cps_enfant` | Variable | Suivi postnatal enfant |
| `visites_cps_enfant` | Variable | Visites individuelles postnatal enfant |
| `suivis_enfants` | Variable | Mesures de croissance par âge |
| `vaccinations_doses` | Variable | Historique vaccinal |
| `rendez_vous` | Variable | Agenda et file d'attente |
| `journal_activites` | Variable | Audit de toutes les actions |

---

## 7. Intégration de l'Intelligence Artificielle

### Décision d'intégration

L'intégration d'OpenAI GPT a été une décision clé du projet. Dans le contexte des centres de santé de Goma, le personnel infirmier effectue souvent des consultations sans médecin disponible sur place. L'analyse IA agit comme un **assistant clinique de second avis**, aidant à détecter des signes d'alerte (hypertension gravidique, prééclampsie, retard de croissance intra-utérin, etc.) que le soignant pourrait ne pas identifier immédiatement.

### Implémentation

L'intégration se situe dans deux services backend :

**`cpn.service.ts`** — Analyse des contacts CPN :
- Les constantes cliniques du contact (poids, TA, AGE, BCF, HU, présentation, etc.) sont formatées en prompt structuré
- Le prompt inclut les antécédents obstétricaux de la patiente (gestité, parité, statut VIH)
- La réponse GPT est renvoyée au frontend et affichée immédiatement après l'enregistrement du contact

**`cps-femme.service.ts`** — Analyse des visites postnatales :
- Constantes postnatales (involution utérine, allaitement, saignements, etc.)
- Même logique de prompt structuré et de retour en temps réel

### Sécurité

La clé API OpenAI est chargée exclusivement depuis la variable d'environnement `OPENAI_API_KEY` et n'est jamais exposée côté frontend. Le backend agit en proxy, construisant et envoyant les requêtes à OpenAI de manière transparente.

---

## 8. Difficultés Rencontrées et Solutions

### Conflit Git sur le fichier `.env`

**Problème :** Le fichier `.env` (contenant les credentials de base de données et la clé OpenAI) avait été commité par inadvertance. Lors de la fusion des branches, des conflits de merge apparaissaient sur ce fichier.

**Solution :** Ajout de `.env` dans `.gitignore`, suppression du fichier du suivi Git avec `git rm --cached .env`, et création d'un fichier `.env.example` documentant toutes les variables nécessaires sans les valeurs réelles.

---

### Contrainte MySQL sur `numero_fiche` — colonne nullable

**Problème :** La colonne `numero_fiche` dans certaines tables avait été définie NOT NULL sans valeur par défaut, bloquant l'insertion de nouveaux enregistrements via l'API.

**Solution :** Migration TypeORM rendant la colonne nullable, avec génération automatique du numéro lors de la création de l'entité dans le service.

---

### Port 3000 déjà occupé au démarrage

**Problème :** Après un crash du serveur NestJS, le port 3000 restait occupé par le processus Node.js zombie, empêchant le redémarrage.

**Solution :** Commande `npx kill-port 3000` pour libérer le port avant de relancer le serveur. Ajout de cette procédure dans la documentation.

---

### Colonne `administre_par` manquante

**Problème :** Lors du développement du module vaccination, la table `vaccinations_doses` ne disposait pas d'un champ pour enregistrer l'identité de l'utilisateur ayant administré le vaccin, requis pour la traçabilité.

**Solution :** Création d'une migration dédiée `AddAdministreParToVaccinationsDoses` ajoutant la colonne `administre_par` de type UUID avec clé étrangère vers `utilisateurs`.

---

### Script `add-enregistre-par.js`

**Problème :** Des données avaient été insérées en base avant l'ajout de la colonne `enregistre_par` dans plusieurs tables, laissant des valeurs NULL.

**Solution :** Script Node.js `scripts/add-enregistre-par.js` corrigeant en masse les lignes concernées en assignant l'identifiant de l'utilisateur administrateur par défaut.

---

### Gestion du rôle SUPER_ADMIN

**Problème :** Lors des tests, certaines routes retournaient une erreur 403 pour le rôle SUPER_ADMIN, car le guard de rôle vérifiait une liste explicite de rôles autorisés sans inclure systématiquement SUPER_ADMIN.

**Solution :** Script `scripts/fix-roles.js` et modification du guard pour que SUPER_ADMIN court-circuite toujours les vérifications de rôle.

---

### Diagramme UML coupé à l'écran

**Problème :** Le diagramme des cas d'utilisation, généré avec PlantUML en mode `top to bottom direction`, était tronqué horizontalement lors de l'export PNG.

**Solution :** Passage à `left to right direction` et suppression des `package {}` d'encapsulation qui forçaient une largeur excessive.

---

### Erreur HTTP 509 sur le serveur PlantUML

**Problème :** Certains diagrammes complexes dépassaient la limite de taille du serveur PlantUML gratuit (`plantuml.com/plantuml`).

**Solution :** Simplification du diagramme d'activité en réduisant le nombre de nœuds et de branches parallèles, ramenant la taille de l'URL encodée sous la limite.

---

## 9. Système de Contrôle d'Accès Frontend

### Approche

Le contrôle d'accès côté frontend est géré à deux niveaux complémentaires :

1. **Protection des routes** : Le fichier `politiqueProtection.js` définit pour chaque route les rôles autorisés. Le composant `RouteProtegee` vérifie le rôle de l'utilisateur connecté avant de rendre la page.

2. **Protection des sections** : `RedirectionSectionProtegee.jsx` permet de conditionner l'affichage de sections au sein d'une même page selon le rôle (ex : le bouton "Ouvrir CPS" est visible uniquement pour MEDECIN).

### Exemple de politique

```js
// politiqueProtection.js
export const POLITIQUES = {
  'cpn.gerer': ['MEDECIN', 'INFIRMIERE', 'SAGE_FEMME', 'SUPER_ADMIN'],
  'cps_femme.gerer': ['MEDECIN', 'SUPER_ADMIN'],
  'administration.utilisateurs.gerer': ['ADMIN', 'SUPER_ADMIN'],
  'laboratoire.gerer': ['AGENT_LABORATOIRE', 'MEDECIN', 'SUPER_ADMIN'],
};
```

---

## 10. Composants UI Développés

Une bibliothèque de composants réutilisables a été développée pour assurer la cohérence visuelle de toute l'application :

| Composant | Rôle |
|-----------|------|
| `Bouton` | Bouton stylisé avec variantes (primaire, secondaire, danger) et état de chargement |
| `Carte` | Conteneur avec ombre et padding standardisé |
| `CarteIndicateur` | Carte de statistique avec icône, valeur et libellé |
| `TableauDonnees` | Tableau responsive avec colonnes configurables |
| `BadgeEtat` | Badge de statut coloré (PROGRAMME, ARRIVE, TERMINE...) |
| `Alerte` | Message d'alerte (succès, erreur, avertissement, info) |
| `AvatarInitiales` | Avatar généré à partir des initiales de l'utilisateur |
| `BlocTitrePage` | En-tête de page avec titre, sous-titre et actions |
| `Chargement` | Spinner de chargement |
| `EtatVide` | Illustration et message pour les listes vides |
| `EtatChargement` | Skeleton loading pour les tableaux |
| `EnTeteImpression` | En-tête standardisé pour l'impression des documents |
| `GroupeAvatars` | Pile d'avatars pour afficher plusieurs utilisateurs |
| `InfoEnregistrement` | Affichage des métadonnées d'un enregistrement |

---

## 11. Organisation du Travail

### Structure des branches Git

Le développement a suivi une organisation en branches fonctionnelles :

- `main` — Branche principale stable
- `feature/moduleEnfant` — Développement des modules enfant, CPS Enfant, vaccination, suivi de croissance (branche poussée sur le dépôt distant)
- Sessions de travail sur `cpn-cps-nestjs` pour le backend

### Ordre de développement

L'ordre de développement a suivi la logique métier du parcours patient :

1. Infrastructure de base (NestJS, TypeORM, MySQL, React, Vite)
2. Authentification et gestion des sessions
3. Gestion des utilisateurs et des rôles
4. Module Patientes
5. Module CPN (module principal)
6. Module Accouchements
7. Module CPS Femme
8. Module Enfants + CPS Enfant
9. Module Vaccination
10. Module Suivi Enfant (croissance)
11. Module Laboratoire
12. Module Rendez-vous / Réception
13. Dashboard et Journal d'activités
14. Composants UI et bibliothèque de composants
15. Tests et corrections

---

## 12. État Final de l'Application

### Ce qui fonctionne

- Authentification complète (connexion, déconnexion, protection des routes par rôle)
- Enregistrement et recherche des patientes
- Gestion complète du cycle CPN → Accouchement → CPS Femme
- Suivi de l'enfant : CPS Enfant, vaccination, suivi de croissance
- Examens biologiques au laboratoire avec workflow complet
- Gestion des rendez-vous et file d'attente
- Analyse IA intégrée aux consultations CPN et CPS Femme
- Journal d'audit complet
- Dashboard avec indicateurs agrégés
- Administration des utilisateurs

### Résumé des livrables

| Livrable | Description | Emplacement |
|----------|-------------|-------------|
| API Backend | 16 modules NestJS, 40+ endpoints REST | `cpn-cps-nestjs/` |
| Frontend React | 12 modules UI, 14 composants réutilisables | `cpn-cps-frontend/` |
| Base de données | 20+ tables, 26 migrations | `cpn-cps-nestjs/src/database/` |
| Diagrammes UML | 5 diagrammes (cas d'utilisation, classes, activité, séquence, déploiement) | `Diagrammes_UML_CPN_CPS_v5.docx` |
| Documentation | README complet avec endpoints, outputs, variables d'environnement | `README.md` |
| Journal de travail | Ce fichier | `TRAVAIL.md` |

---

**Centre de Santé Afia Himbi — Goma, République Démocratique du Congo**  
**Année académique 2025–2026**
