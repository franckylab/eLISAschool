#!/bin/bash
# ============================================
# eLISAschool - Création de la Base de Données
# ============================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Description: Crée uniquement la base de données vide
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
echo -e "$BLUE║  eLISAschool - Création de la Base de Données         ║$NC"
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

# Vérifier pg_isready ou connexion directe
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

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "$YELLOW⚠️  La base '$DB_NAME' existe déjà$NC"
    echo ""
    echo -e "$YELLOWQue voulez-vous faire ?$NC"
    echo "  1) Annuler (quitter)"
    echo "  2) Supprimer et recréer la base (ATTENTION: toutes les données seront perdues)"
    echo ""
    read -p "Votre choix (1/2): " CHOIX
    
    case $CHOIX in
        1)
            echo -e "$GREEN✅ Opération annulée$NC"
            exit 0
            ;;
        2)
            echo -e "$YELLOW🗑️  Suppression de la base '$DB_NAME'...$NC"
            
            # Tuer toutes les connexions actives
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
            " > /dev/null 2>&1
            
            # Supprimer la base
            if PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
                echo -e "$GREEN   ✅ Base supprimée$NC"
            else
                echo -e "$RED   ❌ Échec de la suppression$NC"
                exit 1
            fi
            
            sleep 2
            ;;
        *)
            echo -e "$RED❌ Choix invalide$NC"
            exit 1
            ;;
    esac
else
    echo -e "$GREEN   ✅ La base '$DB_NAME' n'existe pas (sera créée)$NC"
fi

echo ""

# ============================================
# ÉTAPE 3: Créer la base de données
# ============================================
echo -e "$YELLOW🗄️  ÉTAPE 3: Création de la base de données$NC"

# Méthode 1: Utiliser createdb
if command -v createdb &> /dev/null; then
    echo -e "   📝 Méthode 1: createdb"
    if PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
        echo -e "$GREEN   ✅ Base créée avec createdb$NC"
        CREATED=true
    else
        CREATED=false
    fi
else
    CREATED=false
fi

# Méthode 2: Utiliser psql CREATE DATABASE
if [ "$CREATED" = false ]; then
    echo -e "   📝 Méthode 2: psql CREATE DATABASE"
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
        echo -e "$GREEN   ✅ Base créée avec CREATE DATABASE$NC"
        CREATED=true
    else
        CREATED=false
    fi
fi

# Méthode 3: Via Docker (si l'utilisateur postgres existe)
if [ "$CREATED" = false ]; then
    echo -e "   📝 Méthode 3: Docker (utilisateur postgres)"
    if docker exec elisaschool_db psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null; then
        echo -e "$GREEN   ✅ Base créée via Docker$NC"
        CREATED=true
    else
        CREATED=false
    fi
fi

# Vérification finale
if [ "$CREATED" = false ]; then
    echo -e "$RED❌ Échec de création avec toutes les méthodes$NC"
    echo ""
    echo -e "$YELLOW💡 Solutions possibles:$NC"
    echo "   1. Vérifier que le conteneur est en cours: docker ps"
    echo "   2. Vérifier les identifiants dans .env"
    echo "   3. Créer manuellement:"
    echo "      PGPASSWORD='$DB_PASSWORD' createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME"
    exit 1
fi

sleep 2

# ============================================
# ÉTAPE 4: Vérifier la base créée
# ============================================
echo -e "$YELLOW🔍 ÉTAPE 4: Vérification$NC"

DB_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_CHECK" = "1" ]; then
    echo -e "$GREEN   ✅ Base '$DB_NAME' existe et est accessible$NC"
    
    # Compter les tables (devrait être 0)
    TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
    echo -e "$GREEN   📊 Tables: $TABLE_COUNT (base vide)$NC"
else
    echo -e "$RED❌ La base n'a pas été créée correctement$NC"
    exit 1
fi

echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo -e "$BLUE╔════════════════════════════════════════════════════════╗$NC"
echo -e "$BLUE║  CRÉATION TERMINÉE ✅                                 ║$NC"
echo -e "$BLUE╚════════════════════════════════════════════════════════╝$NC"
echo ""
echo -e "$GREEN🎉 Base de données '$DB_NAME' créée avec succès !$NC"
echo ""
echo -e "$YELLOW📊 Informations:$NC"
echo -e "   📍 Hôte: $DB_HOST:$DB_PORT"
echo -e "   👤 Utilisateur: $DB_USER"
echo -e "   🗄️  Base: $DB_NAME"
echo -e "   📦 Tables: $TABLE_COUNT"
echo ""
echo -e "$YELLOW🚀 Prochaines étapes:$NC"
echo -e "   1. Exécuter les migrations: ./scripts/deploy-complet.sh"
echo -e "   2. Ou manuellement:"
echo -e "      cd /mnt/DONNEES/projets/eLISAschool"
echo -e "      for f in backend/database/migrations/*.sql; do PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f \$f; done"
echo ""
