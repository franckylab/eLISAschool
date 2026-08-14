-- ==================================
-- eLISAschool - Migration 211
-- CMS Content Entities — Contenu dynamique
-- ==================================
-- 5 nouvelles tables pour le contenu CMS dynamique :
-- cms_actualites, cms_temoignages, cms_evenements, cms_partenaires, cms_newsletter
-- ==================================

-- ── 1. CMS Actualités ──
CREATE TABLE IF NOT EXISTS cms_actualites (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL,
    "titre" varchar(200) NOT NULL,
    "slug" varchar(220) NOT NULL,
    "resume" text,
    "contenu" text,
    "image" varchar(500),
    "categorie" varchar(100),
    "statut" varchar(20) NOT NULL DEFAULT 'BROUILLON',
    "auteurNom" varchar(100),
    "auteurId" uuid,
    "datePublication" timestamp,
    "vues" integer NOT NULL DEFAULT 0,
    "estEnUne" boolean NOT NULL DEFAULT false,
    "seo" jsonb,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW(),

    CONSTRAINT "uq_cms_actualites_etab_slug" UNIQUE ("etablissementId", "slug")
);

CREATE INDEX IF NOT EXISTS "idx_cms_actualites_etab" ON cms_actualites ("etablissementId");
CREATE INDEX IF NOT EXISTS "idx_cms_actualites_statut" ON cms_actualites ("statut");
CREATE INDEX IF NOT EXISTS "idx_cms_actualites_date_pub" ON cms_actualites ("datePublication" DESC);

-- RLS
ALTER TABLE cms_actualites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'cms_actualites' AND policyname = 'rls_cms_actualites'
    ) THEN
        CREATE POLICY "rls_cms_actualites" ON cms_actualites
        USING ("etablissementId"::text = current_setting('app.current_tenant', true));
    END IF;
END $$;

-- ── 2. CMS Témoignages ──
CREATE TABLE IF NOT EXISTS cms_temoignages (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL,
    "nom" varchar(100) NOT NULL,
    "role" varchar(100),
    "categorie" varchar(30) NOT NULL DEFAULT 'ELEVE',
    "texte" text NOT NULL,
    "photo" varchar(500),
    "note" integer NOT NULL DEFAULT 5,
    "ordre" integer NOT NULL DEFAULT 0,
    "estVisible" boolean NOT NULL DEFAULT true,
    "estEnUne" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_cms_temoignages_etab" ON cms_temoignages ("etablissementId");
CREATE INDEX IF NOT EXISTS "idx_cms_temoignages_categorie" ON cms_temoignages ("categorie");

ALTER TABLE cms_temoignages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'cms_temoignages' AND policyname = 'rls_cms_temoignages'
    ) THEN
        CREATE POLICY "rls_cms_temoignages" ON cms_temoignages
        USING ("etablissementId"::text = current_setting('app.current_tenant', true));
    END IF;
END $$;

-- ── 3. CMS Événements ──
CREATE TABLE IF NOT EXISTS cms_evenements (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL,
    "titre" varchar(200) NOT NULL,
    "description" text,
    "image" varchar(500),
    "dateDebut" timestamp NOT NULL,
    "dateFin" timestamp,
    "type" varchar(30) NOT NULL DEFAULT 'AUTRE',
    "lieu" varchar(200),
    "estPublic" boolean NOT NULL DEFAULT true,
    "metadata" jsonb,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_cms_evenements_etab" ON cms_evenements ("etablissementId");
CREATE INDEX IF NOT EXISTS "idx_cms_evenements_date" ON cms_evenements ("dateDebut");

ALTER TABLE cms_evenements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'cms_evenements' AND policyname = 'rls_cms_evenements'
    ) THEN
        CREATE POLICY "rls_cms_evenements" ON cms_evenements
        USING ("etablissementId"::text = current_setting('app.current_tenant', true));
    END IF;
END $$;

