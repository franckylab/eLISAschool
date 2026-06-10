/**
 * ==================================
 * eLISAschool - Migration 043: Messagerie Complète
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Migration complète du module messagerie:
 * - Extension des tables existantes (etablissementId, nouvelles colonnes)
 * - Création des nouvelles tables (reactions, read status, mentions, templates, fichiers)
 * - Indexes de performance (full-text search, composites)
 * - Seeds: templates par défaut
 */

-- ==================================
-- 1. EXTENSION DES TABLES EXISTANTES
-- ==================================

-- Table: conversations
ALTER TABLE conversations 
    ADD COLUMN IF NOT EXISTS etablissement_id UUID REFERENCES etablissements(id),
    ADD COLUMN IF NOT EXISTS entite_liee_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS entite_liee_id UUID,
    ADD COLUMN IF NOT EXISTS archive BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS date_archive TIMESTAMP,
    ADD COLUMN IF NOT EXISTS dernier_message_id UUID REFERENCES messages(id),
    ADD COLUMN IF NOT EXISTS count_messages INT DEFAULT 0;

-- Mettre à jour les conversations existantes avec un etablissement_id par défaut
-- (à ajuster selon votre contexte multi-tenant)
UPDATE conversations 
SET etablissement_id = (SELECT id FROM etablissements LIMIT 1)
WHERE etablissement_id IS NULL;

-- Rendre la colonne NOT NULL après avoir défini les valeurs par défaut
ALTER TABLE conversations 
    ALTER COLUMN etablissement_id SET NOT NULL;

-- Table: participants_conversation
ALTER TABLE participants_conversation 
    ADD COLUMN IF NOT EXISTS epingle BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS archive_perso BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS dernier_message_lu_id UUID REFERENCES messages(id);

-- Table: messages
ALTER TABLE messages 
    ADD COLUMN IF NOT EXISTS etablissement_id UUID REFERENCES etablissements(id),
    ADD COLUMN IF NOT EXISTS reponse_a_id UUID REFERENCES messages(id),
    ADD COLUMN IF NOT EXISTS priorite VARCHAR(20) DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS mentions JSONB;

-- Mettre à jour les messages existants
UPDATE messages 
SET etablissement_id = (SELECT c.etablissement_id FROM conversations c WHERE c.id = messages.conversation_id)
WHERE messages.etablissement_id IS NULL;

ALTER TABLE messages 
    ALTER COLUMN etablissement_id SET NOT NULL;

-- ==================================
-- 2. CRÉATION DES NOUVELLES TABLES
-- ==================================

-- Table: message_reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL CHECK (emoji IN ('like', 'love', 'rire', 'triste', 'colere', 'pouce_haut')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, utilisateur_id, emoji)
);

-- Table: message_read_status
CREATE TABLE IF NOT EXISTS message_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    lu_a TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, utilisateur_id)
);

-- Table: message_mentions
CREATE TABLE IF NOT EXISTS message_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    mentionne_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    lu BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: templates_message
CREATE TABLE IF NOT EXISTS templates_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    titre VARCHAR(200) NOT NULL,
    contenu TEXT NOT NULL,
    categorie VARCHAR(50) NOT NULL CHECK (categorie IN ('absence', 'retard', 'discipline', 'info_generale', 'convocation')),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(etablissement_id, code)
);

-- Table: messages_fichiers
CREATE TABLE IF NOT EXISTS messages_fichiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_stockage VARCHAR(500) NOT NULL,
    type_mime VARCHAR(100) NOT NULL,
    taille INT NOT NULL,
    url_acces VARCHAR(500),
    stockage VARCHAR(20) DEFAULT 'local' CHECK (stockage IN ('local', 's3')),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==================================
-- 3. INDEXES DE PERFORMANCE
-- ==================================

-- Full-text search sur messages (PostgreSQL)
ALTER TABLE messages 
    ADD COLUMN IF NOT EXISTS search_vector tsvector 
    GENERATED ALWAYS AS (to_tsvector('french', contenu)) STORED;

CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING GIN (search_vector);

