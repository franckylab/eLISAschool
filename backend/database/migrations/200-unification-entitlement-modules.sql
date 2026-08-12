-- ==================================
-- eLISAschool - Migration 200 — Unification Entitlement & Modules
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-08-14
--
-- Objectif : Migration 200 — Refonte SaaS Unification Modules
--   1. S'assurer que TOUS les modules sont dans modules_catalogue
--   2. Ajouter les modules manquants (bibliotheque, comptabilite, etc.)
--   3. Nettoyer les doublons éventuels
--   4. Aligner les catégories avec la cascade EntitlementService
-- ==================================

-- =============================================
-- 1. Modules manquants — ajout idempotent
-- =============================================

INSERT INTO modules_catalogue (
    code, nom, nom_en, description, categorie,
    icone, prix_mensuel, prix_annuel,
    est_facturable, est_souscriptible, actif_par_defaut,
    plan_minimal, dependencies, ordre, est_actif, est_systeme,
    "createdAt", "updatedAt"
)
VALUES
    -- Modules CRITIQUES (toujours accessibles, bypass entitlement)
    (
        'auth', 'Authentification', 'Authentication',
        'Gestion de l''authentification, JWT, RBAC, sessions',
        'CRITIQUE', 'Lock', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 1, true, true, NOW(), NOW()
    ),
    (
        'utilisateurs', 'Utilisateurs', 'Users',
        'Gestion des utilisateurs et des rôles établissement',
        'CRITIQUE', 'Users', 0, 0, false, false, true,
        NULL, ARRAY['auth']::text[], 2, true, true, NOW(), NOW()
    ),
    (
        'configuration', 'Configuration', 'Settings',
        'Configuration système, paramètres, apparence',
        'CRITIQUE', 'Settings', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 3, true, true, NOW(), NOW()
    ),
    (
        'notifications', 'Notifications', 'Notifications',
        'Notifications multi-canal : email, SMS, push, in-app',
        'CRITIQUE', 'Bell', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 4, true, true, NOW(), NOW()
    ),

    -- Modules PREMIUM (nécessitent abonnement)
    (
        'eleves', 'Élèves', 'Students',
        'Gestion complète des élèves : inscriptions, dossiers, suivi',
        'PREMIUM', 'GraduationCap', 0, 0, false, false, true,
        'starter', ARRAY[]::text[], 10, true, false, NOW(), NOW()
    ),
    (
        'notes', 'Notes & Évaluations', 'Grades & Assessments',
        'Saisie des notes, évaluations, coefficients, barèmes',
        'PREMIUM', 'Edit', 0, 0, false, false, true,
        'starter', ARRAY['eleves']::text[], 11, true, false, NOW(), NOW()
    ),
    (
        'bulletins', 'Bulletins Scolaires', 'Report Cards',
        'Génération et publication des bulletins scolaires',
        'PREMIUM', 'FileText', 0, 0, false, false, false,
        'starter', ARRAY['notes']::text[], 12, true, false, NOW(), NOW()
    ),
    (
        'messagerie', 'Messagerie', 'Messaging',
        'Messagerie interne : conversations, messages, pièces jointes',
        'PREMIUM', 'MessageSquare', 0, 0, false, false, true,
        'starter', ARRAY['notifications']::text[], 20, true, false, NOW(), NOW()
    ),
    (
        'emploi-du-temps', 'Emploi du Temps', 'Timetable',
        'Planification des cours, créneaux horaires, salles',
        'PREMIUM', 'Calendar', 0, 0, false, false, false,
        'standard', ARRAY['eleves']::text[], 21, true, false, NOW(), NOW()
    ),
    (
        'orientation', 'Orientation Scolaire', 'Guidance',
        'Orientation des élèves : profil, suggestions, RDV',
        'PREMIUM', 'Compass', 0, 0, false, false, false,
        'pro', ARRAY['notes']::text[], 22, true, false, NOW(), NOW()
    ),
    (
        'cms', 'Site Web (CMS)', 'Website (CMS)',
        'Pages publiques white-label : galerie, contact, inscriptions',
        'ADDON', 'Globe', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 50, true, false, NOW(), NOW()
    ),

    -- Modules Logistiques (PREMIUM)
    (
        'cantine', 'Cantine', 'Cafeteria',
        'Menus, inscriptions, solde, consommation',
        'PREMIUM', 'Utensils', 0, 0, false, true, false,
        'standard', ARRAY['eleves']::text[], 30, true, false, NOW(), NOW()
    ),
    (
        'transport', 'Transport Scolaire', 'School Transport',
        'Lignes, inscriptions, présences QR code',
        'PREMIUM', 'Bus', 0, 0, false, true, false,
        'standard', ARRAY['eleves']::text[], 31, true, false, NOW(), NOW()
    ),
    (
        'finances', 'Finances Scolaires', 'School Finances',
        'Frais scolaires, paiements, relances, avoirs',
        'PREMIUM', 'DollarSign', 0, 0, false, true, false,
        'starter', ARRAY['eleves']::text[], 32, true, false, NOW(), NOW()
    ),

    -- Modules Vie Étudiante (PREMIUM/ADDON)
    (
        'clubs', 'Clubs & Activités', 'Clubs & Activities',
        'Inscription aux clubs, limites, approbations',
        'ADDON', 'Heart', 0, 0, false, true, false,
        NULL, ARRAY['eleves']::text[], 40, true, false, NOW(), NOW()
    ),
    (
        'gamification', 'Gamification', 'Gamification',
        'Points, badges, classement, récompenses',
        'ADDON', 'Trophy', 0, 0, false, true, false,
        NULL, ARRAY['eleves']::text[], 41, true, false, NOW(), NOW()
    ),

    -- Nouveaux modules (migration 200)
    (
        'bibliotheque', 'Bibliothèque', 'Library',
        'Gestion de la bibliothèque : ouvrages, prêts, retours, catalogue',
        'ADDON', 'BookOpen', 0, 0, false, true, false,
        NULL, ARRAY['eleves']::text[], 42, true, false, NOW(), NOW()
    ),
    (
        'comptabilite', 'Comptabilité', 'Accounting',
        'Comptabilité générale : journal, grand livre, bilan, comptes',
        'PREMIUM', 'Calculator', 0, 0, false, true, false,
        'pro', ARRAY['finances']::text[], 43, true, false, NOW(), NOW()
    ),

    -- Modules RH (PREMIUM)
    (
        'personnel', 'Personnel RH', 'HR Staff',
        'Gestion du personnel : dossiers, contrats, postes',
        'PREMIUM', 'UserCheck', 0, 0, false, false, false,
        'standard', ARRAY['auth']::text[], 50, true, false, NOW(), NOW()
    ),
    (
        'cartes', 'Cartes & Badges', 'Cards & Badges',
        'Cartes d''identité, badges QR, expiration, renouvellement',
        'ADDON', 'CreditCard', 0, 0, false, true, false,
        NULL, ARRAY['eleves']::text[], 60, true, false, NOW(), NOW()
    ),
    (
        'scoring', 'Scoring & KPI', 'Scoring & KPI',
        'Indicateurs de performance, scoring multi-critères',
        'ADDON', 'BarChart2', 0, 0, false, false, false,
        'pro', ARRAY['notes', 'gamification']::text[], 70, true, false, NOW(), NOW()
    )

ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. Nettoyage des doublons éventuels
-- =============================================

-- Supprimer les entrées en double (garder la plus récente)
DELETE FROM modules_catalogue
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY code ORDER BY "updatedAt" DESC) as rn
        FROM modules_catalogue
    ) t
    WHERE t.rn > 1
);

-- =============================================
-- 3. Index de performance
-- =============================================

-- Index unique sur code (si pas déjà existant)
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_modules_catalogue_code"
    ON modules_catalogue (code);

-- Index pour le filtrage par catégorie
CREATE INDEX IF NOT EXISTS "IDX_modules_catalogue_categorie"
    ON modules_catalogue (categorie)
    WHERE "estActif" = true;

-- Index pour le tri par ordre
CREATE INDEX IF NOT EXISTS "IDX_modules_catalogue_ordre"
    ON modules_catalogue (ordre)
    WHERE "estActif" = true;

-- =============================================
-- 4. Journalisation
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 200 terminée : Unification Entitlement & Modules';
    RAISE NOTICE '  - Modules manquants ajoutés (bibliotheque, comptabilite, etc.)';
    RAISE NOTICE '  - Doublons nettoyés';
    RAISE NOTICE '  - Index de performance créés';
    RAISE NOTICE '  - EntitlementService = source unique de vérité';
    RAISE NOTICE '========================================';
END $$;
