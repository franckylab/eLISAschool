-- ==================================
-- eLISAschool - Fix Vues Matérialisées Organisation (statuts enum + alias)
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Problème : La migration 120 échouait au CREATE (rollback complet) car :
-- 1. Comparaisons p.statut = 'actif'/'vacant' en minuscules alors que
--    l'enum postes_statut_enum contient 'ACTIF'/'VACANT'/'SUPPRIME'/'EN_ATTENTE'
--    → erreur "invalid input value for enum" → transaction annulée.
-- 2. mv_postes_vacants_critiques exposait u."etablissementId" sans alias
--    snake_case alors que le service requête WHERE etablissement_id = $1.
-- 3. Jointure hierarchie_personnel par etablissementId (multiplication de
--    lignes) → remplacée par un sous-agrégat.
--
-- Résultat : aucune vue matérialisée n'existe en base. Cette migration
-- les (re)crée proprement, de façon idempotente.
-- ==================================

BEGIN;

-- ============================================================
-- ÉTAPE 1 : mv_stats_organisation
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS mv_stats_organisation;

CREATE MATERIALIZED VIEW mv_stats_organisation AS
SELECT
    u."etablissementId" AS etablissement_id,
    COUNT(DISTINCT u.id) AS total_unites,
    COUNT(DISTINCT u.id) FILTER (WHERE u.actif = true) AS unites_actives,
    COUNT(DISTINCT p.id) AS total_postes,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut::text = 'ACTIF') AS postes_occupes,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut::text = 'VACANT') AS postes_vacants,
    COALESCE(MAX(h.total_hierarchies), 0) AS total_hierarchies,
    COALESCE(MAX(h.hierarchies_actives), 0) AS hierarchies_actives,
    CURRENT_TIMESTAMP AS derniere_maj
FROM unites_organisationnelles u
LEFT JOIN postes p ON p."uniteOrganisationnelleId" = u.id
LEFT JOIN (
    SELECT
        "etablissementId",
        COUNT(*) AS total_hierarchies,
        COUNT(*) FILTER (WHERE actif = true) AS hierarchies_actives
    FROM hierarchie_personnel
    GROUP BY "etablissementId"
) h ON h."etablissementId" = u."etablissementId"
WHERE u."etablissementId" IS NOT NULL
GROUP BY u."etablissementId";

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stats_organisation_etab
    ON mv_stats_organisation(etablissement_id);

-- ============================================================
-- ÉTAPE 2 : mv_postes_vacants_critiques
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS mv_postes_vacants_critiques;

CREATE MATERIALIZED VIEW mv_postes_vacants_critiques AS
SELECT
    p.id AS poste_id,
    p.intitule,
    p.code,
    p.statut::text AS statut,
    p."updatedAt" AS date_vacance,
    u.id AS unite_id,
    u.nom AS unite_nom,
    u.code AS unite_code,
    u."etablissementId" AS etablissement_id,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p."updatedAt"))::integer AS jours_vacance,
    CASE
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p."updatedAt")) > 30 THEN 'critique'
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p."updatedAt")) > 15 THEN 'avertissement'
        ELSE 'normal'
    END AS niveau_alerte
FROM postes p
JOIN unites_organisationnelles u ON u.id = p."uniteOrganisationnelleId"
WHERE p.statut::text = 'VACANT'
AND p.actif = true
AND u."etablissementId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_postes_vacants_id
    ON mv_postes_vacants_critiques(poste_id);

CREATE INDEX IF NOT EXISTS idx_mv_postes_vacants_niveau
    ON mv_postes_vacants_critiques(niveau_alerte, jours_vacance DESC);

CREATE INDEX IF NOT EXISTS idx_mv_postes_vacants_etab
    ON mv_postes_vacants_critiques(etablissement_id, niveau_alerte);

-- ============================================================
-- ÉTAPE 3 : Fonction refresh_mv_organisation()
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_mv_organisation()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_organisation;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_postes_vacants_critiques;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ÉTAPE 4 : Index templates_organisation (repris de 120, idempotent)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_templates_org_actif
    ON templates_organisation(actif);

CREATE INDEX IF NOT EXISTS idx_templates_org_etablissement
    ON templates_organisation("etablissementId");

-- ============================================================
-- ÉTAPE 5 : Nettoyage index obsolètes (repris de 120, idempotent)
-- ============================================================

DROP INDEX IF EXISTS idx_postes_couvrant_stats;
DROP INDEX IF EXISTS idx_mv_stats_organisation_id;

COMMIT;
