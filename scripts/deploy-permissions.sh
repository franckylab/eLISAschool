#!/bin/bash

# ==================================
# eLISAschool - Déploiement du Système de Permissions v2.0
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Script de vérification et déploiement des permissions
# Exécuter après un pull ou des modifications

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du Système de Permissions v2.0"
echo "=============================================="
echo ""

# ==================================
# ÉTAPE 1: Vérifications préliminaires
# ==================================

echo "📋 ÉTAPE 1: Vérifications préliminaires..."
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécuter ce script depuis la racine du projet eLISAschool"
    exit 1
fi

# Vérifier que les fichiers existent
FILES_TO_CHECK=(
    "frontend/src/app/permission-guards.ts"
    "frontend/src/hooks/use-permissions-advanced.ts"
    "frontend/src/hooks/use-sensitive-tabs.ts"
    "frontend/src/hooks/use-dashboard-widgets.ts"
    "frontend/src/components/permissions/PermissionGate.tsx"
    "frontend/src/components/permissions/RequirePermission.tsx"
    "frontend/src/components/debug/DebugPermissions.tsx"
    "scripts/check-permissions.js"
)

echo "✅ Vérification des fichiers..."
for file in "${FILES_TO_CHECK[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier manquant: $file"
        exit 1
    fi
    echo "  ✓ $file"
done
echo ""

# ==================================
# ÉTAPE 2: Vérification des permissions
# ==================================

echo "📋 ÉTAPE 2: Vérification des permissions..."
echo ""

# Exécuter le script de vérification
if node scripts/check-permissions.js; then
    echo "✅ Vérification des permissions réussie"
else
    echo "⚠️  Des incohérences de permissions ont été détectées"
    echo "   Consultez les détails ci-dessus"
    read -p "Continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
fi
echo ""

# ==================================
# ÉTAPE 3: Compilation TypeScript
# ==================================

echo "📋 ÉTAPE 3: Compilation TypeScript..."
echo ""

cd frontend

# Nettoyer le cache
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Compiler
if npm run build; then
    echo "✅ Compilation réussie"
else
    echo "❌ Échec de la compilation"
    echo "   Corrigez les erreurs TypeScript avant de continuer"
    exit 1
fi

cd ..
echo ""

# ==================================
# ÉTAPE 4: Vérification des routes protégées
# ==================================

echo "📋 ÉTAPE 4: Vérification des routes protégées..."
echo ""

# Compter les routes avec beforeLoad
ROUTES_WITH_GUARDS=$(grep -r "beforeLoad.*require" frontend/src/app/routes/*.tsx 2>/dev/null | wc -l || echo "0")

echo "📊 Statistiques des routes:"
echo "  Routes protégées: $ROUTES_WITH_GUARDS"
echo ""

if [ "$ROUTES_WITH_GUARDS" -lt 20 ]; then
    echo "⚠️  Attention: Moins de 20 routes protégées détectées"
    echo "   Vérifiez que toutes les routes sensibles sont protégées"
    echo ""
fi

# ==================================
# ÉTAPE 5: Résumé du déploiement
# ==================================

echo "=============================================="
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS"
echo "=============================================="
echo ""
echo "📊 Résumé:"
echo "  ✓ Fichiers vérifiés: ${#FILES_TO_CHECK[@]}"
echo "  ✓ Routes protégées: $ROUTES_WITH_GUARDS"
echo "  ✓ Compilation: OK"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Tester avec différents rôles"
echo "     → Suivre docs/GUIDE-TEST-MULTI-ROLES.md"
echo ""
echo "  2. Vérifier le Debug Panel"
echo "     → Connectez-vous en dev pour voir le panel"
echo ""
echo "  3. Tester les routes protégées"
echo "     → Essayez d'accéder à /eleves, /admin, etc."
echo ""
echo "  4. Vérifier les onglets sensibles"
echo "     → Voir les onglets médical/financier"
echo ""
echo "📚 Documentation:"
echo "  - QUICK-START-PERMISSIONS.md"
echo "  - GUIDE-TEST-MULTI-ROLES.md"
echo "  - IMPLEMENTATION-TERMINEE.md"
echo ""
echo "🎉 Le système de permissions v2.0 est déployé !"
echo ""
