/**
 * ==================================
 * eLISAschool - Migration 036: Module Types Enum
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Création de la table types_enum pour la gestion dynamique
 * des types énumérés simples avec protection des types système
 */

-- ==================================
-- TABLE: types_enum
-- ==================================

CREATE TABLE IF NOT EXISTS types_enum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    est_systeme BOOLEAN NOT NULL DEFAULT false,
    est_actif BOOLEAN NOT NULL DEFAULT true,
    ordre INTEGER NOT NULL DEFAULT 0,
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==================================
-- INDEXES
-- ==================================

-- Index sur categorie pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_types_enum_categorie ON types_enum(categorie);

-- Index sur code pour recherche
CREATE INDEX IF NOT EXISTS idx_types_enum_code ON types_enum(code);

-- Index composite unique: un code ne peut exister qu'une seule fois par catégorie et établissement
CREATE UNIQUE INDEX IF NOT EXISTS idx_types_enum_categorie_code_etablissement 
ON types_enum(categorie, code, COALESCE(etablissement_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Index sur etablissement_id pour filtrage multi-tenant
CREATE INDEX IF NOT EXISTS idx_types_enum_etablissement_id ON types_enum(etablissement_id);

-- Index sur est_systeme pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_types_enum_est_systeme ON types_enum(est_systeme);

-- Index sur est_actif pour filtrage des types actifs
CREATE INDEX IF NOT EXISTS idx_types_enum_est_actif ON types_enum(est_actif);

-- ==================================
-- SEED: Types système (immuables)
-- ==================================

-- TYPE_DOCUMENT
INSERT INTO types_enum (categorie, code, libelle, est_systeme, ordre) VALUES
    ('TYPE_DOCUMENT', 'BULLETIN', 'Bulletin', true, 1),
    ('TYPE_DOCUMENT', 'CERTIFICAT', 'Certificat', true, 2),
    ('TYPE_DOCUMENT', 'ATTESTATION', 'Attestation', true, 3),
    ('TYPE_DOCUMENT', 'CARTE_SCOLAIRE', 'Carte scolaire', true, 4),
    ('TYPE_DOCUMENT', 'CARTE_CANTINE', 'Carte cantine', true, 5),
    ('TYPE_DOCUMENT', 'CARTE_TRANSPORT', 'Carte transport', true, 6),
    ('TYPE_DOCUMENT', 'FORMULAIRE', 'Formulaire', true, 7),
    ('TYPE_DOCUMENT', 'CONTRAT', 'Contrat', true, 8),
    ('TYPE_DOCUMENT', 'FACTURE', 'Facture', true, 9),
    ('TYPE_DOCUMENT', 'RECU', 'Reçu', true, 10),
    ('TYPE_DOCUMENT', 'AUTRE', 'Autre', true, 99)
ON CONFLICT DO NOTHING;

-- STATUT_REQUETE
INSERT INTO types_enum (categorie, code, libelle, est_systeme, ordre) VALUES
    ('STATUT_REQUETE', 'BROUILLON', 'Brouillon', true, 1),
    ('STATUT_REQUETE', 'EN_ATTENTE', 'En attente', true, 2),
    ('STATUT_REQUETE', 'EN_COURS', 'En cours', true, 3),
    ('STATUT_REQUETE', 'APPROUVE', 'Approuvé', true, 4),
    ('STATUT_REQUETE', 'REJETE', 'Rejeté', true, 5),
    ('STATUT_REQUETE', 'ANNULE', 'Annulé', true, 6)
ON CONFLICT DO NOTHING;

-- STATUT_DOCUMENT
INSERT INTO types_enum (categorie, code, libelle, est_systeme, ordre) VALUES
    ('STATUT_DOCUMENT', 'BROUILLON', 'Brouillon', true, 1),
    ('STATUT_DOCUMENT', 'EN_ATTENTE_VALIDATION', 'En attente de validation', true, 2),
    ('STATUT_DOCUMENT', 'VALIDE', 'Validé', true, 3),
    ('STATUT_DOCUMENT', 'ARCHIVE', 'Archivé', true, 4),
    ('STATUT_DOCUMENT', 'SUPPRIME', 'Supprimé', true, 5)
ON CONFLICT DO NOTHING;

-- GENRE
INSERT INTO types_enum (categorie, code, libelle, est_systeme, ordre) VALUES
    ('GENRE', 'M', 'Masculin', true, 1),
    ('GENRE', 'F', 'Féminin', true, 2),
    ('GENRE', 'A', 'Autre', true, 3)
ON CONFLICT DO NOTHING;

-- TYPE_ETABLISSEMENT
INSERT INTO types_enum (categorie, code, libelle, est_systeme, ordre) VALUES
    ('TYPE_ETABLISSEMENT', 'MATERNELLE', 'Maternelle', true, 1),
    ('TYPE_ETABLISSEMENT', 'PRIMAIRE', 'Primaire', true, 2),
    ('TYPE_ETABLISSEMENT', 'COLLEGE', 'Collège', true, 3),
    ('TYPE_ETABLISSEMENT', 'LYCEE', 'Lycée', true, 4),
    ('TYPE_ETABLISSEMENT', 'MIXTE', 'Mixte', true, 5)
ON CONFLICT DO NOTHING;

-- STATUT_UTILISATEUR
INSERT INTO types_enum (categorie, code, libelle, est_systeme, ordre) VALUES
    ('STATUT_UTILISATEUR', 'ACTIF', 'Actif', true, 1),
    ('STATUT_UTILISATEUR', 'INACTIF', 'Inactif', true, 2),
    ('STATUT_UTILISATEUR', 'SUSPENDU', 'Suspendu', true, 3),
    ('STATUT_UTILISSEUR', 'EN_ATTENTE_VALIDATION', 'En attente de validation', true, 4)
ON CONFLICT DO NOTHING;

-- ==================================
-- PERMISSIONS RBAC
-- ==================================

-- Vérifier si les permissions existent déjà
DO $$
BEGIN
    -- Permission: types_enum:view
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'TYPES_ENUM_VIEW') THEN
        INSERT INTO permissions (code, libelle, groupe, description)
        VALUES ('TYPES_ENUM_VIEW', 'Voir les types enum', 'types-enum', 'Consulter la liste des types enum');
    END IF;

    -- Permission: types_enum:create
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'TYPES_ENUM_CREATE') THEN
        INSERT INTO permissions (code, libelle, groupe, description)
        VALUES ('TYPES_ENUM_CREATE', 'Créer des types enum', 'types-enum', 'Créer de nouveaux types enum personnalisés');
    END IF;

    -- Permission: types_enum:edit
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'TYPES_ENUM_EDIT') THEN
        INSERT INTO permissions (code, libelle, groupe, description)
        VALUES ('TYPES_ENUM_EDIT', 'Modifier les types enum', 'types-enum', 'Modifier les types enum personnalisés');
    END IF;

    -- Permission: types_enum:delete
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'TYPES_ENUM_DELETE') THEN
        INSERT INTO permissions (code, libelle, groupe, description)
        VALUES ('TYPES_ENUM_DELETE', 'Supprimer les types enum', 'types-enum', 'Supprimer les types enum personnalisés');
    END IF;

    -- Permission: types_enum:toggle
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'TYPES_ENUM_TOGGLE') THEN
        INSERT INTO permissions (code, libelle, groupe, description)
        VALUES ('TYPES_ENUM_TOGGLE', 'Activer/désactiver les types enum', 'types-enum', 'Activer ou désactiver les types enum personnalisés');
    END IF;
