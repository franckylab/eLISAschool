#!/bin/bash
# ==================================
# eLISAschool - Script de Déploiement Intelligent
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Usage: cd docker && ./deploy.sh <mode> [action]
# Modes: local-dev, local-prod, cloud-dev, cloud-prod
# Actions: up, down, restart, status, logs, rebuild

# Déterminer le répertoire racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Se placer dans le répertoire racine du projet
cd "$PROJECT_ROOT" || exit 1

set -e

# ==================================
# COULEURS
# ==================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==================================
# FONCTIONS DE LOG
# ==================================
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_section() { echo -e "${CYAN}═══════════════════════════════════════${NC}"; }

# ==================================
# DÉTECTION IP AUTOMATIQUE
# ==================================
detect_host_ip() {
    if [ -n "$HOST_IP" ] && [ "$HOST_IP" != "AUTO_DETECT" ]; then
        log_info "IP manuelle: $HOST_IP"
        echo "$HOST_IP"
        return
    fi
    
    log_info "Détection automatique de l'IP..."
    
    # Essayer différentes méthodes
    local ip=""
    
    # Méthode 1: hostname -I (Linux)
    if command -v hostname &> /dev/null; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    # Méthode 2: ip route (Linux alternatif)
    if [ -z "$ip" ] && command -v ip &> /dev/null; then
        ip=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
    fi
    
    # Méthode 3: ifconfig (macOS/ancien Linux)
    if [ -z "$ip" ] && command -v ifconfig &> /dev/null; then
        ip=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -n1)
    fi
    
    if [ -z "$ip" ]; then
        log_warning "Impossible de détecter l'IP, utilisation de localhost"
        echo "localhost"
    else
        log_success "IP détectée: $ip"
        echo "$ip"
    fi
}

# ==================================
# GÉNÉRATION SECRETS AUTOMATIQUE
# ==================================
generate_secrets() {
    local env_file=$1
    
    if grep -q "__AUTO_GENERATE__" "$env_file" 2>/dev/null; then
        log_info "Génération des secrets..."
        
        # Générer secrets sécurisés
        local db_pass=$(openssl rand -base64 32 | tr -d '\n')
        local jwt_secret=$(openssl rand -base64 48 | tr -d '\n')
        local redis_pass=$(openssl rand -base64 32 | tr -d '\n')
        local encryption_key=$(openssl rand -base64 24 | tr -d '\n' | head -c 32)
        local pgadmin_pass=$(openssl rand -base64 16 | tr -d '\n')
        
        # Remplacer dans le fichier .env (compatible macOS et Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/DB_PASSWORD=__AUTO_GENERATE__/DB_PASSWORD=$db_pass/" "$env_file"
            sed -i '' "s/JWT_SECRET=__AUTO_GENERATE__/JWT_SECRET=$jwt_secret/" "$env_file"
            sed -i '' "s/REDIS_PASSWORD=__AUTO_GENERATE__/REDIS_PASSWORD=$redis_pass/" "$env_file"
            sed -i '' "s/ENCRYPTION_KEY=__AUTO_GENERATE__/ENCRYPTION_KEY=$encryption_key/" "$env_file"
            sed -i '' "s/PGADMIN_PASSWORD=__AUTO_GENERATE__/PGADMIN_PASSWORD=$pgadmin_pass/" "$env_file"
        else
            sed -i "s/DB_PASSWORD=__AUTO_GENERATE__/DB_PASSWORD=$db_pass/" "$env_file"
            sed -i "s/JWT_SECRET=__AUTO_GENERATE__/JWT_SECRET=$jwt_secret/" "$env_file"
            sed -i "s/REDIS_PASSWORD=__AUTO_GENERATE__/REDIS_PASSWORD=$redis_pass/" "$env_file"
            sed -i "s/ENCRYPTION_KEY=__AUTO_GENERATE__/ENCRYPTION_KEY=$encryption_key/" "$env_file"
            sed -i "s/PGADMIN_PASSWORD=__AUTO_GENERATE__/PGADMIN_PASSWORD=$pgadmin_pass/" "$env_file"
        fi
        
        log_success "Secrets générés et sauvegardés dans $env_file"
        log_warning "⚠️  CONSERVEZ CE FICHIER PRÉCIEUSEMENT !"
        log_warning "⚠️  Ne le commitez PAS dans Git !"
    fi
}

