#\!/bin/bash
# ==================================
# eLISAschool - Correction automatique de l'index dupliqué
# ==================================

echo "🔧 Correction de l'index dupliqué..."
echo ""

# Charger les variables d'environnement
if [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | xargs)
elif [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Valeurs par défaut
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-elisaschool}
DB_USER=${DB_USER:-elisaschool_user}
DB_PASSWORD=${DB_PASSWORD:-}

echo "📊 Connexion à la base de données:"
echo "   Hôte: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Base: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Exécuter la suppression de l'index
export PGPASSWORD="$DB_PASSWORD"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'
BEGIN;

DROP INDEX IF EXISTS "IDX_0bf6f45eec40da903429d755d5";

SELECT '✅ Index dupliqué supprimé avec succès \!' as status;

COMMIT;
SQL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Correction terminée \!"
    echo ""
    echo "💡 Vous pouvez maintenant démarrer l'application :"
    echo "   npm run dev"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de la correction"
    echo ""
    echo "💡 Exécutez manuellement le script SQL :"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f fix-index.sql"
    echo ""
    exit 1
fi
