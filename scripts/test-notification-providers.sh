#!/bin/bash
# ==================================
# eLISAschool - Test API Notification Providers
# ==================================
# Script de test complet avec authentification

BASE_URL="http://localhost:3000/api"

echo "🧪 Test de l'API Notification Providers"
echo "========================================"
echo ""

# Étape 1: Créer un utilisateur admin de test
echo "📝 Étape 1: Création d'un utilisateur admin de test..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-admin@elisaschool.cm",
    "motDePasse": "Test123456!",
    "role": "SUPER_ADMIN",
    "nom": "Admin",
    "prenom": "Test"
  }')

echo "$ADMIN_RESPONSE" | head -20
echo ""

# Étape 2: Se connecter
echo "🔑 Étape 2: Connexion..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-admin@elisaschool.cm",
    "motDePasse": "Test123456!"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Échec de connexion, tentative avec un utilisateur existant..."
    # Essayer avec un utilisateur par défaut si le register échoue
    TOKEN="test-token"
fi

echo "✅ Token obtenu: ${TOKEN:0:20}..."
echo ""

# Étape 3: Lister les providers
echo "📋 Étape 3: Lister les notification providers..."
curl -s -X GET "$BASE_URL/notification-providers" \
  -H "Authorization: Bearer $TOKEN" | head -100
echo ""
echo ""

# Étape 4: Créer un provider Email de test
echo "📧 Étape 4: Création d'un provider Email de test..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/notification-providers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nom": "Gmail Test",
    "type": "EMAIL",
    "service": "nodemailer",
    "actif": true,
    "estDefaut": false,
    "configuration": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "test@gmail.com",
        "pass": "test-password"
      },
      "from": {
        "name": "eLISAschool Test",
        "email": "test@gmail.com"
      }
    },
    "quotaJournalier": 100,
    "priorite": 2,
    "description": "Provider Gmail pour tests"
  }')

echo "$CREATE_RESPONSE" | head -50
echo ""

# Extraire l'ID du provider créé
PROVIDER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROVIDER_ID" ]; then
    echo "✅ Provider créé avec ID: $PROVIDER_ID"
    echo ""
    
    # Étape 5: Tester la configuration
    echo "🔍 Étape 5: Test de la configuration..."
    curl -s -X POST "$BASE_URL/notification-providers/$PROVIDER_ID/test" \
      -H "Authorization: Bearer $TOKEN" | head -30
    echo ""
    echo ""
    
    # Étape 6: Récupérer le détail
    echo "📄 Étape 6: Détail du provider..."
    curl -s -X GET "$BASE_URL/notification-providers/$PROVIDER_ID" \
      -H "Authorization: Bearer $TOKEN" | head -50
    echo ""
    echo ""
    
    # Étape 7: Toggle (désactiver)
    echo "🔄 Étape 7: Désactivation du provider..."
    curl -s -X POST "$BASE_URL/notification-providers/$PROVIDER_ID/toggle" \
      -H "Authorization: Bearer $TOKEN" | head -30
    echo ""
    echo ""
    
    # Étape 8: Réactiver
    echo "🔄 Étape 8: Réactivation du provider..."
    curl -s -X POST "$BASE_URL/notification-providers/$PROVIDER_ID/toggle" \
      -H "Authorization: Bearer $TOKEN" | head -30
    echo ""
    echo ""
    
    # Étape 9: Supprimer
    echo "🗑️  Étape 9: Suppression du provider..."
    curl -s -X DELETE "$BASE_URL/notification-providers/$PROVIDER_ID" \
      -H "Authorization: Bearer $TOKEN" | head -30
    echo ""
    echo ""
fi

# Étape 10: Lister à nouveau pour vérifier
echo "📋 Étape 10: Liste finale des providers..."
curl -s -X GET "$BASE_URL/notification-providers" \
  -H "Authorization: Bearer $TOKEN" | head -100
echo ""

echo ""
echo "✅ Tests terminés!"
