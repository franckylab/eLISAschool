#!/bin/bash
# ============================================
# eLISAschool - Suppression de la Base de Données
# ============================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Description: Supprime la base de données elisaschool
# ============================================

set -e

# Couleurs
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DB_HOST="127.0.0.1"
DB_PORT="7002"
DB_USER="elisaschool_user"
DB_PASSWORD="elisaschool_password"
DB_NAME="elisaschool"

echo -e "$BLUE╔════════════════════════════════════════════════════════╗$NC"
echo -e "$BLUE║  eLISAschool - Suppression de la Base de Données      ║$NC"
echo -e "$BLUE╚════════════════════════════════════════════════════════╝$NC"
echo ""

# ============================================
# ÉTAPE 1: Vérifier PostgreSQL
# ============================================
echo -e "$YELLOW📋 ÉTAPE 1: Vérification PostgreSQL$NC"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "$RED❌ Docker n'est pas installé$NC"
    exit 1
fi

# Vérifier le conteneur PostgreSQL
if ! docker ps | grep -q "elisaschool_db"; then
    echo -e "$RED❌ Conteneur PostgreSQL 'elisaschool_db' n'est pas en cours$NC"
    echo -e "$YELLOW💡 Démarrer avec: cd /mnt/DONNEES/projets/eLISAschool && docker compose up -d db$NC"
    exit 1
fi

# Vérifier connexion PostgreSQL
echo -e "   ⏳ Vérification connexion PostgreSQL..."
CONNECTED=false
for i in {1..10}; do
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "$GREEN   ✅ PostgreSQL est opérationnel$NC"
        CONNECTED=true
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "$RED   ❌ PostgreSQL ne répond pas après 10 tentatives$NC"
        exit 1
    fi
    sleep 2
done

if [ "$CONNECTED" = false ]; then
    exit 1
fi

echo ""

# ============================================
# ÉTAPE 2: Vérifier si la base existe
# ============================================
echo -e "$YELLOW🔍 ÉTAPE 2: Vérification de la base de données$NC"

DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
    echo -e "$YELLOW⚠️  La base '$DB_NAME' n'existe pas$NC"
    echo -e "$GREEN✅ Rien à supprimer$NC"
    exit 0
fi

echo -e "$GREEN   ✅ La base '$DB_NAME' existe$NC"

# Compter les tables avant suppression
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
echo -e "$GREEN   📊 Tables actuelles: $TABLE_COUNT$NC"

echo ""

# ============================================
# ÉTAPE 3: Backup avant suppression
# ============================================
echo -e "$YELLOW💾 ÉTAPE 3: Backup de sécurité avant suppression$NC"

# Créer le répertoire de backup s'il n'existe pas
BACKUP_DIR="/mnt/DONNEES/projets/eLISAschool/backups"
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "   📁 Création du répertoire de backup..."
    mkdir -p "$BACKUP_DIR"
fi

# Nom du fichier de backup avec timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/elisaschool_backup_${TIMESTAMP}.sql"

echo -e "   📝 Backup de la base '$DB_NAME' vers:$NC"
echo -e "   📄 $BACKUP_FILE"
echo ""

# Méthode 1: pg_dump via commande locale
echo -e "   🔄 Méthode 1: pg_dump local"
if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "$GREEN   ✅ Backup réussi ($BACKUP_SIZE)$NC"
    BACKUP_OK=true
else
    BACKUP_OK=false
fi

# Méthode 2: pg_dump via Docker
if [ "$BACKUP_OK" = false ]; then
    echo -e "   🔄 Méthode 2: pg_dump via Docker"
    if docker exec elisaschool_db pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "$GREEN   ✅ Backup réussi via Docker ($BACKUP_SIZE)$NC"
        BACKUP_OK=true
    else
        BACKUP_OK=false
    fi
fi

# Vérification du backup
if [ "$BACKUP_OK" = false ]; then
    echo -e "$RED❌ Échec du backup avec toutes les méthodes$NC"
    echo ""
    echo -e "$YELLOW⚠️  CONTINUER SANS BACKUP ?$NC"
    echo -e "$RED   Attention: Vous ne pourrez pas récupérer les données !$NC"
    echo ""
    read -p "Continuer quand même ? (oui/non): " CONTINUER_SANS_BACKUP
    
    if [ "$CONTINUER_SANS_BACKUP" != "oui" ]; then
        echo -e "$GREEN✅ Opération annulée. Veuillez résoudre le problème de backup.$NC"
        exit 1
    fi
    
    echo -e "$YELLOW⚠️  Continuation SANS backup sélectionnée$NC"
    BACKUP_FILE="AUCUN"
else
    echo ""
    echo -e "$GREEN   📊 Résumé du backup:$NC"
    echo -e "   📄 Fichier: $BACKUP_FILE"
    echo -e "   📦 Taille: $BACKUP_SIZE"
    echo -e "   🔒 Format: SQL pur (compatible restore)"
    echo ""
    echo -e "$YELLOW   💡 Pour restaurer ce backup:$NC"
    echo -e "   PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE"
    echo ""
fi

sleep 2

