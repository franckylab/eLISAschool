# Stratégie d'Offre de Service eLISAschool — v2

> **Document stratégique** — Structure binaire Local/Cloud × Licence/Abonnement × Tranches × Options
> **Date** : 28 juillet 2026
> **Version** : 2.0 (remplace la v1)
> **Statut** : Proposition stratégique

---

## 1. Architecture de l'Offre — Vue d'Ensemble

### 1.1 Structure en Arbre

```
eLISAschool
│
├── PLAN LOCAL (serveur du client)
│   │
│   ├── A. LICENCE PERPÉTUELLE (achat unique)
│   │   ├── T1 — Micro (≤100 élèves)
│   │   ├── T2 — Petit (101-500 élèves)
│   │   ├── T3 — Moyen (501-1500 élèves)
│   │   ├── T4 — Grand (1501-5000 élèves)
│   │   └── T5 — Très grand (5000+ élèves)
│   │
│   └── B. ABONNEMENT LOCAL (location mensuelle/annuelle)
│       ├── T1 — Micro (≤100 élèves)
│       ├── T2 — Petit (101-500 élèves)
│       ├── T3 — Moyen (501-1500 élèves)
│       ├── T4 — Grand (1501-5000 élèves)
│       └── T5 — Très grand (5000+ élèves)
│
└── PLAN CLOUD (VPS/hébergé en ligne)
    │
    ├── C. LICENCE CLOUD (engagement annuel, infrastructure dédiée)
    │   ├── T1 — Micro (≤100 élèves)
    │   ├── T2 — Petit (101-500 élèves)
    │   ├── T3 — Moyen (501-1500 élèves)
    │   ├── T4 — Grand (1501-5000 élèves)
    │   └── T5 — Très grand (5000+ élèves)
    │
    └── D. ABONNEMENT SAAS (mensuel/annuel, multi-tenant)
        ├── T1 — Micro (≤100 élèves)
        ├── T2 — Petit (101-500 élèves)
        ├── T3 — Moyen (501-1500 élèves)
        ├── T4 — Grand (1501-5000 élèves)
        └── T5 — Très grand (5000+ élèves)
```

### 1.2 Logique Commerciale

| Dimension | Signification | Impact prix |
|-----------|---------------|-------------|
| **Plan** (Local/Cloud) | Où tourne le logiciel | Cloud = infrastructure incluse |
| **Catégorie** (Licence/Abonnement) | Comment on paie | Licence = upfront, Abonnement = récurrent |
| **Tranche** (T1-T5) | Taille de l'établissement | Plus d'élèves = plus cher |
| **Options** | Modules additionnels | À la carte, cumulables |

### 1.3 Modules — Classification Offres

#### Modules SOCLE (inclus dans TOUTES les offres de base)

| Module | Description |
|--------|-------------|
| Auth + Utilisateurs | Connexion, rôles, permissions RBAC |
| Configuration | Paramètres établissement |
| Élèves | Inscriptions, dossiers, matricules |
| Responsables élèves | Liens parents-élèves, portail parent |
| Notes | Saisie, consultation, validation |
| Périodes | Trimestres, semestres, séquences |
| Classes | Gestion des classes et niveaux |
| Matières | Programme, coefficients |
| Dashboard | Tableau de bord standard |
| Notifications | Alertes in-app |
| Cartes scolaires | Génération avec QR code |
| Années scolaires | Gestion des années |

#### Modules PREMIUM (options payantes)

