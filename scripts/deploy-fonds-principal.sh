#!/bin/bash

# ==================================
# eLISAschool - Nettoyage système fonds rotator / apparence
# ==================================
# Supprime définitivement le module apparence (fonds, fonds_etablissement,
# permissions, paramètres, actions audit FOND_*) au profit du fond principal
# unique (variantes dark/light servies par le backend).
#
# À exécuter sur staging/prod APRÈS le déploiement du code.
# Usage: DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD=... ./deploy-fonds-principal.sh
# Version: 1.0.0
# Auteur: franck arlos chendjou

set -e  # Arrêter en cas d'erreur

echo "===================================="
echo "Nettoyage système fonds rotator / apparence"
echo "===================================="
echo ""

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-postgres}"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de vérification
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# 1. Vérifier la connexion PostgreSQL
echo "1. Vérification de la connexion PostgreSQL..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1
check_result $? "Connexion PostgreSQL établie"
echo ""

# 2. Backup avant nettoyage
echo "2. Backup du schéma avant nettoyage..."
BACKUP_FILE="backups/schema-backup-fonds-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --schema-only > $BACKUP_FILE 2>&1
check_result $? "Backup créé: $BACKUP_FILE"
echo ""

# 3. Supprimer les tables fonds (si elles existent encore)
echo "3. Suppression des tables fonds / fonds_etablissement..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<'SQL'
DROP TABLE IF EXISTS fonds_etablissement CASCADE;
DROP TABLE IF EXISTS fonds CASCADE;
SQL
check_result $? "Tables fonds supprimées"
echo ""

# 4. Supprimer les paramètres système fonds.*
echo "4. Suppression des paramètres système fonds.*..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DELETE FROM parametres_systeme WHERE cle LIKE 'fonds.%';"
check_result $? "Paramètres fonds.* supprimés"
echo ""

# 5. Supprimer les permissions apparence:* et audit:apparence:view + liens rôles
echo "5. Suppression des permissions apparence:* / audit:apparence:view..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<'SQL'
DELETE FROM role_permissions
WHERE "permissionId" IN (
    SELECT id FROM permissions
    WHERE code LIKE 'apparence:%' OR code LIKE 'audit:apparence%'
);
DELETE FROM permissions
WHERE code LIKE 'apparence:%' OR code LIKE 'audit:apparence%';
SQL
check_result $? "Permissions apparence supprimées (code + liens rôles)"
echo ""

# 6. Vérifications finales
echo "6. Vérifications finales..."
RESULT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tA -c "
SELECT 'tables=' || (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('fonds','fonds_etablissement'))
     || ' perms=' || (SELECT count(*) FROM permissions WHERE code LIKE 'apparence:%' OR code LIKE 'audit:apparence%')
     || ' params=' || (SELECT count(*) FROM parametres_systeme WHERE cle LIKE 'fonds.%');
")
echo "  $RESULT"
if [[ "$RESULT" == *"tables=0"* && "$RESULT" == *"perms=0"* && "$RESULT" == *"params=0"* ]]; then
    echo -e "${GREEN}✓ Nettoyage complet${NC}"
else
    echo -e "${YELLOW}⚠️  Résidus détectés (voir valeurs non nulles)${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}✅ Nettoyage fonds/apparence terminé${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo "Rappel : le fond principal unique est servi par le backend via le bloc"
echo "statique /fonds-principal (voir docker/nginx.conf, location ^~ /fonds-principal)."