# ============================================
# ÉTAPE 4: Confirmation de suppression
# ============================================
echo -e "$RED⚠️  ATTENTION: Cette action est IRREVERSIBLE ! ⚠️$NC"
echo ""
echo -e "$YELLOWLa suppression de la base '$DB_NAME' entraînera:$NC"
echo "  • Perte de TOUS les données (élèves, notes, utilisateurs, etc.)"
echo "  • Perte de TOUS les paramètres de configuration"
echo "  • Perte de TOUS les fichiers en base de données"
echo ""

if [ "$BACKUP_FILE" != "AUCUN" ]; then
    echo -e "$GREEN✅ Backup de sécurité créé:$NC"
    echo -e "   📄 $BACKUP_FILE ($BACKUP_SIZE)"
    echo ""
fi

echo -e "$YELLOWVous devrez ensuite:$NC"
echo "  1. Recréer la base avec: ./scripts/creer-base-de-donnees.sh"
echo "  2. Exécuter les migrations: ./scripts/deploy-complet.sh"
echo "  3. Seeder les données initiales"
echo ""

# Demander confirmation explicite
read -p "Tapez 'SUPPRIMER' pour confirmer la suppression: " CONFIRMATION

if [ "$CONFIRMATION" != "SUPPRIMER" ]; then
    echo -e "$GREEN✅ Opération annulée$NC"
    exit 0
fi

echo ""

# ============================================
# ÉTAPE 5: Suppression de la base
# ============================================
echo -e "$YELLOW🗑️  ÉTAPE 5: Suppression de la base de données$NC"

# Tuer toutes les connexions actives à la base
echo -e "   📝 Fermeture des connexions actives..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" > /dev/null 2>&1

sleep 1

# Méthode 1: Utiliser dropdb
echo -e "   📝 Méthode 1: dropdb"
if PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
    echo -e "$GREEN   ✅ Base supprimée avec dropdb$NC"
    SUPPRIME=true
else
    SUPPRIME=false
fi

# Méthode 2: Utiliser psql DROP DATABASE
if [ "$SUPPRIME" = false ]; then
    echo -e "   📝 Méthode 2: psql DROP DATABASE"
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE $DB_NAME;" 2>/dev/null; then
        echo -e "$GREEN   ✅ Base supprimée avec DROP DATABASE$NC"
        SUPPRIME=true
    else
        SUPPRIME=false
    fi
fi

# Méthode 3: Via Docker (utilisateur postgres)
if [ "$SUPPRIME" = false ]; then
    echo -e "   📝 Méthode 3: Docker (utilisateur postgres)"
    if docker exec elisaschool_db psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null; then
        echo -e "$GREEN   ✅ Base supprimée via Docker$NC"
        SUPPRIME=true
    else
        SUPPRIME=false
    fi
fi

# Vérification finale
if [ "$SUPPRIME" = false ]; then
    echo -e "$RED❌ Échec de suppression avec toutes les méthodes$NC"
    echo ""
    echo -e "$YELLOW💡 Solutions possibles:$NC"
    echo "   1. Vérifier que le conteneur est en cours: docker ps"
    echo "   2. Vérifier les permissions de l'utilisateur"
    echo "   3. Supprimer manuellement:"
    echo "      PGPASSWORD='$DB_PASSWORD' dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME"
    exit 1
fi

sleep 2

# ============================================
# ÉTAPE 6: Vérifier la suppression
# ============================================
echo -e "$YELLOW🔍 ÉTAPE 6: Vérification$NC"

DB_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_CHECK" != "1" ]; then
    echo -e "$GREEN   ✅ Base '$DB_NAME' supprimée avec succès$NC"
else
    echo -e "$RED❌ La base existe encore après suppression$NC"
    exit 1
fi

echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo -e "$BLUE╔════════════════════════════════════════════════════════╗$NC"
echo -e "$BLUE║  SUPPRESSION TERMINÉE ✅                              ║$NC"
echo -e "$BLUE╚════════════════════════════════════════════════════════╝$NC"
echo ""
echo -e "$GREEN🎉 Base de données '$DB_NAME' supprimée avec succès !$NC"
echo ""

if [ "$BACKUP_FILE" != "AUCUN" ]; then
    echo -e "$GREEN💾 Backup de sécurité:$NC"
    echo -e "   📄 Fichier: $BACKUP_FILE"
    echo -e "   📦 Taille: $BACKUP_SIZE"
    echo ""
    echo -e "$YELLOW🔄 Pour restaurer le backup:$NC"
    echo -e "   1. Recréer la base: ./scripts/creer-base-de-donnees.sh"
    echo -e "   2. Restaurer: PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE"
    echo ""
else
    echo -e "$RED⚠️  AUCUN backup n'a été créé$NC"
    echo -e "$RED   Les données ne peuvent PAS être récupérées !$NC"
    echo ""
fi

echo -e "$YELLOW📊 Avant suppression:$NC"
echo -e "   📦 Tables supprimées: $TABLE_COUNT"
echo ""
echo -e "$YELLOW🚀 Prochaines étapes:$NC"
echo -e "   1. Recréer la base: ./scripts/creer-base-de-donnees.sh"
echo -e "   2. Exécuter les migrations: ./scripts/deploy-complet.sh"
echo -e "   3. Seeder les données: npm run seed:all"
echo ""
