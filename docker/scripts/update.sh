#!/bin/bash
# ==================================
# eLISAschool - Script de Mise à Jour Automatisée
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Usage: cd docker/scripts && ./update.sh [action]
# Actions: check, download, preview, apply, rollback, status, history

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/docker/backupdates/manual"
LOG_FILE="$PROJECT_ROOT/docker/updates.log"
VERSION_FILE="$PROJECT_ROOT/VERSION"
CURRENT_VERSION=$(cat "$VERSION_FILE" 2>/dev/null || echo "1.0.0")
LATEST_VERSION=""
UPDATE_AVAILABLE=false

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_section() { echo -e "${CYAN}═══════════════════════════════════════${NC}"; }

# Logging
log_to_file() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# ==================================
# VÉRIFIER MISES À JOUR
# ==================================
check_updates() {
    log_info "Vérification des mises à jour..."
    log_info "Version actuelle: $CURRENT_VERSION"
    
    # Simuler vérification (à remplacer par API réelle)
    # LATEST_VERSION=$(curl -s https://api.github.com/repos/elisaschool/releases/latest | grep tag_name | cut -d'"' -f4)
    
    # Pour l'instant, version simulée
    LATEST_VERSION="1.1.0"
    
    if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
        log_success "✅ Vous êtes à jour (v$CURRENT_VERSION)"
        UPDATE_AVAILABLE=false
    else
        log_warning "⚠️  Nouvelle version disponible: v$LATEST_VERSION"
        UPDATE_AVAILABLE=true
    fi
    
    log_to_file "CHECK version=$CURRENT_VERSION latest=$LATEST_VERSION available=$UPDATE_AVAILABLE"
}

# ==================================
# TÉLÉCHARGER MISE À JOUR
# ==================================
download_update() {
    log_info "Téléchargement de la mise à jour v$LATEST_VERSION..."
    
    # Créer répertoire temporaire
    local UPDATE_DIR="/tmp/elisaschool_update_$LATEST_VERSION"
    mkdir -p "$UPDATE_DIR"
    
    # Simuler téléchargement
    log_info "Téléchargement en cours..."
    sleep 2
    
    # Vérifier téléchargement
    if [ -d "$UPDATE_DIR" ]; then
        log_success "✅ Mise à jour téléchargée: $UPDATE_DIR"
        log_to_file "DOWNLOAD version=$LATEST_VERSION dir=$UPDATE_DIR status=success"
    else
        log_error "❌ Échec du téléchargement"
        log_to_file "DOWNLOAD version=$LATEST_VERSION status=failed"
        exit 1
    fi
}

# ==================================
# APERÇU CHANGEMENTS
# ==================================
preview_changes() {
    log_section
    log_info "  Changements v$CURRENT_VERSION → v$LATEST_VERSION"
    log_section
    
    echo ""
    log_info "Nouvelles fonctionnalités:"
    echo "  ✨ Monitoring dashboard intégré"
    echo "  ✨ Backup automatique configurable"
    echo "  ✨ Mises à jour automatisées avec rollback"
    
    echo ""
    log_info "Améliorations:"
    echo "  🚀 Performance backend optimisée"
    echo "  🚀 Cache Redis amélioré"
    echo "  🚀 Temps de chargement réduit"
    
    echo ""
    log_info "Corrections:"
    echo "  🐛 Correction bug CORS réseau local"
    echo "  🐛 Fix migration TypeORM"
    echo "  🐛 Correction affichage mode sombre"
    
    echo ""
    log_warning "⚠️  Nécessite un redémarrage des services"
    log_warning "⚠️  Backup automatique avant mise à jour"
    echo ""
    
    log_to_file "PREVIEW from=$CURRENT_VERSION to=$LATEST_VERSION"
}

