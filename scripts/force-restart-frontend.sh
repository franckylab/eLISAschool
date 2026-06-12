#!/bin/bash

# ==================================
# eLISAschool - Force Restart Frontend Port 7001
# ==================================

echo "========================================"
echo "  Force Restart - Frontend Port 7001"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Étape 1: Tuer TOUS les processus Vite/Node sur 5173 et 7001
echo -e "${BLUE}🔍 Étape 1: Nettoyage des processus${NC}"
echo ""

PIDS_5173=$(lsof -ti :5173 2>/dev/null)
PIDS_7001=$(lsof -ti :7001 2>/dev/null)

if [ -n "$PIDS_5173" ]; then
    echo -e "  🛑 Tuer processus sur port 5173: ${YELLOW}$PIDS_5173${NC}"
    kill -9 $PIDS_5173 2>/dev/null
    sleep 1
fi

if [ -n "$PIDS_7001" ]; then
    echo -e "  🛑 Tuer processus sur port 7001: ${YELLOW}$PIDS_7001${NC}"
    kill -9 $PIDS_7001 2>/dev/null
    sleep 1
fi

echo -e "  ✅ ${GREEN}Processus arrêtés${NC}"
echo ""

# Étape 2: Supprimer le cache Vite
echo -e "${BLUE}🔍 Étape 2: Nettoyage du cache${NC}"
echo ""

cd /home/franckylab/projets/eLISAschool/frontend
rm -rf node_modules/.vite 2>/dev/null
rm -rf .vite 2>/dev/null
echo -e "  ✅ ${GREEN}Cache Vite supprimé${NC}"
echo ""

# Étape 3: Vérifier la configuration
echo -e "${BLUE}🔍 Étape 3: Vérification de la configuration${NC}"
echo ""

# Vérifier package.json
if grep -q '"dev": "vite --port 7001"' package.json; then
    echo -e "  ✅ ${GREEN}package.json${NC} - Script dev avec port 7001"
else
    echo -e "  ❌ ${RED}package.json${NC} - Script incorrect"
    exit 1
fi

# Vérifier vite.config.ts
if grep -q 'port: 7001' vite.config.ts; then
    echo -e "  ✅ ${GREEN}vite.config.ts${NC} - Port 7001 configuré"
else
    echo -e "  ❌ ${RED}vite.config.ts${NC} - Port incorrect"
    exit 1
fi

# Vérifier .env
if grep -q 'PORT=7001' .env; then
    echo -e "  ✅ ${GREEN}.env${NC} - PORT=7001 défini"
else
    echo -e "  ⚠️  ${YELLOW}.env${NC} - PORT non défini (mais OK si dans package.json)"
fi

echo ""

# Étape 4: Démarrer le frontend
echo -e "${BLUE}🔍 Étape 4: Démarrage du frontend${NC}"
echo ""
echo -e "  🚀 Commande: ${YELLOW}npm run dev${NC}"
echo ""

# Démarrer en arrière-plan et capturer les logs
npm run dev > /tmp/frontend-7001.log 2>&1 &
FRONTEND_PID=$!

echo -e "  🆔 PID: ${YELLOW}$FRONTEND_PID${NC}"
echo ""

# Étape 5: Attendre et vérifier
echo -e "${BLUE}🔍 Étape 5: Vérification (attente 5 secondes)${NC}"
echo ""
sleep 5

# Vérifier les logs
echo -e "  📄 Logs du démarrage:"
echo "  ─────────────────────────────────"
head -15 /tmp/frontend-7001.log | sed 's/^/  /'
echo "  ─────────────────────────────────"
echo ""

# Vérifier le port
if lsof -i :7001 > /dev/null 2>&1; then
    echo -e "  ✅ ${GREEN}FRONTEND OPÉRATIONNEL SUR PORT 7001${NC}"
    echo ""
    echo -e "  🌐 ${BLUE}URL: http://localhost:7001${NC}"
    echo ""
    echo "  📝 Prochaines étapes:"
    echo "    1. Ouvrir http://localhost:7001 dans le navigateur"
    echo "    2. Vérifier la console (F12) - erreur CORS doit disparaître"
    echo "    3. Tester la page des utilisateurs"
    echo ""
    echo "  📊 Logs en temps réel:"
    echo "    tail -f /tmp/frontend-7001.log"
    echo ""
    exit 0
else
    echo -e "  ❌ ${RED}ÉCHEC - Le frontend n'écoute pas sur 7001${NC}"
    echo ""
    echo "  🔍 Vérifier les logs complets:"
    echo "    cat /tmp/frontend-7001.log"
    echo ""
    exit 1
fi
