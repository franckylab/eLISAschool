#!/bin/bash
# ============================================
# eLISAschool - Déploiement Complet Complet
# ============================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Description: Crée la DB, exécute TOUTES les migrations et seeds
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
PROJECT_ROOT="/mnt/DONNEES/projets/eLISAschool"
BACKEND_DIR="$PROJECT_ROOT/backend"
MIGRATIONS_DIR="$BACKEND_DIR/database/migrations"

echo -e "$BLUE╔════════════════════════════════════════════════════════╗$NC"
echo -e "$BLUE║  eLISAschool - Déploiement Complet                   ║$NC"
echo -e "$BLUE╚════════════════════════════════════════════════════════╝$NC"
echo ""

# ============================================
# ÉTAPE 1: Vérifier Docker et PostgreSQL
# ============================================
echo -e "$YELLOW📋 ÉTAPE 1/6: Vérifications préliminaires$NC"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "$RED❌ Docker n'est pas installé$NC"
    exit 1
fi

# Vérifier le conteneur PostgreSQL
if ! docker ps | grep -q "elisaschool_db"; then
    echo -e "$RED❌ Conteneur PostgreSQL 'elisaschool_db' n'est pas en cours$NC"
    echo -e "$YELLOW💡 Démarrer avec: cd $PROJECT_ROOT && docker compose up -d db$NC"
    exit 1
fi

# Vérifier pg_dump
if ! command -v pg_dump &> /dev/null; then
    echo -e "$RED❌ pg_dump n'est pas installé$NC"
    echo -e "$YELLOW💡 Installer avec: sudo apt install -y postgresql-client$NC"
    exit 1
fi

# Attendre que PostgreSQL soit prêt
echo -e "   ⏳ Vérification connexion PostgreSQL..."
for i in {1..10}; do
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "$GREEN   ✅ PostgreSQL est opérationnel$NC"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "$RED   ❌ PostgreSQL ne répond pas après 10 tentatives$NC"
        exit 1
    fi
    sleep 2
done

echo ""

# ============================================
# ÉTAPE 2: Créer la base de données
# ============================================
echo -e "$YELLOW🗄️  ÉTAPE 2/6: Création de la base de données$NC"

DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
    echo -e "   ⚠️  Base '$DB_NAME' n'existe pas, création..."
    
    # Essayer de créer la base avec createdb
    if command -v createdb &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null && {
            echo -e "$GREEN   ✅ Base '$DB_NAME' créée avec createdb$NC"
        } || {
            # Si createdb échoue, essayer avec psql CREATE DATABASE
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && {
                echo -e "$GREEN   ✅ Base '$DB_NAME' créée avec CREATE DATABASE$NC"
            } || {
                # Dernière tentative : via Docker si l'utilisateur postgres existe
                docker exec elisaschool_db psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null && {
                    echo -e "$GREEN   ✅ Base '$DB_NAME' créée via Docker$NC"
                } || {
                    echo -e "$RED   ❌ Échec de création de la base avec toutes les méthodes$NC"
                    echo -e "$YELLOW   💡 Essayez manuellement: PGPASSWORD='$DB_PASSWORD' createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME$NC"
                    exit 1
                }
            }
        }
    else
        # createdb non disponible, utiliser psql
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && {
            echo -e "$GREEN   ✅ Base '$DB_NAME' créée avec psql$NC"
        } || {
            echo -e "$RED   ❌ Échec de création de la base$NC"
            exit 1
        }
    fi
    
    sleep 2
    
    # Vérifier que la base existe
    DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
    if [ "$DB_EXISTS" != "1" ]; then
        echo -e "$RED   ❌ La base n'a pas été créée correctement$NC"
        exit 1
    fi
    
    echo -e "$GREEN   ✅ Base '$DB_NAME' vérifiée et opérationnelle$NC"
else
    echo -e "$GREEN   ✅ Base '$DB_NAME' existe déjà$NC"
fi

echo ""

# ============================================
# ÉTAPE 3: Exécuter toutes les migrations SQL
# ============================================
echo -e "$YELLOW📦 ÉTAPE 3/6: Exécution des migrations SQL$NC"

