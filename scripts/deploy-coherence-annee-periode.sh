#!/bin/bash
# =============================================
# Déploiement migrations 220-223
# Cohérence Année Scolaire / Période
# =============================================
# Migration 220: Backfill + suppression colonnes + index + trigger
# Migration 221: Permissions RBAC (reouvrir, audit)
# Migration 222: Permissions complètes (create, edit, delete, activer, cloturer)
# Migration 223: NOT NULL anneeScolaireId sur notes/bulletins
#
# Date: 2026-08-21
# Auteur: franck arlos chendjou
# =============================================

set -euo pipefail

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN} Déploiement migrations 220-223${NC}"
echo -e "${GREEN} Cohérence Année Scolaire / Période${NC}"
echo -e "${GREEN}=============================================${NC}"

# Charger les variables d'environnement
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../backend/.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-elisaschool_user}"
DB_PASSWORD="${DB_PASSWORD:-elisaschool_password}"

export PGPASSWORD="$DB_PASSWORD"
PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

MIGRATIONS_DIR="${SCRIPT_DIR}/../backend/database/migrations"

# Fonction d'exécution d'une migration
run_migration() {
    local file="$1"
    local name="$2"
    
    echo -e "\n${YELLOW}▶ Exécution: ${name}${NC}"
    if $PSQL_CMD -f "$file" 2>&1; then
        echo -e "${GREEN}✅ ${name} — OK${NC}"
    else
        echo -e "${RED}❌ ${name} — ÉCHEC${NC}"
        exit 1
    fi
}

# Vérifier la connexion
echo -e "\n${YELLOW}Vérification connexion DB...${NC}"
if ! $PSQL_CMD -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Impossible de se connecter à la base de données${NC}"
    echo -e "Host: $DB_HOST:$DB_PORT, DB: $DB_NAME, User: $DB_USER"
    exit 1
fi
echo -e "${GREEN}✅ Connexion OK${NC}"

# Exécuter les migrations dans l'ordre
run_migration "$MIGRATIONS_DIR/220-coherence-annee-periode.sql" "Migration 220 — Cohérence Année/Période"
run_migration "$MIGRATIONS_DIR/221-rbac-annees-scolaires.sql" "Migration 221 — Permissions RBAC"
run_migration "$MIGRATIONS_DIR/222-permissions-completes-annees-scolaires.sql" "Migration 222 — Permissions complètes"
run_migration "$MIGRATIONS_DIR/223-not-null-annee-scolaire-id.sql" "Migration 223 — NOT NULL anneeScolaireId"

echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN} ✅ Toutes les migrations sont terminées${NC}"
echo -e "${GREEN}=============================================${NC}"

# Résumé
echo -e "\n${GREEN}Résumé:${NC}"
echo "  - Migration 220: Backfill, suppression enCours/code, index, trigger"
echo "  - Migration 221: Permissions reouvrir + audit"
echo "  - Migration 222: Permissions create/edit/delete/activer/cloturer"
echo "  - Migration 223: NOT NULL anneeScolaireId sur notes/bulletins"
