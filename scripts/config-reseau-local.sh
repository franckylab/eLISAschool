#!/bin/bash
# ==================================
# ⚠️ DEPRECIE — Utiliser docker/deploy.sh a la place.
# Ce script est conserve pour compatibilite (dev natif sans Docker).
# Pour Docker: cd docker && ./deploy.sh local-dev up
# eLISAschool - Configuration Accès Réseau Local
# ==================================
# Version: 2.0.0
# Usage: ./scripts/config-reseau-local.sh [IP_SERVEUR]
# Exemple: ./scripts/config-reseau-local.sh 10.0.0.101
#
# Ce script configure automatiquement :
# - Le frontend (.env.local) pour accéder au backend
# - Le backend (.env) pour accepter les connexions du réseau
# - Les permissions firewall (si nécessaire)
# - Vérifie la connectivité

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_ENV="$PROJECT_DIR/frontend/.env.local"
BACKEND_ENV="$PROJECT_DIR/backend/.env"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   eLISAschool - Configuration Accès Réseau Local      ║${NC}"
echo -e "${BLUE}║                    v2.0.0                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# Étape 1: Détection de l'IP du serveur
# ══════════════════════════════════════════════════════════════
if [ -z "$1" ]; then
    echo -e "${YELLOW}🔍 Détection automatique de l'IP du serveur...${NC}"
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    if [ -z "$SERVER_IP" ]; then
        echo -e "${RED}❌ Impossible de détecter l'IP automatiquement${NC}"
        echo -e "${YELLOW}💡 Usage: $0 <IP_SERVEUR>${NC}"
        echo -e "${YELLOW}   Exemple: $0 10.0.0.101${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ IP détectée: ${SERVER_IP}${NC}"
else
    SERVER_IP="$1"
    echo -e "${GREEN}✅ IP fournie: ${SERVER_IP}${NC}"
fi

echo ""
echo -e "${CYAN}─── Mode de fonctionnement ───${NC}"
echo -e "${YELLOW}Choisissez le mode de déploiement :${NC}"
echo -e "  ${GREEN}1)${NC} Backend sur la MÊME machine (proxy Vite)"
echo -e "  ${GREEN}2)${NC} Backend sur une AUTRE machine (accès direct)"
echo ""
read -p "Mode [1] : " MODE_CHOICE
MODE_CHOICE=${MODE_CHOICE:-1}

if [ "$MODE_CHOICE" = "2" ]; then
    read -p "IP du serveur backend [$SERVER_IP] : " BACKEND_IP
    BACKEND_IP=${BACKEND_IP:-$SERVER_IP}
else
    BACKEND_IP=$SERVER_IP
fi

echo ""

# ══════════════════════════════════════════════════════════════
# Étape 2: Configuration du Frontend
# ══════════════════════════════════════════════════════════════
echo -e "${CYAN}─── Configuration Frontend ───${NC}"

if [ ! -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}📝 Création du fichier .env.local...${NC}"
fi

if [ "$MODE_CHOICE" = "1" ]; then
    # MODE 1 : Proxy Vite (même machine)
    cat > "$FRONTEND_ENV" << EOF
# ==================================
# eLISAschool - Frontend Environment (Local)
# ==================================
# Configuré automatiquement le $(date '+%Y-%m-%d %H:%M:%S')
# Mode: Proxy Vite (backend sur la même machine)

# URL du backend pour le proxy Vite
BACKEND_URL=http://${BACKEND_IP}:7000

# API URL — VIDE pour utiliser le proxy Vite
VITE_API_URL=

# Application
VITE_APP_ENV=development
VITE_DEBUG=true
EOF
    echo -e "${GREEN}✅ Mode proxy Vite configuré (BACKEND_URL=http://${BACKEND_IP}:7000)${NC}"
else
    # MODE 2 : Accès direct (machine différente)
    cat > "$FRONTEND_ENV" << EOF
# ==================================
# eLISAschool - Frontend Environment (Local)
# ==================================
# Configuré automatiquement le $(date '+%Y-%m-%d %H:%M:%S')
# Mode: Accès direct (backend sur machine distante)

# URL du backend pour le proxy Vite (non utilisé en mode direct)
BACKEND_URL=http://localhost:7000

# API URL — Accès direct au backend
VITE_API_URL=http://${BACKEND_IP}:7000

