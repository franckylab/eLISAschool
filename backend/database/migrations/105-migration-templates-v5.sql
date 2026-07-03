-- ==================================
-- eLISAschool - Migration 105 : Mise à jour templates système v5.0
-- ==================================
-- Version: 5.0.0
-- NOTE: Colonnes en camelCase (TypeORM par défaut)
-- ==================================
--
-- Objectif :
-- - Migrer les 4 templates système persistés du format v4 (champ `type`) 
--   vers le format v5.0 (champs `niveau` + `usageCode`)
-- - Renommer "Séquence" → "Évaluation" pour coller à la réforme 2019
-- - Ajouter les nouveaux templates système (primaire, année unique, etc.)
-- ==================================

-- =============================================
-- 1. MISE À JOUR des templates système existants
-- =============================================

-- Template 1 : "3 Trimestres × 2 Séquences" → "3 Trimestres × 2 Évaluations"
UPDATE templates_periode
SET nom = '3 Trimestres × 2 Évaluations',
    description = '3 trimestres, chacun divisé en 2 évaluations. Total : 3 trimestres + 6 évaluations.',
    structure = '{
        "niveau": 3,
        "usageCode": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "niveau": 1,
                "usageCode": "BULLETIN",
                "count": 3,
                "nom": "Trimestre {n}",
                "enfants": [
                    {
                        "niveau": 0,
                        "usageCode": "NOTES",
                        "count": 2,
                        "nom": "Évaluation {n}"
                    }
                ]
            }
        ]
    }'::jsonb
WHERE nom = '3 Trimestres × 2 Séquences';

-- Template 2 : "2 Semestres × 3 Séquences" → "2 Semestres × 3 Évaluations"
UPDATE templates_periode
SET nom = '2 Semestres × 3 Évaluations',
    description = '2 semestres, chacun divisé en 3 évaluations. Total : 2 semestres + 6 évaluations.',
    structure = '{
        "niveau": 3,
        "usageCode": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "niveau": 2,
                "usageCode": "BULLETIN",
                "count": 2,
                "nom": "Semestre {n}",
                "enfants": [
                    {
                        "niveau": 0,
                        "usageCode": "NOTES",
                        "count": 3,
                        "nom": "Évaluation {n}"
                    }
                ]
            }
        ]
    }'::jsonb
WHERE nom = '2 Semestres × 3 Séquences';

-- Template 3 : "6 Séquences directes" → "6 Évaluations directes"
UPDATE templates_periode
SET nom = '6 Évaluations directes',
    description = '6 évaluations sans regroupement. Total : 6 évaluations.',
    structure = '{
        "niveau": 3,
        "usageCode": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "niveau": 0,
                "usageCode": "NOTES",
                "count": 6,
                "nom": "Évaluation {n}"
            }
        ]
    }'::jsonb
WHERE nom = '6 Séquences directes';

-- Template 4 : "2 Trimestres simples" → mise à jour vers v5.0
UPDATE templates_periode
SET description = '2 trimestres sans sous-découpe. Total : 2 trimestres.',
    structure = '{
        "niveau": 3,
        "usageCode": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "niveau": 1,
                "usageCode": "BULLETIN",
                "count": 2,
                "nom": "Trimestre {n}"
            }
        ]
    }'::jsonb
WHERE nom = '2 Trimestres simples';

-- =============================================
-- 2. NOUVEAUX templates système
-- =============================================

-- Template 5 : "3 Trimestres directs" (post-réforme 2019, sans sous-périodes)
INSERT INTO templates_periode (nom, description, structure, "estSysteme", actif)
SELECT '3 Trimestres directs',
    '3 trimestres sans sous-périodes. Modèle post-réforme 2019.',
    '{
        "niveau": 3,
        "usageCode": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "niveau": 1,
                "usageCode": "BULLETIN",
                "count": 3,
                "nom": "Trimestre {n}"
            }
        ]
    }'::jsonb,
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM templates_periode WHERE nom = '3 Trimestres directs'
);

-- Template 6 : "9 Évaluations mensuelles (Primaire)"
INSERT INTO templates_periode (nom, description, structure, "estSysteme", actif)
SELECT '9 Évaluations mensuelles (Primaire)',
    '9 évaluations mensuelles adaptées au primaire (mentions A/ECA/NA).',
    '{
        "niveau": 3,
        "usageCode": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "niveau": 1,
                "usageCode": "BULLETIN",
                "count": 9,
                "nom": "Mois {n}"
            }
        ]
    }'::jsonb,
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM templates_periode WHERE nom = '9 Évaluations mensuelles (Primaire)'
);

-- Template 7 : "Année unique"
INSERT INTO templates_periode (nom, description, structure, "estSysteme", actif)
SELECT 'Année unique',
    'Période unique annuelle sans subdivision.',
    '{
        "niveau": 3,
        "usageCode": "ANNEE",
        "count": 1,
        "nom": "Année scolaire"
    }'::jsonb,
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM templates_periode WHERE nom = 'Année unique'
);

-- =============================================
-- 3. PARAMÈTRES SYSTÈME — Mise à jour
-- =============================================

-- Ajouter le paramètre pour le label des évaluations
INSERT INTO parametres_systeme (cle, valeur, description, categorie, module, "typeValeur")
SELECT 'periodes.label_evaluation', 'Évaluation', 'Libellé personnalisé pour les évaluations (niveau 0)', 'MODULE', 'periodes', 'STRING'
WHERE NOT EXISTS (
    SELECT 1 FROM parametres_systeme WHERE cle = 'periodes.label_evaluation' AND "etablissementId" IS NULL
);
