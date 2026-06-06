#!/bin/bash

# ==================================
# eLISAschool - Script d'exécution de migration
# ==================================
# Usage: npm run migrate:config

echo "🚀 Exécution de la migration des paramètres de configuration..."
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le répertoire backend/"
    exit 1
fi

# Compiler le TypeScript
echo "📦 Compilation TypeScript..."
npx tsc -p tsconfig.json

# Exécuter la migration
echo ""
echo "🔧 Exécution de la migration..."
npx ts-node src/database/migrations/005-advanced-config-params.ts

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration terminée avec succès!"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Redémarrer l'application backend"
    echo "   2. Vérifier les nouveaux paramètres dans l'interface admin"
    echo "   3. Tester les validations de paramètres"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de la migration"
    echo "   Voir les logs ci-dessus pour plus de détails"
    echo ""
    exit 1
fi
