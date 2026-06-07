#!/bin/bash
# ==================================
# eLISAschool - Script Rebuild Docker avec Nouvelles Dépendances
# ==================================
# Reconstruit l'image Docker avec les nouvelles dépendances notifications

set -e

echo "🔄 Rebuild Docker avec nouvelles dépendances notifications..."
echo ""

cd "$(dirname "$0")/.."

# Étape 1: Arrêter les conteneurs
echo "🛑 Arrêt des conteneurs..."
docker compose down
echo ""

# Étape 2: Supprimer l'ancienne image backend
echo "🗑️  Suppression de l'ancienne image backend..."
docker rmi elisaschool_backend 2>/dev/null || true
docker image prune -f
echo ""

# Étape 3: Reconstruire l'image backend sans cache
echo "🔨 Reconstruction de l'image backend (sans cache)..."
docker compose build --no-cache backend
echo ""

# Étape 4: Redémarrer
echo "🚀 Redémarrage des services..."
docker compose up -d
echo ""

# Étape 5: Afficher les logs
echo "📋 Logs du backend (dernières lignes) :"
docker compose logs --tail=30 backend
echo ""

echo "✅ Rebuild terminé!"
echo ""
echo "💡 Pour vérifier que les providers sont chargés :"
echo "   docker-compose logs backend | grep -i 'provider'"
echo ""
echo "💡 Pour accéder au conteneur :"
echo "   docker-compose exec backend sh"
