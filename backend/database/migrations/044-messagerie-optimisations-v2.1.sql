-- ==================================
-- eLISAschool - Migration Messagerie Optimisations v2.1
-- ==================================
-- Version: 2.1.0
-- Auteur: franck arlos chendjou
-- 
-- Améliorations et optimisations:
-- - Indexes composites pour performance
-- - Contraintes d'unicité
-- - Index GIN pour recherche full-text
-- - Optimisations des requêtes

-- ==================================
-- INDEXES SUPPLÉMENTAIRES POUR PERFORMANCE
-- ==================================

-- Index unique sur participants pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_conv_user_unique 
    ON participants_conversation(conversation_id, utilisateur_id);

-- Index pour filtrage des conversations archivées
CREATE INDEX IF NOT EXISTS idx_participant_user_archive 
    ON participants_conversation(utilisateur_id, archive_perso) 
    WHERE archive_perso = false;

-- Index unique pour read status (un seul par user/message)
CREATE UNIQUE INDEX IF NOT EXISTS idx_read_status_unique 
    ON message_read_status(message_id, utilisateur_id);

-- Index pour statistiques de lecture
CREATE INDEX IF NOT EXISTS idx_read_status_user_date 
    ON message_read_status(utilisateur_id, lu_a);

-- Index pour cascade delete sur mentions
CREATE INDEX IF NOT EXISTS idx_mentions_message_id 
    ON message_mentions(message_id);

-- ==================================
-- INDEXES COMPOSITES POUR CONVERSATIONS
-- ==================================

-- Optimisation pour tri par date + type
CREATE INDEX IF NOT EXISTS idx_conv_etablissement_type_updated 
    ON conversations(etablissement_id, type, updated_at DESC);

-- Optimisation pour recherche de conversations liées
CREATE INDEX IF NOT EXISTS idx_conv_entite_liee 
    ON conversations(entite_liee_type, entite_liee_id) 
    WHERE entite_liee_type IS NOT NULL;

-- ==================================
-- INDEXES POUR MESSAGES
-- ==================================

-- Index composite pour requêtes par conversation + date
CREATE INDEX IF NOT EXISTS idx_msg_conv_created 
    ON messages(conversation_id, created_at DESC);

-- Index pour filtrage des messages supprimés
CREATE INDEX IF NOT EXISTS idx_msg_etablissement_supprime 
    ON messages(etablissement_id, supprime) 
    WHERE supprime = false;

-- Index pour threads/réponses
CREATE INDEX IF NOT EXISTS idx_msg_reponse_a 
    ON messages(reponse_a_id) 
    WHERE reponse_a_id IS NOT NULL;

-- Index pour messages par priorité
CREATE INDEX IF NOT EXISTS idx_msg_priorite 
    ON messages(priorite, created_at DESC) 
    WHERE priorite != 'normal';

-- ==================================
-- FULL-TEXT SEARCH OPTIMISATIONS
-- ==================================

-- Vérifier et créer la colonne search_vector si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE messages 
            ADD COLUMN search_vector tsvector 
            GENERATED ALWAYS AS (to_tsvector('french', contenu)) STORED;
    END IF;
END $$;

-- Index GIN pour recherche full-text
CREATE INDEX IF NOT EXISTS idx_messages_search_vector 
    ON messages USING GIN (search_vector);

-- ==================================
-- INDEXES POUR RÉACTIONS
-- ==================================

-- Index pour agrégation par message + emoji
CREATE INDEX IF NOT EXISTS idx_reactions_message_emoji 
    ON message_reactions(message_id, emoji);

-- Index pour statistiques par utilisateur
CREATE INDEX IF NOT EXISTS idx_reactions_user 
    ON message_reactions(utilisateur_id, created_at DESC);

-- ==================================
-- INDEXES POUR TEMPLATES
-- ==================================

-- Index pour recherche de templates actifs par catégorie
CREATE INDEX IF NOT EXISTS idx_templates_etablissement_categorie_actif 
    ON templates_message(etablissement_id, categorie, actif) 
    WHERE actif = true;

-- ==================================
-- INDEXES POUR FICHIERS
-- ==================================

-- Index pour recherche de fichiers par message
CREATE INDEX IF NOT EXISTS idx_fichiers_message 
    ON messages_fichiers(message_id);

-- Index pour statistiques par établissement
CREATE INDEX IF NOT EXISTS idx_fichiers_etablissement 
    ON messages_fichiers(etablissement_id, created_at DESC);

