-- ==================================
-- eLISAschool - Migration 040: Reset Capabilities
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Ajout des capacités de réinitialisation globale :
-- 1. Colonne valeurDefaut pour ConfigurationApp
-- 2. Colonne valeurDefaut pour ConfigurationModule
-- 3. Vue pour vérifier l'état des paramètres
-- ==================================

-- ============================================
-- 1. Ajouter colonne valeurDefaut à configuration_app
-- ============================================
ALTER TABLE configuration_app 
ADD COLUMN IF NOT EXISTS valeurDefaut JSONB;

COMMENT ON COLUMN configuration_app.valeurDefaut IS 
'Valeurs par défaut pour restauration de la configuration application';

-- ============================================
-- 2. Ajouter colonne valeurDefaut à configuration_modules
-- ============================================
ALTER TABLE configuration_modules 
ADD COLUMN IF NOT EXISTS valeurDefaut JSONB;

COMMENT ON COLUMN configuration_modules.valeurDefaut IS 
'Valeurs par défaut pour restauration de la configuration module';

-- ============================================
-- 3. Index pour améliorer les performances de reset
-- ============================================
CREATE INDEX IF NOT EXISTS idx_parametres_valeurDefaut 
ON parametres_systeme (valeurDefaut) 
WHERE valeurDefaut IS NOT NULL;

-- ============================================
-- 4. Vue pour vérifier l'état des paramètres
-- ============================================
CREATE OR REPLACE VIEW v_parametres_statut AS
SELECT 
    cle,
    valeur,
    valeurDefaut,
    typeValeur,
    categorie,
    module,
    etablissementId,
    CASE 
        WHEN valeurDefaut IS NULL THEN 'PAS_DE_DEFAUT'
        WHEN valeur = valeurDefaut THEN 'CONFORME'
        ELSE 'MODIFIE'
    END as statut,
    createdAt,
    updatedAt
FROM parametres_systeme
ORDER BY 
    CASE WHEN etablissementId IS NULL THEN 0 ELSE 1 END,
    categorie,
    ordre,
    cle;

COMMENT ON VIEW v_parametres_statut IS 
'Vue pour vérifier l''état des paramètres (conforme vs modifié)';

-- ============================================
-- 5. Fonction de réinitialisation SQL (optionnelle)
-- ============================================
CREATE OR REPLACE FUNCTION reset_parametres_globaux()
RETURNS TABLE(
    parametre_cle VARCHAR,
    ancienne_valeur TEXT,
    nouvelle_valeur TEXT,
    statut VARCHAR
) AS $$
DECLARE
    param_record RECORD;
    reset_count INTEGER := 0;
BEGIN
    FOR param_record IN 
        SELECT * FROM parametres_systeme 
        WHERE etablissementId IS NULL 
          AND valeurDefaut IS NOT NULL 
          AND valeur != valeurDefaut
    LOOP
        -- Sauvegarder l'ancienne valeur
        param_record ancienne_valeur := param_record.valeur;
        
        -- Réinitialiser
        UPDATE parametres_systeme 
        SET valeur = param_record.valeurDefaut,
            updatedAt = NOW()
        WHERE id = param_record.id;
        
        -- Retourner le résultat
        parametre_cle := param_record.cle;
        ancienne_valeur := param_record.valeur;
        nouvelle_valeur := param_record.valeurDefaut;
        statut := 'RESET';
        
        RETURN NEXT;
        reset_count := reset_count + 1;
    END LOOP;
    
    RAISE NOTICE 'parametres réinitialisés: %', reset_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_parametres_globaux IS 
'Fonction SQL pour réinitialiser tous les paramètres globaux vers leurs valeurs par défaut';

-- ============================================
-- 6. Fonction pour supprimer les overrides d'un établissement
-- ============================================
CREATE OR REPLACE FUNCTION reset_overrides_etablissement(p_etablissementId UUID)
RETURNS INTEGER AS $$
DECLARE
    override_count INTEGER;
BEGIN
    -- Compter les overrides
    SELECT COUNT(*) INTO override_count
    FROM parametres_systeme
    WHERE etablissementId = p_etablissementId;
    
    -- Supprimer les overrides
    DELETE FROM parametres_systeme
    WHERE etablissementId = p_etablissementId;
    
    RAISE NOTICE 'overrides supprimés pour établissement %: %', p_etablissementId, override_count;
    
    RETURN override_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_overrides_etablissement IS 
'Fonction SQL pour supprimer tous les overrides d''un établissement';

-- ============================================
-- 7. Vérification post-migration
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 040 appliquée avec succès';
    RAISE NOTICE 'Colonnes ajoutées:';
    RAISE NOTICE '  - configuration_app.valeurDefaut';
    RAISE NOTICE '  - configuration_modules.valeurDefaut';
    RAISE NOTICE 'Fonctions créées:';
    RAISE NOTICE '  - reset_parametres_globaux()';
    RAISE NOTICE '  - reset_overrides_etablissement(UUID)';
    RAISE NOTICE 'Vue créée:';
    RAISE NOTICE '  - v_parametres_statut';
END $$;
