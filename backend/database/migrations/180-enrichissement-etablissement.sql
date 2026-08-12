-- ==================================
-- eLISAschool - Enrichissement entité Etablissement
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- 9 nouveaux champs pour pages publiques & CMS :
-- - Localisation géographique (pays, region, quartier)
-- - Identifiants officiels (enregistrement, identification, autorisation)
-- - Coordonnées GPS (latitude, longitude)
-- - Contenu public (descriptionPublique)
-- Idempotent (IF NOT EXISTS)
-- ==================================

-- Localisation géographique
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "pays" varchar(50) DEFAULT 'Cameroun';
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "region" varchar(100);
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "quartier" varchar(150);

-- Identifiants officiels
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "numeroEnregistrement" varchar(50);
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "numeroIdentification" varchar(50);
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "numeroAutorisation" varchar(50);

-- Coordonnées GPS
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "latitude" decimal(10,7);
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "longitude" decimal(10,7);

-- Contenu public
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS "descriptionPublique" text;

-- Index
CREATE INDEX IF NOT EXISTS "idx_etablissements_pays" ON etablissements ("pays");
CREATE INDEX IF NOT EXISTS "idx_etablissements_gps" ON etablissements ("latitude", "longitude");
