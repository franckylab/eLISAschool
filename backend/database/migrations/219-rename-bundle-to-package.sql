-- =============================================
-- Migration 219 — Renommage bundle → package
-- =============================================
-- Renomme la table bundle_promotions en package_promotions
-- et met à jour les données (codes, noms, scope).
--
-- Gère le cas où TypeORM synchronize a déjà créé
-- une table package_promotions vide.
--
-- Date: 2026-08-18
-- Auteur: franck arlos chendjou
-- =============================================

BEGIN;

-- =============================================
-- 1. PRÉPARATION — Supprimer table vide (synchronize)
-- =============================================

DROP TABLE IF EXISTS package_promotions;

-- =============================================
-- 2. RENOMMER TABLE bundle_promotions → package_promotions
-- =============================================

-- Renommer contraintes (si elles existent)
ALTER TABLE bundle_promotions DROP CONSTRAINT IF EXISTS chk_bundle_type;
ALTER TABLE bundle_promotions DROP CONSTRAINT IF EXISTS chk_bundle_min_packs;
ALTER TABLE bundle_promotions DROP CONSTRAINT IF EXISTS chk_bundle_valeur_pos;

-- Renommer index (si ils existent)
ALTER INDEX IF EXISTS idx_bundle_promotions_actif RENAME TO idx_package_promotions_actif;
ALTER INDEX IF EXISTS idx_bundle_promotions_code RENAME TO idx_package_promotions_code;

-- Renommer table
ALTER TABLE bundle_promotions RENAME TO package_promotions;

-- =============================================
-- 3. METTRE À JOUR les données (BUNDLE → PACKAGE)
-- =============================================

-- Codes : BUNDLE-* → PACKAGE-*
UPDATE package_promotions
SET code = REPLACE(code, 'BUNDLE-', 'PACKAGE-')
WHERE code LIKE 'BUNDLE-%';

-- Noms : "Bundle ..." → "Package ..."
UPDATE package_promotions
SET nom = REPLACE(nom, 'Bundle ', 'Package ')
WHERE nom LIKE 'Bundle %';

-- Descriptions : "Bundle ..." → "Package ..."
UPDATE package_promotions
SET description = REPLACE(description, 'Bundle', 'Package')
WHERE description LIKE '%Bundle%';

-- =============================================
-- 4. RECÉER CONTRAINTES avec nouveaux noms
-- =============================================

ALTER TABLE package_promotions ADD CONSTRAINT chk_package_type CHECK ("typeRemise" IN ('POURCENTAGE', 'MONTANT_FIXE'));
ALTER TABLE package_promotions ADD CONSTRAINT chk_package_min_packs CHECK (array_length("packIds", 1) >= 2);
ALTER TABLE package_promotions ADD CONSTRAINT chk_package_valeur_pos CHECK (valeur >= 0);

-- =============================================
-- 5. METTRE À JOUR scope BUNDLE → PACKAGE dans promotions
-- =============================================

UPDATE promotions SET scope = 'PACKAGE' WHERE scope = 'BUNDLE';

ALTER TABLE promotions DROP CONSTRAINT IF EXISTS chk_promotions_scope;
ALTER TABLE promotions ADD CONSTRAINT chk_promotions_scope CHECK (scope IN ('PLAN', 'PACK', 'MODULE', 'PACKAGE', 'QUOTA'));

-- =============================================
-- 6. METTRE À JOUR scope BUNDLE → PACKAGE dans promotion_utilisees
-- =============================================

UPDATE promotion_utilisees SET scope = 'PACKAGE' WHERE scope = 'BUNDLE';

-- =============================================
-- 7. COMMENTAIRES
-- =============================================

COMMENT ON TABLE package_promotions IS 'Packages commerciaux (combos de packs quota avec remise) — refonte v4.0';
COMMENT ON COLUMN promotion_utilisees.scope IS 'Scope de la promotion : PLAN, PACK, MODULE, PACKAGE, QUOTA';

COMMIT;
