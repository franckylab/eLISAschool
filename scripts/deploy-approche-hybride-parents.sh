#!/bin/bash
# ==================================
# eLISAschool - Script de migration: Approche hybride parents-élèves
# ==================================
# Version: 1.0.0
# Date: 2026-06-10
# 
# Description: Exécute la migration 052 pour l'approche hybride parents-élèves
# ==================================

set -e

echo "========================================"
echo "Migration 052: Approche hybride parents-élèves"
echo "========================================"
echo ""

# Vérifier que le fichier de migration existe
MIGRATION_FILE="backend/database/migrations/052-approche-hybride-parents.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erreur: Fichier de migration non trouvé: $MIGRATION_FILE"
    exit 1
fi

echo "✅ Fichier de migration trouvé: $MIGRATION_FILE"
echo ""

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erreur: Docker n'est pas en cours d'exécution"
    exit 1
fi

echo "✅ Docker est en cours d'exécution"
echo ""

# Trouver le conteneur PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Erreur: Conteneur PostgreSQL non trouvé"
    echo "Veuillez démarrer les conteneurs avec: docker compose up -d"
    exit 1
fi

echo "✅ Conteneur PostgreSQL trouvé: $POSTGRES_CONTAINER"
echo ""

# Exécuter la migration
echo "🔄 Exécution de la migration..."
docker exec -i "$POSTGRES_CONTAINER" psql -U elisaschool -d elisaschool < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration exécutée avec succès!"
    echo ""
    echo "========================================"
    echo "Vérification de la migration"
    echo "========================================"
    echo ""
    
    # Vérifier les commentaires de dépréciation
    echo "📋 Vérification des commentaires de dépréciation:"
    docker exec -i "$POSTGRES_CONTAINER" psql -U elisaschool -d elisaschool -c "
        SELECT obj_description(oid) as description
        FROM pg_class 
        WHERE relname = 'eleves'
    " 2>/dev/null || echo "   (Vérification manuelle requise)"
    
    echo ""
    echo "📊 Statistiques de migration:"
    docker exec -i "$POSTGRES_CONTAINER" psql -U elisaschool -d elisaschool -c "
        SELECT * FROM v_stats_migration_parents;
    " 2>/dev/null || echo "   Vue non créée ou erreur"
    
    echo ""
    echo "========================================"
    echo "Migration terminée!"
    echo "========================================"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Redémarrer le backend: docker compose restart backend"
    echo "2. Tester la conversion d'une préinscription"
    echo "3. Vérifier les logs: docker compose logs -f backend | grep Migration"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de l'exécution de la migration"
    exit 1
fi
