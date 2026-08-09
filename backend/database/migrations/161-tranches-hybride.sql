-- ==================================
-- eLISAschool - Migration 161 : Tranches Hybride (Lot B v7)
-- ==================================
-- Mode facturation tranches paramétrable par plan :
--   - auto : recomputation par nb élèves réel + prorata inter-cycle
--   - declaratif : tranche souscrite manuellement, facturation fixe
--
-- Colonnes ajoutées à plans_abonnement :
--   - mode_facturation_tranches (auto|declarative)
--   - tolerance_depassement (%) avant blocage/alerte
--   - prorata_immediat (bool)
--   - blocage_au_dela (bool)
--   - plafond_max_eleves (int nullable)
--
-- Idempotent : ADD COLUMN IF NOT EXISTS
-- ==================================

-- 1. Mode de facturation des tranches (auto = recomputation, declarative = souscription)
ALTER TABLE plans_abonnement
    ADD COLUMN IF NOT EXISTS "modeFacturationTranches" varchar(20) NOT NULL DEFAULT 'auto';

COMMENT ON COLUMN plans_abonnement."modeFacturationTranches" IS
    'auto: recomputation par nb élèves réel + prorata. declarative: tranche souscrite manuellement.';

-- 2. Tolérance de dépassement en pourcentage (ex: 10 = alerte à 110% du plafond)
ALTER TABLE plans_abonnement
    ADD COLUMN IF NOT EXISTS "toleranceDepassement" int NOT NULL DEFAULT 10;

-- 3. Prorata immédiat lors d'un changement de tranche en cours de cycle
ALTER TABLE plans_abonnement
    ADD COLUMN IF NOT EXISTS "prorataImmediat" boolean NOT NULL DEFAULT true;

-- 4. Blocage au-delà du plafond (true = bloque l'ajout d'élèves, false = facture complémentaire)
ALTER TABLE plans_abonnement
    ADD COLUMN IF NOT EXISTS "blocageAuDela" boolean NOT NULL DEFAULT false;

-- 5. Plafond max d'élèves (au-delà → état QUOTA_DEPASSE + workflow critique)
ALTER TABLE plans_abonnement
    ADD COLUMN IF NOT EXISTS "plafondMaxEleves" int DEFAULT NULL;

COMMENT ON COLUMN plans_abonnement."plafondMaxEleves" IS
    'Plafond absolu d''élèves. NULL = illimité. Au-delà → workflow critique.';

-- 6. Index pour les requêtes de contrôle quotidien
CREATE INDEX IF NOT EXISTS idx_plans_mode_facturation
    ON plans_abonnement ("modeFacturationTranches")
    WHERE "modeFacturationTranches" = 'auto';

-- 7. Mise à jour des plans existants en mode 'auto' (défaut déjà appliqué)
-- Aucun UPDATE nécessaire : DEFAULT 'auto' couvre les lignes existantes.
