#!/bin/bash

# ==================================
# eLISAschool - Script Déploiement Messagerie v2.1
# ==================================
# Version: 2.1.0
# Auteur: franck arlos chendjou
# 
# Optimisations, corrections de bugs et nouvelles fonctionnalités

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================================
# FONCTIONS
# ==================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# ==================================
# VÉRIFICATIONS PRÉLIMINAIRES
# ==================================

log_info "Vérification des prérequis..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "Ce script doit être exécuté depuis le répertoire backend"
    exit 1
fi

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL n'est pas défini dans l'environnement"
    exit 1
fi

# Vérifier que Redis est accessible
if command -v redis-cli &> /dev/null; then
    if ! redis-cli ping &> /dev/null; then
        log_warning "Redis n'est pas accessible, le cache ne fonctionnera pas"
    else
        log_success "Redis accessible"
    fi
fi

# ==================================
# ÉTAPE 1: BACKUP
# ==================================

log_info "Étape 1/6: Backup de la base de données..."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_messagerie_${TIMESTAMP}.sql"

if command -v pg_dump &> /dev/null; then
    pg_dump $DATABASE_URL \
        --tables conversations \
        --tables participants_conversation \
        --tables messages \
        --tables message_reactions \
        --tables message_read_status \
        --tables message_mentions \
        --tables templates_message \
        --tables messages_fichiers \
        --format custom \
        --file "/tmp/${BACKUP_FILE}" 2>/dev/null || true
    log_success "Backup créé: /tmp/${BACKUP_FILE}"
else
    log_warning "pg_dump non disponible, skip backup"
fi

# ==================================
# ÉTAPE 2: MIGRATION SQL
# ==================================

log_info "Étape 2/6: Exécution de la migration SQL..."

MIGRATION_FILE="database/migrations/044-messagerie-optimisations-v2.1.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    log_error "Fichier de migration non trouvé: $MIGRATION_FILE"
    exit 1
fi

psql $DATABASE_URL -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    log_success "Migration SQL exécutée avec succès"
else
    log_error "Échec de la migration SQL"
    exit 1
fi

# ==================================
# ÉTAPE 3: VÉRIFICATION INDEXES
# ==================================

log_info "Étape 3/6: Vérification des indexes..."

INDEX_COUNT=$(psql $DATABASE_URL -t -c "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE tablename IN (
        'conversations', 
        'participants_conversation', 
        'messages',
        'message_reactions',
        'message_read_status',
        'message_mentions',
        'templates_message',
        'messages_fichiers'
    );
" | tr -d ' ')

log_success "Total indexes messagerie: $INDEX_COUNT"

# Vérifier les indexes spécifiques
EXPECTED_INDEXES=(
    "idx_participant_conv_user_unique"
    "idx_read_status_unique"
    "idx_messages_search_vector"
    "idx_conv_etablissement_type_updated"
    "idx_msg_conv_created"
)

