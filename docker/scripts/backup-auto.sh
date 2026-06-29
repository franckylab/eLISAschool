#!/bin/bash
# ==================================
# eLISAschool - Backup Automatique Quotidien
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Usage: Automatisé via cron (2h du matin)
# Cron: 0 2 * * * /path/to/docker/scripts/backup-auto.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/docker/backups"
DB_CONTAINER="elisaschool_db"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-elisaschool_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[BACKUP]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Déterminer le type de backup
DATE=$(date +%Y%m%d)
DAY_OF_WEEK=$(date +%u)  # 1=Lundi, 7=Dimanche
DAY_OF_MONTH=$(date +%d)

if [ "$DAY_OF_MONTH" = "01" ]; then
    BACKUP_TYPE="monthly"
elif [ "$DAY_OF_WEEK" = "1" ]; then
    BACKUP_TYPE="weekly"
else
    BACKUP_TYPE="daily"
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_TYPE"
BACKUP_FILE="$BACKUP_PATH/${DB_NAME}_${BACKUP_TYPE}_${DATE}.sql.gz"

log_info "========================================="
log_info "  Backup Automatique eLISAschool"
log_info "  Type: $BACKUP_TYPE"
log_info "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "========================================="

# Créer le répertoire de backup
mkdir -p "$BACKUP_PATH"

# Vérifier que le conteneur DB est en cours
if ! docker ps | grep -q "$DB_CONTAINER"; then
    log_error "Le conteneur $DB_CONTAINER n'est pas en cours d'exécution"
    exit 1
fi

# Effectuer le backup
log_info "Démarrage du backup de la base de données..."

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "✅ Backup réussi: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log_error "❌ Échec du backup"
    exit 1
fi

# Rotation des backups (supprimer les anciens)
log_info "Rotation des backups..."

case $BACKUP_TYPE in
    daily)
        # Conserver 7 jours
        find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
        log_info "Backups daily > 7 jours supprimés"
        ;;
    weekly)
        # Conserver 4 semaines
        find "$BACKUP_DIR/weekly" -name "*.sql.gz" -mtime +28 -delete 2>/dev/null || true
        log_info "Backups weekly > 4 semaines supprimés"
        ;;
    monthly)
        # Conserver 12 mois
        find "$BACKUP_DIR/monthly" -name "*.sql.gz" -mtime +365 -delete 2>/dev/null || true
        log_info "Backups monthly > 12 mois supprimés"
        ;;
esac

# Compter les backups
DAILY_COUNT=$(ls -1 "$BACKUP_DIR/daily"/*.sql.gz 2>/dev/null | wc -l)
WEEKLY_COUNT=$(ls -1 "$BACKUP_DIR/weekly"/*.sql.gz 2>/dev/null | wc -l)
MONTHLY_COUNT=$(ls -1 "$BACKUP_DIR/monthly"/*.sql.gz 2>/dev/null | wc -l)

log_info "========================================="
log_info "  Statistiques Backups"
log_info "  Daily:   $DAILY_COUNT backups"
log_info "  Weekly:  $WEEKLY_COUNT backups"
log_info "  Monthly: $MONTHLY_COUNT backups"
log_info "========================================="

log_info "✅ Backup automatique terminé avec succès"

exit 0
