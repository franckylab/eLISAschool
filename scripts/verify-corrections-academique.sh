#!/bin/bash

# ==================================
# eLISAschool - Script de Vérification des Corrections Académiques
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Date: 2026-06-27
#
# Objectif: Vérifier que toutes les modifications sont cohérentes et prêtes pour le déploiement
# ==================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Fonction pour afficher un check
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local description="$1"
    local command="$2"
    
    echo -ne "  ${CYAN}[$TOTAL_CHECKS]${NC} $description ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Fonction pour afficher un warning
warning() {
    WARNINGS=$((WARNINGS + 1))
    echo -e "  ${YELLOW}⚠️  WARNING: $1${NC}"
}

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  Vérification Corrections Académiques${NC}"
echo -e "${BLUE}  eLISAschool${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# ==================================
# PHASE 1: Vérification des Fichiers de Migration
# ==================================
echo -e "${YELLOW}📦 PHASE 1: Migrations SQL${NC}"
echo ""

check "Migration 084 existe" \
    "test -f backend/database/migrations/084-cleanup-classe-id-notes.sql"

check "Migration 085 existe" \
    "test -f backend/database/migrations/085-periode-etablissement-id.sql"

check "Migration 086 existe" \
    "test -f backend/database/migrations/086-affectation-matiere-etablissement-id.sql"

check "Migration 087 existe" \
    "test -f backend/database/migrations/087-affectation-matiere-verifications.sql"

check "Script de déploiement existe" \
    "test -f scripts/migrate-academique.sh"

check "Script de déploiement exécutable" \
    "test -x scripts/migrate-academique.sh"

echo ""

# ==================================
# PHASE 2: Vérification des Entités TypeORM
# ==================================
echo -e "${YELLOW}🏗️  PHASE 2: Entités TypeORM${NC}"
echo ""

# Vérifier note.entity.ts
check "Note: classeId supprimé" \
    "! grep -q '@Column.*classeId' backend/src/modules/notes/entities/note.entity.ts"

check "Note: Index composite etablissementId/periodeId" \
    "grep -q \"Index.*etablissementId.*periodeId\" backend/src/modules/notes/entities/note.entity.ts"

# Vérifier periode.entity.ts
check "Periode: etablissementId ajouté" \
    "grep -q 'etablissementId!: string' backend/src/modules/periodes/entities/periode.entity.ts"

check "Periode: Import Etablissement" \
    "grep -q \"import.*Etablissement.*from.*@modules/etablissement\" backend/src/modules/periodes/entities/periode.entity.ts"

check "Periode: Index etablissementId" \
    "grep -q \"Index.*etablissementId\" backend/src/modules/periodes/entities/periode.entity.ts"

# Vérifier affectation-matiere.entity.ts
check "AffectationMatiere: etablissementId ajouté" \
    "grep -q 'etablissementId!: string' backend/src/modules/matieres/entities/affectation-matiere.entity.ts"

check "AffectationMatiere: Import Etablissement" \
    "grep -q \"import.*Etablissement.*from.*@modules/etablissement\" backend/src/modules/matieres/entities/affectation-matiere.entity.ts"

echo ""

# ==================================
# PHASE 3: Vérification des Services
# ==================================
echo -e "${YELLOW}⚙️  PHASE 3: Services Backend${NC}"
echo ""

# Vérifier notes.service.ts
check "NotesService: Import AffectationEleve" \
    "grep -q \"import.*AffectationEleve.*from.*@modules/classes\" backend/src/modules/notes/services/notes.service.ts"

check "NotesService: Import StatutPeriode" \
    "grep -q \"import.*StatutPeriode.*from.*@modules/periodes\" backend/src/modules/notes/services/notes.service.ts"

check "NotesService: Guard PERIODE_CLOTUREE" \
    "grep -q 'PERIODE_CLOTUREE' backend/src/modules/notes/services/notes.service.ts"

check "NotesService: Validation ELEVE_SANS_CLASSE" \
    "grep -q 'ELEVE_SANS_CLASSE' backend/src/modules/notes/services/notes.service.ts"

