-- ==================================
-- eLISAschool - Migration Sondages Récurrents
-- ==================================
-- Version: 1.1.0
-- Auteur: xAI Éducation
-- Description: Ajout du support des sondages récurrents

-- Ajouter les colonnes pour la récurrence
ALTER TABLE sondages
ADD COLUMN IF NOT EXISTS est_recurrent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS frequence_recurrent VARCHAR(20), -- 'quotidien', 'hebdomadaire', 'mensuel'
ADD COLUMN IF NOT EXISTS jour_recurrent INTEGER, -- Jour de la semaine (0-6) ou du mois (1-31)
ADD COLUMN IF NOT EXISTS heure_recurrent TIME, -- Heure d'envoi
ADD COLUMN IF NOT EXISTS date_fin_recurrent TIMESTAMP, -- Date de fin de la récurrence
ADD COLUMN IF NOT EXISTS sondage_parent_id UUID REFERENCES sondages(id) ON DELETE SET NULL;

-- Index pour les sondages récurrents
CREATE INDEX IF NOT EXISTS idx_sondages_recurrent ON sondages(est_recurrent) WHERE est_recurrent = true;
CREATE INDEX IF NOT EXISTS idx_sondages_parent ON sondages(sondage_parent_id);

-- Ajouter un paramètre système
INSERT INTO parametres_systeme (cle, valeur, type, categorie, description, est_public, created_at)
VALUES
    ('sondages.max_recurrents', '10', 'number', 'sondages', 'Nombre maximum de sondages récurrents par établissement', true, CURRENT_TIMESTAMP)
ON CONFLICT (cle) DO NOTHING;
