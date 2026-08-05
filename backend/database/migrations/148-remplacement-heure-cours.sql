-- ==================================
-- eLISAschool - Migration 148: RemplacementHeureCours
-- ==================================
-- Table: remplacements_heure_cours
-- Permissions RBAC: heures-cours:export, heures-cours:remplacer:view/demand/validate
-- Paramètres validation workflow: heures_cours_remplacement.*
-- Audit actions: REMPLACEMENT_HEURE_COURS_*
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- ==================================

BEGIN;

-- ─── 1. Table remplacements_heure_cours ─────────────────────────

CREATE TABLE IF NOT EXISTS remplacements_heure_cours (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "heureCoursId" UUID NOT NULL REFERENCES heures_cours("id") ON DELETE CASCADE,
    "demandeurId" UUID NOT NULL REFERENCES membres_personnel("id"),
    "remplacantId" UUID REFERENCES membres_personnel("id"),
    "motif" TEXT NOT NULL,
    "statut" VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    "dateDemande" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidation" TIMESTAMP,
    "dateExecution" TIMESTAMP,
    "valideParId" UUID REFERENCES membres_personnel("id"),
    "commentaires" TEXT,
    "etablissementId" UUID NOT NULL REFERENCES etablissements("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_remplacements_etablissement ON remplacements_heure_cours("etablissementId");
CREATE INDEX IF NOT EXISTS idx_remplacements_heure_cours ON remplacements_heure_cours("heureCoursId");
CREATE INDEX IF NOT EXISTS idx_remplacements_statut ON remplacements_heure_cours("statut");
CREATE INDEX IF NOT EXISTS idx_remplacements_demandeur ON remplacements_heure_cours("demandeurId");
CREATE INDEX IF NOT EXISTS idx_remplacements_remplacant ON remplacements_heure_cours("remplacantId");

-- ─── 2. Permissions RBAC ────────────────────────────────────────

-- Nouvelles permissions
INSERT INTO permissions (code, label, description, module, created_at)
VALUES
    ('heures-cours:export', 'Exporter heures de cours', 'Exporter les heures de cours en CSV/PDF', 'personnel', NOW()),
    ('heures-cours:remplacer:view', 'Voir remplacements', 'Consulter les demandes de remplacement', 'personnel', NOW()),
    ('heures-cours:remplacer:demand', 'Demander remplacement', 'Créer une demande de remplacement', 'personnel', NOW()),
    ('heures-cours:remplacer:validate', 'Valider remplacement', 'Valider ou rejeter une demande de remplacement', 'personnel', NOW())
ON CONFLICT (code) DO NOTHING;

-- Attribution ADMIN / SUPER_ADMIN (toutes heures-cours + nouvelles)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN')
  AND p.code IN (
      'heures-cours:export',
      'heures-cours:remplacer:view',
      'heures-cours:remplacer:demand',
      'heures-cours:remplacer:validate'
  )
ON CONFLICT DO NOTHING;

-- Attribution CHEF_ETABLISSEMENT (view, export, demander)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.code IN (
      'heures-cours:export',
      'heures-cours:remplacer:view',
      'heures-cours:remplacer:demand'
  )
ON CONFLICT DO NOTHING;

-- ─── 3. Paramètres validation workflow ──────────────────────────

INSERT INTO parametres_systeme (cle, valeur, label, description, categorie, etablissement_id, created_at, updated_at)
VALUES
    ('heures_cours_remplacement.require_validation', 'true',
     'Validation des remplacements',
     'Activer la validation workflow pour les remplacements d''enseignants',
     'heures_cours', NULL, NOW(), NOW()),
    ('heures_cours_remplacement.validation_levels', '1',
     'Niveaux de validation',
     'Nombre de niveaux de validation requis pour les remplacements',
     'heures_cours', NULL, NOW(), NOW()),
    ('heures_cours_remplacement.validation_roles', '{"1":"ADMIN"}',
     'Rôles de validation',
     'Rôles autorisés à valider les remplacements par niveau',
     'heures_cours', NULL, NOW(), NOW())
ON CONFLICT (cle, COALESCE(etablissement_id, '00000000-0000-0000-0000-000000000000')) DO NOTHING;

-- ─── 4. Audit actions ───────────────────────────────────────────

-- Les actions d'audit sont définies dans l'enum TypeScript AuditAction.
-- Pas d'INSERT nécessaire en base (enum applicatif, pas PostgreSQL).

COMMIT;
