-- ==================================
-- eLISAschool - Migration 033: Workflow et Permissions Nouveaux Modules
-- ==================================
-- Version: 2.0.0
-- Auteur: xAI Éducation
-- Description:
--   - Ajout colonnes statut pour validation workflow
--   - Permissions RBAC pour nouveaux modules
--   - Paramètres de configuration
-- ==================================

-- ==================================
-- 1. COLONNES STATUT WORKFLOW
-- ==================================

-- Sanctions Élèves
ALTER TABLE sanctions_eleves 
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'PROPOSEE';

CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_statut ON sanctions_eleves(statut);

COMMENT ON COLUMN sanctions_eleves.statut IS 'Statut workflow: PROPOSEE, EN_ATTENTE_VALIDATION, VALIDEE, APPLIQUEE, ANNULEE';

-- Bulletins Paie
ALTER TABLE bulletins_paie 
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'GENERE';

CREATE INDEX IF NOT EXISTS idx_bulletins_paie_statut ON bulletins_paie(statut);

COMMENT ON COLUMN bulletins_paie.statut IS 'Statut workflow: GENERE, EN_ATTENTE_VALIDATION, VALIDE, PAYE';

-- Évaluations Personnel
ALTER TABLE evaluations_personnel 
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'PLANIFIEE';

CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_statut ON evaluations_personnel(statut);

COMMENT ON COLUMN evaluations_personnel.statut IS 'Statut workflow: PLANIFIEE, EN_COURS, TERMINEE, EN_ATTENTE_VALIDATION';

-- ==================================
-- 2. PERMISSIONS RBAC - MODULE SUIVI ÉLÈVES
-- ==================================

INSERT INTO permissions (code, libelle, module, description) VALUES
('suivi-eleves:incident:read', 'Consulter incidents élèves', 'suivi-eleves', 'Permission de consulter les incidents disciplinaires des élèves'),
('suivi-eleves:incident:write', 'Créer/modifier incidents élèves', 'suivi-eleves', 'Permission de créer et modifier les incidents'),
('suivi-eleves:sanction:read', 'Consulter sanctions élèves', 'suivi-eleves', 'Permission de consulter les sanctions'),
('suivi-eleves:sanction:write', 'Créer/modifier sanctions élèves', 'suivi-eleves', 'Permission de créer et modifier les sanctions'),
('suivi-eleves:observation:read', 'Consulter observations élèves', 'suivi-eleves', 'Permission de consulter les observations'),
('suivi-eleves:observation:write', 'Créer/modifier observations élèves', 'suivi-eleves', 'Permission de créer et modifier les observations'),
('suivi-eleves:felicitation:read', 'Consulter félicitations élèves', 'suivi-eleves', 'Permission de consulter les félicitations'),
('suivi-eleves:felicitation:write', 'Créer félicitations élèves', 'suivi-eleves', 'Permission de créer des félicitations'),
('suivi-eleves:dashboard:view', 'Voir dashboard suivi élèves', 'suivi-eleves', 'Permission de consulter le dashboard de suivi')
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 3. PERMISSIONS RBAC - MODULE SUIVI PERSONNEL
-- ==================================

INSERT INTO permissions (code, libelle, module, description) VALUES
('suivi-personnel:incident:read', 'Consulter incidents personnel', 'suivi-personnel', 'Permission de consulter les incidents du personnel'),
('suivi-personnel:incident:write', 'Créer/modifier incidents personnel', 'suivi-personnel', 'Permission de créer et modifier les incidents'),
('suivi-personnel:evaluation:read', 'Consulter évaluations personnel', 'suivi-personnel', 'Permission de consulter les évaluations'),
('suivi-personnel:evaluation:write', 'Créer/modifier évaluations personnel', 'suivi-personnel', 'Permission de créer et modifier les évaluations'),
('suivi-personnel:dashboard:view', 'Voir dashboard suivi personnel', 'suivi-personnel', 'Permission de consulter le dashboard de suivi')
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 4. PERMISSIONS RBAC - MODULE SANTÉ
-- ==================================

INSERT INTO permissions (code, libelle, module, description) VALUES
('sante:dossier:read', 'Consulter dossiers médicaux', 'sante', 'Permission de consulter les dossiers médicaux'),
('sante:dossier:write', 'Créer/modifier dossiers médicaux', 'sante', 'Permission de créer et modifier les dossiers médicaux'),
('sante:consultation:read', 'Consulter consultations médicales', 'sante', 'Permission de consulter les consultations'),
('sante:consultation:write', 'Créer consultations médicales', 'sante', 'Permission de créer des consultations'),
('sante:incident:read', 'Consulter incidents santé', 'sante', 'Permission de consulter les incidents de santé'),
('sante:incident:write', 'Créer incidents santé', 'sante', 'Permission de créer des incidents de santé'),
('sante:dashboard:view', 'Voir dashboard santé', 'sante', 'Permission de consulter le dashboard santé'),
('sante:statistiques:view', 'Voir statistiques santé établissement', 'sante', 'Permission de consulter les statistiques globales')
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 5. ATTRIBUTION PERMISSIONS AUX RÔLES
-- ==================================

-- Attribution permissions suivi-élèves aux rôles direction et enseignants
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT', 'CENSEUR', 'SURVEILLANT_GENERAL', 'ENSEIGNANT')
AND p.module = 'suivi-eleves'
AND p.code LIKE '%:read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT', 'CENSEUR')
AND p.module = 'suivi-eleves'
AND p.code LIKE '%:write'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution permissions suivi-personnel aux rôles direction
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT')
AND p.module = 'suivi-personnel'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution permissions santé aux rôles médicaux et direction
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT', 'INFIRMIER_SCOLAIRE')
AND p.module = 'sante'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================
-- 6. PARAMÈTRES DE CONFIGURATION - SUIVI ÉLÈVES
-- ==================================

