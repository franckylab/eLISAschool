#!/bin/bash

# ==================================
# eLISAschool - Test: Durée de blocage 2 minutes
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Description: Teste le comportement de blocage après 20 tentatives échouées
# ==================================

set -e

# Configuration
BASE_URL="${API_URL:-http://localhost:7000}"
EMAIL="test-blocage@elisaschool.test"
PASSWORD="mauvais-password"

echo "======================================"
echo "🧪 Test: Durée de blocage (2 minutes)"
echo "======================================"
echo ""

# Fonction pour faire une tentative de connexion
tentative_connexion() {
    local num=$1
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"identifiant\":\"$EMAIL\",\"motDePasse\":\"$PASSWORD\"}")
    
    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | sed '$d')
    
    echo "Tentative $num/20 - HTTP $http_code"
    
    # Extraire le code d'erreur si présent
    local error_code=$(echo "$body" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$error_code" ]; then
        echo "  → Erreur: $error_code"
    fi
    
    echo "$body"
}

# Test 1: Vérifier la configuration actuelle
echo "📋 Test 1: Vérification de la configuration..."
echo "-------------------------------------------"

# Se connecter à la DB et vérifier le paramètre
if command -v docker &> /dev/null; then
    valeur=$(docker exec elisaschool-postgres psql -U elisaschool_user -d elisaschool_db -t \
        -c "SELECT valeur FROM parametres_systeme WHERE cle = 'auth.lockout_duration';" 2>/dev/null || echo "N/A")
    
    valeur=$(echo "$valeur" | tr -d '[:space:]')
    
    if [ "$valeur" = "2" ]; then
        echo "✅ Durée de blocage configurée : $valeur minutes"
    else
        echo "⚠️  Durée de blocage actuelle : $valeur minutes (attendu: 2)"
    fi
else
    echo "⚠️  Docker non disponible, impossible de vérifier la DB"
fi

echo ""

# Test 2: Simuler des tentatives (optionnel)
echo "📋 Test 2: Simulation de tentatives (optionnel)"
echo "-------------------------------------------"
read -p "Voulez-vous tester 20 tentatives de connexion ? (y/N) " reponse

if [[ "$reponse" =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Attention : Cela bloquera le compte $EMAIL pendant 2 minutes"
    echo ""
    
    for i in $(seq 1 20); do
        tentative_connexion $i
        sleep 0.2  # Petite pause entre chaque tentative
    done
    
    echo ""
    echo "✅ 20 tentatives effectuées"
    echo "⏱️  Le compte devrait être bloqué pendant 2 minutes"
    echo ""
    
    # Tester une 21ème tentative
    echo "📋 Test 21ème tentative (doit être bloquée):"
    tentative_connexion 21
    
    echo ""
    echo "📊 Message attendu :"
    echo "  'Compte temporairement bloqué. Veuillez réessayer dans 2:00.'"
else
    echo "⏭️  Test de tentatives ignoré"
fi

echo ""
echo "======================================"
echo "✅ Tests terminés"
echo "======================================"
echo ""
echo "📝 Pour appliquer la migration sur votre base de données :"
echo ""
echo "  Option 1 (TypeORM):"
echo "    cd backend && npm run migration:run"
echo ""
echo "  Option 2 (SQL direct):"
echo "    docker exec -it elisaschool-postgres psql -U elisaschool_user -d elisaschool_db"
echo "    \\i /chemin/vers/017-reduction-duree-blocage-auth.sql"
echo ""
