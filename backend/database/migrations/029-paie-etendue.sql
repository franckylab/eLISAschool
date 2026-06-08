-- ==================================
-- eLISAschool - Migration 029: Extension Paie
-- ==================================
-- Version: 2.0.0
-- Auteur: xAI Éducation
-- Description: Tables pour la gestion avancée de la paie
--   - Elements de salaire (détaillés)
--   - Cotisations sociales (CNPS, AMO, IRPP)
--   - Types de primes et retenues
-- ==================================

-- 1. Table Elements Salaire (composants détaillés du bulletin)
CREATE TABLE IF NOT EXISTS elements_salaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_paie_id UUID NOT NULL REFERENCES bulletin_paies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('GAIN', 'RETENUE')),
    categorie VARCHAR(50) NOT NULL,
    libelle VARCHAR(200) NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    base_calcul DECIMAL(12,2),
    taux DECIMAL(5,2),
    ordre_affichage INTEGER NOT NULL DEFAULT 0,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elements_salaire_bulletin ON elements_salaire(bulletin_paie_id);
CREATE INDEX IF NOT EXISTS idx_elements_salaire_type ON elements_salaire(type);
CREATE INDEX IF NOT EXISTS idx_elements_salaire_categorie ON elements_salaire(categorie);
CREATE INDEX IF NOT EXISTS idx_elements_salaire_etablissement ON elements_salaire(etablissement_id);

COMMENT ON TABLE elements_salaire IS 'Composants détaillés du bulletin de paie';

-- 2. Table Cotisations (CNPS, AMO, IRPP, etc.)
CREATE TABLE IF NOT EXISTS cotisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PATRONALE', 'SALARIALE', 'MIXTE')),
    taux_patronal DECIMAL(5,2) NOT NULL DEFAULT 0,
    taux_salarial DECIMAL(5,2) NOT NULL DEFAULT 0,
    plafond DECIMAL(12,2),
    description TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotisations_code ON cotisations(code);
CREATE INDEX IF NOT EXISTS idx_cotisations_etablissement ON cotisations(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_cotisations_actif ON cotisations(actif);

COMMENT ON TABLE cotisations IS 'Cotisations sociales (CNPS, AMO, IRPP, etc.)';

-- 3. Table Types Primes
CREATE TABLE IF NOT EXISTS types_primes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    type_calcul VARCHAR(20) NOT NULL CHECK (type_calcul IN ('FIXE', 'POURCENTAGE', 'VARIABLE')),
    valeur DECIMAL(12,2) NOT NULL,
    description TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_types_primes_code ON types_primes(code);
CREATE INDEX IF NOT EXISTS idx_types_primes_etablissement ON types_primes(etablissement_id);

COMMENT ON TABLE types_primes IS 'Types de primes configurables (ancienneté, rendement, etc.)';

-- 4. Table Types Retenues
CREATE TABLE IF NOT EXISTS types_retenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    frequence VARCHAR(20) NOT NULL CHECK (frequence IN ('PONCTUELLE', 'RECURRENTE')),
    montant_max DECIMAL(12,2),
    description TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_types_retenues_code ON types_retenues(code);
CREATE INDEX IF NOT EXISTS idx_types_retenues_etablissement ON types_retenues(etablissement_id);

COMMENT ON TABLE types_retenues IS 'Types de retenues sur salaire (avances, prêts, sanctions)';

-- 5. Données de seed : Cotisations (CNPS Cameroun)
INSERT INTO cotisations (code, nom, type, taux_patronal, taux_salarial, plafond, description) VALUES
('CNPS_P', 'CNPS Patronale', 'PATRONALE', 11.50, 0, NULL, 'Cotisation patronale CNPS (11.5%)'),
('CNPS_S', 'CNPS Salariale', 'SALARIALE', 0, 4.20, NULL, 'Cotisation salariale CNPS (4.2%)'),
('IRPP', 'IRPP', 'SALARIALE', 0, 0, NULL, 'Impôt sur le revenu (barème progressif)'),
('AMO', 'Assurance Maladie', 'MIXTE', 0, 0, NULL, 'Assurance maladie obligatoire')
ON CONFLICT (code) DO NOTHING;

-- 6. Données de seed : Types Primes
INSERT INTO types_primes (code, nom, type_calcul, valeur, description) VALUES
('ANCIENNETE', 'Prime d''ancienneté', 'POURCENTAGE', 5, 'Prime selon années de service'),
('TRANSPORT', 'Indemnité transport', 'FIXE', 25000, 'Forfait transport mensuel'),
('LOGEMENT', 'Indemnité logement', 'FIXE', 50000, 'Forfait logement mensuel'),
('RENDEMENT', 'Prime de rendement', 'VARIABLE', 0, 'Selon évaluation performance')
ON CONFLICT (code) DO NOTHING;

-- 7. Données de seed : Types Retenues
INSERT INTO types_retenues (code, nom, frequence, description) VALUES
('AVANCE', 'Avance sur salaire', 'PONCTUELLE', 'Avance exceptionnelle sur salaire'),
('PRET', 'Prêt employeur', 'RECURRENTE', 'Prêt avec mensualités'),
('SANCTION', 'Retenue disciplinaire', 'PONCTUELLE', 'Sanction financière')
ON CONFLICT (code) DO NOTHING;
