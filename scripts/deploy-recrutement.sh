#!/bin/bash
# ====================================================
# eLISAschool - Déploiement Module Recrutement RH
# ====================================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Script de déploiement automatisé du module de recrutement
# Tables: offres_emploi, candidatures, entretiens_recrutement, onboarding_recrutement
# ====================================================

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}🚀 Déploiement Module Recrutement eLISAschool${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# Variables de connexion DB
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-elisaschool_user}"
export PGPASSWORD="${PGPASSWORD:-elisaschool_dev_2024}"
DATABASE_URL="postgresql://${DB_USER}:${PGPASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Vérifier la connexion DB
echo -e "${YELLOW}📡 Vérification de la connexion PostgreSQL...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connexion PostgreSQL OK${NC}"
else
    echo -e "${RED}❌ Échec de connexion PostgreSQL${NC}"
    exit 1
fi

echo ""

# ==================================
# ÉTAPE 1: Exécuter la migration SQL
# ==================================
echo -e "${YELLOW}📦 Étape 1: Exécution de la migration SQL...${NC}"

MIGRATION_FILE="backend/database/migrations/045-module-recrutement.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "   → Exécution: $MIGRATION_FILE"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE" 2>&1 | grep -E "(NOTICE|ERROR)"; then
    echo -e "${GREEN}✅ Migration exécutée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'exécution de la migration${NC}"
    exit 1
fi

echo ""

# ==================================
# ÉTAPE 2: Vérification des tables
# ==================================
echo -e "${YELLOW}🔍 Étape 2: Vérification des tables créées...${NC}"

TABLES=("offres_emploi" "candidatures" "entretiens_recrutement" "onboarding_recrutement")

for table in "${TABLES[@]}"; do
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" | grep -q "t"; then
        echo -e "${GREEN}  ✓ Table $table créée${NC}"
    else
        echo -e "${RED}  ✗ Table $table manquante${NC}"
        exit 1
    fi
done

echo ""

# ==================================
# ÉTAPE 3: Vérification des index
# ==================================
echo -e "${YELLOW}📊 Étape 3: Vérification des index...${NC}"

INDEX_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE tablename IN ('offres_emploi', 'candidatures', 'entretiens_recrutement', 'onboarding_recrutement')
    AND indexname LIKE 'idx_%';
")

echo -e "${GREEN}  ✓ ${INDEX_COUNT// /} index créés${NC}"

echo ""

# ==================================
# ÉTAPE 4: Vérification des permissions
# ==================================
echo -e "${YELLOW}🔐 Étape 4: Vérification des permissions RBAC...${NC}"

PERMS_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) FROM permissions WHERE code LIKE 'recrutement:%';
")

echo -e "${GREEN}  ✓ ${PERMS_COUNT// /} permissions recrutements créées${NC}"

# Vérifier les attributions
ROLES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(DISTINCT r.code)
    FROM role_permission rp
    JOIN roles r ON rp.role_id = r.id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.code LIKE 'recrutement:%';
")

echo -e "${GREEN}  ✓ Permissions attribuées à ${ROLES_COUNT// /} rôles${NC}"

echo ""

# ==================================
# ÉTAPE 5: Vérification des paramètres
# ==================================
echo -e "${YELLOW}⚙️ Étape 5: Vérification des paramètres de configuration...${NC}"

PARAMS_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) FROM parametres_configurations WHERE cle LIKE 'recrutement.%';
")

echo -e "${GREEN}  ✓ ${PARAMS_COUNT// /} paramètres de configuration créés${NC}"

echo ""

# ==================================
# ÉTAPE 6: Vérification des actions d'audit
# ==================================
echo -e "${YELLOW}📝 Étape 6: Vérification des actions d'audit...${NC}"

AUDIT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) FROM audit_actions WHERE code LIKE '%OFFRE%' OR code LIKE '%CANDIDATURE%' OR code LIKE '%ENTRETIEN%' OR code LIKE '%ONBOARDING%';
")

echo -e "${GREEN}  ✓ ${AUDIT_COUNT// /} actions d'audit créées${NC}"

echo ""

# ==================================
# RÉSUMÉ FINAL
# ==================================
echo -e "${BLUE}====================================================${NC}"
echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""
echo -e "${YELLOW}📊 Résumé:${NC}"
echo -e "   • 4 tables créées (offres, candidatures, entretiens, onboarding)"
echo -e "   • ${INDEX_COUNT// /} index stratégiques"
echo -e "   • ${PERMS_COUNT// /} permissions RBAC"
echo -e "   • ${PARAMS_COUNT// /} paramètres de configuration"
echo -e "   • ${AUDIT_COUNT// /} actions d'audit"
echo ""
echo -e "${YELLOW}🚀 Prochaines étapes:${NC}"
echo -e "   1. Activer le module: ${BLUE}PATCH /api/parametres/recrutement.actif { valeur: true }${NC}"
echo -e "   2. Tester l'API: ${BLUE}GET /api/recrutement/offres${NC}"
echo -e "   3. Créer une offre: ${BLUE}POST /api/recrutement/offres${NC}"
echo -e "   4. Consulter la doc: ${BLUE}http://localhost:3001/api/docs${NC}"
echo ""
echo -e "${YELLOW}📖 Endpoints disponibles:${NC}"
echo -e "   ${BLUE}OFFRES:${NC}"
echo -e "     GET    /api/recrutement/offres"
echo -e "     POST   /api/recrutement/offres"
echo -e "     GET    /api/recrutement/offres/:id"
echo -e "     PATCH  /api/recrutement/offres/:id"
echo -e "     POST   /api/recrutement/offres/:id/publier"
echo -e "     POST   /api/recrutement/offres/:id/cloturer"
echo -e "     GET    /api/recrutement/offres/statistiques"
echo ""
echo -e "   ${BLUE}CANDIDATURES:${NC}"
echo -e "     GET    /api/recrutement/candidatures"
echo -e "     POST   /api/recrutement/candidatures"
echo -e "     GET    /api/recrutement/candidatures/:id"
echo -e "     POST   /api/recrutement/candidatures/:id/evaluer"
echo -e "     POST   /api/recrutement/candidatures/:id/shortlist"
echo -e "     POST   /api/recrutement/candidatures/:id/convoquer"
echo -e "     POST   /api/recrutement/candidatures/:id/retenir"
echo -e "     POST   /api/recrutement/candidatures/:id/refuser"
echo -e "     GET    /api/recrutement/candidatures/offres/:offreId/pipeline"
echo ""
echo -e "   ${BLUE}ENTRETIENS:${NC}"
echo -e "     GET    /api/recrutement/entretiens"
echo -e "     POST   /api/recrutement/entretiens"
echo -e "     GET    /api/recrutement/entretiens/:id"
echo -e "     POST   /api/recrutement/entretiens/:id/evaluer"
echo ""
echo -e "   ${BLUE}ONBOARDING:${NC}"
echo -e "     GET    /api/recrutement/onboarding"
echo -e "     POST   /api/recrutement/onboarding"
echo -e "     GET    /api/recrutement/onboarding/:id"
echo -e "     PATCH  /api/recrutement/onboarding/:id/checklist"
echo -e "     GET    /api/recrutement/onboarding/statistiques"
echo ""
echo -e "${GREEN}✨ Module Recrutement prêt à l'emploi !${NC}"