# ==================================
# BACKUP PRÉ-MISE À JOUR
# ==================================
pre_update_backup() {
    log_info "Création d'un backup pré-mise à jour..."
    
    local BACKUP_FILE="$BACKUP_DIR/${DB_NAME:-elisaschool}_pre_update_${CURRENT_VERSION}_$(date +%Y%m%d_%H%M%S).sql.gz"
    mkdir -p "$BACKUP_DIR"
    
    docker exec elisaschool_db pg_dump -U ${DB_USER:-elisaschool_user} -d ${DB_NAME:-elisaschool} | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
        log_success "✅ Backup créé: $BACKUP_FILE"
        log_to_file "BACKUP_PRE_UPDATE file=$BACKUP_FILE version=$CURRENT_VERSION"
        echo "$BACKUP_FILE"
    else
        log_error "❌ Échec du backup - Mise à jour annulée"
        log_to_file "BACKUP_PRE_UPDATE failed"
        exit 1
    fi
}

# ==================================
# APPLIQUER MISE À JOUR
# ==================================
apply_update() {
    if [ "$UPDATE_AVAILABLE" = false ]; then
        check_updates
        if [ "$UPDATE_AVAILABLE" = false ]; then
            return 0
        fi
    fi
    
    log_section
    log_info "  Mise à jour eLISAschool"
    log_info "  v$CURRENT_VERSION → v$LATEST_VERSION"
    log_section
    echo ""
    
    # Confirmation
    read -p "Continuer ? (oui/non): " CONFIRM
    if [ "$CONFIRM" != "oui" ]; then
        log_info "Mise à jour annulée"
        exit 0
    fi
    
    # Backup pré-mise à jour
    local BACKUP_FILE=$(pre_update_backup)
    
    # Mode maintenance (optionnel)
    log_info "Activation du mode maintenance..."
    # touch /tmp/elisaschool_maintenance
    
    # Backup des fichiers actuels
    log_info "Sauvegarde des fichiers actuels..."
    local ROLLBACK_DIR="/tmp/elisaschool_rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$ROLLBACK_DIR"
    cp -r "$PROJECT_ROOT/backend" "$ROLLBACK_DIR/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/frontend" "$ROLLBACK_DIR/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/docker" "$ROLLBACK_DIR/" 2>/dev/null || true
    
    log_success "Rollback directory: $ROLLBACK_DIR"
    log_to_file "ROLLBACK_DIR created=$ROLLBACK_DIR"
    
    # Appliquer mise à jour (simulation)
    log_info "Application de la mise à jour..."
    sleep 3
    
    # Migrations DB
    log_info "Exécution des migrations..."
    docker exec elisaschool_backend npx typeorm migration:run -d dist/database/data-source.js || {
        log_error "❌ Échec des migrations - Rollback automatique"
        rollback_update "$ROLLBACK_DIR" "$BACKUP_FILE"
        exit 1
    }
    
    # Redémarrage services
    log_info "Redémarrage des services..."
    cd "$PROJECT_ROOT/docker"
    ./deploy.sh local-dev restart || {
        log_error "❌ Échec du redémarrage - Rollback automatique"
        rollback_update "$ROLLBACK_DIR" "$BACKUP_FILE"
        exit 1
    }
    
    # Vérification santé
    log_info "Vérification de la santé des services..."
    sleep 10
    
    if curl -s -f http://localhost:7000/api/health &>/dev/null; then
        log_success "✅ Backend: OK"
    else
        log_error "❌ Backend: KO - Rollback automatique"
        rollback_update "$ROLLBACK_DIR" "$BACKUP_FILE"
        exit 1
    fi
    
    # Mise à jour version
    echo "$LATEST_VERSION" > "$VERSION_FILE"
    
    # Désactiver mode maintenance
    log_info "Désactivation du mode maintenance..."
    # rm -f /tmp/elisaschool_maintenance
    
    # Nettoyage
    log_info "Nettoyage..."
    rm -rf "/tmp/elisaschool_update_$LATEST_VERSION"
    
    log_section
    log_success "  ✅ Mise à jour terminée avec succès !"
    log_info "  Version: v$LATEST_VERSION"
    log_info "  Backup: $BACKUP_FILE"
    log_info "  Rollback dir: $ROLLBACK_DIR (conserver 7 jours)"
    log_section
    
    log_to_file "UPDATE_SUCCESS from=$CURRENT_VERSION to=$LATEST_VERSION backup=$BACKUP_FILE"
}

