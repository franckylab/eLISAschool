-- ================================================================
-- eLISAschool - Migration du module Annonces
-- ================================================================
-- Version: 1.0.0
-- Description: Création des tables annonces et annonce_ciblages,
--              permissions RBAC, et paramètres système
-- ================================================================

-- ============================================================
-- 1. TABLE PRINCIPALE : ANNONCES
-- ============================================================

CREATE TABLE IF NOT EXISTS annonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre VARCHAR(200) NOT NULL,
    contenu TEXT NOT NULL,
    type_contenu VARCHAR(20) DEFAULT 'texte',
    priorite INTEGER DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'brouillon',
    validation VARCHAR(30) DEFAULT 'brouillon',
    date_debut TIMESTAMPTZ NOT NULL,
    date_fin TIMESTAMPTZ NOT NULL,
    date_validation TIMESTAMPTZ,
    valide_par UUID,
    motif_rejet VARCHAR(500),
    cible_globale BOOLEAN DEFAULT FALSE,
    ordre_affichage INTEGER DEFAULT 0,
    etablissement_id UUID NOT NULL,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_annonces_etablissement ON annonces(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_annonces_statut_dates ON annonces(statut, date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_annonces_cible_globale ON annonces(cible_globale);
CREATE INDEX IF NOT EXISTS idx_annonces_created_at ON annonces(created_at DESC);

-- ============================================================
-- 2. TABLE DE CIBLAGE : ANNONCE_CIBLAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS annonce_ciblages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annonce_id UUID NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
    type_cible VARCHAR(30) NOT NULL,
    cible_id VARCHAR(100) NOT NULL,
    cible_valeur VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_annonce_ciblages_annonce ON annonce_ciblages(annonce_id);
CREATE INDEX IF NOT EXISTS idx_annonce_ciblages_type_cible ON annonce_ciblages(type_cible, cible_id);

-- ============================================================
-- 3. PERMISSIONS RBAC
-- ============================================================

-- Permissions de base (CRUD)
INSERT INTO permissions (id, libelle, action, module, description) VALUES
    (gen_random_uuid(), 'Voir les annonces', 'annonce:view', 'annonces', 'Permission de voir les annonces'),
    (gen_random_uuid(), 'Créer des annonces', 'annonce:create', 'annonces', 'Permission de créer des annonces'),
    (gen_random_uuid(), 'Modifier des annonces', 'annonce:edit', 'annonces', 'Permission de modifier des annonces'),
    (gen_random_uuid(), 'Supprimer des annonces', 'annonce:delete', 'annonces', 'Permission de supprimer des annonces')
ON CONFLICT DO NOTHING;

-- Permissions de gestion
INSERT INTO permissions (id, libelle, action, module, description) VALUES
    (gen_random_uuid(), 'Gestion complète des annonces', 'annonce:manage', 'annonces', 'Permission de gestion complète'),
    (gen_random_uuid(), 'Configurer la bande d''annonces', 'annonce:configurer', 'annonces', 'Permission de configurer les annonces')
ON CONFLICT DO NOTHING;

-- Permissions de workflow et validation
INSERT INTO permissions (id, libelle, action, module, description) VALUES
    (gen_random_uuid(), 'Valider/refuser des annonces', 'annonce:valider', 'annonces', 'Permission de valider les annonces'),
    (gen_random_uuid(), 'Publier/activer des annonces', 'annonce:publier', 'annonces', 'Permission de publier des annonces'),
    (gen_random_uuid(), 'Programmer des annonces', 'annonce:programmer', 'annonces', 'Permission de programmer des annonces'),
    (gen_random_uuid(), 'Archiver des annonces', 'annonce:archiver', 'annonces', 'Permission d''archiver des annonces'),
    (gen_random_uuid(), 'Désactiver des annonces', 'annonce:desactiver', 'annonces', 'Permission de désactiver des annonces'),
    (gen_random_uuid(), 'Activer des annonces', 'annonce:activer', 'annonces', 'Permission d''activer des annonces')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ============================================================

-- SUPER_ADMIN : toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
  AND p.module = 'annonces'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- ADMIN : toutes les permissions sauf gestion configuration
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.module = 'annonces'
  AND p.action IN ('annonce:view', 'annonce:create', 'annonce:edit', 'annonce:delete', 'annonce:manage', 'annonce:valider', 'annonce:publier', 'annonce:programmer', 'annonce:archiver', 'annonce:desactiver', 'annonce:activer')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- CHEF_ETABLISSEMENT : permissions complètes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.module = 'annonces'
  AND p.action IN ('annonce:view', 'annonce:create', 'annonce:edit', 'annonce:delete', 'annonce:manage', 'annonce:valider', 'annonce:publier', 'annonce:programmer', 'annonce:archiver', 'annonce:desactiver', 'annonce:activer')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- ENSEIGNANT, PERSONNEL, PARENT, ELEVE : lecture seule
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ENSEIGNANT', 'PERSONNEL', 'PARENT', 'ELEVE')
  AND p.module = 'annonces'
  AND p.action = 'annonce:view'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. PARAMÈTRES SYSTÈME POUR LA CONFIGURATION
-- ============================================================

INSERT INTO parametres_systeme (cle, libelle, description, valeur, type, categorie, etablissement_id, modifiable) VALUES
    ('annonces.actif', 'Module annonces actif', 'Activation globale du module annonces', 'true', 'boolean', 'annonces', NULL, true),
    ('annonces.require_validation', 'Validation requise', 'Exiger la validation avant publication', 'false', 'boolean', 'annonces', NULL, true),
    ('annonces.validation_levels', 'Niveaux de validation', 'Nombre de niveaux de validation', '1', 'number', 'annonces', NULL, true),
    ('annonces.validation_roles', 'Rôles de validation', 'Rôles autorisés à valider', '{"1": "ADMIN"}', 'json', 'annonces', NULL, true),
    ('annonces.vitesse_defilement', 'Vitesse de défilement', 'Vitesse de défilement en pixels/seconde', '50', 'number', 'annonces', NULL, true),
    ('annonces.hauteur_bande', 'Hauteur de la bande', 'Hauteur de la bande en pixels', '40', 'number', 'annonces', NULL, true),
    ('annonces.intervalle_actualisation', 'Intervalle d''actualisation', 'Intervalle de rafraîchissement en secondes', '30', 'number', 'annonces', NULL, true),
    ('annonces.types_contenu_autorises', 'Types de contenu', 'Types de contenu autorisés', '["texte", "html"]', 'json', 'annonces', NULL, true),
    ('annonces.taille_max_contenu', 'Taille max du contenu', 'Taille maximale du contenu en caractères', '5000', 'number', 'annonces', NULL, true),
    ('annonces.pause_sur_vol', 'Pause au survol', 'Pause du défilement au survol', 'true', 'boolean', 'annonces', NULL, true),
    ('annonces.arret_automatique', 'Arrêt automatique', 'Arrêt automatique après X secondes (0 = jamais)', '0', 'number', 'annonces', NULL, true),
    ('annonces.delai_apparition', 'Délai d''apparition', 'Délai avant première apparition (secondes)', '600', 'number', 'annonces', NULL, true),
    ('annonces.delai_reapparition', 'Délai de réapparition', 'Délai de réapparition périodique (0 = désactivé)', '600', 'number', 'annonces', NULL, true)
ON CONFLICT (cle) DO NOTHING;

-- ============================================================
-- 6. VÉRIFICATION
-- ============================================================

DO $$
DECLARE
    table_count INTEGER;
    permission_count INTEGER;
    param_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('annonces', 'annonce_ciblages');

    SELECT COUNT(*) INTO permission_count
    FROM permissions
    WHERE module = 'annonces';

    SELECT COUNT(*) INTO param_count
    FROM parametres_systeme
    WHERE cle LIKE 'annonces.%';

    RAISE NOTICE 'Migration module Annonces terminée';
    RAISE NOTICE '  - Tables créées: %', table_count;
    RAISE NOTICE '  - Permissions créées: %', permission_count;
    RAISE NOTICE '  - Paramètres créés: %', param_count;
END $$;
