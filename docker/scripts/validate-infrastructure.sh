#!/bin/bash
# ==================================
# eLISAschool - Script de Validation Infrastructure
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Usage: ./validate-infrastructure.sh [mode]
# Modes: local-dev, local-prod, cloud-dev, cloud-prod
#
# Ce script vérifie que toute l'infrastructure est opérationnelle

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DOCKER_DIR")"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${BLUE}[→]${NC} $1"; }

# Mode de déploiement
MODE=${1:-local-dev}

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   eLISAschool - Validation Infrastructure Docker       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
log_step "Mode: $MODE"
echo ""

# ==================================
# TEST 1: Structure des fichiers
# ==================================
log_step "TEST 1: Vérification de la structure des fichiers..."

ERRORS=0

# Fichiers docker-compose
COMPOSE_FILE="$DOCKER_DIR/docker-compose.${MODE//\-/\.}.yml"
if [ -f "$COMPOSE_FILE" ]; then
    log_info "docker-compose: $COMPOSE_FILE existe"
else
    log_error "docker-compose: $COMPOSE_FILE manquant"
    ERRORS=$((ERRORS + 1))
fi

# Fichiers .env
case $MODE in
    local-*)
        if [ -f "$DOCKER_DIR/.env.local" ]; then
            log_info ".env.local existe"
        else
            log_error ".env.local manquant"
            ERRORS=$((ERRORS + 1))
        fi
        ;;
    cloud-*)
        if [ -f "$DOCKER_DIR/.env.cloud" ]; then
            log_info ".env.cloud existe"
        else
            log_error ".env.cloud manquant"
            ERRORS=$((ERRORS + 1))
        fi
        ;;
esac

# Nginx (uniquement pour cloud)
if [[ $MODE == cloud-* ]]; then
    if [ -f "$DOCKER_DIR/nginx.conf" ]; then
        log_info "nginx.conf existe (fichier unique)"
        
        # Vérifier qu'il n'y a pas de fichiers redondants
        if [ -f "$DOCKER_DIR/nginx.dev.conf" ] || [ -f "$DOCKER_DIR/nginx.prod.conf" ]; then
            log_error "Fichiers nginx redondants détectés (nginx.dev.conf ou nginx.prod.conf)"
            ERRORS=$((ERRORS + 1))
        else
            log_info "Aucun fichier nginx redondant"
        fi
    else
        log_error "nginx.conf manquant"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Dockerfiles
if [ -f "$DOCKER_DIR/Dockerfile.backend" ]; then
    log_info "Dockerfile.backend existe"
else
    log_error "Dockerfile.backend manquant"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "$DOCKER_DIR/Dockerfile.frontend" ]; then
    log_info "Dockerfile.frontend existe"
else
    log_error "Dockerfile.frontend manquant"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ==================================
# TEST 2: Scripts de déploiement
# ==================================
log_step "TEST 2: Vérification des scripts..."

if [ -f "$DOCKER_DIR/deploy.sh" ]; then
    log_info "deploy.sh existe"
    if [ -x "$DOCKER_DIR/deploy.sh" ]; then
        log_info "deploy.sh est exécutable"
    else
        log_warning "deploy.sh n'est pas exécutable"
    fi
else
    log_error "deploy.sh manquant"
    ERRORS=$((ERRORS + 1))
fi

# Scripts de backup
BACKUP_SCRIPTS=("backup-auto.sh" "backup-manuel.sh" "restore.sh" "update.sh" "install-cron.sh")
for script in "${BACKUP_SCRIPTS[@]}"; do
    if [ -f "$DOCKER_DIR/scripts/$script" ]; then
        log_info "scripts/$script existe"
    else
        log_warning "scripts/$script manquant (optionnel)"
    fi
done

echo ""

# ==================================
# TEST 3: Configuration Nginx
# ==================================
if [[ $MODE == cloud-* ]]; then
    log_step "TEST 3: Validation configuration Nginx..."
    
    if [ -f "$DOCKER_DIR/nginx.conf" ]; then
        # Vérifier les upstreams
        if grep -q "upstream backend_api" "$DOCKER_DIR/nginx.conf"; then
            log_info "Upstream backend_api configuré"
        else
            log_error "Upstream backend_api manquant"
            ERRORS=$((ERRORS + 1))
        fi
        
        if grep -q "upstream frontend_app" "$DOCKER_DIR/nginx.conf"; then
            log_info "Upstream frontend_app configuré"
        else
            log_error "Upstream frontend_app manquant"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Vérifier le port backend (doit être 7000)
        if grep -q "server backend:7000" "$DOCKER_DIR/nginx.conf"; then
            log_info "Port backend correct (7000)"
        else
            log_error "Port backend incorrect (devrait être 7000)"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Vérifier les locations critiques
        if grep -q "location /api" "$DOCKER_DIR/nginx.conf"; then
            log_info "Location /api configurée"
        else
            log_error "Location /api manquante"
            ERRORS=$((ERRORS + 1))
        fi
        
        if grep -q "location /ws" "$DOCKER_DIR/nginx.conf"; then
            log_info "Location /ws (WebSocket) configurée"
        else
            log_warning "Location /ws manquante (optionnel)"
        fi
        
        if grep -q "location /api/monitoring" "$DOCKER_DIR/nginx.conf"; then
            log_info "Location /api/monitoring configurée"
        else
            log_warning "Location /api/monitoring manquante (optionnel)"
        fi
    fi
    
    echo ""