| Option | Code | Description | Valeur |
|--------|------|-------------|--------|
| **Bulletins avancés** | OPT-BUL | Génération PDF personnalisable, export | Gain de temps énorme |
| **Emploi du temps** | OPT-EDT | Planification, détection conflits, drag & drop | Complexité technique |
| **Programmes pédagogiques** | OPT-PROG | Curriculum, progression, conformité | Pilotage pédagogique |
| **Organisation** | OPT-ORG | Organigramme ReactFlow, unités, hiérarchie | Visualisation pro |
| **Communication** | OPT-COM | Messagerie, annonces, sondages, requêtes | Collaboration |
| **Cantine** | OPT-CANT | Menus, paiements, gestion repas | Logistique |
| **Transport** | OPT-TRAN | Lignes, arrêts, suivi bus | Logistique |
| **Finances** | OPT-FIN | Scolarités, paiements, comptabilité | Critique gestion |
| **Personnel + Contrats** | OPT-PERS | RH, contrats, absences, évaluations | Administration |
| **Paie** | OPT-PAIE | Bulletins salaire, cotisations, primes | Conformité légale |
| **Gamification** | OPT-GAM | Points, badges, classements | Engagement élèves |
| **Scoring** | OPT-SCO | Évaluation performance globale | Pilotage |
| **Orientation** | OPT-ORI | Conseil d'orientation scolaire | Aide décision |
| **Santé** | OPT-SAN | Infirmerie, suivi médical | Conformité |
| **Recrutement** | OPT-REC | Candidatures, entretiens, onboarding | RH avancé |
| **Examens nationaux** | OPT-EXAM | Préparation concours, statistiques | Valeur ajoutée |
| **Discipline** | OPT-DISC | Sanctions, points comportement | Vie scolaire |
| **Bibliothèque** | OPT-BIB | Gestion prêts, catalogue | Culture |
| **Inventaire** | OPT-INV | Matériel, équipements | Patrimoine |

---

## 2. PLAN LOCAL — A. Licence Perpétuelle

### 2.1 Principe

**Achat unique** du logiciel. Installation sur le serveur du client. Le client possède la licence à vie. Maintenance et mises à jour optionnelles.

### 2.2 Grille Tarifaire — Offres de Base

| Tranche | Élèves | Prix Licence | Maintenance/an | Support inclus |
|---------|--------|--------------|----------------|----------------|
| **T1** | ≤100 | **250 000 FCFA** | 50 000 FCFA | Email 6 mois |
| **T2** | 101-500 | **500 000 FCFA** | 100 000 FCFA | Email 6 mois |
| **T3** | 501-1500 | **1 200 000 FCFA** | 250 000 FCFA | Email + Tél 1 an |
| **T4** | 1501-5000 | **2 500 000 FCFA** | 500 000 FCFA | Email + Tél 1 an |
| **T5** | 5000+ | **Sur devis** (min 4M) | 15% du prix | Dédié 2 ans |

### 2.3 Contenu de l'Offre de Base (par tranche)

**Tous les modules SOCLE +** :

| Inclus | T1 | T2 | T3 | T4 | T5 |
|--------|----|----|----|----|-----|
| Modules socle (12) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Utilisateurs admin | 2 | 5 | 10 | 20 | Illimité |
| Stockage documents | 2 Go | 5 Go | 15 Go | 50 Go | Illimité |
| Installation | Guide | Guide | Assistée | Sur site | Sur site |
| Formation | Doc en ligne | 2h visio | 4h visio | 8h sur site | 16h sur site |
| Mises à jour | 6 mois | 1 an | 1 an | 2 ans | À vie |
| API accès | Non | Lecture | Lecture/Écriture | Complet | Complet |
| Multi-établissements | Non | Non | 2 sites | 5 sites | Illimité |

### 2.4 Options à la Carte — Plan Local Licence

| Option | Prix unique | Description |
|--------|-------------|-------------|
| **Pack Académique** | 150 000 FCFA | Bulletins + EDT + Programmes + Examens |
| **Pack Communication** | 80 000 FCFA | Messagerie + Annonces + Sondages + Requêtes |
| **Pack Logistique** | 120 000 FCFA | Cantine + Transport + Parking |
| **Pack RH** | 200 000 FCFA | Personnel + Contrats + Paie + Recrutement |
| **Pack Performance** | 100 000 FCFA | Gamification + Scoring + Orientation |
| **Pack Organisation** | 100 000 FCFA | Organigramme + Hiérarchie + Postes |
| **Pack Vie scolaire** | 60 000 FCFA | Discipline + Santé + Clubs + Bibliothèque |
| **Pack Finances** | 180 000 FCFA | Finances complètes + Comptabilité |
| **Pack Inventaire** | 50 000 FCFA | Inventaire matériel + Suivi équipements |
| **Module unitaire** | 30 000 FCFA/chacun | Any module non inclus |
| **Source code** | 3 000 000 FCFA | Accès code source complet |
| **White-label** | 200 000 FCFA | Logo + nom personnalisé |

---

## 3. PLAN LOCAL — B. Abonnement Local

### 3.1 Principe

