#!/bin/bash
# ==================================
# eLISAschool - Test Structure Académique
# ==================================
# Script de test rapide pour vérifier l'intégration complète

echo "=========================================="
echo "🎓 Test Structure Académique eLISAschool"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier Backend
echo "1️⃣  Vérification Backend..."
if curl -s http://localhost:7000/api/types-cycles > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend fonctionne (port 7000)${NC}"
else
    echo -e "${RED}❌ Backend non accessible${NC}"
    echo "   → cd backend && npm run dev"
fi
echo ""

# 2. Vérifier Frontend
echo "2️⃣  Vérification Frontend..."
if curl -s http://localhost:7001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend fonctionne (port 7001)${NC}"
else
    echo -e "${RED}❌ Frontend non accessible${NC}"
    echo "   → cd frontend && npm run dev"
fi
echo ""

# 3. Vérifier Base de Données
echo "3️⃣  Vérification Base de Données..."
PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -t -c "
SELECT 
    'Types cycles: ' || COUNT(*) FROM types_cycles
UNION ALL SELECT 'Cycles: ' || COUNT(*) FROM cycles
UNION ALL SELECT 'Niveaux: ' || COUNT(*) FROM niveaux
UNION ALL SELECT 'Filières: ' || COUNT(*) FROM filieres
UNION ALL SELECT 'Examens: ' || COUNT(*) FROM examens_nationaux;
" 2>/dev/null | while read -r line; do
    echo -e "   ${GREEN}✓${NC} $line"
done

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Base de données non accessible${NC}"
fi
echo ""

# 4. Vérifier Routes API
echo "4️⃣  Test des API..."
APIS=("types-cycles" "cycles" "niveaux" "filieres" "examens-nationaux" "diplomes-eleves")

for api in "${APIS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7000/api/$api)
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
        echo -e "   ${GREEN}✓${NC} /api/$api - OK ($STATUS)"
    else
        echo -e "${RED}✗${NC} /api/$api - Échec ($STATUS)"
    fi
done
echo ""

# 5. Résumé Navigation
echo "5️⃣  Routes Frontend..."
echo "   📍 Page principale : http://localhost:7001/parametres/structure-academique"
echo "   📍 Types cycles    : http://localhost:7001/parametres/structure-academique/types-cycles"
echo "   📍 Cycles          : http://localhost:7001/parametres/structure-academique/cycles"
echo "   📍 Niveaux         : http://localhost:7001/parametres/structure-academique/niveaux"
echo "   📍 Filières        : http://localhost:7001/parametres/structure-academique/filieres"
echo "   📍 Examens         : http://localhost:7001/parametres/structure-academique/examens-nationaux"
echo "   📍 Diplômes        : http://localhost:7001/parametres/structure-academique/diplomes-eleves"
echo ""

# 6. Instructions de Test
echo "=========================================="
echo "📋 Instructions de Test"
echo "=========================================="
echo ""
echo "1. Connectez-vous à l'application"
echo "   → http://localhost:7001/login"
echo ""
echo "2. Allez dans Paramètres → Structure Académique"
echo "   → Cherchez l'icône 🎓 (GraduationCap)"
echo ""
echo "3. Testez chaque module :"
echo "   ✓ Types de cycles  : Créer, modifier, supprimer"
echo "   ✓ Cycles           : Créer, modifier, supprimer"
echo "   ✓ Niveaux          : Créer, modifier, supprimer"
echo "   ✓ Filières         : Créer, modifier, supprimer"
echo "   ✓ Examens          : Créer, modifier, supprimer"
echo "   ✓ Diplômes         : Créer, modifier, supprimer"
echo ""
echo "4. Vérifiez les fonctionnalités :"
echo "   ✓ Filtres (système, cycle, actif)"
echo "   ✓ Pagination"
echo "   ✓ Formulaires modals"
echo "   ✓ Permissions (ADMIN/SUPER_ADMIN)"
echo ""

echo "=========================================="
echo "✅ Test terminé !"
echo "=========================================="
echo ""
echo "Documentation complète : STRUCTURE-ACADEMIQUE-INTEGREE.md"
echo ""
