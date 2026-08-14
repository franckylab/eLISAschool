-- ==================================
-- eLISAschool - Migration 184 : CMS Templates
-- ==================================
-- Crée la table cms_templates et insère 6 templates système par défaut.
-- Version: 1.0.0
-- Auteur: franck arlos chendjou

-- ==================================
-- 1. CREATE TABLE
-- ==================================
CREATE TABLE IF NOT EXISTS cms_templates (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nom" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "categorie" VARCHAR(20) NOT NULL DEFAULT 'page',
    "sectionsDef" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "thumbnail" VARCHAR(500),
    "estSysteme" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_templates_code" ON cms_templates ("code");
CREATE INDEX IF NOT EXISTS "IDX_cms_templates_categorie" ON cms_templates ("categorie");

-- ==================================
-- 2. SEED — 6 Templates système
-- ==================================

-- Template 1 : ACCUEIL_CLASSIQUE — Hero + Chiffres clés + Actualités + CTA
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Accueil Classique',
    'ACCUEIL_CLASSIQUE',
    'Page d''accueil traditionnelle avec hero, chiffres clés, actualités et appel à l''action',
    'accueil',
    '[
        {
            "type": "HERO",
            "titre": "Bienvenue dans notre établissement",
            "contenu": {
                "surtitre": "Excellence éducative",
                "titre": "Former les leaders de demain",
                "description": "Un enseignement de qualité dans un environnement bienveillant et stimulant.",
                "boutons": [
                    {"label": "Découvrir", "url": "#about", "principal": true},
                    {"label": "S''inscrire", "url": "/e/{code}/inscriptions", "principal": false}
                ]
            },
            "ordre": 0
        },
        {
            "type": "CHIFFRES_CLES",
            "titre": "Notre établissement en chiffres",
            "contenu": {
                "chiffres": [
                    {"valeur": "500+", "label": "Élèves", "description": "Inscrits cette année"},
                    {"valeur": "30+", "label": "Enseignants", "description": "Qualifiés et dévoués"},
                    {"valeur": "95%", "label": "Réussite", "description": "Taux de réussite aux examens"},
                    {"valeur": "15", "label": "Années", "description": "D''excellence éducative"}
                ]
            },
            "ordre": 1
        },
        {
            "type": "CARTE_INFOS",
            "titre": "Pourquoi nous choisir",
            "contenu": {
                "cartes": [
                    {"icone": "📚", "titre": "Programme enrichi", "description": "Un curriculum complet aligné sur les standards nationaux avec des activités complémentaires."},
                    {"icone": "🏫", "titre": "Infrastructures modernes", "description": "Salles équipées, laboratoire informatique, bibliothèque et terrains de sport."},
                    {"icone": "👨‍🏫", "titre": "Enseignants qualifiés", "description": "Une équipe pédagogique formée et engagée pour la réussite de chaque élève."},
                    {"icone": "🌍", "titre": "Ouverture internationale", "description": "Partenariats et échanges culturels pour enrichir la formation."},
                    {"icone": "💡", "titre": "Innovation pédagogique", "description": "Méthodes d''enseignement modernes intégrant le numérique."},
                    {"icone": "🤝", "titre": "Accompagnement personnalisé", "description": "Suivi individuel et soutien scolaire pour chaque élève."}
                ]
            },
            "ordre": 2
        },
        {
            "type": "ACTUALITES",
            "titre": "Dernières actualités",
            "contenu": {
                "actualites": [
                    {"titre": "Rentrée scolaire 2026-2027", "date": "2026-09-01", "resume": "Les inscriptions sont ouvertes pour la prochaine année scolaire. Rejoignez notre communauté éducative.", "image": ""},
                    {"titre": "Journée portes ouvertes", "date": "2026-06-15", "resume": "Venez découvrir nos installations et rencontrer notre équipe pédagogique.", "image": ""},
                    {"titre": "Résultats aux examens", "date": "2026-07-20", "resume": "Félicitations à nos élèves pour leurs excellents résultats aux examens nationaux.", "image": ""}
                ]
            },
            "ordre": 3
        },
        {
            "type": "APPEL_ACTION",
            "titre": "Prêt à rejoindre notre famille ?",
            "contenu": {
                "description": "Les inscriptions sont ouvertes. Donnez à votre enfant l''éducation qu''il mérite.",
                "bouton": {"label": "S''inscrire maintenant", "url": "/e/{code}/inscriptions"}
            },
            "ordre": 4
        }
    ]'::jsonb,
    true,
    true,
    1
) ON CONFLICT ("code") DO NOTHING;

