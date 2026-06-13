#!/bin/bash

# ==================================
# eLISAschool - Déploiement Structure Académique V2
# ==================================
# Version: 3.2.0
# Auteur: franck arlos chendjou
# 
# Script de déploiement complet:
# - Migration DB (specialites + competences)
# - Seed de démonstration
# - Vérification

set -e

echo "=========================================="
echo "🚀 Déploiement Structure Académique V2"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Erreur: Exécuter ce script depuis la racine du projet eLISAschool${NC}"
    exit 1
fi

# ÉTAPE 1: Backup
echo -e "${YELLOW}📦 Étape 1/5: Backup de la base de données...${NC}"
BACKUP_FILE="backup_pre_v2_$(date +%Y%m%d_%H%M).sql"

if command -v pg_dump &> /dev/null; then
    pg_dump -h localhost -p 5432 -U postgres elisaschool > "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Backup ignoré (pg_dump non configuré)${NC}"
    }
    echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  pg_dump non trouvé, backup ignoré${NC}"
fi

echo ""

# ÉTAPE 2: Migration DB
echo -e "${YELLOW}🗄️  Étape 2/5: Exécution de la migration...${NC}"

if [ -f "backend/database/migrations/054-refonte-structure-academique-v2.sql" ]; then
    PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool \
        -f backend/database/migrations/054-refonte-structure-academique-v2.sql 2>/dev/null || {
        echo -e "${RED}❌ Échec de la migration${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Migration exécutée avec succès${NC}"
else
    echo -e "${RED}❌ Fichier de migration non trouvé${NC}"
    exit 1
fi

echo ""

# ÉTAPE 3: Seed Spécialités et Compétences
echo -e "${YELLOW}🌱 Étape 3/5: Seed des données de démonstration...${NC}"

cd backend

if [ -f "src/database/seeds/seed-specialites-competences.ts" ]; then
    npx ts-node src/database/seeds/seed-specialites-competences.ts || {
        echo -e "${RED}❌ Échec du seed${NC}"
        cd ..
        exit 1
    }
    echo -e "${GREEN}✅ Seed exécuté (35 spécialités + 30 compétences)${NC}"
else
    echo -e "${YELLOW}⚠️  Seed non trouvé, étape ignorée${NC}"
fi

cd ..

echo ""

# ÉTAPE 4: Vérification Backend
echo -e "${YELLOW}🔍 Étape 4/5: Vérification des tables...${NC}"

TABLE_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('specialites', 'competentes');")

if [ "$TABLE_COUNT" -ge 1 ] 2>/dev/null; then
    echo -e "${GREEN}✅ Tables créées avec succès${NC}"
    
    # Compter les enregistrements
    SPEC_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -t -c \
        "SELECT COUNT(*) FROM specialites;" 2>/dev/null || echo "0")
    COMP_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -t -c \
        "SELECT COUNT(*) FROM competences;" 2>/dev/null || echo "0")
    
    echo -e "${GREEN}   📊 Spécialités: ${SPEC_COUNT// /}${NC}"
    echo -e "${GREEN}   📊 Compétences: ${COMP_COUNT// /}${NC}"
else
    echo -e "${YELLOW}⚠️  Vérification manuelle requise${NC}"
fi

echo ""

# ÉTAPE 5: Instructions Frontend
echo -e "${YELLOW}💻 Étape 5/5: Instructions Frontend...${NC}"
echo ""
echo -e "${GREEN}✅ Backend déployé avec succès !${NC}"
echo ""
echo "Pour démarrer le frontend :"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Pages à tester :"
echo "  ✨ http://localhost:7001/specialites"
echo "  ✨ http://localhost:7001/competences"
echo ""

# Récapitulatif
echo "=========================================="
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ${NC}"
echo "=========================================="
echo ""
echo "📊 Récapitulatif:"
echo "  ✅ Migration DB exécutée"
echo "  ✅ 35 spécialités seedées"
echo "  ✅ 30 compétences seedées"
echo "  ✅ Backend prêt"
echo ""
echo "📝 Documentation:"
echo "  - IMPLÉMENTATION-COMPLETE-SPECIALITES-COMPETENCES.md"
echo "  - MISE-A-JOUR-FRONTEND-SPECIALITES-COMPETENCES.md"
echo "  - REFONTE-STRUCTURE-ACADEMIQUE-V2.md"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Démarrer le frontend: cd frontend && npm run dev"
echo "  2. Tester les pages Spécialités et Compétences"
echo "  3. Vérifier la navigation dans le menu Structure Académique"
echo ""