-- ==================================
-- CONTRAINTES DE COHÉRENCE
-- ==================================

-- Assurer que countMessages est toujours >= 0
ALTER TABLE conversations 
    ADD CONSTRAINT chk_count_messages_positive 
    CHECK (count_messages >= 0);

-- Assurer que la longueur du contenu est valide
ALTER TABLE messages 
    ADD CONSTRAINT chk_contenu_length 
    CHECK (char_length(contenu) > 0 AND char_length(contenu) <= 5000);

-- ==================================
-- VUES POUR STATISTIQUES (optionnel)
-- ==================================

-- Vue pour statistiques rapides par établissement
CREATE OR REPLACE VIEW v_stats_messagerie_etablissement AS
SELECT 
    c.etablissement_id,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(DISTINCT m.id) as total_messages,
    COUNT(DISTINCT CASE WHEN m.created_at >= CURRENT_DATE THEN m.id END) as messages_today,
    COUNT(DISTINCT CASE WHEN m.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN m.id END) as messages_week,
    COUNT(DISTINCT m.expediteur_id) as active_users_week
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id 
    AND m.supprime = false 
    AND m.created_at >= CURRENT_DATE - INTERVAL '7 days'
WHERE c.actif = true
GROUP BY c.etablissement_id;

-- Vue pour activité utilisateur
CREATE OR REPLACE VIEW v_stats_messagerie_utilisateur AS
SELECT 
    p.utilisateur_id,
    c.etablissement_id,
    COUNT(DISTINCT p.conversation_id) as total_conversations,
    COUNT(DISTINCT CASE WHEN m.expediteur_id = p.utilisateur_id THEN m.id END) as messages_sent,
    COUNT(DISTINCT CASE WHEN m.expediteur_id != p.utilisateur_id THEN m.id END) as messages_received
FROM participants_conversation p
JOIN conversations c ON c.id = p.conversation_id
LEFT JOIN messages m ON m.conversation_id = c.id AND m.supprime = false
GROUP BY p.utilisateur_id, c.etablissement_id;

-- ==================================
-- DONNÉES DE CONFIGURATION
-- ==================================

-- Paramètres de configuration pour la messagerie
INSERT INTO parametres_application (cle, valeur, type, categorie, description, visible)
VALUES 
    ('messagerie.max_message_length', '5000', 'number', 'messagerie', 'Longueur maximale d''un message', true),
    ('messagerie.max_participants', '100', 'number', 'messagerie', 'Nombre maximum de participants par conversation', true),
    ('messagerie.allow_attachments', 'true', 'boolean', 'messagerie', 'Autoriser les attachments', true),
    ('messagerie.max_attachment_size', '10', 'number', 'messagerie', 'Taille max attachment (MB)', true),
    ('messagerie.urgent_sms_notification', 'true', 'boolean', 'messagerie', 'SMS pour messages urgents', true),
    ('messagerie.delai_edition', '15', 'number', 'messagerie', 'Délai d''édition en minutes', true),
    ('messagerie.typing_indicator_ttl', '5', 'number', 'messagerie', 'TTL typing indicator (secondes)', true),
    ('messagerie.online_status_ttl', '60', 'number', 'messagerie', 'TTL statut en ligne (secondes)', true),
    ('messagerie.cache_conversations_ttl', '30', 'number', 'messagerie', 'TTL cache conversations (secondes)', false),
    ('messagerie.cache_messages_ttl', '60', 'number', 'messagerie', 'TTL cache messages (secondes)', false)
ON CONFLICT (cle) DO NOTHING;

-- ==================================
-- COMMENTAIRES SUR LES TABLES
-- ==================================

COMMENT ON TABLE conversations IS 'Conversations de messagerie avec support multi-tenant';
COMMENT ON TABLE participants_conversation IS 'Participants aux conversations avec statuts individuels';
COMMENT ON TABLE messages IS 'Messages avec support threads, réactions et full-text search';
COMMENT ON TABLE message_reactions IS 'Réactions emoji sur les messages';
COMMENT ON TABLE message_read_status IS 'Statut de lecture des messages';
COMMENT ON TABLE message_mentions IS 'Mentions @utilisateur dans les messages';
COMMENT ON TABLE templates_message IS 'Templates de messages prédéfinis';
COMMENT ON TABLE messages_fichiers IS 'Fichiers attachés aux messages';

-- ==================================
-- VÉRIFICATION
-- ==================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
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
    
    RAISE NOTICE 'Migration messagerie v2.1 terminée. Total indexes: %', index_count;
END $$;
