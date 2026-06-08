-- eLISAschool - Module Personnel/RH
-- Migration Phase 4: Bulletins de Paie

-- Table des bulletins de paie
CREATE TABLE IF NOT EXISTS bulletins_paie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "membrePersonnelId" UUID NOT NULL,
    "contratId" UUID NOT NULL,
    mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
    annee INTEGER NOT NULL,
    "salaireBase" DECIMAL(12,2) NOT NULL,
    "heuresEffectuees" DECIMAL(10,2) NOT NULL,
    "montantHeuresSup" DECIMAL(10,2) NOT NULL DEFAULT 0,
    primes DECIMAL(10,2) NOT NULL DEFAULT 0,
    deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    "salaireNet" DECIMAL(12,2) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'GENERE',
    "datePaiement" DATE,
    notes TEXT,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_bulletins_membre ON bulletins_paie("membrePersonnelId");
CREATE INDEX IF NOT EXISTS idx_bulletins_mois ON bulletins_paie(mois);
CREATE INDEX IF NOT EXISTS idx_bulletins_annee ON bulletins_paie(annee);
CREATE INDEX IF NOT EXISTS idx_bulletins_statut ON bulletins_paie(statut);
CREATE INDEX IF NOT EXISTS idx_bulletins_etablissement ON bulletins_paie("etablissementId");
CREATE INDEX IF NOT EXISTS idx_bulletins_mois_annee ON bulletins_paie(mois, annee);

-- Permissions RH pour la paie
INSERT INTO permissions (id, code, label, module, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'rh_paie:manage', 'Gérer la paie', 'personnel', 'Créer, modifier et supprimer les bulletins', NOW(), NOW()),
    (gen_random_uuid(), 'rh_paie:view', 'Voir la paie', 'personnel', 'Consulter les bulletins de paie', NOW(), NOW()),
    (gen_random_uuid(), 'rh_paie:generer', 'Générer la paie', 'personnel', 'Générer automatiquement les bulletins', NOW(), NOW()),
    (gen_random_uuid(), 'rh_paie:valider', 'Valider la paie', 'personnel', 'Valider et marquer comme payé', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Paramètre de configuration
INSERT INTO parametres_configurations (id, cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'personnel.paie_tarif_heure_sup',
    '1.5',
    'number',
    'personnel',
    'Multiplicateur heures supplémentaires',
    'Multiplicateur appliqué au tarif horaire pour les heures supplémentaires',
    NOW(),
    NOW()
) ON CONFLICT (cle) DO NOTHING;

-- Actions d'audit
INSERT INTO audit_actions (id, code, module, description, "createdAt")
VALUES 
    (gen_random_uuid(), 'BULLETIN_PAI_CREATE', 'personnel', 'Création d''un bulletin de paie', NOW()),
    (gen_random_uuid(), 'BULLETIN_PAI_UPDATE', 'personnel', 'Modification d''un bulletin de paie', NOW()),
    (gen_random_uuid(), 'BULLETIN_PAI_DELETE', 'personnel', 'Suppression d''un bulletin de paie', NOW()),
    (gen_random_uuid(), 'BULLETIN_PAI_GENERER', 'personnel', 'Génération d''un bulletin de paie', NOW()),
    (gen_random_uuid(), 'BULLETIN_PAI_VALIDER', 'personnel', 'Validation d''un bulletin de paie', NOW())
ON CONFLICT (code) DO NOTHING;