check "NotesService: Déduction via AffectationEleve" \
    "grep -q 'affectationRepo.findOne' backend/src/modules/notes/services/notes.service.ts"

# Vérifier periodes.service.ts
check "PeriodeService: Paramètre etablissementId dans create()" \
    "grep -q 'async create.*etablissementId: string' backend/src/modules/periodes/services/periodes.service.ts"

check "PeriodeService: Validation ANNEE_ETABLISSEMENT_MISMATCH" \
    "grep -q 'ANNEE_ETABLISSEMENT_MISMATCH' backend/src/modules/periodes/services/periodes.service.ts"

check "PeriodeService: Filtrage multi-tenant dans findAll()" \
    "grep -q 'where.etablissementId = etablissementId' backend/src/modules/periodes/services/periodes.service.ts"

# Vérifier eleves.service.ts
check "ElevesService: Helper getClasseActuelle() existe" \
    "grep -q 'async getClasseActuelle' backend/src/modules/eleves/services/eleves.service.ts"

check "ElevesService: Import AffectationEleve" \
    "grep -q \"import.*AffectationEleve.*from.*@modules/classes\" backend/src/modules/eleves/services/eleves.service.ts"

echo ""

# ==================================
# PHASE 4: Vérification des DTOs
# ==================================
echo -e "${YELLOW}📝 PHASE 4: DTOs Zod${NC}"
echo ""

check "Note DTO: classeId supprimé de createNoteSchema" \
    "! grep -q 'classeId: z.string().uuid()' backend/src/modules/notes/dto/note.dto.ts || grep -q '// classeId.*SUPPRIMÉ' backend/src/modules/notes/dto/note.dto.ts"

check "Note DTO: classeId supprimé de createBulkNotesSchema" \
    "! grep -B2 -A2 'createBulkNotesSchema' backend/src/modules/notes/dto/note.dto.ts | grep -q 'classeId: z.string' || grep -q '// classeId.*SUPPRIMÉ' backend/src/modules/notes/dto/note.dto.ts"

echo ""

# ==================================
# PHASE 5: Vérification de la Documentation
# ==================================
echo -e "${YELLOW}📚 PHASE 5: Documentation${NC}"
echo ""

check "Document de synthèse existe" \
    "test -f CORRECTIONS-ARCHITECTURE-ACADEMIQUE-SYNTHESE.md"

check "Guide de déploiement existe" \
    "test -f GUIDE-DEPLOIEMENT-CORRECTIONS-ACADEMIQUE.md"

check "Document de synthèse > 300 lignes" \
    "test $(wc -l < CORRECTIONS-ARCHITECTURE-ACADEMIQUE-SYNTHESE.md) -gt 300"

check "Guide de déploiement > 200 lignes" \
    "test $(wc -l < GUIDE-DEPLOIEMENT-CORRECTIONS-ACADEMIQUE.md) -gt 200"

echo ""

# ==================================
# PHASE 6: Vérification de la Cohérence du Code
# ==================================
echo -e "${YELLOW}🔍 PHASE 6: Cohérence du Code${NC}"
echo ""

# Vérifier qu'il n'y a pas de références à classeId dans les imports de Note
if grep -r "note\.classeId" backend/src/modules/notes/ 2>/dev/null | grep -v "SUPPRIMÉ" | grep -v ".md"; then
    warning "Références à note.classeId trouvées (hors commentaires)"
else
    check "Aucune référence active à note.classeId dans le module notes" \
        "! grep -r 'note\.classeId' backend/src/modules/notes/ 2>/dev/null | grep -v 'SUPPRIMÉ' | grep -v '.md'"
fi

# Vérifier que les services importent correctement les entités
check "NotesService: Cohérence des imports" \
    "grep -q 'from.*@modules/periodes/entities' backend/src/modules/notes/services/notes.service.ts"

check "PeriodeService: Import dynamique anneesService" \
    "grep -q 'import.*@modules/annees-scolaires/services' backend/src/modules/periodes/services/periodes.service.ts"

