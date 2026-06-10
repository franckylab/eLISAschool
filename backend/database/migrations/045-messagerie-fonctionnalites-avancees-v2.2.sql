-- ==================================
-- eLISAschool - Migration Messagerie Fonctionnalités Avancées v2.2
-- ==================================
-- Version: 2.2.0
-- Auteur: franck arlos chendjou
-- 
-- Nouvelles fonctionnalités:
-- - Transfert de messages
-- - Brouillons (Redis)
-- - Messages épinglés (Redis)
-- - Paramètres de configuration additionnels

-- ==================================
-- PARAMÈTRES DE CONFIGURATION
-- ==================================

INSERT INTO parametres_application (cle, valeur, type, categorie, description, visible)
VALUES 
    -- Transfert de messages
    ('messagerie.max_forward_conversations', '10', 'number', 'messagerie', 'Nombre max de conversations pour transfert', true),
    ('messagerie.forward_notification', 'true', 'boolean', 'messagerie', 'Notifier lors d''un transfert', true),
    
    -- Brouillons
    ('messagerie.draft_ttl_days', '7', 'number', 'messagerie', 'Durée de vie des brouillons (jours)', true),
    ('messagerie.draft_auto_save_delay', '3', 'number', 'messagerie', 'Délai auto-save brouillons (secondes)', false),
    
    -- Messages épinglés
    ('messagerie.max_pinned_per_conversation', '10', 'number', 'messagerie', 'Max messages épinglés par conversation', true),
    ('messagerie.pinned_ttl_days', '30', 'number', 'messagerie', 'Durée de vie messages épinglés (jours)', true),
    
    -- Upload de fichiers
    ('messagerie.max_file_size_mb', '10', 'number', 'messagerie', 'Taille max fichier upload (MB)', true),
    ('messagerie.allowed_file_types', 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'string', 'messagerie', 'Types MIME autorisés', true),
    ('messagerie.storage_provider', 'local', 'string', 'messagerie', 'Provider de stockage (local, s3)', true)
ON CONFLICT (cle) DO NOTHING;

-- ==================================
-- COMMENTAIRES SUR LES FONCTIONNALITÉS
-- ==================================

COMMENT ON COLUMN messages.metadata IS 'Métadonnées JSON : forwardedFrom, originalExpediteurId, forwardedAt, etc.';

-- ==================================
-- CLÉS REDIS UTILISÉES (documentation)
-- ==================================

-- Brouillons: messagerie:drafts:{userId}:{conversationId}
-- TTL: 7 jours
-- Format: { conversationId, contenu, piecesJointes, createdAt, updatedAt }

-- Messages épinglés: messagerie:pinned:{conversationId}:{messageId}
-- TTL: 30 jours
-- Format: { messageId, conversationId, userId, pinnedAt, ttl }

-- Statistiques cache: messagerie:conversations:{userId}:{page}:{limit}:{type}:{archive}
-- TTL: 30 secondes

-- Messages cache: messagerie:messages:{conversationId}:{cursor}
-- TTL: 60 secondes

-- Unread count: messagerie:unread:{userId}
-- TTL: 30 secondes

-- Typing indicators: messagerie:typing:{conversationId}:{userId}
-- TTL: 5 secondes (auto-cleanup)

-- Online status: messagerie:online:{userId}
-- TTL: 60 secondes

-- ==================================
-- VÉRIFICATION
-- ==================================

DO $$
DECLARE
    param_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO param_count
    FROM parametres_application 
    WHERE cle LIKE 'messagerie.%';
    
    RAISE NOTICE 'Migration messagerie v2.2 terminée. Paramètres messagerie: %', param_count;
END $$;
