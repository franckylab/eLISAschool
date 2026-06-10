# Vérification des Champs de Préinscription dans l'Entity Eleve

## ✅ Champs EXISTANTS dans l'Entity Eleve

### Informations Élève (Base)
| Champ DTO | Champ Entity | Type Entity | Status |
|-----------|--------------|-------------|--------|
| `nom` | ❌ NON | - | ❌ **MANQUANT** |
| `prenom` | ❌ NON | - | ❌ **MANQUANT** |
| `dateNaissance` | `dateNaissance` | `date` | ✅ |
| `lieuNaissance` | `lieuNaissance` | `varchar(100)` | ✅ |
| `sexe` | `sexe` | `enum ['M', 'F']` | ✅ |
| `nationalite` | `nationalite` | `varchar(100)` | ✅ |
| `sousSysteme` | `sousSysteme` | `enum SousSysteme` | ✅ |
| `photo` | `photo` | `varchar(500)` | ✅ |
| `groupeSanguin` | `groupeSanguin` | `varchar(5)` | ✅ |
| `allergies` | `allergies` | `simple-json` | ✅ |
| `nomContactUrgence` | `nomContactUrgence` | `varchar(200)` | ✅ |
| `telephoneContactUrgence` | `telephoneContactUrgence` | `varchar(20)` | ✅ |
| `adresseDomicile` | `adresseDomicile` | `text` | ✅ |
| `ville` | `ville` | `varchar(100)` | ✅ |
| `quartier` | `quartier` | `varchar(100)` | ✅ |
| `ecoleProvenance` | `ecoleProvenance` | `varchar(200)` | ✅ |
| `classeAnterieure` | `classeAnterieure` | `varchar(100)` | ✅ |
| `redoublement` | `redoublement` | `boolean` | ✅ |
| `boursier` | `boursier` | `boolean` | ✅ |
| `regimeInterne` | `regimeInterne` | `boolean` | ✅ |

### Parents (Champs Existent)
| Champ DTO | Champ Entity | Type Entity | Status |
|-----------|--------------|-------------|--------|
| `nomPere` | `nomPere` | `varchar(150)` | ✅ |
| `nomMere` | `nomMere` | `varchar(150)` | ✅ |
| `nomTuteur` | `nomTuteur` | `varchar(150)` | ✅ |
| `telephoneTuteur` | `telephoneTuteur` | `varchar(20)` | ✅ |

### Inscription
| Champ DTO | Champ Entity | Type Entity | Status |
|-----------|--------------|-------------|--------|
| `classeSouhaiteeId` | `classeSouhaiteeId` | `uuid` | ✅ |
| `codeEtablissement` | ❌ NON | - | ✅ Résolu via service |
| `documentsJustificatifs` | `documentsJustificatifs` | `simple-json` | ✅ |

---

## ❌ Champs MANQUANTS dans l'Entity Eleve

### 1. Informations Parents Détaillées
| Champ DTO | Champ Entity Requis | Type Recommandé | Priorité |
|-----------|---------------------|-----------------|----------|
| `professionPere` | ❌ MANQUANT | `varchar(150)` | 🔴 Haute |
| `telephonePere` | ❌ MANQUANT | `varchar(20)` | 🔴 Haute |
| `emailPere` | ❌ MANQUANT | `varchar(150)` | 🔴 Haute |
| `adressePere` | ❌ MANQUANT | `varchar(300)` | 🟡 Moyenne |
| `professionMere` | ❌ MANQUANT | `varchar(150)` | 🔴 Haute |
| `telephoneMere` | ❌ MANQUANT | `varchar(20)` | 🔴 Haute |
| `emailMere` | ❌ MANQUANT | `varchar(150)` | 🔴 Haute |
| `adresseMere` | ❌ MANQUANT | `varchar(300)` | 🟡 Moyenne |
| `lienParenteTuteur` | ❌ MANQUANT | `varchar(50)` | 🟡 Moyenne |
| `professionTuteur` | ❌ MANQUANT | `varchar(150)` | 🟡 Moyenne |
| `emailTuteur` | ❌ MANQUANT | `varchar(150)` | 🟡 Moyenne |
| `adresseTuteur` | ❌ MANQUANT | `varchar(300)` | 🟡 Moyenne |

### 2. Informations Complémentaires
| Champ DTO | Champ Entity Requis | Type Recommandé | Priorité |
|-----------|---------------------|-----------------|----------|
| `email` (contact principal) | ❌ MANQUANT | `varchar(150)` | 🔴 Haute |
| `commentaire` | `commentaireRefus` existe | `text` | 🟢 Adapté |
| `situationFamiliale` | ❌ MANQUANT | `varchar(50)` | 🟡 Moyenne |
| `personneAutorisee` | ❌ MANQUANT | `varchar(300)` | 🟡 Moyenne |
| `transportScolaire` | ❌ MANQUANT | `boolean` | 🔴 Haute |
| `cantine` | ❌ MANQUANT | `boolean` | 🔴 Haute |

### 3. Champs CRITIQUES Absents
| Champ | Impact | Solution |
|-------|--------|----------|
| `nom` de l'élève | ❌ BLOQUANT | Champ essentiel manquant |
| `prenom` de l'élève | ❌ BLOQUANT | Champ essentiel manquant |

---

## 📊 Statistiques

| Catégorie | Total | Présents | Manquants | % Complété |
|-----------|-------|----------|-----------|------------|
| Élève (base) | 20 | 18 | **2** | 90% |
| Parents détaillés | 12 | 4 | **8** | 33% |
| Complémentaires | 5 | 0 | **5** | 0% |
| **TOTAL** | **37** | **22** | **15** | **59%** |

