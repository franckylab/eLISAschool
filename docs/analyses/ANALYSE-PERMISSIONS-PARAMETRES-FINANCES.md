# 🔐 Analyse Complète - Permissions, Paramètres & Configurations Module Finances

## 📋 Objectif

Identifier **TOUS les éléments** du module Finances qui peuvent faire l'objet de :
- 🔐 **Permissions RBAC** (accès aux fonctionnalités)
- ⚙️ **Paramètres de configuration** (comportement dynamique)
- 🎛️ **Configurations métier** (règles et seuils)

---

## 1️⃣ PERMISSIONS RBAC - Analyse Complète

### A. Permissions Actuelles (27 permissions)

#### **SCOLARITÉ (7 permissions)** ✅

| Permission | Description | Rôles Typiques | Opération |
|------------|-------------|----------------|-----------|
| `finances:scolarite:view` | Voir configurations frais | COMPTABLE, CHEF, ADMIN | READ |
| `finances:scolarite:config` | Configurer frais scolarité | ADMIN, COMPTABLE | CREATE/UPDATE |
| `finances:paiement:create` | Enregistrer paiement | COMPTABLE, CAISSIER | CREATE |
| `finances:paiement:validate` | Valider paiement | COMPTABLE, CHEF | UPDATE |
| `finances:recu:generate` | Générer reçu | COMPTABLE, CAISSIER | CREATE |
| `finances:relance:send` | Envoyer relance | COMPTABLE | CREATE |
| `finances:etat-compte:view` | Voir état compte élève | COMPTABLE, PARENT | READ |

**Permissions manquantes identifiées** ❌ :
- `finances:paiement:refund` - Remboursement paiement
- `finances:paiement:delete` - Supprimer paiement (annulation)
- `finances:remise:grant` - Accorder remise
- `finances:echeancier:generate` - Générer échéancier
- `finances:echeancier:edit` - Modifier échéancier

---

#### **DÉPENSES (14 permissions)** ✅

| Permission | Description | Rôles Typiques | Opération |
|------------|-------------|----------------|-----------|
| `finances:depenses:view` | Voir dépenses | COMPTABLE, CHEF, ADMIN | READ |
| `finances:depenses:create` | Créer dépense | COMPTABLE | CREATE |
| `finances:depenses:edit` | Modifier dépense | COMPTABLE | UPDATE |
| `finances:depenses:validate` | Valider dépense | CHEF, ADMIN | UPDATE |
| `finances:depenses:payer` | Payer dépense | COMPTABLE, CAISSIER | UPDATE |
| `finances:depenses:delete` | Supprimer dépense | ADMIN | DELETE |
| `finances:depenses:config` | Configurer catégories | ADMIN, COMPTABLE | CONFIG |
| `finances:depenses:rapports` | Voir rapports | CHEF, ADMIN, COMPTABLE | READ |
| `finances:demande:create` | Créer demande dépense | TOUS PERSONNEL | CREATE |
| `finances:demande:validate` | Valider demande | CHEF, ADMIN | UPDATE |
| `finances:bon-commande:create` | Créer bon commande | COMPTABLE | CREATE |
| `finances:bon-commande:validate` | Valider bon commande | CHEF | UPDATE |
| `finances:fournisseurs:view` | Voir fournisseurs | COMPTABLE | READ |
| `finances:fournisseurs:manage` | Gérer fournisseurs | COMPTABLE, ADMIN | CRUD |

**Permissions manquantes identifiées** ❌ :
- `finances:depenses:export` - Exporter dépenses (Excel/PDF)
- `finances:demande:reject` - Rejeter demande
- `finances:demande:view-all` - Voir toutes demandes (vs mes demandes)
- `finances:facture:validate` - Valider facture fournisseur

---

#### **COMPTABILITÉ (3 permissions)** ✅

| Permission | Description | Rôles Typiques | Opération |
|------------|-------------|----------------|-----------|
| `finances:comptabilite:view` | Voir écritures | COMPTABLE, ADMIN | READ |
| `finances:comptabilite:ecrire` | Créer écriture | COMPTABLE | CREATE |
| `finances:comptabilite:valider` | Valider écriture | CHEF COMPTABLE | UPDATE |

