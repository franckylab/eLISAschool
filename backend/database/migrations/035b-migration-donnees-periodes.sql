-- ==================================
-- eLISAschool - Migration Données Existantes: Lier periodeId aux entités de suivi
-- ==================================
-- Objectif: Mettre à jour les données existantes pour lier periodeId basé sur les dates
-- Date: 8 juin 2026
-- ATTENTION: Script optionnel - à exécuter APRÈS migration 035
-- ==================================

-- ============================================
-- PRÉREQUIS
-- ============================================
-- 1. Migration 035 doit être appliquée
-- 2. La table 'periodes' doit contenir les périodes configurées
-- 3. BACKUP recommandé avant exécution

-- ============================================
-- 1. INCIDENTS ÉLÈVES - Mise à jour periodeId
-- ============================================

UPDATE incidents_eleves 
SET "periodeId" = (
    SELECT p.id 
    FROM periodes p
    WHERE p."anneeScolaireId" = incidents_eleves."anneeScolaireId"
    AND p."dateDebut" <= incidents_eleves."dateIncident"
    AND p."dateFin" >= incidents_eleves."dateIncident"
    LIMIT 1
)
WHERE "periodeId" IS NULL 
AND "dateIncident" IS NOT NULL
AND EXISTS (
    SELECT 1 
    FROM periodes p 
    WHERE p."anneeScolaireId" = incidents_eleves."anneeScolaireId"
    AND p."dateDebut" <= incidents_eleves."dateIncident"
    AND p."dateFin" >= incidents_eleves."dateIncident"
);

-- ============================================
-- 2. OBSERVATIONS ÉLÈVES - Mise à jour periodeId
-- ============================================

UPDATE observations_eleves 
SET "periodeId" = (
    SELECT p.id 
    FROM periodes p
    WHERE p."anneeScolaireId" = observations_eleves."anneeScolaireId"
    AND p."dateDebut" <= observations_eleves."createdAt"
    AND p."dateFin" >= observations_eleves."createdAt"
    LIMIT 1
)
WHERE "periodeId" IS NULL 
AND EXISTS (
    SELECT 1 
    FROM periodes p 
    WHERE p."anneeScolaireId" = observations_eleves."anneeScolaireId"
    AND p."dateDebut" <= observations_eleves."createdAt"
    AND p."dateFin" >= observations_eleves."createdAt"
);

-- ============================================
-- 3. SANCTIONS ÉLÈVES - Mise à jour periodeId
-- ============================================

UPDATE sanctions_eleves 
SET "periodeId" = (
    SELECT p.id 
    FROM periodes p
    WHERE p."anneeScolaireId" = sanctions_eleves."anneeScolaireId"
    AND p."dateDebut" <= sanctions_eleves."createdAt"
    AND p."dateFin" >= sanctions_eleves."createdAt"
    LIMIT 1
)
WHERE "periodeId" IS NULL 
AND EXISTS (
    SELECT 1 
    FROM periodes p 
    WHERE p."anneeScolaireId" = sanctions_eleves."anneeScolaireId"
    AND p."dateDebut" <= sanctions_eleves."createdAt"
    AND p."dateFin" >= sanctions_eleves."createdAt"
);

-- ============================================
-- 4. FÉLICITATIONS ÉLÈVES - Mise à jour periodeId
-- ============================================

UPDATE felicitations_eleves 
SET "periodeId" = (
    SELECT p.id 
    FROM periodes p
    WHERE p."anneeScolaireId" = felicitations_eleves."anneeScolaireId"
    AND p."dateDebut" <= felicitations_eleves."createdAt"
    AND p."dateFin" >= felicitations_eleves."createdAt"
    LIMIT 1
)
WHERE "periodeId" IS NULL 
AND EXISTS (
    SELECT 1 
    FROM periodes p 
    WHERE p."anneeScolaireId" = felicitations_eleves."anneeScolaireId"
    AND p."dateDebut" <= felicitations_eleves."createdAt"
    AND p."dateFin" >= felicitations_eleves."createdAt"
);