echo ""

# ==================================
# PHASE 7: Vérification des Bonnes Pratiques
# ==================================
echo -e "${YELLOW}✨ PHASE 7: Bonnes Pratiques${NC}"
echo ""

# Vérifier les bannières de fichiers
check "Migration 084: Bannière eLISAschool" \
    "grep -q 'eLISAschool' backend/database/migrations/084-cleanup-classe-id-notes.sql"

check "Migration 085: Bannière eLISAschool" \
    "grep -q 'eLISAschool' backend/database/migrations/085-periode-etablissement-id.sql"

check "Note Entity: Bannière eLISAschool" \
    "head -10 backend/src/modules/notes/entities/note.entity.ts | grep -q 'eLISAschool'"

check "NotesService: Bannière eLISAschool" \
    "head -10 backend/src/modules/notes/services/notes.service.ts | grep -q 'eLISAschool'"

# Vérifier les commentaires de migration
check "Note DTO: Commentaire migration 084" \
    "grep -q 'migration 084' backend/src/modules/notes/dto/note.dto.ts"

echo ""

# ==================================
# PHASE 8: Cohérence Controllers ↔ Services
# ==================================
echo -e "${YELLOW}🔗 PHASE 8: Cohérence Controllers ↔ Services${NC}"
echo ""

# PeriodesController passe etablissementId aux méthodes du service
check "PeriodesController: Passer etablissementId à create()" \
    "grep -q 'service.create(dto, req.etablissementId)' backend/src/modules/periodes/controllers/periodes.controller.ts"

check "PeriodesController: Passer etablissementId à findAll()" \
    "grep -q 'service.findAll(anneeId, req.etablissementId)' backend/src/modules/periodes/controllers/periodes.controller.ts"

# NotesController passe etablissementId aux méthodes du service
check "NotesController: Passer etablissementId à create()" \
    "grep -q 'notesService.create(dto, req.utilisateur.*id, req.etablissementId)' backend/src/modules/notes/controllers/notes.controller.ts"

check "NotesController: Passer etablissementId à createBulk()" \
    "grep -q 'notesService.createBulk(dto, req.utilisateur.*id, req.etablissementId)' backend/src/modules/notes/controllers/notes.controller.ts"

# Aucun controller ne référence classeId pour les notes
check "Aucun controller ne référence classeId pour les notes" \
    "! grep -r 'classeId' backend/src/modules/notes/controllers/ backend/src/modules/periodes/controllers/ 2>/dev/null"

echo ""

# ==================================
# RÉSUMÉ FINAL
# ==================================
echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  RÉSUMÉ DE LA VÉRIFICATION${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

echo -e "  ${CYAN}Checks totaux:${NC}      $TOTAL_CHECKS"
echo -e "  ${GREEN}✅ Passés:${NC}         $PASSED_CHECKS"
echo -e "  ${RED}❌ Échoués:${NC}        $FAILED_CHECKS"
echo -e "  ${YELLOW}⚠️  Warnings:${NC}      $WARNINGS"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}==================================${NC}"
    echo -e "${GREEN}  ✅ TOUTES LES VÉRIFICATIONS PASSÉES !${NC}"
    echo -e "${GREEN}==================================${NC}"
    echo ""
    echo -e "${GREEN}Le code est prêt pour le déploiement.${NC}"
    echo ""
    echo -e "${BLUE}Prochaine étape:${NC}"
    echo -e "  1. Faire un backup de la base de données"
    echo -e "  2. Exécuter: ${CYAN}./scripts/migrate-academique.sh${NC}"
    echo -e "  3. Redémarrer le backend"
    echo -e "  4. Tester l'API"
    echo ""
    exit 0
else
    echo -e "${RED}==================================${NC}"
    echo -e "${RED}  ❌ $FAILED_CHECKS VÉRIFICATION(S) ÉCHOUÉE(S)${NC}"
    echo -e "${RED}==================================${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Veuillez corriger les erreurs ci-dessus avant de déployer.${NC}"
    echo ""
    exit 1
fi