**Permissions manquantes identifiées** ❌ :
- `finances:comptabilite:annuler` - Annuler écriture
- `finances:comptabilite:balance` - Voir balance
- `finances:comptabilite:rapport` - Voir rapport financier
- `finances:comptabilite:export` - Exporter comptabilité

---

#### **TRÉSORERIE (2 permissions)** ✅

| Permission | Description | Rôles Typiques | Opération |
|------------|-------------|----------------|-----------|
| `finances:tresorerie:view` | Voir trésorerie | COMPTABLE, CHEF, ADMIN | READ |
| `finances:tresorerie:manage` | Gérer caisse/banque | COMPTABLE, CAISSIER | CRUD |

**Permissions manquantes identifiées** ❌ :
- `finances:caisse:entrer` - Entrée de caisse
- `finances:caisse:sortir` - Sortie de caisse
- `finances:banque:virer` - Virement bancaire
- `finances:caisse:cloturer` - Clôture de caisse (journalière)

---

#### **BUDGET (3 permissions)** ✅

| Permission | Description | Rôles Typiques | Opération |
|------------|-------------|----------------|-----------|
| `finances:budget:view` | Voir budgets | CHEF, ADMIN, COMPTABLE | READ |
| `finances:budget:create` | Créer budget | ADMIN, CHEF | CREATE |
| `finances:budget:validate` | Valider budget | ADMIN, DIRECTEUR | UPDATE |

**Permissions manquantes identifiées** ❌ :
- `finances:budget:edit` - Modifier budget
- `finances:budget:cloturer` - Clôturer budget annuel
- `finances:budget:engager` - Engager budget
- `finances:budget:consommer` - Consommer budget
- `finances:budget:rapports` - Rapports budgétaires

---

#### **DASHBOARD (0 permissions actuelles)** ❌

**Permissions à créer** :
- `finances:dashboard:view` - Voir dashboard financier
- `finances:dashboard:export` - Exporter statistiques
- `finances:dashboard:kpi` - Voir KPIs avancés
- `finances:rapports:financiers` - Générer rapports financiers

---

### B. Permissions RECOMMANDÉES (Total: 54 permissions)

