# 📚 Guide de Gestion des Migrations et Index - eLISAschool

## 🎯 Vue d'ensemble

Ce document explique comment gérer les migrations de base de données et les index dans le projet eLISAschool.

---

## 📋 Migrations Disponibles

### Migrations de Schéma

| Migration | Description | Type |
|-----------|-------------|------|
| `002-multi-etablissements.sql` | Support multi-établissements | SQL |
| `003-audit-logs-archive.sql` | Archivage des logs d'audit | SQL |
| `003-role-limitations-etablissements.sql` | Limitations des rôles par établissement | SQL |
| `004-roles-systeme-educatif-africain.sql` | Rôles du système éducatif africain | SQL |
| `006-parametres-multi-etablissements.ts` | Paramètres multi-établissements | TypeScript |
| `007-consolider-configuration-app.ts` | Consolidation de la configuration | TypeScript |
| `008-drop-duplicate-index.ts` | **Suppression des index dupliqués** | TypeScript |

### Migration 008 - Focus

**Problème résolu:**
```
QueryFailedError: relation "IDX_0bf6f45eec40da903429d755d5" already exists
```

**Ce qu'elle fait:**
1. ✅ Vérifie si l'index existe
2. ✅ Supprime l'index dupliqué en toute sécurité
3. ✅ Affiche un rapport des index restants
4. ✅ Supporte le rollback complet

**Fichiers associés:**
- Migration: `src/database/migrations/008-drop-duplicate-index.ts`
- Script SQL: `fix-index.sql`
- Script bash: `scripts/fix-duplicate-index.sh`
- Analyse: `scripts/analyze-indexes.ts`

---

## 🚀 Commandes Utiles

### Gestion des Migrations

```bash
# Exécuter toutes les migrations en attente
npm run migration:run

# Annuler la dernière migration
npm run migration:revert

# Générer une nouvelle migration (après modification des entités)
npm run migration:generate src/database/migrations/NOM_MIGRATION
```

### Analyse et Correction des Index

```bash
# Analyser tous les index de la base de données
npm run db:analyze-indexes

# Exécuter le script de correction des index dupliqués
npm run db:fix-duplicate-index

# Ou manuellement
./scripts/fix-duplicate-index.sh
```

### Développement Quotidien

```bash
# Démarrer l'application en mode développement
npm run dev

# Build pour production
npm run build

# Linter le code
npm run lint
npm run lint:fix
```

---

## 🔍 Analyser les Index

Le script d'analyse détecte automatiquement :

1. **Tous les index** par table
2. **Les index dupliqués** (mêmes colonnes)
3. **Les index non utilisés** (potentiellement)
4. **Les recommandations** d'optimisation

### Exemple de sortie

```
🔍 Analyse des index de la base de données...

✅ Connecté à la base de données

📊 RAPPORT D'ANALYSE DES INDEX
============================================================
Tables analysées: 45
Total des index: 123
============================================================

�� Table: classes
   7 index(es)
   - IDX_classes_niveauId
   - IDX_classes_anneeScolaireId
   - IDX_classes_etablissementId
   ...

💡 RECOMMANDATIONS
============================================================
✅ Aucun doublon d'index détecté
```

---

## ⚠️ Problèmes Connus et Solutions

### 1. Index Dupliqué après Arrêt Brutal

**Symptôme:**
```
QueryFailedError: relation "IDX_xxxxx" already exists
```

**Cause:**
- `synchronize: true` est activé en développement
- L'application s'est arrêtée brutalement
- TypeORM a perdu le suivi des index existants

**Solutions (par ordre de préférence):**

#### Option 1: Exécuter la migration 008
```bash
npm run migration:run
```

#### Option 2: Script de correction
```bash
npm run db:fix-duplicate-index
```

#### Option 3: Correction manuelle
```bash
# Via psql
psql -h localhost -U elisaschool_user -d elisaschool -f fix-index.sql

# Ou directement
psql -h localhost -U elisaschool_user -d elisaschool \
  -c 'DROP INDEX IF EXISTS "IDX_0bf6f45eec40da903429d755d5";'
```

#### Option 4: Reconstruire la DB (dev uniquement)
```sql
DROP DATABASE elisaschool;
CREATE DATABASE elisaschool;
```

Puis redémarrer l'app (TypeORM recréera le schéma).

---

### 2. Synchronize vs Migrations

#### En Développement
```typescript
// src/config/database.config.ts
synchronize: true, // Acceptable en dev
```

**Avantages:**
- Rapide pour le développement
- Pas besoin de créer des migrations pour chaque changement