fi

# ==================================
# TEST 4: Structure des backups
# ==================================
log_step "TEST 4: Vérification structure des backups..."

BACKUP_DIR="$DOCKER_DIR/backups"
BACKUP_SUBDIRS=("daily" "weekly" "monthly" "manual")

for dir in "${BACKUP_SUBDIRS[@]}"; do
    if [ -d "$BACKUP_DIR/$dir" ]; then
        log_info "backups/$dir existe"
    else
        log_warning "backups/$dir manquant (sera créé au premier backup)"
    fi
done

echo ""

# ==================================
# TEST 5: Module Monitoring Backend
# ==================================
log_step "TEST 5: Vérification module monitoring backend..."

MONITORING_DIR="$PROJECT_ROOT/backend/src/modules/monitoring"

if [ -d "$MONITORING_DIR" ]; then
    log_info "Module monitoring existe"
    
    # Vérifier les fichiers critiques
    if [ -f "$MONITORING_DIR/controllers/monitoring.controller.ts" ]; then
        log_info "monitoring.controller.ts existe"
        
        # Vérifier les endpoints
        ENDPOINTS=("/health" "/metrics" "/stats" "/backups" "/updates" "/maintenance" "/logs")
        for endpoint in "${ENDPOINTS[@]}"; do
            if grep -q "router.get('$endpoint'\|router.post('$endpoint'" "$MONITORING_DIR/controllers/monitoring.controller.ts"; then
                log_info "  Endpoint $endpoint configuré"
            else
                log_warning "  Endpoint $endpoint manquant"
            fi
        done
    else
        log_error "monitoring.controller.ts manquant"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -f "$MONITORING_DIR/services/monitoring.service.ts" ]; then
        log_info "monitoring.service.ts existe"
    else
        log_error "monitoring.service.ts manquant"
        ERRORS=$((ERRORS + 1))
    fi
else
    log_error "Module monitoring non trouvé"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ==================================
# TEST 6: Docker Compose validation
# ==================================
log_step "TEST 6: Validation syntaxe Docker Compose..."

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    if [ -f "$COMPOSE_FILE" ]; then
        if docker-compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
            log_info "Syntaxe Docker Compose valide"
        else
            log_error "Erreur de syntaxe dans Docker Compose"
            ERRORS=$((ERRORS + 1))
        fi
    fi
else
    log_warning "Docker non installé - validation syntaxe ignorée"
fi

echo ""

# ==================================
# TEST 7: Ports disponibles
# ==================================
log_step "TEST 7: Vérification des ports..."

case $MODE in
    local-dev|local-prod)
        PORTS=(7000 7001 7002 7003)
        PORT_NAMES=("Backend" "Frontend" "PostgreSQL" "Redis")
        
        for i in "${!PORTS[@]}"; do
            PORT=${PORTS[$i]}
            NAME=${PORT_NAMES[$i]}
            
            if ! ss -tlnp | grep -q ":$PORT "; then
                log_info "Port $PORT ($NAME) disponible"
            else
                log_warning "Port $PORT ($NAME) déjà utilisé"
            fi
        done
        ;;
    cloud-dev|cloud-prod)
        PORTS=(80 443)
        PORT_NAMES=("HTTP" "HTTPS")
        
        for i in "${!PORTS[@]}"; do
            PORT=${PORTS[$i]}
            NAME=${PORT_NAMES[$i]}
            
            if ! ss -tlnp | grep -q ":$PORT "; then
                log_info "Port $PORT ($NAME) disponible"
            else
                log_warning "Port $PORT ($NAME) déjà utilisé"
            fi
        done
        ;;
esac

echo ""

# ==================================
# RÉSUMÉ
# ==================================
echo "╔════════════════════════════════════════════════════════╗"
echo "║                   R É S U M É                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ]; then
    log_info "═══════════════════════════════════════════════"
    log_info "  ✅ TOUS LES TESTS SONT PASSÉS !"
    log_info "  Infrastructure prête pour le déploiement"
    log_info "═══════════════════════════════════════════════"
    echo ""
    log_info "Pour déployer :"
    log_info "  cd $DOCKER_DIR"
    log_info "  ./deploy.sh $MODE up"
    echo ""
    exit 0
else
    log_error "═══════════════════════════════════════════════"
    log_error "  ❌ $ERRORS ERREUR(S) DÉTECTÉE(S)"
    log_error "  Corriger les erreurs avant déploiement"
    log_error "═══════════════════════════════════════════════"
    echo ""
    exit 1
fi
