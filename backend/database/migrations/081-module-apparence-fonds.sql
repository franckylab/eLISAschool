/**
 * ==================================
 * eLISAschool - Migration 081 : Module Apparence — Fonds d'écran SVG
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Création des tables pour le système de fonds d'écran SVG :
 * - `fonds` : catalogue global des 36 fonds (12 catégories × 3 variations)
 * - `fonds_etablissement` : relation M2M avec métadonnées (actif, ordre, dateAjout)
 * 
 * Permissions RBAC : apparence:fonds:view, apparence:fonds:manage
 */

-- ========================================
-- 1. Table `fonds` — Catalogue global
-- ========================================
CREATE TABLE IF NOT EXISTS fonds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    categorie VARCHAR(50) NOT NULL,
    cheminFichier VARCHAR(500) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'catalogue',
    estActif BOOLEAN NOT NULL DEFAULT true,
    estSysteme BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Index sur categorie pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_fonds_categorie ON fonds(categorie);

-- Index sur estActif pour requêtes de rotation
CREATE INDEX IF NOT EXISTS idx_fonds_estActif ON fonds("estActif");

-- Index sur source pour distinguer catalogue vs upload
CREATE INDEX IF NOT EXISTS idx_fonds_source ON fonds(source);

COMMENT ON TABLE fonds IS 'Catalogue global des fonds d''écran SVG (systeme + uploads)';
COMMENT ON COLUMN fonds.categorie IS 'Catégorie thématique : instrument_mesure, instrument_calcul, materiel_laboratoire, etc.';
COMMENT ON COLUMN fonds.source IS 'Origine du fond : catalogue (système) ou upload (établissement)';
COMMENT ON COLUMN fonds.estSysteme IS 'true = fond système (non supprimable), false = upload utilisateur';