**Location mensuelle ou annuelle** du logiciel. Installation sur le serveur du client. Maintenance et mises à jour incluses. Le client ne possède pas le logiciel.

### 3.2 Grille Tarifaire — Offres de Base

| Tranche | Élèves | Prix/mois | Prix/an (×10) | Engagement |
|---------|--------|-----------|---------------|------------|
| **T1** | ≤100 | **25 000 FCFA** | 250 000 FCFA | 1 an |
| **T2** | 101-500 | **50 000 FCFA** | 500 000 FCFA | 1 an |
| **T3** | 501-1500 | **120 000 FCFA** | 1 200 000 FCFA | 1 an |
| **T4** | 1501-5000 | **250 000 FCFA** | 2 500 000 FCFA | 1 an |
| **T5** | 5000+ | **Sur devis** | — | 1 an |

> **Remise annuelle** : 10 mois payés = 12 mois (2 mois offerts)

### 3.3 Contenu de l'Offre de Base (par tranche)

| Inclus | T1 | T2 | T3 | T4 | T5 |
|--------|----|----|----|----|-----|
| Modules socle (12) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Utilisateurs admin | 3 | 5 | 10 | 20 | Illimité |
| Stockage documents | 5 Go | 10 Go | 25 Go | 75 Go | Illimité |
| Installation | Assistée remote | Assistée remote | Sur site | Sur site | Sur site |
| Formation | 2h visio | 4h visio | 8h visio | 12h sur site | 20h sur site |
| Mises à jour | ✅ incluses | ✅ incluses | ✅ incluses | ✅ incluses | ✅ incluses |
| Support | Email (48h) | Email (24h) | Email+Tél (24h) | Dédié (4h) | Dédié (2h) |
| API accès | Lecture | Lecture | Lecture/Écriture | Complet | Complet |
| Multi-établissements | Non | Non | 2 sites | 5 sites | Illimité |
| Sauvegarde | Manuel | Auto hebdo | Auto quotidien | Auto quotidien | Temps réel |

### 3.4 Options à la Carte — Plan Local Abonnement

| Option | Prix/mois | Prix/an | Description |
|--------|-----------|---------|-------------|
| **Pack Académique** | 15 000 FCFA | 150 000 FCFA | Bulletins + EDT + Programmes + Examens |
| **Pack Communication** | 8 000 FCFA | 80 000 FCFA | Messagerie + Annonces + Sondages |
| **Pack Logistique** | 12 000 FCFA | 120 000 FCFA | Cantine + Transport |
| **Pack RH complet** | 20 000 FCFA | 200 000 FCFA | Personnel + Contrats + Paie + Recrutement |
| **Pack Performance** | 10 000 FCFA | 100 000 FCFA | Gamification + Scoring + Orientation |
| **Pack Organisation** | 10 000 FCFA | 100 000 FCFA | Organigramme + Hiérarchie |
| **Pack Vie scolaire** | 6 000 FCFA | 60 000 FCFA | Discipline + Santé + Clubs |
| **Pack Finances** | 18 000 FCFA | 180 000 FCFA | Finances + Comptabilité |
| **Pack Inventaire** | 5 000 FCFA | 50 000 FCFA | Matériel + Équipements |
| **Module unitaire** | 3 000 FCFA | 30 000 FCFA | Any module seul |
| **SMS en masse** | 15 FCFA/SMS | — | Crédits SMS (Cameroun) |
| **Support premium** | 15 000 FCFA | 150 000 FCFA | Support 24/7, réponse 1h |
| **Formation continue** | 10 000 FCFA | 100 000 FCFA | 2h/mois accompagnement |

---

## 4. PLAN CLOUD — C. Licence Cloud (Infrastructure Dédiée)

### 4.1 Principe

**Engagement annuel** avec infrastructure VPS dédiée au client. Le client bénéficie d'un serveur isolé, géré par eLISAschool. Mises à jour et maintenance incluses. Données souveraines.

### 4.2 Grille Tarifaire — Offres de Base

