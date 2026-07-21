#!/bin/bash
# ============================================
# eLISAschool - Correction etablissementId unites_organisationnelles
# ============================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Description: Applique la migration 109 pour corriger l'erreur:
#   "column etablissementId of relation unites_organisationnelles contains null values"
#
# Cette erreur se produit quand:
#   1. La table unites_organisationnelles existe avec l'ancienne colonne organisationId
#   2. La migration 109 n'a pas été appliquée (ou a échoué à cause du bug de guillemets)
#   3. TypeORM synchronize essaie d'ajouter etablissementId NOT NULL directement
#
# Le script:
#   - Diagnostique l'état actuel de la table
#   - Applique la migration 109 corrigée (backfill robuste + guillemets camelCase)
#   - Nettoie la colonne minuscule si le bug antérieur est présent
#   - Vérifie le résultat final
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Déterminer le chemin du projet (répertoire parent du dossier scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  eLISAschool - Correction etablissementId              ║${NC}"
echo -e "${BLUE}║  unites_organisationnelles                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# ÉTAPE 1: Charger les variables d'environnement
# ============================================
echo -e "${YELLOW}📋 ÉTAPE 1: Chargement de la configuration${NC}"

# Chercher le fichier .env
ENV_FILE=""
for candidate in "$PROJECT_DIR/.env" "$PROJECT_DIR/backend/.env" "$PROJECT_DIR/docker/.env.local"; do
    if [ -f "$candidate" ]; then
        ENV_FILE="$candidate"
        break
    fi
done

if [ -z "$ENV_FILE" ]; then
    echo -e "${RED}❌ Fichier .env non trouvé${NC}"
    echo -e "   Chemins vérifiés :"
    echo -e "   - $PROJECT_DIR/.env"
    echo -e "   - $PROJECT_DIR/backend/.env"
    echo -e "   - $PROJECT_DIR/docker/.env.local"
    exit 1
fi

echo -e "   Fichier .env : ${ENV_FILE/$PROJECT_DIR\//}"

# Extraire les variables DB depuis le .env
DB_HOST=$(grep -E "^DB_HOST=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "localhost")
DB_PORT=$(grep -E "^DB_PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "5432")
DB_NAME=$(grep -E "^DB_NAME=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "elisaschool")
DB_USER=$(grep -E "^DB_USER=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "elisaschool_user")
DB_PASSWORD=$(grep -E "^DB_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")

# Valeurs par défaut
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-7002}
DB_NAME=${DB_NAME:-elisaschool}
DB_USER=${DB_USER:-elisaschool_user}

echo -e "   Hôte DB : $DB_HOST"
echo -e "   Port DB : $DB_PORT"
echo -e "   Base    : $DB_NAME"
echo -e "   User    : $DB_USER"
echo ""

# ============================================
# ÉTAPE 2: Vérifier la connexion PostgreSQL
# ============================================
echo -e "${YELLOW}🔌 ÉTAPE 2: Vérification de la connexion${NC}"

export PGPASSWORD="$DB_PASSWORD"

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Impossible de se connecter à la base de données${NC}"
    echo -e "   Vérifiez les paramètres DB dans le fichier .env"
    echo -e "   Hôte: $DB_HOST, Port: $DB_PORT, Base: $DB_NAME, User: $DB_USER"
    exit 1
fi

echo -e "${GREEN}✅ Connexion à la base de données établie${NC}"
echo ""

# ============================================
# ÉTAPE 3: Diagnostic de l'état actuel
# ============================================
echo -e "${YELLOW}🔍 ÉTAPE 3: Diagnostic de l'état actuel${NC}"

# Vérifier si la table existe
TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='unites_organisationnelles'
" 2>/dev/null | tr -d ' \n')

if [ "$TABLE_EXISTS" != "1" ]; then
    echo -e "${GREEN}✅ La table 'unites_organisationnelles' n'existe pas encore${NC}"
    echo -e "   Elle sera créée par TypeORM synchronize au démarrage du serveur"
    echo -e "${GREEN}✅ Aucune correction nécessaire${NC}"
    exit 0
fi

echo -e "   La table 'unites_organisationnelles' existe"

# Vérifier si la colonne "etablissementId" (camelCase) existe
COL_CAMEL=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT 1 FROM information_schema.columns
    WHERE table_name='unites_organisationnelles' AND column_name='etablissementId'
" 2>/dev/null | tr -d ' \n')

# Vérifier si la colonne "etablissementid" (minuscule, bug ancien) existe
COL_LOWER=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT 1 FROM information_schema.columns
    WHERE table_name='unites_organisationnelles' AND column_name='etablissementid'
" 2>/dev/null | tr -d ' \n')

# Vérifier si la colonne "organisationId" existe encore
COL_ORG=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT 1 FROM information_schema.columns
    WHERE table_name='unites_organisationnelles' AND column_name='organisationId'
" 2>/dev/null | tr -d ' \n')

# Compter les lignes
ROW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT count(*) FROM unites_organisationnelles
" 2>/dev/null | tr -d ' \n')

echo -e "   Lignes dans la table : $ROW_COUNT"

if [ "$COL_CAMEL" = "1" ]; then
    echo -e "   Colonne \"etablissementId\" (camelCase) : ${GREEN}présente${NC}"
else
    echo -e "   Colonne \"etablissementId\" (camelCase) : ${RED}absente${NC}"
fi

if [ "$COL_LOWER" = "1" ]; then
    echo -e "   Colonne \"etablissementid\" (minuscule, bug) : ${YELLOW}présente${NC}"
fi

if [ "$COL_ORG" = "1" ]; then
    echo -e "   Colonne \"organisationId\" (ancienne) : ${YELLOW}présente${NC}"
else
    echo -e "   Colonne \"organisationId\" (ancienne) : absente"
fi
echo ""

# ============================================
# ÉTAPE 4: Appliquer la migration 109 corrigée
# ============================================
echo -e "${YELLOW}🚀 ÉTAPE 4: Application de la migration 109${NC}"

MIGRATION_FILE="$PROJECT_DIR/backend/database/migrations/109-refonte-organisation.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration 109 non trouvée : $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "   Fichier : ${MIGRATION_FILE/$PROJECT_DIR\//}"
echo ""

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"; then
    echo -e "${GREEN}✅ Migration 109 appliquée avec succès${NC}"
else
    EXIT_CODE=$?
    echo -e "${RED}❌ Échec de la migration 109${NC}"
    echo -e "   Vérifiez les erreurs ci-dessus"
    exit $EXIT_CODE
fi
echo ""

# ============================================
# ÉTAPE 5: Nettoyage de la colonne minuscule (si bug antérieur)
# ============================================
if [ "$COL_LOWER" = "1" ]; then
    echo -e "${YELLOW}🧹 ÉTAPE 5: Nettoyage de la colonne 'etablissementid' (minuscule, bug ancien)${NC}"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        'ALTER TABLE unites_organisationnelles DROP COLUMN IF EXISTS etablissementid;' 2>&1; then
        echo -e "${GREEN}✅ Colonne minuscule supprimée${NC}"
    else
        echo -e "${YELLOW}⚠️  Nettoyage non critique ignoré${NC}"
    fi
    echo ""
fi

# ============================================
# ÉTAPE 6: Vérification finale
# ============================================
echo -e "${YELLOW}✅ ÉTAPE 6: Vérification finale${NC}"

# Vérifier que la colonne est NOT NULL
NULLABLE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT is_nullable FROM information_schema.columns
    WHERE table_name='unites_organisationnelles' AND column_name='etablissementId'
" 2>/dev/null | tr -d ' \n')

if [ "$NULLABLE" = "NO" ]; then
    echo -e "   Colonne \"etablissementId\" : ${GREEN}NOT NULL ✓${NC}"
else
    echo -e "   Colonne \"etablissementId\" : ${RED}toujours nullable ✗${NC}"
fi

# Vérifier qu'il n'y a pas de NULL
NULL_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT count(*) FROM unites_organisationnelles WHERE \"etablissementId\" IS NULL
" 2>/dev/null | tr -d ' \n')

if [ "$NULL_COUNT" = "0" ]; then
    echo -e "   Valeurs NULL : ${GREEN}0 ✓${NC}"
else
    echo -e "   Valeurs NULL : ${RED}$NULL_COUNT ✗${NC}"
fi

# Vérifier la FK
FK_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='fk_unites_etablissement' AND table_name='unites_organisationnelles'
" 2>/dev/null | tr -d ' \n')

if [ "$FK_EXISTS" = "1" ]; then
    echo -e "   FK fk_unites_etablissement : ${GREEN}présente ✓${NC}"
else
    echo -e "   FK fk_unites_etablissement : ${RED}absente ✗${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  CORRECTION TERMINÉE ✅                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Vous pouvez maintenant redémarrer le serveur backend :"
echo -e "  ${BLUE}cd backend && npm run dev${NC}"
echo ""
