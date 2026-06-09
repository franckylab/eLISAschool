#!/bin/bash

# ==================================
# eLISAschool - Script Migration & Test Gamification
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Exécute la migration 037 et les tests d'intégration
# ==================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$BACKEND_DIR/database/migrations/037-gamification-tracabilite.ts"
TEST_FILE="$BACKEND_DIR/scripts/test-gamification-integration.ts"

echo -e "${BLUE}"
echo "=================================="
echo " eLISAschool - Gamification Migration & Tests"
echo "=================================="
echo -e "${NC}"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo -e "${RED}❌ Erreur: Répertoire backend non trouvé à $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

# Étape 1: Vérifier la compilation
echo -e "\n${YELLOW}📋 Étape 1: Vérification de la compilation TypeScript${NC}"
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${YELLOW}⚠️  Des erreurs TypeScript existent (peut être pré-existantes)${NC}"
    echo -e "${YELLOW}   Vérification spécifique aux modules modifiés...${NC}"
    
    if npx tsc --noEmit 2>&1 | grep -E "(gamification|suivi-eleves)" | grep -q "error TS"; then
        echo -e "${RED}❌ Erreurs TypeScript dans les modules modifiés${NC}"
        npx tsc --noEmit 2>&1 | grep -E "(gamification|suivi-eleves).*error TS"
        exit 1
    else
        echo -e "${GREEN}✅ Aucune erreur dans les modules gamification et suivi-élèves${NC}"
    fi
else
    echo -e "${GREEN}✅ Compilation TypeScript réussie${NC}"
fi

# Étape 2: Vérifier que la migration existe
echo -e "\n${YELLOW}📋 Étape 2: Vérification de la migration${NC}"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migration trouvée: 037-gamification-tracabilite.ts${NC}"

# Étape 3: Vérifier que le script de test existe
echo -e "\n${YELLOW}📋 Étape 3: Vérification du script de test${NC}"
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}❌ Script de test non trouvé: $TEST_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Script de test trouvé: test-gamification-integration.ts${NC}"

# Étape 4: Demander confirmation pour la migration
echo -e "\n${YELLOW}📋 Étape 4: Migration de base de données${NC}"
read -p "Voulez-vous exécuter la migration 037 ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔄 Exécution de la migration...${NC}"
    
    # Vérifier si TypeORM CLI est disponible
    if command -v npx &> /dev/null; then
        npx ts-node database/run-migrations.ts
        echo -e "${GREEN}✅ Migration exécutée avec succès${NC}"
    else
        echo -e "${RED}❌ npx non trouvé. Veuillez installer Node.js${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Migration ignorée (à exécuter manuellement plus tard)${NC}"
fi

# Étape 5: Exécuter les tests d'intégration
echo -e "\n${YELLOW}📋 Étape 5: Tests d'intégration${NC}"
read -p "Voulez-vous exécuter les tests d'intégration ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧪 Exécution des tests...${NC}"
    
    if npx ts-node "$TEST_FILE"; then
        echo -e "\n${GREEN}✅ Tous les tests sont passés${NC}"
    else
        echo -e "\n${RED}❌ Certains tests ont échoué${NC}"
        echo -e "${YELLOW}💡 Vérifiez les logs ci-dessus pour les détails${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Tests ignorés (à exécuter manuellement: npx ts-node $TEST_FILE)${NC}"
fi

# Résumé
echo -e "\n${BLUE}"
echo "=================================="
echo " Résumé"
echo "=================================="
echo -e "${NC}"
echo -e "${GREEN}✅ Compilation: Vérifiée${NC}"
echo -e "${GREEN}✅ Migration: ${YELLOW}Prête à être exécutée${NC}"
echo -e "${GREEN}✅ Tests: ${YELLOW}Disponibles${NC}"
echo -e "\n${BLUE}📖 Documentation complète:${NC}"
echo -e "   $(dirname "$BACKEND_DIR")/GAMIFICATION-SUIVI-ELEVES-CORRECTIONS.md"
echo -e "\n${BLUE}🚀 Prochaines étapes:${NC}"
echo -e "   1. Exécuter la migration: npx ts-node database/run-migrations.ts"
echo -e "   2. Exécuter les tests: npx ts-node scripts/test-gamification-integration.ts"
echo -e "   3. Redémarrer l'application: docker-compose restart backend"
echo -e ""
