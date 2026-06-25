#!/bin/bash
# ==================================
# eLISAschool - Exécution Migration 082
# ==================================
# Fix contrainte unique preferences_utilisateur
# ==================================

echo "🔧 Exécution de la migration 082: Fix contrainte unique preferences..."

# Vérifier si Docker est disponible
if command -v docker &> /dev/null; then
    echo "🐳 Tentative via Docker..."
    
    # Trouver le container PostgreSQL
    PG_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
    
    if [ -n "$PG_CONTAINER" ]; then
        echo "✅ Container trouvé: $PG_CONTAINER"
        docker cp backend/database/migrations/082-fix-contrainte-unique-preferences.sql "$PG_CONTAINER":/tmp/migration082.sql
        docker exec -u postgres "$PG_CONTAINER" psql -d elisaschool -f /tmp/migration082.sql
        docker exec "$PG_CONTAINER" rm /tmp/migration082.sql
    else
        echo "❌ Aucun container PostgreSQL trouvé"
        echo "💡 Démarrage avec docker-compose..."
        docker-compose up -d postgres
        sleep 10
        exec "$0"
    fi
else
    echo "📝 Exécution directe (PostgreSQL local requis)..."
    PGPASSWORD="${DB_PASSWORD:-postgres}" psql -U "${DB_USER:-postgres}" -h "${DB_HOST:-localhost}" -d "${DB_NAME:-elisaschool}" -f backend/database/migrations/082-fix-contrainte-unique-preferences.sql
fi

echo "✅ Migration 082 terminée !"
