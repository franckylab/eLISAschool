-- ==================================
-- eLISAschool - Migration 102 : Périodes Hiérarchiques
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Refonte complète du système de périodes :
-- 1. Suppression de l'entité TypePeriode (table types_periodes)
-- 2. Suppression des champs typeId, ordre, poids sur periodes
-- 3. Ajout du champ type (enum inline) sur periodes
-- 4. Création de la table periode_compositions (hiérarchie parent-enfant)
-- 5. Migration des données existantes
-- 6. Seed des paramètres système
-- ==================================

-- =============================================
-- ÉTAPE 1 : Créer la table periode_compositions
-- =============================================

CREATE TABLE IF NOT EXISTS periode_compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "periodeParentId" UUID NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
    "periodeEnfantId" UUID NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
    ordre INTEGER NOT NULL DEFAULT 0,
    poids DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_composition UNIQUE ("periodeParentId", "periodeEnfantId"),
    CONSTRAINT ck_different_periodes CHECK ("periodeParentId" != "periodeEnfantId")
);

CREATE INDEX IF NOT EXISTS idx_composition_parent ON periode_compositions("periodeParentId");
CREATE INDEX IF NOT EXISTS idx_composition_enfant ON periode_compositions("periodeEnfantId");
CREATE INDEX IF NOT EXISTS idx_composition_parent_ordre ON periode_compositions("periodeParentId", ordre);

-- =============================================
-- ÉTAPE 2 : Ajouter la colonne type (enum inline) sur periodes
-- =============================================

ALTER TABLE periodes ADD COLUMN IF NOT EXISTS type VARCHAR(20);

-- Migrer les types existants depuis types_periodes vers l'enum inline
UPDATE periodes p
SET type = tp.code
FROM types_periodes tp
WHERE p."typeId" = tp.id
  AND p.type IS NULL;

-- Fallback pour les périodes sans type (au cas où)
UPDATE periodes
SET type = 'TRIMESTRE'
WHERE type IS NULL;

-- =============================================
-- ÉTAPE 3 : Migrer les données — restructuration hiérarchique
-- Pour chaque année scolaire, les anciens trimestres deviennent des parents
-- et on crée 2 évaluations enfants par trimestre
-- Les notes existantes sont migrées vers la 1ère évaluation
-- =============================================

-- Note : Cette migration est conçue pour être exécutée sur des données existantes
-- avec des trimestres. Pour les nouvelles installations, les templates seront utilisés.

DO $$
DECLARE
    v_periode RECORD;
    v_seq1_id UUID;
    v_seq2_id UUID;
    v_ordre INTEGER;
BEGIN
    -- Parcourir toutes les périodes existantes qui sont de type TRIMESTRE, SEMESTRE ou ANNEE
    -- (ce sont des parents potentiels)
    FOR v_periode IN
        SELECT p.*
        FROM periodes p
        WHERE p.type IN ('TRIMESTRE', 'SEMESTRE', 'ANNEE')
          AND NOT EXISTS (
              SELECT 1 FROM periode_compositions pc
              WHERE pc."periodeParentId" = p.id
          )
        ORDER BY p."anneeScolaireId", p."dateDebut"
    LOOP
        -- Créer 2 évaluations enfants par défaut
        v_seq1_id := gen_random_uuid();
        v_seq2_id := gen_random_uuid();

        INSERT INTO periodes (
            id, nom, type, "anneeScolaireId", "etablissementId",
            "dateDebut", "dateFin", statut, "createdAt", "updatedAt"
        ) VALUES (
            v_seq1_id,
            v_periode.nom || ' - Évaluation 1',
            'EVALUATION',
            v_periode."anneeScolaireId",
            v_periode."etablissementId",
            v_periode."dateDebut",
            -- L'évaluation 1 couvre la première moitié de la période parent
            v_periode."dateDebut" + ((v_periode."dateFin" - v_periode."dateDebut") / 2),
            v_periode.statut,
            NOW(),
            NOW()
        ), (
            v_seq2_id,
            v_periode.nom || ' - Évaluation 2',
            'EVALUATION',
            v_periode."anneeScolaireId",
            v_periode."etablissementId",
            -- L'évaluation 2 commence au milieu
            v_periode."dateDebut" + ((v_periode."dateFin" - v_periode."dateDebut") / 2) + INTERVAL '1 day',
            v_periode."dateFin",
            v_periode.statut,
            NOW(),
            NOW()
        );

        -- Créer les compositions
        INSERT INTO periode_compositions ("periodeParentId", "periodeEnfantId", ordre, poids)
        VALUES
            (v_periode.id, v_seq1_id, 1, 1.0),
            (v_periode.id, v_seq2_id, 2, 1.0);

        -- Migrer les notes existantes vers la 1ère évaluation
        UPDATE notes
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        -- Migrer les bulletins existants vers la 1ère évaluation
        UPDATE bulletins
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        -- Migrer les scores existants vers la 1ère évaluation
        UPDATE scores_eleves
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        -- Migrer les incidents, observations, sanctions (suivi élèves)
        UPDATE incidents_eleves
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        UPDATE observations_eleves
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        UPDATE sanctions_eleves
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        -- Migrer le suivi personnel
        UPDATE scoring_personnel
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        UPDATE incidents_personnel
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

        UPDATE evaluation_personnel
        SET "periodeId" = v_seq1_id
        WHERE "periodeId" = v_periode.id;

    END LOOP;
