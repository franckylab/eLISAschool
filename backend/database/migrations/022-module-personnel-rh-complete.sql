-- ====================================================
-- Migration: Module Personnel RH - Toutes Phases (CORRIGÉE)
-- Description: Migration complète corrigée pour les structures réelles
-- Date: 2026-02-07
-- ====================================================

-- ==========================================
-- PHASE 1: Contrats & Heures de Cours
-- ==========================================

-- 1. Créer la table des contrats de travail
CREATE TABLE IF NOT EXISTS contrats_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id) ON DELETE CASCADE,
    type_contrat VARCHAR(30) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    salaire_base DECIMAL(12,0) NOT NULL,
    tarif_horaire DECIMAL(10,0),
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    renouvellement_auto BOOLEAN NOT NULL DEFAULT FALSE,
    clauses TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contrats_membre ON contrats_personnel(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_contrats_etablissement ON contrats_personnel(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_contrats_statut ON contrats_personnel(statut);
CREATE INDEX IF NOT EXISTS idx_contrats_type ON contrats_personnel(type_contrat);

-- 2. Créer la table des heures de cours
CREATE TABLE IF NOT EXISTS heures_cours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enseignant_id UUID NOT NULL REFERENCES membres_personnel(id),
    classe_id UUID NOT NULL REFERENCES classes(id),
    matiere_id UUID NOT NULL REFERENCES matieres(id),
    periode_id UUID REFERENCES periodes(id),
    date DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    statut_effectue VARCHAR(30) NOT NULL DEFAULT 'PLANIFIE',
    salle VARCHAR(100),
    remplacant_id UUID REFERENCES membres_personnel(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heures_enseignant ON heures_cours(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_heures_classe ON heures_cours(classe_id);
CREATE INDEX IF NOT EXISTS idx_heures_date ON heures_cours(date);
CREATE INDEX IF NOT EXISTS idx_heures_periode ON heures_cours(periode_id);
CREATE INDEX IF NOT EXISTS idx_heures_etablissement ON heures_cours(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_heures_enseignant_date_heure ON heures_cours(enseignant_id, date, heure_debut);

-- ==========================================
-- PHASE 2: Absences
-- ==========================================

CREATE TABLE IF NOT EXISTS absences_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id),
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    statut_justification VARCHAR(30) NOT NULL DEFAULT 'NON_JUSTIFIE',
    heure_debut TIME,
    heure_fin TIME,
    motif TEXT,
    justification TEXT,
    justificatif_url VARCHAR(200),
    valide_par_id UUID,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_absences_membre ON absences_personnel(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_absences_date ON absences_personnel(date);
CREATE INDEX IF NOT EXISTS idx_absences_type ON absences_personnel(type);
CREATE INDEX IF NOT EXISTS idx_absences_etablissement ON absences_personnel(etablissement_id);

-- ==========================================
-- PHASE 3: Évaluations & Progressions
-- ==========================================

CREATE TABLE IF NOT EXISTS evaluations_enseignants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enseignant_id UUID NOT NULL REFERENCES membres_personnel(id),
    evaluateur_id UUID NOT NULL,
    date_evaluation DATE NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    note DECIMAL(4,2) NOT NULL,
    commentaire TEXT,
    plan_action TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_enseignant ON evaluations_enseignants(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations_enseignants(date_evaluation);
CREATE INDEX IF NOT EXISTS idx_evaluations_categorie ON evaluations_enseignants(categorie);

CREATE TABLE IF NOT EXISTS progressions_programme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enseignant_id UUID NOT NULL REFERENCES membres_personnel(id),
    matiere_id UUID NOT NULL REFERENCES matieres(id),
    classe_id UUID NOT NULL REFERENCES classes(id),
    periode_id UUID REFERENCES periodes(id),
    pourcentage_realise DECIMAL(5,2) NOT NULL,
    chapitre_courant VARCHAR(200),
    date_evaluation DATE NOT NULL,
    remarques TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progressions_enseignant ON progressions_programme(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_progressions_matiere ON progressions_programme(matiere_id);
CREATE INDEX IF NOT EXISTS idx_progressions_classe ON progressions_programme(classe_id);

-- ==========================================
-- PHASE 4: Bulletins de Paie
-- ==========================================

CREATE TABLE IF NOT EXISTS bulletins_paie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id),
    contrat_id UUID REFERENCES contrats_personnel(id),
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    salaire_base DECIMAL(12,0) NOT NULL,
    heures_effectuees DECIMAL(6,2) NOT NULL,
    montant_heures_sup DECIMAL(10,0),
    primes DECIMAL(10,0) DEFAULT 0,
    deductions DECIMAL(10,0) DEFAULT 0,
    salaire_net DECIMAL(12,0) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'GENERE',
    date_paiement DATE,
    notes TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_bulletin UNIQUE (membre_personnel_id, mois, annee)
);

CREATE INDEX IF NOT EXISTS idx_bulletins_membre ON bulletins_paie(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_mois_annee ON bulletins_paie(mois, annee);
CREATE INDEX IF NOT EXISTS idx_bulletins_statut ON bulletins_paie(statut);

-- ==========================================
-- PERMISSIONS RBAC (Structure corrigée)
-- ==========================================

INSERT INTO permissions (code, libelle, module, action, description, actif, "createdAt", "updatedAt")
VALUES 
    ('rh_contrats:manage', 'Gérer les contrats', 'personnel', 'manage', 'Créer, modifier et supprimer les contrats', true, NOW(), NOW()),
    ('rh_contrats:view', 'Voir les contrats', 'personnel', 'view', 'Consulter les contrats', true, NOW(), NOW()),
    ('rh_contrats:validate', 'Valider les contrats', 'personnel', 'validate', 'Valider les contrats via workflow', true, NOW(), NOW()),
    ('rh_heures_cours:manage', 'Gérer les heures de cours', 'personnel', 'manage', 'Créer, modifier et supprimer les créneaux', true, NOW(), NOW()),
    ('rh_heures_cours:view', 'Voir les heures de cours', 'personnel', 'view', 'Consulter les créneaux et volumes horaires', true, NOW(), NOW()),
    ('rh_absences:manage', 'Gérer les absences', 'personnel', 'manage', 'Créer, modifier et supprimer les absences', true, NOW(), NOW()),
    ('rh_absences:view', 'Voir les absences', 'personnel', 'view', 'Consulter les absences et statistiques', true, NOW(), NOW()),
    ('rh_absences:justifier', 'Justifier les absences', 'personnel', 'justifier', 'Justifier les absences non justifiées', true, NOW(), NOW()),
    ('rh_evaluations:manage', 'Gérer les évaluations', 'personnel', 'manage', 'Créer, modifier et supprimer les évaluations', true, NOW(), NOW()),
    ('rh_evaluations:view', 'Voir les évaluations', 'personnel', 'view', 'Consulter les évaluations et statistiques', true, NOW(), NOW()),
    ('rh_progressions:manage', 'Gérer les progressions', 'personnel', 'manage', 'Créer, modifier et supprimer les progressions', true, NOW(), NOW()),
    ('rh_progressions:view', 'Voir les progressions', 'personnel', 'view', 'Consulter les progressions et alertes', true, NOW(), NOW()),
    ('rh_paie:manage', 'Gérer la paie', 'personnel', 'manage', 'Créer, modifier et supprimer les bulletins', true, NOW(), NOW()),
    ('rh_paie:view', 'Voir la paie', 'personnel', 'view', 'Consulter les bulletins de paie', true, NOW(), NOW()),
    ('rh_paie:generer', 'Générer la paie', 'personnel', 'generer', 'Générer automatiquement les bulletins', true, NOW(), NOW()),
    ('rh_paie:valider', 'Valider la paie', 'personnel', 'valider', 'Valider et marquer comme payé', true, NOW(), NOW()),
    ('rh_dashboard:view', 'Voir le dashboard RH', 'personnel', 'view', 'Consulter les statistiques et le dashboard RH', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ==========================================

-- ADMIN & SUPER_ADMIN: Accès total
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
AND p.code LIKE 'rh_%'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- CHEF_ETABLISSEMENT: Gestion courante (pas de paie)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
AND p.code IN (
    'rh_contrats:manage', 'rh_contrats:view',
    'rh_heures_cours:manage', 'rh_heures_cours:view',
    'rh_absences:manage', 'rh_absences:view', 'rh_absences:justifier',
    'rh_evaluations:manage', 'rh_evaluations:view',
    'rh_progressions:manage', 'rh_progressions:view',
    'rh_dashboard:view'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- DIRECTEUR/PROVISEUR/PRINCIPAL: Lecture seule
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('DIRECTEUR', 'PROVISEUR', 'PRINCIPAL')
AND p.code LIKE 'rh_%:view'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- RESPONSABLE_PEDAGOGIQUE: Évaluations et progressions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'RESPONSABLE_PEDAGOGIQUE'
AND p.code IN ('rh_evaluations:manage', 'rh_evaluations:view', 'rh_progressions:manage', 'rh_progressions:view')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- CENSEUR: Absences et heures
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'CENSEUR'
AND p.code IN ('rh_absences:manage', 'rh_absences:view', 'rh_absences:justifier', 'rh_heures_cours:view')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- INSPECTEURS: Lecture seule + dashboard
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('INSPECTEUR_PEDAGOGIQUE', 'INSPECTEUR_GENERAL')
AND p.code IN ('rh_evaluations:view', 'rh_progressions:view', 'rh_absences:view', 'rh_dashboard:view')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ENSEIGNANTS: Leurs propres données uniquement
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('ENSEIGNANT', 'PROFESSEUR_CERTIFIE')
AND p.code IN ('rh_heures_cours:view', 'rh_absences:view')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ==========================================
-- PARAMÈTRES DE CONFIGURATION
-- ==========================================

-- Vérifier si la table parametres_configurations existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parametres_configurations') THEN
        INSERT INTO parametres_configurations (cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
        VALUES 
            ('personnel.contrat_require_validation', 'false', 'boolean', 'personnel', 'Validation workflow contrats', 'Exiger validation workflow pour les contrats', NOW(), NOW()),
            ('personnel.contrat_alerte_expiration_jours', '30', 'number', 'personnel', 'Alerte expiration contrats', 'Nombre de jours avant alerte expiration contrat', NOW(), NOW()),
            ('personnel.absence_alerte_non_justifiee_jours', '3', 'number', 'personnel', 'Alerte absences non justifiées', 'Nombre de jours avant alerte pour absence non justifiée', NOW(), NOW()),
            ('personnel.evaluation_periodicite_mois', '3', 'number', 'personnel', 'Périodicité des évaluations', 'Fréquence recommandée pour les évaluations des enseignants', NOW(), NOW()),
            ('personnel.paie_tarif_heure_sup', '1.5', 'number', 'personnel', 'Multiplicateur heures supplémentaires', 'Multiplicateur appliqué au tarif horaire pour les heures supplémentaires', NOW(), NOW()),
            ('personnel.dashboard_cache_ttl', '300', 'number', 'personnel', 'Cache du dashboard', 'Durée de vie du cache du dashboard RH en secondes (300 = 5 minutes)', NOW(), NOW())
        ON CONFLICT (cle) DO NOTHING;
    END IF;
END $$;

-- ==========================================
-- VÉRIFICATION
-- ==========================================

DO $$
DECLARE
    total_perms INTEGER;
    total_attributions INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_perms FROM permissions WHERE code LIKE 'rh_%';
    SELECT COUNT(*) INTO total_attributions 
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE p.code LIKE 'rh_%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration RH Personnel terminée avec succès!';
    RAISE NOTICE 'Total permissions RH créées: %', total_perms;
    RAISE NOTICE 'Total attributions de permissions: %', total_attributions;
    RAISE NOTICE '========================================';
END $$;

-- ====================================================
-- FIN Migration Module Personnel RH
-- ====================================================
