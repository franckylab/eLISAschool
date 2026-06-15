-- ==================================
-- eLISAschool - Migration Templates Emploi-du-Temps
-- ==================================
-- Version: 1.0.0
-- Date: 2026-06-14
-- Description: Crée la table des templates d'emploi du temps

-- Table des templates
CREATE TABLE IF NOT EXISTS templates_emploi_du_temps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    "etablissementId" UUID, -- NULL pour templates globaux
    configuration JSONB DEFAULT '{}',
    "creneauxTypes" JSONB DEFAULT '[]',
    actif BOOLEAN DEFAULT true,
    "estPartage" BOOLEAN DEFAULT false,
    "creePar" VARCHAR(100),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_templates_etablissement ON templates_emploi_du_temps("etablissementId");
CREATE INDEX IF NOT EXISTS idx_templates_nom ON templates_emploi_du_temps(nom);
CREATE INDEX IF NOT EXISTS idx_templates_actif ON templates_emploi_du_temps(actif);

-- Commentaire
COMMENT ON TABLE templates_emploi_du_temps IS 'Templates réutilisables pour la génération d''emplois du temps';

-- Templates par défaut (optionnel)
INSERT INTO templates_emploi_du_temps (nom, description, "etablissementId", configuration, "creneauxTypes", actif, "estPartage")
VALUES (
    'Template Standard Lycée',
    'Configuration standard pour lycée : Lundi-Vendredi, 07h30-17h30',
    NULL, -- Global
    '{"joursTravailles": ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"], "heureDebutCours": "07:30", "heureFinCours": "17:30", "dureeCreneauDefaut": 55}'::jsonb,
    '[
        {"matiereNom": "Mathématiques", "volumeHebdomadaire": 4, "typeCreneau": "COURS"},
        {"matiereNom": "Français", "volumeHebdomadaire": 4, "typeCreneau": "COURS"},
        {"matiereNom": "SVT", "volumeHebdomadaire": 2, "typeCreneau": "COURS"},
        {"matiereNom": "Physique-Chimie", "volumeHebdomadaire": 3, "typeCreneau": "COURS"},
        {"matiereNom": "Histoire-Géographie", "volumeHebdomadaire": 3, "typeCreneau": "COURS"},
        {"matiereNom": "Anglais", "volumeHebdomadaire": 2, "typeCreneau": "COURS"}
    ]'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;

INSERT INTO templates_emploi_du_temps (nom, description, "etablissementId", configuration, "creneauxTypes", actif, "estPartage")
VALUES (
    'Template Standard Collège',
    'Configuration standard pour collège : Lundi-Vendredi, 08h00-17h00',
    NULL, -- Global
    '{"joursTravailles": ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"], "heureDebutCours": "08:00", "heureFinCours": "17:00", "dureeCreneauDefaut": 55}'::jsonb,
    '[
        {"matiereNom": "Mathématiques", "volumeHebdomadaire": 3, "typeCreneau": "COURS"},
        {"matiereNom": "Français", "volumeHebdomadaire": 4, "typeCreneau": "COURS"},
        {"matiereNom": "SVT", "volumeHebdomadaire": 1, "typeCreneau": "COURS"},
        {"matiereNom": "Physique-Chimie", "volumeHebdomadaire": 1, "typeCreneau": "COURS"},
        {"matiereNom": "Histoire-Géographie", "volumeHebdomadaire": 2, "typeCreneau": "COURS"},
        {"matiereNom": "Anglais", "volumeHebdomadaire": 2, "typeCreneau": "COURS"}
    ]'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;