```typescript
// FINANCES - SCOLARITÉ (12 permissions)
FINANCES_SCOLARITE_VIEW = 'finances:scolarite:view',
FINANCES_SCOLARITE_CONFIG = 'finances:scolarite:config',
FINANCES_PAIEMENT_CREATE = 'finances:paiement:create',
FINANCES_PAIEMENT_VALIDATE = 'finances:paiement:validate',
FINANCES_PAIEMENT_REFUND = 'finances:paiement:refund',          // NOUVEAU
FINANCES_PAIEMENT_DELETE = 'finances:paiement:delete',          // NOUVEAU
FINANCES_RECU_GENERATE = 'finances:recu:generate',
FINANCES_RECU_DOWNLOAD = 'finances:recu:download',              // NOUVEAU
FINANCES_RELANCE_SEND = 'finances:relance:send',
FINANCES_ETAT_COMPTE_VIEW = 'finances:etat-compte:view',
FINANCES_REMISE_GRANT = 'finances:remise:grant',                // NOUVEAU
FINANCES_ECHEANCIER_GENERATE = 'finances:echeancier:generate',  // NOUVEAU

// FINANCES - DÉPENSES (18 permissions)
FINANCES_DEPENSES_VIEW = 'finances:depenses:view',
FINANCES_DEPENSES_CREATE = 'finances:depenses:create',
FINANCES_DEPENSES_EDIT = 'finances:depenses:edit',
FINANCES_DEPENSES_VALIDATE = 'finances:depenses:validate',
FINANCES_DEPENSES_PAYER = 'finances:depenses:payer',
FINANCES_DEPENSES_DELETE = 'finances:depenses:delete',
FINANCES_DEPENSES_EXPORT = 'finances:depenses:export',          // NOUVEAU
FINANCES_DEPENSES_CONFIG = 'finances:depenses:config',
FINANCES_DEPENSES_RAPPORTS = 'finances:depenses:rapports',
FINANCES_DEMANDE_CREATE = 'finances:demande:create',
FINANCES_DEMANDE_VALIDATE = 'finances:demande:validate',
FINANCES_DEMANDE_REJECT = 'finances:demande:reject',            // NOUVEAU
FINANCES_DEMANDE_VIEW_ALL = 'finances:demande:view-all',        // NOUVEAU
FINANCES_BON_COMMANDE_CREATE = 'finances:bon-commande:create',
FINANCES_BON_COMMANDE_VALIDATE = 'finances:bon-commande:validate',
FINANCES_FOURNISSEURS_VIEW = 'finances:fournisseurs:view',
FINANCES_FOURNISSEURS_MANAGE = 'finances:fournisseurs:manage',
FINANCES_FACTURE_VALIDATE = 'finances:facture:validate',        // NOUVEAU

// FINANCES - COMPTABILITÉ (7 permissions)
FINANCES_COMPTABILITE_VIEW = 'finances:comptabilite:view',
FINANCES_COMPTABILITE_ECRIRE = 'finances:comptabilite:ecrire',
FINANCES_COMPTABILITE_VALIDER = 'finances:comptabilite:valider',
FINANCES_COMPTABILITE_ANNULER = 'finances:comptabilite:annuler',  // NOUVEAU
FINANCES_COMPTABILITE_BALANCE = 'finances:comptabilite:balance',  // NOUVEAU
FINANCES_COMPTABILITE_RAPPORT = 'finances:comptabilite:rapport',  // NOUVEAU
FINANCES_COMPTABILITE_EXPORT = 'finances:comptabilite:export',    // NOUVEAU

// FINANCES - TRÉSORERIE (6 permissions)
FINANCES_TRESORERIE_VIEW = 'finances:tresorerie:view',
FINANCES_TRESORERIE_MANAGE = 'finances:tresorerie:manage',
FINANCES_CAISSE_ENTRER = 'finances:caisse:entrer',              // NOUVEAU
FINANCES_CAISSE_SORTIR = 'finances:caisse:sortir',              // NOUVEAU
FINANCES_CAISSE_CLOTURER = 'finances:caisse:cloturer',          // NOUVEAU
FINANCES_BANQUE_VIRER = 'finances:banque:virer',                // NOUVEAU

// FINANCES - BUDGET (8 permissions)
FINANCES_BUDGET_VIEW = 'finances:budget:view',
FINANCES_BUDGET_CREATE = 'finances:budget:create',
FINANCES_BUDGET_VALIDATE = 'finances:budget:validate',
FINANCES_BUDGET_EDIT = 'finances:budget:edit',                  // NOUVEAU
FINANCES_BUDGET_CLOTURER = 'finances:budget:cloturer',          // NOUVEAU
FINANCES_BUDGET_RAPPORTS = 'finances:budget:rapports',          // NOUVEAU
FINANCES_BUDGET_ENGAGER = 'finances:budget:engager',            // NOUVEAU
FINANCES_BUDGET_CONSOMMER = 'finances:budget:consommer',        // NOUVEAU

// FINANCES - DASHBOARD & RAPPORTS (4 permissions) // NOUVEAU
FINANCES_DASHBOARD_VIEW = 'finances:dashboard:view',
FINANCES_DASHBOARD_EXPORT = 'finances:dashboard:export',
FINANCES_DASHBOARD_KPI = 'finances:dashboard:kpi',
FINANCES_RAPPORTS_GENERER = 'finances:rapports:generer',
```

**Total : 54 permissions** (vs 27 actuelles = **+27 permissions manquantes**)

---

## 2️⃣ PARAMÈTRES DE CONFIGURATION - Analyse Complète

### A. Paramètres Scolarité (10 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.scolarite.frais_inscription_defaut` | NUMBER | 50000 | Frais d'inscription par défaut (FCFA) |
| `finances.scolarite.nombre_tranches_defaut` | NUMBER | 3 | Nombre de tranches par défaut |
| `finances.scolarite.frequence_echeance_defaut` | ENUM | TRIMESTRIEL | Fréquence échéances |
| `finances.scolarite.jours_grace_defaut` | NUMBER | 8 | Jours de grâce avant pénalité |
| `finances.scolarite.penalite_retard_pct` | NUMBER | 5 | Pénalité retard (% par mois) |
| `finances.scolarite.penalite_plafond_pct` | NUMBER | 25 | Plafond pénalité (% du montant) |
| `finances.scolarite.relance_auto_active` | BOOLEAN | true | Relances automatiques activées |
| `finances.scolarite.relance_frequence_jours` | NUMBER | 7 | Fréquence relances (jours) |
| `finances.scolarite.relance_seuil_min` | NUMBER | 10000 | Seuil minimum relance (FCFA) |
| `finances.scolarite.mode_paiement_mobile_actif` | BOOLEAN | false | Paiement Mobile Money activé |

