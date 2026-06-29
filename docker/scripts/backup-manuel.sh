#!/bin/bash
# ==================================
# eLISAschool - Backup Manuel à la Demande
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Usage: cd docker/scripts && ./backup-manuel.sh [nom_personnalise]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/docker/backups/manual"
DB_CONTAINER="elisaschool_db"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-elisaschool_user}"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Nom du backup
CUSTOM_NAME=${1:-}
DATE=$(date +%Y%m%d_%H%M%S)

if [ -n "$CUSTOM_NAME" ]; then
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_manual_${CUSTOM_NAME}_${DATE}.sql.gz"
else
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_manual_${DATE}.sql.gz"
fi

log_info "========================================="
log_info "  Backup Manuel eLISAschool"
log_info "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
if [ -n "$CUSTOM_NAME" ]; then
    log_info "  Nom: $CUSTOM_NAME"
fi
log_info "========================================="

# Créer le répertoire
mkdir -p "$BACKUP_DIR"

# Vérifier conteneur DB
if ! docker ps | grep -q "$DB_CONTAINER"; then
    log_error "Le conteneur $DB_CONTAINER n'est pas en cours d'exécution"
    log_info "Démarrez-le avec: cd docker && ./deploy.sh local-dev up"
    exit 1
fi

# Backup
log_info "Démarrage du backup..."

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup réussi: $BACKUP_FILE"
    log_info "Taille: $BACKUP_SIZE"
    
    # Vérifier l'intégrité
    log_info "Vérification de l'intégrité..."
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log_success "Intégrité vérifiée ✅"
    else
        log_error "Fichier corrompu ❌"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    log_error "Échec du backup"
    exit 1
fi

# Lister les backups manuels
echo ""
log_info "Backups manuels disponibles:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || log_info "Aucun backup manuel"

echo ""
log_info "========================================="
log_success "  Backup manuel terminé !"
log_info "  Fichier: $BACKUP_FILE"
log_info "========================================="

exit 0
