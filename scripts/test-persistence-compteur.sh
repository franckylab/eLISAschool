#!/bin/bash
# Script de test pour la persistance du compteur de tentatives

echo "═══════════════════════════════════════════════════════════"
echo "  Test Persistance Compteur de Tentatives - eLISAschool"
echo "═══════════════════════════════════════════════════════════"
echo ""

API_URL="http://localhost:5001/api/auth/login"
TEST_USER="ELV-001"
WRONG_PASSWORD="mauvaispassword"

echo "📋 Configuration du test:"
echo "   Utilisateur: $TEST_USER"
echo "   API URL: $API_URL"
echo ""

# Test 1: Première tentative échouée
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 1: Première tentative échouée"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"identifiant\":\"$TEST_USER\",\"motDePasse\":\"$WRONG_PASSWORD\"}")

echo "Réponse: $RESPONSE"
echo ""

# Test 2: Vérifier localStorage dans le navigateur (manuel)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 2: Vérification de la persistance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Instructions manuelles:"
echo "   1. Ouvrir le navigateur sur http://localhost:7001/login"
echo "   2. Ouvrir DevTools (F12) → Application → Local Storage"
echo "   3. Vérifier la clé: 'elisaschool-login-tentatives'"
echo "   4. Recharger la page (F5)"
echo "   5. Vérifier que le compteur n'est PAS réinitialisé à 20"
echo "   6. Continuer à tenter avec mot de passe incorrect"
echo "   7. Quand le compte est bloqué, vérifier le countdown"
echo "   8. Recharger la page pendant le blocage"
echo "   9. Vérifier que le countdown continue depuis le bon temps"
echo ""

# Test 3: Tentatives multiples
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 3: Tentatives multiples (backend)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in {1..5}; do
    echo ""
    echo "Tentative $i/5..."
    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"identifiant\":\"$TEST_USER\",\"motDePasse\":\"$WRONG_PASSWORD\"}")
    
    CODE=$(echo "$RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    MESSAGE=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    
    echo "   Code: $CODE"
    echo "   Message: $MESSAGE"
    
    if [ "$CODE" = "ACCOUNT_LOCKED" ]; then
        echo "   ✅ Compte bloqué détecté!"
        DETAILS=$(echo "$RESPONSE" | grep -o '"details":{[^}]*}')
        echo "   Détails: $DETAILS"
        break
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Résumé des fichiers modifiés"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ Frontend:"
echo "   - frontend/src/features/auth/LoginPage.tsx"
echo "     • States persistés dans localStorage"
echo "     • Récupération au rechargement de page"
echo "     • Utilisation des données réelles du backend"
echo ""
echo "✅ Backend:"
echo "   - backend/src/modules/auth/services/auth.service.ts"
echo "     • Retourne bloqueJusqua dans error.details"
echo "     • Retourne tempsRestantSecondes dans error.details"
echo "     • Message d'erreur avec countdown formaté"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  Clé localStorage utilisée"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔑 Clé: 'elisaschool-login-tentatives'"
echo "📦 Structure JSON:"
echo "   {"
echo '     "bloqueJusqua": "2025-06-16T14:30:00.000Z",'
echo '     "tentativesRestantes": 15,'
echo '     "timestamp": "2025-06-16T14:15:00.000Z"'
echo "   }"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  Nettoyage (optionnel)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Pour réinitialiser le compteur manuellement:"
echo "  localStorage.removeItem('elisaschool-login-tentatives')"
echo ""
echo "Ou dans la console du navigateur:"
echo "  localStorage.clear()"
echo ""
