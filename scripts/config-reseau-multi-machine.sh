#!/bin/bash
# ==================================
# eLISAschool - Configuration Réseau Multi-Machine
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Détecte l'IP du serveur et configure l'accès réseau local
# Usage: ./scripts/config-reseau-multi-machine.sh

set -e

echo "🌐 Configuration Réseau Multi-Machine - eLISAschool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Détecter l'IP du serveur sur le réseau local
echo "🔍 Détection de l'IP du serveur..."

# Méthode 1: ip route (Linux)
SERVER_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || echo "")

# Méthode 2: hostname -I (fallback)
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
fi

# Méthode 3: ifconfig (fallback)
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1 || echo "")
fi

if [ -z "$SERVER_IP" ]; then
    echo "❌ Impossible de détecter l'IP du serveur"
    echo "💡 Veuillez définir manuellement la variable SERVER_IP dans .env"
    exit 1
fi

echo "✅ IP détectée: $SERVER_IP"
echo ""

# 2. Détecter la plage réseau
echo "🔍 Détection de la plage réseau..."
NETWORK_PREFIX=$(echo $SERVER_IP | cut -d'.' -f1-3)
echo "✅ Plage réseau: ${NETWORK_PREFIX}.0/24"
echo ""

# 3. Configurer .env
echo "📝 Configuration de .env..."

# Lire le fichier .env actuel
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

# Sauvegarder l'ancien .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Mettre à jour ALLOWED_ORIGINS avec l'IP du serveur
sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://${SERVER_IP}:7001,http://${NETWORK_PREFIX}.0/24:7001|" .env

echo "✅ .env mis à jour avec:"
echo "   - http://localhost:7001"
echo "   - http://127.0.0.1:7001"
echo "   - http://0.0.0.0:7001"
echo "   - http://${SERVER_IP}:7001"
echo "   - http://${NETWORK_PREFIX}.0/24:7001 (plage réseau)"
echo ""

# 4. Afficher les URLs d'accès
echo "🌍 URLs d'accès à eLISAschool:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Depuis CETTE machine (serveur):"
echo "   Frontend: http://localhost:7001"
echo "   Backend:  http://localhost:7000"
echo "   pgAdmin:  http://localhost:7004"
echo ""
echo "🖥️  Depuis AUTRES machines du réseau local:"
echo "   Frontend: http://${SERVER_IP}:7001"
echo "   Backend:  http://${SERVER_IP}:7000"
echo "   pgAdmin:  http://${SERVER_IP}:7004"
echo ""
echo "📡 Depuis N'IMPORTE QUELLE machine (${NETWORK_PREFIX}.x):"
echo "   Remplacer X par l'IP de la machine cible"
echo "   Ex: http://${NETWORK_PREFIX}.50:7001"
echo ""

# 5. Instructions de firewall
echo "🔒 Configuration du Firewall (si nécessaire):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ubuntu/Debian (UFW):"
echo "  sudo ufw allow 7000:7004/tcp"
echo "  sudo ufw reload"
echo ""
echo "CentOS/RHEL (firewalld):"
echo "  sudo firewall-cmd --permanent --add-port=7000-7004/tcp"
echo "  sudo firewall-cmd --reload"
echo ""

# 6. Test de connectivité
echo "🧪 Test de connectivité..."
echo ""

# Vérifier que Docker tourne
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution"
    echo "💡 Démarrer Docker: sudo systemctl start docker"
    exit 1
fi

# Vérifier que les conteneurs tournent
BACKEND_RUNNING=$(docker ps --filter "name=elisaschool_backend" --format "healthy" 2>/dev/null || echo "stopped")
FRONTEND_RUNNING=$(docker ps --filter "name=elisaschool_frontend" --format "healthy" 2>/dev/null || echo "stopped")

if [ "$BACKEND_RUNNING" = "stopped" ]; then
    echo "⚠️  Backend n'est pas en cours d'exécution"
    echo "💡 Démarrer: docker compose up -d"
else
    echo "✅ Backend: en cours d'exécution"
fi

if [ "$FRONTEND_RUNNING" = "stopped" ]; then
    echo "⚠️  Frontend n'est pas en cours d'exécution"
    echo "💡 Démarrer: docker compose up -d"
else
    echo "✅ Frontend: en cours d'exécution"
fi

echo ""

# 7. Test curl
echo "🧪 Test d'accès local..."
if curl -s http://localhost:7000/api/health >/dev/null 2>&1; then
    echo "✅ Backend accessible sur http://localhost:7000"
else
    echo "❌ Backend non accessible sur http://localhost:7000"
fi

if curl -s http://localhost:7001 >/dev/null 2>&1; then
    echo "✅ Frontend accessible sur http://localhost:7001"
else
    echo "❌ Frontend non accessible sur http://localhost:7001"
fi

echo ""

# 8. Test d'accès réseau (si conteneurs tournent)
if [ "$BACKEND_RUNNING" != "stopped" ]; then
    echo "🧪 Test d'accès depuis le réseau..."
    BACKEND_CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' elisaschool_backend 2>/dev/null || echo "")
    
    if [ -n "$BACKEND_CONTAINER_IP" ]; then
        echo "✅ IP du backend dans Docker: $BACKEND_CONTAINER_IP"
        
        # Test depuis une autre IP du réseau (simulé)
        echo "💡 Pour tester depuis une autre machine:"
        echo "   curl http://${SERVER_IP}:7000/api/health"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration réseau terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Redémarrer les conteneurs: docker compose down && docker compose up -d"
echo "   2. Tester depuis une autre machine: http://${SERVER_IP}:7001"
echo "   3. Si firewall activé: ouvrir les ports 7000-7004"
echo ""
echo "📄 Documentation: GUIDE-ACCES-RESEAU-LOCAL.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
