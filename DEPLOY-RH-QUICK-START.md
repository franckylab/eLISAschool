# 🚀 Commandes de Déploiement Rapide - Module RH Personnel

## Déploiement en 3 Étapes

```bash
# Étape 1: Naviguer vers le backend
cd /home/franckylab/projets/eLISAschool/backend

# Étape 2: Exécuter la migration
psql $DATABASE_URL -f database/migrations/046-types-contrat-personnalises.sql

# Étape 3: Redémarrer le serveur
docker-compose restart backend
# OU si PM2: pm2 restart backend
```

## Vérification Rapide

```bash
# Vérifier les tables créées
psql $DATABASE_URL -c "SELECT COUNT(*) as types FROM types_contrat_personnalises;"
psql $DATABASE_URL -c "SELECT COUNT(*) as affectations FROM affectations_postes;"

# Vérifier les permissions
psql $DATABASE_URL -c "SELECT code FROM permissions WHERE code LIKE 'rh_%contrat%' OR code LIKE 'rh_%affectation%';"

# Tester un endpoint
curl http://localhost:3000/api/personnel/types-contrat/actifs \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## Rollback (si nécessaire)

```bash
# Supprimer les tables (ATTENTION: perte de données)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS affectations_postes CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS types_contrat_personnalises CASCADE;"

# Supprimer les colonnes ajoutées
psql $DATABASE_URL -c "ALTER TABLE contrats_personnel DROP COLUMN IF EXISTS type_contrat_id;"
psql $DATABASE_URL -c "ALTER TABLE contrats_personnel DROP COLUMN IF EXISTS poste_id;"
psql $DATABASE_URL -c "ALTER TABLE contrats_personnel DROP COLUMN IF EXISTS unite_organisationnelle_id;"
```

## Endpoints à Tester

```bash
# Types de contrat
GET    /api/personnel/types-contrat/actifs
POST   /api/personnel/types-contrat

# Affectations
POST   /api/personnel/affectations
GET    /api/personnel/membres/:id/affectations/historique

# Parcours professionnel
GET    /api/personnel/membres/:id/parcours-complet
```

## Script Automatisé (Recommandé)

```bash
cd /home/franckylab/projets/eLISAschool/backend
../scripts/deploy-types-contrat-affectations.sh
```

---

**⚠️ IMPORTANT**: Toujours faire un backup avant de déployer en production !
