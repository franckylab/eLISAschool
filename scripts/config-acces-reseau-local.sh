#!/bin/bash
# ==================================
# eLISAschool - Configuration Accès Réseau Local
# ==================================
# Version: 2.0.0
# Auteur: franck arlos chendjou
# 
# Configure VITE_API_URL avec l'IP réelle du serveur (PAS 172.18.0.1)
# Usage: ./scripts/config-acces-reseau-local.sh

set -e

echo "🌐 Configuration Accès Réseau Local - eLISAschool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Détecter l'IP du serveur sur le réseau local
echo "🔍 Détection de l'IP du serveur sur le réseau local..."

SERVER_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || echo "")

if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
fi

if [ -z "$SERVER_IP" ]; then
    echo "❌ Impossible de détecter l'IP du serveur"
    echo "💡 Veuillez exécuter: hostname -I"
    exit 1
fi

echo "✅ IP du serveur détectée: $SERVER_IP"
echo ""

# 2. Configurer .env.local du frontend
echo "📝 Configuration de frontend/.env.local..."

cd "$(dirname "$0")/.."

if [ ! -d "frontend" ]; then
    echo "❌ Dossier frontend/ non trouvé"
    exit 1
fi

# Créer .env.local avec l'IP du serveur
cat > frontend/.env.local << EOF
# ==================================
# eLISAschool - Configuration API Backend
# ==================================
# IMPORTANT: Cette IP doit être accessible depuis TOUTES les machines du réseau local
# NE PAS utiliser 172.18.0.1 (gateway Docker - inaccessible depuis le réseau)

# URL du backend - IP du serveur sur le réseau local
VITE_API_URL=http://${SERVER_IP}:7000
EOF

echo "✅ frontend/.env.local créé avec:"
echo "   VITE_API_URL=http://${SERVER_IP}:7000"
echo ""

# 3. Configurer .env pour les CORS
echo "📝 Configuration des CORS dans .env..."

if [ -f ".env" ]; then
    # Sauvegarder l'ancien .env
    cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Mettre à jour ALLOWED_ORIGINS
    sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://${SERVER_IP}:7001|" .env
    
    echo "✅ .env mis à jour avec CORS pour:"
    echo "   - http://localhost:7001"
    echo "   - http://127.0.0.1:7001"
    echo "   - http://0.0.0.0:7001"
    echo "   - http://${SERVER_IP}:7001"
else
    echo "⚠️  Fichier .env non trouvé"
fi

echo ""

# 4. Redémarrer le frontend
echo "🔄 Nettoyage du cache Vite et redémarrage..."

docker exec elisaschool_frontend sh -c "rm -rf /app/node_modules/.vite" 2>/dev/null || true
docker compose restart frontend

echo "⏳ Attente du redémarrage (15 secondes)..."
sleep 15

echo ""

# 5. Tests de connectivité
echo "🧪 Tests de connectivité..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test backend local
if curl -s http://localhost:7000/api/health >/dev/null 2>&1; then
    echo "✅ Backend accessible sur localhost:7000"
else
    echo "❌ Backend non accessible sur localhost:7000"
fi

# Test backend via IP réseau
if curl -s http://${SERVER_IP}:7000/api/health >/dev/null 2>&1; then
    echo "✅ Backend accessible sur http://${SERVER_IP}:7000"
else
    echo "❌ Backend non accessible sur http://${SERVER_IP}:7000"
fi

# Test frontend local
if curl -s -o /dev/null -w "%{http_code}" http://localhost:7001 | grep -q "200"; then
    echo "✅ Frontend accessible sur localhost:7001"
else
    echo "❌ Frontend non accessible sur localhost:7001"
fi

# Test frontend via IP réseau
if curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}:7001 | grep -q "200"; then
    echo "✅ Frontend accessible sur http://${SERVER_IP}:7001"
else
    echo "❌ Frontend non accessible sur http://${SERVER_IP}:7001"
fi

echo ""

# 6. Afficher les URLs d'accès
echo "🌍 URLs d'accès à eLISAschool:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Depuis CETTE machine (serveur ${SERVER_IP}):"
echo "   Frontend: http://localhost:7001"
echo "   Backend:  http://localhost:7000"
echo "   pgAdmin:  http://localhost:7004"
echo ""
echo "🖥️  Depuis AUTRES machines du réseau local:"
echo "   Frontend: http://${SERVER_IP}:7001"
echo "   Backend:  http://${SERVER_IP}:7000"
echo "   pgAdmin:  http://${SERVER_IP}:7004"
echo ""
echo "💡 Exemple pour une machine 10.0.0.101:"
echo "   Ouvrir dans le navigateur: http://${SERVER_IP}:7001"
echo ""

# 7. Instructions de firewall
echo "🔒 Configuration du Firewall (si nécessaire):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ubuntu/Debian (UFW):"
echo "  sudo ufw allow 7000:7004/tcp"
echo "  sudo ufw status"
echo ""
echo "CentOS/RHEL (firewalld):"
echo "  sudo firewall-cmd --permanent --add-port=7000-7004/tcp"
echo "  sudo firewall-cmd --list-ports"
echo ""

# 8. Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration terminée!"
echo ""
echo "📋 Récapitulatif:"
echo "   • IP du serveur: ${SERVER_IP}"
echo "   • VITE_API_URL: http://${SERVER_IP}:7000"
echo "   • CORS configurés pour le réseau local"
echo "   • Frontend redémarré avec nouveau cache"
echo ""
echo "🚀 Pour tester depuis une autre machine:"
echo "   1. Ouvrir: http://${SERVER_IP}:7001"
echo "   2. Se connecter avec les identifiants de test"
echo "   3. Vérifier que la connexion fonctionne"
echo ""
echo "⚠️  IMPORTANT:"
echo "   • NE PAS utiliser 172.18.0.1 (gateway Docker)"
echo "   • TOUJOURS utiliser l'IP du serveur sur le réseau local"
echo "   • Après modification: rm -rf frontend/node_modules/.vite"
echo "   • Puis: docker compose restart frontend"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
