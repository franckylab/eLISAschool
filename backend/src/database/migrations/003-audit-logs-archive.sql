-- ==================================
-- eLISAschool - Migration Archivage Audit Logs
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Création de la table d'archivage pour les logs d'audit
-- Stratégie :
--   - Logs < 30 jours : table audit_logs (accès rapide)
--   - Logs 30-365 jours : table audit_logs_archive (accès modéré)
--   - Logs > 365 jours : export + suppression (configurable)

-- Table d'archivage (structure identique à audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID,
    action VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    cible VARCHAR(100),
    cible_id UUID,
    description TEXT,
    anciennes_valeurs JSONB,
    nouvelles_valeurs JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    module VARCHAR(100),
    est_echec BOOLEAN DEFAULT FALSE,
    erreur TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_audit_archive_utilisateur ON audit_logs_archive(utilisateur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_archive_action ON audit_logs_archive(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_archive_cible ON audit_logs_archive(cible, cible_id);
CREATE INDEX IF NOT EXISTS idx_audit_archive_date ON audit_logs_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_archive_module ON audit_logs_archive(module, created_at DESC);

-- Commentaire sur la table
COMMENT ON TABLE audit_logs_archive IS 'Archives des logs d''audit (30-365 jours)';

-- Fonction pour archiver les logs anciens
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Déplacer les logs de plus de 30 jours vers l'archive
    WITH moved_logs AS (
        DELETE FROM audit_logs
        WHERE created_at < NOW() - INTERVAL '30 days'
        RETURNING *
    )
    INSERT INTO audit_logs_archive (
        id, utilisateur_id, action, severity, cible, cible_id,
        description, anciennes_valeurs, nouvelles_valeurs,
        ip_address, user_agent, module, est_echec, erreur,
        created_at, archived_at
    )
    SELECT
        id, utilisateur_id, action, severity, cible, cible_id,
        description, anciennes_valeurs, nouvelles_valeurs,
        ip_address, user_agent, module, est_echec, erreur,
        created_at, NOW()
    FROM moved_logs;

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour purger les archives anciennes
CREATE OR REPLACE FUNCTION purge_old_audit_archives(days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs_archive
    WHERE created_at < NOW() - (days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Vue pour faciliter la consultation (logs actuels + archives récentes)
CREATE OR REPLACE VIEW audit_logs_complete AS
SELECT 
    id, utilisateur_id, action, severity, cible, cible_id,
    description, anciennes_valeurs, nouvelles_valeurs,
    ip_address, user_agent, module, est_echec, erreur,
    created_at, false as is_archived
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    id, utilisateur_id, action, severity, cible, cible_id,
    description, anciennes_valeurs, nouvelles_valeurs,
    ip_address, user_agent, module, est_echec, erreur,
    created_at, true as is_archived
FROM audit_logs_archive
WHERE created_at >= NOW() - INTERVAL '365 days'

ORDER BY created_at DESC;

COMMENT ON VIEW audit_logs_complete IS 'Vue unifiée des logs d''audit (actuels + archives 30-365 jours)';

-- Statistiques de la table
SELECT 
    'audit_logs' as table_name, 
    COUNT(*) as total_logs,
    MIN(created_at) as oldest_log,
    MAX(created_at) as newest_log
FROM audit_logs

UNION ALL

SELECT 
    'audit_logs_archive' as table_name, 
    COUNT(*) as total_logs,
    MIN(created_at) as oldest_log,
    MAX(created_at) as newest_log
FROM audit_logs_archive;
