-- ==================================
-- eLISAschool - Migration Module Annonces v2.0 (CORRIGÉE)
-- ==================================
-- Version: 2.0.1
-- Date: 2026-06-09
-- Description: Paramètres complets avec réinitialisation, audit et configuration
-- ==================================

-- ============================================
-- 1. PARAMÈTRES SYSTÈME COMPLETS
-- ============================================

INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, "etablissementId", "modifiableRuntime", description) VALUES
    -- Configuration de la bande défilante
    ('annonces.vitesseDefilement', '50', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Vitesse de défilement en pixels par seconde (10-200)'),
    ('annonces.hauteurBande', '40', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Hauteur de la bande d''annonces en pixels (20-100)'),
    ('annonces.intervalleActualisation', '30', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Intervalle d''actualisation en secondes (10-300)'),
    ('annonces.pauseSurVol', 'true', 'BOOLEAN', 'MODULE', 'annonces', NULL, true, 'Pause du défilement au survol de la souris'),
    ('annonces.delaiApparition', '600', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Délai d''apparition en millisecondes (0-2000)'),
    ('annonces.delaiReapparition', '600', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Délai de réapparition en millisecondes (0-80000)'),
    ('annonces.arretAutomatique', '0', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Arrêt automatique après X minutes (0 = désactivé)'),
    
    -- Configuration du contenu
    ('annonces.typesContenuAutorises', '["texte", "html"]', 'JSON', 'MODULE', 'annonces', NULL, true, 'Types de contenu autorisés'),
    ('annonces.tailleMaxContenu', '5000', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Taille maximale du contenu en caractères (1000-10000)'),
    
    -- Configuration du module
    ('annonces.actif', 'true', 'BOOLEAN', 'MODULE', 'annonces', NULL, true, 'Module annonces actif ou non'),
    ('annonces.requireValidation', 'false', 'BOOLEAN', 'MODULE', 'annonces', NULL, true, 'Exiger une validation avant publication'),
    ('annonces.validation_levels', '1', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Nombre de niveaux de validation requis'),
    ('annonces.validation_roles', '{"1":"ADMIN"}', 'JSON', 'MODULE', 'annonces', NULL, true, 'Rôles autorisés pour la validation par niveau'),
    
    -- Limites et quotas
    ('annonces.dureeMaxJours', '90', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Durée maximale d''une annonce en jours'),
    ('annonces.nbMaxAnnoncesActives', '50', 'NUMBER', 'MODULE', 'annonces', NULL, true, 'Nombre maximum d''annonces actives simultanées'),
    
    -- Notifications
    ('annonces.notifications.active', 'true', 'BOOLEAN', 'NOTIFICATION', 'annonces', NULL, true, 'Activer les notifications pour les nouvelles annonces'),
    ('annonces.notifications.nouvelleAnnonce', 'true', 'BOOLEAN', 'NOTIFICATION', 'annonces', NULL, true, 'Notifier lors de la création d''une nouvelle annonce'),
    ('annonces.notifications.modificationAnnonce', 'true', 'BOOLEAN', 'NOTIFICATION', 'annonces', NULL, true, 'Notifier lors de la modification d''une annonce'),
    ('annonces.notifications.validationAnnonce', 'true', 'BOOLEAN', 'NOTIFICATION', 'annonces', NULL, true, 'Notifier les validateurs d''une annonce en attente'),
    ('annonces.notifications.expirationAnnonce', 'false', 'BOOLEAN', 'NOTIFICATION', 'annonces', NULL, true, 'Notifier avant l''expiration d''une annonce')
ON CONFLICT (cle, "etablissementId") DO NOTHING;

-- ============================================
-- 2. PERMISSIONS COMPLÉMENTAIRES
-- ============================================

INSERT INTO permissions (code, libelle, description, module, "action") VALUES
    ('annonce:config:update', 'Modifier la configuration', 'Permission de modifier la configuration du module', 'annonces', 'annonce:config:update'),
    ('annonce:config:reset', 'Réinitialiser la configuration', 'Permission de réinitialiser la configuration', 'annonces', 'annonce:config:reset'),
    ('annonce:config:export', 'Exporter la configuration', 'Permission d''exporter la configuration', 'annonces', 'annonce:config:export'),
    ('annonce:config:import', 'Importer la configuration', 'Permission d''importer une configuration', 'annonces', 'annonce:config:import'),
    ('annonce:stats:view', 'Voir les statistiques', 'Permission de voir les statistiques du module', 'annonces', 'annonce:stats:view')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ============================================

-- Super Admin : toutes les permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
  AND p.module = 'annonces'
  AND p.code IN ('annonce:config:update', 'annonce:config:reset', 'annonce:config:export', 'annonce:config:import', 'annonce:stats:view')
ON CONFLICT DO NOTHING;

-- Admin : permissions de gestion
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.module = 'annonces'
  AND p.code IN ('annonce:config:update', 'annonce:config:reset', 'annonce:config:export', 'annonce:config:import', 'annonce:stats:view')
ON CONFLICT DO NOTHING;

-- Chef établissement : stats et config lecture
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.module = 'annonces'
  AND p.code IN ('annonce:config:export', 'annonce:stats:view')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. INDEX SUPPLÉMENTAIRES POUR PERFORMANCE
-- ============================================

-- Index pour les requêtes de statistiques (utiliser deleted_at snake_case)
CREATE INDEX IF NOT EXISTS idx_annonces_created_at_stats 
ON annonces (DATE(created_at)) 
WHERE deleted_at IS NULL;

-- Index pour le ciblage avancé (utiliser snake_case)
CREATE INDEX IF NOT EXISTS idx_annonce_ciblages_type_cible 
ON annonce_ciblages (type_cible, cible_id);

-- Index composite pour les requêtes multi-tenant
CREATE INDEX IF NOT EXISTS idx_annonces_etablissement_statut_date 
ON annonces (etablissement_id, statut, date_debut, date_fin) 
WHERE deleted_at IS NULL;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher le nombre de paramètres créés
SELECT 'Paramètres annonces créés: ' || COUNT(*) as resultat
FROM parametres_systeme
WHERE module = 'annonces';

-- Afficher le nombre de permissions créées
SELECT 'Permissions annonces créées: ' || COUNT(*) as resultat
FROM permissions
WHERE module = 'annonces';
