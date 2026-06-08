-- eLISAschool - Module Personnel/RH
-- Migration Phase 3: Évaluations & Suivi Programmes

-- Table des évaluations des enseignants
CREATE TABLE IF NOT EXISTS evaluations_enseignants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "enseignantId" UUID NOT NULL,
    "evaluateurId" UUID NOT NULL,
    "dateEvaluation" DATE NOT NULL,
    categorie VARCHAR(30) NOT NULL,
    note DECIMAL(5,2) NOT NULL CHECK (note >= 0 AND note <= 20),
    commentaire TEXT,
    "planAction" TEXT,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_evaluations_enseignant ON evaluations_enseignants("enseignantId");
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations_enseignants("dateEvaluation");
CREATE INDEX IF NOT EXISTS idx_evaluations_categorie ON evaluations_enseignants(categorie);
CREATE INDEX IF NOT EXISTS idx_evaluations_etablissement ON evaluations_enseignants("etablissementId");

-- Table des progressions de programme
CREATE TABLE IF NOT EXISTS progressions_programme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "enseignantId" UUID NOT NULL,
    "matiereId" UUID NOT NULL,
    "classeId" UUID NOT NULL,
    "periodeId" UUID,
    "pourcentageRealise" DECIMAL(5,2) NOT NULL CHECK ("pourcentageRealise" >= 0 AND "pourcentageRealise" <= 100),
    "chapitreCourant" VARCHAR(200) NOT NULL,
    "dateEvaluation" DATE NOT NULL,
    remarques TEXT,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_progressions_enseignant ON progressions_programme("enseignantId");
CREATE INDEX IF NOT EXISTS idx_progressions_matiere ON progressions_programme("matiereId");
CREATE INDEX IF NOT EXISTS idx_progressions_classe ON progressions_programme("classeId");
CREATE INDEX IF NOT EXISTS idx_progressions_periode ON progressions_programme("periodeId");
CREATE INDEX IF NOT EXISTS idx_progressions_etablissement ON progressions_programme("etablissementId");

-- Permissions RH pour les évaluations et progressions
INSERT INTO permissions (id, code, label, module, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'rh_evaluations:manage', 'Gérer les évaluations', 'personnel', 'Créer, modifier et supprimer les évaluations', NOW(), NOW()),
    (gen_random_uuid(), 'rh_evaluations:view', 'Voir les évaluations', 'personnel', 'Consulter les évaluations et statistiques', NOW(), NOW()),
    (gen_random_uuid(), 'rh_progressions:manage', 'Gérer les progressions', 'personnel', 'Créer, modifier et supprimer les progressions', NOW(), NOW()),
    (gen_random_uuid(), 'rh_progressions:view', 'Voir les progressions', 'personnel', 'Consulter les progressions et alertes', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Paramètre de configuration
INSERT INTO parametres_configurations (id, cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'personnel.evaluation_periodicite_mois',
    '3',
    'number',
    'personnel',
    'Périodicité des évaluations (mois)',
    'Fréquence recommandée pour les évaluations des enseignants',
    NOW(),
    NOW()
) ON CONFLICT (cle) DO NOTHING;

-- Actions d'audit
INSERT INTO audit_actions (id, code, module, description, "createdAt")
VALUES 
    (gen_random_uuid(), 'EVALUATION_ENSEIGNANT_CREATE', 'personnel', 'Création d''une évaluation', NOW()),
    (gen_random_uuid(), 'EVALUATION_ENSEIGNANT_UPDATE', 'personnel', 'Modification d''une évaluation', NOW()),
    (gen_random_uuid(), 'EVALUATION_ENSEIGNANT_DELETE', 'personnel', 'Suppression d''une évaluation', NOW()),
    (gen_random_uuid(), 'PROGRESSION_PROGRAMME_CREATE', 'personnel', 'Création d''une progression', NOW()),
    (gen_random_uuid(), 'PROGRESSION_PROGRAMME_UPDATE', 'personnel', 'Modification d''une progression', NOW()),
    (gen_random_uuid(), 'PROGRESSION_PROGRAMME_DELETE', 'personnel', 'Suppression d''une progression', NOW())
ON CONFLICT (code) DO NOTHING;