| Tranche | Élèves | Prix/an | Infrastructure | Support |
|---------|--------|---------|----------------|---------|
| **T1** | ≤100 | **350 000 FCFA** | VPS 2 vCPU, 4 Go RAM, 50 Go SSD | Email (24h) |
| **T2** | 101-500 | **700 000 FCFA** | VPS 4 vCPU, 8 Go RAM, 100 Go SSD | Email+Tél (24h) |
| **T3** | 501-1500 | **1 500 000 FCFA** | VPS 8 vCPU, 16 Go RAM, 250 Go SSD | Dédié (4h) |
| **T4** | 1501-5000 | **3 000 000 FCFA** | Serveur dédié 16 vCPU, 32 Go, 500 Go | Dédié (2h) |
| **T5** | 5000+ | **Sur devis** (min 5M) | Infrastructure sur mesure | 24/7 |

### 4.3 Contenu de l'Offre de Base (par tranche)

| Inclus | T1 | T2 | T3 | T4 | T5 |
|--------|----|----|----|----|-----|
| Modules socle (12) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Infrastructure VPS | ✅ | ✅ | ✅ | ✅ dédié | ✅ sur mesure |
| Utilisateurs admin | 3 | 5 | 10 | 20 | Illimité |
| Stockage | 50 Go | 100 Go | 250 Go | 500 Go | Illimité |
| Sauvegardes | Quotidien | Quotidien | Quotidien + offsite | Temps réel | Temps réel |
| SSL/HTTPS | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nom de domaine | 1 inclus | 1 inclus | 1 inclus | 1 inclus | 1 inclus |
| Formation | 4h visio | 8h visio | 12h sur site | 16h sur site | 24h sur site |
| Support | Email (24h) | Email+Tél (24h) | Dédié (4h) | Dédié (2h) | 24/7 (1h) |
| SLA | 99% | 99.5% | 99.5% | 99.9% | 99.9% |
| API accès | Lecture | Lecture/Écriture | Complet | Complet | Complet |
| Multi-établissements | Non | 2 sites | 3 sites | 10 sites | Illimité |
| Monitoring | Basique | Avancé | Avancé + alertes | Temps réel | Temps réel |

### 4.4 Options à la Carte — Plan Cloud Licence

| Option | Prix/an | Description |
|--------|---------|-------------|
| **Pack Académique** | 200 000 FCFA | Bulletins + EDT + Programmes + Examens |
| **Pack Communication** | 100 000 FCFA | Messagerie + Annonces + Sondages |
| **Pack Logistique** | 150 000 FCFA | Cantine + Transport |
| **Pack RH complet** | 250 000 FCFA | Personnel + Contrats + Paie + Recrutement |
| **Pack Performance** | 120 000 FCFA | Gamification + Scoring + Orientation |
| **Pack Organisation** | 120 000 FCFA | Organigramme + Hiérarchie |
| **Pack Vie scolaire** | 80 000 FCFA | Discipline + Santé + Clubs |
| **Pack Finances** | 220 000 FCFA | Finances + Comptabilité |
| **Pack Inventaire** | 60 000 FCFA | Matériel + Équipements |
| **Module unitaire** | 40 000 FCFA | Any module seul |
| **SMS en masse** | 15 FCFA/SMS | Crédits SMS |
| **Mobile Money** | 1.5% transaction | Orange Money, MTN, Wave |
| **Paiement en ligne** | 1% transaction | Carte bancaire |
| **Stockage extra** | 20 000 FCFA/100 Go/an | Extension SSD |
| **White-label** | 100 000 FCFA/an | Domaine + branding complet |
| **IP dédiée** | 50 000 FCFA/an | Adresse IP fixe |
| **Backup offsite** | 80 000 FCFA/an | Sauvegarde géo-redondée |

---

## 5. PLAN CLOUD — D. Abonnement SaaS (Multi-Tenant)

### 5.1 Principe

**Abonnement mensuel ou annuel** au service eLISAschool. Infrastructure partagée (multi-tenant), gérée entièrement par eLISAschool. Zéro contrainte technique pour le client.

### 5.2 Grille Tarifaire — Offres de Base

| Tranche | Élèves | Prix/mois | Prix/an (×10) | Engagement |
|---------|--------|-----------|---------------|------------|
| **T1** | ≤100 | **30 000 FCFA** | 300 000 FCFA | Aucun |
| **T2** | 101-500 | **65 000 FCFA** | 650 000 FCFA | Aucun |
| **T3** | 501-1500 | **140 000 FCFA** | 1 400 000 FCFA | Aucun |
| **T4** | 1501-5000 | **300 000 FCFA** | 3 000 000 FCFA | Aucun |
| **T5** | 5000+ | **Sur devis** | — | Annuel |

