-- ==================================
-- Migration 154 — Facturation OHADA & Tables Phase B
-- ==================================
-- Phase B — Refonte SaaS v2
--
-- Ajoute les tables et colonnes nécessaires pour :
-- - Usage meters (compteurs d'utilisation par module)
-- - Ledger double entrée (comptabilité OHADA)
-- - Credit notes (avoirs)
-- - OHADA compliance sur factures (TVA, mentions légales, dunning)
--
-- Migration idempotente — peut être relancée sans erreur.
-- ==================================

-- ==========================================
-- 1. Table usage_meters — Compteurs d'utilisation
-- ==========================================
CREATE TABLE IF NOT EXISTS usage_meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" UUID NOT NULL,
    "moduleNom" VARCHAR(100) NOT NULL,
    consommation INTEGER NOT NULL DEFAULT 0,
    periode VARCHAR(7) NOT NULL, -- Format YYYY-MM
    "limiteMax" INTEGER NOT NULL DEFAULT 0,
    "alerte80Envoyee" BOOLEAN NOT NULL DEFAULT false,
    bloque BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_meters_unique 
    ON usage_meters("etablissementId", "moduleNom", periode);
CREATE INDEX IF NOT EXISTS idx_usage_meters_etablissement 
    ON usage_meters("etablissementId");
CREATE INDEX IF NOT EXISTS idx_usage_meters_periode 
    ON usage_meters(periode);

-- ==========================================
-- 2. Table transactions_ledger — Comptabilité double entrée OHADA
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "numeroEcriture" VARCHAR(50) UNIQUE NOT NULL,
    "etablissementId" UUID NOT NULL,
    "factureId" UUID,
    "typeTransaction" VARCHAR(20) NOT NULL, -- FACTURATION, PAIEMENT, AVOIR, REMBOURSEMENT, AJUSTEMENT, PENALITE_RETARD
    sens VARCHAR(10) NOT NULL, -- DEBIT, CREDIT
    "compteComptable" VARCHAR(20) NOT NULL, -- Compte OHADA (411, 521, etc.)
    libelle VARCHAR(255) NOT NULL,
    montant INTEGER NOT NULL, -- En XAF/XOF entiers
    "soldeCumule" INTEGER NOT NULL DEFAULT 0,
    periode VARCHAR(7) NOT NULL, -- Format YYYY-MM
    "dateEcriture" DATE NOT NULL,
    "referenceId" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_etablissement 
    ON transactions_ledger("etablissementId");
CREATE INDEX IF NOT EXISTS idx_ledger_facture 
    ON transactions_ledger("factureId");
CREATE INDEX IF NOT EXISTS idx_ledger_date 
    ON transactions_ledger("dateEcriture");
CREATE INDEX IF NOT EXISTS idx_ledger_type 
    ON transactions_ledger("typeTransaction");
CREATE INDEX IF NOT EXISTS idx_ledger_periode 
    ON transactions_ledger("etablissementId", periode);

-- ==========================================
-- 3. Table credit_notes — Avoirs (credit notes)
-- ==========================================
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) UNIQUE NOT NULL, -- AV-OHADA-2025-000001
    "factureId" UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    "etablissementId" UUID NOT NULL,
    "montantHT" INTEGER NOT NULL,
    "montantTVA" INTEGER NOT NULL DEFAULT 0,
    "montantTTC" INTEGER NOT NULL,
    raison TEXT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'BROUILLON', -- BROUILLON, EMIS, UTILISE, ANNULE
    "dateEmission" DATE NOT NULL,
    "mentionsLegales" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_facture 
    ON credit_notes("factureId");
CREATE INDEX IF NOT EXISTS idx_credit_notes_etablissement 
    ON credit_notes("etablissementId");

-- ==========================================
-- 4. Colonnes OHADA sur factures
-- ==========================================
-- Numéro séquentiel OHADA
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "numeroOHADA" VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_factures_numero_ohada 
    ON factures("numeroOHADA") WHERE "numeroOHADA" IS NOT NULL;

-- Montants OHADA (conversion depuis decimal vers int)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "montantHT" INTEGER;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "montantTVA" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "tauxTVA" INTEGER NOT NULL DEFAULT 1925;

-- Migrer les montants existants depuis decimal vers int
UPDATE factures 
SET "montantHT" = CASE 
    WHEN "montantHT" IS NULL THEN ROUND(("montantBase" + "montantTranches" + "montantOptions") * 100)::int
    ELSE "montantHT"
END
WHERE "montantHT" IS NULL;

-- Mentions légales OHADA
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "mentionsLegales" TEXT;

-- Dunning (relances)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "nombreRelances" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "dateDerniereRelance" DATE;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS "dateSuspension" DATE;

-- ==========================================
-- 5. Données initiales — Paramètres TVA
-- ==========================================
-- Insérer le taux TVA par défaut dans les paramètres système si non existant
INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, description, "modifiableRuntime")
VALUES (
    'billing.taux_tva',
    '1925',
    'NUMBER',
    'ETABLISSEMENT',
    'billing',
    'Taux de TVA en centièmes (1925 = 19.25%). Taux par défaut Cameroun.',
    true
)
ON CONFLICT (cle, "etablissementId") DO NOTHING;