-- ── 4. CMS Partenaires ──
CREATE TABLE IF NOT EXISTS cms_partenaires (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL,
    "nom" varchar(150) NOT NULL,
    "logo" varchar(500),
    "siteWeb" varchar(500),
    "categorie" varchar(30) NOT NULL DEFAULT 'PARTENAIRE',
    "description" text,
    "ordre" integer NOT NULL DEFAULT 0,
    "estEnUne" boolean NOT NULL DEFAULT false,
    "estVisible" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_cms_partenaires_etab" ON cms_partenaires ("etablissementId");
CREATE INDEX IF NOT EXISTS "idx_cms_partenaires_categorie" ON cms_partenaires ("categorie");

ALTER TABLE cms_partenaires ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'cms_partenaires' AND policyname = 'rls_cms_partenaires'
    ) THEN
        CREATE POLICY "rls_cms_partenaires" ON cms_partenaires
        USING ("etablissementId"::text = current_setting('app.current_tenant', true));
    END IF;
END $$;

-- ── 5. CMS Newsletter (abonnements) ──
CREATE TABLE IF NOT EXISTS cms_newsletter (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL,
    "email" varchar(255) NOT NULL,
    "nom" varchar(100),
    "estActif" boolean NOT NULL DEFAULT true,
    "source" varchar(50),
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "deletedAt" timestamp,

    CONSTRAINT "uq_cms_newsletter_email_etab" UNIQUE ("email", "etablissementId")
);

CREATE INDEX IF NOT EXISTS "idx_cms_newsletter_etab" ON cms_newsletter ("etablissementId");

ALTER TABLE cms_newsletter ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'cms_newsletter' AND policyname = 'rls_cms_newsletter'
    ) THEN
        CREATE POLICY "rls_cms_newsletter" ON cms_newsletter
        USING ("etablissementId"::text = current_setting('app.current_tenant', true));
    END IF;
END $$;

-- ==================================
-- Permissions RBAC — Nouvelles permissions CMS contenu
-- ==================================

-- Insertion des permissions pour le contenu CMS dynamique
INSERT INTO permissions (code, libelle, action, module, description)
VALUES
    ('cms:actualites:view', 'Voir les actualités CMS', 'view', 'cms', 'Lister et consulter les actualités'),
    ('cms:actualites:create', 'Créer une actualité CMS', 'create', 'cms', 'Créer un article d''actualité'),
    ('cms:actualites:edit', 'Modifier une actualité CMS', 'edit', 'cms', 'Modifier une actualité existante'),
    ('cms:actualites:delete', 'Supprimer une actualité CMS', 'delete', 'cms', 'Supprimer une actualité'),
    ('cms:actualites:publish', 'Publier une actualité CMS', 'publish', 'cms', 'Changer le statut vers PUBLIE'),
    ('cms:temoignages:view', 'Voir les témoignages CMS', 'view', 'cms', 'Lister et consulter les témoignages'),
    ('cms:temoignages:create', 'Créer un témoignage CMS', 'create', 'cms', 'Ajouter un témoignage'),
    ('cms:temoignages:edit', 'Modifier un témoignage CMS', 'edit', 'cms', 'Modifier un témoignage'),
    ('cms:temoignages:delete', 'Supprimer un témoignage CMS', 'delete', 'cms', 'Supprimer un témoignage'),
    ('cms:evenements:view', 'Voir les événements CMS', 'view', 'cms', 'Lister et consulter les événements'),
    ('cms:evenements:create', 'Créer un événement CMS', 'create', 'cms', 'Ajouter un événement'),
    ('cms:evenements:edit', 'Modifier un événement CMS', 'edit', 'cms', 'Modifier un événement'),
    ('cms:evenements:delete', 'Supprimer un événement CMS', 'delete', 'cms', 'Supprimer un événement'),
    ('cms:partenaires:view', 'Voir les partenaires CMS', 'view', 'cms', 'Lister et consulter les partenaires'),
    ('cms:partenaires:create', 'Créer un partenaire CMS', 'create', 'cms', 'Ajouter un partenaire'),
    ('cms:partenaires:edit', 'Modifier un partenaire CMS', 'edit', 'cms', 'Modifier un partenaire'),
    ('cms:partenaires:delete', 'Supprimer un partenaire CMS', 'delete', 'cms', 'Supprimer un partenaire'),
    ('cms:newsletter:view', 'Voir les inscriptions newsletter', 'view', 'cms', 'Consulter les abonnés newsletter'),
    ('cms:newsletter:export', 'Exporter les inscriptions newsletter', 'export', 'cms', 'Export CSV des abonnés')
ON CONFLICT (code) DO NOTHING;

-- Attribution des permissions aux rôles ADMIN et SUPER_ADMIN
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN')
  AND p.code LIKE 'cms:%'
  AND p.module = 'cms'
ON CONFLICT DO NOTHING;