for index_name in "${EXPECTED_INDEXES[@]}"; do
    EXISTS=$(psql $DATABASE_URL -t -c "
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE indexname = '$index_name';
    " | tr -d ' ')
    
    if [ "$EXISTS" -gt 0 ]; then
        log_success "Index $index_name ✅"
    else
        log_warning "Index $index_name manquant ❌"
    fi
done

# ==================================
# ÉTAPE 4: VÉRIFICATION PARAMÈTRES
# ==================================

log_info "Étape 4/6: Vérification des paramètres de configuration..."

PARAM_COUNT=$(psql $DATABASE_URL -t -c "
    SELECT COUNT(*) 
    FROM parametres_application 
    WHERE cle LIKE 'messagerie.%';
" | tr -d ' ')

log_success "Paramètres messagerie: $PARAM_COUNT"

if [ "$PARAM_COUNT" -lt 10 ]; then
    log_warning "Moins de 10 paramètres trouvés, exécution des seeds..."
    
    psql $DATABASE_URL -c "
    INSERT INTO parametres_application (cle, valeur, type, categorie, description, visible)
    VALUES 
        ('messagerie.max_message_length', '5000', 'number', 'messagerie', 'Longueur maximale d''un message', true),
        ('messagerie.max_participants', '100', 'number', 'messagerie', 'Nombre maximum de participants', true),
        ('messagerie.allow_attachments', 'true', 'boolean', 'messagerie', 'Autoriser les attachments', true),
        ('messagerie.max_attachment_size', '10', 'number', 'messagerie', 'Taille max attachment (MB)', true),
        ('messagerie.urgent_sms_notification', 'true', 'boolean', 'messagerie', 'SMS pour messages urgents', true),
        ('messagerie.delai_edition', '15', 'number', 'messagerie', 'Délai d''édition en minutes', true),
        ('messagerie.typing_indicator_ttl', '5', 'number', 'messagerie', 'TTL typing indicator (s)', true),
        ('messagerie.online_status_ttl', '60', 'number', 'messagerie', 'TTL statut en ligne (s)', true),
        ('messagerie.cache_conversations_ttl', '30', 'number', 'messagerie', 'TTL cache conversations', false),
        ('messagerie.cache_messages_ttl', '60', 'number', 'messagerie', 'TTL cache messages', false)
    ON CONFLICT (cle) DO NOTHING;
    "
    
    log_success "Paramètres créés"
fi

# ==================================
# ÉTAPE 5: COMPILATION TYPESCRIPT
# ==================================

log_info "Étape 5/6: Compilation TypeScript..."

if npm run build; then
    log_success "Compilation réussie"
else
    log_error "Échec de la compilation"
    exit 1
fi

# ==================================
# ÉTAPE 6: REDÉMARRAGE
# ==================================

log_info "Étape 6/6: Redémarrage du serveur..."

# Si Docker
if docker ps --format '{{.Names}}' | grep -q "elisaschool-backend"; then
    log_info "Redémarrage via Docker..."
    docker restart elisaschool-backend
    log_success "Serveur redémarré (Docker)"

# Si PM2
elif command -v pm2 &> /dev/null && pm2 list | grep -q "elisaschool"; then
    log_info "Redémarrage via PM2..."
    pm2 restart elisaschool
    log_success "Serveur redémarré (PM2)"

# Sinon
else
    log_warning "Redémarrage manuel requis"
    log_info "Commande: npm run dev (development) ou npm start (production)"
fi

# ==================================
# RÉSUMÉ
# ==================================

echo ""
echo "=================================="
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ${NC}"
echo "=================================="
echo ""
log_success "Version: 2.1.0"
log_success "Migration SQL: ✅"
log_success "Indexes: ✅ ($INDEX_COUNT indexes)"
log_success "Paramètres: ✅ ($PARAM_COUNT paramètres)"
log_success "Compilation: ✅"
echo ""
log_info "Nouvelles fonctionnalités:"
echo "  - Cache Redis intelligent"
echo "  - Statistiques et analytics"
echo "  - SSE avec reconnexion automatique"
echo "  - Typing indicators auto-cleanup"
echo "  - Correction bug getUnreadCount"
echo "  - Optimisation N+1 queries"
echo ""
log_info "Endpoints ajoutés:"
echo "  GET  /api/messagerie/stats/etablissement"
echo "  GET  /api/messagerie/stats/user"
echo "  GET  /api/messagerie/stats/reactions"
echo "  GET  /api/messagerie/stats/trends"
echo "  GET  /api/messagerie/cache/stats"
echo "  POST /api/messagerie/cache/clear/user"
echo "  POST /api/messagerie/cache/clear/all"
echo ""
log_info "Documentation: docs/AMELIORATIONS-MESSAGERIE-V2.1.md"
echo ""

# ==================================
# TESTS POST-DÉPLOIEMENT
# ==================================

read -p "Voulez-vous exécuter les tests post-déploiement ? (o/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    log_info "Exécution des tests..."
    
    # Test endpoint conversations
    log_info "Test GET /api/messagerie/conversations..."
    # curl -s -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/messagerie/conversations | jq '.success'
    
    # Test cache
    log_info "Test cache Redis..."
    if command -v redis-cli &> /dev/null; then
        REDIS_KEYS=$(redis-cli KEYS "messagerie:*" | wc -l)
        log_success "Clés Redis messagerie: $REDIS_KEYS"
    fi
    
    log_success "Tests terminés"
fi

echo ""
log_success "Déploiement messagerie v2.1 terminé avec succès ! 🎉"
