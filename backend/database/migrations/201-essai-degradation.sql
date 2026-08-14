-- ==========================================
-- Migration 201 — Période d'essai + Dégradation gracieuse
-- ==========================================
-- eLISAschool — Refonte SaaS Unification Modules
--
-- Ajoute :
--   1. Colonne `periodeEssaiFin` sur abonnements_client (essai 14 jours)
--   2. Colonne `dateExpirationReelle` sur abonnements_client (tracker J0 dégradation)
--   3. Valeur 'ESSAI' dans le type enum statut_abonnement
--
-- Migration idempotente (IF NOT EXISTS / safe re-run)
-- ==========================================

-- 1. Ajouter 'ESSAI' à l'enum statut_abonnement
DO $$
BEGIN
    -- Vérifier si la valeur ESSAI existe déjà dans l'enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'statut_abonnement'::regclass
        AND enumlabel = 'ESSAI'
    ) THEN
        ALTER TYPE "statut_abonnement" ADD VALUE 'ESSAI';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Le type n'existe pas encore, ignorer
        NULL;
END $$;

-- 2. Colonne periodeEssaiFin (date de fin de la période d'essai)
ALTER TABLE "abonnements_client"
    ADD COLUMN IF NOT EXISTS "periodeEssaiFin" TIMESTAMP;

-- Index pour les requêtes de vérification d'essai actif
CREATE INDEX IF NOT EXISTS "idx_abonnements_client_periode_essai"
    ON "abonnements_client" ("periodeEssaiFin")
    WHERE "periodeEssaiFin" IS NOT NULL;

-- 3. Colonne dateExpirationReelle (date réelle d'expiration — tracker J0 dégradation)
ALTER TABLE "abonnements_client"
    ADD COLUMN IF NOT EXISTS "dateExpirationReelle" TIMESTAMP;

-- Index pour les requêtes de dégradation
CREATE INDEX IF NOT EXISTS "idx_abonnements_client_expiration_reelle"
    ON "abonnements_client" ("dateExpirationReelle")
    WHERE "dateExpirationReelle" IS NOT NULL;

-- 4. Commentaire documentation
COMMENT ON COLUMN "abonnements_client"."periodeEssaiFin" IS
    'Date de fin de période d''essai (14 jours après création). Si statut=ESSAI et periodeEssaiFin > now(), tous modules accessibles.';

COMMENT ON COLUMN "abonnements_client"."dateExpirationReelle" IS
    'Date réelle d''expiration (J0 dégradation). Utilisée pour calculer les phases : J0-J15 lecture seule, J15-J30 verrouillé, J30+ archivé.';