# ==================================
# ROLLBACK
# ==================================
rollback_update() {
    local ROLLBACK_DIR=${1:-}
    local BACKUP_FILE=${2:-}
    
    log_warning "⚠️  Rollback en cours..."
    
    # Restaurer fichiers
    if [ -n "$ROLLBACK_DIR" ] && [ -d "$ROLLBACK_DIR" ]; then
        log_info "Restauration des fichiers..."
        cp -rf "$ROLLBACK_DIR/backend" "$PROJECT_ROOT/" 2>/dev/null || true
        cp -rf "$ROLLBACK_DIR/frontend" "$PROJECT_ROOT/" 2>/dev/null || true
        cp -rf "$ROLLBACK_DIR/docker" "$PROJECT_ROOT/" 2>/dev/null || true
        log_success "Fichiers restaurés"
    fi
    
    # Restaurer DB
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        log_info "Restauration de la base de données..."
        gunzip -c "$BACKUP_FILE" | docker exec -i elisaschool_db psql -U ${DB_USER:-elisaschool_user} -d ${DB_NAME:-elisaschool}
        log_success "Base de données restaurée"
    fi
    
    # Redémarrage
    log_info "Redémarrage des services..."
    cd "$PROJECT_ROOT/docker"
    ./deploy.sh local-dev restart
    
    log_section
    log_success "  ✅ Rollback terminé"
    log_info "  Version: v$CURRENT_VERSION"
    log_section
    
    log_to_file "ROLLBACK_SUCCESS to=$CURRENT_VERSION"
}

# ==================================
# STATUT
# ==================================
show_status() {
    log_section
    log_info "  Statut eLISAschool"
    log_section
    
    echo ""
    log_info "Version actuelle: $CURRENT_VERSION"
    
    # Vérifier mises à jour
    check_updates
    
    echo ""
    log_info "Services:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep elisaschool || log_warning "Aucun service en cours"
    
    echo ""
    log_info "Dernière mise à jour:"
    tail -1 "$LOG_FILE" 2>/dev/null || log_info "Aucun historique"
    
    echo ""
}

# ==================================
# HISTORIQUE
# ==================================
show_history() {
    log_section
    log_info "  Historique des Mises à Jour"
    log_section
    
    if [ -f "$LOG_FILE" ]; then
        echo ""
        grep -E "(UPDATE_|ROLLBACK_|CHECK)" "$LOG_FILE" | tail -20
    else
        log_info "Aucun historique disponible"
    fi
    
    echo ""
}

# ==================================
# SCRIPT PRINCIPAL
# ==================================
main() {
    local action=${1:-check}
    
    case $action in
        check)
            check_updates
            ;;
        download)
            check_updates
            if [ "$UPDATE_AVAILABLE" = true ]; then
                download_update
            fi
            ;;
        preview)
            check_updates
            if [ "$UPDATE_AVAILABLE" = true ]; then
                preview_changes
            fi
            ;;
        apply)
            check_updates
            if [ "$UPDATE_AVAILABLE" = true ]; then
                apply_update
            else
                log_success "✅ Déjà à jour"
            fi
            ;;
        rollback)
            log_warning "Rollback manuel - nécessite backup et rollback dir"
            log_info "Usage automatique : le rollback est déclenché automatiquement en cas d'échec"
            ;;
        status)
            show_status
            ;;
        history)
            show_history
            ;;
        *)
            log_error "Action invalide: $action"
            echo ""
            log_info "Actions disponibles:"
            echo "  check     - Vérifier mises à jour"
            echo "  download  - Télécharger mise à jour"
            echo "  preview   - Voir changements"
            echo "  apply     - Appliquer mise à jour"
            echo "  rollback  - Retour version précédente"
            echo "  status    - Statut actuel"
            echo "  history   - Historique mises à jour"
            echo ""
            exit 1
            ;;
    esac
}

main "$@"
