#!/bin/bash

# ==================================
# eLISAschool - Déploiement Module Apparence
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Script de vérification et déploiement du module Apparence (fonds d'écran)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=================================="
echo -e "eLISAschool - Déploiement Module Apparence"
echo -e "==================================${NC}\n"

# 1. Vérifier les fichiers du catalogue
echo -e "${YELLOW}ÉTAPE 1: Vérification des fichiers SVG catalogue...${NC}"
CATALOGUE_DIR="/mnt/DONNEES/projets/eLISAschool/public/fonds-catalogue"
if [ -d "$CATALOGUE_DIR" ]; then
    SVG_COUNT=$(ls "$CATALOGUE_DIR"/*.svg 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ Répertoire catalogue trouvé: $SVG_COUNT fichiers SVG${NC}"
else
    echo -e "${RED}✗ Répertoire catalogue manquant${NC}"
    exit 1
fi

# 2. Vérifier le répertoire uploads
echo -e "${YELLOW}ÉTAPE 2: Vérification du répertoire uploads...${NC}"
UPLOADS_DIR="/mnt/DONNEES/projets/eLISAschool/backend/uploads/fonds"
if [ -d "$UPLOADS_DIR" ]; then
    echo -e "${GREEN}✓ Répertoire uploads/fonds trouvé${NC}"
else
    echo -e "${RED}✗ Répertoire uploads/fonds manquant${NC}"
    mkdir -p "$UPLOADS_DIR"
    echo -e "${GREEN}✓ Répertoire uploads/fonds créé${NC}"
fi

# 3. Vérifier la base de données
echo -e "${YELLOW}ÉTAPE 3: Vérification de la base de données...${NC}"
source /mnt/DONNEES/projets/eLISAschool/.env 2>/dev/null || {
    echo -e "${RED}✗ Fichier .env non trouvé${NC}"
    exit 1
}

FOND_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM fonds WHERE source = 'catalogue';" 2>/dev/null | tr -d ' ')
CATEGORIE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(DISTINCT categorie) FROM fonds WHERE source = 'catalogue';" 2>/dev/null | tr -d ' ')

if [ "$FOND_COUNT" = "36" ]; then
    echo -e "${GREEN}✓ $FOND_COUNT fonds catalogue dans $CATEGORIE_COUNT catégories${NC}"
else
    echo -e "${YELLOW}⚠ Seulement $FOND_COUNT fonds trouvés (attendu: 36)${NC}"
fi

# Vérifier les tables
TABLE_FONDS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'fonds';" 2>/dev/null | tr -d ' ')
TABLE_FONDS_ETAB=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'fonds_etablissement';" 2>/dev/null | tr -d ' ')

if [ "$TABLE_FONDS" = "1" ] && [ "$TABLE_FONDS_ETAB" = "1" ]; then
    echo -e "${GREEN}✓ Tables fonds et fonds_etablissement existent${NC}"
else
    echo -e "${RED}✗ Tables manquantes${NC}"
    exit 1
fi

# 4. Vérifier les fichiers backend
echo -e "${YELLOW}ÉTAPE 4: Vérification des fichiers backend...${NC}"
BACKEND_FILES=(
    "backend/src/modules/apparence/entities/fond.entity.ts"
    "backend/src/modules/apparence/entities/fond-etablissement.entity.ts"
    "backend/src/modules/apparence/dto/fonds.dto.ts"
    "backend/src/modules/apparence/services/apparence.service.ts"
    "backend/src/modules/apparence/controllers/apparence.controller.ts"
    "backend/src/modules/apparence/index.ts"
)

ALL_OK=true
for file in "${BACKEND_FILES[@]}"; do
    if [ -f "/mnt/DONNEES/projets/eLISAschool/$file" ]; then
        echo -e "${GREEN}  ✓ $file${NC}"
    else
        echo -e "${RED}  ✗ $file manquant${NC}"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = false ]; then
    echo -e "${RED}✗ Fichiers backend manquants${NC}"
    exit 1
fi

# 5. Vérifier les fichiers frontend
echo -e "${YELLOW}ÉTAPE 5: Vérification des fichiers frontend...${NC}"
FRONTEND_FILES=(
    "frontend/src/features/apparence/types.ts"
    "frontend/src/features/apparence/hooks.ts"
    "frontend/src/features/apparence/ApparencePage.tsx"
    "frontend/src/features/apparence/index.ts"
    "frontend/src/components/layout/FondRotator.tsx"
    "frontend/src/routes/_auth.parametres.apparence.tsx"
)

ALL_OK=true
for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "/mnt/DONNEES/projets/eLISAschool/$file" ]; then
        echo -e "${GREEN}  ✓ $file${NC}"
    else
        echo -e "${RED}  ✗ $file manquant${NC}"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = false ]; then
    echo -e "${RED}✗ Fichiers frontend manquants${NC}"
    exit 1
fi

# 6. Vérifier l'intégration dans app.ts
echo -e "${YELLOW}ÉTAPE 6: Vérification de l'intégration backend...${NC}"
if grep -q "apparenceController" /mnt/DONNEES/projets/eLISAschool/backend/src/app.ts; then
    echo -e "${GREEN}✓ Controller apparence importé dans app.ts${NC}"
else
    echo -e "${RED}✗ Controller apparence non importé dans app.ts${NC}"
    exit 1
fi

if grep -q "/api/apparence" /mnt/DONNEES/projets/eLISAschool/backend/src/app.ts; then
    echo -e "${GREEN}✓ Route /api/apparence montée dans app.ts${NC}"
else
    echo -e "${RED}✗ Route /api/apparence non montée dans app.ts${NC}"
    exit 1
fi

# 7. Vérifier les permissions RBAC
echo -e "${YELLOW}ÉTAPE 7: Vérification des permissions RBAC...${NC}"
if grep -q "APPARENCE_FONDS_VIEW" /mnt/DONNEES/projets/eLISAschool/shared/src/enums/roles.enum.ts; then
    echo -e "${GREEN}✓ Permission APPARENCE_FONDS_VIEW définie${NC}"
else
    echo -e "${RED}✗ Permission APPARENCE_FONDS_VIEW manquante${NC}"
    exit 1
fi

if grep -q "APPARENCE_FONDS_MANAGE" /mnt/DONNEES/projets/eLISAschool/shared/src/enums/roles.enum.ts; then
    echo -e "${GREEN}✓ Permission APPARENCE_FONDS_MANAGE définie${NC}"
else
    echo -e "${RED}✗ Permission APPARENCE_FONDS_MANAGE manquante${NC}"
    exit 1
fi

# 8. Résumé
echo -e "\n${BLUE}=================================="
echo -e "RÉSUMÉ DU DÉPLOIEMENT"
echo -e "==================================${NC}"
echo -e "${GREEN}✓ Tous les fichiers sont en place${NC}"
echo -e "${GREEN}✓ Base de données configurée ($FOND_COUNT fonds)${NC}"
echo -e "${GREEN}✓ Permissions RBAC configurées${NC}"
echo -e "${GREEN}✓ Routes API montées${NC}"

echo -e "\n${YELLOW}Pour démarrer l'application :${NC}"
echo -e "  Backend :  cd /mnt/DONNEES/projets/eLISAschool/backend && npm run dev"
echo -e "  Frontend : cd /mnt/DONNEES/projets/eLISAschool/frontend && npm run dev"

echo -e "\n${YELLOW}Endpoints API disponibles :${NC}"
echo -e "  GET    /api/apparence/catalogue          - Lister catalogue"
echo -e "  GET    /api/apparence/etablissement      - Fonds établissement"
echo -e "  POST   /api/apparence/etablissement      - Ajouter fond"
echo -e "  PATCH  /api/apparence/etablissement/:id  - Modifier fond"
echo -e "  DELETE /api/apparence/etablissement/:id  - Supprimer fond"
echo -e "  POST   /api/apparence/upload             - Upload SVG"
echo -e "  GET    /api/apparence/config             - Config rotation"
echo -e "  PATCH  /api/apparence/config             - Modifier config"
echo -e "  GET    /api/apparence/rotation           - Fonds pour slideshow"

echo -e "\n${YELLOW}Page d'administration :${NC}"
echo -e "  http://localhost:5173/parametres/apparence"

echo -e "\n${GREEN}=================================="
echo -e "DÉPLOIEMENT TERMINÉ AVEC SUCCÈS"
echo -e "==================================${NC}\n"