-- Indexes composites pour conversations
CREATE INDEX IF NOT EXISTS idx_conv_etablissement_updated 
    ON conversations(etablissement_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_entite_liee 
    ON conversations(entite_liee_type, entite_liee_id);

CREATE INDEX IF NOT EXISTS idx_conv_type_actif 
    ON conversations(type, actif);

-- Indexes composites pour messages
CREATE INDEX IF NOT EXISTS idx_msg_conversation_created 
    ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_msg_etablissement_expediteur 
    ON messages(etablissement_id, expediteur_id);

CREATE INDEX IF NOT EXISTS idx_msg_priorite 
    ON messages(priorite) WHERE priorite IN ('important', 'urgent');

-- Indexes pour réactions
CREATE INDEX IF NOT EXISTS idx_reactions_message 
    ON message_reactions(message_id, emoji);

-- Indexes pour mentions
CREATE INDEX IF NOT EXISTS idx_mentions_utilisateur_nonlu 
    ON message_mentions(mentionne_id, lu) WHERE lu = false;

-- Indexes pour read status
CREATE INDEX IF NOT EXISTS idx_read_status_user 
    ON message_read_status(utilisateur_id, lu_a DESC);

-- Indexes pour templates
CREATE INDEX IF NOT EXISTS idx_templates_etablissement_categorie 
    ON templates_message(etablissement_id, categorie, actif);

-- Indexes pour fichiers
CREATE INDEX IF NOT EXISTS idx_fichiers_message 
    ON messages_fichiers(message_id);

CREATE INDEX IF NOT EXISTS idx_fichiers_etablissement 
    ON messages_fichiers(etablissement_id);

-- ==================================
-- 4. SEEDS: TEMPLATES PAR DÉFAUT
-- ==================================

-- Templates système (etablissement_id = NULL pour templates globaux)
INSERT INTO templates_message (code, titre, contenu, categorie, etablissement_id, actif) VALUES
    ('absence', 'Signalement absence', 
     'Bonjour,\n\nL''élève {{nom}} sera absent(e) le {{date}}.\n\nMotif: {{motif}}\n\nCordialement.', 
     'absence', NULL, true),
    
    ('retard', 'Signalement retard', 
     'Bonjour,\n\nL''élève {{nom}} aura du retard ce {{date}}.\n\nHeure d''arrivée prévue: {{heure}}\n\nMotif: {{motif}}\n\nCordialement.', 
     'retard', NULL, true),
    
    ('convocation', 'Convocation parent', 
     'Madame, Monsieur,\n\nNous vous invitons à une réunion le {{date}} à {{heure}} concernant {{nom}}.\n\nLieu: {{lieu}}\n\nOrdre du jour: {{ordre_du_jour}}\n\nCordialement,\nLa direction', 
     'convocation', NULL, true),
    
    (' felicitation', 'Félicitations', 
     'Félicitations à {{nom}} pour {{realisation}} !\n\nContinuez ainsi ! 👏', 
     'info_generale', NULL, true),
    
    ('rappel_paiement', 'Rappel de paiement', 
     'Bonjour,\n\nNous vous rappelons que le paiement de {{montant}} pour {{motif}} est attendu avant le {{date_limite}}.\n\nMerci de votre compréhension.\n\nCordialement,\nService financier', 
     'info_generale', NULL, true)
ON CONFLICT (etablissement_id, code) DO NOTHING;

-- ==================================
-- 5. VÉRIFICATION
-- ==================================

-- Afficher un résumé de la migration
DO $$
DECLARE
    v_count_conversations INT;
    v_count_messages INT;
    v_count_templates INT;
BEGIN
    SELECT COUNT(*) INTO v_count_conversations FROM conversations;
    SELECT COUNT(*) INTO v_count_messages FROM messages;
    SELECT COUNT(*) INTO v_count_templates FROM templates_message;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 043: Messagerie Complète';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Conversations: %', v_count_conversations;
    RAISE NOTICE 'Messages: %', v_count_messages;
    RAISE NOTICE 'Templates créés: %', v_count_templates;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration terminée avec succès !';
END $$;
