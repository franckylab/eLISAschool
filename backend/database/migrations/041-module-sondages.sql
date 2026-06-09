-- ==================================
-- eLISAschool - Migration Module Sondage
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Création des tables pour le système de sondage

-- Table: templates_sondage
CREATE TABLE IF NOT EXISTS templates_sondage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    question TEXT NOT NULL,
    options JSONB,
    parametres JSONB,
    categorie VARCHAR(50),
    visibilite VARCHAR(20) DEFAULT 'prive',
    tags VARCHAR(500),
    est_template_systeme BOOLEAN DEFAULT false,
    utilisation_count INTEGER DEFAULT 0,
    createur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_sondage_etablissement ON templates_sondage(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_templates_sondage_createur ON templates_sondage(createur_id);
CREATE INDEX IF NOT EXISTS idx_templates_sondage_visibilite ON templates_sondage(visibilite);

-- Table: sondages
CREATE TABLE IF NOT EXISTS sondages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    statut VARCHAR(20) DEFAULT 'actif',
    est_anonyme BOOLEAN DEFAULT false,
    choix_multiple BOOLEAN DEFAULT false,
    date_limite TIMESTAMP,
    date_programmation TIMESTAMP,
    date_fermeture TIMESTAMP,
    nombre_destinataires INTEGER DEFAULT 0,
    nombre_votes INTEGER DEFAULT 0,
    niveau_acces_analyses VARCHAR(30) DEFAULT 'auteur_seul',
    utilisateurs_autorises_analyses UUID[],
    creer_conversation BOOLEAN DEFAULT false,
    template_id UUID,
    mode_destinataires TEXT,
    auteur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sondages_etablissement ON sondages(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_sondages_auteur ON sondages(auteur_id);
CREATE INDEX IF NOT EXISTS idx_sondages_statut ON sondages(statut);
CREATE INDEX IF NOT EXISTS idx_sondages_date_programmation ON sondages(date_programmation);

-- Table: sondage_options
CREATE TABLE IF NOT EXISTS sondage_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sondage_id UUID NOT NULL REFERENCES sondages(id) ON DELETE CASCADE,
    texte TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    nombre_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sondage_options_sondage ON sondage_options(sondage_id);

-- Table: sondage_votes
CREATE TABLE IF NOT EXISTS sondage_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sondage_id UUID NOT NULL REFERENCES sondages(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES sondage_options(id) ON DELETE CASCADE,
    utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sondage_votes_sondage ON sondage_votes(sondage_id);
CREATE INDEX IF NOT EXISTS idx_sondage_votes_utilisateur ON sondage_votes(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_sondage_votes_option ON sondage_votes(option_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sondage_votes_unique ON sondage_votes(sondage_id, utilisateur_id);

-- Insérer les paramètres système
INSERT INTO parametres_systeme (cle, valeur, type, categorie, description, est_public, created_at)
VALUES
    ('sondages.actif', 'true', 'boolean', 'modules', 'Module sondages activé', true, CURRENT_TIMESTAMP),
    ('sondages.max_destinataires', '500', 'number', 'sondages', 'Nombre maximum de destinataires par sondage', true, CURRENT_TIMESTAMP),
    ('sondages.max_options', '20', 'number', 'sondages', 'Nombre maximum d''options par sondage', true, CURRENT_TIMESTAMP),
    ('sondages.duree_par_defaut', '7j', 'string', 'sondages', 'Durée par défaut d''un sondage', true, CURRENT_TIMESTAMP)
ON CONFLICT (cle) DO NOTHING;

-- Insérer des templates par défaut
INSERT INTO templates_sondage (nom, description, question, options, parametres, categorie, visibilite, est_template_systeme, created_at)
VALUES
    (
        'Satisfaction générale',
        'Évaluer le niveau de satisfaction globale',
        'Quel est votre niveau de satisfaction global ?',
        '[{"texte": "Très satisfait", "ordre": 0}, {"texte": "Satisfait", "ordre": 1}, {"texte": "Neutre", "ordre": 2}, {"texte": "Insatisfait", "ordre": 3}, {"texte": "Très insatisfait", "ordre": 4}]'::jsonb,
        '{"estAnonyme": false, "choixMultiple": false}'::jsonb,
        'satisfaction',
        'systeme',
        true,
        CURRENT_TIMESTAMP
    ),
    (
        'Évaluation des services',
        'Évaluer la qualité des services',
        'Comment évaluez-vous la qualité de nos services ?',
        '[{"texte": "Excellent", "ordre": 0}, {"texte": "Bon", "ordre": 1}, {"texte": "Moyen", "ordre": 2}, {"texte": "À améliorer", "ordre": 3}]'::jsonb,
        '{"estAnonyme": true, "choixMultiple": false}'::jsonb,
        'evaluation',
        'systeme',
        true,
        CURRENT_TIMESTAMP
    ),
    (
        'Suggestions d''amélioration',
        'Recueillir des suggestions',
        'Quelles améliorations souhaitez-vous voir ?',
        '[{"texte": "Infrastructure", "ordre": 0}, {"texte": "Communication", "ordre": 1}, {"texte": "Services", "ordre": 2}, {"texte": "Autre", "ordre": 3}]'::jsonb,
        '{"estAnonyme": true, "choixMultiple": true}'::jsonb,
        'suggestions',
        'systeme',
        true,
        CURRENT_TIMESTAMP
    )
ON CONFLICT DO NOTHING;
