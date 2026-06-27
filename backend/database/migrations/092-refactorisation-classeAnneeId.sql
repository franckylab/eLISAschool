/**
 * ==================================
 * eLISAschool - Migration 092: Refactorisation classeAnneeId
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Migration de l'architecture académique vers classeAnneeId comme source unique de vérité temporelle.
 * 
 * ENTITÉS IMPACTÉES:
 * - Bulletin: classeId + anneeScolaireId → classeAnneeId
 * - Note: anneeScolaireId → classeAnneeId
 * - EmploiDuTemps: classeId → classeAnneeId
 * - AffectationMatiere: classeId + anneeScolaireId → classeAnneeId
 * - ConfigurationMatiereClasse: classeId + anneeScolaireId → classeAnneeId
 * - Classe: suppression anneeScolaireId, professeurPrincipalId, effectifMax, effectifActuel
 */

-- ==================================
-- ÉTAPE 1: BACKUP DES DONNÉES
-- ==================================

-- Créer des tables de backup temporaires
CREATE TABLE IF NOT EXISTS backup_bulletins_pre_092 AS TABLE bulletins;
CREATE TABLE IF NOT EXISTS backup_notes_pre_092 AS TABLE notes;
CREATE TABLE IF NOT EXISTS backup_emploi_du_temps_pre_092 AS TABLE emploi_du_temps;
CREATE TABLE IF NOT EXISTS backup_affectations_matieres_pre_092 AS TABLE affectations_matieres;
CREATE TABLE IF NOT EXISTS backup_configurations_matieres_classes_pre_092 AS TABLE configurations_matieres_classes;

DO $$
BEGIN
    RAISE NOTICE '✓ Backup des données créé (5 tables)';
END $$;

-- ==================================
-- ÉTAPE 2: BULLETINS - Ajouter classeAnneeId
-- ==================================

-- 2.1 Ajouter colonne nullable
ALTER TABLE bulletins ADD COLUMN IF NOT EXISTS "classeAnneeId" UUID;

-- 2.2 Peupler avec données existantes
UPDATE bulletins b
SET "classeAnneeId" = ca.id
FROM classes_annees ca
WHERE b."classeId" = ca."classeId"
AND b."anneeScolaireId" = ca."anneeScolaireId";

-- 2.3 Vérification
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM bulletins WHERE "classeAnneeId" IS NULL;
    SELECT COUNT(*) INTO total_count FROM bulletins;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ Bulletins sans classeAnneeId: %/%', null_count, total_count;
    ELSE
        RAISE NOTICE '✓ Bulletins: classeAnneeId peuplé (% lignes)', total_count;
    END IF;
END $$;

-- 2.4 Rendre obligatoire
ALTER TABLE bulletins ALTER COLUMN "classeAnneeId" SET NOT NULL;

-- 2.5 Supprimer anciennes colonnes
ALTER TABLE bulletins DROP COLUMN IF EXISTS "classeId";
ALTER TABLE bulletins DROP COLUMN IF EXISTS "anneeScolaireId";

-- 2.6 Recréer index
DROP INDEX IF EXISTS idx_bulletins_classe;
DROP INDEX IF EXISTS idx_bulletins_annee;
CREATE INDEX IF NOT EXISTS idx_bulletins_classe_annee ON bulletins("classeAnneeId");

DO $$
BEGIN
    RAISE NOTICE '✓ Bulletins migrés vers classeAnneeId';
END $$;

-- ==================================
-- ÉTAPE 3: NOTES - Ajouter classeAnneeId
-- ==================================

-- 3.1 Ajouter colonne nullable
ALTER TABLE notes ADD COLUMN IF NOT EXISTS "classeAnneeId" UUID;

-- 3.2 Peupler via affectations_eleves
UPDATE notes n
SET "classeAnneeId" = ca.id
FROM affectations_eleves ae
JOIN classes_annees ca ON ae."classeId" = ca."classeId" 
    AND ae."anneeScolaireId" = ca."anneeScolaireId"
WHERE n."eleveId" = ae."eleveId"
AND n."anneeScolaireId" = ae."anneeScolaireId"
AND ae.actif = true;

-- 3.3 Vérification
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM notes WHERE "classeAnneeId" IS NULL;
    SELECT COUNT(*) INTO total_count FROM notes;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ Notes sans classeAnneeId: %/%', null_count, total_count;
    ELSE
        RAISE NOTICE '✓ Notes: classeAnneeId peuplé (% lignes)', total_count;
    END IF;
END $$;

-- 3.4 Rendre obligatoire
ALTER TABLE notes ALTER COLUMN "classeAnneeId" SET NOT NULL;

-- 3.5 Supprimer ancienne colonne
ALTER TABLE notes DROP COLUMN IF EXISTS "anneeScolaireId";

