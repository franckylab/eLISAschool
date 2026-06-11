#!/bin/bash

# ==================================
# eLISAschool - Script de Démarrage
# ==================================
# Usage: ./scripts/start-dev.sh [--frontend|--backend|--all]

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   eLISAschool - Démarrage de l'Environnement Dev       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Par défaut : démarrer les deux
MODE="${1:---all}"

start_docker() {
    echo -e "${BLUE}🐳 Vérification des services Docker...${NC}"
    
    if ! docker ps > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker n'est pas en cours d'exécution${NC}"
        echo "Veuillez démarrer Docker d'abord"
        exit 1
    fi
    
    # Vérifier PostgreSQL
    if ! docker ps | grep -q postgres; then
        echo -e "${YELLOW}⚠️  PostgreSQL n'est pas en cours d'exécution${NC}"
        echo "Démarrage de PostgreSQL et Redis..."
        cd docker && docker-compose up -d postgres redis 2>/dev/null || true
        cd ..
        sleep 3
    else
        echo -e "${GREEN}✅${NC} PostgreSQL en cours d'exécution"
    fi
    
    # Vérifier Redis
    if ! docker ps | grep -q redis; then
        echo -e "${YELLOW}⚠️  Redis n'est pas en cours d'exécution${NC}"
        echo "Démarrage de Redis..."
        cd docker && docker-compose up -d redis 2>/dev/null || true
        cd ..
        sleep 2
    else
        echo -e "${GREEN}✅${NC} Redis en cours d'exécution"
    fi
    
    echo ""
}

start_backend() {
    echo -e "${BLUE}🚀 Démarrage du Backend...${NC}"
    echo "Port: 3001"
    echo "Docs: http://localhost:3001/api/docs"
    echo ""
    
    cd backend
    
    # Vérifier si déjà en cours
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Backend déjà en cours d'exécution"
    else
        echo "Démarrage..."
        npm run dev &
        BACKEND_PID=$!
        echo $BACKEND_PID > /tmp/elisaschool-backend.pid
        
        # Attendre que le backend soit prêt
        echo -n "En attente du backend"
        for i in {1..30}; do
            if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
                echo -e "\n${GREEN}✅${NC} Backend prêt !"
                break
            fi
            echo -n "."
            sleep 1
        done
        echo ""
    fi
    
    cd ..
}

start_frontend() {
    echo -e "${BLUE}🎨 Démarrage du Frontend...${NC}"
    echo "URL: http://localhost:5173"
    echo ""
    
    cd frontend
    
    # Vérifier si déjà en cours
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Frontend déjà en cours d'exécution"
    else
        echo "Démarrage..."
        npm run dev &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /tmp/elisaschool-frontend.pid
        
        # Attendre que le frontend soit prêt
        echo -n "En attente du frontend"
        for i in {1..30}; do
            if curl -s http://localhost:5173 > /dev/null 2>&1; then
                echo -e "\n${GREEN}✅${NC} Frontend prêt !"
                break
            fi
            echo -n "."
            sleep 1
        done
        echo ""
    fi
    
    cd ..
}

# Démarrage selon le mode
case $MODE in
    --backend)
        start_docker
        start_backend
        ;;
    --frontend)
        start_frontend
        ;;
    --all|*)
        start_docker
        start_backend
        start_frontend
        ;;
esac

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 ENVIRONNEMENT DE DÉVELOPPEMENT PRÊT !             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Accès rapide :${NC}"
echo "   • Frontend:    http://localhost:5173"
echo "   • Backend API: http://localhost:3001"
echo "   • Docs API:    http://localhost:3001/api/docs"
echo "   • Health:      http://localhost:3001/api/health"
echo ""
echo -e "${BLUE}📋 Commandes utiles :${NC}"
echo "   • Arrêter tout:    ./scripts/stop-dev.sh"
echo "   • Vérifier:        ./scripts/verify-setup.sh"
echo "   • Logs backend:    tail -f backend/logs/app.log"
echo "   • Logs frontend:   Console navigateur (F12)"
echo ""
echo -e "${YELLOW}💡 Astuce : Utiliser Ctrl+C dans chaque terminal pour arrêter${NC}"
echo ""
