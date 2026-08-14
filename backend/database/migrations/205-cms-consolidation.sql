-- ==================================
-- eLISAschool - Migration 205 : CMS Consolidation
-- ==================================
-- Correction des enums, consolidation des thèmes, ajout de templates.
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Changements :
-- 1. Correction emplacements menus (header→principal, footer→pied_page, sidebar→lateral)
-- 2. Correction emplacements widgets (footer→pied_page, header→en_tete, homepage→flottant)
-- 3. Correction structure thèmes (flat → nested couleurs+typographie)
-- 4. Ajout 2 templates système (PAGE_A_PROPOS, PAGE_MENTIONS_LEGALES)
-- 5. Mise à jour menus existants avec pageSlug

-- ==================================
-- 1. CORRECTION EMPLACEMENTS MENUS
-- ==================================
UPDATE cms_menus SET "emplacement" = 'principal' WHERE "emplacement" = 'header';
UPDATE cms_menus SET "emplacement" = 'pied_page' WHERE "emplacement" = 'footer';
UPDATE cms_menus SET "emplacement" = 'lateral' WHERE "emplacement" = 'sidebar';

-- ==================================
-- 2. CORRECTION EMPLACEMENTS WIDGETS
-- ==================================
UPDATE cms_widgets SET "emplacement" = 'pied_page' WHERE "emplacement" = 'footer';
UPDATE cms_widgets SET "emplacement" = 'en_tete' WHERE "emplacement" = 'header';
UPDATE cms_widgets SET "emplacement" = 'flottant' WHERE "emplacement" = 'homepage';

-- ==================================
-- 3. CORRECTION STRUCTURE THÈMES (legacy flat → nested)
-- ==================================
-- Transformer les thèmes avec variables flat en structure nested
-- Ancien format : { couleurFond, couleurTexte, couleurPrimaire, couleurSecondaire, couleurAccent, policeTitres, policeCorps }
-- Nouveau format : { couleurs: { primaire, secondaire, accent, fond, texte, texteClair }, typographie: { titre, corps } }

UPDATE cms_themes
SET "variables" = jsonb_build_object(
    'couleurs', jsonb_build_object(
        'primaire', COALESCE("variables"->>'couleurPrimaire', '#28a745'),
        'secondaire', COALESCE("variables"->>'couleurSecondaire', '#007bff'),
        'accent', COALESCE("variables"->>'couleurAccent', '#ffc107'),
        'fond', COALESCE("variables"->>'couleurFond', '#ffffff'),
        'texte', COALESCE("variables"->>'couleurTexte', '#1a1a2e'),
        'texteClair', COALESCE("variables"->>'couleurTexteClair', '#6c757d')
    ),
    'typographie', jsonb_build_object(
        'titre', CASE
            WHEN "variables" ? 'policeTitres' THEN '''"' || ("variables"->>'policeTitres') || '", sans-serif'''
            ELSE '''"Inter", sans-serif'''
        END,
        'corps', CASE
            WHEN "variables" ? 'policeCorps' THEN '''"' || ("variables"->>'policeCorps') || '", sans-serif'''
            ELSE '''"Inter", sans-serif'''
        END
    )
)
WHERE "variables" ? 'couleurPrimaire'
  AND NOT ("variables" ? 'couleurs');

-- ==================================
-- 4. SEED — 2 nouveaux templates système
-- ==================================

-- Template 7 : PAGE_A_PROPOS — Texte + Équipe + Chiffres + Témoignages
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Page À propos',
    'PAGE_A_PROPOS',
    'Page de présentation de l''établissement avec équipe, chiffres clés et témoignages',
    'page',
    '[
        {
            "type": "HERO",
            "titre": "Notre établissement",
            "contenu": {
                "surtitre": "Qui sommes-nous",
                "titre": "Une tradition d''excellence éducative",
                "description": "Découvrez notre histoire, nos valeurs et notre équipe engagée pour la réussite de chaque élève.",
                "boutons": []
            },
            "ordre": 0
        },
        {
            "type": "TEXTE",
            "titre": "Notre histoire",
            "contenu": {
                "html": "<p style=\"max-width:700px;margin:0 auto;line-height:1.8;text-align:justify;\">Fondé il y a plus de 15 ans, notre établissement s''est donné pour mission de former les leaders de demain. Dans un environnement bienveillant et stimulant, nous accompagnons chaque élève vers la réussite académique et personnelle.</p><p style=\"max-width:700px;margin:1rem auto;line-height:1.8;text-align:justify;\">Notre projet pédagogique repose sur trois piliers : l''excellence académique, l''ouverture sur le monde et le développement de la citoyenneté. Chaque élève est unique et mérite une attention particulière.</p>"
            },
            "ordre": 1
        },
        {
            "type": "CHIFFRES_CLES",
            "titre": "L''établissement en chiffres",
            "contenu": {
                "chiffres": [
                    {"valeur": "15+", "label": "Années d''expérience", "description": "Depuis notre création"},
                    {"valeur": "500+", "label": "Élèves", "description": "Inscrits cette année"},
                    {"valeur": "30+", "label": "Enseignants", "description": "Qualifiés et dévoués"},
                    {"valeur": "95%", "label": "Taux de réussite", "description": "Aux examens nationaux"}
                ]
            },
            "ordre": 2
        },
        {
            "type": "EQUIPE",
            "titre": "Notre équipe dirigeante",
            "contenu": {
                "membres": [
                    {"nom": "M. le Directeur", "fonction": "Directeur de l''établissement", "photo": "", "bio": "Engagé pour l''excellence éducative depuis plus de 20 ans."},
                    {"nom": "Mme la Directrice adjointe", "fonction": "Directrice adjointe", "photo": "", "bio": "Spécialiste en pédagogie et innovation éducative."},
                    {"nom": "M. le Surveillant général", "fonction": "Surveillant général", "photo": "", "bio": "Garant du bon fonctionnement et de la discipline."},
                    {"nom": "Mme la Conseillère", "fonction": "Conseillère d''orientation", "photo": "", "bio": "Accompagne les élèves dans leur projet d''orientation."}
                ]
            },
            "ordre": 3
        },
        {
            "type": "TEMOIGNAGES",
            "titre": "Ils nous font confiance",
            "contenu": {
                "temoignages": [
                    {"nom": "Marie K.", "fonction": "Parent d''élève", "texte": "Un établissement exceptionnel. Mon fils s''y épanouit pleinement et ses résultats parlent d''eux-mêmes.", "avatar": ""},
                    {"nom": "Paul N.", "fonction": "Parent d''élève", "texte": "L''équipe pédagogique est à l''écoute et très professionnelle. Je recommande vivement cet établissement.", "avatar": ""},
                    {"nom": "Sarah M.", "fonction": "Ancienne élève", "texte": "Grâce à la formation reçue ici, j''ai pu intégrer une grande école. Merci à tout le personnel.", "avatar": ""}
                ]
            },
            "ordre": 4
        },
        {
            "type": "APPEL_ACTION",
            "titre": "Rejoignez notre communauté éducative",
            "contenu": {
                "description": "Venez découvrir notre établissement et rencontrer notre équipe.",
                "bouton": {"label": "Nous contacter", "url": "/e/{code}/contact"}
            },
            "ordre": 5
        }
    ]'::jsonb,
    true,
    true,
    7
) ON CONFLICT ("code") DO NOTHING;