# Application
VITE_APP_ENV=development
VITE_DEBUG=true
EOF
    echo -e "${GREEN}✅ Mode accès direct configuré (VITE_API_URL=http://${BACKEND_IP}:7000)${NC}"
fi

echo ""

# ══════════════════════════════════════════════════════════════
# Étape 3: Configuration du Backend
# ══════════════════════════════════════════════════════════════
echo -e "${CYAN}─── Configuration Backend ───${NC}"

if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}📝 Création du fichier .env backend...${NC}"
fi

# Construire ALLOWED_ORIGINS
ALLOWED="http://localhost,http://127.0.0.1,http://0.0.0.0,http://localhost:7001,http://${SERVER_IP}:7001"
# Ajouter l'IP du backend si différente
if [ "$BACKEND_IP" != "$SERVER_IP" ]; then
    ALLOWED="${ALLOWED},http://${BACKEND_IP}:7001"
fi

# Vérifier si le fichier existe déjà et préserver les secrets
if [ -f "$BACKEND_ENV" ]; then
    # Extraire les valeurs existantes
    EXISTING_JWT=$(grep "^JWT_SECRET=" "$BACKEND_ENV" | cut -d'=' -f2- || echo "")
    EXISTING_ENCRYPTION=$(grep "^ENCRYPTION_KEY=" "$BACKEND_ENV" | cut -d'=' -f2- || echo "")
    EXISTING_DB_PASS=$(grep "^DB_PASSWORD=" "$BACKEND_ENV" | cut -d'=' -f2- || echo "")
fi

JWT_SECRET=${EXISTING_JWT:-"dev-jwt-secret-elisaschool-2024-abcdefgh"}
ENCRYPTION_KEY=${EXISTING_ENCRYPTION:-"fb343819f0f55cc8db6d953e3e2a77af"}
DB_PASSWORD=${EXISTING_DB_PASS:-"elisaschool_password"}

cat > "$BACKEND_ENV" << EOF
# ==================================
# eLISAschool - Backend Environment
# ==================================
# Configuré automatiquement le $(date '+%Y-%m-%d %H:%M:%S')
# IP serveur: ${SERVER_IP}

# Environnement
NODE_ENV=development

# Application
APP_NAME=eLISAschool
APP_VERSION=1.0.0
APP_PORT=7000
APP_URL=http://${SERVER_IP}:7000

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=7002
DB_NAME=elisaschool
DB_USER=elisaschool_user
DB_PASSWORD=${DB_PASSWORD}

# JWT Authentication
JWT_SECRET=${JWT_SECRET}

# Chiffrement AES-256 (exactement 32 caractères)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Frontend URL (CORS)
FRONTEND_URL=http://${SERVER_IP}:7001

# Origines autorisées (séparées par des virgules)
ALLOWED_ORIGINS=${ALLOWED}

# Redis (Cache distribué)
REDIS_HOST=localhost
REDIS_PORT=7003
REDIS_PASSWORD=

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Cron Jobs
ENABLE_CRON_JOBS=true
EOF

echo -e "${GREEN}✅ Backend configuré${NC}"
echo -e "   FRONTEND_URL=http://${SERVER_IP}:7001"
echo -e "   ALLOWED_ORIGINS=${ALLOWED}"
echo ""

# ══════════════════════════════════════════════════════════════
# Étape 4: Configuration Firewall (optionnel)
# ══════════════════════════════════════════════════════════════
echo -e "${CYAN}─── Vérification Firewall ───${NC}"

# Vérifier si ufw est actif
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1 || echo "inactive")
    if echo "$UFW_STATUS" | grep -q "active"; then
        echo -e "${YELLOW}⚠️  UFW est actif — ouverture des ports...${NC}"
        sudo ufw allow 7000/tcp comment "eLISAschool Backend API" 2>/dev/null || true
        sudo ufw allow 7001/tcp comment "eLISAschool Frontend" 2>/dev/null || true
        echo -e "${GREEN}✅ Ports 7000 et 7001 ouverts${NC}"
    else
        echo -e "${GREEN}✅ UFW inactif — aucun blocage${NC}"
    fi
else
    echo -e "${GREEN}✅ Pas de firewall détecté${NC}"
fi

# Vérifier si iptables bloque
if command -v iptables &> /dev/null; then
    # Vérifier si le port 7000 est accessible
    echo -e "${GREEN}✅ iptables présent (vérification manuelle si problème)${NC}"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# Étape 5: Vérification Docker (si actif)
