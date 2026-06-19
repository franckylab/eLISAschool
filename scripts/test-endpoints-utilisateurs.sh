#!/bin/bash
# ==================================
# eLISAschool - Tests des Endpoints Utilisateurs-Établissements
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Script de test pour vérifier le bon fonctionnement des endpoints
# Multi-établissements et du paramètre exclureEtablissement

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
TOKEN="${API_TOKEN:-}"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    local test_name=$1
    local status=$2
    local details=$3

    if [ "$status" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $test_name"
    else
        echo -e "${RED}✗${NC} $test_name"
        echo -e "   ${YELLOW}Détails: ${details}${NC}"
    fi
}

# Vérification que le serveur est démarré
echo "=========================================="
echo "Tests des Endpoints Utilisateurs"
echo "=========================================="
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠ Aucun token fourni. Utilisation du mode simulé.${NC}"
    echo "Pour tester avec un token réel:"
    echo "  export API_TOKEN='votre-jwt-token'"
    echo "  bash test-endpoints-utilisateurs.sh"
    echo ""
fi

# Test 1: GET /api/utilisateurs?exclureEtablissement={id}
echo "Test 1: GET /api/utilisateurs avec exclureEtablissement"
if [ -n "$TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "${API_BASE_URL}/api/utilisateurs?exclureEtablissement=test-uuid&limit=10")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result "Exclure établissement - Succès" 0 ""
    else
        print_result "Exclure établissement - Échec" 1 "HTTP $HTTP_CODE"
    fi
else
    echo "  Commande à exécuter:"
    echo "  curl -H 'Authorization: Bearer TOKEN' \\"
    echo "    '${API_BASE_URL}/api/utilisateurs?exclureEtablissement={uuid}&limit=10'"
    echo ""
fi

# Test 2: POST /api/utilisateurs/{id}/etablissements
echo ""
echo "Test 2: POST /api/utilisateurs/{id}/etablissements"
if [ -n "$TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "etablissementId": "uuid-etablissement",
            "role": "ENSEIGNANT",
            "etablissementPrincipal": false
        }' \
        "${API_BASE_URL}/api/utilisateurs/test-user-id/etablissements")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        print_result "Assigner établissement - Succès" 0 ""
    else
        print_result "Assigner établissement - Échec" 1 "HTTP $HTTP_CODE"
    fi
else
    echo "  Commande à exécuter:"
    echo "  curl -X POST -H 'Authorization: Bearer TOKEN' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"etablissementId\": \"uuid\", \"role\": \"ENSEIGNANT\"}' \\"
    echo "    '${API_BASE_URL}/api/utilisateurs/{id}/etablissements'"
    echo ""
fi

# Test 3: PATCH /api/utilisateurs/{id}/etablissements/{etabId}/role
echo ""
echo "Test 3: PATCH /api/utilisateurs/{id}/etablissements/{etabId}/role"
if [ -n "$TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X PATCH \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"role": "ADMIN"}' \
        "${API_BASE_URL}/api/utilisateurs/test-user-id/etablissements/test-etab-id/role")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result "Changer rôle - Succès" 0 ""
    else
        print_result "Changer rôle - Échec" 1 "HTTP $HTTP_CODE"
    fi
else
    echo "  Commande à exécuter:"
    echo "  curl -X PATCH -H 'Authorization: Bearer TOKEN' \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"role\": \"ADMIN\"}' \\"
    echo "    '${API_BASE_URL}/api/utilisateurs/{id}/etablissements/{etabId}/role'"
    echo ""
fi

# Test 4: PATCH /api/utilisateurs/{id}/etablissements/{etabId}/principal
echo ""
echo "Test 4: PATCH /api/utilisateurs/{id}/etablissements/{etabId}/principal"
if [ -n "$TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X PATCH \
        -H "Authorization: Bearer $TOKEN" \
        "${API_BASE_URL}/api/utilisateurs/test-user-id/etablissements/test-etab-id/principal")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result "Définir principal - Succès" 0 ""
    else
        print_result "Définir principal - Échec" 1 "HTTP $HTTP_CODE"
    fi
else
    echo "  Commande à exécuter:"
    echo "  curl -X PATCH -H 'Authorization: Bearer TOKEN' \\"
    echo "    '${API_BASE_URL}/api/utilisateurs/{id}/etablissements/{etabId}/principal'"
    echo ""
fi

# Test 5: DELETE /api/utilisateurs/{id}/etablissements/{etabId}
echo ""
echo "Test 5: DELETE /api/utilisateurs/{id}/etablissements/{etabId}"
if [ -n "$TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "${API_BASE_URL}/api/utilisateurs/test-user-id/etablissements/test-etab-id")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result "Retirer établissement - Succès" 0 ""
    else
        print_result "Retirer établissement - Échec" 1 "HTTP $HTTP_CODE"
    fi
else
    echo "  Commande à exécuter:"
    echo "  curl -X DELETE -H 'Authorization: Bearer TOKEN' \\"
    echo "    '${API_BASE_URL}/api/utilisateurs/{id}/etablissements/{etabId}'"
    echo ""
fi

# Résumé
echo ""
echo "=========================================="
echo "Résumé des Tests"
echo "=========================================="
echo ""
echo "Endpoints testés:"
echo "  1. GET    /api/utilisateurs?exclureEtablissement={id}"
echo "  2. POST   /api/utilisateurs/{id}/etablissements"
echo "  3. PATCH  /api/utilisateurs/{id}/etablissements/{etabId}/role"
echo "  4. PATCH  /api/utilisateurs/{id}/etablissements/{etabId}/principal"
echo "  5. DELETE /api/utilisateurs/{id}/etablissements/{etabId}"
echo ""
echo "Permissions requises:"
echo "  - utilisateurs:manage (pour toutes les opérations d'écriture)"
echo "  - Utilisateur authentifié (pour la lecture)"
echo ""
echo "Pour exécuter avec un token:"
echo "  export API_TOKEN='votre-jwt-token'"
echo "  bash $(basename "$0")"
echo ""
