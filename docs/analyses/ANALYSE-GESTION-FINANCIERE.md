# Analyse Complète - Gestion Financière eLISAschool

## 📊 État des Lieux

### ✅ Ce qui existe actuellement

#### 1. **Gestion partielle dans modules existants**

**Module Cantine** (`backend/src/modules/cantine/`)
- ✅ Solde comptable par élève (`InscriptionCantine.solde`)
- ✅ Rechargement de solde (`rechargerSolde()`)
- ✅ Débit automatique lors des consommations
- ✅ Limite de dette configurable (`cantine.max_debt`)
- ✅ Rappels de paiement automatisés (cron job)
- ✅ Notifications de rechargement aux parents
- ❌ Pas d'historique des transactions (pas de journal comptable)
- ❌ Pas de reçus/factures
- ❌ Pas de rapport financier
- ❌ Pas d'intégration moyens de paiement réels

**Module Transport** (`backend/src/modules/transport/`)
- ✅ Tarif par ligne (`LigneTransport.tarif`)
- ✅ Solde payé partiel (`InscriptionTransport.soldePaye`)
- ❌ Pas de logique de paiement complète
- ❌ Pas de suivi des échéances
- ❌ Pas de relances automatiques

**Module Clubs** (`backend/src/modules/clubs/`)
- ✅ Budget par club (`Club.budget`)
- ❌ Pas de suivi des dépenses
- ❌ Pas de justification des dépenses
- ❌ Pas de rapport budgétaire

#### 2. **Infrastructure préparée (non utilisée)**

**Enums partagés** (`shared/src/enums/statuts.enum.ts`)
```typescript
TypePaiement = { SCOLARITE, CANTINE, TRANSPORT, CLUB, AUTRE }
StatutPaiement = { EN_ATTENTE, PAYE, PARTIELLEMENT_PAYE, ANNULE, REMBOURSE }
TypeDocument = { FACTURE, RECU }
```
⚠️ **Ces enums existent mais aucun module ne les utilise !**

**Rôle COMPTABLE** (`shared/src/enums/roles.enum.ts`)
- ✅ Rôle `COMPTABLE` défini (ligne 151)
- ❌ Aucune permission financière associée
- ❌ Pas de mapping dans `DEFAULT_ROLE_PERMISSIONS`

**Audit Log** (`backend/src/modules/auth/entities/audit-log.entity.ts`)
- ✅ EventType.PAYMENT_RECEIVE défini
- ❌ Jamais utilisé dans le code

---

### ❌ Ce qui manque COMPLÈTEMENT

#### **AUCUN module dédié pour :**

1. **Paiement de Scolarité** (CRITIQUE)
   - ❌ Frais d'inscription
   - ❌ Frais de scolarité annuels/mensuels
   - ❌ Tranches de paiement (échéancier)
   - ❌ Suivi des paiements par élève
   - ❌ Historique complet des transactions
   - ❌ État des impayés
   - ❌ Relances automatiques
   - ❌ Reçus de paiement
   - ❌ Remises/rabais (bourses, fratrie, etc.)
   - ❌ Pénalités de retard

2. **Comptabilité Générale**
   - ❌ Plan comptable
   - ❌ Journal comptable (écritures)
   - ❌ Grand livre
   - ❌ Balance générale
   - ❌ Bilan financier
   - ❌ Compte de résultat
   - ❌ Écritures de régularisation
   - ❌ Amortissements
   - ❌ Provisions

3. **Trésorerie**
   - ❌ Caisse (espèces)
   - ❌ Banque (comptes bancaires)
   - ❌ Mouvements de caisse
   - ❌ Réconciliations bancaires
   - ❌ État de caisse quotidien
   - ❌ Rapports de trésorerie

4. **Budget**
   - ❌ Budget prévisionnel annuel
   - ❌ Budget par département/service
   - ❌ Suivi budgétaire (prévu vs réalisé)
   - ❌ Alertes de dépassement
   - ❌ Reports budgétaires

5. **Rapports Financiers**
   - ❌ État de compte par élève
   - ❌ État des recettes journalières
   - ❌ État des recettes mensuelles
   - ❌ Balance âgée (impayés par ancienneté)
   - ❌ Tableau de bord financier
   - ❌ Export comptable (formats standards)

