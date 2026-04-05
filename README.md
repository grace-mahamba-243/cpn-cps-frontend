# Frontend - Application de suivi de la CPN et de la CPS
## Cas du Centre de Santé Himbi

## Présentation

Ce dépôt contient le **frontend** de l’application de suivi de la **Consultation Prénatale (CPN)** et de la **Consultation Postnatale / Postpartum (CPS)** du **Centre de Santé Himbi**.

L’objectif du frontend est de fournir une interface claire, moderne et structurée pour accompagner le parcours de la mère et de l’enfant au sein du centre de santé, depuis l’accueil jusqu’au suivi postnatal, clinique et vaccinal.

Le projet est conçu de manière **modulaire**, avec une approche **frontend d’abord**, afin de stabiliser les parcours utilisateur, les pages, les formulaires, les composants et les maquettes avant l’intégration complète avec le backend.

---

## Contexte du projet

Ce projet s’appuie sur une **descente terrain** réalisée au **Centre de Santé Himbi**.

### Éléments métier déjà validés

- La **CPN** est réalisée par **l’infirmier ou la sage-femme**
- La **CPS femme** est réalisée par **le médecin**
- La **vaccination enfant** est réalisée par **le médecin**
- La **réceptionniste** gère :
  - l’accueil
  - la recherche du dossier
  - l’enregistrement administratif
  - la gestion des rendez-vous
  - l’orientation
- Il existe un **laboratoire** et une **pharmacie**
- Il n’y a **pas d’échographie sur place**
- La **CPS femme** suit la logique :
  - **6 heures**
  - **6 jours**
  - **6 semaines**
- Le suivi de l’enfant continue jusqu’à **59 mois**
- Les **rendez-vous planifiés**, **surprise** et **annulés** doivent être gérés
- Les rendez-vous annulés doivent être conservés dans l’**historique**
- L’impression du rapport clinique de la mère ou de l’enfant se fait chez **le médecin**
- Une femme peut venir en **CPS** même si elle n’a pas fait sa **CPN** au centre ou n’a pas accouché au centre

---

## Logique générale du système

Le parcours métier global retenu est :

**Femme → Grossesse → CPN → Accouchement / Issue de grossesse → CPS femme + Dossier enfant → Suivi enfant + Vaccination**

Cette logique guide l’organisation des modules, des pages et des flux utilisateur du frontend.

---

## Objectifs du frontend

Le frontend doit permettre de :

- proposer une interface claire et professionnelle
- guider les utilisateurs selon leur rôle
- faciliter la saisie des données administratives et médicales
- structurer les parcours de la mère et de l’enfant
- gérer les formulaires, tableaux, historiques et fiches de détail
- préparer une intégration fluide avec le backend FastAPI

---

## Stack technique

- **React**
- **Vite**
- **React Router**
- **CSS** (ou autre système de style retenu ensuite)
- **Données simulées** au début pour construire les interfaces avant l’intégration API

---

## Méthode de travail

Le frontend est construit **module par module** selon la méthode suivante :

1. **Module**
2. **Analyse métier**
3. **Flux utilisateur**
4. **Pages**
5. **Composants**
6. **Routes**
7. **Maquette**
8. **Issues**

Cette méthode permet de construire chaque partie du système de façon cohérente, progressive et professionnelle.

---

## Organisation fonctionnelle

Le système est structuré en plusieurs niveaux :

### Niveau 1 : Socle
- Authentification
- Gestion des rôles et accès
- Réception
- Rendez-vous

### Niveau 2 : Cœur métier mère
- CPN
- Accouchement / issue de grossesse
- CPS femme

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

## Modules frontend prévus

- Authentification
- Gestion des rôles et accès
- Réception
- Rendez-vous
- CPN
- Accouchement
- CPS femme
- Dossier enfant
- Suivi enfant
- Nutrition
- Vaccination
- Laboratoire
- Pharmacie
- Impression
- Administration

---

## Structure du projet

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
│   ├── navigation/
│   └── partages/
│
├── pages/
│   ├── authentification/
│   ├── tableau-de-bord/
│   └── erreurs/
│
├── modules/
│   ├── authentification/
│   ├── gestion-acces/
│   ├── reception/
│   ├── rendez-vous/
│   ├── cpn/
│   ├── accouchement/
│   ├── cps-femme/
│   ├── dossier-enfant/
│   ├── suivi-enfant/
│   ├── nutrition/
│   ├── vaccination/
│   ├── laboratoire/
│   ├── pharmacie/
│   ├── impression/
│   └── administration/
│
├── services/
│   ├── api/
│   └── donnees-simulees/
│
├── constantes/
├── utilitaires/
├── ressources/
└── styles/