# ==================================
# VALIDATION PRODUCTION
# ==================================
validate_production() {
    local env_file=$1
    
    log_info "Validation configuration production..."
    
    # Vérifier JWT_SECRET
    local jwt_secret=$(grep "^JWT_SECRET=" "$env_file" | cut -d'=' -f2)
    if [ ${#jwt_secret} -lt 64 ]; then
        log_error "JWT_SECRET doit faire au moins 64 caractères en production (actuel: ${#jwt_secret})"
        exit 1
    fi
    
    # Vérifier DB_PASSWORD
    local db_pass=$(grep "^DB_PASSWORD=" "$env_file" | cut -d'=' -f2)
    if [ ${#db_pass} -lt 16 ]; then
        log_error "DB_PASSWORD doit faire au moins 16 caractères en production (actuel: ${#db_pass})"
        exit 1
    fi
    
    # Vérifier ENCRYPTION_KEY
    local enc_key=$(grep "^ENCRYPTION_KEY=" "$env_file" | cut -d'=' -f2)
    if [ ${#enc_key} -lt 32 ]; then
        log_error "ENCRYPTION_KEY doit faire au moins 32 caractères (actuel: ${#enc_key})"
        exit 1
    fi
    
    log_success "Validation production réussie"
}

# ==================================
# VÉRIFICATION PRÉREQUIS
# ==================================
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # OpenSSL (pour génération secrets)
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL n'est pas installé (nécessaire pour génération secrets)"
        exit 1
    fi
    
    log_success "Prérequis OK"
}

# ==================================
# PRÉPARATION ENVIRONNEMENT
# ==================================
prepare_environment() {
    local mode=$1
    local env_file=""
    local compose_file=""
    
    case $mode in
        local-dev)
            env_file="docker/.env.local"
            compose_file="docker/docker-compose.local.dev.yml"
            ;;
        local-prod)
            env_file="docker/.env.local"
            compose_file="docker/docker-compose.local.prod.yml"
            ;;
        cloud-dev)
            env_file="docker/.env.cloud"
            compose_file="docker/docker-compose.cloud.dev.yml"
            ;;
        cloud-prod)
            env_file="docker/.env.cloud"
            compose_file="docker/docker-compose.cloud.prod.yml"
            ;;
        *)
            log_error "Mode invalide: $mode"
            echo "Modes valides: local-dev, local-prod, cloud-dev, cloud-prod"
            exit 1
            ;;
    esac
    
    # Vérifier fichier .env existe
    if [ ! -f "$env_file" ]; then
        log_error "Fichier $env_file non trouvé"
        log_info "Copiez .env.local.example ou .env.cloud.example et renommez-le"
        exit 1
    fi
    
    # Générer secrets si nécessaire
    generate_secrets "$env_file"
    
    # Validation production
    if [[ "$mode" == *"prod"* ]]; then
        validate_production "$env_file"
    fi
    
    # Détecter IP pour local
    if [[ "$mode" == "local"* ]]; then
        export HOST_IP=$(detect_host_ip)
        
        # Configurer CORS automatiquement
        if grep -q "^ALLOWED_ORIGINS=$" "$env_file" 2>/dev/null; then
            local origins="http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://$HOST_IP:7001"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/^ALLOWED_ORIGINS=$/ALLOWED_ORIGINS=$origins/" "$env_file"
            else
                sed -i "s/^ALLOWED_ORIGINS=$/ALLOWED_ORIGINS=$origins/" "$env_file"
            fi
            log_success "CORS configurés automatiquement"
        fi
    fi
    
    # Exporter variables d'environnement
    set -a
    source "$env_file"
    set +a
    
    log_success "Environnement prêt: $mode"
    echo "$compose_file"
}

# ==================================
# COMMANDES DOCKER
# ==================================
docker_up() {
    local compose_file=$1
    log_info "Démarrage des conteneurs..."
    docker compose -f "$compose_file" up -d --remove-orphans
    log_success "Conteneurs démarrés"
    
    # Attendre health checks
    log_info "Attente des services (15 secondes)..."
    sleep 15
    
    # Tests de connectivité
    log_info "Tests de connectivité..."
    if curl -s -f http://localhost:7000/api/health &>/dev/null; then
        log_success "Backend: OK (port 7000)"
    else
        log_warning "Backend: pas encore prêt (vérifier logs avec ./deploy.sh $MODE logs)"
    fi
    
    if curl -s -f http://localhost:7001 &>/dev/null; then
        log_success "Frontend: OK (port 7001)"
    else
        log_warning "Frontend: pas encore prêt (vérifier logs)"
    fi
}

docker_down() {
    local compose_file=$1
    log_info "Arrêt des conteneurs..."
    docker compose -f "$compose_file" down
    log_success "Conteneurs arrêtés"
}