-- Template 8 : PAGE_MENTIONS_LEGALES — Texte juridique + Téléchargements
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Page Mentions légales',
    'PAGE_MENTIONS_LEGALES',
    'Page de mentions légales avec informations juridiques et documents téléchargeables',
    'special',
    '[
        {
            "type": "TEXTE",
            "titre": "Mentions légales",
            "contenu": {
                "html": "<div style=\"max-width:700px;margin:0 auto;line-height:1.8;\"><h3 style=\"margin-top:1.5rem;margin-bottom:0.5rem;font-size:1.1rem;font-weight:600;\">Éditeur du site</h3><p>Le présent site est la propriété de et est édité par :</p><p>[Nom de l''établissement]<br/>[Adresse complète]<br/>Téléphone : [Numéro]<br/>Email : [Email]</p><h3 style=\"margin-top:1.5rem;margin-bottom:0.5rem;font-size:1.1rem;font-weight:600;\">Directeur de publication</h3><p>[Nom du directeur], en sa qualité de directeur de l''établissement.</p><h3 style=\"margin-top:1.5rem;margin-bottom:0.5rem;font-size:1.1rem;font-weight:600;\">Propriété intellectuelle</h3><p>L''ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est protégé par le droit d''auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p><h3 style=\"margin-top:1.5rem;margin-bottom:0.5rem;font-size:1.1rem;font-weight:600;\">Données personnelles</h3><p>Conformément à la législation en vigueur, les données personnelles collectées sont utilisées uniquement dans le cadre du fonctionnement de l''établissement. Elles ne sont jamais transmises à des tiers.</p><h3 style=\"margin-top:1.5rem;margin-bottom:0.5rem;font-size:1.1rem;font-weight:600;\">Cookies</h3><p>Ce site utilise des cookies uniquement à des fins techniques nécessaires à son bon fonctionnement.</p></div>"
            },
            "ordre": 0
        },
        {
            "type": "TELECHARGEMENTS",
            "titre": "Documents officiels",
            "contenu": {
                "fichiers": [
                    {"nom": "Règlement intérieur", "description": "Règlement en vigueur pour l''année scolaire en cours", "url": "#", "taille": ""},
                    {"nom": "Charte informatique", "description": "Règles d''utilisation des outils numériques", "url": "#", "taille": ""},
                    {"nom": "Politique de confidentialité", "description": "Traitement des données personnelles", "url": "#", "taille": ""}
                ]
            },
            "ordre": 1
        }
    ]'::jsonb,
    true,
    true,
    8
) ON CONFLICT ("code") DO NOTHING;

-- ==================================
-- 5. MISE À JOUR MENUS EXISTANTS (pageSlug)
-- ==================================
-- Transformer les items de menus existants pour utiliser pageSlug au lieu de urlExterne
-- Cette mise à jour ne s'applique qu'aux menus dont les items ont encore l'ancien format

UPDATE cms_menus
SET "items" = (
    SELECT jsonb_agg(
        CASE
            WHEN item->>'urlExterne' = '/' THEN
                (item - 'urlExterne') || jsonb_build_object('pageSlug', '', 'ouvrirdansNouvelOnglet', false)
            WHEN item->>'urlExterne' LIKE '/%' THEN
                (item - 'urlExterne') || jsonb_build_object('pageSlug', substring(item->>'urlExterne' from 2), 'ouvrirdansNouvelOnglet', false)
            WHEN item->>'urlExterne' = '#' THEN
                (item - 'urlExterne') || jsonb_build_object('pageSlug', NULL, 'ouvrirdansNouvelOnglet', false)
            ELSE
                (item - 'urlExterne') || jsonb_build_object('url', item->>'urlExterne', 'ouvrirdansNouvelOnglet', false)
        END
    )
    FROM jsonb_array_elements("items") AS item
)
WHERE "items" IS NOT NULL
  AND "items" != '[]'::jsonb
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements("items") AS item
    WHERE item ? 'urlExterne'
  );
