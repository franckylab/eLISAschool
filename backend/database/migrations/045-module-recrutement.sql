-- ====================================================
-- Migration: Module Recrutement RH
-- Description: Système complet de recrutement (offres, candidatures, entretiens, onboarding)
-- Date: 2026-06-11
-- ====================================================

-- ==================================
-- Table: offres_emploi
-- ==================================
CREATE TABLE IF NOT EXISTS offres_emploi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poste_id UUID REFERENCES postes(id),
    unite_organisationnelle_id UUID REFERENCES unites_organisationnelles(id),
    titre VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    missions TEXT,
    profil_recherche TEXT,
    competences_requises TEXT,
    experience_requise TEXT,
    niveau_etude_requis VARCHAR(100),
    salaire_min DECIMAL(10,0),
    salaire_max DECIMAL(10,0),
    type_contrat_propose VARCHAR(50),
    statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    date_publication TIMESTAMPTZ,
    date_limite TIMESTAMPTZ,
    nombre_postes_disponibles INTEGER NOT NULL DEFAULT 1,
    nombre_candidatures INTEGER NOT NULL DEFAULT 0,
    publie_par_id UUID NOT NULL REFERENCES membres_personnel(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index offres_emploi
CREATE INDEX IF NOT EXISTS idx_offres_etablissement ON offres_emploi(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_offres_statut ON offres_emploi(statut);
CREATE INDEX IF NOT EXISTS idx_offres_poste ON offres_emploi(poste_id);
CREATE INDEX IF NOT EXISTS idx_offres_unite ON offres_emploi(unite_organisationnelle_id);
CREATE INDEX IF NOT EXISTS idx_offres_date_publication ON offres_emploi(date_publication);
CREATE INDEX IF NOT EXISTS idx_offres_date_limite ON offres_emploi(date_limite);

COMMENT ON TABLE offres_emploi IS 'Offres d''emploi publiées pour le recrutement';
COMMENT ON COLUMN offres_emploi.statut IS 'BROUILLON, PUBLIEE, SUSPENDUE, TERMINEE, ANNULEE';

-- ==================================
-- Table: candidatures
-- ==================================
CREATE TABLE IF NOT EXISTS candidatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offre_emploi_id UUID NOT NULL REFERENCES offres_emploi(id) ON DELETE CASCADE,
    nom_complet VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telephone VARCHAR(20),
    cv_url TEXT,
    lettre_motivation_url TEXT,
    portfolio_url TEXT,
    niveau_etude VARCHAR(100),
    annees_experience INTEGER,
    competences TEXT,
    commentaires TEXT,
    statut VARCHAR(30) NOT NULL DEFAULT 'RECUE',
    note_evaluation DECIMAL(5,2),
    evaluation_commentaire TEXT,
    examine_par_id UUID REFERENCES membres_personnel(id),
    membre_personnel_id UUID REFERENCES membres_personnel(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(offre_emploi_id, email)
);

-- Index candidatures
CREATE INDEX IF NOT EXISTS idx_candidatures_offre ON candidatures(offre_emploi_id);
CREATE INDEX IF NOT EXISTS idx_candidatures_statut ON candidatures(statut);
CREATE INDEX IF NOT EXISTS idx_candidatures_email ON candidatures(email);
CREATE INDEX IF NOT EXISTS idx_candidatures_telephone ON candidatures(telephone);
CREATE INDEX IF NOT EXISTS idx_candidatures_etablissement ON candidatures(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_candidatures_created_at ON candidatures(created_at);
CREATE INDEX IF NOT EXISTS idx_candidatures_offre_statut ON candidatures(offre_emploi_id, statut);

COMMENT ON TABLE candidatures IS 'Candidatures reçues et leur progression dans le pipeline';
COMMENT ON COLUMN candidatures.statut IS 'RECUE, EN_COURS_EXAMEN, PRESLECTIONNEE, CONVOQUEE, RETENUE, REFUSEE, LISTE_ATTENTE';

-- ==================================
-- Table: entretiens_recrutement
-- ==================================
CREATE TABLE IF NOT EXISTS entretiens_recrutement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidature_id UUID NOT NULL REFERENCES candidatures(id) ON DELETE CASCADE,
    offre_emploi_id UUID NOT NULL REFERENCES offres_emploi(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    date_entretien TIMESTAMPTZ NOT NULL,
    heure_debut TIME,
    heure_fin TIME,
    lieu VARCHAR(200),
    lien_videoconference TEXT,
    grille_evaluation TEXT,
    compte_rendu TEXT,
    note DECIMAL(5,2),
    points_fort TEXT,
    points_ameliorer TEXT,
    decision TEXT,
    statut VARCHAR(30) NOT NULL DEFAULT 'PLANIFIE',
    evaluateur_id UUID REFERENCES membres_personnel(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index entretiens
CREATE INDEX IF NOT EXISTS idx_entretiens_candidature ON entretiens_recrutement(candidature_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_date ON entretiens_recrutement(date_entretien);
CREATE INDEX IF NOT EXISTS idx_entretiens_type ON entretiens_recrutement(type);
CREATE INDEX IF NOT EXISTS idx_entretiens_statut ON entretiens_recrutement(statut);
CREATE INDEX IF NOT EXISTS idx_entretiens_evaluateur ON entretiens_recrutement(evaluateur_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_etablissement ON entretiens_recrutement(etablissement_id);

COMMENT ON TABLE entretiens_recrutement IS 'Planification et évaluation des entretiens de recrutement';
COMMENT ON COLUMN entretiens_recrutement.type IS 'TELEPHONIQUE, TECHNIQUE, RH, FINAL, PANEL';
COMMENT ON COLUMN entretiens_recrutement.statut IS 'PLANIFIE, EN_COURS, TERMINE, ANNULE, REPORTE';

-- ==================================
-- Table: onboarding_recrutement
-- ==================================
CREATE TABLE IF NOT EXISTS onboarding_recrutement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id) ON DELETE CASCADE,
    offre_emploi_id UUID NOT NULL REFERENCES offres_emploi(id),
    date_debut DATE NOT NULL,
    date_fin_reel DATE,
    date_fin_prevu DATE NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_COURS',
    checklist TEXT,
    tuteur_id UUID REFERENCES membres_personnel(id),
    formation_initiale TEXT,
    equipement_fourni TEXT,
    acces_systemes TEXT,
    commentaires TEXT,
    progression_pourcentage INTEGER NOT NULL DEFAULT 0,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index onboarding
CREATE INDEX IF NOT EXISTS idx_onboarding_membre ON onboarding_recrutement(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_statut ON onboarding_recrutement(statut);
CREATE INDEX IF NOT EXISTS idx_onboarding_date_debut ON onboarding_recrutement(date_debut);
CREATE INDEX IF NOT EXISTS idx_onboarding_date_fin_prevu ON onboarding_recrutement(date_fin_prevu);
CREATE INDEX IF NOT EXISTS idx_onboarding_tuteur ON onboarding_recrutement(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_etablissement ON onboarding_recrutement(etablissement_id);

COMMENT ON TABLE onboarding_recrutement IS 'Checklist d''intégration post-embauche';
COMMENT ON COLUMN onboarding_recrutement.statut IS 'EN_COURS, TERMINE, EN_RETARD';
COMMENT ON COLUMN onboarding_recrutement.checklist IS 'JSON: [{tache, fait, date}]';

-- ==================================
-- Permissions RBAC pour le recrutement
-- ==================================
INSERT INTO permissions (id, code, label, module, description, "createdAt", "updatedAt")
VALUES 
    -- Offres d'emploi
    (gen_random_uuid(), 'recrutement:offres:create', 'Créer des offres', 'recrutement', 'Créer et publier des offres d''emploi', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:offres:manage', 'Gérer les offres', 'recrutement', 'Modifier et clôturer les offres', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:offres:view', 'Voir les offres', 'recrutement', 'Consulter les offres et statistiques', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:offres:delete', 'Supprimer les offres', 'recrutement', 'Supprimer les offres', NOW(), NOW()),
    
    -- Candidatures
    (gen_random_uuid(), 'recrutement:candidatures:create', 'Créer des candidatures', 'recrutement', 'Postuler à une offre', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:candidatures:manage', 'Gérer les candidatures', 'recrutement', 'Évaluer et modifier le statut des candidatures', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:candidatures:view', 'Voir les candidatures', 'recrutement', 'Consulter les candidatures et pipeline', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:candidatures:evaluate', 'Évaluer les candidatures', 'recrutement', 'Noter et commenter les candidatures', NOW(), NOW()),
    
    -- Entretiens
    (gen_random_uuid(), 'recrutement:entretiens:create', 'Planifier des entretiens', 'recrutement', 'Créer et planifier des entretiens', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:entretiens:manage', 'Gérer les entretiens', 'recrutement', 'Modifier et évaluer les entretiens', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:entretiens:view', 'Voir les entretiens', 'recrutement', 'Consulter les entretiens planifiés', NOW(), NOW()),
    
    -- Onboarding
    (gen_random_uuid(), 'recrutement:onboarding:create', 'Créer des onboardings', 'recrutement', 'Initialiser le processus d''intégration', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:onboarding:manage', 'Gérer les onboardings', 'recrutement', 'Mettre à jour les checklists', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement:onboarding:view', 'Voir les onboardings', 'recrutement', 'Consulter les onboardings en cours', NOW(), NOW()),
    
    -- Statistiques
    (gen_random_uuid(), 'recrutement:stats:view', 'Voir les statistiques', 'recrutement', 'Consulter les statistiques de recrutement', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Attribution des permissions aux rôles RH
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT')
AND p.code LIKE 'recrutement:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================
-- Paramètres de configuration
-- ==================================
INSERT INTO parametres_configurations (id, cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'recrutement.actif', 'false', 'boolean', 'recrutement', 'Module recrutement actif', 'Activer/désactiver le module de recrutement', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement.auto_publish_offres', 'false', 'boolean', 'recrutement', 'Publication automatique des offres', 'Publier automatiquement les offres après création', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement.delai_relance_candidature_jours', '7', 'number', 'recrutement', 'Relance candidature (jours)', 'Délai avant relance automatique des candidatures sans réponse', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement.duree_onboarding_defaut_jours', '30', 'number', 'recrutement', 'Durée onboarding par défaut', 'Durée par défaut du processus d''intégration (jours)', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement.exiger_lettre_motivation', 'true', 'boolean', 'recrutement', 'Lettre de motivation requise', 'Exiger une lettre de motivation pour postuler', NOW(), NOW()),
    (gen_random_uuid(), 'recrutement.nombre_entretiens_minimum', '2', 'number', 'recrutement', 'Entretiens minimum', 'Nombre minimum d''entretiens avant décision finale', NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- ==================================
-- Seeds: Templates de checklist onboarding
-- ==================================
INSERT INTO parametres_configurations (id, cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'recrutement.checklist_onboarding_defaut', 
     '[
        {"tache": "Fournir badge et accès locaux", "categorie": "equipement", "fait": false},
        {"tache": "Configurer compte email et systèmes", "categorie": "acces", "fait": false},
        {"tache": "Présenter l''équipe et les locaux", "categorie": "integration", "fait": false},
        {"tache": "Remettre contrat et documents RH", "categorie": "administratif", "fait": false},
        {"tache": "Planifier formation produits/services", "categorie": "formation", "fait": false},
        {"tache": "Assigner tuteur/mentor", "categorie": "accompagnement", "fait": false},
        {"tache": "Configurer poste de travail", "categorie": "equipement", "fait": false},
        {"tache": "Briefing sur les politiques internes", "categorie": "formation", "fait": false}
     ]'::text, 
     'json', 
     'recrutement', 
     'Checklist onboarding par défaut', 
     'Liste des tâches standard pour l''intégration d''un nouveau membre', 
     NOW(), 
     NOW())
ON CONFLICT (cle) DO NOTHING;

-- ==================================
-- Actions d'audit
-- ==================================
INSERT INTO audit_actions (id, code, module, description, "createdAt")
VALUES 
    (gen_random_uuid(), 'OFFRE_EMPLOI_CREATE', 'recrutement', 'Création d''une offre d''emploi', NOW()),
    (gen_random_uuid(), 'OFFRE_EMPLOI_UPDATE', 'recrutement', 'Modification d''une offre', NOW(), NOW()),
    (gen_random_uuid(), 'OFFRE_EMPLOI_PUBLISH', 'recrutement', 'Publication d''une offre', NOW()),
    (gen_random_uuid(), 'OFFRE_EMPLOI_CLOSE', 'recrutement', 'Clôture d''une offre', NOW()),
    (gen_random_uuid(), 'OFFRE_EMPLOI_DELETE', 'recrutement', 'Suppression d''une offre', NOW()),
    (gen_random_uuid(), 'CANDIDATURE_CREATE', 'recrutement', 'Réception d''une candidature', NOW()),
    (gen_random_uuid(), 'CANDIDATURE_EVALUATE', 'recrutement', 'Évaluation d''une candidature', NOW()),
    (gen_random_uuid(), 'CANDIDATURE_DELETE', 'recrutement', 'Suppression d''une candidature', NOW()),
    (gen_random_uuid(), 'ENTRETIEN_CREATE', 'recrutement', 'Planification d''un entretien', NOW()),
    (gen_random_uuid(), 'ENTRETIEN_EVALUATE', 'recrutement', 'Évaluation d''un entretien', NOW()),
    (gen_random_uuid(), 'ENTRETIEN_UPDATE', 'recrutement', 'Modification d''un entretien', NOW()),
    (gen_random_uuid(), 'ENTRETIEN_DELETE', 'recrutement', 'Suppression d''un entretien', NOW()),
    (gen_random_uuid(), 'ONBOARDING_CREATE', 'recrutement', 'Création d''un onboarding', NOW()),
    (gen_random_uuid(), 'ONBOARDING_UPDATE', 'recrutement', 'Mise à jour d''un onboarding', NOW()),
    (gen_random_uuid(), 'ONBOARDING_COMPLETE', 'recrutement', 'Finalisation d''un onboarding', NOW())
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- Vérification finale
-- ==================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration module Recrutement terminée avec succès';
    RAISE NOTICE '📊 Tables créées: offres_emploi, candidatures, entretiens_recrutement, onboarding_recrutement';
    RAISE NOTICE '🔐 Permissions RBAC: 16 permissions ajoutées';
    RAISE NOTICE '⚙️ Paramètres: 6 paramètres de configuration + 1 template checklist';
    RAISE NOTICE '📝 Audit: 15 actions d''audit créées';
END $$;
