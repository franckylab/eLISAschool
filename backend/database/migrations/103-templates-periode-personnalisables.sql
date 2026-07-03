-- ==================================
-- eLISAschool - Migration 103 : Templates de périodes personnalisables
-- ==================================
-- Version: 4.0.0
-- Auteur: franck arlos chendjou
--
-- Objectif :
-- - Créer la table templates_periode (remplace l'enum TemplatePeriode hardcodé)
-- - Seeder les 4 templates système par défaut
-- - Ajouter les paramètres système pour les labels personnalisés
-- ==================================

-- =============================================
-- 1. TABLE templates_periode
-- =============================================

CREATE TABLE IF NOT EXISTS templates_periode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    structure JSONB NOT NULL,
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
    est_systeme BOOLEAN NOT NULL DEFAULT false,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_templates_periode_etablissement ON templates_periode(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_templates_periode_actif ON templates_periode(actif);

-- =============================================
-- 2. SEED — 4 templates système par défaut
-- =============================================

-- Template 1 : 3 Trimestres × 2 Évaluations (Cameroun francophone)
INSERT INTO templates_periode (nom, description, structure, est_systeme, actif)
VALUES (
    '3 Trimestres × 2 Évaluations',
    '3 trimestres, chacun divisé en 2 évaluations. Total : 3 trimestres + 6 évaluations.',
    '{
        "type": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "type": "TRIMESTRE",
                "count": 3,
                "nom": "Trimestre {n}",
                "enfants": [
                    {
                        "type": "EVALUATION",
                        "count": 2,
                        "nom": "Évaluation {n}"
                    }
                ]
            }
        ]
    }'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Template 2 : 2 Semestres × 3 Évaluations
INSERT INTO templates_periode (nom, description, structure, est_systeme, actif)
VALUES (
    '2 Semestres × 3 Évaluations',
    '2 semestres, chacun divisé en 3 évaluations. Total : 2 semestres + 6 évaluations.',
    '{
        "type": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "type": "SEMESTRE",
                "count": 2,
                "nom": "Semestre {n}",
                "enfants": [
                    {
                        "type": "EVALUATION",
                        "count": 3,
                        "nom": "Évaluation {n}"
                    }
                ]
            }
        ]
    }'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Template 3 : 6 Évaluations directes (sans parent)
INSERT INTO templates_periode (nom, description, structure, est_systeme, actif)
VALUES (
    '6 Évaluations directes',
    '6 évaluations sans regroupement. Total : 6 évaluations.',
    '{
        "type": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "type": "EVALUATION",
                "count": 6,
                "nom": "Évaluation {n}"
            }
        ]
    }'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Template 4 : 2 Trimestres simples (sans évaluations)
INSERT INTO templates_periode (nom, description, structure, est_systeme, actif)
VALUES (
    '2 Trimestres simples',
    '2 trimestres sans sous-découpe. Total : 2 trimestres.',
    '{
        "type": "ANNEE",
        "count": 1,
        "nom": "Année scolaire",
        "enfants": [
            {
                "type": "TRIMESTRE",
                "count": 2,
                "nom": "Trimestre {n}"
            }
        ]
    }'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;

-- =============================================
-- 3. PARAMÈTRES SYSTÈME — Labels personnalisés
-- =============================================

-- Labels par défaut pour les types de périodes
-- Chaque établissement peut les override via ParametreSysteme

INSERT INTO parametres_systeme (cle, valeur, description, categorie, module, type_valeur)
VALUES
    ('periodes.label_evaluation', 'Évaluation', 'Libellé personnalisé pour le type EVALUATION', 'MODULE', 'periodes', 'STRING'),
    ('periodes.label_trimestre', 'Trimestre', 'Libellé personnalisé pour le type TRIMESTRE', 'MODULE', 'periodes', 'STRING'),
    ('periodes.label_semestre', 'Semestre', 'Libellé personnalisé pour le type SEMESTRE', 'MODULE', 'periodes', 'STRING'),
    ('periodes.label_annee', 'Année', 'Libellé personnalisé pour le type ANNEE', 'MODULE', 'periodes', 'STRING')
ON CONFLICT (cle, etablissement_id) DO NOTHING;
