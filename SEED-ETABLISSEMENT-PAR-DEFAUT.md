# Ajout Établissement par défaut dans les Seeds

**Date**: 2026-06-13  
**Objectif**: Créer un établissement par défaut lié à toutes les données du système  
**Statut**: ✅ COMPLÉTÉ

---

## 🎯 Objectif

Ajouter un **établissement par défaut** dans les seeds qui servira de :
- ✅ Source de vérité multi-tenant
- ✅ Point de liaison pour toutes les données (utilisateurs, classes, élèves, etc.)
- ✅ Contexte d'exécution par défaut

---

## ✅ Modifications Apportées

### 1. Nouveau Fichier: seed-etablissement-par-defaut.ts

**Chemin**: `backend/src/database/seeds/seed-etablissement-par-defaut.ts`

**Fonctionnalités** :
```typescript
export async function seedEtablissementParDefaut(): Promise<string>
// Crée l'établissement par défaut
// Retourne: ID de l'établissement créé ou existant

export async function deleteEtablissementParDefaut(): Promise<void>
// Supprime l'établissement (pour reset)
```

**Établissement créé** :
```typescript
{
    nom: 'Lycée Bilingue eLISAschool',
    codeEtablissement: 'ETAB-001',
    slogan: 'L\'excellence éducative au service de la réussite',
    sousSysteme: SousSysteme.BICULTUREL,
    type: TypeEtablissement.LAIC,
    contactEmail: 'contact@elisaschool.cm',
    contactTelephone: '+237 690 000 000',
    adresse: 'Yaoundé, Cameroun',
    siteWeb: 'https://elisaschool.cm',
    directeurNom: 'Dr. Jean Dupont',
    directeurAdjointNom: 'Mme. Marie Ngo Mback',
    censeurNom: 'M. Pierre Mbarga',
    surveillantGeneralNom: 'Mme. Aïcha Mahamat',
    heuresOuverture: '07:00',
    heuresFermeture: '18:00',
    effectifMax: 1000,
    actif: true,
    statut: StatutEtablissement.ACTIF,
}
```

**Configuration associée** :
```typescript
{
    etablissementId: <ID établissement>,
    cyclesActifs: [], // Peuplé par seed-structure-academique
    configurationBulletin: {
        style: 'moderne',
        couleurPrimaire: '#2563EB',
        afficherRang: true,
        afficherMoyenneGenerale: true,
        afficherAppreciation: true,
        afficherPhoto: true,
        afficherCourbeProgression: true,
    },
    maxEleves: 1000,
    maxUtilisateurs: 100,
    maxClasses: 50,
    stockageMaxMB: 5000,
    planAbonnement: 'gratuit',
}
```

---

### 2. Mise à jour: initial.seed.ts

**Version**: 3.0.0 → **4.0.0**

**Changements** :

#### a) Nouvel ordre d'exécution
```typescript
// AVANT ❌
1. Configuration
2. RBAC
3. Structure académique
4. Super admin

// APRÈS ✅
1. Établissement par défaut ← NOUVEAU (priorité 1)
2. Configuration
3. RBAC
4. Structure académique
5. Super admin
```

#### b) Propagation de l'etablissementId
```typescript
export async function runSeeds(): Promise<void> {
    // 1. Créer l'établissement
    const etablissementId = await seedEtablissementParDefaut();
    
    // 2. Passer l'ID aux autres seeds
    await seedConfiguration(etablissementId);
    await seedStructureAcademique(etablissementId);
    await seedSuperAdmin(etablissementId);
    
    logger.info(`🏫 Établissement par défaut: ${etablissementId}`);
}
```

#### c) Super admin lié à l'établissement
```typescript
const superAdmin = userRepo.create({
    email: 'admin@elisaschool.cm',
    matricule: 'ADMIN001',
    role: Role.SUPER_ADMIN,
    etablissementId: etablissementId, // ✅ Lié à l'établissement
});
```

---

### 3. Mise à jour: seed-structure-academique.ts

**Version**: 2.0.0 → **3.0.0**

**Changements** :

#### a) Signature de la fonction
```typescript
// AVANT ❌
export async function seedStructureAcademique(): Promise<void>

// APRÈS ✅
export async function seedStructureAcademique(etablissementId: string): Promise<void>
```

#### b) Correction typage filières
```typescript
// AVANT ❌ - Erreur TypeScript
const filiere = filiereRepo.create(data);
// data.sousSysteme est string 'FRANCOPHONE', pas enum SousSysteme

// APRÈS ✅ - Cast correct
const filiere = filiereRepo.create({
    nom: data.nom,
    code: data.code,
    description: data.description,
    cycleId: data.cycleId,
    sousSysteme: data.sousSysteme as SousSysteme, // ✅ Cast enum
    actif: true,
});
```

**Note** : Les cycles, niveaux et filières sont des données **globales** (mêmes pour tous les établissements). Le paramètre `etablissementId` est disponible pour future utilisation si nécessaire.

---

## 📊 Architecture des Seeds v4.0

