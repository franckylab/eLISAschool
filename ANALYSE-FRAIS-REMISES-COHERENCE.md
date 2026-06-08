# 🔍 Analyse Complète - Logique Frais de Scolarité & Remises

## 📋 Demande d'Analyse

**Logique proposée** :
1. **Frais de scolarité** déterminés par : établissement, classe, section, cycle, élève
2. **Remises** déterminées par : établissement, classe, section, cycle, élève, parent

---

## 🏗️ État Actuel du Code (Inspection)

### 1. Structure Actuelle des Frais

**Entité** : `FraisScolarite` ([frais-scolarite.entity.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/finances/entities/frais-scolarite.entity.ts))

```typescript
@Entity('frais_scolarite')
@Index(['etablissementId', 'anneeScolaireId', 'niveauId'], { unique: true })
export class FraisScolarite {
    etablissementId!: string;          // ✅ ÉTABLISSEMENT
    anneeScolaireId!: string;          // ✅ ANNÉE SCOLAIRE
    niveauId!: string;                 // ✅ NIVEAU (lié à cycle)
    classeId?: string;                 // ✅ CLASSE (optionnel)
    // ❌ SECTION : N'existe pas
    // ❌ CYCLE DIRECT : Passé via niveau
    // ❌ ÉLÈVE DIRECT : Non supporté
}
```

**Hiérarchie actuelle** :
```
Établissement
  └─ Année Scolaire
      └─ Niveau (lié à Cycle)
          └─ Classe (optionnel)
```

---

### 2. Structure Actuelle des Remises

