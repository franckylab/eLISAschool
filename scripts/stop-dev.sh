#!/bin/bash

# ==================================
# eLISAschool - Script d'Arrêt
# ==================================
# Usage: ./scripts/stop-dev.sh [--frontend|--backend|--all]

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   eLISAschool - Arrêt de l'Environnement Dev           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE="${1:---all}"

stop_process() {
    local name="$1"
    local pid_file="$2"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -n "Arrêt de $name (PID: $pid)... "
            kill "$pid" 2>/dev/null || true
            sleep 2
            
            # Vérifier si toujours en cours
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}Forcement...${NC}"
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
            fi
            
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${YELLOW}⚠️${NC} $name déjà arrêté"
        fi
        rm -f "$pid_file"
    else
        # Essayer de trouver le processus
        local pids=$(pgrep -f "node.*$name" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo -n "Arrêt de $name (auto-détecté)... "
            echo "$pids" | xargs kill 2>/dev/null || true
            sleep 2
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${YELLOW}⚠️${NC} $name non trouvé"
        fi
    fi
}

case $MODE in
    --backend)
        echo -e "${BLUE}🛑 Arrêt du Backend...${NC}"
        stop_process "backend" "/tmp/elisaschool-backend.pid"
        ;;
    --frontend)
        echo -e "${BLUE}🛑 Arrêt du Frontend...${NC}"
        stop_process "frontend" "/tmp/elisaschool-frontend.pid"
        ;;
    --all|*)
        echo -e "${BLUE}🛑 Arrêt de tous les services...${NC}"
        stop_process "backend" "/tmp/elisaschool-backend.pid"
        stop_process "frontend" "/tmp/elisaschool-frontend.pid"
        ;;
esac

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ SERVICES ARRÊTÉS                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}💡 Pour arrêter Docker également :${NC}"
echo "   cd docker && docker-compose stop"
echo ""
