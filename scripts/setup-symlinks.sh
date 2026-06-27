#\!/bin/bash
# ==================================
# eLISAschool - Setup des liens symboliques
# ==================================
# Crée les liens symboliques nécessaires pour le développement
# Ce script doit être exécuté après le clone ou le pull

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔗 Création des liens symboliques..."

# Lien symbolique pour les fonds d'écran SVG
if [ \! -L "$ROOT_DIR/frontend/public/fonds-catalogue" ]; then
    echo "  📁 fonds-catalogue → public/fonds-catalogue"
    cd "$ROOT_DIR/frontend/public"
    ln -sf ../../public/fonds-catalogue fonds-catalogue
    echo "  ✅ Lien créé"
else
    echo "  ✅ fonds-catalogue déjà configuré"
fi

echo "✨ Setup des liens symboliques terminé"
