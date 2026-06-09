#!/bin/bash
# ==================================
# eLISAschool - Test Module Types Enum
# ==================================
# Script de test rapide pour valider le module types-enum
# 
# Usage: ./test-types-enum.sh <BASE_URL> <TOKEN>
# Exemple: ./test-types-enum.sh http://localhost:3000 "Bearer eyJhbGci..."

BASE_URL=${1:-"http://localhost:3000"}
TOKEN=${2:-"Bearer YOUR_TOKEN_HERE"}

echo "=================================="
echo "🧪 Test Module Types Enum"
echo "=================================="
echo "Base URL: $BASE_URL"
echo "=================================="
echo ""

# Test 1: Lister tous les types
echo "📋 Test 1: Lister tous les types"
echo "GET /api/types-enum"
curl -s -X GET "$BASE_URL/api/types-enum?page=1&limit=10" \
  -H "Authorization: $TOKEN" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Filtrer par catégorie
echo "📋 Test 2: Filtrer par catégorie TYPE_DOCUMENT"
echo "GET /api/types-enum?categorie=TYPE_DOCUMENT"
curl -s -X GET "$BASE_URL/api/types-enum?categorie=TYPE_DOCUMENT" \
  -H "Authorization: $TOKEN" | jq '.data | length'
echo "types trouvés"
echo ""
echo "---"
echo ""

# Test 3: Récupérer types d'une catégorie (endpoint dédié)
echo "📋 Test 3: Récupérer types TYPE_DOCUMENT (endpoint catégorie)"
echo "GET /api/types-enum/categorie/TYPE_DOCUMENT"
curl -s -X GET "$BASE_URL/api/types-enum/categorie/TYPE_DOCUMENT" \
  -H "Authorization: $TOKEN" | jq '.data[] | {code, libelle, estSysteme}'
echo ""
echo "---"
echo ""

# Test 4: Créer un type personnalisé
echo "📋 Test 4: Créer un type personnalisé"
echo "POST /api/types-enum"
RESPONSE_CREATE=$(curl -s -X POST "$BASE_URL/api/types-enum" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categorie": "TYPE_DOCUMENT",
    "code": "RELEVE_NOTES",
    "libelle": "Relevé de notes",
    "description": "Relevé détaillé des notes"
  }')

echo "$RESPONSE_CREATE" | jq '.'

# Extraire l'ID pour les tests suivants
NEW_ID=$(echo "$RESPONSE_CREATE" | jq -r '.data.id')
echo ""
echo "ID créé: $NEW_ID"
echo ""
echo "---"
echo ""

# Test 5: Modifier le type créé
echo "📋 Test 5: Modifier le type personnalisé"
echo "PATCH /api/types-enum/$NEW_ID"
curl -s -X PATCH "$BASE_URL/api/types-enum/$NEW_ID" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "libelle": "Relevé de notes officiel",
    "description": "Document officiel remis aux élèves"
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 6: Désactiver le type créé
echo "📋 Test 6: Désactiver le type personnalisé"
echo "POST /api/types-enum/$NEW_ID/toggle"
curl -s -X POST "$BASE_URL/api/types-enum/$NEW_ID/toggle" \
  -H "Authorization: $TOKEN" | jq '.data | {estActif}'
echo ""
echo "---"
echo ""

# Test 7: Réactiver le type
echo "📋 Test 7: Réactiver le type personnalisé"
echo "POST /api/types-enum/$NEW_ID/toggle"
curl -s -X POST "$BASE_URL/api/types-enum/$NEW_ID/toggle" \
  -H "Authorization: $TOKEN" | jq '.data | {estActif}'
echo ""
echo "---"
echo ""

# Test 8: Tenter de modifier un type système (libellé uniquement - DOIT RÉUSSIR)
echo "📋 Test 8: Modifier libellé type système (DOIT RÉUSSIR)"
# Récupérer un ID de type système
SYSTEM_ID=$(curl -s -X GET "$BASE_URL/api/types-enum/categorie/TYPE_DOCUMENT" \
  -H "Authorization: $TOKEN" | jq -r '.data[0].id')

echo "ID système: $SYSTEM_ID"
curl -s -X PATCH "$BASE_URL/api/types-enum/$SYSTEM_ID" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "libelle": "Bulletin (modifié)"
  }' | jq '.data | {libelle, estSysteme}'
echo ""
echo "---"
echo ""

# Test 9: Tenter de désactiver un type système (DOIT ÉCHOUER)
echo "📋 Test 9: Désactiver type système (DOIT ÉCHOUER - 403)"
curl -s -X POST "$BASE_URL/api/types-enum/$SYSTEM_ID/toggle" \
  -H "Authorization: $TOKEN" | jq '.error'
echo ""
echo "---"
echo ""

# Test 10: Tenter de supprimer un type système (DOIT ÉCHOUER)
echo "📋 Test 10: Supprimer type système (DOIT ÉCHOUER - 403)"
curl -s -X DELETE "$BASE_URL/api/types-enum/$SYSTEM_ID" \
  -H "Authorization: $TOKEN" | jq '.error'
echo ""
echo "---"
echo ""

# Test 11: Supprimer le type personnalisé créé
echo "📋 Test 11: Supprimer le type personnalisé (DOIT RÉUSSIR)"
echo "DELETE /api/types-enum/$NEW_ID"
curl -s -X DELETE "$BASE_URL/api/types-enum/$NEW_ID" \
  -H "Authorization: $TOKEN" | jq '.'
echo ""
echo "---"
echo ""

# Test 12: Vérifier que le type a été supprimé
echo "📋 Test 12: Vérifier suppression (DOIT ÉCHOUER - 404)"
curl -s -X GET "$BASE_URL/api/types-enum/$NEW_ID" \
  -H "Authorization: $TOKEN" | jq '.error'
echo ""
echo "---"
echo ""

echo "=================================="
echo "✅ Tests terminés !"
echo "=================================="
