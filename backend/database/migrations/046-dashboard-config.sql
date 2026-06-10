-- ==================================
-- eLISAschool - Migration configuration dashboard personnalisable
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-02-09
-- ==================================

-- ==================================
-- ÉTAPE 1 : Création de la table
-- ==================================

CREATE TABLE IF NOT EXISTS dashboard_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID NOT NULL UNIQUE,
    layout JSONB DEFAULT '[]',
    widgets_actifs JSONB DEFAULT '[]',
    widgets_masques JSONB DEFAULT '[]',
    widget_config JSONB DEFAULT '{}',
    theme_dashboard VARCHAR(50) DEFAULT 'default',
    nombre_colonnes INT DEFAULT 3,
    taille_cartes VARCHAR(20) DEFAULT 'medium' CHECK (taille_cartes IN ('small', 'medium', 'large')),
    tri_par_defaut VARCHAR(30) DEFAULT 'personnalise' CHECK (tri_par_defaut IN ('alphabetique', 'personnalise', 'frequent')),
    afficher_stats_rapides BOOLEAN DEFAULT true,
    afficher_notifications_recents BOOLEAN DEFAULT true,
    nombre_notifications INT DEFAULT 5,
    refresh_interval INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_dashboard_config_utilisateur ON dashboard_config(utilisateur_id);

-- ==================================
-- ÉTAPE 2 : Vérification
-- ==================================

SELECT 'Table dashboard_config créée avec succès' AS status;

-- ==================================
-- FIN MIGRATION
-- ==================================
