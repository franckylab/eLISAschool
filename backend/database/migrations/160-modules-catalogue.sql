-- ============================================================
-- eLISAschool — Migration 160 : Catalogue modules unifié (Lot A v7)
-- ============================================================
-- Source de vérité unique des modules plateforme (remplace les
-- 3 registres divergents : MODULE_REGISTRY, ModuleRegistryService,
-- hardcodes module-access.middleware.ts).
--
-- Idempotente : CREATE IF NOT EXISTS + DO $$. À appliquer via psql
-- (les migrations SQL ne sont pas branchées sur TypeORM).
-- ============================================================

CREATE TABLE IF NOT EXISTS modules_catalogue (
    "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "code"              varchar(100) NOT NULL,
    "nom"               varchar(150) NOT NULL,
    "nomEn"             varchar(150) NULL,
    "description"       text NULL,
    "descriptionEn"     text NULL,
    "categorie"         varchar(20) NOT NULL DEFAULT 'ADDON',
    "icone"             varchar(60) NOT NULL DEFAULT 'Package',
    "prixMensuel"       integer NOT NULL DEFAULT 0,
    "prixAnnuel"        integer NOT NULL DEFAULT 0,
    "estFacturable"     boolean NOT NULL DEFAULT false,
    "estSouscriptible"  boolean NOT NULL DEFAULT false,
    "actifParDefaut"    boolean NOT NULL DEFAULT false,
    "planMinimal"       varchar(60) NULL,
    "dependencies"      text NULL,
    "permissionsRequises" text NULL,
    "config"            jsonb NOT NULL DEFAULT '{}'::jsonb,
    "ordre"             integer NOT NULL DEFAULT 0,
    "estSysteme"        boolean NOT NULL DEFAULT false,
    "estActif"          boolean NOT NULL DEFAULT true,
    "etablissementId"   uuid NULL,
    "createdAt"         timestamp DEFAULT now(),
    "updatedAt"         timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_modules_catalogue_code ON modules_catalogue ("code");
CREATE INDEX IF NOT EXISTS idx_modules_catalogue_categorie ON modules_catalogue ("categorie");
CREATE INDEX IF NOT EXISTS idx_modules_catalogue_actif ON modules_catalogue ("estActif");
CREATE INDEX IF NOT EXISTS idx_modules_catalogue_etablissement ON modules_catalogue ("etablissementId");
