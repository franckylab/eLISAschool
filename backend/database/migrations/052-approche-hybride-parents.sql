/**
 * ==================================
 * eLISAschool - Migration: Approche hybride parents-élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-10
 * 
 * Description: Migration pour supporter l'approche hybride de gestion des parents.
 * Ajoute commentaires de dépréciation et optimise les index.
 */

-- ==================================
-- COMMENTAIRES DE DÉPRÉCIATION
-- ==================================

-- Ajouter des commentaires sur les champs dépréciés dans eleves
COMMENT ON COLUMN eleves."nomPere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."professionPere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."telephonePere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."emailPere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."adressePere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';

COMMENT ON COLUMN eleves."nomMere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."professionMere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."telephoneMere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."emailMere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."adresseMere" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';

COMMENT ON COLUMN eleves."nomTuteur" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."lienParenteTuteur" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."professionTuteur" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."telephoneTuteur" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."emailTuteur" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';
COMMENT ON COLUMN eleves."adresseTuteur" IS '@deprecated Utiliser ResponsableEleve. Sera supprimé en v3.0';

-- ==================================
-- INDEX OPTIMISÉS POUR RECHERCHE PARENTS
-- ==================================

-- Index pour recherche rapide par email (utile pour trouver parents existants)
CREATE INDEX IF NOT EXISTS idx_eleves_email_pere ON eleves("emailPere") WHERE "emailPere" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eleves_email_mere ON eleves("emailMere") WHERE "emailMere" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eleves_email_tuteur ON eleves("emailTuteur") WHERE "emailTuteur" IS NOT NULL;

-- Index pour recherche par téléphone
CREATE INDEX IF NOT EXISTS idx_eleves_telephone_pere ON eleves("telephonePere") WHERE "telephonePere" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eleves_telephone_mere ON eleves("telephoneMere") WHERE "telephoneMere" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eleves_telephone_tuteur ON eleves("telephoneTuteur") WHERE "telephoneTuteur" IS NOT NULL;

-- ==================================
-- INDEX POUR RESPONSABLES_ELEVES
-- ==================================

-- Index existants vérifiés (déjà dans l'entity):
-- - idx_ ResponsablesEleve_enfantId_utilisateurId (unique)
-- - idx_ ResponsablesEleve_enfantId
-- - idx_ ResponsablesEleve_utilisateurId

-- Index supplémentaire pour requêtes de migration
CREATE INDEX IF NOT EXISTS idx_responsables_eleves_actif ON responsables_eleves(actif) WHERE actif = true;
CREATE INDEX IF NOT EXISTS idx_responsables_eleves_lien_parente ON responsables_eleves("lienParente");

-- ==================================
-- VUE POUR SUIVI DE MIGRATION
-- ==================================

-- Vue pour identifier les préinscriptions non migrées
CREATE OR REPLACE VIEW v_preinscriptions_non_migrees AS
SELECT 
    e.id,
    e.matricule,
    e.nom,
    e.prenom,
    e."estPreinscription",
    e."createdAt",
    e."utilisateurId",
    -- Compter les parents dans ResponsableEleve
    (SELECT COUNT(*) 
     FROM responsables_eleves re 
     WHERE re."enfantId" = e."utilisateurId" 
     AND re.actif = true) as nombre_responsables,
    -- Vérifier si des champs directs existent
    CASE 
        WHEN e."nomPere" IS NOT NULL OR e."nomMere" IS NOT NULL OR e."nomTuteur" IS NOT NULL 
        THEN true 
        ELSE false 
    END as a_champs_directs
FROM eleves e
WHERE e."estPreinscription" = false  -- Déjà converti
  AND e."utilisateurId" IS NOT NULL  -- A un utilisateur
ORDER BY e."createdAt" DESC;

-- Vue pour statistiques de migration
CREATE OR REPLACE VIEW v_stats_migration_parents AS
SELECT 
    COUNT(*) as total_eleves,
    COUNT(CASE WHEN "estPreinscription" = true THEN 1 END) as preinscriptions,
    COUNT(CASE WHEN "estPreinscription" = false THEN 1 END) as inscriptions,
    COUNT(CASE WHEN "estPreinscription" = false AND "utilisateurId" IS NOT NULL THEN 1 END) as avec_utilisateur,
    COUNT(CASE WHEN "nomPere" IS NOT NULL OR "nomMere" IS NOT NULL THEN 1 END) as avec_champs_directs,
    (SELECT COUNT(DISTINCT re."enfantId") 
     FROM responsables_eleves re 
     WHERE re.actif = true) as avec_responsables
FROM eleves;

-- ==================================
-- FONCTION D'AIDE À LA MIGRATION
-- ==================================

-- Fonction pour identifier les élèves à migrer
CREATE OR REPLACE FUNCTION fn_eleves_a_migrer()
RETURNS TABLE(
    eleve_id UUID,
    matricule VARCHAR,
    nom VARCHAR,
    prenom VARCHAR,
    a_pere BOOLEAN,
    a_mere BOOLEAN,
    a_tuteur BOOLEAN,
    nombre_responsables BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.matricule,
        e.nom,
        e.prenom,
        e."nomPere" IS NOT NULL as a_pere,
        e."nomMere" IS NOT NULL as a_mere,
        e."nomTuteur" IS NOT NULL as a_tuteur,
        (SELECT COUNT(*) 
         FROM responsables_eleves re 
         WHERE re."enfantId" = e."utilisateurId" 
         AND re.actif = true) as nombre_responsables
    FROM eleves e
    WHERE e."estPreinscription" = false
      AND e."utilisateurId" IS NOT NULL
      AND (e."nomPere" IS NOT NULL OR e."nomMere" IS NOT NULL OR e."nomTuteur" IS NOT NULL)
    ORDER BY e."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- DOCUMENTATION
-- ==================================

-- Cette migration supporte l'approche hybride :
-- 1. Champs directs dans Eleve (pour préinscriptions) - DÉPRÉCIÉS
-- 2. Table ResponsableEleve (pour inscriptions) - SOURCE DE VÉRITÉ
--
-- Processus de migration automatique :
-- - Lors de convertirPreinscriptionEnInscription()
-- - Appelle parentsService.migrerDepuisChampsDirects()
-- - Crée comptes Utilisateur pour parents
-- - Crée liens ResponsableEleve
--
-- Pour vérifier l'état de migration :
-- SELECT * FROM v_stats_migration_parents;
-- SELECT * FROM fn_eleves_a_migrer();

-- ==================================
-- RÔLES ET PERMISSIONS
-- ==================================

-- Vérifier que le rôle PARENT existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE code = 'PARENT') THEN
        INSERT INTO roles (code, nom, description, "createdAt", "updatedAt")
        VALUES ('PARENT', 'Parent', 'Parent ou tuteur d''élève', NOW(), NOW());
    END IF;
END $$;

-- Permission pour consultation (par défaut pour PARENT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'parents:consulter') THEN
        INSERT INTO permissions (code, nom, description, "createdAt", "updatedAt")
        VALUES ('parents:consulter', 'Consulter parents', 'Consulter les informations des parents', NOW(), NOW());
    END IF;
END $$;

-- Permission pour gestion (ADMIN seulement)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'parents:gerer') THEN
        INSERT INTO permissions (code, nom, description, "createdAt", "updatedAt")
        VALUES ('parents:gerer', 'Gérer parents', 'Créer, modifier, supprimer les relations parent-élève', NOW(), NOW());
    END IF;
END $$;
