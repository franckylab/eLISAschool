#!/bin/bash
# ==================================
# eLISAschool - Déploiement Module Messagerie v2.0
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Ce script déploie le module messagerie complet:
# 1. Exécute la migration SQL
# 2. Vérifie les dépendances
# 3. Compile le TypeScript
# 4. Redémarre le service

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "eLISAschool - Déploiement Messagerie v2.0"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}Erreur: Exécuter ce script depuis le répertoire backend/${NC}"
    exit 1
fi

# Étape 1: Vérifier les variables d'environnement
echo -e "${YELLOW}Étape 1: Vérification de la configuration...${NC}"
if [ -z "$DATABASE_URL" ] && [ ! -f ".env" ]; then
    echo -e "${RED}Erreur: DATABASE_URL non définie et fichier .env manquant${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Configuration OK${NC}"
echo ""

# Étape 2: Exécuter la migration SQL
echo -e "${YELLOW}Étape 2: Exécution de la migration SQL...${NC}"
if command -v psql &> /dev/null; then
    # Extraire les informations de connexion de DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*://.*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*://.*@[^:]*:\([0-9]*\)/.*|\1|p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*@.*|\1|p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

    echo "Connexion à la base: $DB_NAME@$DB_HOST:$DB_PORT"
    
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/043-module-messagerie-complete.sql
    
    echo -e "${GREEN}✓ Migration SQL exécutée${NC}"
else
    echo -e "${YELLOW}⚠ psql non disponible. Exécutez la migration manuellement:${NC}"
    echo "  psql \$DATABASE_URL -f database/migrations/043-module-messagerie-complete.sql"
fi
echo ""

# Étape 3: Installer les dépendances si nécessaire
echo -e "${YELLOW}Étape 3: Vérification des dépendances...${NC}"
npm install --production
echo -e "${GREEN}✓ Dépendances OK${NC}"
echo ""

# Étape 4: Compiler le TypeScript
echo -e "${YELLOW}Étape 4: Compilation TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Compilation réussie${NC}"
echo ""

# Étape 5: Vérifier la syntaxe
echo -e "${YELLOW}Étape 5: Vérification de la syntaxe...${NC}"
npm run lint
echo -e "${GREEN}✓ Syntaxe OK${NC}"
echo ""

# Étape 6: Redémarrer le service (si Docker)
echo -e "${YELLOW}Étape 6: Redémarrage du service...${NC}"
if command -v docker-compose &> /dev/null && [ -f "../../docker-compose.yml" ]; then
    cd ../..
    docker-compose restart backend
    echo -e "${GREEN}✓ Service redémarré via Docker${NC}"
else
    echo -e "${YELLOW}⚠ Redémarrez manuellement le service backend${NC}"
    echo "  pm2 restart backend  # ou votre gestionnaire de processus"
fi
echo ""

# Résumé
echo "=========================================="
echo -e "${GREEN}✓ Déploiement terminé avec succès !${NC}"
echo "=========================================="
echo ""
echo "Prochaines étapes:"
echo "1. Vérifier les logs: docker-compose logs -f backend"
echo "2. Tester l'API: curl http://localhost:3000/api/messagerie/conversations"
echo "3. Configurer les paramètres dans l'interface d'administration"
echo ""
echo "Documentation: docs/IMPLEMENTATION-MESSAGERIE-COMPLETE.md"
echo ""
