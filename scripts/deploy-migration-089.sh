#!/bin/bash

# ==================================
# eLISAschool - Script de Déploiement Migration 089
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou

echo "========================================"
echo "eLISAschool - Migration 089"
echo "Finalisation Architecture Académique v2"
echo "========================================"
echo ""

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-postgres}"
MIGRATION_FILE="backend/database/migrations/089-finalisation-architecture-academique-v2.sql"

# Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ ERREUR: Fichier de migration non trouvé: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Fichier de migration: $MIGRATION_FILE"
echo "🗄️  Base de données: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# Demander confirmation
read -p "⚠️  Voulez-vous exécuter cette migration? (oui/non): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    echo "❌ Migration annulée"
    exit 0
fi

echo ""
echo "🚀 Exécution de la migration..."
echo ""

# Exécuter la migration
PGPASSWORD=${DB_PASSWORD} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration 089 exécutée avec succès!"
    echo ""
    echo "📊 Vérification des résultats..."
    echo ""
    
    # Vérifier la table configurations_scoring
    PGPASSWORD=${DB_PASSWORD} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 'configurations_scoring' as table_name, COUNT(*) as count 
        FROM configurations_scoring;
    "
    
    # Vérifier la permission
    PGPASSWORD=${DB_PASSWORD} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 'permission' as type, code, libelle 
        FROM permissions 
        WHERE code = 'notes:modifier_apres_cloture';
    "
    
    # Vérifier les index
    PGPASSWORD=${DB_PASSWORD} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE indexname IN (
            'idx_edt_affectation_matiere',
            'idx_bulletins_classe_annee',
            'idx_ae_classe_annee_final',
            'idx_cs_etablissement',
            'idx_cs_annee',
            'idx_cs_unique_etab_annee'
        )
        ORDER BY tablename;
    "
    
    echo ""
    echo "🎉 Migration terminée!"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Vérifier les logs de l'application"
    echo "   2. Tester les nouveaux endpoints API"
    echo "   3. Mettre à jour le frontend si nécessaire"
    echo ""
else
    echo ""
    echo "❌ ERREUR lors de l'exécution de la migration"
    echo "   Veuillez vérifier les messages d'erreur ci-dessus"
    exit 1
fi