6. **Intégrations de Paiement**
   - ❌ Mobile Money (MTN, Orange - essentiel en Afrique)
   - ❌ Paiement en ligne (Stripe, PayPal)
   - ❌ Virement bancaire
   - ❌ Espèces (gestion caisse)
   - ❌ Chèques
   - ❌ Agrégateurs de paiement africains (CinetPay, PayDunya, etc.)

7. **Sécurité & Conformité**
   - ❌ Audit trail financier (traçabilité complète)
   - ❡ Séparation des tâches (maker/checker)
   - ❡ Double validation pour les gros montants
   - ❡ Verrouillage des périodes comptables
   - ❡ Archivage légal des documents

---

## 🎯 Recommandation : Module Finance Complet

### Architecture Proposée

```
backend/src/modules/finances/
├── controllers/
│   ├── finances.controller.ts         # Router principal
│   └── index.ts
├── services/
│   ├── scolarite.service.ts           # Gestion paiements scolarité
│   ├── comptabilite.service.ts        # Comptabilité générale
│   ├── tresorerie.service.ts          # Gestion caisse/banque
│   ├── budget.service.ts              # Budget prévisionnel
│   ├── rapports-financiers.service.ts # Rapports & exports
│   ├── paiement-gateway.service.ts    # Intégration moyens de paiement
│   └── index.ts
├── entities/
│   ├── frais-scolarite.entity.ts      # Configuration frais par classe/niveau
│   ├── echeancier.entity.ts           # Échéancier de paiement
│   ├── paiement.entity.ts             # Transactions de paiement
│   ├── recu-paiement.entity.ts        # Reçus générés
│   ├── ecriture-comptable.entity.ts   # Écritures comptables
│   ├── plan-comptable.entity.ts       # Plan comptable
│   ├── compte-caisse.entity.ts        # Caisse
│   ├── compte-bancaire.entity.ts      # Comptes bancaires
│   ├── mouvement-caisse.entity.ts     # Mouvements de caisse
│   ├── budget.entity.ts               # Budgets
│   ├── ligne-budget.entity.ts         # Lignes budgétaires
│   ├── relance-paiement.entity.ts     # Relances impayés
│   ├── remise.entity.ts               # Remises/rabais
│   └── index.ts
├── dto/
│   ├── scolarite.dto.ts
│   ├── paiement.dto.ts
│   ├── comptabilite.dto.ts
│   ├── tresorerie.dto.ts
│   ├── budget.dto.ts
│   └── index.ts
├── gateways/
│   ├── mobile-money.gateway.ts        # MTN/Orange Money
│   ├── stripe.gateway.ts              # Paiement carte
│   ├── cinetpay.gateway.ts            # Agrégateur Afrique
│   └── index.ts
└── index.ts
```

---

## 📋 Entités Clés Détaillées

### 1. **FraisScolarite** - Configuration des frais
```typescript
@Entity('frais_scolarite')
export class FraisScolarite {
    id: string;                    // UUID
    etablissementId: string;       // Multi-tenant
    anneeScolaireId: string;       // Année concernée
    niveauId: string;              // Niveau (6ème, 5ème, etc.)
    classeId?: string;             // Classe spécifique (optionnel)
    
    fraisInscription: number;      // Frais d'inscription
    fraisScolariteAnnuel: number;  // Total annuel
    fraisCantineOptionnel?: number;// Cantine (si inclus)
    fraisTransportOptionnel?: number; // Transport (si inclus)
    autresFrais?: number;          // Autres frais
    
    nombreTranches: number;        // Nombre de tranches (ex: 3, 6, 10)
    datePremiereEcheance: Date;    // Date 1er paiement
    frequenceEcheance: string;     // 'mensuel', 'trimestriel', etc.
    
    penaliteRetard: number;        // % ou montant fixe
    joursGrace: number;            // Jours avant pénalité
    
    remisesPossibles: boolean;     // Autoriser remises?
}
```