-- ============================================
-- 5. INCIDENTS PERSONNEL - Mise à jour periodeId
-- ============================================

UPDATE incidents_personnel 
SET "periodeId" = (
    SELECT p.id 
    FROM periodes p
    WHERE p."anneeScolaireId" = incidents_personnel."anneeScolaireId"
    AND p."dateDebut" <= incidents_personnel."dateIncident"
    AND p."dateFin" >= incidents_personnel."dateIncident"
    LIMIT 1
)
WHERE "periodeId" IS NULL 
AND "dateIncident" IS NOT NULL
AND EXISTS (
    SELECT 1 
    FROM periodes p 
    WHERE p."anneeScolaireId" = incidents_personnel."anneeScolaireId"
    AND p."dateDebut" <= incidents_personnel."dateIncident"
    AND p."dateFin" >= incidents_personnel."dateIncident"
);

-- ============================================
-- 6. CONSULTATIONS MÉDICALES - Mise à jour periodeId
-- ============================================

UPDATE consultations_medicales 
SET "periodeId" = (
    SELECT p.id 
    FROM periodes p
    WHERE p."anneeScolaireId" = consultations_medicales."anneeScolaireId"
    AND p."dateDebut" <= consultations_medicales."dateConsultation"
    AND p."dateFin" >= consultations_medicales."dateConsultation"
    LIMIT 1
)
WHERE "periodeId" IS NULL 
AND EXISTS (
    SELECT 1 
    FROM periodes p 
    WHERE p."anneeScolaireId" = consultations_medicales."anneeScolaireId"
    AND p."dateDebut" <= consultations_medicales."dateConsultation"
    AND p."dateFin" >= consultations_medicales."dateConsultation"
);

-- ============================================
-- 7. STATISTIQUES FINALES
-- ============================================

SELECT 
    'MIGRATION DONNÉES EXISTANTES - RÉSULTATS' as résumé,
    (SELECT COUNT(*) FROM incidents_eleves WHERE "periodeId" IS NOT NULL) as incidents_eleves_avec_periode,
    (SELECT COUNT(*) FROM observations_eleves WHERE "periodeId" IS NOT NULL) as observations_avec_periode,
    (SELECT COUNT(*) FROM sanctions_eleves WHERE "periodeId" IS NOT NULL) as sanctions_avec_periode,
    (SELECT COUNT(*) FROM felicitations_eleves WHERE "periodeId" IS NOT NULL) as felicitations_avec_periode,
    (SELECT COUNT(*) FROM incidents_personnel WHERE "periodeId" IS NOT NULL) as incidents_personnel_avec_periode,
    (SELECT COUNT(*) FROM consultations_medicales WHERE "periodeId" IS NOT NULL) as consultations_avec_periode;

-- Données non migrées (sans période correspondante)
SELECT 'incidents sans periodeId' as statut, COUNT(*) as nombre
FROM incidents_eleves WHERE "periodeId" IS NULL
UNION ALL
SELECT 'observations sans periodeId', COUNT(*)
FROM observations_eleves WHERE "periodeId" IS NULL
UNION ALL
SELECT 'sanctions sans periodeId', COUNT(*)
FROM sanctions_eleves WHERE "periodeId" IS NULL
UNION ALL
SELECT 'felicitations sans periodeId', COUNT(*)
FROM felicitations_eleves WHERE "periodeId" IS NULL
UNION ALL
SELECT 'incidents personnel sans periodeId', COUNT(*)
FROM incidents_personnel WHERE "periodeId" IS NULL
UNION ALL
SELECT 'consultations sans periodeId', COUNT(*)
FROM consultations_medicales WHERE "periodeId" IS NULL;

-- ============================================
-- MIGRATION DONNÉES COMPLÉTÉE ✅
-- ============================================
-- 
-- Notes:
-- - Les données sans periodeId restent valides (colonne nullable)
-- - Les nouvelles données devront spécifier periodeId
-- - Les rapports fonctionneront avec ou sans periodeId
-- ============================================
