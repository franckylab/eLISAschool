#!/bin/bash

# ==================================
# eLISAschool - Test Module Salles API
# ==================================

echo "======================================"
echo "🧪 Test API Module Salles"
echo "======================================"
echo ""

API_URL="http://localhost:7000/api"

# Vérifier si le backend tourne
echo "📡 Vérification du backend..."
if curl -s $API_URL > /dev/null 2>&1; then
    echo "✅ Backend accessible sur $API_URL"
else
    echo "❌ Backend non accessible. Lancez-le avec: cd backend && npm run dev"
    exit 1
fi
echo ""

# Note sur l'authentification
echo "⚠️  NOTE: Les endpoints /api/salles nécessitent une authentification"
echo "   Pour tester, vous aurez besoin d'un token JWT valide."
echo ""

# Tester les endpoints publics (devra retourner 401)
echo "🔍 Test des endpoints (sans auth)..."
echo ""

echo "1. GET /api/salles (devrait retourner 401)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/salles)
if [ "$RESPONSE" = "401" ]; then
    echo "   ✅ Correct: $RESPONSE (Non authentifié)"
else
    echo "   ⚠️  Status: $RESPONSE"
fi
echo ""

echo "2. GET /api/salles/statistiques (devrait retourner 401)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/salles/statistiques)
if [ "$RESPONSE" = "401" ]; then
    echo "   ✅ Correct: $RESPONSE (Non authentifié)"
else
    echo "   ⚠️  Status: $RESPONSE"
fi
echo ""

echo "3. GET /api/salles/disponibles (devrait retourner 401)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/salles/disponibles)
if [ "$RESPONSE" = "401" ]; then
    echo "   ✅ Correct: $RESPONSE (Non authentifié)"
else
    echo "   ⚠️  Status: $RESPONSE"
fi
echo ""

# Résumé
echo "======================================"
echo "✅ Tests de base terminés"
echo "======================================"
echo ""
echo "📝 Pour tester avec authentification:"
echo ""
echo "1. Obtenez un token JWT via /api/auth/login"
echo ""
echo "2. Testez avec:"
echo "   curl -H \"Authorization: Bearer VOTRE_TOKEN\" $API_URL/salles"
echo "   curl -H \"Authorization: Bearer VOTRE_TOKEN\" $API_URL/salles/statistiques"
echo "   curl -H \"Authorization: Bearer VOTRE_TOKEN\" $API_URL/salles/disponibles"
echo ""
echo "3. Créez une salle:"
echo "   curl -X POST $API_URL/salles \\"
echo "     -H \"Authorization: Bearer VOTRE_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{"
echo "       \"nom\": \"Salle Test\","
echo "       \"code\": \"TEST_001\","
echo "       \"capacite\": 30,"
echo "       \"typeSalle\": \"CLASSIQUE\""
echo "     }'"
echo ""
echo "📊 Données en base:"
PGPASSWORD=elisaschool_password docker exec -i elisaschool_db psql -U elisaschool_user -d elisaschool -h localhost -p 5432 -c "SELECT COUNT(*) as total_salles FROM salles;" 2>/dev/null
echo ""