### 2. **Echeancier** - Plan de paiement par élève
```typescript
@Entity('echeanciers_paiement')
export class Echeancier {
    id: string;
    eleveId: string;
    fraisScolariteId: string;
    
    numeroTranche: number;         // 1, 2, 3...
    montantAttendu: number;
    dateEcheance: Date;
    
    montantPaye: number;           // Cumul des paiements
    statut: StatutPaiement;        // EN_ATTENTE, PAYE, PARTIEL, EN_RETARD
    
    datePaiementReel?: Date;       // Quand payé
    penaliteAppliquee?: number;    // Pénalité si retard
    
    etablissementId: string;
}
```

### 3. **Paiement** - Transaction unitaire
```typescript
@Entity('paiements')
export class Paiement {
    id: string;
    eleveId: string;
    echeancierId?: string;         // Lié à quelle tranche?
    
    montant: number;
    montantPenalite?: number;
    montantTotal: number;          // montant + pénalité
    
    typePaiement: TypePaiement;    // SCOLARITE, CANTINE, TRANSPORT
    methodePaiement: string;       // ESPECES, MOBILE_MONEY, CARTE, VIREMENT, CHEQUE
    
    referenceTransaction?: string; // Ref opérateur (Mobile Money, etc.)
    numeroRecu: string;            # Reçu généré (REC-2026-00123)
    
    datePaiement: Date;
    statut: StatutPaiement;
    
    effectuePar: string;           // Utilisateur qui a enregistré
    validePar?: string;            // Double validation si montant > seuil
    
    observations?: string;
    etablissementId: string;
    
    // Audit
    createdAt: Date;
}
```

### 4. **RecuPaiement** - Reçu officiel
```typescript
@Entity('recus_paiement')
export class RecuPaiement {
    id: string;
    paiementId: string;
    
    numeroRecu: string;            // REC-2026-00123
    dateEmission: Date;
    
    eleveNom: string;              // Snapshot au moment du paiement
    eleveMatricule: string;
    classeNom: string;
    
    montant: number;
    methodePaiement: string;
    objet: string;                 // "Paiement tranche 3/10 - Scolarité 2025-2026"
    
    genererPar: string;            // Utilisateur
    signatureNumerique?: string;   // Hash pour vérification
    
    pdfPath?: string;              // Chemin du PDF généré
    envoyeParEmail?: boolean;
    
    etablissementId: string;
}
```

### 5. **EcritureComptable** - Journal comptable
```typescript
@Entity('ecritures_comptables')
export class EcritureComptable {
    id: string;
    
    numeroPiece: string;           // EC-2026-00001
    dateEcriture: Date;
    dateValidation?: Date;
    
    compteDebit: string;           // N° compte (ex: 531000 - Caisse)
    compteCredit: string;          // N° compte (ex: 706000 - Produits scolarité)
    
    libelle: string;               // Description
    montant: number;
    
    paiementId?: string;           // Lien avec paiement (si applicable)
    justificatif?: string;         // Chemin document justificatif
    
    validePar: string;             // Comptable qui a validé
    statut: 'BROUILLON' | 'VALIDEE' | 'ANNULEE';
    
    exerciceComptable: number;     // 2026
    periodeComptable: number;      // 1-12 (mois)
    
    etablissementId: string;
}
```

### 6. **MouvementCaisse** - Gestion de caisse
```typescript
@Entity('mouvements_caisse')
export class MouvementCaisse {
    id: string;
    compteCaisseId: string;
    
    type: 'ENTREE' | 'SORTIE';
    montant: number;
    
    motif: string;                 // "Paiement scolarité élève X", "Achat fournitures"
    
    paiementId?: string;           // Si lié à un paiement
    ecritureComptableId?: string;  // Double écriture auto
    
    effectuePar: string;
    validePar?: string;            // Si montant > seuil
    
    dateMouvement: Date;
    soldeApresMouvement: number;   // Solde calculé
    
    etablissementId: string;
}
```

### 7. **RelancePaiement** - Gestion impayés
```typescript
@Entity('relances_paiement')
export class RelancePaiement {
    id: string;
    eleveId: string;
    echeancierId: string;
    
    numeroRelance: number;         // 1, 2, 3...
    dateRelance: Date;
    
    typeRelance: 'SMS' | 'EMAIL' | 'LETTER' | 'PHONE';
    statut: 'ENVOYEE' | 'LUE' | 'IGNOREE' | 'PAYE_APRES';
    
    message: string;               // Contenu envoyé
    reponse?: string;              // Réponse du parent
    
    effectuePar: string;           // Automatique ou manuel
    
    etablissementId: string;
}
```