END $$;

-- ==================================
-- ATTRIBUTION AUX RÔLES ADMIN
-- ==================================

-- Attribuer les permissions aux rôles ADMIN et SUPER_ADMIN
DO $$
DECLARE
    admin_role_id UUID;
    super_admin_role_id UUID;
    perm_view_id UUID;
    perm_create_id UUID;
    perm_edit_id UUID;
    perm_delete_id UUID;
    perm_toggle_id UUID;
BEGIN
    -- Récupérer les IDs des rôles
    SELECT id INTO admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;
    SELECT id INTO super_admin_role_id FROM roles WHERE code = 'SUPER_ADMIN' LIMIT 1;

    -- Récupérer les IDs des permissions
    SELECT id INTO perm_view_id FROM permissions WHERE code = 'TYPES_ENUM_VIEW' LIMIT 1;
    SELECT id INTO perm_create_id FROM permissions WHERE code = 'TYPES_ENUM_CREATE' LIMIT 1;
    SELECT id INTO perm_edit_id FROM permissions WHERE code = 'TYPES_ENUM_EDIT' LIMIT 1;
    SELECT id INTO perm_delete_id FROM permissions WHERE code = 'TYPES_ENUM_DELETE' LIMIT 1;
    SELECT id INTO perm_toggle_id FROM permissions WHERE code = 'TYPES_ENUM_TOGGLE' LIMIT 1;

    -- Attribuer au rôle ADMIN
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES 
            (admin_role_id, perm_view_id),
            (admin_role_id, perm_create_id),
            (admin_role_id, perm_edit_id),
            (admin_role_id, perm_delete_id),
            (admin_role_id, perm_toggle_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Attribuer au rôle SUPER_ADMIN
    IF super_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES 
            (super_admin_role_id, perm_view_id),
            (super_admin_role_id, perm_create_id),
            (super_admin_role_id, perm_edit_id),
            (super_admin_role_id, perm_delete_id),
            (super_admin_role_id, perm_toggle_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ==================================
-- COMMENTAIRES
-- ==================================

COMMENT ON TABLE types_enum IS 'Gestion dynamique des types énumérés simples avec protection des types système';
COMMENT ON COLUMN types_enum.categorie IS 'Catégorie du type enum (TYPE_DOCUMENT, STATUT_REQUETE, etc.)';
COMMENT ON COLUMN types_enum.code IS 'Code technique du type (BULLETIN, CERTIFICAT, etc.)';
COMMENT ON COLUMN types_enum.libelle IS 'Libellé affiché à l''utilisateur';
COMMENT ON COLUMN types_enum.est_systeme IS 'true = type système protégé (non supprimable, libellé seul modifiable)';
COMMENT ON COLUMN types_enum.est_actif IS 'true = type actif et visible dans les formulaires';
COMMENT ON COLUMN types_enum.ordre IS 'Ordre de tri dans les listes déroulantes';
COMMENT ON COLUMN types_enum.etablissement_id IS 'NULL = type système/global, sinon lié à un établissement';
