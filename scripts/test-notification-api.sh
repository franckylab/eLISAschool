#!/bin/bash
# ==================================
# eLISAschool - Test API Notification Providers
# ==================================
# Script de test des endpoints de gestion des providers

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000/api}"
TOKEN="${ADMIN_TOKEN:-}"

if [ -z "$TOKEN" ]; then
    echo "⚠️  Veuillez définir la variable ADMIN_TOKEN avec un token admin valide"
    echo "   export ADMIN_TOKEN=votre_token_admin"
    exit 1
fi

echo "🧪 Test de l'API Notification Providers"
echo "========================================"
echo ""

# Test 1: Lister les providers
echo "📋 Test 1: Lister les providers"
curl -s -X GET "$API_URL/notification-providers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 2: Créer un provider Email (exemple)
echo "📧 Test 2: Créer un provider Email"
curl -s -X POST "$API_URL/notification-providers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test SMTP",
    "type": "EMAIL",
    "service": "nodemailer",
    "actif": true,
    "estDefaut": true,
    "configuration": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "user": "test@example.com",
      "password": "secret",
      "from_email": "test@example.com",
      "from_name": "Test eLISAschool"
    },
    "quotaJournalier": 100,
    "priorite": 1,
    "description": "Provider SMTP de test"
  }' | jq '.'
echo ""

echo "✅ Tests terminés!"
echo ""
echo "📝 Pour tester manuellement:"
echo "   - Lister: GET $API_URL/notification-providers"
echo "   - Détails: GET $API_URL/notification-providers/:id"
echo "   - Tester: POST $API_URL/notification-providers/:id/test"
echo "   - Toggle: POST $API_URL/notification-providers/:id/toggle"
