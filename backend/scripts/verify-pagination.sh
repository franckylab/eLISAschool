#!/bin/bash

# ==================================
# eLISAschool - Vérification du Système de Pagination v2.0
# ==================================
# Ce script vérifie que tous les modules utilisent correctement
# le nouveau système de pagination.

echo "========================================="
echo "🔍 Vérification du Système de Pagination"
echo "========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASS=0
FAIL=0
WARNINGS=0

# Fonction pour vérifier un fichier
check_file() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $description"
        ((FAIL++))
    fi
}

# Fonction pour les avertissements
warn_if_found() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${YELLOW}⚠${NC} $description"
        ((WARNINGS++))
    fi
}

echo "📦 1. Vérification des fichiers créés..."
echo "-------------------------------------------"

check_file "backend/src/common/utils/pagination.util.ts" "paginateWithQueryBuilder" "Utilitaire pagination.util.ts existe"
check_file "backend/src/common/dto/pagination.dto.ts" "paginationSchema" "DTO pagination.dto.ts existe"
check_file "backend/src/common/examples/pagination-examples.ts" "EXEMPLE" "Fichier d'exemples existe"
check_file "backend/docs/pagination-guide.md" "Pagination" "Documentation existe"

echo ""
echo "🔄 2. Vérification des exports..."
echo "-------------------------------------------"

check_file "backend/src/common/utils/index.ts" "pagination.util" "pagination.util exporté"
check_file "backend/src/common/dto/index.ts" "pagination.dto" "pagination.dto exporté"
check_file "backend/src/common/index.ts" "dto" "Module dto exporté"

echo ""
echo "📝 3. Vérification des DTOs migrés..."
echo "-------------------------------------------"

check_file "backend/src/modules/utilisateurs/dto/utilisateur.dto.ts" "paginationWithSortSchema" "utilisateurs.dto.ts migré"
check_file "backend/src/modules/notes/dto/note.dto.ts" "paginationSchema" "note.dto.ts migré"
check_file "backend/src/modules/notifications/dto/notification.dto.ts" "paginationSchema" "notification.dto.ts migré"
check_file "backend/src/modules/messagerie/dto/messagerie.dto.ts" "paginationSchema" "messagerie.dto.ts migré"
check_file "backend/src/modules/requetes/dto/requete.dto.ts" "paginationSchema" "requete.dto.ts migré"
check_file "backend/src/modules/cantine/dto/cantine.dto.ts" "paginationSchema" "cantine.dto.ts migré"

echo ""
echo "⚡ 4. Vérification des services optimisés..."
echo "-------------------------------------------"

check_file "backend/src/modules/utilisateurs/services/utilisateurs.service.ts" "paginateWithQueryBuilder" "utilisateurs.service.ts optimisé"
warn_if_found "backend/src/modules/utilisateurs/services/utilisateurs.service.ts" "\.skip(.*\.take" "Code de pagination ancien détecté"

check_file "backend/src/modules/messagerie/services/messagerie.service.ts" "paginateWithQueryBuilder" "messagerie.service.ts optimisé"
warn_if_found "backend/src/modules/messagerie/services/messagerie.service.ts" "\.slice(" "Pagination en mémoire détectée"

echo ""
echo "🔒 5. Vérification de la sécurité..."
echo "-------------------------------------------"

check_file "backend/src/common/utils/pagination.util.ts" "Math.min.*LIMITS.PAGINATION_MAX" "Protection limit max"
check_file "backend/src/common/utils/pagination.util.ts" "Math.max(1" "Protection limit min"
check_file "backend/src/common/dto/pagination.dto.ts" "\.min(1)" "Validation page minimum"

echo ""
echo "📊 6. Vérification des métadonnées..."
echo "-------------------------------------------"

check_file "backend/src/common/utils/pagination.util.ts" "hasNextPage" "Métadonnée hasNextPage"
check_file "backend/src/common/utils/pagination.util.ts" "hasPreviousPage" "Métadonnée hasPreviousPage"
check_file "backend/src/common/utils/pagination.util.ts" "itemCount" "Métadonnée itemCount"

echo ""
echo "🚀 7. Vérification des optimisations..."
echo "-------------------------------------------"

check_file "backend/src/common/utils/pagination.util.ts" "useOptimizedCount" "COUNT optimisé disponible"
check_file "backend/src/common/utils/pagination.util.ts" "paginateWithCustomCount" "COUNT personnalisé disponible"
check_file "backend/src/common/utils/api-response.util.ts" "sendPaginatedV2" "Réponse V2 disponible"

echo ""
echo "========================================="
echo "📈 Résumé de la Vérification"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Réussis:${NC} $PASS"
echo -e "${RED}✗ Échoués:${NC} $FAIL"
echo -e "${YELLOW}⚠ Avertissements:${NC} $WARNINGS"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    echo ""
    echo "Le système de pagination v2.0 est correctement implémenté."
    echo ""
    echo "📚 Prochaines étapes recommandées :"
    echo "   1. Migrer les autres modules (eleves, matieres, etc.)"
    echo "   2. Ajouter des index sur les colonnes filtrées"
    echo "   3. Tester les performances avec des gros volumes"
    echo "   4. Mettre à jour la documentation API"
else
    echo -e "${RED}❌ Certains tests ont échoué.${NC}"
    echo "Veuillez corriger les problèmes ci-dessus."
fi

echo ""
echo "📖 Documentation complète : backend/docs/pagination-guide.md"
echo "💡 Exemples d'utilisation : backend/src/common/examples/pagination-examples.ts"
echo ""