docker_rebuild() {
    local compose_file=$1
    log_info "Reconstruction des images..."
    docker compose -f "$compose_file" build --no-cache
    docker compose -f "$compose_file" up -d --remove-orphans
    log_success "Images reconstruites et conteneurs redémarrés"
}

docker_status() {
    local compose_file=$1
    log_info "État des conteneurs:"
    echo ""
    docker compose -f "$compose_file" ps
    echo ""
    
    # Afficher utilisation ressources
    log_info "Utilisation des ressources:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || log_warning "Impossible de récupérer les stats"
}

docker_logs() {
    local compose_file=$1
    local service=${2:-}
    
    if [ -n "$service" ]; then
        log_info "Logs du service: $service"
        docker compose -f "$compose_file" logs -f --tail=100 "$service"
    else
        log_info "Logs de tous les services..."
        docker compose -f "$compose_file" logs -f --tail=50
    fi
}

# ==================================
# SCRIPT PRINCIPAL
# ==================================
main() {
    local mode=${1:-}
    local action=${2:-up}
    local service=${3:-}
    
    # Afficher aide si pas d'arguments
    if [ -z "$mode" ]; then
        echo ""
        log_section
        echo -e "  ${CYAN}eLISAschool - Script de Déploiement${NC}"
        log_section
        echo ""
        echo "Usage: ./deploy.sh <mode> [action] [service]"
        echo ""
        echo "Modes:"
        echo "  local-dev     Réseau local - Développement (hot-reload)"
        echo "  local-prod    Réseau local - Production (optimisé)"
        echo "  cloud-dev     Cloud - Développement (domaine, sans SSL)"
        echo "  cloud-prod    Cloud - Production (HTTPS automatique)"
        echo ""
        echo "Actions:"
        echo "  up            Démarrer les conteneurs (défaut)"
        echo "  down          Arrêter les conteneurs"
        echo "  restart       Redémarrer les conteneurs"
        echo "  rebuild       Reconstruire les images et redémarrer"
        echo "  status        Afficher l'état des conteneurs"
        echo "  logs          Afficher les logs (optionnel: <service>)"
        echo ""
        echo "Exemples:"
        echo "  ./deploy.sh local-dev up          # Démarrer en local dev"
        echo "  ./deploy.sh local-prod status     # État production locale"
        echo "  ./deploy.sh cloud-prod logs       # Logs cloud production"
        echo "  ./deploy.sh local-dev logs backend # Logs backend uniquement"
        echo ""
        exit 1
    fi
    
    export MODE=$mode
    
    log_section
    log_info "  eLISAschool - Déploiement"
    log_info "  Mode: $mode | Action: $action"
    log_section
    echo ""
    
    # Vérifier prérequis
    check_prerequisites
    
    # Préparer environnement
    local compose_file=$(prepare_environment "$mode")
    
    log_info "Fichier Docker Compose: $compose_file"
    echo ""
    
    # Exécuter action
    case $action in
        up)
            docker_up "$compose_file"
            ;;
        down)
            docker_down "$compose_file"
            ;;
        restart)
            docker_down "$compose_file"
            docker_up "$compose_file"
            ;;
        rebuild)
            docker_rebuild "$compose_file"
            ;;
        status)
            docker_status "$compose_file"
            ;;
        logs)
            docker_logs "$compose_file" "$service"
            ;;
        *)
            log_error "Action invalide: $action"
            exit 1
            ;;
    esac
    
    echo ""
    log_section
    log_success "  Déploiement terminé!"
    log_section
    
    # Afficher URLs d'accès
    echo ""
    log_info "URLs d'accès:"
    if [[ "$mode" == "local"* ]]; then
        echo "  🌐 Frontend: http://$HOST_IP:7001"
        echo "  🔌 Backend:  http://$HOST_IP:7000"
        echo "  🗄️  pgAdmin:   http://$HOST_IP:7004"
        echo ""
        log_info "Depuis une autre machine du réseau local:"
        echo "  http://$HOST_IP:7001"
    elif [[ "$mode" == "cloud"* ]]; then
        echo "  🌐 Frontend: https://$DOMAIN_NAME"
        echo "  🔌 Backend:  https://$DOMAIN_NAME/api"
        if [[ "$mode" == "cloud-dev" ]]; then
            echo "  ⚠️  SSL non activé en cloud-dev"
        else
            echo "  🔒 SSL: Let's Encrypt automatique"
        fi
    fi
    
    echo ""
    log_info "Commandes utiles:"
    echo "  ./deploy.sh $mode logs          # Voir les logs"
    echo "  ./deploy.sh $mode status        # État des services"
    echo "  ./deploy.sh $mode down          # Arrêter"
    echo ""
}

main "$@"
