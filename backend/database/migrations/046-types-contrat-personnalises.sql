-- ====================================================
-- Migration: Types de Contrat Personnalisables & Affectations Postes
-- Description: Support des types de contrat dynamiques et suivi des mutations
-- Date: 2026-06-09
-- ====================================================

-- ==========================================
-- PHASE 1: Types de Contrat Personnalisables
-- ==========================================

-- 1. Créer la table des types de contrat personnalisés
CREATE TABLE IF NOT EXISTS types_contrat_personnalises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categorie VARCHAR(50) NOT NULL DEFAULT 'EMPLOI_PERMANENT',
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    est_systeme BOOLEAN NOT NULL DEFAULT FALSE,
    ordre INTEGER NOT NULL DEFAULT 0,
    renouvellement_auto_defaut BOOLEAN NOT NULL DEFAULT FALSE,
    duree_max_mois INTEGER,
    clauses_defaut JSONB,
    avantages_defaut JSONB,
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_code_etablissement UNIQUE (code, etablissement_id)
);

-- Index pour la table types_contrat_personnalises
CREATE INDEX IF NOT EXISTS idx_types_contrat_etablissement ON types_contrat_personnalises(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_types_contrat_categorie ON types_contrat_personnalises(categorie);
CREATE INDEX IF NOT EXISTS idx_types_contrat_actif ON types_contrat_personnalises(actif);
CREATE INDEX IF NOT EXISTS idx_types_contrat_systeme ON types_contrat_personnalises(est_systeme);

-- 2. Insérer les types système par défaut
INSERT INTO types_contrat_personnalises (code, nom, categorie, ordre, est_systeme, actif, etablissement_id)
VALUES 
    ('CDD', 'Contrat à Durée Déterminée', 'EMPLOI_TEMPORAIRE', 1, TRUE, TRUE, NULL),
    ('CDI', 'Contrat à Durée Indéterminée', 'EMPLOI_PERMANENT', 2, TRUE, TRUE, NULL),
    ('VACATAIRE', 'Vacataire', 'EMPLOI_TEMPORAIRE', 3, TRUE, TRUE, NULL),
    ('STAGIAIRE', 'Stagiaire', 'STAGE_FORMATION', 4, TRUE, TRUE, NULL)
ON CONFLICT (code, etablissement_id) DO NOTHING;

-- 3. Modifier la table contrats_personnel pour supporter les types personnalisés
-- Ajouter la colonne type_contrat_id (nullable pour compatibilité)
ALTER TABLE contrats_personnel 
ADD COLUMN IF NOT EXISTS type_contrat_id UUID REFERENCES types_contrat_personnalises(id);

-- Modifier la colonne type_contrat de varchar(30) à varchar(50)
ALTER TABLE contrats_personnel 
ALTER COLUMN type_contrat TYPE VARCHAR(50);

-- Index pour la nouvelle relation
CREATE INDEX IF NOT EXISTS idx_contrats_type_contrat_id ON contrats_personnel(type_contrat_id);

-- 4. Migrer les données existantes : associer les contrats aux types système
UPDATE contrats_personnel c
SET type_contrat_id = tcp.id
FROM types_contrat_personnalises tcp
WHERE c.type_contrat = tcp.code 
AND tcp.est_systeme = TRUE
AND c.type_contrat_id IS NULL;

-- ==========================================
-- PHASE 2: Affectations & Mutations
-- ==========================================

-- 5. Créer la table des affectations de postes
CREATE TABLE IF NOT EXISTS affectations_postes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id) ON DELETE CASCADE,
    poste_id UUID NOT NULL REFERENCES postes(id) ON DELETE CASCADE,
    contrat_id UUID REFERENCES contrats_personnel(id),
    unite_organisationnelle_id UUID REFERENCES unites_organisationnelles(id),
    
    date_debut TIMESTAMP NOT NULL DEFAULT NOW(),
    date_fin TIMESTAMP,
    
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF', -- ACTIF, TERMINE, MUTATION
    type_mutation VARCHAR(30) NOT NULL DEFAULT 'NOUVELLE', -- NOUVELLE, PROMOTION, TRANSFERT, INTERIM
    
    salaire_associe DECIMAL(12,0),
    commentaire TEXT,
    
    -- Traçabilité
    valide_par_id UUID,
    date_validation TIMESTAMP,
    
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la table affectations_postes
CREATE INDEX IF NOT EXISTS idx_affectations_membre ON affectations_postes(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_affectations_poste ON affectations_postes(poste_id);
CREATE INDEX IF NOT EXISTS idx_affectations_contrat ON affectations_postes(contrat_id);
CREATE INDEX IF NOT EXISTS idx_affectations_statut ON affectations_postes(statut);
CREATE INDEX IF NOT EXISTS idx_affectations_etablissement ON affectations_postes(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_affectations_dates ON affectations_postes(membre_personnel_id, date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_affectations_poste_statut ON affectations_postes(poste_id, statut);

-- 6. Ajouter les colonnes de lien à ContratPersonnel (poste et unité)
ALTER TABLE contrats_personnel 
ADD COLUMN IF NOT EXISTS poste_id UUID REFERENCES postes(id),
ADD COLUMN IF NOT EXISTS unite_organisationnelle_id UUID REFERENCES unites_organisationnelles(id);

CREATE INDEX IF NOT EXISTS idx_contrats_poste ON contrats_personnel(poste_id);
CREATE INDEX IF NOT EXISTS idx_contrats_unite ON contrats_personnel(unite_organisationnelle_id);

-- ==========================================
-- PHASE 3: Audit Trail & Permissions
-- ==========================================

-- 7. Ajouter les nouvelles permissions RBAC
INSERT INTO permissions (code, libelle, module, action, description, actif, "createdAt", "updatedAt")
VALUES 
    -- Types de contrat
    ('rh_types_contrat:manage', 'Gérer les types de contrat', 'personnel', 'manage', 'Créer, modifier et supprimer les types de contrat personnalisés', true, NOW(), NOW()),
    ('rh_types_contrat:view', 'Voir les types de contrat', 'personnel', 'view', 'Consulter les types de contrat', true, NOW(), NOW()),
    
    -- Affectations
    ('rh_affectations:manage', 'Gérer les affectations', 'personnel', 'manage', 'Créer, modifier et supprimer les affectations de postes', true, NOW(), NOW()),
    ('rh_affectations:view', 'Voir les affectations', 'personnel', 'view', 'Consulter les affectations et mutations', true, NOW(), NOW()),
    ('rh_affectations:validate', 'Valider les mutations', 'personnel', 'validate', 'Valider les mutations/promotions', true, NOW(), NOW()),
    
    -- Parcours professionnel
    ('rh_parcours:view', 'Voir le parcours professionnel', 'personnel', 'view', 'Consulter le parcours complet d un membre', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 8. Attribution des permissions aux rôles
-- ADMIN & SUPER_ADMIN: Accès total
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
AND p.code IN ('rh_types_contrat:manage', 'rh_types_contrat:view', 'rh_affectations:manage', 'rh_affectations:view', 'rh_affectations:validate', 'rh_parcours:view')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- CHEF_ETABLISSEMENT: Gestion courante
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
AND p.code IN ('rh_types_contrat:view', 'rh_affectations:manage', 'rh_affectations:view', 'rh_parcours:view')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 9. Ajouter les actions d'audit (documentation pour le fichier TypeScript)
-- Les actions suivantes doivent être ajoutées dans audit-log.entity.ts:
-- TYPE_CONTRAT_CREATE, TYPE_CONTRAT_UPDATE, TYPE_CONTRAT_DELETE
-- AFFECTATION_POSTE_CREATE, AFFECTATION_POSTE_UPDATE, AFFECTATION_POSTE_TERMINER
-- MUTATION_HIERARCHIQUE, VALIDATION_MUTATION

-- ==========================================
-- PHASE 4: Paramètres de Configuration
-- ==========================================

-- 10. Ajouter les paramètres de configuration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parametres_configurations') THEN
        INSERT INTO parametres_configurations (cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
        VALUES 
            ('personnel.affectation_require_validation', 'false', 'boolean', 'personnel', 'Validation des mutations', 'Exiger validation pour les mutations/promotions', NOW(), NOW()),
            ('personnel.types_contrat_cache_ttl', '600', 'number', 'personnel', 'Cache types de contrat', 'Durée de vie du cache des types de contrat (secondes)', NOW(), NOW()),
            ('personnel.alerte_mutation_jours', '7', 'number', 'personnel', 'Alerte mutation', 'Jours avant alerte de fin d''affectation', NOW(), NOW())
        ON CONFLICT (cle) DO NOTHING;
    END IF;
END $$;

-- ==========================================
-- VÉRIFICATION
-- ==========================================

DO $$
DECLARE
    total_types INTEGER;
    total_affectations INTEGER;
    total_perms INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_types FROM types_contrat_personnalises WHERE est_systeme = TRUE;
    SELECT COUNT(*) INTO total_affectations FROM affectations_postes;
    SELECT COUNT(*) INTO total_perms FROM permissions WHERE code LIKE 'rh_%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Types Contrat & Affectations terminée!';
    RAISE NOTICE 'Types système créés: %', total_types;
    RAISE NOTICE 'Permissions RH totales: %', total_perms;
    RAISE NOTICE '========================================';
END $$;

-- ====================================================
-- FIN Migration Types Contrat Personnalisables & Affectations
-- ====================================================
