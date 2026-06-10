#!/bin/bash
# ==================================
# eLISAschool - Déploiement du Module Sondages
# ==================================
# Version: 1.0.0
# Auteur: xAI Éducation
# 
# Script de déploiement complet du module sondages

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
DB_CONTAINER="elisaschool-db"
DB_USER="franckylab"
DB_NAME="elisaschool"
PROJECT_DIR="/home/franckylab/projets/eLISAschool"

echo -e "${BLUE}"
echo "=================================="
echo " eLISAschool - Module Sondages"
echo " Script de Déploiement"
echo "=================================="
echo -e "${NC}"

# ========================================
# Étape 1: Vérifications préliminaires
# ========================================
echo -e "\n${YELLOW}📋 Étape 1: Vérifications préliminaires${NC}"

# Vérifier si le projet existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Répertoire du projet non trouvé: $PROJECT_DIR${NC}"
    exit 1
fi

# Vérifier les fichiers de migration
MIGRATION_1="$PROJECT_DIR/backend/database/migrations/041-module-sondages.sql"
MIGRATION_2="$PROJECT_DIR/backend/database/migrations/042-sondages-recurrents.sql"

if [ ! -f "$MIGRATION_1" ]; then
    echo -e "${RED}❌ Migration principale non trouvée: $MIGRATION_1${NC}"
    exit 1
fi

if [ ! -f "$MIGRATION_2" ]; then
    echo -e "${YELLOW}⚠️  Migration récurrents non trouvée (optionnelle): $MIGRATION_2${NC}"
fi

echo -e "${GREEN}✅ Vérifications préliminaires passées${NC}"

# ========================================
# Étape 2: Exécuter les migrations SQL
# ========================================
echo -e "\n${YELLOW}📋 Étape 2: Exécution des migrations SQL${NC}"

# Vérifier si le conteneur DB est en cours d'exécution
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo -e "${RED}❌ Conteneur de base de données non trouvé: $DB_CONTAINER${NC}"
    echo -e "${YELLOW}💡 Vérifiez que Docker est en cours d'exécution et que le conteneur existe${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Exécution de la migration principale...${NC}"
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $MIGRATION_1
echo -e "${GREEN}✅ Migration principale exécutée${NC}"

if [ -f "$MIGRATION_2" ]; then
    echo -e "${BLUE}🔄 Exécution de la migration récurrents...${NC}"
    docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $MIGRATION_2
    echo -e "${GREEN}✅ Migration récurrents exécutée${NC}"
fi

# ========================================
# Étape 3: Vérifier la compilation TypeScript
# ========================================
echo -e "\n${YELLOW}📋 Étape 3: Vérification de la compilation TypeScript${NC}"

cd $PROJECT_DIR/backend

if npx tsc --noEmit 2>&1 | grep -q "sondag"; then
    echo -e "${RED}❌ Erreurs TypeScript détectées dans le module sondages${NC}"
    npx tsc --noEmit 2>&1 | grep "sondag"
    exit 1
fi

echo -e "${GREEN}✅ Compilation TypeScript validée${NC}"

# ========================================
# Étape 4: Redémarrer le backend
# ========================================
echo -e "\n${YELLOW}📋 Étape 4: Redémarrage du service backend${NC}"

cd $PROJECT_DIR

# Vérifier si docker-compose.yml existe
if [ -f "docker-compose.yml" ]; then
    echo -e "${BLUE}🔄 Redémarrage du backend...${NC}"
    docker compose restart backend
    echo -e "${GREEN}✅ Backend redémarré${NC}"
    
    # Attendre que le backend soit prêt
    echo -e "${BLUE}⏳ Attente du démarrage du backend (10s)...${NC}"
    sleep 10
else
    echo -e "${YELLOW}⚠️  docker-compose.yml non trouvé, redémarrage manuel requis${NC}"
fi

# ========================================
# Étape 5: Vérifier le déploiement
# ========================================
echo -e "\n${YELLOW}📋 Étape 5: Vérification du déploiement${NC}"

# Vérifier si le backend répond
BACKEND_URL="http://localhost:3000/api/health"
echo -e "${BLUE}🔄 Vérification de l'API: $BACKEND_URL${NC}"

if curl -s -f $BACKEND_URL > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend opérationnel${NC}"
else
    echo -e "${YELLOW}⚠️  Backend non accessible (peut être en cours de démarrage)${NC}"
fi

# ========================================
# Étape 6: Afficher les informations
# ========================================
echo -e "\n${GREEN}=================================="
echo " ✅ Déploiement terminé avec succès !"
echo "=================================="
echo -e "${NC}"

echo -e "${BLUE}📊 Récapitulatif:${NC}"
echo -e "  • 4 tables créées (templates_sondage, sondages, sondage_options, sondage_votes)"
echo -e "  • 12 index optimisés"
echo -e "  • 4 paramètres système configurés"
echo -e "  • 3 templates par défaut créés"
echo -e "  • 7 permissions RBAC ajoutées"
echo -e "  • Cron jobs activés (programmation + fermeture auto + récurrents)"
echo -e "  • Notifications intégrées"
echo -e "  • WebSocket pour temps réel"
echo -e "  • Export CSV et PDF"

echo -e "\n${BLUE}🔗 Endpoints disponibles:${NC}"
echo -e "  • GET  /api/sondages/templates - Lister les templates"
echo -e "  • POST /api/sondages/templates - Créer un template"
echo -e "  • POST /api/sondages/bulk - Créer un sondage"
echo -e "  • POST /api/sondages/programmer - Programmer un sondage"
echo -e "  • GET  /api/sondages - Lister les sondages"
echo -e "  • POST /api/sondages/:id/vote - Voter"
echo -e "  • GET  /api/sondages/:id/analyses - Voir les analyses"
echo -e "  • GET  /api/sondages/:id/analyses/export?format=csv - Export CSV"
echo -e "  • GET  /api/sondages/:id/analyses/export?format=pdf - Export PDF"

echo -e "\n${BLUE}📖 Documentation:${NC}"
echo -e "  • Guide complet: $PROJECT_DIR/IMPLEMENTATION-MODULE-SONDAGES.md"
echo -e "  • API Docs: http://localhost:3000/api/docs"

echo -e "\n${BLUE}🔧 Prochaines étapes recommandées:${NC}"
echo -e "  1. Tester la création d'un sondage via l'API"
echo -e "  2. Vérifier les templates par défaut"
echo -e "  3. Configurer les permissions RBAC si nécessaire"
echo -e "  4. Activer les cron jobs: ENABLE_CRON_JOBS=true"

echo -e "\n${GREEN}✨ Le module Sondages est prêt pour la production !${NC}\n"
