-- ==================================
-- eLISAschool - Système CMS — 7 tables
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Tables CMS pour pages publiques par établissement :
-- - cms_pages : pages avec templates, slugs, hiérarchie
-- - cms_sections : blocs de contenu (18 types)
-- - cms_medias : bibliothèque médias
-- - cms_themes : thèmes visuels (variables CSS)
-- - cms_menus : navigation (header, footer, sidebar)
-- - cms_widgets : widgets latéraux
-- - cms_versions : historique & rollback
-- + RLS activé sur toutes les tables
-- + Seeds : 6 thèmes système prédéfinis
-- ==================================

-- ═══ CMS PAGES ═══
CREATE TABLE IF NOT EXISTS cms_pages (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL REFERENCES etablissements(id),
    "titre" varchar(200) NOT NULL,
    "slug" varchar(200) NOT NULL,
    "template" varchar(50) DEFAULT 'custom',
    "statut" varchar(20) DEFAULT 'BROUILLON',
    "ordre" int DEFAULT 0,
    "pageParentId" uuid REFERENCES cms_pages(id) ON DELETE SET NULL,
    "metadata" jsonb,
    "seo" jsonb,
    "estPageAccueil" boolean DEFAULT false,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now(),
    UNIQUE ("etablissementId", "slug")
);
CREATE INDEX IF NOT EXISTS "idx_cms_pages_etab" ON cms_pages ("etablissementId");
CREATE INDEX IF NOT EXISTS "idx_cms_pages_statut" ON cms_pages ("statut");

