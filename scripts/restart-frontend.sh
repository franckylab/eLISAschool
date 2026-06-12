#!/bin/bash

# ==================================
# eLISAschool - Redémarrage Frontend (Port 7001)
# ==================================
# Usage: bash scripts/restart-frontend.sh

echo "========================================"
echo "  eLISAschool - Redémarrage Frontend"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Étape 1: Tuer le processus frontend actuel
echo "🔍 Recherche du processus frontend (port 5173 ou 7001)..."
echo ""

FRONTEND_PID=$(lsof -ti :5173 2>/dev/null || lsof -ti :7001 2>/dev/null)

if [ -n "$FRONTEND_PID" ]; then
    echo -e "✅ Processus trouvé: ${YELLOW}$FRONTEND_PID${NC}"
    echo "🛑 Arrêt du processus..."
    kill $FRONTEND_PID 2>/dev/null
    sleep 2
    
    # Vérifier que le processus est bien tué
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "⚠️  ${YELLOW}Forçant l'arrêt...${NC}"
        kill -9 $FRONTEND_PID 2>/dev/null
        sleep 1
    fi
    
    echo -e "✅ ${GREEN}Processus arrêté${NC}"
else
    echo -e "ℹ️  Aucun processus frontend détecté"
fi

echo ""

# Étape 2: Vérifier la configuration
echo "📋 Vérification de la configuration..."
echo ""

# Vérifier vite.config.ts
if grep -q "port: 7001" /home/franckylab/projets/eLISAschool/frontend/vite.config.ts; then
    echo -e "✅ ${GREEN}vite.config.ts${NC} - Port 7001 configuré"
else
    echo -e "❌ ${RED}vite.config.ts${NC} - Port incorrect !"
    exit 1
fi

# Vérifier .env
if grep -q "VITE_API_URL=http://localhost:7000" /home/franckylab/projets/eLISAschool/frontend/.env; then
    echo -e "✅ ${GREEN}frontend/.env${NC} - API URL correcte (7000)"
else
    echo -e "⚠️  ${YELLOW}frontend/.env${NC} - API URL incorrecte"
fi

# Vérifier .env racine
if grep -q "FRONTEND_URL=http://localhost:7001" /home/franckylab/projets/eLISAschool/.env; then
    echo -e "✅ ${GREEN}.env (racine)${NC} - FRONTEND_URL correct (7001)"
else
    echo -e "⚠️  ${YELLOW}.env (racine)${NC} - FRONTEND_URL incorrect"
fi

echo ""

# Étape 3: Démarrer le frontend
echo "🚀 Démarrage du frontend sur le port 7001..."
echo ""

cd /home/franckylab/projets/eLISAschool/frontend

# Démarrer en arrière-plan
npm run dev -- --port 7001 --host &

FRONTEND_NEW_PID=$!

echo ""
echo "========================================"
echo "  Statut"
echo "========================================"
echo -e "✅ ${GREEN}Frontend démarré${NC}"
echo -e "🆔 PID: ${YELLOW}$FRONTEND_NEW_PID${NC}"
echo -e "🌐 URL: ${GREEN}http://localhost:7001${NC}"
echo ""

# Étape 4: Attendre que le serveur soit prêt
echo "⏳ Attente du serveur (5 secondes)..."
sleep 5

# Vérifier que le port 7001 écoute
if lsof -i :7001 > /dev/null 2>&1; then
    echo -e "✅ ${GREEN}Serveur opérationnel sur le port 7001${NC}"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Ouvrir http://localhost:7001 dans votre navigateur"
    echo "   2. Vérifier la console (F12) - l'erreur CORS doit avoir disparu"
    echo "   3. Tester la page des utilisateurs"
    echo ""
    echo "📊 Monitorer les logs:"
    echo "   tail -f /home/franckylab/projets/eLISAschool/frontend/logs/*.log"
    echo ""
else
    echo -e "❌ ${RED}Le serveur n'est pas démarré correctement${NC}"
    echo "   Vérifiez les logs pour plus de détails"
    exit 1
fi

echo "========================================"
