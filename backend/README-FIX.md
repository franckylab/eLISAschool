# 🔧 Correction de l'Index Dupliqué - Instructions

## ❌ Problème
```
QueryFailedError: relation "IDX_0bf6f45eec40da903429d755d5" already exists
```

## ✅ Solution Rapide

### Option 1: Script automatique (Recommandé)

```bash
cd /home/franckylab/projets/eLISAschool/backend
./scripts/fix-duplicate-index.sh
```

Ce script va:
1. Charger vos variables d'environnement depuis `.env`
2. Se connecter à PostgreSQL
3. Supprimer l'index dupliqué
4. Confirmer la correction

### Option 2: Exécution manuelle avec psql

```bash
cd /home/franckylab/projets/eLISAschool/backend
psql -h localhost -U elisaschool_user -d elisaschool -f fix-index.sql
```

Ou si PostgreSQL est sur un autre hôte/port:
```bash
psql -h VOTRE_HOST -p VOTRE_PORT -U VOTRE_USER -d VOTRE_BASE -f fix-index.sql
```

### Option 3: Commande SQL directe

Connectez-vous à PostgreSQL et exécutez:

```sql
DROP INDEX IF EXISTS "IDX_0bf6f45eec40da903429d755d5";
```

### Option 4: Via Docker (si PostgreSQL tourne dans un conteneur)

```bash
# Si vous utilisez docker-compose
docker-compose exec postgres psql -U elisaschool_user -d elisaschool -c 'DROP INDEX IF EXISTS "IDX_0bf6f45eec40da903429d755d5";'

# Ou avec docker exec
docker exec -it VOTRE_CONTENEUR_POSTGRES psql -U elisaschool_user -d elisaschool -c 'DROP INDEX IF EXISTS "IDX_0bf6f45eec40da903429d755d5";'
```

## 🚀 Après la Correction

Redémarrez l'application:

```bash
cd /home/franckylab/projets/eLISAschool/backend
npm run dev
```

L'application devrait maintenant démarrer sans erreur.

## 📝 Fichiers Créés

1. **fix-index.sql** - Script SQL pour supprimer l'index
2. **scripts/fix-duplicate-index.sh** - Script bash automatique
3. **src/database/migrations/008-drop-duplicate-index.ts** - Migration TypeORM
4. **src/database/fix-index.ts** - Script TypeScript (non utilisé)
5. **src/modules/classes/entities/classe.entity.ts** - Entité corrigée (index bien placés)

## 🔍 Vérification

Pour vérifier que l'index a été supprimé:

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname = 'IDX_0bf6f45eec40da903429d755d5';
```

Cette requête ne doit retourner aucun résultat.

## 💡 Pourquoi cette erreur?

TypeORM avec `synchronize: true` essaie de synchroniser le schéma à chaque démarrage. Si:
- L'application s'est arrêtée brutalement
- Le schéma a été modifié manuellement
- Les fichiers de cache sont corrompus

...alors TypeORM peut perdre le suivi des index existants et essayer de les recréer.

## 🎯 Solution Long Terme

En production, désactivez `synchronize` et utilisez des migrations:

```typescript
// src/config/database.config.ts
synchronize: false, // Toujours false en production
```
