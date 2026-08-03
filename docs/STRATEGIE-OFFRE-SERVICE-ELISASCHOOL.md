# Stratégie Commerciale eLISAschool v3

> **Version** : 3.0 — Août 2026
> **Statut** : Validée (grill-me complet)
> **Auteur** : franck arlos chendjou
> **Simulateur interactif** : [SIMULATEUR-STRATEGIE-TARIFAIRE.html](SIMULATEUR-STRATEGIE-TARIFAIRE.html)

---

## 1. Modèle Commercial — Vue d'ensemble

eLISAschool n'est **pas un SaaS**. Chaque déploiement est **manuel et dédié** :

| Mode | Description | Infrastructure |
|------|-------------|----------------|
| **Serveur local** | Installé sur le serveur de l'établissement | Client gère le matériel |
| **Serveur hébergé** | Installé sur un VPS/cloud (Ovh, Hetzner, etc.) | eLISAschool gère l'infrastructure |

### 1.1 Deux modes de facturation

| Mode | Principe | Engagement |
|------|----------|------------|
| **Abonnement mensuel** | Paiement récurrent chaque mois | Résiliable à tout moment (préavis 1 mois) |
| **Licence perpétuelle** | Achat définitif du droit d'utilisation | Paiement comptant ou échelonné |

### 1.2 Structure de prix

Chaque offre se décompose en **3 couches** :

```
┌─────────────────────────────────────────────┐
│  FRAIS DE PLATEFORME (socle + infrastructure)│  ← Couvre les 12 modules de base
├─────────────────────────────────────────────┤
│  PACKS MODULES (optionnels, cumulables)      │  ← 6 packs disponibles
├─────────────────────────────────────────────┤
│  SERVICES ADDITIONNELS (à la consommation)   │  ← SMS + Stockage
└─────────────────────────────────────────────┘
```

---

## 2. Tranches de Tarification

8 tranches basées sur l'**effectif total de l'établissement** (nombre d'élèves inscrits) :

| Tranche | Effectif | Profil type |
|---------|----------|-------------|
| **T1** | 1 – 100 | École rurale, petite structure |
| **T2** | 101 – 200 | École primaire standard |
| **T3** | 201 – 500 | École moyenne, collège |
| **T4** | 501 – 1 000 | Grand collège, petit lycée |
| **T5** | 1 001 – 2 000 | Lycée, complexe scolaire |
| **T6** | 2 001 – 3 000 | Grand complexe, réseau local |
| **T7** | 3 001 – 5 000 | Réseau régional |
| **T8** | 5 001+ | Réseau national, entreprise |

> **Note** : Les tranches T7 et T8 constituent le **segment entreprise**. Les prix des packs y sont plafonnés au niveau T6 ; seule la plateforme progresse.

---

## 3. Grille Tarifaire Complète

### 3.1 Frais de plateforme (abonnement mensuel, FCFA)

Couvre les **12 modules du socle** + l'infrastructure de base.

| Tranche | Abonnement mensuel | Licence perpétuelle (×36) |
|---------|-------------------|--------------------------|
| T1 (≤100) | 15 000 | 540 000 |
| T2 (101–200) | 22 000 | 792 000 |
| T3 (201–500) | 30 000 | 1 080 000 |
| T4 (501–1000) | 42 000 | 1 512 000 |
| T5 (1001–2000) | 55 000 | 1 980 000 |
| T6 (2001–3000) | 70 000 | 2 520 000 |
| T7 (3001–5000) | 85 000 | 3 060 000 |
| T8 (5000+) | 100 000 | 3 600 000 |

### 3.2 Packs Modules (abonnement mensuel, FCFA)

| Pack | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 |
|------|----|----|----|----|----|----|----|-----|
| **Communication** | 2 000 | 3 000 | 4 500 | 6 000 | 8 000 | 10 000 | 10 000 | 10 000 |
| **Logistique** | 1 500 | 2 500 | 3 500 | 5 000 | 6 500 | 8 000 | 8 000 | 8 000 |
| **Performance** | 2 500 | 4 000 | 5 500 | 8 000 | 10 000 | 13 000 | 13 000 | 13 000 |
| **Vie Scolaire** | 1 500 | 2 500 | 3 500 | 5 000 | 6 500 | 8 000 | 8 000 | 8 000 |
| **Finances** | 3 000 | 4 500 | 6 500 | 9 000 | 12 000 | 15 000 | 15 000 | 15 000 |
| **Inventaire** | 1 500 | 2 500 | 3 500 | 5 000 | 6 500 | 8 000 | 8 000 | 8 000 |

### 3.3 Services additionnels

| Service | Tarif | Condition |
|---------|-------|-----------|
| **SMS** (recharge crédits) | Voir §3.4 | Disponible pour tous |
| **Stockage supplémentaire** | 1 000 F/Go/mois | Hébergement en ligne uniquement |

#### SMS — Recharges par lots

| Lot | Crédits | Tarif (FCFA) | Prix unitaire |
|-----|---------|-------------|---------------|
| Starter | 1 000 | 5 000 | 5,0 F/crédit |
| Business | 5 000 | 20 000 | 4,0 F/crédit |
| Enterprise | 10 000 | 35 000 | 3,5 F/crédit |

> Crédits **valables jusqu'à consommation** (pas d'expiration).