> **Remise annuelle** : 10 mois payés = 12 mois (2 mois offerts)

### 5.3 Contenu de l'Offre de Base (par tranche)

| Inclus | T1 | T2 | T3 | T4 | T5 |
|--------|----|----|----|----|-----|
| Modules socle (12) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Infrastructure cloud | Partagé | Partagé | Partagé prioritaire | Dédié | Dédié |
| Utilisateurs admin | 3 | 5 | 10 | 20 | Illimité |
| Stockage | 5 Go | 15 Go | 30 Go | 100 Go | Illimité |
| Sauvegardes | Quotidien | Quotidien | Quotidien | Quotidien + offsite | Temps réel |
| SSL/HTTPS | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sous-domaine | ecole.elisaschool.com | ecole.elisaschool.com | ecole.elisaschool.com | Domaine custom | Domaine custom |
| Formation | Doc + 2h visio | 4h visio | 8h visio | 12h visio | 20h sur site |
| Support | Email (48h) | Email (24h) | Email+Chat (24h) | Dédié (4h) | 24/7 (1h) |
| SLA | 99% | 99.5% | 99.5% | 99.9% | 99.9% |
| API accès | Non | Lecture | Lecture/Écriture | Complet | Complet |
| Multi-établissements | Non | Non | 2 sites | 5 sites | Illimité |
| PWA offline | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mises à jour | Auto | Auto | Auto | Auto | Auto |

### 5.4 Options à la Carte — Plan Cloud SaaS

| Option | Prix/mois | Prix/an | Description |
|--------|-----------|---------|-------------|
| **Pack Académique** | 15 000 FCFA | 150 000 FCFA | Bulletins + EDT + Programmes + Examens |
| **Pack Communication** | 8 000 FCFA | 80 000 FCFA | Messagerie + Annonces + Sondages |
| **Pack Logistique** | 12 000 FCFA | 120 000 FCFA | Cantine + Transport |
| **Pack RH complet** | 20 000 FCFA | 200 000 FCFA | Personnel + Contrats + Paie + Recrutement |
| **Pack Performance** | 10 000 FCFA | 100 000 FCFA | Gamification + Scoring + Orientation |
| **Pack Organisation** | 10 000 FCFA | 100 000 FCFA | Organigramme + Hiérarchie |
| **Pack Vie scolaire** | 6 000 FCFA | 60 000 FCFA | Discipline + Santé + Clubs |
| **Pack Finances** | 18 000 FCFA | 180 000 FCFA | Finances + Comptabilité |
| **Pack Inventaire** | 5 000 FCFA | 50 000 FCFA | Matériel + Équipements |
| **Module unitaire** | 3 000 FCFA | 30 000 FCFA | Any module seul |
| **SMS en masse** | 15 FCFA/SMS | — | Crédits SMS |
| **Mobile Money** | 2% transaction | — | Orange Money, MTN, Wave |
| **Paiement en ligne** | 1.5% transaction | — | Carte bancaire |
| **Domaine personnalisé** | 5 000 FCFA | 50 000 FCFA | ecole.votredomaine.com |
| **White-label complet** | 15 000 FCFA | 150 000 FCFA | Branding total, favicon, emails |
| **Stockage extra** | 2 000 FCFA/10 Go/mois | 20 000 FCFA/100 Go/an | Extension |
| **Support premium** | 15 000 FCFA | 150 000 FCFA | 24/7, réponse 1h |
| **Élèves supplémentaires** | 100 FCFA/élève/mois | — | Au-delà plafond tranche |
| **Établissement extra** | 15 000 FCFA/mois | 150 000 FCFA/an | Site additionnel |

---

## 6. Tableau Comparatif Global

### 6.1 Synthèse des Prix (T2 — 101-500 élèves, offre de base)