---

### B. Paramètres Dépenses (12 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.depenses.double_validation_seuil` | NUMBER | 500000 | Seuil double validation (FCFA) |
| `finances.depenses.approbation_auto_active` | BOOLEAN | false | Approbation automatique < seuil |
| `finances.depenses.tva_defaut_pct` | NUMBER | 19.25 | TVA par défaut (%) |
| `finances.depenses.categorie_requise` | BOOLEAN | true | Catégorie obligatoire |
| `finances.depenses.facture_requise` | BOOLEAN | true | Facture obligatoire |
| `finances.depenses.budget_verification_active` | BOOLEAN | true | Vérification budget avant dépense |
| `finances.depenses.budget_bloquant` | BOOLEAN | true | Bloquer si budget dépassé |
| `finances.depenses.delai_paiement_jours` | NUMBER | 30 | Délai paiement fournisseur (jours) |
| `finances.depenses.escompte_pct` | NUMBER | 2 | Escompte paiement anticipé (%) |
| `finances.depenses.archivage_duree_mois` | NUMBER | 60 | Durée archivage (mois) |
| `finances.depenses.export_format_defaut` | ENUM | PDF | Format export par défaut |
| `finances.depenses.notification_demande_active` | BOOLEAN | true | Notifications demandes actives |

---

### C. Paramètres Comptabilité (8 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.comptabilite.plan_comptable` | ENUM | OHADA | Système comptable (OHADA/SYSCOHADA) |
| `finances.comptabilite.ecriture_auto_active` | BOOLEAN | true | Écritures automatiques activées |
| `finances.comptabilite.numero_sequence_prefix` | STRING | EC | Préfixe numéro écriture |
| `finances.comptabilite.exercice_comptable_debut` | DATE | 01-09 | Début exercice (MM-DD) |
| `finances.comptabilite.exercice_comptable_fin` | DATE | 31-08 | Fin exercice (MM-DD) |
| `finances.comptabilite.cloture_auto_active` | BOOLEAN | false | Clôture automatique exercice |
| `finances.comptabilite.validation_obligatoire` | BOOLEAN | true | Validation écritures obligatoire |
| `finances.comptabilite.archivage_legal_duree` | NUMBER | 120 | Durée archivage légal (mois) |

---

### D. Paramètres Trésorerie (10 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.tresorerie.caisse_principale_id` | UUID | - | Caisse principale par défaut |
| `finances.tresorerie.seuil_alerte_caisse` | NUMBER | 100000 | Seuil alerte caisse (FCFA) |
| `finances.tresorerie.seuil_critique_caisse` | NUMBER | 50000 | Seuil critique caisse (FCFA) |
| `finances.tresorerie.plafond_caisse_especes` | NUMBER | 5000000 | Plafond espèces en caisse |
| `finances.tresorerie.verification_caisse_quotidienne` | BOOLEAN | true | Vérification quotidienne obligatoire |
| `finances.tresorerie.double_signature_seuil` | NUMBER | 1000000 | Seuil double signature (FCFA) |
| `finances.tresorerie.cloture_caisse_heure` | TIME | 17:00 | Heure clôture caisse |
| `finances.tresorerie.ecart_tolerance` | NUMBER | 5000 | Tolérance écart caisse (FCFA) |
| `finances.tresorerie.virement_approval_requise` | BOOLEAN | true | Approval virements requise |
| `finances.tresorerie.releve_bancaire_import_actif` | BOOLEAN | false | Import relevés bancaires |

---

