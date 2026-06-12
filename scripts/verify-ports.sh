#!/bin/bash

# ==================================
# eLISAschool - Script de Vérification des Ports
# ==================================
# Version: 1.0.0
# Usage: bash scripts/verify-ports.sh

echo "========================================"
echo "  eLISAschool - Vérification des Ports"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports à vérifier
declare -A PORTS=(
    ["Backend API"]="7000"
    ["Frontend Dev"]="7001"
    ["PostgreSQL"]="7002"
    ["Redis"]="7003"
    ["pgAdmin"]="7004"
)

PASS=0
FAIL=0
WARN=0

echo "📋 Vérification des ports eLISAschool..."
echo ""

# Fonction pour vérifier un port
check_port() {
    local service_name=$1
    local port=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}$service_name${NC} (port $port) - ${GREEN}ACTIF${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "❌ ${RED}$service_name${NC} (port $port) - ${RED}INACTIF${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# Vérifier chaque port
for service in "${!PORTS[@]}"; do
    check_port "$service" "${PORTS[$service]}"
done

echo ""
echo "========================================"
echo "  Résumé"
echo "========================================"
echo -e "✅ Succès: ${GREEN}$PASS${NC}"
echo -e "❌ Échecs: ${RED}$FAIL${NC}"
echo ""

# Vérifier la configuration Docker
echo "🐳 Vérification Docker Compose..."
echo ""

if command -v docker &> /dev/null && command -v docker compose &> /dev/null; then
    if docker compose ps 2>/dev/null | grep -q "elisaschool"; then
        echo -e "✅ ${GREEN}Docker Compose${NC} - Services détectés"
        echo ""
        docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep elisaschool
    else
        echo -e "⚠️  ${YELLOW}Docker Compose${NC} - Aucun service eLISAschool détecté"
        echo "   Exécutez: docker compose up -d"
        WARN=$((WARN + 1))
    fi
else
    echo -e "❌ ${RED}Docker Compose${NC} - Non installé ou non accessible"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "========================================"
echo "  Tests de Connectivité"
echo "========================================"
echo ""

# Test Backend API
echo "🔌 Test Backend API (http://localhost:7000/api/health)..."
if curl -s --connect-timeout 2 http://localhost:7000/api/health > /dev/null 2>&1; then
    echo -e "✅ ${GREEN}Backend API${NC} - Accessible"
    PASS=$((PASS + 1))
else
    echo -e "❌ ${RED}Backend API${NC} - Non accessible"
    FAIL=$((FAIL + 1))
fi

# Test Frontend
echo "🔌 Test Frontend (http://localhost:7001)..."
if curl -s --connect-timeout 2 -o /dev/null -w "%{http_code}" http://localhost:7001 | grep -q "200\|301\|302"; then
    echo -e "✅ ${GREEN}Frontend${NC} - Accessible"
    PASS=$((PASS + 1))
else
    echo -e "❌ ${RED}Frontend${NC} - Non accessible"
    FAIL=$((FAIL + 1))
fi

# Test PostgreSQL
echo "🔌 Test PostgreSQL (localhost:7002)..."
if psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "✅ ${GREEN}PostgreSQL${NC} - Accessible"
    PASS=$((PASS + 1))
else
    echo -e "❌ ${RED}PostgreSQL${NC} - Non accessible"
    FAIL=$((FAIL + 1))
fi

# Test Redis
echo "🔌 Test Redis (localhost:7003)..."
if redis-cli -h localhost -p 7003 -a elisaschool_password ping 2>/dev/null | grep -q "PONG"; then
    echo -e "✅ ${GREEN}Redis${NC} - Accessible"
    PASS=$((PASS + 1))
else
    echo -e "❌ ${RED}Redis${NC} - Non accessible"
    FAIL=$((FAIL + 1))
fi

# Test pgAdmin
echo "🔌 Test pgAdmin (http://localhost:7004)..."
if curl -s --connect-timeout 2 -o /dev/null -w "%{http_code}" http://localhost:7004 | grep -q "200\|301\|302"; then
    echo -e "✅ ${GREEN}pgAdmin${NC} - Accessible"
    PASS=$((PASS + 1))
else
    echo -e "❌ ${RED}pgAdmin${NC} - Non accessible"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "========================================"
echo "  Résumé Final"
echo "========================================"
echo -e "✅ Succès: ${GREEN}$PASS${NC}"
echo -e "❌ Échecs: ${RED}$FAIL${NC}"
echo -e "⚠️  Avertissements: ${YELLOW}$WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "🎉 ${GREEN}Tous les tests sont passés !${NC}"
    echo ""
    echo "📚 Documentation:"
    echo "   - CONFIGURATION-PORTS.md (guide complet)"
    echo "   - VERIFICATION-PORTS.md (checklist de validation)"
    echo "   - docker/README.md (guide Docker)"
    echo ""
    exit 0
else
    echo -e "⚠️  ${YELLOW}Certains tests ont échoué.${NC}"
    echo ""
    echo "🔧 Actions recommandées:"
    echo "   1. Vérifier que Docker Compose est démarré: docker compose up -d"
    echo "   2. Consulter les logs: docker compose logs <service>"
    echo "   3. Vérifier la configuration dans .env et docker/.env"
    echo "   4. Lire VERIFICATION-PORTS.md pour le dépannage"
    echo ""
    exit 1
fi