| | Licence Local | Abonnement Local | Licence Cloud | SaaS Cloud |
|---|---|---|---|---|
| **Coût 1ère année** | 500 000 FCFA | 500 000 FCFA | 700 000 FCFA | 650 000 FCFA |
| **Coût année 2** | 100 000 FCFA (maint.) | 500 000 FCFA | 700 000 FCFA | 650 000 FCFA |
| **Coût 3 ans** | 700 000 FCFA | 1 500 000 FCFA | 2 100 000 FCFA | 1 950 000 FCFA |
| **Infrastructure** | Client | Client | eLISAschool | eLISAschool |
| **Maintenance** | Client (optionnel) | Incluse | Incluse | Incluse |
| **Mises à jour** | Optionnelles | Incluses | Incluses | Auto |
| **Contrôle données** | Total | Total | Partagé | Partagé |
| **Internet requis** | Non | Non | Oui | Oui |
| **Montée en charge** | Manuel | Manuel | Auto | Auto |

### 6.2 Recommandation par Profil Client

| Profil | Plan recommandé | Raison |
|--------|-----------------|--------|
| **École rurale, pas d'IT** | SaaS Cloud T1/T2 | Zéro contrainte technique |
| **École urbaine, admin IT** | Abonnement Local T2/T3 | Contrôle + support |
| **Groupe scolaire privé** | Licence Cloud T3/T4 | Infra dédiée + modules |
| **Établissement public** | Licence Local T3/T4 | Souveraineté données |
| **Université / Grande école** | Licence Local T5 ou Cloud T5 | Sur mesure |
| **Réseau confessionnel** | SaaS Cloud T4 + multi-sites | Centralisation + simplicité |
| **École maternelle/primaire** | SaaS Cloud T1 | Petit budget, simple |
| **Lycée technique** | Abonnement Local T3 + packs | EDT + Programmes critiques |

---

## 7. Règles de Pricing

### 7.1 Cohérence Interne

| Règle | Justification |
|-------|---------------|
| Licence Local < Licence Cloud | Le client assume l'infrastructure |
| Abonnement Local = Licence Local / an | Neutralité achat vs location |
| SaaS Cloud > Abonnement Local | Infrastructure + maintenance incluses |
| Packs < Somme des modules | Incitation aux bundles |
| Remise annuelle 17% (2 mois offerts) | Incitation engagement long |
| Prix/élève décroissant par tranche | Économie d'échelle |

### 7.2 Règle du "100 FCFA par élève"

**Objectif marketing** : Communiquer "moins de 100 FCFA par élève et par mois" pour les tranches T2+.

| Tranche | SaaS/mois | Prix/élève/mois | Message |
|---------|-----------|-----------------|---------|
| T1 (100) | 30 000 | 300 FCFA | "À partir de 300 F/élève" |
| T2 (500) | 65 000 | 130 FCFA | "Seulement 130 F/élève" |
| T3 (1500) | 140 000 | 93 FCFA | **"Moins de 100 F/élève !"** |
| T4 (5000) | 300 000 | 60 FCFA | **"60 F/élève seulement"** |

### 7.3 Marge Cible

| Plan | Marge brute cible | Coût infrastructure | Coût support |
|------|-------------------|---------------------|--------------|
| Licence Local | 90%+ | 0 | Faible |
| Abonnement Local | 70% | 0 | Moyen |
| Licence Cloud | 60% | 25% | Moyen |
| SaaS Cloud | 65% | 20% | Moyen |

---

## 8. Options — Détail des Packs

### 8.1 Pack Académique (OPT-ACAD)

| Module | Contenu |
|--------|---------|
| Bulletins avancés | Génération PDF, templates personnalisés, moyennes, rangs |
| Emploi du temps | Planification, détection conflits, drag & drop, export |
| Programmes | Curriculum par niveau, progression, conformité |
| Examens nationaux | Préparation BEPC, BAC, statistiques résultats |

**Valeur perçue** : Gain de 5-10h/semaine pour l'administration.

### 8.2 Pack Communication (OPT-COM)

| Module | Contenu |
|--------|---------|
| Messagerie | Chat interne, groupes, pièces jointes |
| Annonces | Bandeau défilant, ciblage par classe/rôle |
| Sondages | Templates, votes, analyses en temps réel |
| Requêtes | Demandes administratives, workflow validation |

**Valeur perçue** : Réduction de 80% des communications papier.

### 8.3 Pack Logistique (OPT-LOG)

| Module | Contenu |
|--------|---------|
| Cantine | Menus hebdomadaires, paiements, allergies |
| Transport | Lignes, arrêts, suivi GPS, QR check-in |
| Parking | Places, abonnements, véhicules |

