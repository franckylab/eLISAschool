#!/bin/bash
# ==================================
# eLISAschool - Script de gestion Docker
# ==================================

set -e

cd "$(dirname "$0")"

case "$1" in
    start)
        echo "🚀 Démarrage de tous les services eLISAschool..."
        docker compose up -d
        echo ""
        echo "✅ Services démarrés :"
        docker ps --filter "name=elisaschool" --format "  {{.Names}}: {{.Status}}"
        echo ""
        echo "🌐 Accès :"
        echo "  - PostgreSQL: localhost:5433"
        echo "  - Redis: localhost:6379"
        echo "  - pgAdmin: http://localhost:5050"
        echo "  - Backend: http://localhost:3000 (si démarré)"
        echo "  - Frontend: http://localhost:5173 (si démarré)"
        ;;
    
    stop)
        echo "🛑 Arrêt de tous les services..."
        docker compose stop
        echo "✅ Services arrêtés"
        ;;
    
    restart)
        echo "🔄 Redémarrage de tous les services..."
        docker compose restart
        echo "✅ Services redémarrés"
        ;;
    
    status)
        echo "📊 État des conteneurs eLISAschool :"
        echo ""
        docker ps --filter "name=elisaschool" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "🌐 Réseau Docker :"
        docker network inspect docker_elisaschool_network --format='{{range .Containers}}  {{.Name}}: {{.IPv4Address}}\n{{end}}' 2>/dev/null || echo "  Réseau non disponible"
        echo ""
        echo "💾 Volumes Docker :"
        docker volume ls --filter "name=docker_" --format "  {{.Name}}"
        ;;
    
    logs)
        if [ -z "$2" ]; then
            echo "📋 Logs de tous les services (Ctrl+C pour quitter) :"
            docker compose logs -f
        else
            echo "📋 Logs de $2 (Ctrl+C pour quitter) :"
            docker compose logs -f "$2"
        fi
        ;;
    
    clean)
        echo "⚠️  Nettoyage complet (supprime conteneurs, réseau et volumes)..."
        read -p "Êtes-vous sûr ? (oui/non) : " confirm
        if [ "$confirm" = "oui" ]; then
            docker compose down --volumes --remove-orphans
            echo "✅ Nettoyage terminé"
        else
            echo "❌ Annulé"
        fi
        ;;
    
    db-shell)
        echo "🔌 Connexion à PostgreSQL..."
        docker exec -it elisaschool_postgres psql -U elisaschool_user -d elisaschool
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|clean|db-shell}"
        echo ""
        echo "Commandes disponibles :"
        echo "  start     - Démarrer tous les services"
        echo "  stop      - Arrêter tous les services"
        echo "  restart   - Redémarrer tous les services"
        echo "  status    - Voir l'état des conteneurs et réseaux"
        echo "  logs      - Voir les logs (optionnel: $0 logs <service>)"
        echo "  clean     - Supprimer tout (conteneurs, volumes, réseau)"
        echo "  db-shell  - Se connecter à PostgreSQL"
        exit 1
        ;;
esac