# ══════════════════════════════════════════════════════════════
echo -e "${CYAN}─── Vérification Docker ───${NC}"

if docker compose ps 2>/dev/null | grep -q "elisaschool"; then
    echo -e "${YELLOW}🔄 Docker détecté — redémarrage des services...${NC}"
    cd "$PROJECT_DIR/docker"
    
    # Mettre à jour le .env Docker si nécessaire
    if [ -f ".env" ] || [ -f ".env.local" ]; then
        echo -e "${GREEN}✅ Configuration Docker présente${NC}"
    fi
    
    docker compose restart backend frontend 2>&1 | grep -E "Container|Restarting" || true
    echo -e "${GREEN}✅ Services Docker redémarrés${NC}"
else
    echo -e "${YELLOW}ℹ️  Docker non actif — mode développement natif${NC}"
    echo -e "${CYAN}   Pour démarrer :${NC}"
    echo -e "   ${GREEN}Terminal 1:${NC} cd backend && npm run dev"
    echo -e "   ${GREEN}Terminal 2:${NC} cd frontend && npm run dev"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# Étape 6: Test de connectivité
# ══════════════════════════════════════════════════════════════
echo -e "${CYAN}─── Tests de connectivité ───${NC}"

sleep 2

# Test backend
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:7000/api/health" 2>/dev/null || echo "000")
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Backend accessible sur http://localhost:7000${NC}"
else
    echo -e "${RED}❌ Backend non accessible sur http://localhost:7000 (HTTP $BACKEND_HEALTH)${NC}"
    echo -e "${YELLOW}   → Le backend est-il démarré ? (cd backend && npm run dev)${NC}"
fi

# Test frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:7001/" 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible sur http://localhost:7001${NC}"
else
    echo -e "${RED}❌ Frontend non accessible sur http://localhost:7001 (HTTP $FRONTEND_STATUS)${NC}"
    echo -e "${YELLOW}   → Le frontend est-il démarré ? (cd frontend && npm run dev)${NC}"
fi

# Test accès réseau (depuis la même machine, simuler un client distant)
if [ "$MODE_CHOICE" = "1" ]; then
    NETWORK_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_IP}:7001/" 2>/dev/null || echo "000")
    if [ "$NETWORK_TEST" = "200" ]; then
        echo -e "${GREEN}✅ Frontend accessible via réseau sur http://${SERVER_IP}:7001${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend non accessible via ${SERVER_IP}:7001 (HTTP $NETWORK_TEST)${NC}"
        echo -e "${YELLOW}   → Vérifiez que le frontend écoute sur 0.0.0.0${NC}"
    fi
fi

echo ""

# ══════════════════════════════════════════════════════════════
# Étape 7: Résumé et instructions
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Configuration Terminée — Résumé              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 URLs d'accès :${NC}"
echo ""
echo -e "   ${CYAN}Depuis ce serveur :${NC}"
echo -e "   Frontend :  http://localhost:7001"
echo -e "   Backend  :  http://localhost:7000/api/health"
echo ""
echo -e "   ${CYAN}Depuis le réseau local :${NC}"
echo -e "   Frontend :  http://${SERVER_IP}:7001"
echo -e "   Backend  :  http://${SERVER_IP}:7000/api/health"
echo ""

if [ "$MODE_CHOICE" = "2" ]; then
    echo -e "   ${CYAN}Mode accès direct (backend sur ${BACKEND_IP}) :${NC}"
    echo -e "   API URL  :  http://${BACKEND_IP}:7000"
    echo ""
fi

echo -e "${YELLOW}📱 Depuis une autre machine (ex: 10.0.0.50) :${NC}"
echo -e "   1. Ouvrir un navigateur"
echo -e "   2. Aller à : ${GREEN}http://${SERVER_IP}:7001${NC}"
echo -e "   3. Se connecter avec vos identifiants"
echo ""

echo -e "${YELLOW}⚠️  Important :${NC}"
echo -e "   • Le backend DOIT écouter sur ${GREEN}0.0.0.0${NC} (toutes interfaces)"
echo -e "   • Le frontend DOIT écouter sur ${GREEN}0.0.0.0${NC} (toutes interfaces)"
echo -e "   • En mode 1, le ${GREEN}proxy Vite${NC} redirige /api vers le backend"
echo -e "   • En mode 2, le frontend accède ${GREEN}directement${NC} au backend"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Configuration réseau local terminée ! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