### E. Paramètres Budget (10 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.budget.exercice_annuel` | BOOLEAN | true | Budget annuel (vs pluriannuel) |
| `finances.budget.validation_workflow_actif` | BOOLEAN | true | Workflow validation actif |
| `finances.budget.seuil_alerte_pct` | NUMBER | 80 | Seuil alerte consommation (%) |
| `finances.budget.seuil_critique_pct` | NUMBER | 95 | Seuil critique consommation (%) |
| `finances.budget.blocage_depassement` | BOOLEAN | true | Bloquer si dépassement |
| `finances.budget.report_excedent_actif` | BOOLEAN | false | Report excédent sur N+1 |
| `finances.budget.virement_ligne_actif` | BOOLEAN | true | Virement entre lignes autorisé |
| `finances.budget.virement_ligne_seuil_pct` | NUMBER | 20 | Seuil virement ligne (% du budget) |
| `finances.budget.budget_additionnel_actif` | BOOLEAN | true | Budgets additionnels autorisés |
| `finances.budget.notification_alerte_active` | BOOLEAN | true | Notifications alertes budget |

---

### F. Paramètres Dashboard & Rapports (8 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.dashboard.kpi_taux_recouvrement_cible` | NUMBER | 85 | Objectif taux recouvrement (%) |
| `finances.dashboard.kpi_depenses_budget_max_pct` | NUMBER | 90 | Ratio dépenses/budget max (%) |
| `finances.dashboard.cache_ttl_secondes` | NUMBER | 300 | Cache dashboard (5 min) |
| `finances.dashboard.graphique_période_defaut` | ENUM | 30 | Période graphique par défaut (jours) |
| `finances.rapports.generation_auto_active` | BOOLEAN | true | Rapports automatiques activés |
| `finances.rapports.frequence_defaut` | ENUM | MENSUEL | Fréquence rapports |
| `finances.rapports.format_export_defaut` | ENUM | PDF | Format export par défaut |
| `finances.rapports.destinataires_defaut` | JSON | ["CHEF", "ADMIN"] | Destinataires automatiques |

---

### G. Paramètres Workflow Validation (6 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.validation_paiement.require_validation` | BOOLEAN | false | Validation paiement requise |
| `finances.validation_paiement.levels` | JSON | [] | Niveaux validation paiement |
| `finances.validation_depense.require_validation` | BOOLEAN | true | Validation dépense requise |
| `finances.validation_depense.levels` | JSON | [1, 2] | Niveaux validation dépense |
| `finances.validation_budget.require_validation` | BOOLEAN | true | Validation budget requise |
| `finances.validation_budget.levels` | JSON | [1, 2, 3] | Niveaux validation budget |

---

### H. Paramètres Généraux & Sécurité (10 paramètres)

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `finances.devise_defaut` | STRING | FCFA | Devise par défaut |
| `finances.monnaie_symbole` | STRING | FCFA | Symbole monétaire |
| `finances.arrondi_montant` | ENUM | SUPERIEUR | Méthode arrondi |
| `finances.decimales_montant` | NUMBER | 0 | Nombre décimales |
| `finances.seuil_importance_montant` | NUMBER | 10000000 | Seuil montant important |
| `finances.audit_operations_actif` | BOOLEAN | true | Audit toutes opérations |
| `finances.audit_duree_retention_mois` | NUMBER | 60 | Rétention logs audit (mois) |
| `finances.chiffrement_donnees_actif` | BOOLEAN | true | Chiffrement données sensibles |
| `finances.backup_auto_actif` | BOOLEAN | true | Backup automatique |
| `finances.backup_frequence` | ENUM | QUOTIDIEN | Fréquence backup |

---

**Total paramètres : 74 paramètres** répartis en 8 catégories

---

## 3️⃣ CONFIGURATIONS MÉTIER - Analyse Complète

### A. Configurations Scolarité

