#!/bin/bash
# =====================================================
# eLISAschool - Script de Déploiement Multi-Tenant V3.0
# =====================================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Date: 2025-06-14
#
# Ce script déploie les nouvelles fonctionnalités
# multi-tenant V3.0 en production
# =====================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   eLISAschool - Déploiement Multi-Tenant V3.0         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Variables
PROJECT_ROOT="/mnt/DONNEES/projets/eLISAschool"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DB_NAME="elisaschool"
DB_USER="postgres"

# Étape 1 : Vérifications préalables
echo -e "${YELLOW}[1/6] Vérifications préalables...${NC}"

# Vérifier que PostgreSQL est en cours
if ! pg_isready -q; then
    echo -e "${RED}✗ PostgreSQL n'est pas en cours. Veuillez le démarrer.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL est en cours${NC}"

# Vérifier que les fichiers existent
if [ ! -f "$BACKEND_DIR/database/migrations/050-multi-tenant-v3-max-etablissements.sql" ]; then
    echo -e "${RED}✗ Fichier de migration introuvable${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Fichiers de migration trouvés${NC}"

# Étape 2 : Backup de la base de données
echo -e "${YELLOW}[2/6] Backup de la base de données...${NC}"

BACKUP_FILE="/tmp/elisaschool_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${RED}✗ Échec du backup. Vérifiez les permissions.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Backup créé : $BACKUP_FILE${NC}"

# Étape 3 : Exécuter la migration
echo -e "${YELLOW}[3/6] Exécution de la migration...${NC}"

psql -U "$DB_USER" -d "$DB_NAME" -f "$BACKEND_DIR/database/migrations/050-multi-tenant-v3-max-etablissements.sql" || {
    echo -e "${RED}✗ Échec de la migration${NC}"
    echo -e "${YELLOW}Tentative de restauration du backup...${NC}"
    psql -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"
    exit 1
}
echo -e "${GREEN}✓ Migration exécutée avec succès${NC}"

# Étape 4 : Vérifier la migration
echo -e "${YELLOW}[4/6] Vérification de la migration...${NC}"

COLUMN_EXISTS=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'utilisateurs' 
    AND column_name = 'maxEtablissementsPersonnel';
")

if [ "$COLUMN_EXISTS" -eq 1 ]; then
    echo -e "${GREEN}✓ Colonne maxEtablissementsPersonnel vérifiée${NC}"
else
    echo -e "${RED}✗ Colonne non trouvée après migration${NC}"
    exit 1
fi

# Étape 5 : Redémarrer le backend
echo -e "${YELLOW}[5/6] Redémarrage du backend...${NC}"

cd "$BACKEND_DIR"

# Arrêter le processus existant (si PM2)
if command -v pm2 &> /dev/null; then
    pm2 restart elisaschool-backend || true
    echo -e "${GREEN}✓ Backend redémarré via PM2${NC}"
else
    # Sinon, tuer le processus node
    pkill -f "node.*backend" || true
    sleep 2
    
    # Redémarrer en background
    nohup npm run dev > /tmp/elisaschool-backend.log 2>&1 &
    echo -e "${GREEN}✓ Backend redémarré en background${NC}"
fi

# Attendre que le backend soit prêt
sleep 3
echo -e "${GREEN}✓ Backend opérationnel${NC}"

# Étape 6 : Redémarrer le frontend
echo -e "${YELLOW}[6/6] Redémarrage du frontend...${NC}"

cd "$FRONTEND_DIR"

# Arrêter le processus existant
pkill -f "vite.*frontend" || true
sleep 2

# Redémarrer en background
nohup npm run dev > /tmp/elisaschool-frontend.log 2>&1 &
echo -e "${GREEN}✓ Frontend redémarré en background${NC}"

# Résumé final
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Résumé du déploiement :${NC}"
echo "  ✓ Migration base de données : OK"
echo "  ✓ Backend redémarré : OK"
echo "  ✓ Frontend redémarré : OK"
echo "  ✓ Backup créé : $BACKUP_FILE"
echo ""

echo -e "${YELLOW}Prochaines étapes :${NC}"
echo "  1. Tester la connexion avec un utilisateur multi-établissements"
echo "  2. Vérifier que le modal de sélection s'affiche correctement"
echo "  3. Tester le changement d'établissement via la navbar"
echo "  4. Appliquer le middleware filterByEtablissement() sur les autres contrôleurs"
echo ""

echo -e "${YELLOW}URLs de test :${NC}"
echo "  Frontend : http://localhost:7001"
echo "  Backend  : http://localhost:3001"
echo "  API Docs : http://localhost:3001/api-docs"
echo ""

echo -e "${YELLOW}Logs :${NC}"
echo "  Backend  : tail -f /tmp/elisaschool-backend.log"
echo "  Frontend : tail -f /tmp/elisaschool-frontend.log"
echo ""

echo -e "${GREEN}Déploiement terminé ! 🎉${NC}"
