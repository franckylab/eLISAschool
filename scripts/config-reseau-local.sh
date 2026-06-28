#!/bin/bash
# ==================================
# eLISAschool - Configuration Accès Réseau Local
# ==================================
# Usage: ./scripts/config-reseau-local.sh [IP_SERVEUR]
# Exemple: ./scripts/config-reseau-local.sh 10.0.0.101

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   eLISAschool - Configuration Accès Réseau Local      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Étape 1: Trouver l'IP du serveur
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

# Étape 2: Vérifier le fichier .env
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Fichier .env non trouvé: $ENV_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Configuration du fichier .env...${NC}"

# Sauvegarder l'ancien ALLOWED_ORIGINS
OLD_ALLOWED_ORIGINS=$(grep "^ALLOWED_ORIGINS=" "$ENV_FILE" | cut -d'=' -f2-)
echo -e "${BLUE}📋 Ancienne config: ALLOWED_ORIGINS=$OLD_ALLOWED_ORIGINS${NC}"

# Ajouter la nouvelle IP si elle n'existe pas déjà
if echo "$OLD_ALLOWED_ORIGINS" | grep -q "$SERVER_IP"; then
    echo -e "${GREEN}✅ L'IP $SERVER_IP est déjà dans ALLOWED_ORIGINS${NC}"
else
    # Ajouter l'IP
    NEW_ALLOWED_ORIGINS="${OLD_ALLOWED_ORIGINS},http://${SERVER_IP}:7001"
    
    # Mettre à jour le fichier .env
    sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${NEW_ALLOWED_ORIGINS}|" "$ENV_FILE"
    
    echo -e "${GREEN}✅ Nouvelle config: ALLOWED_ORIGINS=${NEW_ALLOWED_ORIGINS}${NC}"
fi

echo ""

# Étape 3: Vérifier la configuration Docker
echo -e "${YELLOW}🔍 Vérification de docker-compose.yml...${NC}"

if grep -q "0.0.0.0:" "$PROJECT_DIR/docker-compose.yml"; then
    echo -e "${GREEN}✅ Docker écoute sur 0.0.0.0 (toutes interfaces)${NC}"
else
    echo -e "${RED}⚠️  Docker n'écoute pas sur 0.0.0.0${NC}"
    echo -e "${YELLOW}💡 Modifiez docker-compose.yml pour utiliser 0.0.0.0:${NC}"
    echo "   ports:"
    echo '     - "0.0.0.0:${APP_PORT:-7000}:7000"'
    echo '     - "0.0.0.0:${FRONTEND_PORT:-7001}:7001"'
fi

echo ""

# Étape 4: Redémarrer les services
echo -e "${YELLOW}🔄 Redémarrage des services...${NC}"
cd "$PROJECT_DIR"

if docker compose ps 2>/dev/null | grep -q "elisaschool"; then
    docker compose restart backend frontend 2>&1 | grep -E "Container|Restarting" || true
    echo -e "${GREEN}✅ Services redémarrés${NC}"
else
    echo -e "${YELLOW}⚠️  Les conteneurs ne sont pas en cours d'exécution${NC}"
    echo -e "${YELLOW}💡 Lancez: docker compose up -d${NC}"
fi

echo ""

# Étape 5: Afficher les URLs d'accès
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          URLs d'Accès Configurées                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend (depuis ce serveur):${NC}"
echo -e "   http://localhost:7001"
echo ""
echo -e "${GREEN}🌐 Frontend (depuis le réseau local):${NC}"
echo -e "   http://${SERVER_IP}:7001"
echo ""
echo -e "${GREEN}🔌 Backend API:${NC}"
echo -e "   http://${SERVER_IP}:7000/api/health"
echo ""
echo -e "${GREEN}🗄️  pgAdmin:${NC}"
echo -e "   http://${SERVER_IP}:7004"
echo ""

# Étape 6: Instructions pour les autres machines
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Accès depuis une Autre Machine               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Sur une autre machine du réseau (ex: 10.0.0.50):${NC}"
echo -e "   1. Ouvrir le navigateur"
echo -e "   2. Aller à: ${GREEN}http://${SERVER_IP}:7001${NC}"
echo -e "   3. Se connecter avec vos identifiants"
echo ""

# Étape 7: Test de connectivité
echo -e "${YELLOW}🧪 Test de connectivité...${NC}"

# Attendre que les services soient prêts
sleep 3

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:7001/" | grep -q "200"; then
    echo -e "${GREEN}✅ Frontend accessible sur localhost:7001${NC}"
else
    echo -e "${RED}❌ Frontend non accessible sur localhost:7001${NC}"
fi

if curl -s "http://localhost:7000/api/health" | grep -q "opérationnelle"; then
    echo -e "${GREEN}✅ Backend accessible sur localhost:7000${NC}"
else
    echo -e "${RED}❌ Backend non accessible sur localhost:7000${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Configuration terminée avec succès ! 🎉             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📖 Pour plus d'informations, consultez:${NC}"
echo -e "   ${YELLOW}GUIDE-ACCES-RESEAU-LOCAL.md${NC}"
echo ""
