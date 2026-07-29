-- ==================================
-- eLISAschool - Migration 135 : Enrichissement audit_logs
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Objectif :
--   1. Isolation multi-tenant : colonne etablissementId
--   2. Diff stocké : colonne champsModifies (calculée au moment du log)
--   3. Agrégation entités liées : colonnes parentCible / parentCibleId
--   4. Index composites pour les requêtes de timeline et d'agrégation
--
-- Idempotente : peut être rejouée sans effet de bord.

-- 1. Nouvelles colonnes
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "etablissementId" uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "champsModifies" text; -- simple-array TypeORM (CSV)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "parentCible" varchar(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "parentCibleId" uuid;

-- 2. Index composites
CREATE INDEX IF NOT EXISTS "IDX_audit_logs_etablissement_created"
    ON audit_logs ("etablissementId", "createdAt");

CREATE INDEX IF NOT EXISTS "IDX_audit_logs_parent_created"
    ON audit_logs ("parentCible", "parentCibleId", "createdAt");

-- Index existants attendus (créés par synchronize) — rattrapage défensif
CREATE INDEX IF NOT EXISTS "IDX_audit_logs_utilisateur_created"
    ON audit_logs ("utilisateurId", "createdAt");

CREATE INDEX IF NOT EXISTS "IDX_audit_logs_action_created"
    ON audit_logs ("action", "createdAt");

CREATE INDEX IF NOT EXISTS "IDX_audit_logs_cible_cibleid"
    ON audit_logs ("cible", "cibleId");

-- 3. Paramètre de rétention audit (0 = conservation illimitée, défaut)
INSERT INTO parametres_systeme ("cle", "valeur", "description", "typeValeur", "categorie", "module")
VALUES (
    'audit.retention_jours',
    '0',
    'Nombre de jours de conservation des logs INFO (0 = illimité). Les logs WARNING/CRITICAL sont conservés indéfiniment.',
    'NUMBER',
    'SYSTEME',
    'audit'
)
ON CONFLICT ("cle", "etablissementId") DO NOTHING;
