-- ==================================
-- eLISAschool - Migration 104: Refonte Périodes v5.0
-- ==================================
-- Remplacement de l'enum TypePeriode par des niveaux configurables
-- Création des tables : usages_niveau, niveaux_periode
-- Migration de la colonne periodes.type → periodes."niveauId"
-- Migration des templates JSON (type → niveau + usageCode)
-- ==================================

-- ============================================================
-- 1. TABLE usages_niveau (configuration des usages)
-- ============================================================
CREATE TABLE IF NOT EXISTS usages_niveau (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    "etablissementId" UUID,
    "estSysteme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_usages_niveau_etablissement FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usages_niveau_code ON usages_niveau(code);
CREATE INDEX IF NOT EXISTS idx_usages_niveau_etablissement ON usages_niveau("etablissementId");

-- ============================================================
-- 2. SEED — Usages système (globaux, etablissementId = NULL)
-- ============================================================
INSERT INTO usages_niveau (code, label, description, "etablissementId", "estSysteme")
VALUES
    ('NOTES', 'Saisie des notes', 'Niveau utilisé pour la saisie des notes quotidiennes', NULL, true),
    ('BULLETIN', 'Génération des bulletins', 'Niveau utilisé pour la génération des bulletins scolaires', NULL, true),
    ('COMPOSITION', 'Compositions', 'Niveau utilisé pour les compositions/examens', NULL, true),
    ('ANNEE', 'Année scolaire', 'Niveau racine représentant l''année scolaire complète', NULL, true),
    ('AUTRE', 'Usage libre', 'Usage personnalisable sans règle métier spécifique', NULL, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. TABLE niveaux_periode (niveaux configurables par établissement)
-- ============================================================
CREATE TABLE IF NOT EXISTS niveaux_periode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" UUID NOT NULL,
    niveau INTEGER NOT NULL,
    label VARCHAR(50) NOT NULL,
    "usageCode" VARCHAR(50) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_niveaux_periode_etablissement FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE,
    CONSTRAINT uq_niveaux_periode_etab_niveau UNIQUE ("etablissementId", niveau)
);

CREATE INDEX IF NOT EXISTS idx_niveaux_periode_etablissement ON niveaux_periode("etablissementId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_niveaux_periode_etab_niveau ON niveaux_periode("etablissementId", niveau);

-- ============================================================
-- 4. SEED — Niveaux par défaut pour chaque établissement existant
-- ============================================================
-- Pour chaque établissement existant, créer les 4 niveaux par défaut
DO $$
DECLARE
    etab RECORD;
BEGIN
    FOR etab IN SELECT id FROM etablissements
    LOOP
        -- Vérifier si des niveaux existent déjà
        IF NOT EXISTS (SELECT 1 FROM niveaux_periode WHERE "etablissementId" = etab.id) THEN
            INSERT INTO niveaux_periode ("etablissementId", niveau, label, "usageCode") VALUES
                (etab.id, 0, 'Évaluation', 'NOTES'),
                (etab.id, 1, 'Trimestre', 'BULLETIN'),
                (etab.id, 2, 'Semestre', 'BULLETIN'),
                (etab.id, 3, 'Année', 'ANNEE');
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- 5. MIGRATION — Colonne periodes."niveauId"
-- ============================================================
-- Ajouter la colonne niveauId
ALTER TABLE periodes ADD COLUMN IF NOT EXISTS "niveauId" UUID;

-- Créer l'index
CREATE INDEX IF NOT EXISTS idx_periodes_niveau_id ON periodes("niveauId");
CREATE INDEX IF NOT EXISTS idx_periodes_annee_niveau ON periodes("anneeScolaireId", "niveauId");

-- Migrer les données : mapper l'ancien type vers le niveau correspondant
-- Pour chaque établissement, mapper les types existants vers les niveaux par défaut
DO $$
DECLARE
    etab RECORD;
    seq_id UUID;
    trim_id UUID;
    sem_id UUID;
    annee_id UUID;
BEGIN
    FOR etab IN SELECT id FROM etablissements
    LOOP
        -- Récupérer les IDs des niveaux par défaut de cet établissement
        SELECT id INTO seq_id FROM niveaux_periode WHERE "etablissementId" = etab.id AND niveau = 0;
        SELECT id INTO trim_id FROM niveaux_periode WHERE "etablissementId" = etab.id AND niveau = 1;
        SELECT id INTO sem_id FROM niveaux_periode WHERE "etablissementId" = etab.id AND niveau = 2;
        SELECT id INTO annee_id FROM niveaux_periode WHERE "etablissementId" = etab.id AND niveau = 3;

        -- Migrer les périodes existantes
        IF seq_id IS NOT NULL THEN
            UPDATE periodes SET "niveauId" = seq_id WHERE type = 'EVALUATION' AND "etablissementId" = etab.id AND "niveauId" IS NULL;
        END IF;
        IF trim_id IS NOT NULL THEN
            UPDATE periodes SET "niveauId" = trim_id WHERE type = 'TRIMESTRE' AND "etablissementId" = etab.id AND "niveauId" IS NULL;
        END IF;
        IF sem_id IS NOT NULL THEN
            UPDATE periodes SET "niveauId" = sem_id WHERE type = 'SEMESTRE' AND "etablissementId" = etab.id AND "niveauId" IS NULL;
        END IF;
        IF annee_id IS NOT NULL THEN
            UPDATE periodes SET "niveauId" = annee_id WHERE type = 'ANNEE' AND "etablissementId" = etab.id AND "niveauId" IS NULL;
        END IF;
    END LOOP;
END $$;

-- Rendre la colonne NOT NULL après migration
ALTER TABLE periodes ALTER COLUMN "niveauId" SET NOT NULL;

-- Ajouter la FK après migration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_periodes_niveau'
    ) THEN
        ALTER TABLE periodes ADD CONSTRAINT fk_periodes_niveau
            FOREIGN KEY ("niveauId") REFERENCES niveaux_periode(id);
    END IF;
END $$;

-- ============================================================
-- 6. MIGRATION — Templates JSON (type → niveau + usageCode)
-- ============================================================
-- Les templates existants ont une structure JSON avec "type": "TRIMESTRE"
-- Il faut convertir vers "niveau": 1, "usageCode": "BULLETIN"
-- Cette migration est gérée au niveau applicatif (lecture/écriture)
-- Les anciens templates restent lisibles car le service gère la rétrocompatibilité

-- ============================================================
-- 7. PERMISSIONS RBAC — Nouvelles permissions
-- ============================================================
-- Les permissions sont ajoutées via le seed RBAC (roles.enum.ts)
-- Elles seront attribuées automatiquement lors du prochain redémarrage

-- ============================================================
-- 8. SUPPRESSION — Ancienne colonne type (optionnel, après validation)
-- ============================================================
-- Ne pas supprimer immédiatement — conserver pour rollback
-- La colonne type sera supprimée dans une migration future après validation
-- ALTER TABLE periodes DROP COLUMN IF EXISTS type;

-- ============================================================
-- FIN MIGRATION
-- ============================================================