---

## 🔄 Flux de Données Critiques

### Flux 1: Paiement Scolarité
```
1. Configuration (Admin)
   → Créer FraisScolarite pour année/niveau
   → Définir nombre tranches et dates

2. Génération écheancier (Automatique à l'inscription)
   → Créer Echeancier pour chaque élève inscrit
   → Calculer montants par tranche

3. Paiement (Parent/Comptable)
   → Enregistrer Paiement
   → Mettre à jour Echeancier.soldePaye
   → Générer RecuPaiement
   → Créer EcritureComptable (double écriture)
   → Si espèces → Créer MouvementCaisse
   → Envoyer notification confirmation

4. Suivi (Automatique - Cron quotidien)
   → Détecter échéances en retard
   → Créer RelancePaiement
   → Appliquer pénalités si configuré
   → Envoyer notifications relance
```

### Flux 2: Comptabilité
```
1. Enregistrement automatique
   → Chaque paiement génère une écriture comptable
   → Débit: Caisse/Banque (531/512)
   → Crédit: Produits scolarité (706)

2. Validation (Comptable)
   → Vérifier écritures brouillon
   → Valider ou rejeter
   → Verrouiller période comptable

3. Rapports (Automatique)
   → Balance générale (tous comptes)
   → Grand livre (par compte)
   → Bilan (actif/passif)
   → Compte de résultat (produits/charges)
```

### Flux 3: Budget
```
1. Planification (Direction)
   → Créer Budget annuel
   → Définir lignes budgétaires par service
   → Allouer montants

2. Suivi (Automatique)
   → Comparer dépenses réelles vs budget
   → Alertes si dépassement > 80%
   → Rapports mensuels

3. Ajustement
   → Virements budgétaires
   → Reports d'exercice
```

---

## 🔐 Sécurité & Conformité

### 1. **Permissions à ajouter** (roles.enum.ts)
```typescript
// Finances - Scolarité
FINANCES_SCOLARITE_VIEW = 'finances:scolarite:view',
FINANCES_SCOLARITE_CONFIG = 'finances:scolarite:config',
FINANCES_PAIEMENT_CREATE = 'finances:paiement:create',
FINANCES_PAIEMENT_EDIT = 'finances:paiement:edit',
FINANCES_PAIEMENT_DELETE = 'finances:paiement:delete',
FINANCES_PAIEMENT_VALIDATE = 'finances:paiement:validate',
FINANCES_RECU_GENERATE = 'finances:recu:generate',
FINANCES_RELANCE_SEND = 'finances:relance:send',
FINANCES_ETAT_COMPTE_VIEW = 'finances:etat-compte:view',

// Finances - Comptabilité
FINANCES_COMPTA_VIEW = 'finances:compta:view',
FINANCES_ECRITURE_CREATE = 'finances:ecriture:create',
FINANCES_ECRITURE_VALIDATE = 'finances:ecriture:validate',
FINANCES_ECRITURE_DELETE = 'finances:ecriture:delete',
FINANCES_BALANCE_VIEW = 'finances:balance:view',
FINANCES_GRAND_LIVRE_VIEW = 'finances:grand-livre:view',
FINANCES_BILAN_VIEW = 'finances:bilan:view',
FINANCES_PERIODE_CLOTURER = 'finances:periode:cloturer',
FINANCES_EXERCICE_CLOTURER = 'finances:exercice:cloturer',

// Finances - Trésorerie
FINANCES_CAISSE_VIEW = 'finances:caisse:view',
FINANCES_CAISSE_ENTRER = 'finances:caisse:entrer',
FINANCES_CAISSE_SORTIR = 'finances:caisse:sortir',
FINANCES_BANQUE_VIEW = 'finances:banque:view',
FINANCES_RECONCILIATION = 'finances:reconciliation:faire',
FINANCES_ETAT_CAISSE = 'finances:etat-caisse:view',

// Finances - Budget
FINANCES_BUDGET_VIEW = 'finances:budget:view',
FINANCES_BUDGET_CREATE = 'finances:budget:create',
FINANCES_BUDGET_EDIT = 'finances:budget:edit',
FINANCES_BUDGET_VALIDATE = 'finances:budget:validate',
FINANCES_RAPPORT_BUDGETAIRE = 'finances:rapport-budgetaire:view',

// Finances - Rapports & Exports
FINANCES_RAPPORTS_VIEW = 'finances:rapports:view',
FINANCES_EXPORT_COMPTA = 'finances:export:comptabilite',
FINANCES_EXPORT_ETAT_COMPTE = 'finances:export:etat-compte',
FINANCES_TABLEAU_BORD = 'finances:tableau-bord:view',
```

