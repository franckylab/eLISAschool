-- ==================================
-- eLISAschool - Migration 114 : Normalisation échelons structurels v4.1
-- ==================================
-- Contexte : consolidation des 13 échelons en 10 échelons sans redondance.
-- Suppressions : DIRECTION_GENERAL (doublon DIRECTION),
--                DEPARTEMENT (doublon DEPARTEMENT_PEDA),
--                SOUS_SERVICE (non utilisé, fusionné dans EQUIPE/BUREAU),
--                BIBLIOTHEQUE (renommé CDI)
-- Ajouts : couleur sur tous les échelons système
-- ==================================

-- 1. Renommer BIBLIOTHEQUE → CDI (conserver les unités liées)
UPDATE echelons_structurels
SET code = 'CDI',
    label = 'CDI',
    description = 'Centre de documentation et d''information',
    couleur = '#9333ea'
WHERE code = 'BIBLIOTHEQUE';

-- 2. Supprimer les échelons redondants (non référencés dans les unités)
-- DIRECTION_GENERAL : doublon avec DIRECTION
DELETE FROM echelons_structurels WHERE code = 'DIRECTION_GENERAL';

-- DEPARTEMENT : doublon avec DEPARTEMENT_PEDA
DELETE FROM echelons_structurels WHERE code = 'DEPARTEMENT';

-- SOUS_SERVICE : non utilisé
DELETE FROM echelons_structurels WHERE code = 'SOUS_SERVICE';

-- 3. Ajouter les couleurs sur les échelons système existants
UPDATE echelons_structurels SET couleur = '#2563eb' WHERE code = 'ETABLISSEMENT' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#7c3aed' WHERE code = 'DIRECTION' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#059669' WHERE code = 'DEPARTEMENT_PEDA' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#d97706' WHERE code = 'SERVICE' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#dc2626' WHERE code = 'COMMISSION' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#0891b2' WHERE code = 'EQUIPE' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#4f46e5' WHERE code = 'BUREAU' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#c026d3' WHERE code = 'ATELIER' AND couleur IS NULL;
UPDATE echelons_structurels SET couleur = '#0d9488' WHERE code = 'LABORATOIRE' AND couleur IS NULL;

-- 4. Mettre à jour les descriptions pour plus de clarté
UPDATE echelons_structurels SET description = 'Niveau établissement (racine)' WHERE code = 'ETABLISSEMENT';
UPDATE echelons_structurels SET description = 'Direction et services rattachés' WHERE code = 'DIRECTION';
UPDATE echelons_structurels SET description = 'Département pédagogique (disciplines, cycles)' WHERE code = 'DEPARTEMENT_PEDA';
UPDATE echelons_structurels SET description = 'Service administratif ou spécialisé' WHERE code = 'SERVICE';
UPDATE echelons_structurels SET description = 'Commission ou comité (conseil de classe, discipline…)' WHERE code = 'COMMISSION';
UPDATE echelons_structurels SET description = 'Équipe ou cellule de travail' WHERE code = 'EQUIPE';
UPDATE echelons_structurels SET description = 'Bureau ou unité administrative' WHERE code = 'BUREAU';
UPDATE echelons_structurels SET description = 'Atelier technique ou artistique' WHERE code = 'ATELIER';
UPDATE echelons_structurels SET description = 'Laboratoire scientifique ou informatique' WHERE code = 'LABORATOIRE';
