# 🌱 Seeds de Données - eLISAschool

## Vue d'ensemble

Les seeds permettent de peupler la base de données avec des données initiales pour le développement et les tests.

## 📋 Liste des Seeds

### 1. seed-etablissement-par-defaut.ts
**Version:** 2.0.0  
**Description:** Crée 2 établissements par défaut (ETAB-001 et ETAB-002)  
**Usage:** Automatique via `runSeeds()`

### 2. seed-structure-academique.ts
**Version:** 3.0.0  
**Description:** Crée la structure académique complète
- Cycles pédagogiques (Maternelle, Primaire, Collège, Lycée)
- Niveaux (Francophone et Anglophone)
- Filières (Second cycle)
- Spécialités techniques
- Examens nationaux
- Compétences APC

**Paramètre:** `etablissementId: string`

### 3. seed-annees-scolaires.ts
**Version:** 1.0.0  
**Description:** Crée 3 années scolaires (2024-2025, 2025-2026, 2026-2027)  
**Paramètre:** `etablissementId: string`  
**Retour:** `string | null` (ID de l'année active)

### 4. seed-classes-par-defaut.ts
**Version:** 3.0.0  
**Description:** Crée 1 classe par niveau pour l'année scolaire active  
**Paramètres:** 
- `etablissementId: string`
- `anneeScolaireId?: string` (optionnel, prend la dernière active)

### 5. seed-matieres.ts
**Version:** 1.0.0  
**Description:** Crée les matières de base (13 matières)  
**Paramètre:** `etablissementId: string`

### 6. seed-matieres-niveaux.ts
**Version:** 1.0.0  
**Description:** Associe les matières aux niveaux avec coefficients et horaires  
**Paramètre:** `etablissementId: string`

### 7. seed-utilisateurs-par-role.ts
**Version:** 1.0.0  
**Description:** Crée un utilisateur de test pour chaque rôle (38 utilisateurs)  
**Paramètres:**
- `etablissementPrincipalId: string`
- `etablissementSecondaireId?: string`

**Mot de passe par défaut:** `Test123456!`

### 8. seed-eleves-exemples.ts
**Version:** 1.0.0  
**Description:** Crée 34 élèves exemples répartis dans différentes classes  
**Paramètres:**
- `etablissementId: string`
- `anneeScolaireId: string`

**Mot de passe par défaut:** `Test123456!`

## 🚀 Exécution

### Exécuter tous les seeds

```bash
cd backend
npm run seed
# ou
npx ts-node -r tsconfig-paths/register src/database/seeds/run-seeds.ts
```

### Exécuter un seed individuel

```bash
# Seed des années scolaires
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-annees-scolaires.ts

# Seed des matières
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-matieres.ts

# Seed des élèves exemples
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-eleves-exemples.ts
```

## 📊 Ordre d'exécution

Le fichier `initial.seed.ts` orchestre l'exécution dans cet ordre:

1. ✅ Établissements (2 établissements)
2. ✅ Structure académique (cycles, niveaux, filières)
3. ✅ Années scolaires (3 années)
4. ✅ Classes (1 par niveau)
5. ✅ Matières (13 matières)
6. ✅ Matières-Niveaux (coefficients)
7. ✅ Configuration (modules, paramètres)
8. ✅ RBAC (rôles, permissions)
9. ✅ Super Admin
10. ✅ Groupes d'établissements
11. ✅ Chef établissement secondaire
12. ✅ Utilisateurs par rôle (38 utilisateurs)
13. ✅ Élèves exemples (34 élèves)

## 🏫 Données Créées

### Établissements
- **ETAB-001:** Lycée Bilingue eLISAschool (Biculturel)
- **ETAB-002:** Collège Privé Les Palmiers (Francophone)

### Structure Académique (par établissement)
- 4 cycles
- 28 niveaux (16 FR + 12 EN)
- 16 filières
- 34 spécialités techniques
- 7 examens nationaux
- 28 compétences APC

### Classes (par établissement)
- 34 classes (1 par niveau)

### Matières (par établissement)
- 13 matières de base
- ~100 associations matières-niveaux

### Utilisateurs
- 1 Super Admin (admin@elisaschool.cm / AdminSecret123!)
- 38 utilisateurs de test (mot de passe: Test123456!)
- 34 élèves exemples (mot de passe: Test123456!)

## 🔧 Configuration

### Variables d'environnement requises

```env
DB_HOST=localhost
DB_PORT=7002
DB_USER=elisaschool_user
DB_PASSWORD=elisaschool_password
DB_NAME=elisaschool
```

### Connexion à la base de données

Les seeds utilisent `AppDataSource` configuré dans `src/database/data-source.ts`.

## ⚠️ Notes Importantes

1. **Idempotence:** Tous les seeds sont idempotents - ils vérifient l'existence des données avant création
2. **Multi-tenant:** Toutes les données sont scopées par `etablissementId`
3. **Mot de passe:** Changez les mots de passe par défaut en production!
4. **Dépendances:** Certains seeds dépendent d'autres (ex: classes nécessitent années scolaires)

## 🐛 Dépannage

### Erreur de connexion
- Vérifiez les variables d'environnement
- Assurez-vous que PostgreSQL est en cours d'exécution

### Données déjà existantes
- Les seeds sont idempotents, ils skip les données existantes
- Pour reset: supprimer la base et re-run les seeds

### Erreur de dépendance
- Exécutez les seeds dans l'ordre recommandé
- Ou utilisez `runSeeds()` qui gère l'ordre

## 📝 Conventions

- Tous les seeds exportent une fonction nommée `seedXxx`
- Support multi-tenant avec `etablissementId` obligatoire
- Logging détaillé avec `logger`
- Gestion d'erreurs avec try/catch
- Exécution standalone possible via `require.main === module`

## 🔄 Maintenance

### Ajouter un nouveau seed

1. Créer le fichier `seed-nom-du-seed.ts`
2. Exporter la fonction principale
3. Ajouter l'exécution standalone
4. Importer et appeler dans `initial.seed.ts`
5. Mettre à jour ce README

### Modifier un seed existant

1. Incrémenter la version dans le header
2. Documenter les changements
3. Tester l'idempotence
4. Vérifier la compatibilité multi-tenant

## 📚 Ressources

- [TypeORM Documentation](https://typeorm.io/)
- [eLISAschool Backend](../../README.md)
- [Architecture Multi-Tenant](../../docs/architecture.md)
