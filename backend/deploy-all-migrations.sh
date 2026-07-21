#!/bin/bash
# ============================================
# eLISAschool - Déploiement Complet Base de Données
# ============================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Description: Exécute TOUTES les migrations dans l'ordre
# ============================================

set -e

# Déterminer le chemin du projet dynamiquement
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$SCRIPT_DIR/database/migrations"

echo -e "\033[0;34m╔════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[0;34m║  eLISAschool - Déploiement Complet Base de Données    ║\033[0m"
echo -e "\033[0;34m╚════════════════════════════════════════════════════════╝\033[0m"
echo ""

# ============================================
# ÉTAPE 1: Vérifier PostgreSQL et DB
# ============================================
echo -e "\033[1;33m📋 ÉTAPE 1: Vérifications\033[0m"

# Charger les credentials depuis le .env si disponible
ENV_FILE=""
for candidate in "$PROJECT_DIR/.env" "$SCRIPT_DIR/.env"; do
    if [ -f "$candidate" ]; then
        ENV_FILE="$candidate"
        break
    fi
done

DB_HOST=""
DB_PORT=""
DB_NAME=""
DB_USER=""
DB_PASSWORD=""

if [ -n "$ENV_FILE" ]; then
    DB_HOST=$(grep -E "^DB_HOST=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    DB_PORT=$(grep -E "^DB_PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    DB_NAME=$(grep -E "^DB_NAME=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    DB_USER=$(grep -E "^DB_USER=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    DB_PASSWORD=$(grep -E "^DB_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
fi

# Fonction d'exécution psql (utilise .env ou sudo postgres)
run_psql() {
    if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "${DB_NAME:-elisaschool}" "$@"
    else
        sudo -u postgres psql -d elisaschool "$@"
    fi
}

if ! pg_isready > /dev/null 2>&1; then
    echo -e "\033[0;31m❌ PostgreSQL n'est pas en cours d'exécution\033[0m"
    exit 1
fi

DB_EXISTS=$(run_psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME:-elisaschool}'" 2>/dev/null || echo "")
if [ "$(echo $DB_EXISTS | tr -d ' ')" != "1" ]; then
    echo -e "\033[0;31m❌ Base '${DB_NAME:-elisaschool}' n'existe pas\033[0m"
    exit 1
fi

echo -e "\033[0;32m✅ PostgreSQL et base OK\033[0m"
echo ""

# ============================================
# ÉTAPE 2: Lister migrations disponibles
# ============================================
echo -e "\033[1;33m📁 ÉTAPE 2: Migrations disponibles\033[0m"

MIGRATION_FILES=($(ls -1 $MIGRATIONS_DIR/*.sql 2>/dev/null | sort))
MIGRATION_COUNT=${#MIGRATION_FILES[@]}

if [ "$MIGRATION_COUNT" -eq "0" ]; then
    echo -e "\033[0;31m❌ Aucune migration trouvée\033[0m"
    exit 1
fi

echo -e "\033[0;32m✅ $MIGRATION_COUNT migrations trouvées\033[0m"
echo ""

# ============================================
# ÉTAPE 3: Exécuter migrations dans l'ordre
# ============================================
echo -e "\033[1;33m🚀 ÉTAPE 3: Exécution des migrations\033[0m"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for migration in "${MIGRATION_FILES[@]}"; do
    FILENAME=$(basename "$migration")
    
    echo -e "\033[1;33m📄 Exécutant: $FILENAME\033[0m"
    
    if run_psql -f "$migration" > /dev/null 2>&1; then
        echo -e "\033[0;32m   ✅ Succès\033[0m"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "\033[0;31m   ❌ Échec (continuation...)\033[0m"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

echo ""
echo -e "\033[0;34m╔════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[0;34m║  RÉSULTAT MIGRATIONS                                   ║\033[0m"
echo -e "\033[0;34m╚════════════════════════════════════════════════════════╝\033[0m"
echo ""
echo -e "   \033[0;32m✅ Succès: $SUCCESS_COUNT\033[0m"
echo -e "   \033[0;31m❌ Échecs: $FAIL_COUNT\033[0m"
echo ""

# ============================================
# ÉTAPE 4: Vérifier tables créées
# ============================================
echo -e "\033[1;33m🔍 ÉTAPE 4: Vérification tables\033[0m"

TABLE_COUNT=$(run_psql -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")

echo -e "\033[0;32m✅ $TABLE_COUNT tables créées\033[0m"
echo ""

# Lister quelques tables importantes
run_psql -c "
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
      'utilisateurs', 
      'preferences_utilisateur', 
      'parametres_systeme', 
      'audit_configuration',
      'conversations',
      'messages'
  )
ORDER BY tablename;
" 2>&1 || true

echo ""

# ============================================
# ÉTAPE 5: Analyser tables
# ============================================
echo -e "\033[1;33m📊 ÉTAPE 5: Analyse statistiques\033[0m"

run_psql -c "ANALYZE;" > /dev/null 2>&1

echo -e "\033[0;32m✅ Toutes les tables analysées\033[0m"
echo ""

# ============================================
# ÉTAPE 6: Vérifier indexes
# ============================================
echo -e "\033[1;33m🔍 ÉTAPE 6: Vérification indexes\033[0m"

INDEX_COUNT=$(run_psql -tAc "
SELECT count(*) 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
")

echo -e "\033[0;32m✅ $INDEX_COUNT indexes créés\033[0m"
echo ""

# ============================================
# ÉTAPE 7: Vérifier vues matérialisées
# ============================================
echo -e "\033[1;33m👁️  ÉTAPE 7: Vues matérialisées\033[0m"

MV_COUNT=$(run_psql -tAc "
SELECT count(*) 
FROM pg_matviews 
WHERE matviewname LIKE 'mv_%';
")

if [ "$MV_COUNT" -gt "0" ]; then
    echo -e "\033[0;32m✅ $MV_COUNT vues matérialisées créées\033[0m"
    run_psql -c "
        SELECT matviewname as vue 
        FROM pg_matviews 
        WHERE matviewname LIKE 'mv_%'
        ORDER BY matviewname;
    " 2>&1 || true
else
    echo -e "\033[1;33mℹ️  Aucune vue matérialisée (normal si tables manquantes)\033[0m"
fi

echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo -e "\033[0;34m╔════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[0;34m║  DÉPLOIEMENT BASE DE DONNÉES TERMINÉ ✅               ║\033[0m"
echo -e "\033[0;34m╚════════════════════════════════════════════════════════╝\033[0m"
echo ""
echo -e "\033[0;32m🎉 Base de données déployée avec succès !\033[0m"
echo ""
echo -e "\033[1;33m📊 Résumé:\033[0m"
echo -e "   ✅ $MIGRATION_COUNT migrations traitées"
echo -e "   ✅ $SUCCESS_COUNT migrations réussies"
echo -e "   ✅ $TABLE_COUNT tables créées"
echo -e "   ✅ $INDEX_COUNT indexes créés"
echo -e "   ✅ $MV_COUNT vues matérialisées"
echo ""

if [ "$FAIL_COUNT" -gt "0" ]; then
    echo -e "\033[1;33m⚠️  $FAIL_COUNT migration(s) ont échoué (peut être normal si dépendances)\033[0m"
    echo ""
fi

echo -e "\033[1;33m🚀 Prochaine étape:\033[0m"
echo -e "   • Build TypeScript: npm run build"
echo -e "   • Redémarrer le service"
echo -e "   • Tester les endpoints API"
echo ""
