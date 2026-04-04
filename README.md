# Frontend - Application de suivi de la CPN et de la CPS
## Cas du Centre de Santé Himbi

## 1. Présentation

Ce dépôt contient le **frontend** de l’application de suivi de la **Consultation Prénatale (CPN)** et de la **Consultation Postnatale / Postpartum (CPS)** du **Centre de Santé Himbi**.

L’application a pour but de numériser et structurer le parcours de la mère et de l’enfant, depuis l’accueil jusqu’au suivi postnatal, clinique et vaccinal, en respectant la réalité observée sur le terrain.

Le frontend est développé avec **React** et sera construit **module par module**, en commençant par les interfaces, les pages, les composants, les routes et les maquettes, avant l’intégration complète avec le backend.

---

## 2. Objectif du frontend

Le frontend doit permettre de :

- afficher une interface claire, simple et professionnelle ;
- guider les utilisateurs selon leur rôle ;
- faciliter la saisie des données administratives et médicales ;
- structurer le parcours de la mère et de l’enfant ;
- gérer les pages, formulaires, tableaux, historiques et détails ;
- préparer une intégration propre avec le backend FastAPI.

---

## 3. Contexte du projet

Ce projet est basé sur une **descente terrain au Centre de Santé Himbi**.

### Éléments déjà validés

- La **CPN** est faite par **l’infirmier ou la sage-femme**.
- La **CPS femme** est faite par **le médecin**.
- La **vaccination enfant** est faite par **le médecin**.
- La **réceptionniste** s’occupe :
  - de l’accueil ;
  - de la recherche du dossier ;
  - de l’enregistrement administratif ;
  - de la gestion des rendez-vous ;
  - de l’orientation.
- Il existe un **laboratoire** et une **pharmacie**.
- Il n’y a **pas d’échographie sur place**.
- La **CPS femme** suit la logique :
  - **6 heures**
  - **6 jours**
  - **6 semaines**
- Le suivi de l’enfant continue jusqu’à **59 mois**.
- Les **rendez-vous planifiés**, **surprise** et **annulés** doivent être gérés.
- Les rendez-vous annulés doivent rester dans l’**historique**.
- L’impression du rapport clinique de la mère ou de l’enfant se fait chez **le médecin**.
- Une femme peut venir en **CPS** même si elle n’a pas fait sa **CPN** au centre ou n’a pas accouché au centre.

---

## 4. Logique générale du système

Le parcours global retenu est le suivant :

**Femme → grossesse → CPN → accouchement / issue de grossesse → CPS femme + dossier enfant → suivi enfant + vaccination**

Cette logique guide toute l’organisation du frontend.

---

## 5. Choix de développement

Le projet suit une stratégie **frontend d’abord**.

Cela signifie que l’on commence par construire :

- la structure globale React ;
- l’interface d’authentification ;
- les layouts ;
- le tableau de bord ;
- les composants réutilisables ;
- les pages des modules ;
- les formulaires ;
- les routes ;
- les maquettes Stitch AI ;
- les issues frontend.

Une fois les interfaces stabilisées, le backend sera développé module par module pour connecter progressivement les pages aux vraies données.

---

## 6. Stack technique

- **React**
- **React Router**
- **JavaScript** ou **TypeScript** selon l’organisation retenue
- **CSS / Tailwind / autre solution UI** selon le choix final du projet
- **Données simulées** au début pour construire les interfaces avant connexion à l’API

---

## 7. Acteurs du système

Les acteurs retenus dans l’application sont :

- **Réceptionniste**
- **Infirmier**
- **Sage-femme**
- **Médecin**
- **Laborantin**
- **Pharmacien**
- **Administrateur**

Chaque acteur aura des pages, actions et accès adaptés à son rôle.

---

## 8. Méthode de travail

Chaque module frontend sera traité selon la méthode suivante :

1. MVP du module
2. Acteurs du module
3. Informations à afficher et à saisir
4. Règles métier visibles côté interface
5. Cas d’utilisation
6. Routes frontend
7. Pages
8. Maquettes figma et stich 
9. Issues et sous-issues frontend
10. Développement

---

## 9. Structure fonctionnelle du projet

Le projet est organisé en plusieurs niveaux :

### Niveau 1 : Socle
- Authentification
- Gestion des rôles
- Réception
- Rendez-vous

### Niveau 2 : Cœur métier mère
- Consultation prénatale (CPN)
- Accouchement / issue de grossesse
- Consultation postnatale femme (CPS femme)

### Niveau 3 : Cœur métier enfant
- Dossier enfant
- Suivi clinique enfant
- Nutrition
- Vaccination

### Niveau 4 : Services de support
- Laboratoire
- Pharmacie
- Impression
- Administration

---

## 10. Premier module frontend

Le premier module à construire est :

### Réception + Rendez-vous

Ce module représente la porte d’entrée de l’application.

Il doit permettre :

- l’accueil de la patiente ;
- la recherche du dossier ;
- l’enregistrement administratif ;
- l’orientation ;
- la prise de rendez-vous ;
- la gestion des rendez-vous planifiés ;
- la gestion des rendez-vous surprise ;
- la gestion des rendez-vous annulés avec historique.

---

## 11. Données importantes déjà identifiées

### Réception mère
- identité ;
- contacts ;
- partenaire ;
- contact d’urgence.

### CPN initiale
- DDR ;
- DPA ;
- taille ;
- groupe sanguin ;
- Rhésus ;
- électrophorèse Hb ;
- antécédents ;
- prochain rendez-vous.

### Suivi CPN
- plaintes ;
- poids ;
- tension artérielle ;
- température ;
- protéinurie ;
- œdèmes ;
- pâleur ;
- pouls ;
- mouvements fœtaux ;
- hauteur utérine ;
- BCF ;
- présentation ;
- observations.

### Accouchement
- date et heure ;
- lieu ;
- interne ou externe ;
- type d’accouchement ;
- complications ;
- nombre d’enfants nés.

### CPS femme
- type de visite : 6h / 6j / 6 semaines / surprise ;
- saignement ;
- lochies ;
- douleur ;
- température ;
- tension artérielle ;
- pouls ;
- utérus ;
- miction ;
- cicatrice ;
- seins ;
- allaitement ;
- état psychologique ;
- planification familiale ;
- conduite à tenir ;
- clôture.

### Dossier enfant
- identité ;
- naissance ;
- attention spéciale ;
- suivi clinique ;
- nutrition.

### Vaccination
- âge ;
- date prévue ;
- date reçue ;
- récupération ;
- observations.

---

## 12. Structure proposée du projet frontend

```bash
src/
│
├── application/
│   ├── routes/
│   ├── layouts/
│   └── fournisseurs/
│
├── composants/
│   ├── interface/
│   ├── formulaires/
│   ├── tableaux/
│   ├── cartes/
│   ├── modales/
│   └── partages/
│
├── pages/
│   ├── authentification/
│   ├── tableau-de-bord/
│   └── erreurs/
│
├── modules/
│   ├── reception/
│   ├── rendez-vous/
│   ├── cpn/
│   ├── accouchement/
│   ├── cps-femme/
│   ├── dossier-enfant/
│   ├── suivi-enfant/
│   ├── vaccination/
│   ├── laboratoire/
│   ├── pharmacie/
│   └── administration/
│
├── services/
│   ├── api/
│   └── donnees-simulees/
│
├── hooks/
├── utilitaires/
├── constantes/
├── ressources/
└── styles/
