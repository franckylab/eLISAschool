#!/bin/bash
# Script d'exécution des migrations RH Personnel
# Usage: ./scripts/run-rh-migrations.sh

set -e

DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="elisaschool"
DB_USER="elisaschool_user"
export PGPASSWORD="elisaschool_dev_2024"

echo "====================================="
echo "Exécution des migrations RH Personnel"
echo "====================================="

MIGRATIONS=(
    "016-module-personnel-rh-phase1.sql"
    "017-module-personnel-rh-phase2.sql"
    "018-module-personnel-rh-phase3.sql"
    "019-module-personnel-rh-phase4.sql"
    "020-module-personnel-rh-phase5.sql"
    "021-module-personnel-rh-permissions-attribution.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo ""
    echo "-------------------------------------"
    echo "Exécution: $migration"
    echo "-------------------------------------"
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "backend/database/migrations/$migration" 2>&1 | grep -E "(ERROR|CREATE|INSERT|NOTICE)"; then
        echo "✓ $migration exécutée"
    else
        echo "✗ Erreur lors de l'exécution de $migration"
        exit 1
    fi
done

echo ""
echo "====================================="
echo "Toutes les migrations ont été exécutées avec succès !"
echo "====================================="

# Vérification
echo ""
echo "Vérification des tables créées:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name LIKE '%personnel%' OR table_name LIKE '%heure%' OR table_name LIKE '%contrat%' OR table_name LIKE '%absence%' OR table_name LIKE '%evaluation%' OR table_name LIKE '%progression%' OR table_name LIKE '%bulletin%'
ORDER BY table_name;
"

echo ""
echo "Vérification des permissions RH:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT COUNT(*) as total_permissions_rh
FROM permissions 
WHERE code LIKE 'rh_%';
"

echo ""
echo "Vérification des attributions de permissions:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT r.code as role, COUNT(*) as nb_permissions
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.code LIKE 'rh_%'
GROUP BY r.code
ORDER BY nb_permissions DESC;
"
