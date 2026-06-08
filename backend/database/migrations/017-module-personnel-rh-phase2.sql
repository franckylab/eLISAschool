-- eLISAschool - Module Personnel/RH
-- Migration Phase 2: Absences & Assiduité

-- Table des absences du personnel
CREATE TABLE IF NOT EXISTS absences_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "membrePersonnelId" UUID NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(30) NOT NULL,
    "heureDebut" TIME,
    "heureFin" TIME,
    motif VARCHAR(500),
    justification VARCHAR(1000),
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_absences_membre ON absences_personnel("membrePersonnelId");
CREATE INDEX IF NOT EXISTS idx_absences_date ON absences_personnel(date);
CREATE INDEX IF NOT EXISTS idx_absences_type ON absences_personnel(type);
CREATE INDEX IF NOT EXISTS idx_absences_etablissement ON absences_personnel("etablissementId");

-- Permissions RH pour les absences
INSERT INTO permissions (id, code, label, module, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'rh_absences:manage', 'Gérer les absences', 'personnel', 'Créer, modifier et supprimer les absences', NOW(), NOW()),
    (gen_random_uuid(), 'rh_absences:view', 'Voir les absences', 'personnel', 'Consulter les absences et statistiques', NOW(), NOW()),
    (gen_random_uuid(), 'rh_absences:justifier', 'Justifier les absences', 'personnel', 'Justifier les absences non justifiées', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Paramètre de configuration
INSERT INTO parametres_configurations (id, cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'personnel.absence_alerte_non_justifiee_jours',
    '3',
    'number',
    'personnel',
    'Alerte absences non justifiées (jours)',
    'Nombre de jours avant alerte pour absence non justifiée',
    NOW(),
    NOW()
) ON CONFLICT (cle) DO NOTHING;

-- Actions d'audit
INSERT INTO audit_actions (id, code, module, description, "createdAt")
VALUES 
    (gen_random_uuid(), 'ABSENCE_PERSONNEL_CREATE', 'personnel', 'Création d''une absence', NOW()),
    (gen_random_uuid(), 'ABSENCE_PERSONNEL_UPDATE', 'personnel', 'Modification d''une absence', NOW()),
    (gen_random_uuid(), 'ABSENCE_PERSONNEL_DELETE', 'personnel', 'Suppression d''une absence', NOW()),
    (gen_random_uuid(), 'ABSENCE_PERSONNEL_JUSTIFIER', 'personnel', 'Justification d''une absence', NOW())
ON CONFLICT (code) DO NOTHING;
