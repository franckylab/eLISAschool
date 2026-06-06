#!/bin/bash

# ==================================
# eLISAschool - Exécution des Index de Performance
# ==================================
# Ce script exécute le script SQL de création d'index

echo "========================================="
echo "🗄️  Création des Index de Performance"
echo "========================================="
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Vérifier les variables requises
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non défini dans .env"
    echo ""
    echo "Format attendu :"
    echo "DATABASE_URL=postgres://user:password@localhost:5432/elisaschool"
    exit 1
fi

echo "✅ DATABASE_URL détecté"
echo ""

# Extraire les informations de connexion
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*//\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's|.*//[^:]*:\([^@]*\)@.*|\1|p')

echo "📊 Connexion à la base de données :"
echo "   Hôte : $DB_HOST"
echo "   Port : $DB_PORT"
echo "   Base : $DB_NAME"
echo "   Utilisateur : $DB_USER"
echo ""

# Vérifier la connexion
echo "🔍 Vérification de la connexion..."
if command -v psql &> /dev/null; then
    PSQL_CMD="psql"
elif command -v pg_isready &> /dev/null; then
    echo "✅ PostgreSQL disponible"
    PSQL_CMD="psql"
else
    echo "⚠️  psql non trouvé. Veuillez installer PostgreSQL client."
    echo ""
    echo "Alternative : Exécuter manuellement le script SQL :"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/009-performance-indexes.sql"
    exit 1
fi

# Exécuter le script SQL
echo ""
echo "🚀 Exécution du script de création d'index..."
echo "   Fichier : backend/database/migrations/009-performance-indexes.sql"
echo ""

export PGPASSWORD=$DB_PASSWORD

$PSQL_CMD -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/009-performance-indexes.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Index créés avec succès !"
    echo "========================================="
    echo ""
    echo "📊 Pour vérifier les index créés :"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';\""
    echo ""
    echo "📈 Pour voir les statistiques d'utilisation :"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT tablename, indexname, idx_scan FROM pg_stat_user_indexes WHERE indexname LIKE 'idx_%' ORDER BY idx_scan DESC;\""
    echo ""
else
    echo ""
    echo "========================================="
    echo "❌ Erreur lors de la création des index"
    echo "========================================="
    echo ""
    echo "Vérifiez :"
    echo "  1. La connexion à la base de données"
    echo "  2. Les permissions de l'utilisateur"
    echo "  3. Que les tables existent déjà"
    echo ""
    exit 1
fi
