/**
 * ==================================
 * eLISAschool - Migration 089: Finalisation Architecture Académique v2
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Objectifs:
 * 1. Ajouter index sur affectationMatiereId dans emploi_du_temps
 * 2. Ajouter index sur classeAnneeId dans bulletins et affectations_eleves
 * 3. Créer table configurations_scoring
 * 4. Ajouter permission notes:modifier_apres_cloture
 * 5. Mettre à jour les attributions de permissions pour ADMIN/SUPER_ADMIN
 */

-- ==========================================
-- 1. INDEX EMPLOI_DU_TEMPS - affectationMatiereId
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_edt_affectation_matiere 
ON emploi_du_temps(affectation_matiere_id);

-- ==========================================
-- 2. INDEX BULLETINS - classeAnneeId
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_bulletins_classe_annee 
ON bulletins(classe_annee_id);

-- ==========================================
-- 3. INDEX AFFECTATIONS_ELEVES - classeAnneeId
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_ae_classe_annee_final 
ON affectations_eleves(classe_annee_id);

-- ==========================================
-- 4. CRÉER TABLE configurations_scoring
-- ==========================================

CREATE TABLE IF NOT EXISTS configurations_scoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    annee_scolaire_id UUID REFERENCES annees_scolaires(id) ON DELETE SET NULL,
    
    -- Méthode de calcul
    methode_calcul VARCHAR(30) DEFAULT 'MOYENNE_PONDEREE',
    systeme_notation VARCHAR(20) DEFAULT 'SUR_20',
    
    -- Configuration des notes
    note_minimale FLOAT DEFAULT 0,
    note_maximale FLOAT DEFAULT 20,
    note_validation FLOAT DEFAULT 10,
    
    -- Coefficients
    utiliser_coefficients BOOLEAN DEFAULT true,
    coefficient_defaut FLOAT DEFAULT 1,
    
    -- Rangs
    calculer_rang BOOLEAN DEFAULT true,
    afficher_rang BOOLEAN DEFAULT true,
    
    -- Mentions
    utiliser_mentions BOOLEAN DEFAULT true,
    configuration_mentions JSONB,
    
    -- Appréciations
    generer_appreciations_auto BOOLEAN DEFAULT true,
    modele_appreciation TEXT,
    
    -- Moyennes de classe
    calculer_moyenne_classe BOOLEAN DEFAULT true,
    afficher_moyenne_classe BOOLEAN DEFAULT true,
    afficher_moyenne_min BOOLEAN DEFAULT true,
    afficher_moyenne_max BOOLEAN DEFAULT true,
    
    -- Paramètres avancés
    arrondir_notes BOOLEAN DEFAULT false,
    precision_decimales INTEGER DEFAULT 2,
    supprimer_note_basse BOOLEAN DEFAULT false,
    nombre_notes_supprimees INTEGER DEFAULT 0,
    
    -- Activation
    actif BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour configurations_scoring