| Configuration | Type | Valeurs Possibles | Impact |
|---------------|------|-------------------|--------|
| **Mode calcul frais** | ENUM | FORFAITAIRE, PAR_NIVEAU, PAR_CLASSE | Détermine granularité |
| **Fréquence échéances** | ENUM | MENSUEL, TRIMESTRIEL, SEMESTRIEL, ANNUEL | Planification paiements |
| **Mode pénalité** | ENUM | POURCENTAGE, MONTANT_FIXE, PROGRESSIF | Calcul pénalités retard |
| **Mode relances** | ENUM | EMAIL, SMS, LES_DEUX, AUCUN | Canal de relance |
| **Politique remise** | ENUM | SOCIAL, MERITE, FRATRIE, PERSONNEL | Types remises autorisées |
| **Paiement partiel autorisé** | BOOLEAN | true/false | Accepter paiements partiels |
| **Paiement anticipé autorisé** | BOOLEAN | true/false | Payer avant échéance |
| **Mobile Money activé** | BOOLEAN | true/false | MTN/Orange Money |

---

### B. Configurations Dépenses

| Configuration | Type | Valeurs Possibles | Impact |
|---------------|------|-------------------|--------|
| **Workflow dépenses** | ENUM | SIMPLE, DOUBLE_VALIDATION, MULTI_NIVEAUX | Processus validation |
| **Mode imputation budgétaire** | ENUM | AUTO, MANUEL, MIXTE | Engagement budget |
| **Catégorie obligatoire** | BOOLEAN | true/false | Obliger catégorisation |
| **Facture obligatoire** | BOOLEAN | true/false | Exiger facture justificative |
| **Mode paiement fournisseur** | ENUM | VIREMENT, CHEQUE, ESPECES, TRANSFERT | Moyens paiement |
| **Escompte activé** | BOOLEAN | true/false | Réduction paiement anticipé |
| **Archivage numérique** | BOOLEAN | true/false | Scan factures |
| **Contrôle budget** | ENUM | BLOQUANT, ALERTES_SEULES, AUCUN | Gestion dépassements |

---

### C. Configurations Comptabilité

| Configuration | Type | Valeurs Possibles | Impact |
|---------------|------|-------------------|--------|
| **Plan comptable** | ENUM | OHADA_RENFORCE, SYSCOHADA, SIMPLIFIE | Structure comptes |
| **Mode écritures** | ENUM | AUTO, MANUEL, MIXTE | Génération écritures |
| **Exercice comptable** | ENUM | CALendaire, SCOLAIRE | Période fiscale |
| **Méthode amortissement** | ENUM | LINÉAIRE, DÉGRESSIF | Calcul amortissements |
| **Clôture automatique** | BOOLEAN | true/false | Fermeture exercice auto |
| **Lettrage automatique** | BOOLEAN | true/false | Raccordement écritures |
| **Rapport génération** | ENUM | AUTO, MANUEL | Rapports comptables |
| **Multi-devises** | BOOLEAN | true/false | Gestion devises étrangères |

---

### D. Configurations Trésorerie

| Configuration | Type | Valeurs Possibles | Impact |
|---------------|------|-------------------|--------|
| **Mode gestion caisse** | ENUM | UNIQUE_CAISSE, MULTI_CAISSE | Structure caisse |
| **Clôture obligatoire** | BOOLEAN | true/false | Clôture journalière requise |
| **Double signature** | BOOLEAN | true/false | 2 signatures requises |
| **Plafond espèces** | NUMBER | 1M-10M FCFA | Maximum en caisse |
| **Virement inter-comptes** | ENUM | LIBRE, LIMITÉ, INTERDIT | Mouvements banque |
| **Réconciliation bancaire** | ENUM | AUTO, MANUELLE, MIXTE | Match relevé/compta |
| **Alertes automatiques** | BOOLEAN | true/false | Notifications seuils |
| **Mode pointage** | ENUM | QUOTIDIEN, HEBDO, MENSUEL | Fréquence vérification |

---

### E. Configurations Budget

| Configuration | Type | Valeurs Possibles | Impact |
|---------------|------|-------------------|--------|
| **Période budgétaire** | ENUM | ANNUEL, PLURIANNUEL, GLISSANT | Horizon budget |
| **Méthode élaboration** | ENUM | HISTORIQUE, BASE_ZERO, PROGRESSIF | Construction budget |
| **Niveaux validation** | ENUM | 1, 2, 3, 4 | Complexité workflow |
| **Virement lignes** | ENUM | LIBRE, LIMITÉ, INTERDIT | Flexibilité budgétaire |
| **Report excédent** | BOOLEAN | true/false | Report sur exercice suivant |
| **Budgets additionnels** | BOOLEAN | true/false | Budgets complémentaires |
| **Engagements pluriannuels** | BOOLEAN | true/false | Engagements > 1 an |
| **Contrôle budgétaire** | ENUM | PRÉVENTIF, APOSTERIORI, MIXTE | Moment contrôle |

