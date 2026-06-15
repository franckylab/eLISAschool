#!/bin/bash

# ==================================
# eLISAschool - Déploiement Module Salles
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Script de déploiement complet du module salles
# ==================================

set -e  # Arrêter en cas d'erreur

echo "======================================"
echo "🏫 eLISAschool - Module Salles"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-elisaschool}"
MIGRATION_FILE="backend/database/migrations/070-module-salles.sql"

# Vérifier si le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Erreur: Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Étapes de déploiement:${NC}"
echo "  1. Exécuter la migration SQL"
echo "  2. Vérifier la création de la table"
echo "  3. Vérifier les seeds"
echo "  4. Tester l'API"
echo ""

# Étape 1: Exécuter la migration
echo -e "${YELLOW}📝 Étape 1: Exécution de la migration...${NC}"
if command -v docker &> /dev/null && docker ps | grep -q postgres; then
    echo "  → Utilisation de Docker..."
    docker exec -i $(docker ps -q -f name=postgres) psql -U $DB_USER -d $DB_NAME < $MIGRATION_FILE
else
    echo "  → Exécution directe..."
    psql -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE
fi
echo -e "${GREEN}✅ Migration exécutée${NC}"
echo ""

# Étape 2: Vérifier la table
echo -e "${YELLOW}🔍 Étape 2: Vérification de la table...${NC}"
if command -v docker &> /dev/null && docker ps | grep -q postgres; then
    docker exec -i $(docker ps -q -f name=postgres) psql -U $DB_USER -d $DB_NAME -c "
        SELECT 
            'salles' as table_name,
            COUNT(*) as row_count
        FROM salles;
    "
else
    psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as salle_count FROM salles;"
fi
echo ""

# Étape 3: Vérifier les indexes
echo -e "${YELLOW}📊 Étape 3: Vérification des indexes...${NC}"
if command -v docker &> /dev/null && docker ps | grep -q postgres; then
    docker exec -i $(docker ps -q -f name=postgres) psql -U $DB_USER -d $DB_NAME -c "
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename = 'salles' 
        ORDER BY indexname;
    "
else
    psql -U $DB_USER -d $DB_NAME -c "\di salles*"
fi
echo ""

# Étape 4: Vérifier la relation FK
echo -e "${YELLOW}🔗 Étape 4: Vérification de la FK emploi_du_temps.salle_id...${NC}"
if command -v docker &> /dev/null && docker ps | grep -q postgres; then
    docker exec -i $(docker ps -q -f name=postgres) psql -U $DB_USER -d $DB_NAME -c "
        SELECT 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'emploi_du_temps'
            AND kcu.column_name = 'salle_id';
    "
else
    psql -U $DB_USER -d $DB_NAME -c "
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'emploi_du_temps' 
            AND constraint_type = 'FOREIGN KEY';
    "
fi
echo ""

# Résumé
echo -e "${GREEN}======================================"
echo "✅ Déploiement terminé avec succès !"
echo "======================================${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes :${NC}"
echo "  1. Redémarrer le backend si nécessaire"
echo "  2. Tester l'API: GET /api/salles"
echo "  3. Créer des salles via l'interface"
echo ""
echo -e "${YELLOW}🔗 Endpoints disponibles :${NC}"
echo "  • GET    /api/salles              # Lister les salles"
echo "  • GET    /api/salles/:id          # Détail"
echo "  • GET    /api/salles/disponibles  # Salles disponibles"
echo "  • GET    /api/salles/statistiques # Statistiques"
echo "  • POST   /api/salles              # Créer"
echo "  • PATCH  /api/salles/:id          # Modifier"
echo "  • DELETE /api/salles/:id          # Supprimer"
echo ""