-- Template 2 : ACCUEIL_MODERNE — Hero vidéo + Témoignages + Galerie + Partenaires + FAQ
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Accueil Moderne',
    'ACCUEIL_MODERNE',
    'Page d''accueil moderne avec vidéo hero, témoignages, galerie et FAQ',
    'accueil',
    '[
        {
            "type": "HERO",
            "titre": "L''excellence au quotidien",
            "contenu": {
                "surtitre": "Éducation de qualité",
                "titre": "Un avenir brillant commence ici",
                "description": "Rejoignez un établissement engagé pour la réussite et l''épanouissement de chaque élève.",
                "boutons": [
                    {"label": "Visiter l''établissement", "url": "/e/{code}/contact", "principal": true},
                    {"label": "Voir la galerie", "url": "/e/{code}/galerie", "principal": false}
                ]
            },
            "ordre": 0
        },
        {
            "type": "TEXTE",
            "titre": "Notre mission",
            "contenu": {
                "html": "<p style=\"text-align:center;max-width:700px;margin:0 auto;font-size:1.1rem;line-height:1.8;\">Nous croyons que chaque enfant possède un potentiel unique. Notre mission est de le révéler à travers un enseignement rigoureux, bienveillant et innovant. Dans un environnement sécurisé et stimulant, nos élèves développent leurs compétences académiques, artistiques et sportives.</p>"
            },
            "ordre": 1
        },
        {
            "type": "TEMOIGNAGES",
            "titre": "Ce que disent nos familles",
            "contenu": {
                "temoignages": [
                    {"nom": "Marie K.", "fonction": "Parent d''élève", "texte": "Un établissement exceptionnel. Mon fils s''y épanouit pleinement et ses résultats parlent d''eux-mêmes.", "avatar": ""},
                    {"nom": "Paul N.", "fonction": "Parent d''élève", "texte": "L''équipe pédagogique est à l''écoute et très professionnelle. Je recommande vivement.", "avatar": ""},
                    {"nom": "Sarah M.", "fonction": "Ancienne élève", "texte": "Grâce à la formation reçue, j''ai pu intégrer une grande école. Merci à tout le personnel.", "avatar": ""}
                ]
            },
            "ordre": 2
        },
        {
            "type": "GALERIE",
            "titre": "Nos installations",
            "contenu": {
                "images": [],
                "colonnes": 3
            },
            "ordre": 3
        },
        {
            "type": "FAQ",
            "titre": "Questions fréquentes",
            "contenu": {
                "faqs": [
                    {"question": "Quels sont les niveaux enseignés ?", "reponse": "Nous couvrons tous les niveaux du primaire au secondaire, avec des programmes alignés sur le curriculum national."},
                    {"question": "Quel est le calendrier scolaire ?", "reponse": "Nous suivons le calendrier officiel du Ministère de l''Éducation, avec des activités parascolaires toute l''année."},
                    {"question": "Comment s''inscrire ?", "reponse": "Les inscriptions se font en ligne ou sur place. Contactez-nous pour obtenir le dossier d''inscription."},
                    {"question": "Y a-t-il un service de transport ?", "reponse": "Oui, un service de bus scolaire couvre les principaux quartiers de la ville."}
                ]
            },
            "ordre": 4
        }
    ]'::jsonb,
    true,
    true,
    2
) ON CONFLICT ("code") DO NOTHING;

-- Template 3 : PAGE_INFORMATION — Texte + Carte infos + Téléchargements
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Page d''information',
    'PAGE_INFORMATION',
    'Page d''information générique avec texte, cartes et documents téléchargeables',
    'page',
    '[
        {
            "type": "TEXTE",
            "titre": "À propos",
            "contenu": {
                "html": "<p>Contenu de la page d''information. Remplacez ce texte par vos propres informations.</p><p>Vous pouvez ajouter autant de paragraphes que nécessaire.</p>"
            },
            "ordre": 0
        },
        {
            "type": "CARTE_INFOS",
            "titre": "Points clés",
            "contenu": {
                "cartes": [
                    {"icone": "🎯", "titre": "Notre vision", "description": "Description de la vision de l''établissement."},
                    {"icone": "🚀", "titre": "Nos objectifs", "description": "Les objectifs pédagogiques et éducatifs."},
                    {"icone": "⭐", "titre": "Nos valeurs", "description": "Les valeurs qui guident notre action au quotidien."}
                ]
            },
            "ordre": 1
        },
        {
            "type": "TELECHARGEMENTS",
            "titre": "Documents utiles",
            "contenu": {
                "fichiers": [
                    {"nom": "Règlement intérieur", "description": "Document officiel", "url": "#", "taille": "2.1 Mo"},
                    {"nom": "Projet d''établissement", "description": "Vision et objectifs", "url": "#", "taille": "1.5 Mo"}
                ]
            },
            "ordre": 2
        }
    ]'::jsonb,
    true,
    true,
    3
) ON CONFLICT ("code") DO NOTHING;

