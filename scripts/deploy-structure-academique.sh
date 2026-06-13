#!/bin/bash
# ==================================
# eLISAschool - Déploiement Structure Académique
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Applique la migration et seed les données académiques

set -e

echo "=========================================="
echo "🎓 Déploiement Structure Académique"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
MIGRATION_FILE="database/migrations/053-structure-academique-complete.sql"
SEED_FILE="dist/backend/src/database/seeds/seed-structure-academique.js"

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis le répertoire backend/${NC}"
    exit 1
fi

# Étape 1: Vérifier la migration
echo -e "${YELLOW}📋 Étape 1: Vérification de la migration...${NC}"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migration trouvée${NC}"
echo ""

# Étape 2: Appliquer la migration
echo -e "${YELLOW}🗄️  Étape 2: Application de la migration SQL...${NC}"
echo "Fichier: $MIGRATION_FILE"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Cette migration va:${NC}"
echo "   - Créer 4 nouvelles tables (types_cycles, filieres, examens_nationaux, diplomes_eleves)"
echo "   - Modifier 2 tables existantes (cycles, niveaux)"
echo "   - Insérer des données par défaut"
echo ""
read -p "Continuer ? (o/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}⏹️  Annulé par l'utilisateur${NC}"
    exit 0
fi

# Vérifier les variables d'environnement
if [ -f "../.env" ]; then
    export $(cat ../.env | grep -v '#' | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-7002}
DB_NAME=${DB_NAME:-elisaschool}
DB_USER=${DB_USER:-elisaschool_user}

echo ""
echo "Connexion à: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Appliquer la migration
if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE
    echo -e "${GREEN}✅ Migration appliquée avec succès${NC}"
else
    echo -e "${RED}❌ PostgreSQL client (psql) non trouvé${NC}"
    echo "Installez-le ou appliquez la migration manuellement"
    exit 1
fi
echo ""

# Étape 3: Compiler le TypeScript
echo -e "${YELLOW}🔨 Étape 3: Compilation TypeScript...${NC}"
npm run build
echo -e "${GREEN}✅ Compilation terminée${NC}"
echo ""

# Étape 4: Exécuter le seed
echo -e "${YELLOW}🌱 Étape 4: Exécution du seed des données académiques...${NC}"
if [ -f "$SEED_FILE" ]; then
    node -e "
        const { seedStructureAcademique } = require('./$SEED_FILE');
        seedStructureAcademique()
            .then(() => {
                console.log('✅ Seed terminé avec succès');
                process.exit(0);
            })
            .catch((err) => {
                console.error('❌ Erreur lors du seed:', err);
                process.exit(1);
            });
    "
else
    echo -e "${YELLOW}⚠️  Fichier seed non trouvé: $SEED_FILE${NC}"
    echo "Exécutez manuellement: npx ts-node src/database/seeds/seed-structure-academique.ts"
fi
echo ""

# Étape 5: Vérification
echo -e "${YELLOW}🔍 Étape 5: Vérification des données...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 'Types de cycles' as table_name, COUNT(*) as count FROM types_cycles
UNION ALL
SELECT 'Cycles', COUNT(*) FROM cycles
UNION ALL
SELECT 'Niveaux', COUNT(*) FROM niveaux
UNION ALL
SELECT 'Filières', COUNT(*) FROM filieres
UNION ALL
SELECT 'Examens nationaux', COUNT(*) FROM examens_nationaux;
"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Déploiement terminé avec succès !"
echo "=========================================="
echo ""
echo "Prochaines étapes :"
echo "1. Redémarrez le backend: npm run dev"
echo "2. Testez les API:"
echo "   - GET /api/types-cycles"
echo "   - GET /api/filieres"
echo "   - GET /api/examens-nationaux"
echo "   - GET /api/diplomes-eleves"
echo ""
echo "Documentation: GUIDE-STRUCTURE-ACADEMIQUE.md"
echo -e "${NC}"