END $$;

-- =============================================
-- ÉTAPE 4 : Supprimer les anciennes colonnes de periodes
-- =============================================

-- Supprimer la contrainte FK typeId d'abord
ALTER TABLE periodes DROP CONSTRAINT IF EXISTS "FK_periodes_types_periodes";

-- Supprimer les index liés
DROP INDEX IF EXISTS idx_periodes_type_id;

-- Supprimer la colonne typeId
ALTER TABLE periodes DROP COLUMN IF EXISTS "typeId";

-- Supprimer la colonne ordre
ALTER TABLE periodes DROP COLUMN IF EXISTS ordre;

-- Supprimer la colonne poids
ALTER TABLE periodes DROP COLUMN IF EXISTS poids;

-- Rendre le champ type NOT NULL
ALTER TABLE periodes ALTER COLUMN type SET NOT NULL;

-- =============================================
-- ÉTAPE 5 : Supprimer la table types_periodes
-- =============================================

DROP TABLE IF EXISTS types_periodes;

-- =============================================
-- ÉTAPE 6 : Ajouter les index sur periodes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_periodes_type ON periodes(type);
CREATE INDEX IF NOT EXISTS idx_periodes_annee_type ON periodes("anneeScolaireId", type);

-- =============================================
-- ÉTAPE 7 : Seed des paramètres système
-- =============================================

-- Paramètres de configuration par type de période
INSERT INTO parametres_systeme (cle, valeur, description, "estPublic", "createdAt", "updatedAt")
VALUES
    ('periodes.saisie_notes_directe', 'true', 'Autoriser la saisie de notes à tout niveau de période', false, NOW(), NOW()),
    ('periodes.calcul_composition', 'composee', 'Mode de calcul du bulletin parent : composee (moyenne pondérée des enfants) ou directe (notes brutes)', false, NOW(), NOW()),
    ('periodes.bulletin_genere', 'true', 'Générer un bulletin pour chaque type de période', false, NOW(), NOW()),
    ('periodes.verrouillage_cascade', 'false', 'Mode de clôture cascade : false (indépendant), cascade (auto-enfants), require_children (bloquer si enfants ouverts)', false, NOW(), NOW()),
    ('periodes.nombre_enfants', '2', 'Nombre d''enfants attendus par défaut pour un parent (utilisé par les templates)', false, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- =============================================
-- ÉTAPE 8 : Permissions RBAC pour les compositions
-- =============================================

-- Ajouter les permissions pour la gestion des compositions
INSERT INTO permissions (code, nom, description, module, "createdAt")
VALUES
    ('periodes:compositions:view', 'Voir les compositions', 'Consulter les compositions parent-enfant des périodes', 'periodes', NOW()),
    ('periodes:compositions:edit', 'Modifier les compositions', 'Ajouter/modifier/supprimer des compositions', 'periodes', NOW()),
    ('periodes:templates:generer', 'Générer depuis template', 'Générer automatiquement une hiérarchie de périodes depuis un template', 'periodes', NOW())
ON CONFLICT (code) DO NOTHING;

-- Attribuer les permissions aux rôles ADMIN et CHEF_ETABLISSEMENT
INSERT INTO role_permissions ("roleId", "permissionCode", "createdAt")
SELECT r.id, p.code, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.nom IN ('ADMIN', 'CHEF_ETABLISSEMENT')
  AND p.code IN (
      'periodes:compositions:view',
      'periodes:compositions:edit',
      'periodes:templates:generer'
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================
