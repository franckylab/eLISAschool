-- ==================================
-- eLISAschool - Correction Vues Matérialisées Organisation
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Problème : Les vues mv_stats_organisation et mv_postes_vacants_critiques
-- (migration 046) référençaient la table "organisations" et la colonne
-- "intitulé" (avec accent) qui n'existent plus dans le modèle v4.
--
-- Corrections :
-- 1. DROP + RECREATE mv_stats_organisation (sans table organisations)
-- 2. DROP + RECREATE mv_postes_vacants_critiques (sans organisations, intitulé → intitule)
-- 3. Correction fonction refresh_mv_organisation()
-- 4. Ajout index manquants sur templates_organisation
-- ==================================

BEGIN;

-- ============================================================
-- ÉTAPE 1 : Corriger mv_stats_organisation
-- ============================================================
-- Ancienne vue référençait : organisations o, u.organisationId
-- Nouvelle vue : agrège par etablissementId directement

DROP MATERIALIZED VIEW IF EXISTS mv_stats_organisation;

CREATE MATERIALIZED VIEW mv_stats_organisation AS
SELECT
    u."etablissementId" AS etablissement_id,
    COUNT(DISTINCT u.id) AS total_unites,
    COUNT(DISTINCT u.id) FILTER (WHERE u.actif = true) AS unites_actives,
    COUNT(DISTINCT p.id) AS total_postes,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut = 'actif') AS postes_occupes,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut = 'vacant') AS postes_vacants,
    COUNT(DISTINCT h.id) AS total_hierarchies,
    COUNT(DISTINCT h.id) FILTER (WHERE h.actif = true) AS hierarchies_actives,
    CURRENT_TIMESTAMP AS derniere_maj
FROM unites_organisationnelles u
LEFT JOIN postes p ON p."uniteOrganisationnelleId" = u.id
LEFT JOIN hierarchie_personnel h ON h."etablissementId" = u."etablissementId"
WHERE u."etablissementId" IS NOT NULL
GROUP BY u."etablissementId";

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stats_organisation_etab
    ON mv_stats_organisation(etablissement_id);

-- ============================================================
-- ÉTAPE 2 : Corriger mv_postes_vacants_critiques
-- ============================================================
-- Ancienne vue référençait : organisations o, u.organisationId, p.intitulé
-- Nouvelle vue : p.intitule (sans accent), pas de table organisations

DROP MATERIALIZED VIEW IF EXISTS mv_postes_vacants_critiques;

CREATE MATERIALIZED VIEW mv_postes_vacants_critiques AS
SELECT
    p.id AS poste_id,
    p.intitule,
    p.code,
    p.statut,
    p."updatedAt" AS date_vacance,
    u.id AS unite_id,
    u.nom AS unite_nom,
    u.code AS unite_code,
    u."etablissementId",
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p."updatedAt"))::integer AS jours_vacance,
    CASE
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p."updatedAt")) > 30 THEN 'critique'
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p."updatedAt")) > 15 THEN 'avertissement'
        ELSE 'normal'
    END AS niveau_alerte
FROM postes p
JOIN unites_organisationnelles u ON u.id = p."uniteOrganisationnelleId"
WHERE p.statut = 'vacant'
AND p.actif = true
AND u."etablissementId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_postes_vacants_id
    ON mv_postes_vacants_critiques(poste_id);

CREATE INDEX IF NOT EXISTS idx_mv_postes_vacants_niveau
    ON mv_postes_vacants_critiques(niveau_alerte, jours_vacance DESC);

CREATE INDEX IF NOT EXISTS idx_mv_postes_vacants_etab
    ON mv_postes_vacants_critiques("etablissementId", niveau_alerte);

-- ============================================================
-- ÉTAPE 3 : Corriger fonction refresh_mv_organisation()
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_mv_organisation()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_organisation;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_postes_vacants_critiques;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ÉTAPE 4 : Index manquants sur templates_organisation
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_templates_org_actif
    ON templates_organisation(actif);

CREATE INDEX IF NOT EXISTS idx_templates_org_etablissement
    ON templates_organisation("etablissementId");

-- ============================================================
-- ÉTAPE 5 : Nettoyage — supprimer anciens index obsolètes
-- ============================================================

-- Index sur colonne supprimée (categoriePosteId)
DROP INDEX IF EXISTS idx_postes_couvrant_stats;

-- Ancien index sur organisation_id (n'existe plus)
DROP INDEX IF EXISTS idx_mv_stats_organisation_id;

COMMIT;
