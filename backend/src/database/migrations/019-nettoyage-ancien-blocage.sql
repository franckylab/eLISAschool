-- ==================================
-- eLISAschool - Nettoyage ancien système de blocage
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Supprime les champs obsolètes de l'ancien système de blocage
--              (tentativesConnexion, bloqueJusqua) car remplacés par le 
--              système à deux niveaux (TentativeConnexion)
-- ==================================

-- =====================================================
-- ÉTAPE 1: Supprimer les colonnes obsolètes de utilisateurs
-- =====================================================

-- Supprimer la colonne tentativesConnexion
ALTER TABLE utilisateurs 
DROP COLUMN IF EXISTS "tentativesConnexion";

-- Supprimer la colonne bloqueJusqua
ALTER TABLE utilisateurs 
DROP COLUMN IF EXISTS "bloqueJusqua";

-- =====================================================
-- ÉTAPE 2: Vérifier que la nouvelle table existe
-- =====================================================

DO $$
BEGIN
    -- Vérifier que la table tentatives_connexion existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tentatives_connexion'
    ) THEN
        RAISE EXCEPTION 'La table tentatives_connexion n''existe pas. Exécutez d''abord la migration 018-systeme-blocage-deux-niveaux.sql';
    END IF;
    
    RAISE NOTICE '✅ Table tentatives_connexion vérifiée';
END $$;

-- =====================================================
-- ÉTAPE 3: Supprimer les paramètres système obsolètes
-- =====================================================

-- Supprimer les anciens paramètres de sécurité s'ils existent
DELETE FROM parametres_systeme 
WHERE cle IN (
    'auth.maxLoginAttempts',
    'auth.lockoutDuration',
    'auth.block_duration_minutes',
    'security.login.max_attempts',
    'security.login.block_duration'
);

-- Vérifier que les nouveaux paramètres existent
DO $$
DECLARE
    nb_params INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_params
    FROM parametres_systeme
    WHERE cle IN (
        'auth.max_tentatives_specifique',
        'auth.duree_blocage_specifique',
        'auth.max_tentatives_general',
        'auth.duree_blocage_general'
    );
    
    IF nb_params < 4 THEN
        RAISE WARNING '⚠️  Seulement %/4 paramètres du nouveau système trouvés. Exécutez la migration 018.', nb_params;
    ELSE
        RAISE NOTICE '✅ Paramètres du nouveau système de blocage vérifiés (%/4)', nb_params;
    END IF;
END $$;

-- =====================================================
-- ÉTAPE 4: Nettoyer les données obsolètes
-- =====================================================

-- Optionnel: Archiver les anciens compteurs avant suppression (pour audit)
-- Cette partie est commentée car les champs sont déjà supprimés
-- CREATE TABLE IF NOT EXISTS anciens_blocages_archive AS
-- SELECT id, email, tentativesConnexion, bloqueJusqua
-- FROM utilisateurs
-- WHERE tentativesConnexion > 0 OR bloqueJusqua IS NOT NULL;

-- =====================================================
-- ÉTAPE 5: Commentaires de documentation
-- =====================================================

COMMENT ON COLUMN utilisateurs.derniereConnexion IS 'Date de la dernière connexion réussie';

-- Note: Le blocage est maintenant géré par:
-- - Table: tentatives_connexion
-- - Service: BlocageAuthService
-- - Entity: TentativeConnexion
-- - Voir migration: 018-systeme-blocage-deux-niveaux.sql

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

DO $$
DECLARE
    colonnes_existantes INTEGER;
BEGIN
    -- Vérifier que les colonnes ont bien été supprimées
    SELECT COUNT(*) INTO colonnes_existantes
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'utilisateurs'
    AND column_name IN ('tentativesConnexion', 'bloqueJusqua');
    
    IF colonnes_existantes > 0 THEN
        RAISE EXCEPTION '❌ Échec: % colonnes obsolètes existent encore', colonnes_existantes;
    ELSE
        RAISE NOTICE '✅ Nettoyage terminé avec succès';
        RAISE NOTICE '✅ Ancien système de blocage supprimé';
        RAISE NOTICE '✅ Nouveau système à deux niveaux actif';
    END IF;
END $$;

-- =====================================================
-- ROLLBACK (en cas de problème)
-- =====================================================

-- Pour annuler cette migration:
-- ALTER TABLE utilisateurs ADD COLUMN "tentativesConnexion" INTEGER DEFAULT 0;
-- ALTER TABLE utilisateurs ADD COLUMN "bloqueJusqua" TIMESTAMP;
-- UPDATE utilisateurs SET "tentativesConnexion" = 0;
