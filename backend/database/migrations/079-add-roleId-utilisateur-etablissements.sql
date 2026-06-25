/**
 * ==================================
 * eLISAschool - Migration Ajout roleId à utilisateur_etablissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Objectif : Ajouter la colonne roleId (UUID) avec relation vers la table roles
 * pour remplacer la colonne role (texte) existante.
 * 
 * Contexte :
 * - L'entité TypeORM UtilisateurEtablissement attend une relation ManyToOne vers Role
 * - La table actuelle a une colonne 'role' de type texte
 * - Cette migration crée 'roleId' et migre les données
 */

-- ============================================================
-- ÉTAPE 1 : Ajouter la colonne roleId
-- ============================================================

ALTER TABLE utilisateur_etablissements
ADD COLUMN IF NOT EXISTS "roleId" UUID;

-- ============================================================
-- ÉTAPE 2 : Migrer les données de role (texte) vers roleId (UUID)
-- ============================================================

-- Mettre à jour roleId en faisant la correspondance avec la table roles
UPDATE utilisateur_etablissements ue
SET "roleId" = r.id
FROM roles r
WHERE r.code = ue.role
AND ue.role IS NOT NULL
AND ue."roleId" IS NULL;

-- Pour les entrées où role est NULL ou ne correspond pas, utiliser le rôle ADMIN par défaut
UPDATE utilisateur_etablissements ue
SET "roleId" = (
    SELECT id FROM roles WHERE code = 'ADMIN' LIMIT 1
)
WHERE ue."roleId" IS NULL;

-- ============================================================
-- ÉTAPE 3 : Ajouter la contrainte de clé étrangère
-- ============================================================

ALTER TABLE utilisateur_etablissements
ADD CONSTRAINT "FK_utilisateur_etablissements_roleId"
FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE;

-- ============================================================
-- ÉTAPE 4 : Rendre la colonne NOT NULL
-- ============================================================

ALTER TABLE utilisateur_etablissements
ALTER COLUMN "roleId" SET NOT NULL;

-- ============================================================
-- ÉTAPE 5 : Créer un index pour les performances
-- ============================================================

CREATE INDEX IF NOT EXISTS "IDX_utilisateur_etablissements_roleId"
ON utilisateur_etablissements("roleId");

-- ============================================================
-- ÉTAPE 6 : Vérification
-- ============================================================

DO $$
DECLARE
    count_sans_role INTEGER;
    count_avec_role INTEGER;
BEGIN
    -- Vérifier qu'il n'y a plus de roleId NULL
    SELECT COUNT(*) INTO count_sans_role
    FROM utilisateur_etablissements
    WHERE "roleId" IS NULL;
    
    SELECT COUNT(*) INTO count_avec_role
    FROM utilisateur_etablissements
    WHERE "roleId" IS NOT NULL;
    
    IF count_sans_role > 0 THEN
        RAISE WARNING '⚠️  % affectations sans roleId', count_sans_role;
    END IF;
    
    RAISE NOTICE '✅ Migration roleId terminée: % affectations avec roleId', count_avec_role;
END $$;