```
runSeeds()
│
├─ 1. seedEtablissementParDefaut()
│   ├─ Crée: Lycée Bilingue eLISAschool (ETAB-001)
│   ├─ Crée: EtablissementConfig associée
│   └─ Retourne: etablissementId (UUID)
│
├─ 2. seedConfiguration(etablissementId)
│   ├─ seedConfigurationModules()
│   └─ seedParametresSysteme()
│       └─ Paramètres globaux (app.*, auth.*, etc.)
│
├─ 3. seedRBAC()
│   ├─ Rôles (SUPER_ADMIN, ADMIN, etc.)
│   ├─ Permissions
│   └─ Mappings rôle-permission
│
├─ 4. seedStructureAcademique(etablissementId)
│   ├─ Cycles (Maternelle, Primaire, Collège, Lycée)
│   ├─ Niveaux (CP, CE1, 6ème, 2nde, etc.)
│   ├─ Filières (Générale, Technique, etc.)
│   ├─ Spécialités (Sciences, Lettres, etc.)
│   └─ Examens nationaux (CEP, BEPC, BAC)
│
└─ 5. seedSuperAdmin(etablissementId)
    ├─ Crée: admin@elisaschool.cm
    ├─ Lie à: etablissementId ✅
    └─ Profil: ADMINISTRATEUR Super
```

---

## 🔗 Relations Multi-Tenant

### Établissement (Source de vérité)
```
etablissements (ETAB-001)
├── id: UUID
├── nom: "Lycée Bilingue eLISAschool"
├── codeEtablissement: "ETAB-001"
└── ... (toutes les infos)
```

### Entités liées à l'établissement
```
utilisateurs
├── etablissementId → etablissements.id ✅

etablissement_config
├── etablissementId → etablissements.id ✅

profils_utilisateurs
└── utilisateurId → utilisateurs.id (indirectement lié)

annees_scolaires
├── etablissementId → etablissements.id (futur seed)

classes
├── etablissementId → etablissements.id (futur seed)

eleves
├── etablissementId → etablissements.id (futur seed)

personnel
├── etablissementId → etablissements.id (futur seed)
```

### Entités globales (non liées)
```
cycles               ✅ Mêmes pour tous
niveaux              ✅ Mêmes pour tous
filieres             ✅ Mêmes pour tous
specialites          ✅ Mêmes pour tous
examens_nationaux    ✅ Mêmes pour tous
parametres_systeme   ✅ Config globale (etablissementId NULL)
```

---

## 🚀 Exécution

### Commande
```bash
cd backend
npm run seed
```

### Output attendu
```
🌱 Exécution des seeds...
🏫 Création de l'établissement par défaut...
✅ Établissement créé: Lycée Bilingue eLISAschool (ID: <UUID>)
✅ Configuration de l'établissement créée
🌱 Démarrage du seed de configuration...
✅ X configurations de modules créées
✅ Y paramètres système créés
Configuration seeds: Modules=X, Params=Y
✅ RBAC seeds: ...
🎓 Seed de la structure académique...
✅ Structure académique seedée
✅ Super admin créé: admin@elisaschool.cm
🔗 Super admin lié à l'établissement: <UUID>
✅ Seeds exécutés avec succès
🏫 Établissement par défaut: <UUID>
```

---

## 📝 Identifiants par défaut

### Établissement
- **Code**: `ETAB-001`
- **Nom**: `Lycée Bilingue eLISAschool`
- **Email**: `contact@elisaschool.cm`
- **Téléphone**: `+237 690 000 000`

### Super Admin
- **Email**: `admin@elisaschool.cm`
- **Mot de passe**: `AdminSecret123!`
- **Matricule**: `ADMIN001`
- **Établissement**: `ETAB-001` ✅

---

## ✅ Vérification

### Compilation TypeScript
```bash
$ npx tsc --noEmit 2>&1 | grep -E "seed-etablissement|initial.seed|seed-structure"
→ 0 erreur ✅
```

### Fichiers créés/modifiés
1. ✅ `seed-etablissement-par-defaut.ts` - **NOUVEAU** (115 lignes)
2. ✅ `initial.seed.ts` - **MODIFIÉ** (v4.0.0, +22/-11 lignes)
3. ✅ `seed-structure-academique.ts` - **MODIFIÉ** (v3.0.0, +14/-7 lignes)

### Corrections appliquées
- ✅ `EtablissementConfig` : Structure correcte (pas de `quotas`, champs individuels)
- ✅ `Utilisateur` : `etablissementId` uniquement (pas `etablissementActifId`)
- ✅ `ProfilUtilisateur` : Pas de `etablissementId` (lié via `utilisateurId`)
- ✅ `Filiere` : Cast `as SousSysteme` pour le champ enum

---

## 🎓 Leçons Apprises

### Pattern de Seed Multi-Tenant
```typescript
// 1. TOUJOURS créer d'abord l'établissement
const etablissementId = await seedEtablissementParDefaut();

// 2. Propager l'ID aux autres seeds
await seedXXX(etablissementId);

// 3. Lier les entités utilisateur/profil à l'établissement
utilisateur.etablissementId = etablissementId;

// 4. Caster les enums correctement
sousSysteme: data.sousSysteme as SousSysteme
```

### Erreurs Évitées
- ❌ Ne pas mettre `quotas` dans `EtablissementConfig` (champs individuels)
- ❌ Ne pas utiliser `etablissementActifId` dans `Utilisateur` (n'existe pas)
- ❌ Ne pas mettre `etablissementId` dans `ProfilUtilisateur` (lié via utilisateur)
- ❌ Ne pas bypasser le cast d'enum (TypeScript strict)

---