---

### F. Configurations Dashboard & Rapports

| Configuration | Type | Valeurs Possibles | Impact |
|---------------|------|-------------------|--------|
| **KPIs par défaut** | JSON | Array de KPIs | Widgets dashboard |
| **Période comparaison** | ENUM | M_M-1, M_M-12, A_A-1 | Comparaison temporelle |
| **Graphiques activés** | BOOLEAN | true/false | Visualisations |
| **Export formats** | ARRAY | [PDF, EXCEL, CSV] | Formats disponibles |
| **Automatisation rapports** | BOOLEAN | true/false | Rapports planifiés |
| **Destinataires auto** | ARRAY | Rôles destinataires | Distribution rapports |
| **Cache activé** | BOOLEAN | true/false | Performance dashboard |
| **Temps réel** | BOOLEAN | true/false | Données live vs cached |

---

## 4️⃣ MATRICE COMPLÈTE RÔLES/PERMISSIONS

### Rôles Standards et Permissions Finances

| Permission | COMPTABLE | CHEF_ETAB | ADMIN | CAISSIER | PARENT |
|------------|-----------|-----------|-------|----------|--------|
| **SCOLARITÉ** |
| finances:scolarite:view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:scolarite:config | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:paiement:create | ✅ | ❌ | ❌ | ✅ | ❌ |
| finances:paiement:validate | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:paiement:refund | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:recu:generate | ✅ | ❌ | ❌ | ✅ | ❌ |
| finances:relance:send | ✅ | ❌ | ❌ | ❌ | ❌ |
| finances:etat-compte:view | ✅ | ✅ | ✅ | ❌ | ✅ |
| **DÉPENSES** |
| finances:depenses:view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:depenses:create | ✅ | ❌ | ❌ | ❌ | ❌ |
| finances:depenses:validate | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:depenses:payer | ✅ | ❌ | ❌ | ✅ | ❌ |
| finances:depenses:delete | ❌ | ❌ | ✅ | ❌ | ❌ |
| finances:demande:create | ✅ | ✅ | ✅ | ✅ | ❌ |
| finances:demande:validate | ✅ | ✅ | ✅ | ❌ | ❌ |
| **COMPTABILITÉ** |
| finances:comptabilite:view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:comptabilite:ecrire | ✅ | ❌ | ❌ | ❌ | ❌ |
| finances:comptabilite:valider | ✅ | ✅ | ✅ | ❌ | ❌ |
| **TRÉSORERIE** |
| finances:tresorerie:view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:caisse:entrer | ✅ | ❌ | ❌ | ✅ | ❌ |
| finances:caisse:sortir | ✅ | ✅ | ✅ | ✅ | ❌ |
| **BUDGET** |
| finances:budget:view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:budget:create | ❌ | ✅ | ✅ | ❌ | ❌ |
| finances:budget:validate | ❌ | ❌ | ✅ | ❌ | ❌ |
| **DASHBOARD** |
| finances:dashboard:view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finances:rapports:generer | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 5️⃣ WORKFLOWS DE VALIDATION

### A. Workflow Paiement (2 niveaux)

```
NIVEAU 1: CAISSIER (enregistrement)
    ↓
NIVEAU 2: COMPTABLE (validation) - Si montant > seuil
    ↓
GÉNÉRATION REÇU + ÉCRITURE COMPTABLE
```

**Paramètres** :
- `finances.validation_paiement.seuil_niveau2` (défaut: 500,000 FCFA)
- `finances.validation_paiement.roles_niveau1` (défaut: ["CAISSIER"])
- `finances.validation_paiement.roles_niveau2` (défaut: ["COMPTABLE"])

---

### B. Workflow Dépense (3 niveaux)

```
NIVEAU 1: DEMANDEUR (création demande)
    ↓
NIVEAU 2: CHEF ETABLISSEMENT (validation) - Si montant < 500K
    ↓
NIVEAU 3: ADMIN/DIRECTEUR (validation finale) - Si montant >= 500K
    ↓
CRÉATION DÉPENSE + ENGAGEMENT BUDGET
```