-- ═══ CMS SECTIONS ═══
CREATE TABLE IF NOT EXISTS cms_sections (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "pageId" uuid NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
    "type" varchar(50) NOT NULL,
    "contenu" jsonb NOT NULL DEFAULT '{}',
    "ordre" int DEFAULT 0,
    "styles" jsonb,
    "visible" boolean DEFAULT true,
    "anchorId" varchar(50),
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_cms_sections_page" ON cms_sections ("pageId");

-- ═══ CMS MEDIAS ═══
CREATE TABLE IF NOT EXISTS cms_medias (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL REFERENCES etablissements(id),
    "nom" varchar(255) NOT NULL,
    "type" varchar(20) NOT NULL,
    "url" varchar(500) NOT NULL,
    "alt" varchar(255),
    "taille" integer,
    "mimeType" varchar(50),
    "largeur" integer,
    "hauteur" integer,
    "metadata" jsonb,
    "dossier" varchar(100),
    "createdAt" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_cms_medias_etab" ON cms_medias ("etablissementId");
CREATE INDEX IF NOT EXISTS "idx_cms_medias_type" ON cms_medias ("type");

-- ═══ CMS THEMES ═══
CREATE TABLE IF NOT EXISTS cms_themes (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL REFERENCES etablissements(id),
    "nom" varchar(100) NOT NULL,
    "variables" jsonb NOT NULL DEFAULT '{}',
    "polices" jsonb,
    "actif" boolean DEFAULT false,
    "estSysteme" boolean DEFAULT false,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_cms_themes_etab" ON cms_themes ("etablissementId");

-- ═══ CMS MENUS ═══
CREATE TABLE IF NOT EXISTS cms_menus (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL REFERENCES etablissements(id),
    "nom" varchar(100) NOT NULL,
    "emplacement" varchar(30) DEFAULT 'header',
    "items" jsonb NOT NULL DEFAULT '[]',
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_cms_menus_etab" ON cms_menus ("etablissementId");

-- ═══ CMS WIDGETS ═══
CREATE TABLE IF NOT EXISTS cms_widgets (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL REFERENCES etablissements(id),
    "type" varchar(50) NOT NULL,
    "titre" varchar(200),
    "config" jsonb NOT NULL DEFAULT '{}',
    "emplacement" varchar(30) DEFAULT 'sidebar',
    "ordre" int DEFAULT 0,
    "actif" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_cms_widgets_etab" ON cms_widgets ("etablissementId");

-- ═══ CMS VERSIONS ═══
CREATE TABLE IF NOT EXISTS cms_versions (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL REFERENCES etablissements(id),
    "entiteType" varchar(50) NOT NULL,
    "entiteId" uuid NOT NULL,
    "snapshot" jsonb NOT NULL,
    "auteurId" uuid,
    "commentaire" varchar(255),
    "version" int DEFAULT 1,
    "createdAt" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_cms_versions_etab_entite"
    ON cms_versions ("etablissementId", "entiteType", "entiteId");

-- ═══ ROW-LEVEL SECURITY ═══
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['cms_pages', 'cms_medias', 'cms_themes',
                              'cms_menus', 'cms_widgets', 'cms_versions']
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Note: cms_sections n'a pas d'etablissementId direct — isolation via pageId → cms_pages
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections FORCE ROW LEVEL SECURITY;

-- ═══ SEEDS — 6 thèmes système prédéfinis ═══
-- Chaque établissement actif reçoit les 6 thèmes par défaut
INSERT INTO cms_themes ("etablissementId", nom, variables, "estSysteme", actif)
SELECT
    e.id,
    'Classique Vert',
    '{"couleurFond":"#ffffff","couleurTexte":"#212529","couleurPrimaire":"#28a745","couleurSecondaire":"#007bff","couleurAccent":"#ffc107","policeTitres":"Playfair Display","policeCorps":"Inter","styleBordures":"rounded","headerStyle":"solid","footerStyle":"complet"}'::jsonb,
    true, true
FROM etablissements e
WHERE e.actif = true
AND NOT EXISTS (
    SELECT 1 FROM cms_themes ct WHERE ct."etablissementId" = e.id AND ct.nom = 'Classique Vert'
);

INSERT INTO cms_themes ("etablissementId", nom, variables, "estSysteme", actif)
SELECT
    e.id,
    'Moderne Bleu',
    '{"couleurFond":"#ffffff","couleurTexte":"#212529","couleurPrimaire":"#007bff","couleurSecondaire":"#6c757d","couleurAccent":"#ffc107","policeTitres":"Montserrat","policeCorps":"Open Sans","styleBordures":"rounded","headerStyle":"gradient","footerStyle":"sombre"}'::jsonb,
    true, false
FROM etablissements e
WHERE e.actif = true
AND NOT EXISTS (
    SELECT 1 FROM cms_themes ct WHERE ct."etablissementId" = e.id AND ct.nom = 'Moderne Bleu'
);

INSERT INTO cms_themes ("etablissementId", nom, variables, "estSysteme", actif)
SELECT
    e.id,
    'Élégant Bordeaux',
    '{"couleurFond":"#fffef5","couleurTexte":"#212529","couleurPrimaire":"#722F37","couleurSecondaire":"#C5A55A","couleurAccent":"#C5A55A","policeTitres":"Playfair Display","policeCorps":"Lato","styleBordures":"sharp","headerStyle":"solid","footerStyle":"complet"}'::jsonb,
    true, false
FROM etablissements e
WHERE e.actif = true
AND NOT EXISTS (
    SELECT 1 FROM cms_themes ct WHERE ct."etablissementId" = e.id AND ct.nom = 'Élégant Bordeaux'
);

INSERT INTO cms_themes ("etablissementId", nom, variables, "estSysteme", actif)
SELECT
    e.id,
    'Dynamique Orange',
    '{"couleurFond":"#ffffff","couleurTexte":"#212529","couleurPrimaire":"#fd7e14","couleurSecondaire":"#212529","couleurAccent":"#28a745","policeTitres":"Poppins","policeCorps":"Roboto","styleBordures":"pill","headerStyle":"solid","footerStyle":"minimal"}'::jsonb,
    true, false
FROM etablissements e
WHERE e.actif = true
AND NOT EXISTS (
    SELECT 1 FROM cms_themes ct WHERE ct."etablissementId" = e.id AND ct.nom = 'Dynamique Orange'
);

INSERT INTO cms_themes ("etablissementId", nom, variables, "estSysteme", actif)
SELECT
    e.id,
    'Nature Vert Forêt',
    '{"couleurFond":"#fefdf5","couleurTexte":"#212529","couleurPrimaire":"#155724","couleurSecondaire":"#8B7355","couleurAccent":"#28a745","policeTitres":"Merriweather","policeCorps":"Source Sans Pro","styleBordures":"rounded","headerStyle":"solid","footerStyle":"complet"}'::jsonb,
    true, false
FROM etablissements e
WHERE e.actif = true
AND NOT EXISTS (
    SELECT 1 FROM cms_themes ct WHERE ct."etablissementId" = e.id AND ct.nom = 'Nature Vert Forêt'
);

INSERT INTO cms_themes ("etablissementId", nom, variables, "estSysteme", actif)
SELECT
    e.id,
    'Minimaliste',
    '{"couleurFond":"#ffffff","couleurTexte":"#212529","couleurPrimaire":"#212529","couleurSecondaire":"#6c757d","couleurAccent":"#007bff","policeTitres":"Inter","policeCorps":"Inter","styleBordures":"sharp","headerStyle":"transparent","footerStyle":"minimal"}'::jsonb,
    true, false
FROM etablissements e
WHERE e.actif = true
AND NOT EXISTS (
    SELECT 1 FROM cms_themes ct WHERE ct."etablissementId" = e.id AND ct.nom = 'Minimaliste'
);