---

## 🔴 Champs Critiques à Ajouter IMMÉDIATEMENT

### 1. `nom` et `prenom` de l'élève
**Impact** : Ces champs sont FONDAMENTAUX pour identifier l'élève. Sans eux, le système est incomplet.

**Solution recommandée** :
```typescript
@Column({ type: 'varchar', length: 100 })
nom!: string;

@Column({ type: 'varchar', length: 100 })
prenom!: string;
```

### 2. Contacts Parents (téléphone, email)
**Impact** : Essentiels pour les notifications et relances.

**Solution recommandée** :
```typescript
// Père
@Column({ type: 'varchar', length: 150, nullable: true })
professionPere?: string;

@Column({ type: 'varchar', length: 20, nullable: true })
telephonePere?: string;

@Column({ type: 'varchar', length: 150, nullable: true })
emailPere?: string;

// Mère
@Column({ type: 'varchar', length: 150, nullable: true })
professionMere?: string;

@Column({ type: 'varchar', length: 20, nullable: true })
telephoneMere?: string;

@Column({ type: 'varchar', length: 150, nullable: true })
emailMere?: string;

// Tuteur
@Column({ type: 'varchar', length: 50, nullable: true })
lienParenteTuteur?: string;

@Column({ type: 'varchar', length: 150, nullable: true })
professionTuteur?: string;

@Column({ type: 'varchar', length: 150, nullable: true })
emailTuteur?: string;
```

### 3. Services et Contact Principal
**Impact** : Nécessaires pour la gestion des services et notifications.

**Solution recommandée** :
```typescript
// Contact principal
@Column({ type: 'varchar', length: 150, nullable: true })
emailPrincipal?: string;

// Services
@Column({ type: 'boolean', default: false })
transportScolaire!: boolean;

@Column({ type: 'boolean', default: false })
cantine!: boolean;

// Informations complémentaires
@Column({ type: 'varchar', length: 50, nullable: true })
situationFamiliale?: string;

@Column({ type: 'varchar', length: 300, nullable: true })
personneAutorisee?: string;
```

---

## 🎯 Plan d'Action Recommandé

### Étape 1 : Ajouter les champs critiques (BLOQUANT)
1. ✅ Ajouter `nom` et `prenom` à l'entity Eleve
2. ✅ Créer migration SQL pour ces champs

### Étape 2 : Ajouter les contacts parents (HAUTE)
1. ✅ Ajouter 12 champs pour père, mère, tuteur
2. ✅ Créer migration SQL

### Étape 3 : Ajouter les services et infos complémentaires (MOYENNE)
1. ✅ Ajouter 5 champs supplémentaires
2. ✅ Créer migration SQL

### Étape 4 : Vérifier la compilation
1. ✅ Vérifier TypeScript
2. ✅ Tester le DTO

---

## 📝 Migration SQL à Générer

```sql
-- ==================================
-- Ajout des champs manquants pour préinscriptions enrichies
-- ==================================

-- Champs CRITIQUES : Nom et Prénom de l'élève
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS nom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS prenom VARCHAR(100);

-- Contacts Père
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS professionPere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS telephonePere VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emailPere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS adressePere VARCHAR(300);

-- Contacts Mère
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS professionMere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS telephoneMere VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emailMere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS adresseMere VARCHAR(300);

-- Contacts Tuteur
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS lienParenteTuteur VARCHAR(50),
  ADD COLUMN IF NOT EXISTS professionTuteur VARCHAR(150),
  ADD COLUMN IF NOT EXISTS emailTuteur VARCHAR(150),
  ADD COLUMN IF NOT EXISTS adresseTuteur VARCHAR(300);

-- Contact Principal et Services
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS emailPrincipal VARCHAR(150),
  ADD COLUMN IF NOT EXISTS transportScolaire BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cantine BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS situationFamiliale VARCHAR(50),
  ADD COLUMN IF NOT EXISTS personneAutorisee VARCHAR(300);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_eleve_nom_prenom ON eleves(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_eleve_email_principal ON eleves(emailPrincipal);
CREATE INDEX IF NOT EXISTS idx_eleve_telephone_pere ON eleves(telephonePere);
CREATE INDEX IF NOT EXISTS idx_eleve_telephone_mere ON eleves(telephoneMere);
CREATE INDEX IF NOT EXISTS idx_eleve_telephone_tuteur ON eleves(telephoneTuteur);
```

---

## ⚠️ Problème Identifié

Le service `createPreinscription` essaie de peupler des champs qui n'existent PAS dans l'entity :
- `nom` ❌
- `prenom` ❌
- `professionPere` ❌
- `telephonePere` ❌
- `emailPere` ❌
- `adressePere` ❌
- `professionMere` ❌
- `telephoneMere` ❌
- `emailMere` ❌
- `adresseMere` ❌
- `lienParenteTuteur` ❌
- `professionTuteur` ❌
- `emailTuteur` ❌
- `adresseTuteur` ❌
- `email` (principal) ❌
- `transportScolaire` ❌
- `cantine` ❌
- `situationFamiliale` ❌
- `personneAutorisee` ❌

**Risque** : TypeScript ne catch pas ces erreurs à la compilation car `Object.assign` est utilisé implicitement. Cependant, ces champs seront simplement ignorés par TypeORM lors du `save()`.

---

**Date** : 2026-06-10  
**Status** : ⚠️ 15 champs manquants identifiés  
**Priorité** : 🔴 CRITIQUE (nom et prenom absents)
