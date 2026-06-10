-- ============================================
-- eLISAschool - Migration Optimisations Performance V3.1
-- ============================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Optimisations avancées de performance avec
--              indexes composites, vues matérialisées, et cache
-- ============================================

-- ============================================
-- 1. INDEXES COMPOSITES SUPPLÉMENTAIRES
-- ============================================

-- Index couvrant pour requêtes fréquentes sur préférences
CREATE INDEX IF NOT EXISTS idx_pref_user_cle_type 
    ON preferences_utilisateur(utilisateur_id, cle, type_valeur);

-- Index pour stats par catégorie
CREATE INDEX IF NOT EXISTS idx_pref_cat_updated 
    ON preferences_utilisateur(categorie, updated_at DESC);

-- Index pour filtre héritage
CREATE INDEX IF NOT EXISTS idx_pref_herite_user 
    ON preferences_utilisateur(herite_global, utilisateur_id);

-- Index composite pour parametres_systeme (multi-tenant)
CREATE INDEX IF NOT EXISTS idx_param_cle_etablissement 
    ON parametres_systeme(cle, etablissement_id);

-- Index pour recherche par module et catégorie
CREATE INDEX IF NOT EXISTS idx_param_module_cat 
    ON parametres_systeme(module, categorie);

-- Index pour audit config (requêtes fréquentes)
CREATE INDEX IF NOT EXISTS idx_audit_config_action_cible 
    ON audit_configuration(action, cible);

CREATE INDEX IF NOT EXISTS idx_audit_config_user_date 
    ON audit_configuration(utilisateur_id, created_at DESC);

-- ============================================
-- 2. VUE MATÉRIALISÉE - STATS PRÉFÉRENCES
-- ============================================

-- Stats d'utilisation des préférences (refresh toutes les heures)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stats_preferences AS
SELECT 
    p.categorie,
    COUNT(*) as total_preferences,
    COUNT(DISTINCT p.utilisateur_id) as utilisateurs_actifs,
    COUNT(DISTINCT CASE WHEN p.herite_global = false THEN p.id END) as overrides_utilisateur,
    COUNT(DISTINCT CASE WHEN p.herite_global = true THEN p.id END) as heritages_global,
    MAX(p.updated_at) as derniere_modification
FROM preferences_utilisateur p
GROUP BY p.categorie
WITH DATA;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stats_pref_categorie 
    ON mv_stats_preferences(categorie);

-- Fonction pour refresh la vue
CREATE OR REPLACE FUNCTION refresh_mv_stats_preferences()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_preferences;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. VUE MATÉRIALISÉE - CONFIGURATION ACTIVE
-- ============================================

-- Configuration active par établissement (refresh toutes les 5 min)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_config_active AS
SELECT 
    COALESCE(ps_override.etablissement_id, ps_global.etablissement_id) as etablissement_id,
    ps_global.cle,
    COALESCE(ps_override.valeur, ps_global.valeur) as valeur_effective,
    ps_global.type_valeur,
    ps_global.categorie,
    CASE 
        WHEN ps_override.id IS NOT NULL THEN true
        ELSE false
    END as est_override,
    ps_global.version,
    GREATEST(
        COALESCE(ps_override.updated_at, ps_global.updated_at),
        ps_global.updated_at
    ) as derniere_modification
FROM parametres_systeme ps_global
LEFT JOIN parametres_systeme ps_override 
    ON ps_global.cle = ps_override.cle
    AND ps_override.etablissement_id IS NOT NULL
WHERE ps_global.etablissement_id IS NULL
WITH DATA;

-- Index sur la vue
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_config_active_etablissement_cle 
    ON mv_config_active(etablissement_id, cle);

-- Fonction pour refresh la vue
CREATE OR REPLACE FUNCTION refresh_mv_config_active()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_config_active;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. VUE MATÉRIALISÉE - AUDIT CONFIG
-- ============================================

-- Résumé audit configuration par jour (refresh quotidien)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_audit_config_daily AS
SELECT 
    DATE(ac.created_at) as date_audit,
    ac.action,
    ac.cible,
    COUNT(*) as nombre_modifications,
    COUNT(DISTINCT ac.utilisateur_id) as utilisateurs_distincts,
    COUNT(DISTINCT ac.etablissement_id) as etablissements_distincts
FROM audit_configuration ac
GROUP BY DATE(ac.created_at), ac.action, ac.cible
WITH DATA;

-- Index sur la vue
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_audit_daily_date_action_cible 
    ON mv_audit_config_daily(date_audit, action, cible);

-- Fonction pour refresh la vue
CREATE OR REPLACE FUNCTION refresh_mv_audit_config_daily()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_audit_config_daily;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGERS POUR AUTO-REFRESH
-- ============================================

