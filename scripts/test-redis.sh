#!/bin/bash

# ==================================
# eLISAschool - Test de Connexion Redis
# ==================================
# Ce script vérifie que Redis est accessible et fonctionnel
# ==================================

set -e

echo "🔍 Test de connexion Redis..."
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Fichier .env chargé"
else
    echo "⚠️  Fichier .env non trouvé"
    exit 1
fi

# Vérifier les variables Redis
if [ -z "$REDIS_HOST" ]; then
    echo "❌ REDIS_HOST non défini dans .env"
    exit 1
fi

echo "📡 Configuration Redis :"
echo "   Host: $REDIS_HOST"
echo "   Port: $REDIS_PORT"
echo "   Password: ${REDIS_PASSWORD:+(défini)}"
echo ""

# Tester la connexion Redis
echo "🔌 Test de connexion..."

if command -v redis-cli &> /dev/null; then
    # redis-cli est installé
    if [ -n "$REDIS_PASSWORD" ]; then
        RESULT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping 2>&1)
    else
        RESULT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>&1)
    fi

    if [ "$RESULT" = "PONG" ]; then
        echo "✅ Redis est accessible et répond correctement"
        echo ""
        
        # Afficher les informations Redis
        echo "📊 Informations Redis :"
        if [ -n "$REDIS_PASSWORD" ]; then
            redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" INFO server 2>/dev/null | grep -E "redis_version|uptime_in_days|tcp_port" | sed 's/^/   /'
        else
            redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO server 2>/dev/null | grep -E "redis_version|uptime_in_days|tcp_port" | sed 's/^/   /'
        fi
        
        echo ""
        echo "🎉 Redis est prêt pour eLISAschool !"
        exit 0
    else
        echo "❌ Redis ne répond pas correctement: $RESULT"
        exit 1
    fi
else
    # redis-cli n'est pas installé, utiliser Docker
    echo "⚠️  redis-cli non installé, test via Docker..."
    
    if command -v docker &> /dev/null; then
        if [ -n "$REDIS_PASSWORD" ]; then
            RESULT=$(docker exec elisaschool_redis redis-cli -a "$REDIS_PASSWORD" ping 2>&1)
        else
            RESULT=$(docker exec elisaschool_redis redis-cli ping 2>&1)
        fi

        if [ "$RESULT" = "PONG" ]; then
            echo "✅ Redis (Docker) est accessible et répond correctement"
            echo ""
            echo "🎉 Redis est prêt pour eLISAschool !"
            exit 0
        else
            echo "❌ Redis (Docker) ne répond pas: $RESULT"
            echo ""
            echo "💡 Vérifier que le container Redis tourne :"
            echo "   docker ps | grep redis"
            exit 1
        fi
    else
        echo "❌ ni redis-cli ni Docker ne sont disponibles"
        echo ""
        echo "💡 Installer redis-cli ou utiliser Docker :"
        echo "   macOS: brew install redis"
        echo "   Ubuntu: sudo apt install redis-tools"
        exit 1
    fi
fi
