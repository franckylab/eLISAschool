/**
 * ==================================
 * eLISAschool - Migration Suppression utilisateurs.etablissementId
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Objectif : Supprimer la colonne redondante utilisateurs.etablissementId
 * et migrer toutes les données vers utilisateur_etablissements
 * 
 * Contexte :
 * - utilisateurs.etablissementId : héritage mono-établissement (OBSOLÈTE)
 * - utilisateur_etablissements : modèle multi-établissements (ACTUEL)
 */

-- ============================================================
-- ÉTAPE 1 : Migrer les données existantes vers utilisateur_etablissements
-- ============================================================

-- 1.1 Créer les affectations pour les utilisateurs qui ont etablissementId
-- mais PAS encore d'entrée dans utilisateur_etablissements
INSERT INTO utilisateur_etablissements (
    id,
    "utilisateurId",
    "etablissementId",
    role,
    "etablissementPrincipal",
    actif,
    "dateDebut",
    "dateFin",
    motif,
    "creePar",
    "creeAt",
    "majAt"
)
SELECT 
    gen_random_uuid(),
    u.id,
    u."etablissementId",
    u.role,
    true,  -- etablissementPrincipal = true
    true,  -- actif = true
    u."createdAt",
    NULL,  -- dateFin = NULL (toujours actif)
    'Migration automatique depuis utilisateurs.etablissementId',
    NULL,  -- creePar
    NOW(),
    NOW()
FROM utilisateurs u
WHERE 
    u."etablissementId" IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 
        FROM utilisateur_etablissements ue 
        WHERE ue."utilisateurId" = u.id 
        AND ue."etablissementId" = u."etablissementId"
    );

-- 1.2 S'assurer que chaque utilisateur a AU MOINS une affectation
-- (même ceux sans etablissementId mais avec un rôle)
INSERT INTO utilisateur_etablissements (
    id,
    "utilisateurId",
    "etablissementId",
    role,
    "etablissementPrincipal",
    actif,
    "dateDebut",
    "dateFin",
    motif,
    "creePar",
    "creeAt",
    "majAt"
)
SELECT 
    gen_random_uuid(),
    u.id,
    -- Pour les SUPER_ADMIN sans établissement, on met NULL temporairement
    -- Ils devront être assignés manuellement plus tard
    NULL,
    u.role,
    true,
    true,
    u."createdAt",
    NULL,
    'Création automatique - utilisateur sans affectation',
    NULL,
    NOW(),
    NOW()
FROM utilisateurs u
WHERE NOT EXISTS (
    SELECT 1 
    FROM utilisateur_etablissements ue 
    WHERE ue."utilisateurId" = u.id
)
AND u.role IN ('SUPER_ADMIN', 'ADMIN');

-- ============================================================
-- ÉTAPE 2 : Validation avant suppression
-- ============================================================

-- Vérifier que TOUS les utilisateurs actifs ont au moins une affectation
DO $$
DECLARE
    count_orphelins INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_orphelins
    FROM utilisateurs u
    WHERE u.statut = 'ACTIF'
    AND NOT EXISTS (
        SELECT 1 
        FROM utilisateur_etablissements ue 
        WHERE ue."utilisateurId" = u.id 
        AND ue.actif = true
    );
    
    IF count_orphelins > 0 THEN
        RAISE EXCEPTION 'ATTENTION: % utilisateurs actifs sans affectation établissement. Migration annulée.', count_orphelins;
    END IF;
    
    RAISE NOTICE '✅ Tous les utilisateurs actifs ont au moins une affectation';
END $$;

-- ============================================================
-- ÉTAPE 3 : Supprimer les index sur utilisateurs.etablissementId
-- ============================================================

-- Supprimer l'index s'il existe
DROP INDEX IF EXISTS "IDX_utilisateurs_etablissementId";

-- ============================================================
-- ÉTAPE 4 : Supprimer la contrainte de clé étrangère
-- ============================================================

-- Supprimer la FK vers etablissements
ALTER TABLE utilisateurs 
DROP CONSTRAINT IF EXISTS "FK_utilisateurs_etablissementId";

-- ============================================================
-- ÉTAPE 5 : Supprimer la colonne utilisateurs.etablissementId
-- ============================================================

ALTER TABLE utilisateurs 
DROP COLUMN IF EXISTS "etablissementId";

-- ============================================================
-- ÉTAPE 6 : Mise à jour du champ maxEtablissementsPersonnel
-- ============================================================

-- SUPER_ADMIN : illimité (0)
UPDATE utilisateurs 
SET "maxEtablissementsPersonnel" = 0 
WHERE role = 'SUPER_ADMIN';

-- ADMIN, CHEF_ETABLISSEMENT : 10 établissements max
UPDATE utilisateurs 
SET "maxEtablissementsPersonnel" = 10 
WHERE role IN ('ADMIN', 'CHEF_ETABLISSEMENT');

-- ENSEIGNANT, PERSONNEL : 5 établissements max
UPDATE utilisateurs 
SET "maxEtablissementsPersonnel" = 5 
WHERE role IN ('ENSEIGNANT', 'PERSONNEL');

-- PARENT : 10 établissements max
UPDATE utilisateurs 
SET "maxEtablissementsPersonnel" = 10 
WHERE role = 'PARENT';

-- ELEVE : 1 établissement (mono)
UPDATE utilisateurs 
SET "maxEtablissementsPersonnel" = 1 
WHERE role = 'ELEVE';

-- ============================================================
-- ÉTAPE 7 : Logging de la migration
-- ============================================================

DO $$
DECLARE
    count_migrated INTEGER;
    count_total_ue INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_migrated
    FROM utilisateur_etablissements ue
    WHERE ue.motif = 'Migration automatique depuis utilisateurs.etablissementId';
    
    SELECT COUNT(*) INTO count_total_ue
    FROM utilisateur_etablissements;
    
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ Migration terminée avec succès';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '📊 Statistiques:';
    RAISE NOTICE '   - Affectations créées par migration: %', count_migrated;
    RAISE NOTICE '   - Total affectations dans utilisateur_etablissements: %', count_total_ue;
    RAISE NOTICE '   - Colonne utilisateurs.etablissementId: SUPPRIMÉE';
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- ÉTAPE 8 : Index de performance sur utilisateur_etablissements
-- ============================================================

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_ue_user_etablissement_actif 
ON utilisateur_etablissements("utilisateurId", "etablissementId", actif);

-- Index pour la recherche par établissement
CREATE INDEX IF NOT EXISTS idx_ue_etablissement_principal 
ON utilisateur_etablissements("etablissementId", "etablissementPrincipal", actif) 
WHERE actif = true;

-- Index pour la recherche d'établissement principal
CREATE INDEX IF NOT EXISTS idx_ue_user_principal 
ON utilisateur_etablissements("utilisateurId", "etablissementPrincipal") 
WHERE "etablissementPrincipal" = true AND actif = true;