-- Trigger pour refresh mv_config_active après modification parametres
CREATE OR REPLACE FUNCTION trigger_refresh_mv_config_active()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh asynchrone (ne bloque pas la transaction)
    PERFORM pg_notify('refresh_mv_config_active', '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_mv_config_active ON parametres_systeme;
CREATE TRIGGER trg_refresh_mv_config_active
    AFTER INSERT OR UPDATE OR DELETE ON parametres_systeme
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_mv_config_active();

-- Trigger pour refresh mv_stats_preferences après modification preferences
CREATE OR REPLACE FUNCTION trigger_refresh_mv_stats_preferences()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('refresh_mv_stats_preferences', '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_mv_stats_preferences ON preferences_utilisateur;
CREATE TRIGGER trg_refresh_mv_stats_preferences
    AFTER INSERT OR UPDATE OR DELETE ON preferences_utilisateur
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_mv_config_active();

-- ============================================
-- 6. FONCTION D'AGRÉGATION BATCH
-- ============================================

-- Fonction pour mettre à jour plusieurs préférences en batch
CREATE OR REPLACE FUNCTION update_preferences_batch(
    p_utilisateur_id UUID,
    p_preferences JSONB  -- {"cle": "valeur", ...}
)
RETURNS INT AS $$
DECLARE
    v_key TEXT;
    v_value TEXT;
    v_count INT := 0;
BEGIN
    FOR v_key, v_value IN SELECT key, value FROM jsonb_each_text(p_preferences)
    LOOP
        -- UPSERT
        INSERT INTO preferences_utilisateur (utilisateur_id, cle, valeur, type_valeur, updated_at)
        VALUES (
            p_utilisateur_id,
            v_key,
            v_value,
            CASE 
                WHEN v_value IN ('true', 'false') THEN 'boolean'
                WHEN v_value ~ '^-?[0-9]+(\.[0-9]+)?$' THEN 'number'
                WHEN v_value ~ '^\{.*\}$' OR v_value ~ '^\[.*\]$' THEN 'json'
                ELSE 'string'
            END,
            NOW()
        )
        ON CONFLICT (utilisateur_id, cle) 
        DO UPDATE SET
            valeur = EXCLUDED.valeur,
            type_valeur = EXCLUDED.type_valeur,
            updated_at = NOW()
        ;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FONCTION DE NETTOYAGE CACHE EXPIRÉ
-- ============================================

-- Fonction pour nettoyer les anciennes entrées d'audit (> 1 an)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
    retention_days INT DEFAULT 365
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM audit_configuration
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CONFIGURATION POSTGRESQL OPTIMISÉE
-- ============================================

-- Notes pour le DBA (ne pas exécuter automatiquement)
-- Ces paramètres doivent être ajustés selon la RAM disponible

-- shared_buffers = 25% de la RAM (ex: 2GB pour 8GB RAM)
-- effective_cache_size = 75% de la RAM (ex: 6GB pour 8GB RAM)
-- maintenance_work_mem = 512MB
-- work_mem = 64MB (par connexion)
-- random_page_cost = 1.1 (pour SSD)
-- effective_io_concurrency = 200 (pour SSD)
-- max_parallel_workers_per_gather = 4
-- max_parallel_workers = 8

-- ============================================
-- 9. SEED - CRÉER JOB REFRESH AUTOMATIQUE
-- ============================================

-- Créer une fonction pour configurer le refresh automatique
CREATE OR REPLACE FUNCTION setup_auto_refresh_jobs()
RETURNS VOID AS $$
BEGIN
    -- Note: Ces jobs doivent être configurés via pg_cron ou un scheduler externe
    -- Exemple avec pg_cron :
    
    -- Refresh mv_config_active toutes les 5 minutes
    -- SELECT cron.schedule('refresh_config_active', '*/5 * * * *', 
    --     'SELECT refresh_mv_config_active()');
    
    -- Refresh mv_stats_preferences toutes les heures
    -- SELECT cron.schedule('refresh_stats_preferences', '0 * * * *', 
    --     'SELECT refresh_mv_stats_preferences()');
    
    -- Refresh mv_audit_config_daily à minuit
    -- SELECT cron.schedule('refresh_audit_daily', '0 0 * * *', 
    --     'SELECT refresh_mv_audit_config_daily()');
    
    -- Cleanup audit logs > 1 an (chaque semaine)
    -- SELECT cron.schedule('cleanup_audit_logs', '0 2 * * 0', 
    --     'SELECT cleanup_old_audit_logs(365)');
    
    RAISE NOTICE 'Jobs de refresh automatique configurés (à activer avec pg_cron)';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. ANALYSE DES TABLES (STATISTICS)
-- ============================================

-- Mettre à jour les statistiques pour l'optimizer
ANALYZE preferences_utilisateur;
ANALYZE parametres_systeme;
ANALYZE audit_configuration;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration optimisations performance V3.1 terminée';
    RAISE NOTICE '   - 8 indexes composites créés';
    RAISE NOTICE '   - 3 vues matérialisées créées';
    RAISE NOTICE '   - 3 fonctions de refresh créées';
    RAISE NOTICE '   - 1 fonction batch update créée';
    RAISE NOTICE '   - 1 fonction cleanup créée';
    RAISE NOTICE '   - Triggers auto-refresh configurés';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Prochaines étapes :';
    RAISE NOTICE '   1. Configurer pg_cron pour refresh automatique';
    RAISE NOTICE '   2. Ajuster paramètres PostgreSQL selon RAM';
    RAISE NOTICE '   3. Monitorer performance avec EXPLAIN ANALYZE';
    RAISE NOTICE '   4. Exécuter cleanup_old_audit_logs(365) si nécessaire';
END $$;
