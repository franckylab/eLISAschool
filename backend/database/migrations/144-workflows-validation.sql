-- ============================================
-- Migration 144: Création table workflows_validation
-- ============================================
-- ⚠️ Renumérotée depuis src/database/migrations/139-workflows-validation.sql
-- (collision avec 139-index-unique-heures-cours.sql du dossier principal).
-- Déplacée le 2026-08-03. Déjà appliquée en base.
--
-- Crée la table de workflow de validation multi-niveaux
-- et ajoute les permissions manquantes pour les modules cibles.

-- ============================================
-- PARTIE 0 : Extension enum audit_action_enum
-- ============================================

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'VALIDATION_APPROUVE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'VALIDATION_REJETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Fallback pour les noms d'enum alternatifs générés par TypeORM
DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'VALIDATION_APPROUVE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'VALIDATION_REJETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- ============================================
-- PARTIE 1 : Création de la table
-- ============================================

CREATE TABLE IF NOT EXISTS workflows_validation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module varchar(50) NOT NULL,
    "entiteId" uuid NOT NULL,
    "entiteType" varchar(100) NOT NULL,
    "niveauxRequis" integer NOT NULL DEFAULT 1,
    "niveauActuel" integer NOT NULL DEFAULT 0,
    statut varchar(20) NOT NULL DEFAULT 'EN_COURS',
    "configRoles" text,
    historique text DEFAULT '[]',
    "dernierValidateurId" uuid,
    "dateCompletion" timestamp,
    commentaire text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

-- Index existants
CREATE INDEX IF NOT EXISTS idx_workflows_module_entite ON workflows_validation (module, "entiteId");
CREATE INDEX IF NOT EXISTS idx_workflows_statut_niveau ON workflows_validation (statut, "niveauActuel");
CREATE INDEX IF NOT EXISTS idx_workflows_etablissement ON workflows_validation ("etablissementId");
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows_validation ("createdAt");

-- Contrainte FK établissement
ALTER TABLE workflows_validation DROP CONSTRAINT IF EXISTS fk_workflows_etablissement;
ALTER TABLE workflows_validation
    ADD CONSTRAINT fk_workflows_etablissement
    FOREIGN KEY ("etablissementId")
    REFERENCES etablissements(id)
    ON DELETE CASCADE;

-- Contrainte FK dernierValidateur
ALTER TABLE workflows_validation DROP CONSTRAINT IF EXISTS fk_workflows_dernier_validateur;
ALTER TABLE workflows_validation
    ADD CONSTRAINT fk_workflows_dernier_validateur
    FOREIGN KEY ("dernierValidateurId")
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL;

-- Contrainte CHECK sur statut
ALTER TABLE workflows_validation DROP CONSTRAINT IF EXISTS ck_workflows_statut;
ALTER TABLE workflows_validation
    ADD CONSTRAINT ck_workflows_statut
    CHECK (statut IN ('EN_COURS', 'COMPLETEE', 'REJETEE', 'ANNULEE'));

-- ============================================
-- PARTIE 2 : Permissions validation par module
-- ============================================

INSERT INTO permissions (code, libelle, description, module, action, actif)
SELECT v.code,
       v.code || ' la validation',
       v.description,
       'validation',
       substr(v.code, 12), -- 'validation:' → action = reste du code
       true
FROM (VALUES
    ('validation:bulletins:level1', 'Valider les bulletins (niveau 1)', 'bulletins'),
    ('validation:bulletins:level2', 'Valider les bulletins (niveau 2)', 'bulletins'),
    ('validation:bulletins:level3', 'Valider les bulletins (niveau 3)', 'bulletins'),
    ('validation:personnel:level1', 'Valider le personnel (niveau 1)', 'personnel'),
    ('validation:personnel:level2', 'Valider le personnel (niveau 2)', 'personnel'),
    ('validation:matieres:level1', 'Valider les matières (niveau 1)', 'matieres'),
    ('validation:matieres:level2', 'Valider les matières (niveau 2)', 'matieres'),
    ('validation:matieres:level3', 'Valider les matières (niveau 3)', 'matieres'),
    ('validation:annees_scolaires:level1', 'Valider les années scolaires (niveau 1)', 'annees-scolaires'),
    ('validation:annees_scolaires:level2', 'Valider les années scolaires (niveau 2)', 'annees-scolaires'),
    ('validation:periodes:level1', 'Valider les périodes (niveau 1)', 'periodes'),
    ('validation:periodes:level2', 'Valider les périodes (niveau 2)', 'periodes'),
    ('validation:classes:level1', 'Valider les classes (niveau 1)', 'classes'),
    ('validation:classes:level2', 'Valider les classes (niveau 2)', 'classes'),
    ('validation:classes:level3', 'Valider les classes (niveau 3)', 'classes')
) AS v(code, description, categorie)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = v.code);

-- ============================================
-- PARTIE 3 : Config système require_validation
-- ============================================

INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, description, module, "modifiableRuntime", visible, ordre)
SELECT cle, valeur, 'BOOLEAN', 'MODULE', description, 'validation', true, true, ordre
FROM (VALUES
    ('bulletins.require_validation', 'true', 'Activer la validation des bulletins', 1),
    ('personnel.require_validation', 'true', 'Activer la validation du personnel', 2),
    ('matieres.require_validation', 'true', 'Activer la validation des matières', 3),
    ('annees_scolaires.require_validation', 'true', 'Activer la validation des années scolaires', 4),
    ('periodes.require_validation', 'true', 'Activer la validation des périodes', 5),
    ('classes.require_validation', 'true', 'Activer la validation des classes', 6)
) AS v(cle, valeur, description, ordre)
WHERE NOT EXISTS (SELECT 1 FROM parametres_systeme p WHERE p.cle = v.cle);