**Valeur perçue** : Contrôle total des services annexes.

### 8.4 Pack RH Complet (OPT-RH)

| Module | Contenu |
|--------|---------|
| Personnel | Dossiers, contrats, absences, évaluations |
| Contrats | Types, renouvellements, workflow validation |
| Paie | Bulletins salaire, cotisations, primes, retenues |
| Recrutement | Offres, candidatures, entretiens, onboarding |

**Valeur perçue** : Digitalisation complète de la fonction RH.

### 8.5 Pack Performance (OPT-PERF)

| Module | Contenu |
|--------|---------|
| Gamification | Points, badges, classements, récompenses |
| Scoring | Évaluation globale performance élèves/enseignants |
| Orientation | Conseil d'orientation basé sur les résultats |

**Valeur perçue** : Motivation et pilotage de la performance.

### 8.6 Pack Organisation (OPT-ORG)

| Module | Contenu |
|--------|---------|
| Organisation | Unités organisationnelles, échelons structurels |
| Hiérarchie | Relations personne→personne et poste→poste |
| Organigramme | ReactFlow interactif, export PNG/PDF HD |
| Postes | Gestion des postes, capacités, affectations |

**Valeur perçue** : Visualisation professionnelle de la structure.

### 8.7 Pack Vie Scolaire (OPT-VIE)

| Module | Contenu |
|--------|---------|
| Discipline | Sanctions, points comportement, notifications parents |
| Santé | Infirmerie, visites, traitements, allergies |
| Clubs | Activités extrascolaires, inscriptions, planning |
| Bibliothèque | Catalogue, prêts, retards, réservations |

**Valeur perçue** : Suivi complet de la vie de l'élève.

### 8.8 Pack Finances (OPT-FIN)

| Module | Contenu |
|--------|---------|
| Finances | Scolarités, échéances, paiements, relances |
| Comptabilité | Journal, grand livre, bilan, comptes |
| Mobile Money | Intégration Orange Money, MTN MoMo, Wave |
| Paiement en ligne | Carte bancaire, virement |

**Valeur perçue** : Zéro impayé, recouvrement automatisé.

---

## 9. Exemples de Configurations Client

### 9.1 Exemple 1 — Petit collège privé (350 élèves)

**Profil** : Établissement urbain, 1 site, pas d'admin IT

**Plan choisi** : SaaS Cloud T2 (abonnement)

| Élément | Prix/mois |
|---------|-----------|
| Abonnement base T2 | 65 000 FCFA |
| Pack Académique | 15 000 FCFA |
| Pack Communication | 8 000 FCFA |
| SMS (200/mois) | 3 000 FCFA |
| **TOTAL** | **91 000 FCFA/mois** |
| **Par élève/mois** | **260 FCFA** |

### 9.2 Exemple 2 — Grand lycée public (2000 élèves)

**Profil** : Établissement public, souveraineté données, admin IT

**Plan choisi** : Licence Locale T4 (achat unique)

| Élément | Prix unique |
|---------|-------------|
| Licence T4 | 2 500 000 FCFA |
| Pack Académique | 150 000 FCFA |
| Pack RH | 200 000 FCFA |
| Pack Finances | 180 000 FCFA |
| Installation sur site | 150 000 FCFA |
| Formation 8h | 200 000 FCFA |
| **TOTAL 1ère année** | **3 380 000 FCFA** |
| **Année suivante** | **500 000 FCFA** (maintenance) |
| **Par élève/an** | **1 690 FCFA** (1ère année) |

### 9.3 Exemple 3 — Réseau confessionnel (3 sites, 4000 élèves)

**Profil** : 3 établissements, centralisation, budget moyen

**Plan choisi** : Licence Cloud T4 + multi-sites

| Élément | Prix/an |
|---------|---------|
| Licence Cloud T4 | 3 000 000 FCFA |
| Pack Académique | 200 000 FCFA |
| Pack Communication | 100 000 FCFA |
| Pack RH | 250 000 FCFA |
| Pack Finances | 220 000 FCFA |
| 2 établissements extra | 300 000 FCFA |
| White-label | 100 000 FCFA |
| **TOTAL annuel** | **4 170 000 FCFA** |
| **Par élève/an** | **1 043 FCFA** |
| **Par élève/mois** | **87 FCFA** |