-- 3.6 Recréer index
CREATE INDEX IF NOT EXISTS idx_notes_classe_annee ON notes("classeAnneeId");

DO $$
BEGIN
    RAISE NOTICE '✓ Notes migrées vers classeAnneeId';
END $$;

-- ==================================
-- ÉTAPE 4: EMPLOI_DU_TEMPS - Remplacer classeId par classeAnneeId
-- ==================================

-- 4.1 Ajouter colonne nullable
ALTER TABLE emploi_du_temps ADD COLUMN IF NOT EXISTS "classeAnneeId" UUID;

-- 4.2 Peupler via classes (on utilise l'année scolaire par défaut ou la première année active)
UPDATE emploi_du_temps edt
SET "classeAnneeId" = ca.id
FROM classes c
JOIN classes_annees ca ON c.id = ca."classeId"
WHERE edt."classeId" = c.id
AND ca.actif = true
LIMIT 1; -- Prend la première classe_annee active

-- Note: Cette requête peut nécessiter un ajustement si plusieurs classes_annees existent pour une classe
-- Dans ce cas, il faut utiliser l'année scolaire courante

-- 4.3 Alternative: peupler via année scolaire courante
UPDATE emploi_du_temps edt
SET "classeAnneeId" = ca.id
FROM classes c
JOIN classes_annees ca ON c.id = ca."classeId"
JOIN annees_scolaires a ON ca."anneeScolaireId" = a.id
WHERE edt."classeId" = c.id
AND a.actif = true
AND a.dateDebut <= CURRENT_DATE
AND a.dateFin >= CURRENT_DATE;

-- 4.4 Vérification
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM emploi_du_temps WHERE "classeAnneeId" IS NULL;
    SELECT COUNT(*) INTO total_count FROM emploi_du_temps;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ EmploiDuTemps sans classeAnneeId: %/%', null_count, total_count;
    ELSE
        RAISE NOTICE '✓ EmploiDuTemps: classeAnneeId peuplé (% lignes)', total_count;
    END IF;
END $$;

-- 4.5 Rendre obligatoire
ALTER TABLE emploi_du_temps ALTER COLUMN "classeAnneeId" SET NOT NULL;

-- 4.6 Supprimer ancienne colonne
ALTER TABLE emploi_du_temps DROP COLUMN IF EXISTS "classeId";

-- 4.7 Recréer index
DROP INDEX IF EXISTS idx_emploi_du_temps_classe;
CREATE INDEX IF NOT EXISTS idx_emploi_du_temps_classe_annee ON emploi_du_temps("classeAnneeId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_emploi_du_temps_unique ON emploi_du_temps("classeAnneeId", jour, "heureDebut", "heureFin");

DO $$
BEGIN
    RAISE NOTICE '✓ EmploiDuTemps migré vers classeAnneeId';
END $$;

-- ==================================
-- ÉTAPE 5: AFFECTATION_MATIERE - Remplacer par classeAnneeId
-- ==================================

-- 5.1 Ajouter colonne nullable
ALTER TABLE affectations_matieres ADD COLUMN IF NOT EXISTS "classeAnneeId" UUID;

-- 5.2 Peupler avec données existantes
UPDATE affectations_matieres am
SET "classeAnneeId" = ca.id
FROM classes_annees ca
WHERE am."classeId" = ca."classeId"
AND am."anneeScolaireId" = ca."anneeScolaireId";

-- 5.3 Vérification
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM affectations_matieres WHERE "classeAnneeId" IS NULL;
    SELECT COUNT(*) INTO total_count FROM affectations_matieres;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ AffectationMatiere sans classeAnneeId: %/%', null_count, total_count;
    ELSE
        RAISE NOTICE '✓ AffectationMatiere: classeAnneeId peuplé (% lignes)', total_count;
    END IF;
END $$;

-- 5.4 Rendre obligatoire
ALTER TABLE affectations_matieres ALTER COLUMN "classeAnneeId" SET NOT NULL;

-- 5.5 Supprimer anciennes colonnes
ALTER TABLE affectations_matieres DROP COLUMN IF EXISTS "classeId";
ALTER TABLE affectations_matieres DROP COLUMN IF EXISTS "anneeScolaireId";

-- 5.6 Recréer index
DROP INDEX IF EXISTS idx_affectations_matieres_classe;
DROP INDEX IF EXISTS idx_affectations_matieres_annee;
CREATE INDEX IF NOT EXISTS idx_affectations_matieres_classe_annee ON affectations_matieres("classeAnneeId");
CREATE INDEX IF NOT EXISTS idx_affectations_matieres_enseignant_classe_annee ON affectations_matieres("enseignantId", "matiereId", "classeAnneeId", actif) WHERE actif = true;

DO $$
BEGIN
    RAISE NOTICE '✓ AffectationMatiere migrée vers classeAnneeId';
END $$;

-- ==================================
-- ÉTAPE 6: CONFIGURATION_MATIERE_CLASSE - Remplacer par classeAnneeId
-- ==================================

-- 6.1 Ajouter colonne nullable
ALTER TABLE configurations_matieres_classes ADD COLUMN IF NOT EXISTS "classeAnneeId" UUID;

-- 6.2 Peupler avec données existantes
UPDATE configurations_matieres_classes cmc
SET "classeAnneeId" = ca.id
FROM classes_annees ca
WHERE cmc."classeId" = ca."classeId"
AND cmc."anneeScolaireId" = ca."anneeScolaireId";

-- 6.3 Vérification
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM configurations_matieres_classes WHERE "classeAnneeId" IS NULL;
    SELECT COUNT(*) INTO total_count FROM configurations_matieres_classes;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ ConfigurationMatiereClasse sans classeAnneeId: %/%', null_count, total_count;
    ELSE
        RAISE NOTICE '✓ ConfigurationMatiereClasse: classeAnneeId peuplé (% lignes)', total_count;
    END IF;
END $$;

-- 6.4 Rendre obligatoire
ALTER TABLE configurations_matieres_classes ALTER COLUMN "classeAnneeId" SET NOT NULL;

-- 6.5 Supprimer anciennes colonnes
ALTER TABLE configurations_matieres_classes DROP COLUMN IF EXISTS "classeId";
ALTER TABLE configurations_matieres_classes DROP COLUMN IF EXISTS "anneeScolaireId";

-- 6.6 Recréer index
DROP INDEX IF EXISTS idx_configurations_matieres_classes_classe;
DROP INDEX IF EXISTS idx_configurations_matieres_classes_annee;
CREATE INDEX IF NOT EXISTS idx_configurations_matieres_classes_classe_annee ON configurations_matieres_classes("classeAnneeId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_configurations_matieres_classes_unique ON configurations_matieres_classes("matiereId", "classeAnneeId", "etablissementId");

DO $$
BEGIN
    RAISE NOTICE '✓ ConfigurationMatiereClasse migrée vers classeAnneeId';
END $$;

-- ==================================
-- ÉTAPE 7: CLASSE - Supprimer champs annuels
-- ==================================

-- 7.1 Supprimer colonnes
ALTER TABLE classes DROP COLUMN IF EXISTS "anneeScolaireId";
ALTER TABLE classes DROP COLUMN IF EXISTS "professeurPrincipalId";
ALTER TABLE classes DROP COLUMN IF EXISTS "effectifMax";
ALTER TABLE classes DROP COLUMN IF EXISTS "effectifActuel";

-- 7.2 Supprimer index
DROP INDEX IF EXISTS idx_classes_annee;
DROP INDEX IF EXISTS idx_classes_etablissement_annee;

DO $$
BEGIN
    RAISE NOTICE '✓ Classe: colonnes annuelles supprimées';
END $$;

-- ==================================
-- ÉTAPE 8: VALIDATION FINALE
-- ==================================

DO $$
DECLARE
    bulletins_ok INTEGER;
    notes_ok INTEGER;
    edt_ok INTEGER;
    affectations_ok INTEGER;
    configs_ok INTEGER;
BEGIN
    SELECT COUNT(*) INTO bulletins_ok FROM bulletins WHERE "classeAnneeId" IS NOT NULL;
    SELECT COUNT(*) INTO notes_ok FROM notes WHERE "classeAnneeId" IS NOT NULL;
    SELECT COUNT(*) INTO edt_ok FROM emploi_du_temps WHERE "classeAnneeId" IS NOT NULL;
    SELECT COUNT(*) INTO affectations_ok FROM affectations_matieres WHERE "classeAnneeId" IS NOT NULL;
    SELECT COUNT(*) INTO configs_ok FROM configurations_matieres_classes WHERE "classeAnneeId" IS NOT NULL;
    
    RAISE NOTICE '=== VALIDATION MIGRATION 092 ===';
    RAISE NOTICE '✓ Bulletins: % lignes avec classeAnneeId', bulletins_ok;
    RAISE NOTICE '✓ Notes: % lignes avec classeAnneeId', notes_ok;
    RAISE NOTICE '✓ EmploiDuTemps: % lignes avec classeAnneeId', edt_ok;
    RAISE NOTICE '✓ AffectationMatiere: % lignes avec classeAnneeId', affectations_ok;
    RAISE NOTICE '✓ ConfigurationMatiereClasse: % lignes avec classeAnneeId', configs_ok;
    RAISE NOTICE '=== MIGRATION TERMINÉE AVEC SUCCÈS ===';
END $$;
