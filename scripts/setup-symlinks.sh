#\!/bin/bash
# ==================================
# eLISAschool - Setup des liens symboliques
# ==================================
# Crée les liens symboliques nécessaires pour le développement
# Ce script doit être exécuté après le clone ou le pull

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔗 Création des liens symboliques..."

# Lien symbolique pour le fond principal (variantes dark/light)
if [ \! -L "$ROOT_DIR/frontend/public/fonds-principal" ]; then
    echo "  📁 fonds-principal → public/fonds-principal"
    cd "$ROOT_DIR/frontend/public"
    ln -sf ../../public/fonds-principal fonds-principal
    echo "  ✅ Lien créé"
else
    echo "  ✅ fonds-principal déjà configuré"
fi

echo "✨ Setup des liens symboliques terminé"