### 2. **Rôles avec accès finances**
```typescript
[Role.COMPTABLE]: [
    Permission.FINANCES_SCOLARITE_VIEW,
    Permission.FINANCES_PAIEMENT_CREATE,
    Permission.FINANCES_PAIEMENT_VALIDATE,
    Permission.FINANCES_RECU_GENERATE,
    Permission.FINANCES_COMPTA_VIEW,
    Permission.FINANCES_ECRITURE_CREATE,
    Permission.FINANCES_ECRITURE_VALIDATE,
    Permission.FINANCES_BALANCE_VIEW,
    Permission.FINANCES_GRAND_LIVRE_VIEW,
    Permission.FINANCES_CAISSE_VIEW,
    Permission.FINANCES_CAISSE_ENTRER,
    Permission.FINANCES_CAISSE_SORTIR,
    Permission.FINANCES_BANQUE_VIEW,
    Permission.FINANCES_RAPPORTS_VIEW,
    Permission.FINANCES_EXPORT_COMPTA,
    Permission.FINANCES_TABLEAU_BORD,
],

[Role.ADMIN]: [
    // Toutes permissions comptable +
    Permission.FINANCES_SCOLARITE_CONFIG,
    Permission.FINANCES_BUDGET_VIEW,
    Permission.FINANCES_BUDGET_VALIDATE,
    Permission.FINANCES_PERIODE_CLOTURER,
    Permission.FINANCES_EXERCICE_CLOTURER,
],
```

### 3. **Règles de sécurité**
- ✅ **Double validation** pour paiements > seuil configurable (ex: 500 000 FCFA)
- ✅ **Verrouillage périodes** : impossible de modifier une période clôturée
- ✅ **Audit trail** : toute opération financière tracée (qui, quand, quoi)
- ✅ **Séparation tâches** : celui qui encaisse ≠ celui qui valide
- ✅ **Numérotation continue** : reçus et écritures numérotés sans trou
- ✅ **Chiffrement** : données sensibles chiffrées en base
- ✅ **Backup** : backup quotidien des données financières

---

## 💳 Intégrations de Paiement (Afrique)

