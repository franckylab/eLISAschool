-- ==================================
-- eLISAschool - Migration Module Finances (Partie 2)
-- ==================================
-- Version: 2.0.0
-- Date: 7 juin 2026
-- Description: Tables comptabilité, trésorerie et budget
-- ==================================

-- ==================================
-- 1. COMPTABILITÉ
-- ==================================

-- Table: Ecritures comptables
CREATE TABLE IF NOT EXISTS ecritures_comptables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_piece VARCHAR(20) UNIQUE NOT NULL,
    date_ecriture DATE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    compte_debit VARCHAR(6) NOT NULL,
    compte_credit VARCHAR(6) NOT NULL,
    montant_debit NUMERIC(15,2) NOT NULL,
    montant_credit NUMERIC(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'PAIEMENT',
    statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    referenceexterne VARCHAR(255),
    observations TEXT,
    utilisateur_id UUID,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ecritures_etablissement ON ecritures_comptables(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_date ON ecritures_comptables(date_ecriture);
CREATE INDEX IF NOT EXISTS idx_ecritures_numero ON ecritures_comptables(numero_piece);

-- Trigger updated_at
CREATE TRIGGER update_ecritures_comptables_updated_at
    BEFORE UPDATE ON ecritures_comptables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- 2. TRÉSORERIE - Comptes Caisse
-- ==================================

CREATE TABLE IF NOT EXISTS comptes_caisse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'PRINCIPALE',
    solde_actuel NUMERIC(15,2) NOT NULL DEFAULT 0,
    solde_initial NUMERIC(15,2) NOT NULL DEFAULT 0,
    seuil_alerte NUMERIC(15,2),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(code, etablissement_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comptes_caisse_etablissement ON comptes_caisse(etablissement_id);

-- Trigger updated_at
CREATE TRIGGER update_comptes_caisse_updated_at
    BEFORE UPDATE ON comptes_caisse
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- 3. TRÉSORERIE - Comptes Bancaires
-- ==================================

CREATE TABLE IF NOT EXISTS comptes_bancaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    banque VARCHAR(50) NOT NULL,
    numero_compte VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'COURANT',
    solde_actuel NUMERIC(15,2) NOT NULL DEFAULT 0,
    solde_initial NUMERIC(15,2) NOT NULL DEFAULT 0,
    decouvert_autorise NUMERIC(15,2),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(code, etablissement_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_etablissement ON comptes_bancaires(etablissement_id);

-- Trigger updated_at
CREATE TRIGGER update_comptes_bancaires_updated_at
    BEFORE UPDATE ON comptes_bancaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- 4. TRÉSORERIE - Mouvements Caisse
-- ==================================

CREATE TABLE IF NOT EXISTS mouvements_caisse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_operation VARCHAR(20) UNIQUE NOT NULL,
    date_mouvement DATE NOT NULL,
    type VARCHAR(30) NOT NULL,
    montant NUMERIC(15,2) NOT NULL,
    motif VARCHAR(255) NOT NULL,
    beneficiaire VARCHAR(255),
    reference VARCHAR(255),
    solde_apres_operation NUMERIC(15,2) NOT NULL,
    compte_caisse_id UUID NOT NULL REFERENCES comptes_caisse(id) ON DELETE CASCADE,
    utilisateur_id UUID,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_mouvements_etablissement ON mouvements_caisse(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_caisse(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_compte ON mouvements_caisse(compte_caisse_id);

-- Trigger updated_at
CREATE TRIGGER update_mouvements_caisse_updated_at
    BEFORE UPDATE ON mouvements_caisse
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- 5. BUDGET - Budgets Annuels
-- ==================================

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    annee_debut DATE NOT NULL,
    annee_fin DATE NOT NULL,
    montant_total_prevu NUMERIC(15,2) NOT NULL DEFAULT 0,
    montant_total_engage NUMERIC(15,2) NOT NULL DEFAULT 0,
    montant_total_consomme NUMERIC(15,2) NOT NULL DEFAULT 0,
    statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    observations TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(code, etablissement_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_budgets_etablissement ON budgets(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_budgets_annees ON budgets(annee_debut, annee_fin);

-- Trigger updated_at
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- 6. BUDGET - Lignes Budgétaires
-- ==================================

CREATE TABLE IF NOT EXISTS lignes_budget (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    montant_prevu NUMERIC(15,2) NOT NULL DEFAULT 0,
    montant_engage NUMERIC(15,2) NOT NULL DEFAULT 0,
    montant_consomme NUMERIC(15,2) NOT NULL DEFAULT 0,
    pourcentage_alerte NUMERIC(5,2),
    bloquer_si_depasse BOOLEAN NOT NULL DEFAULT TRUE,
    observations TEXT,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    categorie_depense_id UUID NOT NULL REFERENCES categories_depense(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(budget_id, categorie_depense_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_lignes_budget_budget ON lignes_budget(budget_id);
CREATE INDEX IF NOT EXISTS idx_lignes_budget_categorie ON lignes_budget(categorie_depense_id);

-- Trigger updated_at
CREATE TRIGGER update_lignes_budget_updated_at
    BEFORE UPDATE ON lignes_budget
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- 7. SEED - Caisse principale par défaut
-- ==================================

-- Insérer une caisse principale pour l'établissement test
INSERT INTO comptes_caisse (code, libelle, type, solde_actuel, solde_initial, seuil_alerte, actif, etablissement_id)
VALUES (
    'CAIS-001',
    'Caisse principale',
    'PRINCIPALE',
    0,
    0,
    100000,
    TRUE,
    'e5e5c5f5-5c5f-5c5f-5c5f-5c5f5c5f5c5f'
) ON CONFLICT (code, etablissement_id) DO NOTHING;

-- Insérer un compte bancaire par défaut
INSERT INTO comptes_bancaires (code, libelle, banque, numero_compte, type, solde_actuel, solde_initial, actif, etablissement_id)
VALUES (
    'BANQ-001',
    'Compte BICEC Principal',
    'BICEC',
    '001-XXXX-XXXX-XXXX',
    'COURANT',
    0,
    0,
    TRUE,
    'e5e5c5f5-5c5f-5c5f-5c5f-5c5f5c5f5c5f'
) ON CONFLICT (code, etablissement_id) DO NOTHING;

-- ==================================
-- 8. VÉRIFICATION
-- ==================================

-- Afficher les tables créées
SELECT 
    'ecritures_comptables' as table_name, 
    count(*) as row_count 
FROM ecritures_comptables
UNION ALL
SELECT 'comptes_caisse', count(*) FROM comptes_caisse
UNION ALL
SELECT 'comptes_bancaires', count(*) FROM comptes_bancaires
UNION ALL
SELECT 'mouvements_caisse', count(*) FROM mouvements_caisse
UNION ALL
SELECT 'budgets', count(*) FROM budgets
UNION ALL
SELECT 'lignes_budget', count(*) FROM lignes_budget
ORDER BY table_name;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Migration Finances Partie 2 complétée!';
    RAISE NOTICE 'Tables créées:';
    RAISE NOTICE '  - ecritures_comptables';
    RAISE NOTICE '  - comptes_caisse';
    RAISE NOTICE '  - comptes_bancaires';
    RAISE NOTICE '  - mouvements_caisse';
    RAISE NOTICE '  - budgets';
    RAISE NOTICE '  - lignes_budget';
    RAISE NOTICE '==========================================';
END $$;
