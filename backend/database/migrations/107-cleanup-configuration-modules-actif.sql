-- ============================================
-- Migration 107: Cleanup des colonnes inutilisées
-- Phase 5 du refactor d'activation des modules
-- ============================================
--
-- Changements:
-- 1. Supprime la colonne `actif` de `configuration_modules`
--    (l'état actif est désormais exclusivement dans `parametres_systeme`)
-- 2. Supprime la table `configuration_app` (dépréciée depuis v2.0)
--    (toutes les données ont été migrées vers `parametres_systeme`)
-- 3. Seed des paramètres modules.{nom}.actif pour tous les modules du MODULE_REGISTRY
-- ============================================

BEGIN;

-- ============ 1. Seed des paramètres modules.{name}.actif ============
-- Créer les paramètres d'activation pour chaque module du registre
-- (ne fait rien si le paramètre existe déjà)

-- Insertion des paramètres d'activation des modules dans parametres_systeme
-- Ces paramètres sont créés avec la valeur defaultActive du registre
INSERT INTO parametres_systeme (cle, valeur, valeur_defaut, type_valeur, categorie, module, description, modifiable_runtime, visible, ordre, cree_at, maj_at)
SELECT 
    CONCAT('modules.', m.module_nom, '.actif'),
    CASE WHEN m.actif THEN 'true' ELSE 'false' END,
    CASE WHEN m.actif THEN 'true' ELSE 'false' END,
    'BOOLEAN',
    'MODULE',
    m.module_nom,
    CONCAT('Activation du module ', m.module_nom),
    true,
    true,
    0,
    NOW(),
    NOW()
FROM (
    VALUES 
        ('auth', true),
        ('utilisateurs', true),
        ('configuration', true),
        ('notifications', true),
        ('messagerie', true),
        ('requetes', true),
        ('sondages', true),
        ('annonces', true),
        ('notes', true),
        ('bulletins', false),
        ('periodes', true),
        ('emploi-du-temps', false),
        ('eleves', true),
        ('orientation', false),
        ('responsables-eleves', true),
        ('programmes', true),
        ('cantine', true),
        ('transport', true),
        ('parking', false),
        ('materiel', false),
        ('finances', false),
        ('clubs', false),
        ('gamification', false),
        ('cartes', true),
        ('documents', false),
        ('impressions', false),
        ('suivi-eleves', true),
        ('suivi-personnel', true),
        ('sante', false),
        ('scoring', false),
        ('monitoring', false),
        ('peripheriques', false),
        ('organisation', true),
        ('recrutement', false),
        ('dashboard', true),
        ('salles', true),
        ('options', true),
        ('personnel', true)
) AS m(module_nom, actif)
WHERE NOT EXISTS (
    SELECT 1 FROM parametres_systeme p 
    WHERE p.cle = CONCAT('modules.', m.module_nom, '.actif') 
    AND p.etablissement_id IS NULL
);

-- ============ 2. Supprimer la colonne `actif` de configuration_modules ============

-- Vérifier que les données sont bien dans parametres_systeme avant de dropper
DO $$
DECLARE
    modules_count INTEGER;
    params_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO modules_count FROM configuration_modules;
    SELECT COUNT(*) INTO params_count FROM parametres_systeme WHERE cle LIKE 'modules.%.actif' AND etablissement_id IS NULL;
    
    IF params_count >= modules_count THEN
        ALTER TABLE configuration_modules DROP COLUMN actif;
        RAISE NOTICE '✅ Colonne actif supprimée de configuration_modules';
    ELSE
        RAISE WARNING '⚠️  Seulement % params pour % modules - seed non complet, colonne conservée', params_count, modules_count;
    END IF;
END $$;

-- ============ 3. Supprimer la table configuration_app ============

-- Sauvegarder les données dans une table backup avant drop
CREATE TABLE IF NOT EXISTS configuration_app_backup_2026 AS SELECT * FROM configuration_app;

DROP TABLE IF EXISTS configuration_app;

-- ============ 4. Index pour performance ============

-- Index sur parametres_systeme pour les requêtes d'activation module
CREATE INDEX IF NOT EXISTS idx_parametres_systeme_modules_actif 
    ON parametres_systeme (cle, etablissement_id) 
    WHERE cle LIKE 'modules.%.actif';

COMMIT;
