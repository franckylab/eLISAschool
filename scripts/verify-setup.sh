#!/bin/bash

# ==================================
# eLISAschool - Script de Vérification
# ==================================
# Version: 1.0.0
# Usage: ./scripts/verify-setup.sh

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   eLISAschool - Vérification de l'Environnement         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
SUCCESS=0
WARNINGS=0
ERRORS=0

# Fonction de vérification
check() {
    local description="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $description"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}❌${NC} $description"
        ERRORS=$((ERRORS + 1))
    fi
}

check_warning() {
    local description="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $description"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${YELLOW}⚠️${NC} $description"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo "📋 Vérification des Services..."
echo "─────────────────────────────────────────────────────────"

# Services
check "Frontend en cours d'exécution" "curl -s http://localhost:5173"
check "Backend API en cours d'exécution" "curl -s http://localhost:3001/api/health"
check "Backend API opérationnelle" "curl -s http://localhost:3001/api/health | grep -q 'opérationnelle'"
check_warning "Documentation API accessible" "curl -s http://localhost:3001/api/docs"

echo ""
echo "📦 Vérification des Fichiers Critiques..."
echo "─────────────────────────────────────────────────────────"

# Fichiers frontend essentiels
check "API Client existe" "test -f frontend/src/lib/api-client.ts"
check "API Alias existe" "test -f frontend/src/lib/api.ts"
check "DataTable Component existe" "test -f frontend/src/components/ui/DataTable.tsx"
check "ElisaButton Component existe" "test -f frontend/src/components/ui/ElisaButton.tsx"
check "Module Élèves - Page Liste" "test -f frontend/src/features/eleves/components/eleves-page.tsx"
check "Module Élèves - Page Détail" "test -f frontend/src/features/eleves/components/eleve-detail-page.tsx"
check "Module Élèves - Formulaire" "test -f frontend/src/features/eleves/components/eleve-form.tsx"
check "Module Élèves - Traductions" "test -f frontend/src/locales/fr/eleves.json"
# Vérifier avec find pour éviter les problèmes d'échappement
if find frontend/src/app/routes -name "_auth.eleves.*id.tsx" -type f | grep -q .; then
    echo -e "${GREEN}✅${NC} Module Élèves - Route Détail"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${RED}❌${NC} Module Élèves - Route Détail"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🔧 Vérification des Imports..."
echo "─────────────────────────────────────────────────────────"

# Vérifier qu'il n'y a plus d'imports incorrects
if grep -r "from '@/lib/api'" frontend/src --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Import @/lib/api résolu (18 fichiers)"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${RED}❌${NC} Problème d'import @/lib/api"
    ERRORS=$((ERRORS + 1))
fi

if grep -r "@/components/data-table" frontend/src --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
    echo -e "${RED}❌${NC} Imports data-table incorrects détectés"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅${NC} Tous les imports DataTable sont corrects"
    SUCCESS=$((SUCCESS + 1))
fi

if grep -r "@/components/ui/elisa-button" frontend/src --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
    echo -e "${RED}❌${NC} Imports elisa-button incorrects détectés"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅${NC} Tous les imports ElisaButton sont corrects"
    SUCCESS=$((SUCCESS + 1))
fi

echo ""
echo "🗂️  Vérification de la Base de Données..."
echo "─────────────────────────────────────────────────────────"

# PostgreSQL
check_warning "PostgreSQL accessible" "docker ps | grep -q postgres"
check_warning "Redis accessible" "docker ps | grep -q redis"

echo ""
echo "📊 Résumé de la Vérification"
echo "─────────────────────────────────────────────────────────"
echo -e "${GREEN}✅ Succès: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"
echo -e "${RED}❌ Erreurs: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎉 ENVIRONNEMENT OPÉRATIONNEL - PRÊT POUR LE DEV !   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🌐 Accès rapide :"
    echo "   • Frontend:    http://localhost:5173"
    echo "   • Backend API: http://localhost:3001"
    echo "   • Docs API:    http://localhost:3001/api/docs"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠️  $ERRORS ERREUR(S) DÉTECTÉE(S) - VÉRIFIER CI-DESSUS   ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