### Priorité 1: Mobile Money (INDISPENSABLE)
- **MTN Mobile Money** (Cameroun, Côte d'Ivoire, etc.)
- **Orange Money** (Cameroun, Sénégal, etc.)
- **Moov Money** (Bénin, Togo, etc.)

### Priorité 2: Agrégateurs
- **CinetPay** (couverture Afrique francophone)
- **PayDunya** (Sénégal, Afrique de l'Ouest)
- **KKiaPay** (Bénin, Togo)
- **Fedapay** (Bénin)

### Priorité 3: International
- **Stripe** (cartes bancaires)
- **PayPal** (si clients internationaux)
- **Flutterwave** (Afrique anglophone)

---

## 📊 Rapports Financiers Essentiels

### 1. **Tableau de bord financier** (Dashboard widget)
```typescript
// Recettes du jour
recettesJour: number;
nombrePaiementsJour: number;

// Recettes du mois
recettesMois: number;
objectifMois: number;  // Si budget défini
pourcentageAtteint: number;

// Impayés
totalImpayes: number;
nombreElevesImpayes: number;
balanceAgee: {
    moins30jours: number;
    30a60jours: number;
    60a90jours: number;
    plus90jours: number;
};

// Trésorerie
soldeCaisse: number;
soldeBanque: number;
totalDisponible: number;
```

### 2. **État de compte élève**
- Liste complète des échéances
- Paiements effectués (avec reçus)
- Solde restant dû
- Historique des relances
- Prochaines échéances

### 3. **Balance âgée**
- Regroupe les impayés par ancienneté
- Permet d'identifier les créances douteuses
- Essentiel pour la relance ciblée

### 4. **Rapport de caisse**
- Ouverture de caisse (solde initial)
- Entrées détaillées (par type)
- Sorties détaillées (par type)
- Solde théorique vs réel
- Écarts (siany)

---

## 🎯 Plan d'Implémentation Recommandé

### Phase 1: Fondations (2-3 semaines)
1. ✅ Créer structure du module `finances/`
2. ✅ Entités de base : `FraisScolarite`, `Echeancier`, `Paiement`, `RecuPaiement`
3. ✅ Service `scolarite.service.ts` (CRUD + logique métier)
4. ✅ Controller avec routes protégées
5. ✅ Permissions et rôles
6. ✅ Tests unitaires de base

### Phase 2: Comptabilité & Trésorerie (2-3 semaines)
1. ✅ Entités comptables : `PlanComptable`, `EcritureComptable`
2. ✅ Entités trésorerie : `CompteCaisse`, `MouvementCaisse`
3. ✅ Génération automatique d'écritures comptables
4. ✅ Gestion de caisse (entrées/sorties)
5. ✅ Rapports de base (balance, grand livre)

### Phase 3: Automatisation & Notifications (1-2 semaines)
1. ✅ Cron jobs : détection impayés, relances automatiques
2. ✅ Notifications (SMS, email) pour paiements et relances
3. ✅ Calcul automatique des pénalités
4. ✅ Génération PDF des reçus

### Phase 4: Intégrations Paiement (2-3 semaines)
1. ✅ Gateway Mobile Money (MTN, Orange)
2. ✅ Gateway CinetPay ou similaire
3. ✅ Webhooks pour confirmations de paiement
4. ✅ Réconciliation automatique

### Phase 5: Budget & Rapports Avancés (2 semaines)
1. ✅ Module budget (planification, suivi)
2. ✅ Rapports financiers avancés (bilan, compte de résultat)
3. ✅ Tableau de bord financier complet
4. ✅ Exports comptables (formats standards)

### Phase 6: Sécurité & Conformité (1 semaine)
1. ✅ Double validation pour gros montants
2. ✅ Verrouillage périodes comptables
3. ✅ Audit trail complet
4. ✅ Tests de sécurité
5. ✅ Documentation utilisateur

---

## 📚 Meilleures Pratiques - Système Éducatif Africain

### Spécificités Cameroun/Afrique francophone

1. **Devise** : FCFA (XOF/XAF) - gestion multi-devises si nécessaire
2. **Année scolaire** : Septembre → Juin (10 mois)
3. **Tranches typiques** :
   - Inscription (Septembre) : 30-40%
   - 2-3 tranches restantes : Octobre, Novembre, Décembre
   - OU 10 mensualités de Septembre à Juin
4. **Pénalités** : 5-10% après 15 jours de retard (configurable)
5. **Remises fréquentes** :
   - Fratrie (2ème enfant : -10%, 3ème : -20%)
   - Bourses (sur critères sociaux)
   - Personnel de l'établissement (gratuit ou -50%)
   - Paiement anticipé (-5% si payé avant Septembre)
6. **Mobile Money** : 70-80% des paiements en Afrique
7. **Reçus papier** : Encore très demandés (obligation légale)
8. **Double écriture** : Exigée pour établissements privés sous contrat

### Conformité légale (Cameroun)
- ✅ Conservation des documents : 10 ans minimum
- ✅ Reçus numérotés et datés
- ✅ Journal comptable obligatoire
- ✅ Bilan annuel certifié
- ✅ Déclarations fiscales (TVA, impôts)
- ✅ Audit externe si > seuil de revenus

---

## 📈 Impact sur l'Architecture Existante

### Dépendances avec modules actuels

```
finances/
├── → eleves/          # Eleve pour qui on paie
├── → annees-scolaires/# Année scolaire concernée
├── ├── classes/        # Classe de l'élève
├── ├── niveaux/        # Niveau (tarification par niveau)
├── ├── etablissement/  # Multi-tenant
├── ├── utilisateurs/   # Qui effectue le paiement
├── ├── notifications/  # Envoyer confirmations/relances
├── ├── dashboard/      # Widgets financiers
├── └── auth/           # Audit trail, permissions
```

### Modifications à apporter aux modules existants

1. **eleves.entity.ts** : Ajouter lien vers `Echeancier` (optionnel)
2. **cantine/** : Migrer vers module finances (unifier la logique)
3. **transport/** : Migrer vers module finances (unifier la logique)
4. **clubs.entity.ts** : Intégrer gestion budgétaire dans finances
5. **dashboard/** : Ajouter widgets financiers
6. **notifications/** : Ajouter templates financiers

---

## ⚠️ Points de Vigilance

### Techniques
- ⚠️ **Transactions ACID** : Critique pour les paiements (jamais de demi-mesure)
- ⚠️ **Concurrence** : Deux paiements simultanés pour même élève
- ⚠️ **Numérotation** : Garantir l'unicité et la continuité des reçus
- ⚠️ **Performance** : Requêtes financières sur gros volumes (indexation)
- ⚠️ **Backup** : Backup fréquent (toutes les 6h) des données financières

### Métier
- ⚠️ **Arrondis** : Gérer correctement les centimes (FCFA pas de décimales)
- ⚠️ **Devises** : Si multi-devises, gérer taux de change
- ⚠️ **Fiscalité** : TVA sur scolarité? (dépend pays/statut)
- ⚠️ **Bourses** : Gestion complexe (subventions État, internes)
- ⚠️ **Radiations** : Que faire des impayés si élève radié?

---

## 🚀 Prochaines Étapes

### Immédiat (cette semaine)
1. Valider cette analyse avec l'équipe
2. Prioriser les phases d'implémentation
3. Définir le budget/temps alloué
4. Identifier les intégrations de paiement prioritaires

### Court terme (1-2 semaines)
1. Créer le module `finances/` avec entités de base
2. Implémenter le flux de paiement de scolarité complet
3. Ajouter les permissions et rôles
4. Tests unitaires et integration

### Moyen terme (1 mois)
1. Comptabilité & trésorerie
2. Automatisation des relances
3. Rapports de base
4. Intégration Mobile Money

### Long terme (2-3 mois)
1. Module budget complet
2. Rapports avancés & exports
3. Toutes intégrations de paiement
4. Conformité légale complète

---

## 📞 Questions à Valider

1. **Priorité** : Commencer par scolarité ou inclure directement cantine/transport?
2. **Intégrations paiement** : Quels opérateurs Mobile Money en priorité?
3. **Comptabilité** : Établissement privé ou sous contrat? (règles différentes)
4. **Multi-devises** : Uniquement FCFA ou autres devises?
5. **Bourses** : Gestion des bourses incluse dans la phase 1?
6. **Pénalités** : Appliquer dès la phase 1 ou plus tard?
7. **Reçus** : PDF uniquement ou aussi SMS de confirmation?
8. **Budget** : Priorité haute ou peut attendre?
9. **Conformité** : Besoin de conformité OHADA (comptabilité africaine)?
10. **Dashboard** : Widgets financiers dans dashboard existant ou page dédiée?

---

## ✅ Conclusion

**État actuel** : eLISAschool dispose d'une **infrastructure préparée** (enums, rôles) mais **AUCUNE implémentation réelle** de gestion financière. Les modules cantine et transport ont une logique de solde basique mais incomplète.

**Besoin** : Un module `finances/` complet est **INDISPENSABLE** pour :
- ✅ Gérer les paiements de scolarité (revenu principal des écoles)
- ✅ Assurer la traçabilité comptable (obligation légale)
- ✅ Suivre la trésorerie (santé financière de l'établissement)
- ✅ Automatiser les relances (réduire les impayés)
- ✅ Produire des rapports (décision, conformité)

**Faisabilité** : L'architecture modulaire existante et les patterns établis permettent une implémentation rapide et cohérente avec le reste du système.

**Recommandation** : Commencer par la **Phase 1 (Scolarité)** puis itérer rapidement vers comptabilité et trésorerie.

---

**Document créé le** : 2026-06-07  
**Version** : 1.0  
**Auteur** : Analyse IA eLISAschool
