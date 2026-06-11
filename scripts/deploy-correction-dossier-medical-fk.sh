#!/bin/bash
# ==================================
# eLISAschool - Déploiement Correction FK Dossier Médical
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Description: Applique la migration 043 et redémarre le serveur
# ==================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de la correction FK Dossier Médical..."

# Aller dans le répertoire backend
cd "$(dirname "$0")/.."

echo "📦 Installation des dépendances..."
npm install

echo "🗄️  Exécution de la migration 043..."
npm run typeorm migration:run -- -d src/config/database.config.ts

echo "✅ Migration appliquée avec succès!"

echo "🔄 Redémarrage du serveur..."
npm run dev

echo "✅ Déploiement terminé!"
