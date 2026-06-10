/**
 * ==================================
 * eLISAschool - Migration 050: Améliorations Inscription et Relances
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Cette migration ajoute:
 * - Configuration préinscriptions par établissement
 * - Statut de paiement et suivi insolvabilité élèves
 * - Champs supplémentaires pour relances (pdfPath, coutRelance, estLue)
 * - Index composés pour optimisation des performances
 */

-- ==================================
-- 1. Configuration Etablissement - Préinscriptions
-- ==================================

ALTER TABLE etablissement_config 
  ADD COLUMN IF NOT EXISTS accepte_preinscriptions BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_preinscriptions_par_jour INTEGER;

COMMENT ON COLUMN etablissement_config.accepte_preinscriptions IS 'Indique si cet établissement accepte les préinscriptions en ligne';
COMMENT ON COLUMN etablissement_config.max_preinscriptions_par_jour IS 'Nombre maximum de préinscriptions acceptées par jour (null = illimité)';

-- ==================================
-- 2. Élèves - Statut Paiement et Suivi Insolvabilité
-- ==================================

ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(30) DEFAULT 'REGULIER',
  ADD COLUMN IF NOT EXISTS nombre_relances_envoyees INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS date_dernier_paiement DATE,
  ADD COLUMN IF NOT EXISTS date_marquage_insolvable TIMESTAMP;

COMMENT ON COLUMN eleves.statut_paiement IS 'Statut de paiement: REGULIER, EN_RETARD, INSOLVABLE, CONTENTIEUX';
COMMENT ON COLUMN eleves.nombre_relances_envoyees IS 'Nombre total de relances envoyées pour cet élève';
COMMENT ON COLUMN eleves.date_dernier_paiement IS 'Date du dernier paiement effectué';
COMMENT ON COLUMN eleves.date_marquage_insolvable IS 'Date de marquage comme insolvable';

-- ==================================
-- 3. Relances Paiement - Champs Additionnels
-- ==================================

ALTER TABLE relances_paiement
  ADD COLUMN IF NOT EXISTS pdf_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS cout_relance DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS est_lue BOOLEAN DEFAULT false;

COMMENT ON COLUMN relances_paiement.pdf_path IS 'Chemin vers le document PDF de rappel généré';
COMMENT ON COLUMN relances_paiement.cout_relance IS 'Coût de la relance (SMS, postage, etc.)';
COMMENT ON COLUMN relances_paiement.est_lue IS 'Indique si la relance a été lue par le destinataire';

-- ==================================
-- 4. Index Composés - Optimisation Performances
-- ==================================

-- Index sur statut de paiement pour filtrage rapide des insolvables
CREATE INDEX IF NOT EXISTS idx_eleve_statut_paiement 
    ON eleves(statut_paiement);

-- Index sur date de relance pour détection relances récentes
CREATE INDEX IF NOT EXISTS idx_relance_date 
    ON relances_paiement(date_relance);

-- Index composé sur relances par échéancier et date
CREATE INDEX IF NOT EXISTS idx_relance_echeancier_date 
    ON relances_paiement(echeancier_id, date_relance);

-- Index composé sur échéanciers impayés
CREATE INDEX IF NOT EXISTS idx_echeancier_impayes 
    ON echeanciers_paiement(etablissement_id, statut, date_echeance)
    WHERE statut != 'PAYE';

-- Index composé sur élèves par établissement et statut
CREATE INDEX IF NOT EXISTS idx_eleve_etablissement_statut 
    ON eleves(etablissement_id, statut, est_preinscription);

-- ==================================
-- 5. Paramètres de Configuration Relances
-- ==================================

-- Insérer les paramètres de configuration des relances (valeurs par défaut)
INSERT INTO configuration_app (cle, valeur, type, categorie, description, est_public, created_at, updated_at)
VALUES 
    ('relance.max_nombre', '5', 'number', 'FINANCES', 'Nombre maximum de relances avant marquage insolvable', true, NOW(), NOW()),
    ('relance.intervalle_jours', '7', 'number', 'FINANCES', 'Nombre de jours entre deux relances', true, NOW(), NOW()),
    ('relance.insolvable_seuil', '5', 'number', 'FINANCES', 'Seuil de relances pour marquage insolvable', true, NOW(), NOW()),
    ('relance.insolvable_delai_jours', '60', 'number', 'FINANCES', 'Délai en jours avant marquage insolvable automatique', true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- ==================================
-- 6. Vérification
-- ==================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 050 appliquée avec succès';
    RAISE NOTICE '- Configuration préinscriptions ajoutée';
    RAISE NOTICE '- Statut paiement élèves ajouté';
    RAISE NOTICE '- Champs relances ajoutés';
    RAISE NOTICE '- Index composés créés';
    RAISE NOTICE '- Paramètres de configuration insérés';
END $$;
