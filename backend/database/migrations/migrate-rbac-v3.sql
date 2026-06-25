-- ==================================
-- eLISAschool - Migration RBAC v3.0
-- ==================================
-- Migration des données de utilisateur_roles vers utilisateur_etablissements
-- 
-- PRÉREQUIS :
-- 1. Backup de la base de données effectué
-- 2. Code RBAC v3.0 déployé
-- 3. Table utilisateur_roles encore existante
--
-- USAGE :
-- psql -U elisaschool -d elisaschool -f migrate-rbac-v3.sql
--

BEGIN;

-- ÉTAPE 1 : Vérifier si des données existent dans utilisateur_roles
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
    migrated_count INTEGER;
BEGIN
    -- Compter les anciennes données
    SELECT COUNT(*) INTO old_count FROM information_schema.tables 
    WHERE table_name = 'utilisateur_roles';
    
    IF old_count = 0 THEN
        RAISE NOTICE '⏭️  Table utilisateur_roles n''existe pas, migration ignorée';
        COMMIT;
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO old_count FROM utilisateur_roles;
    
    IF old_count = 0 THEN
        RAISE NOTICE '⏭️  Table utilisateur_roles vide, migration ignorée';
        COMMIT;
        RETURN;
    END IF;
    
    RAISE NOTICE '🔄 Migration de % entrées depuis utilisateur_roles...', old_count;
    
    -- ÉTAPE 2 : Migrer les données vers utilisateur_etablissements
    -- Pour chaque entrée dans utilisateur_roles, créer une entrée dans utilisateur_etablissements
    -- en utilisant l'établissement principal de l'utilisateur (ou un établissement par défaut)
    
    INSERT INTO utilisateur_etablissements (
        id,
        utilisateur_id,
        etablissement_id,
        role_id,
        etablissement_principal,
        actif,
        date_debut,
        cree_at,
        maj_at
    )
    SELECT 
        gen_random_uuid(),
        ur.utilisateur_id,
        -- Utiliser l'établissement principal de l'utilisateur
        COALESCE(
            (SELECT e.id 
             FROM utilisateurs u 
             JOIN etablissements e ON u.etablissement_id = e.id 
             WHERE u.id = ur.utilisateur_id 
             LIMIT 1),
            -- Fallback : premier établissement actif
            (SELECT id FROM etablissements WHERE actif = true LIMIT 1)
        ),
        ur.role_id,
        ur.est_principal,
        true,
        ur.date_attribution,
        NOW(),
        NOW()
    FROM utilisateur_roles ur
    WHERE NOT EXISTS (
        -- Éviter les doublons
        SELECT 1 
        FROM utilisateur_etablissements ue 
        WHERE ue.utilisateur_id = ur.utilisateur_id 
          AND ue.role_id = ur.role_id
    )
    ON CONFLICT (utilisateur_id, etablissement_id) DO UPDATE SET
        role_id = EXCLUDED.role_id,
        etablissement_principal = EXCLUDED.etablissement_principal,
        maj_at = NOW();
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ % entrées migrées vers utilisateur_etablissements', migrated_count;
    
    -- ÉTAPE 3 : Vérifier la cohérence
    SELECT COUNT(*) INTO new_count FROM utilisateur_etablissements;
    
    RAISE NOTICE '📊 Total utilisateur_etablissements après migration : %', new_count;
    
    -- ÉTAPE 4 : Vérifier les incohérences
    PERFORM *
    FROM utilisateur_roles ur
    WHERE NOT EXISTS (
        SELECT 1 
        FROM utilisateur_etablissements ue 
        WHERE ue.utilisateur_id = ur.utilisateur_id
    );
    
    IF FOUND THEN
        RAISE WARNING '⚠️  Certaines entrées n''ont pas pu être migrées (vérifier les établissements)';
    END IF;
    
    -- ÉTAPE 5 : Instructions pour suppression de l'ancienne table
    RAISE NOTICE '✅ Migration terminée avec succès';
    RAISE NOTICE '🗑️  Pour supprimer l''ancienne table (APRÈS VÉRIFICATION) :';
    RAISE NOTICE '   DROP TABLE IF EXISTS utilisateur_roles CASCADE;';
    
END $$;

-- ÉTAPE 6 : Ajouter les index manquants (si pas déjà faits par TypeORM)
CREATE INDEX IF NOT EXISTS idx_ue_role_actif 
    ON utilisateur_etablissements(role_id, actif);

CREATE INDEX IF NOT EXISTS idx_ue_user_etablissement_actif 
    ON utilisateur_etablissements(utilisateur_id, etablissement_id, actif);

-- ÉTAPE 7 : Analyser les tables pour optimiser les plans de requête
ANALYZE utilisateur_etablissements;
ANALYZE roles;
ANALYZE permissions;
ANALYZE role_permissions;

COMMIT;

-- ==================================
-- VÉRIFICATIONS POST-MIGRATION
-- ==================================

-- Vérifier le nombre d'entrées
SELECT 
    'utilisateur_etablissements' as table_name,
    COUNT(*) as total,
    COUNT(DISTINCT utilisateur_id) as utilisateurs_uniques,
    COUNT(DISTINCT etablissement_id) as etablissements_uniques,
    COUNT(DISTINCT role_id) as roles_uniques
FROM utilisateur_etablissements;

-- Vérifier la répartition par rôle
SELECT 
    r.code as role_code,
    r.libelle as role_libelle,
    COUNT(ue.id) as nombre_utilisateurs
FROM utilisateur_etablissements ue
JOIN roles r ON ue.role_id = r.id
WHERE ue.actif = true
GROUP BY r.code, r.libelle
ORDER BY nombre_utilisateurs DESC;

-- Vérifier les utilisateurs sans établissement
SELECT 
    u.id,
    u.email,
    u.role as role_principal
FROM utilisateurs u
WHERE u.actif = true
  AND NOT EXISTS (
      SELECT 1 
      FROM utilisateur_etablissements ue 
      WHERE ue.utilisateur_id = u.id 
        AND ue.actif = true
  );

-- Vérifier les SUPER_ADMIN multi-établissements
SELECT 
    u.email,
    COUNT(ue.etablissement_id) as nombre_etablissements,
    array_agg(e.nom) as etablissements
FROM utilisateur_etablissements ue
JOIN utilisateurs u ON ue.utilisateur_id = u.id
JOIN roles r ON ue.role_id = r.id
JOIN etablissements e ON ue.etablissement_id = e.id
WHERE r.code = 'SUPER_ADMIN'
  AND ue.actif = true
GROUP BY u.id, u.email
HAVING COUNT(ue.etablissement_id) > 1;
