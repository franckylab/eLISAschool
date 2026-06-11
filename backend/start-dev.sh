#\!/bin/bash
# Charger les variables d'environnement du .env racine
if [ -f "../../.env" ]; then
    export $(grep -v '^#' ../../.env | xargs)
    echo "✅ Variables d'environnement chargées depuis ../../.env"
else
    echo "⚠️  Fichier .env non trouvé à la racine"
fi

# Démarrer le backend
npm run dev
