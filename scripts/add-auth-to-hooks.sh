#!/bin/bash

# ==================================
# eLISAschool - Script d'ajout d'authentification aux hooks
# ==================================

echo "🔧 Ajout de la vérification isAuthenticated aux hooks..."

FRONTEND_SRC="/home/franckylab/projets/eLISAschool/frontend/src"

# Liste des hooks à modifier
HOOKS=(
    "features/classes/hooks/use-classes.ts"
    "features/annees-scolaires/hooks/use-annees-scolaires.ts"
    "features/matieres/hooks/use-matieres.ts"
    "features/personnel/hooks/use-personnel.ts"
    "features/cycles/hooks/use-cycles.ts"
    "features/niveaux/hooks/use-niveaux.ts"
    "features/periodes/hooks/use-periodes.ts"
)

for hook in "${HOOKS[@]}"; do
    FILE="$FRONTEND_SRC/$hook"
    
    if [ -f "$FILE" ]; then
        echo "✅ Traitement de $hook"
        
        # Vérifier si useAuthStore est déjà importé
        if ! grep -q "useAuthStore" "$FILE"; then
            # Ajouter l'import
            sed -i "s|import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';|import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport { useAuthStore } from '@/stores/auth.store';|" "$FILE"
            echo "   ➕ Import useAuthStore ajouté"
        fi
        
        # Vérifier si enabled: isAuthenticated existe déjà
        if ! grep -q "enabled: isAuthenticated" "$FILE"; then
            # Trouver la première fonction useQuery et ajouter enabled
            # Ceci est une simplification - en production, il faudrait un parser AST
            echo "   ⚠️  Vérifier manuellement: ajouter 'enabled: isAuthenticated' dans les useQuery"
        fi
    else
        echo "⚠️  Fichier non trouvé: $hook"
    fi
done

echo ""
echo "✅ Script terminé !"
echo "💡 Vérifier manuellement les hooks pour ajouter 'enabled: isAuthenticated'"