#### Stockage supplémentaire

- **5 Go inclus** pour les déploiements en ligne
- Au-delà : **1 000 F/Go/mois** (ajustable à la hausse ou la baisse)
- Non applicable pour les déploiements sur serveur local

---

## 4. Licence Perpétuelle — Modalités

### 4.1 Calcul

| Élément | Formule |
|---------|---------|
| **Prix de base** | Mensuel × 36 mois |
| **Remise paiement comptant** | -20% |
| **Acompte à la commande** | 60% du montant |
| **Solde restant** | 40% du montant |
| **Échéancier** | 4 mensualités égales (2 mois d'intervalle) |

### 4.2 Exemple — T3, 3 packs

| Poste | Calcul | Montant |
|-------|--------|---------|
| Plateforme | 30 000 × 36 | 1 080 000 |
| Pack Communication | 4 500 × 36 | 162 000 |
| Pack Performance | 5 500 × 36 | 198 000 |
| Pack Finances | 6 500 × 36 | 234 000 |
| **Total licence** | | **1 674 000** |
| Remise comptant (-20%) | 1 674 000 × 0,8 | **1 339 200** |
| Acompte 60% | | 803 520 |
| 4 × mensualités | 535 680 / 4 | 133 920 × 4 |

### 4.3 Ce qui est inclus

- Droit d'utilisation **illimité dans le temps**
- Mises à jour logicielles pendant **12 mois** (incluses)
- Au-delà : option de maintenance annuelle (30% du prix licence)

---

## 5. Services Inclus et Payants

### 5.1 Services gratuits (inclus dans l'offre de base)

| Service | Conditions |
|---------|------------|
| **Support technique** | Gratuit pendant **12 mois** après déploiement. Au-delà : contrat de support (voir §5.3) |
| **Formation initiale** | **1 session gratuite** (administrateurs + enseignants, 2 jours). Au-delà : formation complémentaire (voir §5.3) |
| **Installation / Déploiement** | **Incluse** dans le prix de la licence ou du premier mois d'abonnement |
| **Mises à jour correctives** | Corrections de bugs et patches de sécurité pendant la période de couverture |
| **Stockage de base** (en ligne) | 5 Go inclus pour les déploiements hébergés |

### 5.2 Services payants

| Service | Modèle | Détail |
|---------|--------|--------|
| **SMS** | Recharge par lots | 5 000 F / 20 000 F / 35 000 F (voir §3.3) |
| **Stockage supplémentaire** | Mensuel par Go | 1 000 F/Go/mois (hébergement en ligne uniquement) |
| **Support étendu** | Annuel | Après la 1ère année gratuite (voir §5.3) |
| **Formation complémentaire** | Par session | Après la session initiale gratuite (voir §5.3) |

### 5.3 Tarifs support et formation (post-période gratuite)

| Service | Tarif | Fréquence |
|---------|-------|-----------|
| **Support technique** (après 1 an) | 15 000 F/mois (T1-T3) ou 25 000 F/mois (T4+) | Mensuel |
| **Formation complémentaire** | 50 000 F/session (1 jour) ou 80 000 F/session (2 jours) | À la demande |
| **Assistance à distance** | Incluse dans le support | Email + téléphone |
| **Assistance sur site** | 25 000 F/jour + frais de déplacement | Sur demande |

---

## 6. Modules — Classification Complète

### 6.1 Socle gratuit (12 modules)

Toujours inclus, sans surcoût, dans chaque déploiement :

| # | Module | Description |
|---|--------|-------------|
| 1 | **Authentification** | Login, JWT, rôles, permissions |
| 2 | **Utilisateurs** | Gestion des comptes, profils |
| 3 | **Configuration** | Paramètres établissement, années scolaires |
| 4 | **Organisation** | Unités, postes, fonctions, organigramme |
| 5 | **Élèves** | Inscriptions, fiches, affectations |
| 6 | **Responsables** | Parents, tuteurs, liens de parenté |
| 7 | **Notes** | Saisie, validation, statistiques |
| 8 | **Périodes** | Trimestres, semestres, bulletins |
| 9 | **Classes** | Niveaux, sections, capacités |
| 10 | **Matières** | Curriculum, programmes, coefficients |
| 11 | **Dashboard** | Tableau de bord, indicateurs |
| 12 | **Notifications** | Alertes système, rappels |

### 6.2 Packs payants (6 packs)

#### Pack Communication

| Module | Fonctionnalités clés |
|--------|---------------------|
| Messagerie | Messages internes, conversations de groupe |
| Requêtes | Demandes formelles, circuit de validation |
| Sondages | Questionnaires, votes, analyses |
| Annonces | Diffusion ciblée, priorités, accusés |

#### Pack Logistique

| Module | Fonctionnalités clés |
|--------|---------------------|
| Cantine | Menus, commandes, paiements, régimes |
| Transport | Lignes, arrêts, suivi, tarifs |
| Parking | Places, attributions, contrôle d'accès |

#### Pack Performance

| Module | Fonctionnalités clés |
|--------|---------------------|
| Emploi du temps | Génération auto, détection conflits, export |
| Suivi élève | Progression, alertes, parcours |
| Suivi personnel | Évaluations, absences, contrats |
| Orientation | Conseils, voeux, affectations |
| Gamification | Points, classements, récompenses |

#### Pack Vie Scolaire

| Module | Fonctionnalités clés |
|--------|---------------------|
| Clubs & Associations | Inscriptions, activités, budgets |
| Cartes d'identité | Génération QR, impressions |
| Documents scolaires | Certificats, attestations |
| Impressions | Bulletins, listes, rapports |
| Santé | Infirmerie, visites, traitements |

#### Pack Finances

| Module | Fonctionnalités clés |
|--------|---------------------|
| Finances | Recettes, dépenses, budgets, rapports |
| Contrats | Types, clauses, renouvellements |
| Paie | Bulletins, cotisations, primes, retenues |

#### Pack Inventaire

| Module | Fonctionnalités clés |
|--------|---------------------|
| Matériel | Catalogue, catégories, affectations |
| Inventaire | État des lieux, mouvements, valorisation |

---

## 7. Scénarios de Référence

### Scénario 1 — École rurale (80 élèves, T1)

| Poste | Détail |
|-------|--------|
| Effectif | 80 élèves |
| Tranche | T1 (≤100) |
| Déploiement | Serveur local |
| Paiement | Abonnement mensuel |
| Packs | Communication + Vie Scolaire |

| Poste | Montant |
|-------|---------|
| Plateforme | 15 000 |
| Pack Communication | 2 000 |
| Pack Vie Scolaire | 1 500 |
| **Total mensuel** | **18 500 F** |
| Coût par élève | 231 F/élève/mois |

> **Alerte** : sous le seuil de 30 000 F. Ce profil bénéficie d'un tarif social.

---

### Scénario 2 — École primaire standard (150 élèves, T2)

| Poste | Détail |
|-------|--------|
| Effectif | 150 élèves |
| Tranche | T2 (101–200) |
| Déploiement | Serveur local |
| Paiement | Abonnement mensuel |
| Packs | Communication + Performance + Vie Scolaire |

| Poste | Montant |
|-------|---------|
| Plateforme | 22 000 |
| Pack Communication | 3 000 |
| Pack Performance | 4 000 |
| Pack Vie Scolaire | 2 500 |
| **Total mensuel** | **31 500 F** |
| Coût par élève | 210 F/élève/mois |

---

### Scénario 3 — Collège moyen (350 élèves, T3)

| Poste | Détail |
|-------|--------|
| Effectif | 350 élèves |
| Tranche | T3 (201–500) |
| Déploiement | Hébergé en ligne |
| Paiement | Abonnement mensuel |
| Packs | Communication + Performance + Vie Scolaire + Finances |
| Services | SMS (lot Business) + 10 Go stockage |

| Poste | Montant |
|-------|---------|
| Plateforme | 30 000 |
| Pack Communication | 4 500 |
| Pack Performance | 5 500 |
| Pack Vie Scolaire | 3 500 |
| Pack Finances | 6 500 |
| SMS (5 000 crédits) | 20 000 |
| Stockage (+5 Go) | 5 000 |
| **Total mensuel** | **75 000 F** |
| Coût par élève | 214 F/élève/mois |

---

### Scénario 4 — Grand collège (750 élèves, T4)

| Poste | Détail |
|-------|--------|
| Effectif | 750 élèves |
| Tranche | T4 (501–1000) |
| Déploiement | Hébergé en ligne |
| Paiement | Abonnement mensuel |
| Packs | Communication + Logistique + Performance + Vie Scolaire + Finances |
| Services | SMS (lot Enterprise) + 15 Go stockage |

| Poste | Montant |
|-------|---------|
| Plateforme | 42 000 |
| Pack Communication | 6 000 |
| Pack Logistique | 5 000 |
| Pack Performance | 8 000 |
| Pack Vie Scolaire | 5 000 |
| Pack Finances | 9 000 |
| SMS (10 000 crédits) | 35 000 |
| Stockage (+10 Go) | 10 000 |
| **Total mensuel** | **120 000 F** |
| Coût par élève | 160 F/élève/mois |

---

### Scénario 5 — Lycée (1 500 élèves, T5)

| Poste | Détail |
|-------|--------|
| Effectif | 1 500 élèves |
| Tranche | T5 (1001–2000) |
| Déploiement | Hébergé en ligne |
| Paiement | Abonnement mensuel |
| Packs | 6 packs (tous) |
| Services | SMS (lot Enterprise ×2) + 25 Go stockage |

| Poste | Montant |
|-------|---------|
| Plateforme | 55 000 |
| Pack Communication | 8 000 |
| Pack Logistique | 6 500 |
| Pack Performance | 10 000 |
| Pack Vie Scolaire | 6 500 |
| Pack Finances | 12 000 |
| Pack Inventaire | 6 500 |
| SMS (20 000 crédits) | 70 000 |
| Stockage (+20 Go) | 20 000 |
| **Total mensuel** | **194 500 F** |
| Coût par élève | 130 F/élève/mois |

---

### Scénario 6 — Grand complexe (2 500 élèves, T6)

| Poste | Détail |
|-------|--------|
| Effectif | 2 500 élèves |
| Tranche | T6 (2001–3000) |
| Déploiement | Hébergé en ligne |
| Paiement | Abonnement mensuel |
| Packs | 6 packs (tous) |
| Services | SMS (lot Enterprise ×3) + 40 Go stockage |

| Poste | Montant |
|-------|---------|
| Plateforme | 70 000 |
| 6 packs (total) | 62 000 |
| SMS (30 000 crédits) | 105 000 |
| Stockage (+35 Go) | 35 000 |
| **Total mensuel** | **272 000 F** |
| Coût par élève | 109 F/élève/mois |

---

### Scénario 7 — Réseau régional (4 000 élèves, T7)

| Poste | Détail |
|-------|--------|
| Effectif | 4 000 élèves |
| Tranche | T7 (3001–5000) |
| Déploiement | Hébergé en ligne (multi-sites) |
| Paiement | Licence perpétuelle (comptant -20%) |
| Packs | 6 packs (tous) |
| Services | SMS (lot Enterprise ×5) + 80 Go stockage |

| Poste | Mensuel éq. |
|-------|-------------|
| Plateforme | 85 000 |
| 6 packs (total) | 62 000 |
| SMS (50 000 crédits) | 175 000 |
| Stockage (+75 Go) | 75 000 |
| **Total mensuel éq.** | **397 000 F** |
| Licence (×36, -20%) | 11 473 200 F (comptant) |
| Coût par élève | 99 F/élève/mois |

---

### Scénario 8 — Réseau national (5 500 élèves, T8)

| Poste | Détail |
|-------|--------|
| Effectif | 5 500 élèves |
| Tranche | T8 (5000+) |
| Déploiement | Hébergé en ligne (multi-régions) |
| Paiement | Licence perpétuelle (échéancier) |
| Packs | 6 packs (tous) |
| Services | SMS (lot Enterprise ×10) + 150 Go stockage |

| Poste | Mensuel éq. |
|-------|-------------|
| Plateforme | 100 000 |
| 6 packs (total) | 62 000 |
| SMS (100 000 crédits) | 350 000 |
| Stockage (+145 Go) | 145 000 |
| **Total mensuel éq.** | **657 000 F** |
| Licence (×36) | 23 652 000 F |
| Acompte 60% | 14 191 200 F |
| 4 × mensualités | 2 365 200 F |
| Coût par élève | 119 F/élève/mois |

---

## 8. Analyse de Rentabilité

### 8.1 Bande cible : 30 000 – 100 000 F/mois

| Tranche | Plateforme seule | +1 pack | +3 packs | +6 packs |
|---------|-----------------|---------|----------|----------|
| T1 | 15 000 | 17 000–18 000 | 21 500–23 500 | 30 000 |
| T2 | 22 000 | 25 000–26 000 | 31 500–34 000 | 41 000 |
| T3 | 30 000 | 33 500–36 000 | 43 500–48 000 | 55 000 |
| T4 | 42 000 | 47 000–51 000 | 59 000–67 000 | 80 000 |
| T5 | 55 000 | 61 500–67 000 | 77 500–87 000 | 104 500 |
| T6 | 70 000 | 78 000–85 000 | 98 000–110 000 | 132 000 |
| T7 | 85 000 | 93 000–100 000 | 113 000–125 000 | 147 000 |
| T8 | 100 000 | 108 000–115 000 | 128 000–140 000 | 162 000 |

> **Lecture** : pour rester dans la bande 30K–100K, un établissement T1 doit souscrire au moins 3 packs (≈22 000 F de packs), tandis qu'un T4 avec 3 packs est déjà à 67 000 F.

### 8.2 Seuil de rentabilité par élève

| Tranche | Min (pack seul) | Max (6 packs) |
|---------|----------------|---------------|
| T1 | 375 F/élève | 300 F/élève |
| T2 | 167 F/élève | 205 F/élève |
| T3 | 110 F/élève | 110 F/élève |
| T4 | 84 F/élève | 80 F/élève |
| T5 | 55 F/élève | 52 F/élève |
| T6 | 39 F/élève | 44 F/élève |
| T7 | 29 F/élève | 30 F/élève |
| T8 | 20 F/élève | 24 F/élève |

> **Objectif** : le coût par élève reste **toujours inférieur à 400 F/mois**, même pour les petites structures.

---

## 9. Positionnement Concurrentiel

### 9.1 Comparaison avec les solutions existantes

| Solution | Modèle | Prix | Couverture |
|----------|--------|------|------------|
| **AppAcademia** | SaaS | 5 000–20 000 F/élève/an | Notes + bulletins |
| **EdukaSoftware** | Freemium | 34–55 €/mois | Limité |
| **Logesco** | Freemium | Variable | Partiel |
| **GesSchool** | Sur devis | Non publié | Complet |
| **Zaame** | Freemium | Variable | Basique |
| **ProsoftAfrica** | Sur devis | Non publié | Complet |
| **eLISAschool** | Dédié | 18 500–657 000 F/mois | **55+ modules** |

### 9.2 Avantages compétitifs eLISAschool

| Avantage | Détail |
|----------|--------|
| **Couverture complète** | 55+ modules répartis en 6 packs — aucune solution concurrente n'offre ce périmètre |
| **Déploiement dédié** | Pas de mutualisation — données isolées, performance garantie |
| **Flexibilité** | Choix du mode (local/hébergé) et du paiement (mensuel/licence) |
| **Socle gratuit généreux** | 12 modules inclus sans surcoût (notes, bulletins, élèves, organisation) |
| **Pas de coût par élève obligatoire** | Le prix est forfaitaire par tranche, pas multiplié par l'effectif |
| **Ultra-responsif** | Interface adaptée de 100px à 2560px (montres → écrans 4K) |
| **Multi-langue** | Français + Anglais natif |
| **Données souveraines** | Serveur local = contrôle total ; hébergé = infrastructure identifiée |

---

## 10. Conditions Générales

### 10.1 Abonnement mensuel

- Engagement minimum : **1 mois**
- Résiliation : préavis de **30 jours** avant la fin de la période en cours
- Paiement : d'avance, le 1er de chaque mois
- Suspension : si impayé > 15 jours, accès suspendu (données conservées 90 jours)

### 10.2 Licence perpétuelle

- Droit d'utilisation **à vie** pour l'établissement signataire
- Transfert interdit sans accord écrit
- Mises à jour incluses pendant **12 mois**
- Option maintenance annuelle : **30% du prix licence** (couvre mises à jour + support)
- Acompte non remboursable après signature

### 10.3 Support et maintenance

- **Période gratuite** : 12 mois après déploiement (support + mises à jour correctives)
- **Période payante** : contrat annuel renouvelable (voir §5.3)
- SLA : réponse sous 48h (email), 24h (téléphone), 72h (sur site)

### 10.4 Formation

- **Session initiale** : 2 jours (administrateurs + enseignants), gratuite
- **Formation complémentaire** : 1 ou 2 jours, à la demande (voir §5.3)
- Documentation utilisateur et vidéos tutoriels accessibles en permanence

---

## 11. Hypothèses et Simulations

### 11.1 Hypothèses de pénétration

| Hypothèse | Valeur | Justification |
|-----------|--------|---------------|
| Parc adressable Cameroun | ~15 000 établissements | MINESEC + MINEDUB |
| Taux de conversion Year 1 | 0,5% | 75 clients |
| Taux de conversion Year 2 | 1,5% | 225 clients |
| Taux de conversion Year 3 | 3,0% | 450 clients |
| Répartition tranches | 40% T1-T2, 30% T3-T4, 20% T5-T6, 10% T7-T8 | Majorité de petites structures |
| Taux de renouvellement | 85%/an | Satisfaction client |
| Panier moyen (abonnement) | 45 000 F/mois | Pondéré par tranche |
| Taux d'attachement packs | 2,5 packs/client en moyenne | Socle + modules métier |

### 11.2 Projection de revenus (3 ans)

| Indicateur | Année 1 | Année 2 | Année 3 |
|------------|---------|---------|---------|
| Clients actifs | 75 | 225 | 450 |
| Dont abonnement | 60 | 180 | 360 |
| Dont licence | 15 | 45 | 90 |
| Revenu abonnement (F) | 32 400 000 | 97 200 000 | 194 400 000 |
| Revenu licences (F) | 12 150 000 | 36 450 000 | 72 900 000 |
| Revenu SMS (F) | 3 750 000 | 11 250 000 | 22 500 000 |
| Revenu stockage (F) | 2 700 000 | 8 100 000 | 16 200 000 |
| Revenu support (F) | 0 | 2 700 000 | 8 100 000 |
| **Revenu total (F)** | **51 000 000** | **155 700 000** | **414 100 000** |
| **Revenu total (EUR)** | **~77 750 €** | **~237 360 €** | **~631 350 €** |

### 11.3 Structure de coûts estimée

| Poste | % du revenu | Year 1 (F) |
|-------|-------------|------------|
| Infrastructure (hébergement, serveurs) | 15% | 7 650 000 |
| Personnel (dev, support, commercial) | 45% | 22 950 000 |
| SMS (coût fournisseur) | 8% | 4 080 000 |
| Marketing et acquisition | 10% | 5 100 000 |
| Frais généraux | 7% | 3 570 000 |
| **Marge brute** | **15%** | **7 650 000** |

---

## 12. Recommandations Stratégiques

### 12.1 Court terme (0–6 mois)

1. **Finaliser le socle** : les 12 modules gratuits doivent être irréprochables (stabilité, UX, documentation)
2. **Pack Communication en priorité** : c'est le pack d'entrée le plus demandé (messagerie, annonces)
3. **Offre de lancement** : 3 mois gratuits pour les 50 premiers clients (T1–T3)
4. **Partenariats SMS** : négocier les tarifs avec les opérateurs locaux (MTN, Orange, Camtel)

### 12.2 Moyen terme (6–18 mois)

1. **Programme ambassadeurs** : former des référents dans chaque région
2. **Marketplace d'extensions** : permettre à des tiers de développer des modules
3. **API ouverte** : intégration avec les systèmes existants (comptabilité, RH)
4. **Certification** : label de qualité pour les établissements partenaires

### 12.3 Long terme (18–36 mois)

1. **Expansion sous-régionale** : Gabon, Congo, Côte d'Ivoire, Sénégal
2. **Module IA** : analyse prédictive (décrochage scolaire, orientation)
3. **Application mobile native** : parents + enseignants
4. **Portail inter-établissements** : réseau d'échanges entre écoles partenaires

---

## 13. Glossaire

| Terme | Définition |
|-------|------------|
| **Tranche** | Catégorie de tarification basée sur l'effectif total de l'établissement |
| **Frais de plateforme** | Coût mensuel couvrant le socle de 12 modules + l'infrastructure |
| **Pack module** | Ensemble de modules fonctionnels optionnels, facturé séparément |
| **Licence perpétuelle** | Droit d'utilisation illimité dans le temps, acquis en un ou plusieurs paiements |
| **Abonnement mensuel** | Paiement récurrent mensuel, résiliable à tout moment |
| **Déploiement local** | Installation sur le serveur physique de l'établissement |
| **Déploiement hébergé** | Installation sur un serveur cloud/VPS géré par eLISAschool |
| **Crédit SMS** | Unité de consommation pour l'envoi de SMS (1 crédit = 1 SMS) |
| **Stockage additionnel** | Espace disque supplémentaire au-delà des 5 Go inclus (hébergement uniquement) |
| **FCFA** | Franc CFA (XAF), devise de la zone CEMAC |

---

## 14. Historique des Versions

| Version | Date | Modifications |
|---------|------|---------------|
| v1.0 | 2025 | Modèle initial 4 branches (SaaS/Premium/Standard/Gratuit) |
| v2.0 | 2026-07 | 9 packs, modèle hybride, première itération grill-me |
| **v3.0** | **2026-08** | **Refonte complète : 2 déploiements × 2 paiements × 8 tranches × 6 packs. Simulateur interactif. Scénarios de référence.** |

---

*Document vivant — mis à jour à chaque évolution du modèle commercial.*
*Simulateur interactif : [SIMULATEUR-STRATEGIE-TARIFAIRE.html](SIMULATEUR-STRATEGIE-TARIFAIRE.html)*