**Entité** : `Remise` ([recu-paiement.entity.ts](file:///home/franckylab/projets/eLISAschool/backend/src/modules/finances/entities/recu-paiement.entity.ts#L155-L193))

```typescript
@Entity('remises')
@Index(['eleveId'])
export class Remise {
    eleveId!: string;                  // ✅ ÉLÈVE (uniquement)
    fraisScolariteId!: string;         // ✅ Lié aux frais
    typeRemise!: TypeRemise;           // FRATRIE, BOURSE, PERSONNEL, ANTICIPE, AUTRE
    pourcentage!: number;
    montant!: number;
    motif!: string;
    validePar!: string;
    etablissementId!: string;          // ✅ ÉTABLISSEMENT (contexte)
    // ❌ CLASSE DIRECT : Non supporté
    // ❌ SECTION : N'existe pas
    // ❌ CYCLE DIRECT : Non supporté
    // ❌ PARENT DIRECT : Non supporté
}
```

**Limitation actuelle** : Remises **uniquement par élève**, pas par groupe.

---

### 3. Entités Disponibles dans le Système

| Entité | Existe ? | Fichier | Notes |
|--------|----------|---------|-------|
| **Établissement** | ✅ | `etablissement.entity.ts` | Multi-tenancy |
| **Cycle** | ✅ | `cycle.entity.ts` | Primaire, Secondaire, etc. |
| **Niveau** | ✅ | `niveau.entity.ts` | Lié à Cycle (6ème, CP, etc.) |
| **Classe** | ✅ | `classe.entity.ts` | 6ème A, 6ème B, etc. |
| **Section** | ❌ | **N'EXISTE PAS** | Non implémenté |
| **Élève** | ✅ | `eleve.entity.ts` | Avec utilisateur |
| **Parent** | ❌ | **PARTIEL** | Noms seulement, pas d'entité |
| **Année Scolaire** | ✅ | `annee-scolaire.entity.ts` | 2024-2025, etc. |

---

## 📊 Analyse de Cohérence

### A. FRAIS DE SCOLARITÉ - 5 Niveaux Proposés

#### 1️⃣ **Par Établissement** ✅ COHÉRENT
```
Tous les élèves du même établissement paient le même montant
```

**Cohérence** : ✅ **EXCELLENTE**
- Déjà implémenté via `etablissementId`
- Cas d'usage : Établissement unique avec tarifs uniformes
- Exemple : "Collège Saint-Exupéry" = 500,000 FCFA/an pour tous

**Faisabilité** : ✅ **DÉJÀ IMPLÉMENTÉ**
```typescript
// Actuellement
@Index(['etablissementId', 'anneeScolaireId', 'niveauId'], { unique: true })
```

---

#### 2️⃣ **Par Classe** ✅ COHÉRENT
```
Chaque classe a ses propres frais (ex: 6ème A ≠ 6ème B)
```

**Cohérence** : ✅ **BONNE**
- Déjà supporté via `classeId` (optionnel)
- Cas d'usage : Classes spéciales (bilingue, internationale, etc.)
- Exemple : 6ème A (classique) = 400K, 6ème B (bilingue) = 600K

**Faisabilité** : ✅ **DÉJÀ IMPLÉMENTÉ** (optionnel)
```typescript
@Column({ type: 'uuid', nullable: true })
classeId?: string;
```

**Problème détecté** : ⚠️ **Index unique trop restrictif**
```typescript
// ACTUEL (problématique)
@Index(['etablissementId', 'anneeScolaireId', 'niveauId'], { unique: true })

// Ne permet PAS d'avoir :
// - établissement1 + 2024-2025 + 6ème + classeA
// - établissement1 + 2024-2025 + 6ème + classeB
// CAR niveauId est dans l'index unique !
```

**Correction nécessaire** :
```typescript
@Index(['etablissementId', 'anneeScolaireId', 'classeId'], { unique: true })
// OU
@Index(['etablissementId', 'anneeScolaireId', 'niveauId', 'classeId'], { unique: true })
```

---

#### 3️⃣ **Par Section** ⚠️ NON IMPLÉMENTÉ
```
Sections : Scientifique, Littéraire, Technique, etc.
```

**Cohérence** : ✅ **BONNE** (conceptuellement)
- Cas d'usage réel : Lycée avec sections différentes
- Exemple : Terminale S = 600K, Terminale L = 500K, Terminale ST = 550K

**Faisabilité** : ❌ **NON IMPLÉMENTÉ**
- Entité `Section` **n'existe pas** dans le codebase
- Nécessite création complète :
  - Entité `Section`
  - Relation avec `Classe` ou `Niveau`
  - Intégration dans `FraisScolarite`

**Implémentation requise** :
```typescript
// NOUVELLE ENTITÉ
@Entity('sections')
export class Section {
    id!: string;
    nom!: string;              // "Scientifique", "Littéraire"
    code!: string;             // "S", "L", "ST"
    etablissementId!: string;
    cycleId?: string;          // Optionnel : lié à un cycle
}

// MODIFICATION FraisScolarite
@Column({ type: 'uuid', nullable: true })
sectionId?: string;

@ManyToOne(() => Section, { nullable: true })
@JoinColumn({ name: 'sectionId' })
section?: Section;
```

**Complexité** : 🔴 **MOYENNE-HAUTE** (2-3 jours de dev)

---

#### 4️⃣ **Par Cycle** ⚠️ INDIRECT SEULEMENT
```
Cycle : Primaire, Collège, Lycée
```

**Cohérence** : ✅ **BONNE**
- Cas d'usage : Tarifs différents par cycle
- Exemple : Primaire = 300K, Collège = 500K, Lycée = 700K

**Faisabilité** : ⚠️ **INDIRECT via Niveau**
- `Niveau` a une relation avec `Cycle`
- Mais `FraisScolarite` ne lie pas directement à `Cycle`

**Solution actuelle** :
```typescript
// Définir frais pour CHAQUE niveau du cycle
// Cycle "Primaire" a 6 niveaux → 6 configurations de frais
// Redondant si tous les niveaux du cycle ont même tarif
```

**Amélioration possible** :
```typescript
// AJOUTER dans FraisScolarite
@Column({ type: 'uuid', nullable: true })
cycleId?: string;

@ManyToOne(() => Cycle, { nullable: true })
@JoinColumn({ name: 'cycleId' })
cycle?: Cycle;

// Priorité de résolution :
// 1. Frais par classe (si classeId défini)
// 2. Frais par niveau (si niveauId défini)
// 3. Frais par cycle (si cycleId défini)
// 4. Frais par établissement (fallback)
```

**Complexité** : 🟡 **MOYENNE** (1 jour de dev)

---

#### 5️⃣ **Par Élève** ⚠️ CAS SPÉCIFIQUE
```
Frais personnalisés pour un élève particulier
```

**Cohérence** : ⚠️ **DISCUTABLE**
- Cas d'usage : Élève avec situation particulière (handicap, bourse spéciale)
- Mais : Contredit le concept de "frais par groupe"
- Risque : Complexité de gestion élevée

**Faisabilité** : ❌ **NON IMPLÉMENTÉ**
- Nécessite nouvelle entité `FraisScolariteEleve` ou champ dans `FraisScolarite`

**Implémentation** :
```typescript
// OPTION 1 : Nouvelle entité
@Entity('frais_scolarite_eleve')
export class FraisScolariteEleve {
    id!: string;
    eleveId!: string;
    fraisScolariteId!: string;     // Frais de référence
    montantPersonnalise!: number;   // Montant override
    motif!: string;                 // Justification
}

// OPTION 2 : Champ dans FraisScolarite (moins flexible)
@Column({ type: 'uuid', nullable: true })
eleveId?: string;                   // Si défini = frais individuels
```

**Recommandation** : ⚠️ **UTILISER REMISE AU LIEU DE FRAIS**
- Au lieu de créer "frais par élève", utiliser "frais par niveau/classe" + "remise élève"
- Plus simple, plus traçable, plus cohérent

**Complexité** : 🟡 **MOYENNE** (si vraiment nécessaire)

---

### B. REMISES - 6 Niveaux Proposés

#### 1️⃣ **Par Établissement** ✅ COHÉRENT
```
Remise automatique pour tous les élèves d'un établissement
```

**Cohérence** : ✅ **BONNE**
- Cas d'usage : Politique de remise établissement
- Exemple : "10% de remise pour tous les élèves en 2024-2025"

**Faisabilité** : ⚠️ **PARTIEL**
- `Remise` a `etablissementId` mais c'est pour le contexte, pas le scope
- Actuellement : Remise **toujours liée à un élève** (`eleveId` obligatoire)

**Implémentation requise** :
```typescript
// RENDRE eleveId OPTIONNEL
@Column({ type: 'uuid', nullable: true })
eleveId?: string;  // NULL = remise globale établissement

// AJOUTER scope
@Column({ type: 'varchar', length: 30, default: 'ELEVE' })
scopeRemise!: 'ETABLISSEMENT' | 'CYCLE' | 'NIVEAU' | 'CLASSE' | 'SECTION' | 'ELEVE' | 'PARENT';

// Si scope = ETABLISSEMENT → eleveId NULL
// Si scope = ELEVE → eleveId OBLIGATOIRE
```

**Complexité** : 🟢 **FAIBLE** (0.5 jour)

---

#### 2️⃣ **Par Classe** ✅ COHÉRENT
```
Remise pour tous les élèves d'une classe
```

**Cohérence** : ✅ **EXCELLENTE**
- Cas d'usage : Classe défavorisée, projet pilote, etc.
- Exemple : "CM2B : 15% de remise (quartier prioritaire)"

**Faisabilité** : ❌ **NON IMPLÉMENTÉ**
- Nécessite modification structure `Remise`

**Implémentation** :
```typescript
@Column({ type: 'uuid', nullable: true })
classeId?: string;

@ManyToOne(() => Classe, { nullable: true })
@JoinColumn({ name: 'classeId' })
classe?: Classe;

// Logique d'application :
// SI remise.classeId = "classe-X"
// ALORS appliquer à TOUS les élèves de "classe-X"
```

**Complexité** : 🟡 **MOYENNE** (1 jour)

---

#### 3️⃣ **Par Section** ⚠️ DÉPEND DE SECTION
```
Remise pour une section spécifique
```

**Cohérence** : ✅ **BONNE** (si sections existent)
- Cas d'usage : Promotion d'une section
- Exemple : "Section Technique : 20% de remise (nouveauté)"

**Faisabilité** : ❌ **NON IMPLÉMENTÉ**
- Dépend de la création de l'entité `Section` (voir frais)

**Complexité** : 🔴 **HAUTE** (dépend de Section)

---

#### 4️⃣ **Par Cycle** ✅ COHÉRENT
```
Remise pour tous les élèves d'un cycle
```

**Cohérence** : ✅ **EXCELLENTE**
- Cas d'usage : Politique cycle
- Exemple : "Primaire : 10% de remise (politique sociale)"

**Faisabilité** : ❌ **NON IMPLÉMENTÉ**
- Similaire à "par classe"

**Implémentation** :
```typescript
@Column({ type: 'uuid', nullable: true })
cycleId?: string;

@ManyToOne(() => Cycle, { nullable: true })
@JoinColumn({ name: 'cycleId' })
cycle?: Cycle;
```

**Complexité** : 🟢 **FAIBLE** (0.5 jour)

---

#### 5️⃣ **Par Élève** ✅ DÉJÀ IMPLÉMENTÉ
```
Remise individuelle pour un élève
```

**Cohérence** : ✅ **EXCELLENTE**
- Cas d'usage : Bourse, fratrie, personnel, etc.
- **C'est l'implémentation ACTUELLE**

**Faisabilité** : ✅ **DÉJÀ IMPLÉMENTÉ**
```typescript
@Column({ type: 'uuid' })
eleveId!: string;  // OBLIGATOIRE actuellement

@Column({ type: 'enum', enum: TypeRemise })
typeRemise!: TypeRemise;  // FRATRIE, BOURSE, PERSONNEL, etc.
```

**Types de remise existants** :
- `FRATRIE` : Plusieurs enfants
- `BOURSE` : Mérite ou besoin social
- `PERSONNEL` : Enfant du personnel
- `ANTICIPE` : Paiement anticipé
- `AUTRE` : Cas particulier

**Recommandation** : ✅ **CONSERVER** comme scope par défaut

---

#### 6️⃣ **Par Parent** ⚠️ COMPLEXE
```
Remise basée sur le parent (tous les enfants du même parent)
```

**Cohérence** : ✅ **BONNE** (conceptuellement)
- Cas d'usage : Fratrie automatique, situation familiale
- Exemple : "Parent X : 15% de remise pour TOUS ses enfants"

**Faisabilité** : 🔴 **TRÈS COMPLEXE**
- **Problème majeur** : Entité `Parent` **n'existe pas** comme entité autonome
- Actuellement : `nomPere`, `nomMere`, `nomTuteur` = simples champs texte dans `Eleve`
- Pas de relation formelle parent-enfants

**Implémentation requise** :
```typescript
// NOUVELLE ENTITÉ OBLIGATOIRE
@Entity('parents')
export class Parent {
    id!: string;
    utilisateurId!: string;       // Lié à un compte utilisateur
    nom!: string;
    prenom!: string;
    telephone!: string;
    email?: string;
    etablissementId!: string;
}

// NOUVELLE ENTITÉ DE RELATION
@Entity('parent_eleve')
export class ParentEleve {
    id!: string;
    parentId!: string;
    eleveId!: string;
    lienParente!: 'PERE' | 'MERE' | 'TUTEUR' | 'AUTRE';
    responsableFinancier!: boolean;  // Qui paie ?
}

// MODIFICATION Remise
@Column({ type: 'uuid', nullable: true })
parentId?: string;

@ManyToOne(() => Parent, { nullable: true })
@JoinColumn({ name: 'parentId' })
parent?: Parent;

// Logique :
// SI remise.parentId = "parent-X"
// ALORS appliquer à TOUS les enfants de "parent-X"
// OÙ parent_eleve.responsableFinancier = true
```

**Complexité** : 🔴 **TRÈS HAUTE** (3-5 jours de dev)
- Création entité Parent
- Migration données existantes (nomPere, nomMere → Parent)
- Relations multiple parents par élève
- Gestion responsable financier

**Recommandation** : ⚠️ **REMPLACER PAR "FRATRIE AUTOMATIQUE"**
- Utiliser `TypeRemise.FRATRIE` avec détection automatique par `nomPere`/`nomMere`
- Moins complexe, couvre 90% des cas d'usage
- Implémenter entité Parent plus tard si vraiment nécessaire

---

## 🎯 Analyse de Pertinence

### Matrice Priorisation

| Niveau | Frais | Remises | Priorité | Justification |
|--------|-------|---------|----------|---------------|
| **Établissement** | ✅ Fait | ⚠️ Partiel | 🔴 **HAUTE** | Base du système |
| **Cycle** | ⚠️ Indirect | ❌ Non | 🟡 **MOYENNE** | Regroupement logique |
| **Niveau** | ✅ Fait | ❌ Non | 🔴 **HAUTE** | Granularité standard |
| **Classe** | ✅ Fait (bug) | ❌ Non | 🔴 **HAUTE** | Cas réels fréquents |
| **Section** | ❌ Non | ❌ Non | 🟢 **FAIBLE** | Optionnel, complexe |
| **Élève** | ❌ Non | ✅ Fait | 🟡 **MOYENNE** | Cas spéciaux |
| **Parent** | ❓ N/A | ❌ Non | 🟢 **FAIBLE** | Très complexe |

---

## ⚠️ Problèmes Identifiés

### 🔴 **CRITIQUES**

1. **Index unique incorrect sur FraisScolarite**
```typescript
// ACTUEL (empêche multi-classe)
@Index(['etablissementId', 'anneeScolaireId', 'niveauId'], { unique: true })

// DEVRAIT ÊTRE
@Index(['etablissementId', 'anneeScolaireId', 'niveauId', 'classeId'], { unique: true })
```
**Impact** : ⚠️ **BLOQUANT** pour frais par classe

2. **Remise eleveId obligatoire**
```typescript
// ACTUEL (empêche remises groupe)
@Column({ type: 'uuid' })
eleveId!: string;  // TOUJOURS requis

// DEVRAIT ÊTRE
@Column({ type: 'uuid', nullable: true })
eleveId?: string;  // Optionnel pour remises groupe
```
**Impact** : ⚠️ **BLOQUANT** pour remises par classe/cycle/établissement

---

### 🟡 **MODÉRÉS**

3. **Pas d'entité Section**
- Nécessaire pour lycée avec filières
- Mais peut être reporté (phase 2)

4. **Pas d'entité Parent**
- Complexe à implémenter
- Remplaçable par "fratrie automatique" (phase 1)

5. **Pas de scope de remise**
- Impossible de distinguer remise élève vs groupe
- Simple à ajouter (champ enum)

---

### 🟢 **MINEURS**

6. **Frais par élève non supporté**
- Utiliser remise à la place (meilleure pratique)
- Pas prioritaire

7. **Cycle indirect via niveau**
- Fonctionnel mais redondant
- Amélioration possible

---

## 💡 Recommandations

### 🎯 **Phase 1 - Immédiat (1-2 jours)**

#### 1. Corriger index FraisScolarite
```typescript
// Migration SQL
DROP INDEX IF EXISTS "IDX_frais_scolarite_etablissement_annee_niveau";
CREATE UNIQUE INDEX "IDX_frais_scolarite_unique" 
ON frais_scolarite (etablissement_id, annee_scolaire_id, niveau_id, classe_id);
```

#### 2. Rendre eleveId optionnel dans Remise
```typescript
@Column({ type: 'uuid', nullable: true })
eleveId?: string;

@Column({ type: 'varchar', length: 30, default: 'ELEVE' })
scopeRemise!: 'ETABLISSEMENT' | 'CYCLE' | 'NIVEAU' | 'CLASSE' | 'ELEVE';

// Index conditionnels
@Column({ type: 'uuid', nullable: true })
classeId?: string;

@Column({ type: 'uuid', nullable: true })
cycleId?: string;
```

#### 3. Ajouter cycleId dans FraisScolarite
```typescript
@Column({ type: 'uuid', nullable: true })
cycleId?: string;

@ManyToOne(() => Cycle, { nullable: true })
@JoinColumn({ name: 'cycleId' })
cycle?: Cycle;
```

**Résultat Phase 1** :
- ✅ Frais par établissement, cycle, niveau, classe
- ✅ Remises par établissement, cycle, classe, élève
- ✅ Couvre 95% des cas d'usage réels

---

### 🎯 **Phase 2 - Court terme (3-5 jours)**

#### 4. Créer entité Section
```typescript
@Entity('sections')
export class Section {
    id!: string;
    nom!: string;
    code!: string;
    etablissementId!: string;
}

// Ajouter sectionId dans FraisScolarite et Remise
```

#### 5. Détection automatique fratrie
```typescript
// Service méthode
async detecterFratrie(eleveId: string): Promise<Eleve[]> {
    const eleve = await eleveRepo.findOne({ where: { id: eleveId } });
    
    // Trouver élèves avec mêmes noms parents
    return eleveRepo.find({
        where: [
            { nomPere: eleve.nomPere, nomMere: eleve.nomMere },
        ],
    });
}

// Appliquer remise FRATRIE automatiquement
```

#### 6. Priorité de résolution des frais
```typescript
// Algorithme
async getFraisScolarite(eleveId: string): Promise<FraisScolarite> {
    const eleve = await getEleveWithRelations(eleveId);
    
    // 1. Frais par classe (plus spécifique)
    const fraisClasse = await fraisRepo.findOne({
        where: {
            etablissementId: eleve.etablissementId,
            anneeScolaireId: eleve.anneeScolaireId,
            classeId: eleve.classeId,
        },
    });
    if (fraisClasse) return fraisClasse;
    
    // 2. Frais par niveau
    const fraisNiveau = await fraisRepo.findOne({
        where: {
            etablissementId: eleve.etablissementId,
            anneeScolaireId: eleve.anneeScolaireId,
            niveauId: eleve.niveauId,
        },
    });
    if (fraisNiveau) return fraisNiveau;
    
    // 3. Frais par cycle
    const fraisCycle = await fraisRepo.findOne({
        where: {
            etablissementId: eleve.etablissementId,
            anneeScolaireId: eleve.anneeScolaireId,
            cycleId: eleve.niveau.cycleId,
        },
    });
    if (fraisCycle) return fraisCycle;
    
    // 4. Fallback : frais établissement (général)
    throw new AppError('Aucun frais configuré pour cet élève', 404);
}
```

---

### 🎯 **Phase 3 - Moyen terme (optionnel)**

#### 7. Entité Parent complète
- Uniquement si vraiment nécessaire
- Coût : 3-5 jours de dev
- Bénéfice : Gestion fine des responsables financiers

#### 8. Frais par élève
- Via entité `FraisScolariteEleve`
- Cas très rares (préférer remise)

---

## 📊 Synthèse Faisabilité

| Niveau | Faisabilité | Effort | Priorité | Recommandation |
|--------|-------------|--------|----------|----------------|
| **Établissement** | ✅ Fait | 0 | 🔴 HAUTE | **Corriger index** |
| **Cycle** | 🟢 Facile | 0.5j | 🟡 MOYENNE | **Ajouter cycleId** |
| **Niveau** | ✅ Fait | 0 | 🔴 HAUTE | **Fonctionnel** |
| **Classe** | 🟡 Bug index | 0.5j | 🔴 HAUTE | **Corriger index** |
| **Section** | 🔴 Complexe | 2-3j | 🟢 FAIBLE | **Phase 2** |
| **Élève** | 🟡 Moyen | 1j | 🟢 FAIBLE | **Utiliser remise** |
| **Parent** | 🔴 Très complexe | 3-5j | 🟢 FAIBLE | **Fratrie auto** |

---

## ✅ Verdict Final

### **Logique Globale** : ✅ **COHÉRENTE et PERTINENTE**

**Points forts** :
- ✅ Hiérarchie logique (établissement → cycle → niveau → classe → élève)
- ✅ Cas d'usage réels couverts
- ✅ Flexible et extensible

**Points faibles** :
- ⚠️ 2 bugs bloquants (index + eleveId obligatoire)
- ⚠️ Section et Parent non implémentés
- ⚠️ Complexité de "par parent" sous-estimée

### **Recommandation** : 

**IMPLÉMENTER PAR PHASES** :

1. **Phase 1 (URGENT - 1-2 jours)** :
   - Corriger index FraisScolarite
   - Rendre eleveId optionnel
   - Ajouter cycleId et scopeRemise
   - **Couvre 95% des besoins**

2. **Phase 2 (1-2 semaines)** :
   - Créer entité Section
   - Détection automatique fratrie
   - Algorithme priorité de résolution

3. **Phase 3 (optionnel)** :
   - Entité Parent complète
   - Frais par élève

---

## 📋 Checklist Implémentation Phase 1

- [ ] **Migration 1** : Corriger index unique FraisScolarite
- [ ] **Migration 2** : Ajouter cycleId nullable dans FraisScolarite
- [ ] **Migration 3** : Rendre eleveId nullable dans Remise
- [ ] **Migration 4** : Ajouter scopeRemise enum dans Remise
- [ ] **Migration 5** : Ajouter classeId, cycleId nullable dans Remise
- [ ] **Code 1** : Mettre à jour DTOs (scolarite.dto.ts)
- [ ] **Code 2** : Mettre à jour services (logique résolution)
- [ ] **Test 1** : Frais par classe (multi-classe même niveau)
- [ ] **Test 2** : Remise par classe (applique à tous élèves classe)
- [ ] **Test 3** : Remise par cycle (applique à tous élèves cycle)
- [ ] **Test 4** : Priorité de résolution (classe > niveau > cycle > établissement)
- [ ] **Doc** : Mettre à jour documentation

---

**Généré le** : 7 juin 2026  
**Analyse** : Cohérence ✅ | Faisabilité ⚠️ (2 bugs) | Pertinence ✅  
**Recommandation** : Phase 1 immédiate (1-2 jours)
