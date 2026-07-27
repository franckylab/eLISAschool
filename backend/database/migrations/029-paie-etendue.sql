-- ==================================
-- eLISAschool - Migration 029: Extension Paie
-- ==================================
-- Version: 3.0.0
-- Auteur: franck arlos chendjou
-- Description: Tables pour la gestion avancée de la paie
--   - Elements de salaire (détaillés)
--   - Cotisations sociales (CNPS, AMO, IRPP)
--   - Types de primes et retenues
-- Notes v3.0 :
--   - FK corrigée : bulletins_paie (la table bulletin_paies n'existe pas)
--   - Colonnes en camelCase quoté (alignées sur les entités TypeORM)
--   - Unicité composite multi-tenant ("code", "etablissementId")
--   - Seeds SQL supprimés : gérés par seed-cotisations.ts / seed-types-primes.ts
--     (les INSERT sans etablissementId violaient le NOT NULL)
-- ==================================

-- 1. Table Elements Salaire (composants détaillés du bulletin)
CREATE TABLE IF NOT EXISTS elements_salaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bulletinPaieId" UUID NOT NULL REFERENCES bulletins_paie(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('GAIN', 'RETENUE')),
    categorie VARCHAR(50) NOT NULL,
    libelle VARCHAR(200) NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    "baseCalcul" DECIMAL(12,2),
    taux DECIMAL(5,2),
    "ordreAffichage" INTEGER NOT NULL DEFAULT 0,
    "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elements_salaire_bulletin ON elements_salaire("bulletinPaieId");
CREATE INDEX IF NOT EXISTS idx_elements_salaire_type ON elements_salaire(type);
CREATE INDEX IF NOT EXISTS idx_elements_salaire_categorie ON elements_salaire(categorie);
CREATE INDEX IF NOT EXISTS idx_elements_salaire_etablissement ON elements_salaire("etablissementId");

COMMENT ON TABLE elements_salaire IS 'Composants détaillés du bulletin de paie';

-- 2. Table Cotisations (CNPS, AMO, IRPP, etc.)
CREATE TABLE IF NOT EXISTS cotisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PATRONALE', 'SALARIALE', 'MIXTE')),
    "tauxPatronal" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tauxSalarial" DECIMAL(5,2) NOT NULL DEFAULT 0,
    plafond DECIMAL(12,2),
    description TEXT,
    "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cotisations_code_etablissement ON cotisations(code, "etablissementId");
CREATE INDEX IF NOT EXISTS idx_cotisations_etablissement ON cotisations("etablissementId");
CREATE INDEX IF NOT EXISTS idx_cotisations_actif ON cotisations(actif);

COMMENT ON TABLE cotisations IS 'Cotisations sociales (CNPS, AMO, IRPP, etc.)';

-- 3. Table Types Primes
CREATE TABLE IF NOT EXISTS types_primes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    "typeCalcul" VARCHAR(20) NOT NULL CHECK ("typeCalcul" IN ('FIXE', 'POURCENTAGE', 'VARIABLE')),
    valeur DECIMAL(12,2) NOT NULL,
    description TEXT,
    "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_types_primes_code_etablissement ON types_primes(code, "etablissementId");
CREATE INDEX IF NOT EXISTS idx_types_primes_etablissement ON types_primes("etablissementId");

COMMENT ON TABLE types_primes IS 'Types de primes configurables (ancienneté, rendement, etc.)';

-- 4. Table Types Retenues
CREATE TABLE IF NOT EXISTS types_retenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    frequence VARCHAR(20) NOT NULL CHECK (frequence IN ('PONCTUELLE', 'RECURRENTE')),
    "montantMax" DECIMAL(12,2),
    description TEXT,
    "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_types_retenues_code_etablissement ON types_retenues(code, "etablissementId");
CREATE INDEX IF NOT EXISTS idx_types_retenues_etablissement ON types_retenues("etablissementId");

COMMENT ON TABLE types_retenues IS 'Types de retenues sur salaire (avances, prêts, sanctions)';

-- 5. Rattrapage : bases existantes créées avec l'ancien schéma v2 (snake_case)
DO $$
BEGIN
    -- elements_salaire : renommages idempotents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elements_salaire' AND column_name = 'bulletin_paie_id') THEN
        ALTER TABLE elements_salaire RENAME COLUMN bulletin_paie_id TO "bulletinPaieId";
        ALTER TABLE elements_salaire RENAME COLUMN base_calcul TO "baseCalcul";
        ALTER TABLE elements_salaire RENAME COLUMN ordre_affichage TO "ordreAffichage";
        ALTER TABLE elements_salaire RENAME COLUMN etablissement_id TO "etablissementId";
        ALTER TABLE elements_salaire RENAME COLUMN created_at TO "createdAt";
        ALTER TABLE elements_salaire RENAME COLUMN updated_at TO "updatedAt";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotisations' AND column_name = 'taux_patronal') THEN
        ALTER TABLE cotisations RENAME COLUMN taux_patronal TO "tauxPatronal";
        ALTER TABLE cotisations RENAME COLUMN taux_salarial TO "tauxSalarial";
        ALTER TABLE cotisations RENAME COLUMN etablissement_id TO "etablissementId";
        ALTER TABLE cotisations RENAME COLUMN created_at TO "createdAt";
        ALTER TABLE cotisations RENAME COLUMN updated_at TO "updatedAt";
        -- L'unicité globale sur code casse le multi-tenant
        ALTER TABLE cotisations DROP CONSTRAINT IF EXISTS cotisations_code_key;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'types_primes' AND column_name = 'type_calcul') THEN
        ALTER TABLE types_primes RENAME COLUMN type_calcul TO "typeCalcul";
        ALTER TABLE types_primes RENAME COLUMN etablissement_id TO "etablissementId";
        ALTER TABLE types_primes RENAME COLUMN created_at TO "createdAt";
        ALTER TABLE types_primes RENAME COLUMN updated_at TO "updatedAt";
        ALTER TABLE types_primes DROP CONSTRAINT IF EXISTS types_primes_code_key;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'types_retenues' AND column_name = 'montant_max') THEN
        ALTER TABLE types_retenues RENAME COLUMN montant_max TO "montantMax";
        ALTER TABLE types_retenues RENAME COLUMN etablissement_id TO "etablissementId";
        ALTER TABLE types_retenues RENAME COLUMN created_at TO "createdAt";
        ALTER TABLE types_retenues RENAME COLUMN updated_at TO "updatedAt";
        ALTER TABLE types_retenues DROP CONSTRAINT IF EXISTS types_retenues_code_key;
    END IF;
END $$;