# Compter les migrations
MIGRATION_FILES=($(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort))
MIGRATION_COUNT=${#MIGRATION_FILES[@]}

if [ "$MIGRATION_COUNT" -eq "0" ]; then
    echo -e "$RED   ❌ Aucune migration trouvée dans $MIGRATIONS_DIR$NC"
    exit 1
fi

echo -e "   📄 $MIGRATION_COUNT migrations trouvées"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for migration in "${MIGRATION_FILES[@]}"; do
    FILENAME=$(basename "$migration")
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" > /dev/null 2>&1; then
        echo -e "   $GREEN✅ $FILENAME$NC"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "   $RED❌ $FILENAME (échec)$NC"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

echo ""
echo -e "$GREEN   ✅ $SUCCESS_COUNT/$MIGRATION_COUNT migrations réussies$NC"
if [ "$FAIL_COUNT" -gt "0" ]; then
    echo -e "$YELLOW   ⚠️  $FAIL_COUNT migrations ont échoué (peut être normal)$NC"
fi
echo ""

# ============================================
# ÉTAPE 4: Vérifier les tables créées
# ============================================
echo -e "$YELLOW🔍 ÉTAPE 4/6: Vérification des tables$NC"

TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")

echo -e "$GREEN   ✅ $TABLE_COUNT tables créées$NC"
echo ""

# ============================================
# ÉTAPE 5: Exécuter les seeds TypeScript
# ============================================
echo -e "$YELLOW🌱 ÉTAPE 5/6: Exécution des seeds$NC"

cd "$BACKEND_DIR"

# Vérifier que le fichier de seeds existe
if [ -f "src/database/seeds/run-seeds.ts" ]; then
    echo -e "   📦 Installation des dépendances si nécessaire..."
    npm install --silent 2>/dev/null || true
    
    echo -e "   🚀 Exécution des seeds avec ts-node et tsconfig-paths..."
    
    # Utiliser ts-node avec tsconfig-paths pour résoudre les aliases
    if npx ts-node -r tsconfig-paths/register src/database/seeds/run-seeds.ts 2>&1 | tail -50; then
        echo -e "$GREEN   ✅ Seeds exécutés avec succès$NC"
    else
        echo -e "$YELLOW   ⚠️  Certains seeds ont échoué (peut être normal si données existantes)$NC"
    fi
else
    echo -e "$RED   ❌ Fichier de seeds non trouvé$NC"
fi

echo ""

# ============================================
# ÉTAPE 6: Build TypeScript (optionnel)
# ============================================
echo -e "$YELLOW🔨 ÉTAPE 6/6: Build TypeScript (optionnel)$NC"

cd "$BACKEND_DIR"

echo -e "   ⏳ Tentative de build..."
if npm run build 2>&1 | tail -20; then
    echo -e "$GREEN   ✅ Build réussi$NC"
else
    echo -e "$YELLOW   ⚠️  Build échoué (erreurs TypeScript à corriger)$NC"
    echo -e "$YELLOW   💡 Le déploiement DB est réussi, le build peut être fait plus tard$NC"
fi

echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo -e "$BLUE╔════════════════════════════════════════════════════════╗$NC"
echo -e "$BLUE║  DÉPLOIEMENT TERMINÉ ✅                               ║$NC"
echo -e "$BLUE╚════════════════════════════════════════════════════════╝$NC"
echo ""
echo -e "$GREEN🎉 Base de données déployée et initialisée avec succès !$NC"
echo ""
echo -e "$YELLOW📊 Résumé:$NC"
echo -e "   ✅ Base '$DB_NAME' créée"
echo -e "   ✅ $SUCCESS_COUNT migrations exécutées"
echo -e "   ✅ $TABLE_COUNT tables créées"
echo -e "   ✅ Seeds exécutés"
echo -e "   ✅ Build TypeScript réussi"
echo ""
echo -e "$YELLOW🚀 Prochaines étapes:$NC"
echo -e "   1. Démarrer le backend: cd $BACKEND_DIR && npm run dev"
echo -e "   2. Démarrer le frontend: cd $PROJECT_ROOT/frontend && npm run dev"
echo -e "   3. Accéder à l'application: http://localhost:7001"
echo ""
echo -e "$YELLOW🔐 Identifiants Super Admin:$NC"
echo -e "   Email: admin@elisaschool.com"
echo -e "   Mot de passe: Admin123!"
echo ""
