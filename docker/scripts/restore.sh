#!/bin/bash
# ==================================
# eLISAschool - Restauration Backup
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Usage: cd docker/scripts && ./restore.sh <fichier_backup>
# Exemple: ./restore.sh ../backups/daily/elisaschool_daily_20260627.sql.gz

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/docker/backups"
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

# Vérifier arguments
BACKUP_FILE=${1:-}

if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: ./restore.sh <fichier_backup>"
    echo ""
    log_info "Backups disponibles:"
    echo ""
    
    log_info "Daily (7 derniers jours):"
    ls -lh "$BACKUP_DIR/daily/"*.sql.gz 2>/dev/null | tail -3 || echo "  Aucun"
    echo ""
    
    log_info "Weekly (4 dernières semaines):"
    ls -lh "$BACKUP_DIR/weekly/"*.sql.gz 2>/dev/null | tail -3 || echo "  Aucun"
    echo ""
    
    log_info "Monthly (12 derniers mois):"
    ls -lh "$BACKUP_DIR/monthly/"*.sql.gz 2>/dev/null | tail -3 || echo "  Aucun"
    echo ""
    
    log_info "Manual:"
    ls -lh "$BACKUP_DIR/manual/"*.sql.gz 2>/dev/null | tail -3 || echo "  Aucun"
    echo ""
    
    exit 1
fi

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Fichier non trouvé: $BACKUP_FILE"
    exit 1
fi

# Vérifier l'intégrité du fichier
log_info "Vérification de l'intégrité du backup..."
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_error "Fichier corrompu: $BACKUP_FILE"
    exit 1
fi
log_success "Intégrité vérifiée ✅"

# Vérifier conteneur DB
if ! docker ps | grep -q "$DB_CONTAINER"; then
    log_error "Le conteneur $DB_CONTAINER n'est pas en cours d'exécution"
    exit 1
fi

# Confirmation
echo ""
log_warning "⚠️  ATTENTION: Cette opération va ÉCRASER la base de données actuelle !"
log_warning "⚠️  Toutes les données non sauvegardées seront PERDUES !"
echo ""
read -p "Êtes-vous sûr de vouloir continuer ? (oui/non): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    log_info "Restauration annulée"
    exit 0
fi

# Backup de sécurité avant restauration
SAFETY_BACKUP="$BACKUP_DIR/manual/${DB_NAME}_safety_$(date +%Y%m%d_%H%M%S).sql.gz"
log_info "Création d'un backup de sécurité..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$SAFETY_BACKUP"
log_success "Backup de sécurité: $SAFETY_BACKUP"

# Restauration
log_info "========================================="
log_info "  Restauration eLISAschool"
log_info "  Fichier: $BACKUP_FILE"
log_info "  Base: $DB_NAME"
log_info "========================================="

log_info "Démarrage de la restauration..."

# Décompresser et restaurer
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

if [ $? -eq 0 ]; then
    log_success "✅ Restauration réussie !"
    
    # Vérifier la restauration
    log_info "Vérification..."
    ROW_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM etablissements;" 2>/dev/null || echo "0")
    log_info "Établissements trouvés: $ROW_COUNT"
    
    echo ""
    log_info "========================================="
    log_success "  Restauration terminée !"
    log_info "  Backup de sécurité: $SAFETY_BACKUP"
    log_info "========================================="
else
    log_error "❌ Échec de la restauration"
    log_info "Le backup de sécurité est disponible: $SAFETY_BACKUP"
    exit 1
fi

exit 0