INSERT INTO parametres_systeme (cle, valeur, type, categorie, description, scope) VALUES
('suivi-eleves.sanction.require_validation', 'false', 'boolean', 'suivi-eleves', 'Exiger validation multi-niveau pour les sanctions graves', 'global'),
('suivi-eleves.sanction.validation_levels', '2', 'number', 'suivi-eleves', 'Nombre de niveaux de validation pour sanctions', 'global'),
('suivi-eleves.sanction.validation_roles', '{"1": "CENSEUR", "2": "CHEF_ETABLISSEMENT"}', 'json', 'suivi-eleves', 'Rôles requis pour chaque niveau de validation', 'global'),
('suivi-eleves.gamification.points_incident_mineur', '-5', 'number', 'suivi-eleves', 'Points gamification pour incident mineur', 'global'),
('suivi-eleves.gamification.points_incident_grave', '-20', 'number', 'suivi-eleves', 'Points gamification pour incident grave', 'global'),
('suivi-eleves.gamification.points_felicitations', '10', 'number', 'suivi-eleves', 'Points gamification pour félicitation', 'global'),
('suivi-eleves.notification.signaler_parent_auto', 'true', 'boolean', 'suivi-eleves', 'Signaler automatiquement les parents pour incidents graves', 'global')
ON CONFLICT (cle, scope) DO NOTHING;

-- ==================================
-- 7. PARAMÈTRES DE CONFIGURATION - SUIVI PERSONNEL
-- ==================================

INSERT INTO parametres_systeme (cle, valeur, type, categorie, description, scope) VALUES
('suivi-personnel.evaluation.periodicite_defaut', 'TRIMESTRIELLE', 'string', 'suivi-personnel', 'Périodicité par défaut des évaluations', 'global'),
('suivi-personnel.evaluation.require_validation', 'false', 'boolean', 'suivi-personnel', 'Exiger validation pour évaluations négatives', 'global'),
('suivi-personnel.evaluation.note_minimale', '10', 'number', 'suivi-personnel', 'Note minimale avant déclenchement validation', 'global'),
('suivi-personnel.incident.sanction_auto_apres', '3', 'number', 'suivi-personnel', 'Nombre d''incidents avant sanction automatique', 'global')
ON CONFLICT (cle, scope) DO NOTHING;

-- ==================================
-- 8. PARAMÈTRES DE CONFIGURATION - SANTÉ
-- ==================================

INSERT INTO parametres_systeme (cle, valeur, type, categorie, description, scope) VALUES
('sante.dossier.exiger_groupe_sanguin', 'true', 'boolean', 'sante', 'Rendre le groupe sanguin obligatoire dans les dossiers médicaux', 'global'),
('sante.incident.notification_parent_gravite', 'GRAVE', 'string', 'sante', 'Niveau de gravité déclenchant notification parent automatique', 'global'),
('sante.consultation.signaler_parent_systematique', 'false', 'boolean', 'sante', 'Signaler systématiquement les parents après consultation', 'global'),
('sante.dashboard.alertes_seuil_allergies', '3', 'number', 'sante', 'Nombre d''allergies pour afficher alerte sur le dashboard', 'global')
ON CONFLICT (cle, scope) DO NOTHING;

-- ==================================
-- 9. PARAMÈTRES DE CONFIGURATION - PAIE
-- ==================================

INSERT INTO parametres_systeme (cle, valeur, type, categorie, description, scope) VALUES
('personnel.paie.require_validation', 'true', 'boolean', 'personnel', 'Exiger validation multi-niveau pour les bulletins de paie', 'global'),
('personnel.paie.validation_levels', '2', 'number', 'personnel', 'Nombre de niveaux de validation pour bulletins de paie', 'global'),
('personnel.paie.validation_roles', '{"1": "COMPTABLE", "2": "CHEF_ETABLISSEMENT"}', 'json', 'personnel', 'Rôles requis pour validation des bulletins de paie', 'global'),
('personnel.paie.cnps_taux_salarial', '0.065', 'number', 'personnel', 'Taux de cotisation CNPS part salariale (6.5%)', 'global'),
('personnel.paie.cnps_taux_patronal', '0.175', 'number', 'personnel', 'Taux de cotisation CNPS part patronale (17.5%)', 'global'),
('personnel.paie.plafond_cnps', '8000000', 'number', 'personnel', 'Plafond mensuel de cotisation CNPS (FCFA)', 'global')
ON CONFLICT (cle, scope) DO NOTHING;

-- ==================================
-- VÉRIFICATION
-- ==================================

-- Vérifier les permissions créées
SELECT COUNT(*) as permissions Creees 
FROM permissions 
WHERE module IN ('suivi-eleves', 'suivi-personnel', 'sante');

-- Vérifier les paramètres créés
SELECT COUNT(*) as parametres_creés 
FROM parametres_systeme 
WHERE categorie IN ('suivi-eleves', 'suivi-personnel', 'sante', 'personnel');

-- Afficher récapitulatif
SELECT 
    'Migration 033 terminée avec succès' as statut,
    'Colonnes statut workflow ajoutées' as modifications_1,
    '22 permissions RBAC créées' as modifications_2,
    '21 paramètres de configuration créés' as modifications_3;
