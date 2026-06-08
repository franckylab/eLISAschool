-- ====================================================
-- Migration: Module Personnel RH - Phase 1
-- Description: Contrats de travail & Heures de cours
-- Date: 2026-02-07
-- ====================================================

-- 1. Créer la table des contrats de travail
CREATE TABLE IF NOT EXISTS contrats_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id) ON DELETE CASCADE,
    type_contrat VARCHAR(30) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    salaire_base DECIMAL(12,0) NOT NULL,
    tarif_horaire DECIMAL(10,0),
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    renouvellement_auto BOOLEAN NOT NULL DEFAULT FALSE,
    clauses TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la table contrats_personnel
CREATE INDEX IF NOT EXISTS idx_contrats_membre ON contrats_personnel(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_contrats_etablissement ON contrats_personnel(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_contrats_statut ON contrats_personnel(statut);
CREATE INDEX IF NOT EXISTS idx_contrats_type ON contrats_personnel(type_contrat);

-- 2. Créer la table des heures de cours
CREATE TABLE IF NOT EXISTS heures_cours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enseignant_id UUID NOT NULL REFERENCES membres_personnel(id),
    classe_id UUID NOT NULL REFERENCES classes(id),
    matiere_id UUID NOT NULL REFERENCES matieres(id),
    periode_id UUID REFERENCES periodes(id),
    date DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    statut_effectue VARCHAR(30) NOT NULL DEFAULT 'PLANIFIE',
    salle VARCHAR(100),
    remplacant_id UUID REFERENCES membres_personnel(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la table heures_cours
CREATE INDEX IF NOT EXISTS idx_heures_enseignant ON heures_cours(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_heures_classe ON heures_cours(classe_id);
CREATE INDEX IF NOT EXISTS idx_heures_date ON heures_cours(date);
CREATE INDEX IF NOT EXISTS idx_heures_periode ON heures_cours(periode_id);
CREATE INDEX IF NOT EXISTS idx_heures_etablissement ON heures_cours(etablissement_id);
-- Index composite pour détection de conflits de créneaux
CREATE INDEX IF NOT EXISTS idx_heures_enseignant_date_heure ON heures_cours(enseignant_id, date, heure_debut);

-- 3. Ajouter les permissions RBAC pour les contrats
INSERT INTO permissions (id, code, label, module, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'rh_contrats:manage', 'Gérer les contrats', 'personnel', 'Créer, modifier et supprimer les contrats', NOW(), NOW()),
    (gen_random_uuid(), 'rh_contrats:view', 'Voir les contrats', 'personnel', 'Consulter les contrats', NOW(), NOW()),
    (gen_random_uuid(), 'rh_contrats:validate', 'Valider les contrats', 'personnel', 'Valider les contrats via workflow', NOW(), NOW()),
    (gen_random_uuid(), 'rh_heures_cours:manage', 'Gérer les heures de cours', 'personnel', 'Créer, modifier et supprimer les créneaux', NOW(), NOW()),
    (gen_random_uuid(), 'rh_heures_cours:view', 'Voir les heures de cours', 'personnel', 'Consulter les créneaux et volumes horaires', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Attribution des permissions aux rôles ADMIN et SUPER_ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
AND p.code IN ('rh_contrats:manage', 'rh_contrats:view', 'rh_contrats:validate')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT')
AND p.code IN ('rh_heures_cours:manage', 'rh_heures_cours:view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Ajouter les paramètres de configuration
INSERT INTO parametres_configurations (id, cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'personnel.contrat_require_validation', 'false', 'boolean', 'personnel', 'Validation workflow contrats', 'Exiger validation workflow pour les contrats', NOW(), NOW()),
    (gen_random_uuid(), 'personnel.contrat_alerte_expiration_jours', '30', 'number', 'personnel', 'Alerte expiration contrats', 'Nombre de jours avant alerte expiration contrat', NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- 5. Ajouter les actions d'audit (via INSERT dans enum TypeScript - documentation)
-- Les actions suivantes sont ajoutées dans audit-log.entity.ts:
-- - CONTRAT_PERSONNEL_CREATE
-- - CONTRAT_PERSONNEL_UPDATE  
-- - CONTRAT_PERSONNEL_DELETE
-- - HEURE_COURS_CREATE
-- - HEURE_COURS_UPDATE
-- - HEURE_COURS_DELETE

-- 6. Commentaires sur les tables
COMMENT ON TABLE contrats_personnel IS 'Contrats de travail des membres du personnel';
COMMENT ON TABLE heures_cours IS 'Créneaux de cours des enseignants';

COMMENT ON COLUMN contrats_personnel.type_contrat IS 'Type: CDD, CDI, VACATAIRE, STAGIAIRE';
COMMENT ON COLUMN contrats_personnel.statut IS 'Statut: ACTIF, EXPIRE, RENEGOCIE, ROMPU';
COMMENT ON COLUMN heures_cours.statut_effectue IS 'Statut: PLANIFIE, EFFECTUE, ANNULE, REMPLACE';

-- ====================================================
-- FIN Migration Phase 1
-- ====================================================
