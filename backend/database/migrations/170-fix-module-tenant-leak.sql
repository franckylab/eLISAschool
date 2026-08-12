-- ==================================
-- eLISAschool - Migration 170 — Corrections critiques modules SaaS v7
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-08-10
--
-- Objectif : Corriger les anomalies critiques identifiées dans l'audit modules SaaS
--   P1.1 : Ajout colonne etablissementId sur abonnements_modules (isolation multi-tenant)
--   P1.3 : Ajout dépendance auth → parking dans le catalogue
--   P1.4 : Correction catégorie recrutement (CRITIQUE → ADDON)
-- ==================================

-- ==================================
-- P1.1 — Isolation multi-tenant sur abonnements_modules
-- ==================================

-- Ajout de la colonne etablissementId si elle n'existe pas déjà
ALTER TABLE abonnements_modules 
ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- Index pour performance (requêtes multi-tenant)
CREATE INDEX IF NOT EXISTS idx_abonnements_modules_etablissement 
ON abonnements_modules("etablissementId");

-- Backfill : peupler etablissementId depuis la relation abonnement → client
UPDATE abonnements_modules am
SET "etablissementId" = ac."etablissementId"
FROM abonnements_client ac
WHERE am."abonnementId" = ac.id
  AND am."etablissementId" IS NULL;

-- Contrainte NOT NULL après backfill (sécurité)
ALTER TABLE abonnements_modules 
ALTER COLUMN "etablissementId" SET NOT NULL;

-- Commentaire documentation
COMMENT ON COLUMN abonnements_modules."etablissementId" IS 
    'P1.1 v7 — Isolation multi-tenant. Permet le filtrage direct sans JOIN sur abonnements_client.';

-- ==================================
-- P1.3 — Ajout dépendance auth → parking
-- ==================================

-- Mise à jour dans le catalogue DB (si le module existe)
UPDATE modules_catalogue
SET dependencies = array_append(dependencies, 'auth')
WHERE code = 'parking' 
  AND NOT 'auth' = ANY(dependencies);

-- ==================================
-- P1.4 — Correction catégorie recrutement
-- ==================================

-- Recrutement ne doit PAS être CRITIQUE (il est defaultActive: false)
-- Reclassification en ADDON (cohérence avec le comportement réel)
UPDATE modules_catalogue
SET categorie = 'ADDON'
WHERE code = 'recrutement'
  AND categorie != 'ADDON';

-- ==================================
-- Journalisation
-- ==================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 170 terminée : Corrections critiques modules SaaS v7';
    RAISE NOTICE '  - P1.1 : etablissementId ajouté sur abonnements_modules';
    RAISE NOTICE '  - P1.3 : Dépendance auth → parking ajoutée';
    RAISE NOTICE '  - P1.4 : Recrutement reclassifié ADDON';
END $$;
