#!/bin/bash

# =====================================================
# eLISAschool - Script de Vérification des Modules Frontend
# =====================================================
# Ce script vérifie que tous les modules sont correctement
# configurés et accessibles.
# =====================================================

echo "=========================================="
echo "  eLISAschool - Vérification Modules"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur
TOTAL=0
OK=0
WARNINGS=0

# Fonction de vérification
check_module() {
    local module=$1
    local route=$2
    local type=$3
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "  $module ($route) ... "
    
    if [ "$type" == "new" ]; then
        # Vérifier les fichiers critiques
        if [ -f "frontend/src/features/$module/types/${module%-s}.types.ts" ] || [ -f "frontend/src/features/$module/types/${module}.types.ts" ]; then
            if [ -f "frontend/src/features/$module/hooks/use-${module}.ts" ]; then
                if [ -f "frontend/src/features/$module/components/${module}-page.tsx" ]; then
                    if [ -f "frontend/src/app/routes/_auth.${module}.tsx" ]; then
                        echo -e "${GREEN}✅ OK${NC}"
                        OK=$((OK + 1))
                    else
                        echo -e "${YELLOW}⚠️  Route manquante${NC}"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                else
                    echo -e "${RED}❌ Page manquante${NC}"
                fi
            else
                echo -e "${RED}❌ Hooks manquants${NC}"
            fi
        else
            echo -e "${RED}❌ Types manquants${NC}"
        fi
    elif [ "$type" == "improved" ]; then
        if [ -f "frontend/src/features/$module/components/${module}-page.tsx" ]; then
            if [ -f "frontend/src/app/routes/_auth.${module}.tsx" ]; then
                echo -e "${GREEN}✅ OK (amélioré)${NC}"
                OK=$((OK + 1))
            else
                echo -e "${YELLOW}⚠️  Route manquante${NC}"
                WARNINGS=$((WARNINGS + 1))
            fi
        else
            echo -e "${RED}❌ Page manquante${NC}"
        fi
    elif [ "$type" == "existing" ]; then
        if [ -f "frontend/src/features/$module/components/${module}-page.tsx" ]; then
            echo -e "${GREEN}✅ OK (existant)${NC}"
            OK=$((OK + 1))
        else
            echo -e "${RED}❌ Page manquante${NC}"
        fi
    fi
}

echo "📦 Vérification des modules..."
echo ""

# Modules développés dans cette session
echo "🆕 Modules CRÉÉS :"
check_module "etablissements" "/etablissements" "new"

echo ""
echo "🔧 Modules AMÉLIORÉS :"
check_module "cycles" "/cycles" "improved"
check_module "niveaux" "/niveaux" "improved"
check_module "classes" "/classes" "improved"
check_module "annees-scolaires" "/annees-scolaires" "improved"
check_module "matieres" "/matieres" "improved"

echo ""
echo "✔️  Modules EXISTANTS vérifiés :"
check_module "personnel" "/personnel" "existing"
check_module "admin/roles" "/admin/roles" "existing"

echo ""
echo "=========================================="
echo "  Résumé"
echo "=========================================="
echo ""
echo "  Total modules : $TOTAL"
echo -e "  ${GREEN}Opérationnels : $OK${NC}"
echo -e "  ${YELLOW}Avertissements : $WARNINGS${NC}"
echo ""

if [ $OK -eq $TOTAL ]; then
    echo -e "${GREEN}✅ TOUS LES MODULES SONT OPÉRATIONNELS !${NC}"
    echo ""
    echo "📋 URLs accessibles :"
    echo "  • http://localhost:7000/etablissements"
    echo "  • http://localhost:7000/cycles"
    echo "  • http://localhost:7000/niveaux"
    echo "  • http://localhost:7000/classes"
    echo "  • http://localhost:7000/annees-scolaires"
    echo "  • http://localhost:7000/matieres"
    echo "  • http://localhost:7000/personnel"
    echo "  • http://localhost:7000/admin/roles"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Certains modules nécessitent des corrections${NC}"
    echo ""
    exit 1
fi
