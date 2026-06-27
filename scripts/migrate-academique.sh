#!/bin/bash

# ==================================
# eLISAschool - Script de Migration Académique
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Date: 2026-06-27
#
# Migrations:
# - 084: Supprimer classeId de Note
# - 085: Ajouter etablissementId à Periode
# - 086: Ajouter etablissementId à AffectationMatiere
# ==================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-postgres}"

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  Migration Académique eLISAschool${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# ==================================
# ÉTAPE 0: Backup de sécurité
# ==================================
echo -e "${YELLOW}⚠️  ÉTAPE 0: Backup de sécurité...${NC}"

BACKUP_FILE="backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --tables=notes --tables=bulletins --tables=periodes --tables=affectations_matieres \
    --schema-only > "$BACKUP_FILE"

echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
echo ""

# ==================================
# ÉTAPE 1: Migration 084 - Cleanup classeId
# ==================================
echo -e "${YELLOW}📦 ÉTAPE 1: Migration 084 - Supprimer classeId de Note...${NC}"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/084-cleanup-classe-id-notes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 084 réussie${NC}"
else
    echo -e "${RED}❌ ÉCHEC Migration 084${NC}"
    exit 1
fi
echo ""

# ==================================
# ÉTAPE 2: Migration 085 - Periode etablissementId
# ==================================
echo -e "${YELLOW}📦 ÉTAPE 2: Migration 085 - Periode etablissementId...${NC}"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/085-periode-etablissement-id.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 085 réussie${NC}"
else
    echo -e "${RED}❌ ÉCHEC Migration 085${NC}"
    exit 1
fi
echo ""

# ==================================
# ÉTAPE 3: Migration 086 - AffectationMatiere etablissementId
# ==================================
echo -e "${YELLOW}📦 ÉTAPE 3: Migration 086 - AffectationMatiere etablissementId...${NC}"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/086-affectation-matiere-etablissement-id.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 086 réussie${NC}"
else
    echo -e "${RED}❌ ÉCHEC Migration 086${NC}"
    exit 1
fi
echo ""

# ==================================
# ÉTAPE 4: Vérification finale
# ==================================
echo -e "${YELLOW}🔍 ÉTAPE 4: Vérification finale...${NC}"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF

-- Vérifier que notes.classeId n'existe plus
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notes' AND column_name = 'classeId'
        ) THEN '❌ notes.classeId existe toujours'
        ELSE '✅ notes.classeId supprimée'
    END as verification_084;

-- Vérifier que periodes.etablissementId existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'periodes' AND column_name = 'etablissementId'
        ) THEN '✅ periodes.etablissementId ajoutée'
        ELSE '❌ periodes.etablissementId manquante'
    END as verification_085;

-- Vérifier que affectations_matieres.etablissementId existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'affectations_matieres' AND column_name = 'etablissementId'
        ) THEN '✅ affectations_matieres.etablissementId ajoutée'
        ELSE '❌ affectations_matieres.etablissementId manquante'
    END as verification_086;

-- Statistiques
SELECT '📊 Statistiques:' as info;
SELECT 
    'Notes' as table_name, 
    COUNT(*) as total_rows 
FROM notes
UNION ALL
SELECT 
    'Bulletins', 
    COUNT(*) 
FROM bulletins
UNION ALL
SELECT 
    'Périodes', 
    COUNT(*) 
FROM periodes
UNION ALL
SELECT 
    'Affectations Matières', 
    COUNT(*) 
FROM affectations_matieres;

EOF

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  ✅ MIGRATIONS TERMINÉES !${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo -e "  1. Mettre à jour les entités TypeORM"
echo -e "  2. Mettre à jour les services backend"
echo -e "  3. Mettre à jour les DTOs"
echo -e "  4. Tester l'application"
echo ""
echo -e "${BLUE}Prochaine étape: npm run build && npm run start${NC}"
