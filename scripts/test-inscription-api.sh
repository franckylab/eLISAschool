#!/bin/bash

# ==================================
# Script de Test - Inscription & Préinscription
# ==================================
# Usage: ./test-inscription-api.sh
# ==================================

BASE_URL="http://localhost:3000/api"
TOKEN="${1:-}" # Passer le token en argument ou laisser vide pour tester la route publique

echo "🧪 Tests API Inscription & Préinscription"
echo "=========================================="
echo ""

# ==================================
# TEST 1: Route publique de préinscription
# ==================================
echo "📝 TEST 1: Préinscription publique (POST /eleves/preinscription)"
echo "----------------------------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/eleves/preinscription" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Élève",
    "dateNaissance": "2010-05-15",
    "lieuNaissance": "Douala",
    "sexe": "M",
    "nomTuteur": "Parent Test",
    "telephoneTuteur": "690123456",
    "classeSouhaiteeId": "00000000-0000-0000-0000-000000000000",
    "codeEtablissement": "CODE001"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCCESS - Code HTTP: $HTTP_CODE"
    PREINSCRIPTION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "🆔 ID Préinscription: $PREINSCRIPTION_ID"
else
    echo "❌ FAILED - Code HTTP: $HTTP_CODE"
    echo "📄 Réponse: $BODY"
fi

echo ""

# ==================================
# TEST 2: Lister préinscriptions (auth requis)
# ==================================
if [ -n "$TOKEN" ]; then
    echo "📋 TEST 2: Lister préinscriptions (GET /eleves/preinscriptions/en-attente)"
    echo "---------------------------------------------------------------------------"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/eleves/preinscriptions/en-attente?page=1&limit=10" \
      -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ SUCCESS - Code HTTP: $HTTP_CODE"
    else
        echo "❌ FAILED - Code HTTP: $HTTP_CODE"
        echo "📄 Réponse: $BODY"
    fi

    echo ""

    # ==================================
    # TEST 3: Lister inscriptions avec filtres
    # ==================================
    echo "🔍 TEST 3: Liste inscriptions avec filtres (GET /eleves/inscriptions)"
    echo "----------------------------------------------------------------------"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/eleves/inscriptions?estPreinscription=true&page=1&limit=5" \
      -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ SUCCESS - Code HTTP: $HTTP_CODE"
    else
        echo "❌ FAILED - Code HTTP: $HTTP_CODE"
    fi

    echo ""
else
    echo "⚠️  TOKEN non fourni - Tests 2 et 3 ignorés"
    echo "💡 Usage: ./test-inscription-api.sh YOUR_JWT_TOKEN"
    echo ""
fi

# ==================================
# TEST 4: Vérification Database
# ==================================
echo "🗄️  TEST 4: Vérification Base de Données"
echo "-----------------------------------------"

docker exec elisaschool_postgres_dev psql -U elisaschool_user -d elisaschool -c "
SELECT 
    COUNT(*) as total_eleves,
    COUNT(CASE WHEN estpreinscription = TRUE THEN 1 END) as preinscriptions,
    COUNT(CASE WHEN estpreinscription = FALSE THEN 1 END) as inscriptions_completes
FROM eleves;
" 2>/dev/null

echo ""

# ==================================
# TEST 5: Vérification Index
# ==================================
echo "📊 TEST 5: Vérification Index Database"
echo "---------------------------------------"

docker exec elisaschool_postgres_dev psql -U elisaschool_user -d elisaschool -c "
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE 'idx_eleves%' OR indexname LIKE 'idx_paiements%'
ORDER BY tablename, indexname;
" 2>/dev/null

echo ""

# ==================================
# RÉSUMÉ
# ==================================
echo "=========================================="
echo "📊 RÉSUMÉ DES TESTS"
echo "=========================================="
echo "✅ Tests API: Voir résultats ci-dessus"
echo "✅ Database: Vérifier les comptes"
echo "✅ Index: Vérifier la liste"
echo ""
echo "💡 Pour tester manuellement:"
echo "   curl -X POST $BASE_URL/eleves/preinscription \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"nom\":\"Test\",...}'"
echo ""
echo "📚 Documentation complète:"
echo "   /home/franckylab/projets/eLISAschool/DEPLOIEMENT-INSCRIPTION-FINANCES-REUSSI.md"
echo ""
