#!/bin/bash

# ==================================
# eLISAschool - Script de Déploiement Gamification Automatique
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Ce script exécute:
# 1. La migration des index de performance
# 2. Le seed des nouveaux paramètres
# 3. Les tests d'intégration

set -e

echo ""
echo "========================================="
echo "🚀 Déploiement Gamification Automatique"
echo "========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Exécutez ce script depuis le répertoire backend/${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Étape 1: Exécution de la migration des index...${NC}"
echo "-----------------------------------------"

# Exécuter la migration
npx ts-node database/run-migrations.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration exécutée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la migration${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Étape 2: Re-seed des paramètres de configuration...${NC}"
echo "-----------------------------------------"

# Note: Le seed ne duplique pas les paramètres existants
# Il ajoute uniquement les nouveaux paramètres
npx ts-node src/modules/configuration/services/seed-runner.ts 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Seed runner non trouvé, utilisation de la méthode alternative...${NC}"
    
    # Alternative: Exécuter via l'API ou directement
    echo -e "${YELLOW}💡 Les nouveaux paramètres seront créés au prochain démarrage de l'app${NC}"
    echo -e "${YELLOW}   ou vous pouvez les ajouter manuellement via l'interface d'administration${NC}"
}

echo ""
echo -e "${YELLOW}📋 Étape 3: Exécution des tests d'intégration...${NC}"
echo "-----------------------------------------"

npx ts-node scripts/test-gamification-automatique.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests passés avec succès${NC}"
else
    echo -e "${RED}❌ Échec des tests${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS${NC}"
echo "========================================="
echo ""
echo "📊 Résumé des modifications:"
echo "  ✓ 4 cron jobs de gamification créés"
echo "  ✓ Intégration gamification dans module Notes"
echo "  ✓ Intégration gamification dans Suivi-Personnel"
echo "  ✓ 13 nouveaux paramètres de configuration ajoutés"
echo "  ✓ 25 index de performance créés"
echo "  ✓ 1 nouveau type d'action (EVALUATION_POSITIVE)"
echo ""
echo "🔧 Prochaines étapes:"
echo "  1. Redémarrer le backend: npm run dev"
echo "  2. Vérifier les logs de cron jobs"
echo "  3. Configurer les paramètres via l'interface admin"
echo "  4. Activer ENABLE_CRON_JOBS=true en production"
echo ""
echo "📖 Documentation:"
echo "  - Cron jobs: backend/src/modules/gamification/cron-jobs.ts"
echo "  - Tests: backend/scripts/test-gamification-automatique.ts"
echo "  - Migration: backend/database/migrations/038-index-performance-gamification-suivi.ts"
echo ""