-- ========================================
-- 2. Table `fonds_etablissement` — Relation M2M
-- ========================================
CREATE TABLE IF NOT EXISTS fonds_etablissement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" UUID NOT NULL,
    "fondId" UUID NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT true,
    ordre INT NOT NULL DEFAULT 0,
    "dateAjout" TIMESTAMP NOT NULL DEFAULT now(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Contrainte unique : un établissement ne peut avoir un fond qu'une seule fois
CREATE UNIQUE INDEX IF NOT EXISTS idx_fonds_etablissement_unique 
ON fonds_etablissement("etablissementId", "fondId");

-- Index pour requêtes par établissement
CREATE INDEX IF NOT EXISTS idx_fonds_etablissement_etablissement 
ON fonds_etablissement("etablissementId");

-- Index pour jointure vers fonds
CREATE INDEX IF NOT EXISTS idx_fonds_etablissement_fond 
ON fonds_etablissement("fondId");

-- Index composite pour tri par ordre
CREATE INDEX IF NOT EXISTS idx_fonds_etablissement_etablissement_ordre 
ON fonds_etablissement("etablissementId", ordre);

-- Clés étrangères
ALTER TABLE fonds_etablissement
ADD CONSTRAINT fk_fonds_etablissement_fond
FOREIGN KEY ("fondId") REFERENCES fonds(id) ON DELETE CASCADE;

-- Pas de FK vers etablissements (table peut exister avant seed établissement)

COMMENT ON TABLE fonds_etablissement IS 'Association des fonds actifs par établissement avec ordre de rotation';
COMMENT ON COLUMN fonds_etablissement.actif IS 'true = fond inclus dans la rotation de cet établissement';
COMMENT ON COLUMN fonds_etablissement.ordre IS 'Ordre de rotation (0 = premier, 1 = deuxième, etc.)';

-- ========================================
-- 3. Seed : 36 fonds catalogue (12 catégories × 3 variations)
-- ========================================

-- Catégorie 1 : Instruments de mesure
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Règles et équerres', 'Motif géométrique avec règles graduées et équerres en transparence', 'instrument_mesure', 'fonds-catalogue/instrument-mesure-01.svg', 'catalogue', true, true),
('Compas et rapporteurs', 'Composition de compas, rapporteurs et pieds à coulisse stylisés', 'instrument_mesure', 'fonds-catalogue/instrument-mesure-02.svg', 'catalogue', true, true),
('Niveaux et mètres', 'Patterns de niveaux à bulle, mètres pliants et rubans de mesure', 'instrument_mesure', 'fonds-catalogue/instrument-mesure-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 2 : Instruments de calcul
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Calculatrices vintage', 'Grille de calculatrices scientifiques et graphiques rétro', 'instrument_calcul', 'fonds-catalogue/instrument-calcul-01.svg', 'catalogue', true, true),
('Bouliers et abaques', 'Motifs de bouliers asiatiques et abaques de calcul', 'instrument_calcul', 'fonds-catalogue/instrument-calcul-02.svg', 'catalogue', true, true),
('Formules mathématiques', 'Équations et symboles mathématiques en filigrane', 'instrument_calcul', 'fonds-catalogue/instrument-calcul-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 3 : Matériel de laboratoire
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Tubes à essai et béchers', 'Composition de verrerie de laboratoire stylisée', 'materiel_laboratoire', 'fonds-catalogue/materiel-laboratoire-01.svg', 'catalogue', true, true),
('Microscopes et lentilles', 'Motifs géométriques inspirés de microscopes et systèmes optiques', 'materiel_laboratoire', 'fonds-catalogue/materiel-laboratoire-02.svg', 'catalogue', true, true),
('Balance et pipettes', 'Patterns de balances de précision et pipettes graduées', 'materiel_laboratoire', 'fonds-catalogue/materiel-laboratoire-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 4 : Matériel informatique
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Circuits et processeurs', 'Motifs de circuits imprimés et puces électroniques', 'materiel_informatique', 'fonds-catalogue/materiel-informatique-01.svg', 'catalogue', true, true),
('Claviers et écrans', 'Composition de claviers, souris et moniteurs stylisés', 'materiel_informatique', 'fonds-catalogue/materiel-informatique-02.svg', 'catalogue', true, true),
('Réseaux et serveurs', 'Patterns de serveurs, routeurs et câbles réseau', 'materiel_informatique', 'fonds-catalogue/materiel-informatique-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 5 : Matériel électrique
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Schémas électriques', 'Motifs de schémas électriques et symboles de composants', 'materiel_electrique', 'fonds-catalogue/materiel-electrique-01.svg', 'catalogue', true, true),
('Oscilloscopes et multimètres', 'Composition d''instruments de mesure électrique', 'materiel_electrique', 'fonds-catalogue/materiel-electrique-02.svg', 'catalogue', true, true),
('Fils et connecteurs', 'Patterns de câbles, connecteurs et borniers stylisés', 'materiel_electrique', 'fonds-catalogue/materiel-electrique-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 6 : Matériel de bureau
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Stylos et crayons', 'Grille de stylos, crayons et marqueurs en diagonale', 'materiel_bureau', 'fonds-catalogue/materiel-bureau-01.svg', 'catalogue', true, true),
('Agrafeuses et ciseaux', 'Motifs d''accessoires de bureau (agrafeuses, ciseaux, trombones)', 'materiel_bureau', 'fonds-catalogue/materiel-bureau-02.svg', 'catalogue', true, true),
('Blocs-notes et Post-it', 'Composition de blocs-notes, pense-bêtes et post-it colorés', 'materiel_bureau', 'fonds-catalogue/materiel-bureau-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 7 : Matériel de bâtiment
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Plans d''architecte', 'Motifs de plans de bâtiment avec cotes et annotations', 'materiel_batiment', 'fonds-catalogue/materiel-batiment-01.svg', 'catalogue', true, true),
('Truelles et marteaux', 'Composition d''outils de construction stylisés', 'materiel_batiment', 'fonds-catalogue/materiel-batiment-02.svg', 'catalogue', true, true),
('Échelles et échafaudages', 'Patterns géométriques inspirés d''échelles et structures', 'materiel_batiment', 'fonds-catalogue/materiel-batiment-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 8 : Objets de salle de classe
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Tableau et craies', 'Motifs de tableaux noirs avec formules et dessins à la craie', 'objet_salle_classe', 'fonds-catalogue/objet-salle-classe-01.svg', 'catalogue', true, true),
('Bureaux et chaises', 'Composition de mobilier scolaire en perspective isométrique', 'objet_salle_classe', 'fonds-catalogue/objet-salle-classe-02.svg', 'catalogue', true, true),
('Horloge et planning', 'Patterns d''horloges murales et plannings de classe', 'objet_salle_classe', 'fonds-catalogue/objet-salle-classe-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 9 : Livres et documentation
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Bibliothèque de livres', 'Grille de livres empilés et ouverts en filigrane', 'livres_documentation', 'fonds-catalogue/livres-documentation-01.svg', 'catalogue', true, true),
('Dictionnaires et encyclopédies', 'Motifs de dictionnaires, encyclopédies et atlas', 'livres_documentation', 'fonds-catalogue/livres-documentation-02.svg', 'catalogue', true, true),
('Manuels scolaires', 'Composition de manuels scolaires avec marque-pages', 'livres_documentation', 'fonds-catalogue/livres-documentation-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 10 : Sport et éducation physique
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Ballons et sports', 'Motifs de ballons (foot, basket, volley) en pattern', 'sport_education_physique', 'fonds-catalogue/sport-education-physique-01.svg', 'catalogue', true, true),
('Chronomètres et sifflets', 'Composition d''accessoires d''arbitrage et timing', 'sport_education_physique', 'fonds-catalogue/sport-education-physique-02.svg', 'catalogue', true, true),
('Agréès et équipements', 'Patterns de barres, anneaux et matériel de gym', 'sport_education_physique', 'fonds-catalogue/sport-education-physique-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 11 : Arts et créativité
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Palettes et pinceaux', 'Grille de palettes de couleurs, pinceaux et pots de peinture', 'arts_creativite', 'fonds-catalogue/arts-creativite-01.svg', 'catalogue', true, true),
('Ciseaux et colle', 'Motifs d''outils de découpage et collage artistique', 'arts_creativite', 'fonds-catalogue/arts-creativite-02.svg', 'catalogue', true, true),
('Formes géométriques créatives', 'Composition de formes, motifs et mandalas éducatifs', 'arts_creativite', 'fonds-catalogue/arts-creativite-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- Catégorie 12 : Musique
INSERT INTO fonds (nom, description, categorie, cheminFichier, source, estActif, estSysteme) VALUES
('Notes de musique', 'Portées et notes de musique en filigrane élégant', 'musique', 'fonds-catalogue/musique-01.svg', 'catalogue', true, true),
('Instruments à cordes', 'Motifs de guitares, violons et harpes stylisés', 'musique', 'fonds-catalogue/musique-02.svg', 'catalogue', true, true),
('Piano et percussion', 'Composition de touches de piano et instruments de percussion', 'musique', 'fonds-catalogue/musique-03.svg', 'catalogue', true, true)
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. Vérification du seed
-- ========================================
DO $$
DECLARE
    fond_count INT;
    categorie_count INT;
BEGIN
    SELECT COUNT(*) INTO fond_count FROM fonds WHERE source = 'catalogue';
    SELECT COUNT(DISTINCT categorie) INTO categorie_count FROM fonds WHERE source = 'catalogue';
    
    RAISE NOTICE 'Migration 081 : % fonds catalogue créés dans % catégories', fond_count, categorie_count;
    
    IF fond_count < 36 THEN
        RAISE WARNING 'Migration 081 : Seulement %/36 fonds créés, vérifiez les conflits ON CONFLICT', fond_count;
    END IF;
END $$;