---

## 10. Stratégie Commerciale

### 10.1 Argumentaire de Vente

**Pitch principal** :
> "eLISAschool digitalise entièrement votre établissement à partir de 87 FCFA par élève et par mois. Choisissez votre mode de déploiement — sur votre serveur ou dans le cloud — et composez votre offre à la carte selon vos besoins."

**Arguments par plan** :

| Plan | Argument clé |
|------|--------------|
| **Local Licence** | "Investissez une fois, utilisez à vie. Vos données restent chez vous." |
| **Local Abonnement** | "Profitez du logiciel sans investissement initial. Maintenance incluse." |
| **Cloud Licence** | "Infrastructure dédiée, données souveraines, zéro contrainte technique." |
| **Cloud SaaS** | "Démarrez en 24h. Zéro installation, zéro maintenance." |

### 10.2 Stratégie d'Acquisition

| Canal | Cible | Action |
|-------|-------|--------|
| **Essai gratuit 30j** | Tous | SaaS T1/T2, pas de CB requise |
| **Demo sur site** | Local | 2h gratuites, présentation + POC |
| **Webinaires mensuels** | Tous | Thèmes métier (bulletins, EDT, finances) |
| **Parrainage** | Existant | 1 mois offert par filleul |
| **Salons éducatifs** | Décideurs | Stand + demo live |
| **Partenariats** | Réseaux | Convention cadre avec réseaux scolaires |

### 10.3 Cycle de Vente

| Plan | Cycle | Décideur |
|------|-------|----------|
| SaaS T1/T2 | 1-2 semaines | Directeur d'école |
| SaaS T3/T4 | 2-4 semaines | DG + Conseil d'administration |
| Local Licence | 1-3 mois | DG + Service informatique + CA |
| Cloud Licence | 2-4 mois | DG + IT + Ministère (si public) |

---

## 11. Projections Révisées

### 11.1 Répartition Attendue

| Plan | Part clients | Revenue moyen |
|------|-------------|---------------|
| SaaS Cloud | 50% | 80 000 FCFA/mois |
| Abonnement Local | 20% | 70 000 FCFA/mois |
| Licence Cloud | 15% | 200 000 FCFA/mois (équivalent) |
| Licence Locale | 15% | 800 000 FCFA (one-shot) |

### 11.2 Scénario Année 1

| Plan | Clients | Revenue annuel |
|------|---------|----------------|
| SaaS T1-T2 | 40 | 38 400 000 FCFA |
| SaaS T3-T4 | 10 | 20 160 000 FCFA |
| Abonnement Local T1-T3 | 15 | 12 600 000 FCFA |
| Licence Cloud T1-T3 | 8 | 8 960 000 FCFA |
| Licence Locale T1-T3 | 10 | 8 700 000 FCFA |
| Options (tous plans) | — | 25 000 000 FCFA |
| Services (formation, install) | — | 15 000 000 FCFA |
| **TOTAL** | **83** | **~128 000 000 FCFA** |

---

## 12. Résumé Décisionnel

```
QUESTION 1 : Où le logiciel tourne-t-il ?
├── Chez le client (serveur local) → PLAN LOCAL
│   │
│   QUESTION 2 : Achat ou location ?
│   ├── Achat unique → LICENCE PERPÉTUELLE
│   │   → T1 à T5 selon nombre d'élèves
│   │   → Offre de base + options à la carte
│   │
│   └── Location mensuelle → ABONNEMENT LOCAL
│       → T1 à T5 selon nombre d'élèves
│       → Offre de base + options à la carte
│
└── Chez eLISAschool (VPS/Cloud) → PLAN CLOUD
    │
    QUESTION 2 : Infrastructure dédiée ou partagée ?
    ├── Dédiée (VPS privé) → LICENCE CLOUD
    │   → T1 à T5 selon nombre d'élèves
    │   → Offre de base + options à la carte
    │
    └── Partagée (SaaS) → ABONNEMENT SAAS
        → T1 à T5 selon nombre d'élèves
        → Offre de base + options à la carte
```

**Chaque aboutissant = offre de base (modules socle) + options à la carte (19 modules + 8 packs).**

---

**Document rédigé par** : admin project
**Date** : 28 juillet 2026
**Version** : 2.0