**Inconvénients:**
- Peut causer des erreurs d'index dupliqués
- Non fiable pour la production

#### En Production
```typescript
// src/config/database.config.ts
synchronize: false, // TOUJOURS false en prod
```

**Avantages:**
- Contrôle total sur les changements de schéma
- Traçabilité complète
- Possibilité de rollback

**Inconvénients:**
- Nécessite de créer des migrations manuellement

---

## 📝 Créer une Nouvelle Migration

### Étape 1: Modifier les entités

```typescript
// Exemple: Ajouter un index
@Entity('eleves')
@Index(['etablissementId', 'statut'])  // Nouvel index
export class Eleve {
    // ...
}
```

### Étape 2: Générer la migration

```bash
npm run migration:generate src/database/migrations/009-nouvelle-fonctionnalite
```

### Étape 3: Vérifier la migration

```bash
cat src/database/migrations/009-nouvelle-fonctionnalite.ts
```

### Étape 4: Exécuter la migration

```bash
npm run migration:run
```

### Étape 5: Tester le rollback

```bash
npm run migration:revert
npm run migration:run  # Re-exécuter
```

---

## 🛠️ Scripts Disponibles

### Dans `scripts/`

| Script | Description | Usage |
|--------|-------------|-------|
| `fix-duplicate-index.sh` | Corrige les index dupliqués | `./scripts/fix-duplicate-index.sh` |
| `analyze-indexes.ts` | Analyse complète des index | `npm run db:analyze-indexes` |

### À la racine de `backend/`

| Fichier | Description |
|---------|-------------|
| `fix-index.sql` | Script SQL brut pour supprimer l'index |
| `MIGRATIONS-GUIDE.md` | Ce guide |
| `README-FIX.md` | Guide rapide de correction |

---

## 🔧 Bonnes Pratiques

### ✅ À Faire

1. **Toujours tester les migrations** en développement avant la production
2. **Vérifier le rollback** de chaque migration
3. **Documenter** les changements importants
4. **Utiliser des noms descriptifs** pour les migrations
5. **Garder les migrations** dans le contrôle de version

### ❌ À Éviter

1. **Ne pas modifier** une migration après l'avoir exécutée en production
2. **Ne pas utiliser** `synchronize: true` en production
3. **Ne pas supprimer** les fichiers de migration
4. **Ne pas ignorer** les erreurs d'index dupliqués
5. **Ne pas mélanger** les modifications manuelles du schéma avec les migrations

---

## 📊 État Actuel du Projet

### Entités Corrigées

- ✅ `Classe` - Index correctement placés au niveau de la classe
- ✅ `Etablissement` et `EtablissementConfig` - Séparés pour éviter les références circulaires

### Index Explicites

Toutes les entités utilisent des `@Index` explicites au niveau de la classe :

```typescript
@Entity('classes')
@Index(['niveauId'])
@Index(['anneeScolaireId'])
@Index(['etablissementId'])
@Index(['etablissementId', 'anneeScolaireId'])
@Index(['etablissementId', 'niveauId'])
export class Classe {
    // ...
}
```

### Configuration TypeORM

```typescript
// src/config/database.config.ts
{
  synchronize: envConfig.app.isDevelopment, // true en dev, false en prod
  logging: envConfig.app.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
}
```

---

## 🆘 Dépannage

### La migration échoue avec "Cannot find package"

**Solution:** Utiliser ts-node au lieu de typeorm CLI directement

```bash
# Au lieu de:
typeorm migration:run -d src/database/data-source.ts

# Utiliser:
npx ts-node -r tsconfig-paths/register src/database/fix-index.ts
```

### La base de données n'est pas accessible

**Vérifier:**
1. PostgreSQL est-il démarré ?
2. Les variables d'environnement sont-elles correctes ?
3. Le host/port est-il correct dans `.env` ?

```bash
# Vérifier PostgreSQL
pg_isready -h localhost -p 5432

# Vérifier les variables
cat .env | grep DB_
```

### Conflit de migration

**Solution:** Vérifier quelles migrations ont été exécutées

```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

---

## 📞 Support

Pour toute question ou problème :

1. Vérifier ce guide
2. Consulter `README-FIX.md` pour les corrections rapides
3. Examiner les scripts dans `scripts/`
4. Vérifier les logs de l'application

---

## 📅 Historique des Modifications

| Date | Modification | Auteur |
|------|--------------|--------|
| 2026-06-06 | Création du guide + Migration 008 | xAI Éducation |
| 2026-06-06 | Correction entité Classe (index) | xAI Éducation |
| 2026-06-06 | Scripts d'analyse et correction | xAI Éducation |

