#!/bin/bash
# ==================================
# eLISAschool - Installation Cron Backup
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Usage: ./install-cron.sh
# Ce script installe automatiquement les tâches cron pour les backups

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CRON_FILE="$SCRIPT_DIR/cron-backup.txt"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

echo ""
log_info "========================================="
log_info "  Installation Cron Backup eLISAschool"
log_info "========================================="
echo ""

# Vérifier que cron-backup.txt existe
if [ ! -f "$CRON_FILE" ]; then
    log_error "Fichier $CRON_FILE non trouvé"
    exit 1
fi

# Vérifier que les scripts de backup existent
if [ ! -f "$SCRIPT_DIR/backup-auto.sh" ]; then
    log_error "Script backup-auto.sh non trouvé"
    exit 1
fi

log_step "Vérification de cron..."

# Vérifier si cron est installé
if ! command -v crontab &> /dev/null; then
    log_error "crontab n'est pas installé"
    log_info "Installer cron: sudo apt-get install cron"
    exit 1
fi

log_info "✅ Cron est installé"
echo ""

# Créer le dossier logs s'il n'existe pas
LOGS_DIR="$PROJECT_ROOT/logs"
if [ ! -d "$LOGS_DIR" ]; then
    log_step "Création du dossier logs..."
    mkdir -p "$LOGS_DIR"
    log_info "✅ Dossier logs créé: $LOGS_DIR"
fi

# Mettre à jour le chemin dans cron-backup.txt
log_step "Configuration des tâches cron..."

# Obtenir le chemin absolu du projet
PROJECT_PATH=$(realpath "$PROJECT_ROOT")

# Créer un fichier cron temporaire avec le bon chemin
TEMP_CRON=$(mktemp)
sed "s|/mnt/DONNEES/projets/eLISAschool|$PROJECT_PATH|g" "$CRON_FILE" > "$TEMP_CRON"

# Installer le cron
crontab "$TEMP_CRON"
rm -f "$TEMP_CRON"

log_info "✅ Tâches cron installées"
echo ""

# Vérifier l'installation
log_step "Vérification de l'installation..."
echo ""
log_info "Tâches cron actives :"
echo "------------------------"
crontab -l
echo "------------------------"
echo ""

# Rendre le script backup exécutable
log_step "Permissions des scripts..."
chmod +x "$SCRIPT_DIR/backup-auto.sh"
chmod +x "$SCRIPT_DIR/backup-manuel.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/restore.sh" 2>/dev/null || true
log_info "✅ Scripts rendus exécutables"
echo ""

# Créer la structure de dossiers backups
log_step "Structure des dossiers backups..."
BACKUP_DIR="$PROJECT_ROOT/docker/backups"
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"
mkdir -p "$BACKUP_DIR/manual"
log_info "✅ Dossiers backups créés:"
log_info "  - $BACKUP_DIR/daily"
log_info "  - $BACKUP_DIR/weekly"
log_info "  - $BACKUP_DIR/monthly"
log_info "  - $BACKUP_DIR/manual"
echo ""

log_info "========================================="
log_info "  Installation Terminée !"
log_info "========================================="
echo ""
log_info "Prochain backup automatique : demain à 2h00"
log_info "Pour tester manuellement : bash $SCRIPT_DIR/backup-auto.sh"
log_info "Pour voir les logs : tail -f $LOGS_DIR/backup-cron.log"
log_info "Pour désinstaller : crontab -r"
echo ""

exit 0