-- Template 4 : PAGE_CONTACT — Texte + Formulaire + Carte + Horaires
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Page Contact',
    'PAGE_CONTACT',
    'Page de contact avec formulaire, carte géographique et horaires d''ouverture',
    'special',
    '[
        {
            "type": "TEXTE",
            "titre": "Contactez-nous",
            "contenu": {
                "html": "<p style=\"text-align:center;\">N''hésitez pas à nous contacter pour toute question. Notre équipe se fera un plaisir de vous répondre.</p>"
            },
            "ordre": 0
        },
        {
            "type": "FORMULAIRE",
            "titre": "Envoyer un message",
            "contenu": {
                "description": "Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais."
            },
            "ordre": 1
        },
        {
            "type": "CARTE",
            "titre": "Nous trouver",
            "contenu": {},
            "ordre": 2
        },
        {
            "type": "HORAIRES",
            "titre": "Horaires d''ouverture",
            "contenu": {
                "horaires": [
                    {"jour": "Lundi - Vendredi", "horaires": "07h30 - 17h00"},
                    {"jour": "Samedi", "horaires": "08h00 - 12h00"},
                    {"jour": "Dimanche", "horaires": "Fermé"}
                ]
            },
            "ordre": 3
        }
    ]'::jsonb,
    true,
    true,
    4
) ON CONFLICT ("code") DO NOTHING;

-- Template 5 : PAGE_GALERIE — Galerie + Vidéo
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Page Galerie',
    'PAGE_GALERIE',
    'Page galerie photos avec section vidéo',
    'special',
    '[
        {
            "type": "TEXTE",
            "titre": "Galerie photos",
            "contenu": {
                "html": "<p style=\"text-align:center;\">Découvrez notre établissement en images.</p>"
            },
            "ordre": 0
        },
        {
            "type": "GALERIE",
            "titre": "Nos installations",
            "contenu": {
                "images": [],
                "colonnes": 3
            },
            "ordre": 1
        },
        {
            "type": "VIDEO",
            "titre": "Présentation en vidéo",
            "contenu": {
                "youtubeId": "",
                "description": "Découvrez notre établissement en vidéo."
            },
            "ordre": 2
        }
    ]'::jsonb,
    true,
    true,
    5
) ON CONFLICT ("code") DO NOTHING;

-- Template 6 : PAGE_INSCRIPTIONS — Hero CTA + Chiffres + Étapes + FAQ + CTA
INSERT INTO cms_templates ("nom", "code", "description", "categorie", "sectionsDef", "estSysteme", "actif", "ordre")
VALUES (
    'Page Inscriptions',
    'PAGE_INSCRIPTIONS',
    'Page d''inscriptions avec étapes, FAQ et appels à l''action',
    'special',
    '[
        {
            "type": "HERO",
            "titre": "Inscriptions ouvertes",
            "contenu": {
                "surtitre": "Rejoignez-nous",
                "titre": "Inscrivez votre enfant dès maintenant",
                "description": "Un processus simple et rapide pour intégrer notre établissement.",
                "boutons": [
                    {"label": "Formulaire d''inscription", "url": "#form", "principal": true},
                    {"label": "Télécharger le dossier", "url": "#", "principal": false}
                ]
            },
            "ordre": 0
        },
        {
            "type": "CHIFFRES_CLES",
            "titre": "L''établissement en chiffres",
            "contenu": {
                "chiffres": [
                    {"valeur": "500+", "label": "Élèves inscrits"},
                    {"valeur": "30+", "label": "Enseignants"},
                    {"valeur": "95%", "label": "Taux de réussite"},
                    {"valeur": "15", "label": "Années d''expérience"}
                ]
            },
            "ordre": 1
        },
        {
            "type": "CARTE_INFOS",
            "titre": "Étapes d''inscription",
            "contenu": {
                "cartes": [
                    {"icone": "1️⃣", "titre": "Retirer le dossier", "description": "Téléchargez ou retirez sur place le dossier d''inscription complet."},
                    {"icone": "2️⃣", "titre": "Constituer le dossier", "description": "Rassemblez les pièces demandées (bulletins, actes, photos)."},
                    {"icone": "3️⃣", "titre": "Déposer le dossier", "description": "Soumettez le dossier complet au secrétariat ou en ligne."},
                    {"icone": "4️⃣", "titre": "Confirmation", "description": "Recevez la confirmation d''inscription sous 48h."}
                ]
            },
            "ordre": 2
        },
        {
            "type": "FAQ",
            "titre": "Questions sur l''inscription",
            "contenu": {
                "faqs": [
                    {"question": "Quels documents fournir ?", "reponse": "Acte de naissance, bulletins de l''année précédente, 4 photos d''identité, certificat médical."},
                    {"question": "Quels sont les frais de scolarité ?", "reponse": "Les frais varient selon le niveau. Contactez-nous pour obtenir la grille tarifaire complète."},
                    {"question": "Y a-t-il un test d''entrée ?", "reponse": "Un test de niveau peut être demandé pour certaines classes afin d''assurer un bon orientation."},
                    {"question": "Les bourses sont-elles disponibles ?", "reponse": "Oui, des bourses d''excellence et des aides sociales sont disponibles sur dossier."}
                ]
            },
            "ordre": 3
        },
        {
            "type": "APPEL_ACTION",
            "titre": "N''attendez plus !",
            "contenu": {
                "description": "Les places sont limitées. Inscrivez votre enfant dès aujourd''hui.",
                "bouton": {"label": "Commencer l''inscription", "url": "#form"}
            },
            "ordre": 4
        }
    ]'::jsonb,
    true,
    true,
    6
) ON CONFLICT ("code") DO NOTHING;