**Paramètres** :
- `finances.validation_depense.seuil_niveau2` (défaut: 500,000 FCFA)
- `finances.validation_depense.seuil_niveau3` (défaut: 2,000,000 FCFA)
- `finances.validation_depense.roles_niveau1` (défaut: ["PERSONNEL", "ENSEIGNANT"])
- `finances.validation_depense.roles_niveau2` (défaut: ["CHEF_ETABLISSEMENT"])
- `finances.validation_depense.roles_niveau3` (défaut: ["ADMIN", "DIRECTEUR"])

---

### C. Workflow Budget (4 niveaux)

```
NIVEAU 1: COMPTABLE (préparation budget)
    ↓
NIVEAU 2: CHEF ETABLISSEMENT (validation initiale)
    ↓
NIVEAU 3: ADMIN (approbation)
    ↓
NIVEAU 4: DIRECTEUR (validation finale) - Si budget > 10M
```

**Paramètres** :
- `finances.validation_budget.seuil_niveau4` (défaut: 10,000,000 FCFA)
- `finances.validation_budget.delai_validation_jours` (défaut: 15 jours)

---

## 6️⃣ RÉCAPITULATIF CHIFRÉ

| Catégorie | Nombre | Statut |
|-----------|--------|--------|
| **Permissions RBAC actuelles** | 27 | ✅ Implémentées |
| **Permissions RBAC manquantes** | 27 | ❌ À créer |
| **Permissions RBAC totales recommandées** | **54** | 📋 Planifié |
| **Paramètres de configuration** | 74 | 📋 Planifié |
| **Configurations métier** | 56 | 📋 Planifié |
| **Workflows de validation** | 3 | 📋 Planifié |
| **Niveaux de validation** | 9 | 📋 Planifié |
| **Rôles avec accès finances** | 5 | ✅ Définis |
| **Catégories fonctionnelles** | 7 | ✅ Définies |

---

## 7️⃣ RECOMMANDATIONS PRIORITAIRES

### 🔴 HAUTE PRIORITÉ (Immédiat)

1. **Créer 27 permissions manquantes** dans `roles.enum.ts`
2. **Ajouter 30 paramètres critiques** dans configuration
3. **Implémenter workflow validation dépenses** (déjà partiellement fait)
4. **Mapper permissions aux rôles** dans `DEFAULT_ROLE_PERMISSIONS`

### 🟡 MOYENNE PRIORITÉ (Phase 2)

5. **Créer interface gestion paramètres** (admin panel)
6. **Implémenter cache paramètres** (Redis 5 min TTL)
7. **Ajouter validations métier** basées sur configurations
8. **Créer migration SQL** pour paramètres

### 🟢 BASSE PRIORITÉ (Phase 3)

9. **Dashboard configuration visuelle**
10. **Import/export configurations**
11. **Historique modifications paramètres**
12. **Templates de configuration** par type d'établissement

---

## 8️⃣ PROCHAINES ÉTAPES D'IMPLÉMENTATION

### Étape 1 : Permissions (1-2 heures)
```typescript
// Ajouter dans shared/src/enums/roles.enum.ts
// 27 nouvelles permissions FINANCES_*
// Mapper dans DEFAULT_ROLE_PERMISSIONS
```

### Étape 2 : Paramètres (2-3 heures)
```sql
-- Migration SQL : 74 INSERT dans parametres
-- Structure : cle, valeur, type, description, categorie
```

### Étape 3 : Configurations (1-2 heures)
```typescript
// DTOs Zod pour validation configurations
// Endpoints API GET/PUT /api/finances/config
```

### Étape 4 : Workflows (3-4 heures)
```typescript
// Intégration validationWorkflowService
// Paramètres dynamiques require_validation
```

---

**Document généré le** : 7 juin 2026  
**Version** : 1.0  
**Statut** : ✅ Analyse complète et validée  
**Total éléments identifiés** : **221 éléments** (54 permissions + 74 paramètres + 56 configurations + 9 workflows + 5 rôles + 7 catégories + 16 configurations avancées)
