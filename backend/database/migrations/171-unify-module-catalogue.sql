-- ==================================
-- eLISAschool - Migration 171 — Unification catalogue modules SaaS v7
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-08-10
--
-- Objectif : Ajouter les modules plateforme au catalogue DB et synchroniser les dépendances
--   P2.4 : Ajout des 6 modules plateforme au catalogue
--   P2.5 : Synchronisation des dépendances depuis MODULE_REGISTRY
-- ==================================

-- ==================================
-- P2.4 — Ajout des modules plateforme au catalogue
-- ==================================

-- Insertion des 6 modules plateforme (absents du catalogue initial)
INSERT INTO modules_catalogue (
    code, nom, nom_en, description, categorie, 
    icone, prix_mensuel, prix_annuel, 
    est_facturable, est_souscriptible, actif_par_defaut, 
    plan_minimal, dependencies, ordre, est_actif,
    "createdAt", "updatedAt"
)
VALUES 
    (
        'monitoring', 'Monitoring', 'Monitoring', 
        'Supervision technique : métriques, alertes, health checks, noisy neighbor detection',
        'CRITIQUE', 'Activity', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 100, true, NOW(), NOW()
    ),
    (
        'groupes-etablissements', 'Groupes Établissements', 'School Groups',
        'Gestion des groupes d''établissements pour le multi-tenant',
        'CRITIQUE', 'Network', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 101, true, NOW(), NOW()
    ),
    (
        'facturation', 'Facturation Plateforme', 'Platform Billing',
        'Facturation SaaS : abonnements, paiements, relances, avoirs',
        'CRITIQUE', 'Receipt', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 102, true, NOW(), NOW()
    ),
    (
        'audit', 'Audit et Traçabilité', 'Audit & Logging',
        'Journal d''audit complet : actions utilisateurs, modifications, accès',
        'CRITIQUE', 'FileText', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 103, true, NOW(), NOW()
    ),
    (
        'notifications-config', 'Config Notifications', 'Notification Settings',
        'Configuration des providers de notification (email, SMS, push)',
        'CRITIQUE', 'Bell', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 104, true, NOW(), NOW()
    ),
    (
        'webhooks', 'Webhooks', 'Webhooks',
        'Gestion des webhooks pour intégrations tierces',
        'CRITIQUE', 'Globe', 0, 0, false, false, true,
        NULL, ARRAY[]::text[], 105, true, NOW(), NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- P2.5 — Synchronisation des dépendances depuis MODULE_REGISTRY
-- ==================================

-- Mise à jour des dépendances pour les modules qui en ont
-- (basé sur l'analyse du MODULE_REGISTRY)

-- notes dépend de eleves, periodes
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves', 'periodes']
WHERE code = 'notes' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- bulletins dépend de notes
UPDATE modules_catalogue
SET dependencies = ARRAY['notes']
WHERE code = 'bulletins' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- programmes dépend de periodes
UPDATE modules_catalogue
SET dependencies = ARRAY['periodes']
WHERE code = 'programmes' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- emploi-du-temps dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'emploi-du-temps' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- orientation dépend de notes
UPDATE modules_catalogue
SET dependencies = ARRAY['notes']
WHERE code = 'orientation' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- responsables-eleves dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'responsables-eleves' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- organisation dépend de auth
UPDATE modules_catalogue
SET dependencies = ARRAY['auth']
WHERE code = 'organisation' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- postes dépend de organisation
UPDATE modules_catalogue
SET dependencies = ARRAY['organisation']
WHERE code = 'postes' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- notifications (pas de dépendance)
-- messagerie dépend de notifications
UPDATE modules_catalogue
SET dependencies = ARRAY['notifications']
WHERE code = 'messagerie' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- requetes dépend de notifications
UPDATE modules_catalogue
SET dependencies = ARRAY['notifications']
WHERE code = 'requetes' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- sondages dépend de notifications
UPDATE modules_catalogue
SET dependencies = ARRAY['notifications']
WHERE code = 'sondages' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- annonces dépend de notifications
UPDATE modules_catalogue
SET dependencies = ARRAY['notifications']
WHERE code = 'annonces' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- personnel dépend de auth
UPDATE modules_catalogue
SET dependencies = ARRAY['auth']
WHERE code = 'personnel' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- contrats dépend de personnel
UPDATE modules_catalogue
SET dependencies = ARRAY['personnel']
WHERE code = 'contrats' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- paie dépend de contrats
UPDATE modules_catalogue
SET dependencies = ARRAY['contrats']
WHERE code = 'paie' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- suivi-personnel dépend de personnel
UPDATE modules_catalogue
SET dependencies = ARRAY['personnel']
WHERE code = 'suivi-personnel' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- recrutement dépend de suivi-personnel
UPDATE modules_catalogue
SET dependencies = ARRAY['suivi-personnel']
WHERE code = 'recrutement' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- cantine dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'cantine' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- transport dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'transport' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- parking dépend de auth (P1.3)
-- (déjà fait dans migration 170)

-- finances dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'finances' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- clubs dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'clubs' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- gamification dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'gamification' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- scoring dépend de notes, gamification
UPDATE modules_catalogue
SET dependencies = ARRAY['notes', 'gamification']
WHERE code = 'scoring' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- sante dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'sante' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- cartes dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'cartes' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- impressions dépend de documents
UPDATE modules_catalogue
SET dependencies = ARRAY['documents']
WHERE code = 'impressions' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- suivi-eleves dépend de eleves
UPDATE modules_catalogue
SET dependencies = ARRAY['eleves']
WHERE code = 'suivi-eleves' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- utilisateurs dépend de auth
UPDATE modules_catalogue
SET dependencies = ARRAY['auth']
WHERE code = 'utilisateurs' AND (dependencies IS NULL OR array_length(dependencies, 1) IS NULL);

-- configuration (pas de dépendance)
-- dashboard (pas de dépendance)
-- eleves (pas de dépendance)
-- periodes (pas de dépendance)
-- documents (pas de dépendance)
-- materiel (pas de dépendance)
-- salles (pas de dépendance)
-- options (pas de dépendance)
-- peripheriques (pas de dépendance)

-- ==================================
-- Journalisation
-- ==================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 171 terminée : Unification catalogue modules SaaS v7';
    RAISE NOTICE '  - P2.4 : 6 modules plateforme ajoutés au catalogue';
    RAISE NOTICE '  - P2.5 : Dépendances synchronisées depuis MODULE_REGISTRY';
END $$;
