-- ==================================
-- eLISAschool - Migration Optimisation Performance Organisation
-- ==================================
-- Version: 1.4.0
-- Auteur: franck arlos chendjou
-- Description: Indexes composites, vues matérialisées et optimisations avancées
-- ==================================

-- ==================================
-- INDEXES COMPOSITES STRATÉGIQUES
-- ==================================

-- 1. Unités organisationnelles - Optimisation arborescence
-- Requête fréquente: WHERE organisationId = X AND parentId = Y ORDER BY ordre
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unites_org_parent_ordre 
    ON unites_organisationnelles(organisationId, parentId, ordre);

-- 2. Unités - Filtrage par type et statut
-- Requête fréquente: WHERE organisationId = X AND type = Y AND actif = true
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unites_org_type_actif 
    ON unites_organisationnelles(organisationId, type, actif);

-- 3. Postes - Recherche par unité et statut
-- Requête fréquente: WHERE uniteOrganisationnelleId = X AND statut = Y
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_postes_unite_statut 
    ON postes(uniteOrganisationnelleId, statut);

-- 4. Postes - Postes vacants avec date (pour alertes)
-- Requête fréquente: WHERE statut = 'vacant' ORDER BY updatedAt ASC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_postes_vacants_date 
    ON postes(statut, updatedAt) 
    WHERE statut = 'vacant';

-- 5. Hiérarchie - Relations actives par établissement
-- Requête fréquente: WHERE personnelId = X AND etablissementId = Y AND actif = true
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hierarchie_personnel_etab_actif 
    ON hierarchie_personnel(personnelId, etablissementId, actif) 
    WHERE actif = true;

-- 6. Hiérarchie - Subordonnés par supérieur
-- Requête fréquente: WHERE superieurId = X AND etablissementId = Y AND actif = true
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hierarchie_superieur_etab_actif 
    ON hierarchie_personnel(superieurId, etablissementId, actif) 
    WHERE actif = true;

-- 7. Organisations - Filtrage par établissement et type
-- Requête fréquente: WHERE etablissementId = X AND type = Y
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organisations_etab_type 
    ON organisations(etablissementId, type);

-- ==================================
-- INDEXES COUVRANTS (Covering Indexes)
-- ==================================

-- 8. Unités - Index couvrant pour liste rapide (sans JOIN)
-- Permet de satisfaire les requêtes SELECT id, nom, code, ordre sans accéder à la table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unites_couvrant_liste 
    ON unites_organisationnelles(organisationId, actif, ordre) 
    INCLUDE (id, nom, code, type);

-- 9. Postes - Index couvrant pour statistiques
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_postes_couvrant_stats 
    ON postes(uniteOrganisationnelleId, statut) 
    INCLUDE (id, intitulé, occupantId);

-- ==================================
-- VUE MATÉRIALISÉE - Statistiques Organisation
-- ==================================

-- Vue pour statistiques rapides sans calcul dynamique
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stats_organisation AS
SELECT 
    o.id AS organisation_id,
    o.nom AS organisation_nom,
    o.etablissementId,
    COUNT(DISTINCT u.id) AS total_unites,
    COUNT(DISTINCT u.id) FILTER (WHERE u.actif = true) AS unites_actives,
    COUNT(DISTINCT p.id) AS total_postes,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut = 'actif') AS postes_occupes,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut = 'vacant') AS postes_vacants,
    COUNT(DISTINCT h.id) AS total_hierarchies,
    COUNT(DISTINCT h.id) FILTER (WHERE h.actif = true) AS hierarchies_actives,
    CURRENT_TIMESTAMP AS derniere_maj
FROM organisations o
LEFT JOIN unites_organisationnelles u ON u.organisationId = o.id
LEFT JOIN postes p ON p.uniteOrganisationnelleId = u.id
LEFT JOIN hierarchie_personnel h ON h.etablissementId = o.etablissementId
GROUP BY o.id, o.nom, o.etablissementId;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stats_organisation_id 
    ON mv_stats_organisation(organisation_id);

CREATE INDEX IF NOT EXISTS idx_mv_stats_organisation_etab 
    ON mv_stats_organisation(etablissementId);

-- ==================================
-- VUE MATÉRIALISÉE - Postes Vacants Critiques
-- ==================================

-- Vue pour identification rapide des postes vacants critiques
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_postes_vacants_critiques AS
SELECT 
    p.id AS poste_id,
    p.intitulé,
    p.code,
    p.statut,
    p.updatedAt AS date_vacance,
    u.id AS unite_id,
    u.nom AS unite_nom,
    u.code AS unite_code,
    o.id AS organisation_id,
    o.nom AS organisation_nom,
    o.etablissementId,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.updatedAt))::integer AS jours_vacance,
    CASE 
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.updatedAt)) > 30 THEN 'critique'
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.updatedAt)) > 15 THEN 'avertissement'
        ELSE 'normal'
    END AS niveau_alerte
FROM postes p
JOIN unites_organisationnelles u ON u.id = p.uniteOrganisationnelleId
JOIN organisations o ON o.id = u.organisationId
WHERE p.statut = 'vacant';

-- Index sur la vue
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_postes_vacants_id 
    ON mv_postes_vacants_critiques(poste_id);

CREATE INDEX IF NOT EXISTS idx_mv_postes_vacants_niveau 
    ON mv_postes_vacants_critiques(niveau_alerte, jours_vacance DESC);

CREATE INDEX IF NOT EXISTS idx_mv_postes_vacants_etab 
    ON mv_postes_vacants_critiques(etablissementId, niveau_alerte);

-- ==================================
-- FONCTION - Rafraîchissement des vues
-- ==================================

-- Fonction pour rafraîchir toutes les vues matérialisées
CREATE OR REPLACE FUNCTION refresh_mv_organisation()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_organisation;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_postes_vacants_critiques;
    
    -- Logger le rafraîchissement
    INSERT INTO logs_systeme (module, action, details, created_at)
    VALUES (
        'organisation',
        'REFRESH_VUES_MATERIALISEES',
        'Vues rafraîchies: mv_stats_organisation, mv_postes_vacants_critiques',
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- TABLE - Logs système (si n'existe pas)
-- ==================================

CREATE TABLE IF NOT EXISTS logs_systeme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_systeme_module_date 
    ON logs_systeme(module, created_at DESC);

-- ==================================
-- VÉRIFICATION
-- ==================================

SELECT 
    'Index créés' AS verification,
    COUNT(*) AS total
FROM pg_indexes
WHERE tablename IN ('unites_organisationnelles', 'postes', 'hierarchie_personnel', 'organisations')
    AND indexname LIKE 'idx_%';

SELECT 
    'Vues matérialisées' AS verification,
    COUNT(*) AS total
FROM pg_matviews
WHERE matviewname LIKE 'mv_%';

-- ==================================
-- INSTRUCTIONS UTILISATION
-- ==================================

-- Rafraîchissement manuel des vues:
-- SELECT refresh_mv_organisation();

-- Rafraîchissement automatique via cron (toutes les heures):
-- 0 * * * * psql -c "SELECT refresh_mv_organisation();"

-- Utiliser la vue pour statistiques rapides:
-- SELECT * FROM mv_stats_organisation WHERE etablissementId = 'xxx';

-- Utiliser la vue pour postes vacants critiques:
-- SELECT * FROM mv_postes_vacants_critiques 
-- WHERE etablissementId = 'xxx' AND niveau_alerte = 'critique';