CREATE INDEX IF NOT EXISTS idx_cs_etablissement ON configurations_scoring(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_cs_annee ON configurations_scoring(annee_scolaire_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cs_unique_etab_annee 
ON configurations_scoring(etablissement_id, annee_scolaire_id) 
WHERE annee_scolaire_id IS NOT NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_cs_updated_at ON configurations_scoring;
CREATE TRIGGER trg_cs_updated_at
    BEFORE UPDATE ON configurations_scoring
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. PERMISSION RBAC - notes:modifier_apres_cloture
-- ==========================================

-- Ajouter la permission
INSERT INTO permissions (code, libelle, module, description, est_systeme)
VALUES (
    'notes:modifier_apres_cloture',
    'Modifier les notes après clôture',
    'notes',
    'Permet de modifier les notes même après la clôture de la période',
    true
)
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- 6. ATTRIBUER PERMISSION AUX RÔLES ADMIN
-- ==========================================

-- Récupérer l'ID de la permission
DO $$
DECLARE
    perm_id UUID;
    admin_role_id UUID;
    super_admin_role_id UUID;
BEGIN
    -- Obtenir l'ID de la permission
    SELECT id INTO perm_id 
    FROM permissions 
    WHERE code = 'notes:modifier_apres_cloture';
    
    IF perm_id IS NULL THEN
        RAISE EXCEPTION 'Permission notes:modifier_apres_cloture non trouvée';
    END IF;
    
    -- Attribuer au rôle ADMIN
    SELECT id INTO admin_role_id 
    FROM roles 
    WHERE code = 'ADMIN' AND est_systeme = true;
    
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        RAISE NOTICE 'Permission attribuée au rôle ADMIN';
    END IF;
    
    -- Attribuer au rôle SUPER_ADMIN
    SELECT id INTO super_admin_role_id 
    FROM roles 
    WHERE code = 'SUPER_ADMIN' AND est_systeme = true;
    
    IF super_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (super_admin_role_id, perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        RAISE NOTICE 'Permission attribuée au rôle SUPER_ADMIN';
    END IF;
    
    -- Attribuer au rôle CHEF_ETABLISSEMENT
    DECLARE
        chef_role_id UUID;
    BEGIN
        SELECT id INTO chef_role_id 
        FROM roles 
        WHERE code = 'CHEF_ETABLISSEMENT' AND est_systeme = true;
        
        IF chef_role_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (chef_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
            
            RAISE NOTICE 'Permission attribuée au rôle CHEF_ETABLISSEMENT';
        END IF;
    END;
    
END $$;

-- ==========================================
-- 7. SEED: Configuration Scoring par défaut
-- ==========================================

-- Créer une configuration scoring par défaut pour chaque établissement
INSERT INTO configurations_scoring (
    etablissement_id,
    annee_scolaire_id,
    methode_calcul,
    systeme_notation,
    note_minimale,
    note_maximale,
    note_validation,
    utiliser_coefficients,
    coefficient_defaut,
    calculer_rang,
    afficher_rang,
    utiliser_mentions,
    configuration_mentions,
    generer_appreciations_auto,
    calculer_moyenne_classe,
    afficher_moyenne_classe,
    afficher_moyenne_min,
    afficher_moyenne_max,
    arrondir_notes,
    precision_decimales,
    supprimer_note_basse,
    nombre_notes_supprimees,
    actif
)
SELECT DISTINCT
    e.id AS etablissement_id,
    NULL AS annee_scolaire_id, -- Configuration globale
    'MOYENNE_PONDEREE' AS methode_calcul,
    'SUR_20' AS systeme_notation,
    0 AS note_minimale,
    20 AS note_maximale,
    10 AS note_validation,
    true AS utiliser_coefficients,
    1 AS coefficient_defaut,
    true AS calculer_rang,
    true AS afficher_rang,
    true AS utiliser_mentions,
    '[
        {"mention": "Très Bien", "noteMin": 16, "noteMax": 20, "couleur": "#22c55e"},
        {"mention": "Bien", "noteMin": 14, "noteMax": 16, "couleur": "#3b82f6"},
        {"mention": "Assez Bien", "noteMin": 12, "noteMax": 14, "couleur": "#eab308"},
        {"mention": "Passable", "noteMin": 10, "noteMax": 12, "couleur": "#f97316"},
        {"mention": "Insuffisant", "noteMin": 0, "noteMax": 10, "couleur": "#ef4444"}
    ]'::jsonb AS configuration_mentions,
    true AS generer_appreciations_auto,
    true AS calculer_moyenne_classe,
    true AS afficher_moyenne_classe,
    true AS afficher_moyenne_min,
    true AS afficher_moyenne_max,
    false AS arrondir_notes,
    2 AS precision_decimales,
    false AS supprimer_note_basse,
    0 AS nombre_notes_supprimees,
    true AS actif
FROM etablissements e
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. VÉRIFICATIONS FINALES
-- ==========================================

DO $$
DECLARE
    count_perm INTEGER;
    count_config_scoring INTEGER;
    count_idx_edt INTEGER;
    count_idx_bulletins INTEGER;
    count_idx_ae INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_perm FROM permissions WHERE code = 'notes:modifier_apres_cloture';
    SELECT COUNT(*) INTO count_config_scoring FROM configurations_scoring;
    SELECT COUNT(*) INTO count_idx_edt FROM pg_indexes WHERE indexname = 'idx_edt_affectation_matiere';
    SELECT COUNT(*) INTO count_idx_bulletins FROM pg_indexes WHERE indexname = 'idx_bulletins_classe_annee';
    SELECT COUNT(*) INTO count_idx_ae FROM pg_indexes WHERE indexname = 'idx_ae_classe_annee_final';
    
    RAISE NOTICE '=== Migration 089 - Résumé ===';
    RAISE NOTICE 'Permission notes:modifier_apres_cloture créée: %', count_perm;
    RAISE NOTICE 'configurations_scoring créées: %', count_config_scoring;
    RAISE NOTICE 'Index emploi_du_temps.affectationMatiereId: %', count_idx_edt;
    RAISE NOTICE 'Index bulletins.classeAnneeId: %', count_idx_bulletins;
    RAISE NOTICE 'Index affectations_eleves.classeAnneeId: %', count_idx_ae;
    RAISE NOTICE '=== Migration terminée ===';
END $$;
